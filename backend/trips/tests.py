"""Tests for the HOS planning engine.

Routing/geocoding are external free APIs, so the planner is tested
directly with synthetic legs. Every FMCSA rule the app claims to
enforce is asserted here.
"""

from datetime import datetime, timedelta

from django.test import TestCase

from .services.hos_planner import (
    BREAK_AFTER_DRIVING,
    CYCLE_LIMIT,
    DRIVING,
    DRIVING_WINDOW,
    EPS,
    HOSPlanner,
    Leg,
    MAX_DRIVE_PER_SHIFT,
    OFF,
    ON_DUTY,
    SLEEPER,
)

START = datetime(2026, 6, 15, 8, 0)

LOCS = {
    "current": {"display_name": "Chicago, IL", "lat": 41.88, "lng": -87.63},
    "pickup": {"display_name": "St. Louis, MO", "lat": 38.63, "lng": -90.20},
    "dropoff": {"display_name": "Dallas, TX", "lat": 32.78, "lng": -96.80},
}


def make_legs(miles1, hours1, miles2, hours2):
    geom1 = [[41.88, -87.63], [38.63, -90.20]]
    geom2 = [[38.63, -90.20], [32.78, -96.80]]
    return [
        Leg("Drive to pickup", miles1, hours1, geom1),
        Leg("Drive to drop-off", miles2, hours2, geom2),
    ]


def plan(miles1=250, hours1=4.5, miles2=600, hours2=10.5, cycle=0.0):
    p = HOSPlanner(make_legs(miles1, hours1, miles2, hours2), cycle,
                   start_time=START)
    return p.plan(LOCS)


def shifts(segments):
    """Split segments into shifts separated by >=10h off/sleeper rests."""
    out, cur = [], []
    for s in segments:
        if s["status"] in (OFF, SLEEPER) and s["hours"] >= 10 - EPS:
            if cur:
                out.append(cur)
            cur = []
        else:
            cur.append(s)
    if cur:
        out.append(cur)
    return out


class HOSPlannerRules(TestCase):
    def test_driving_never_exceeds_11h_per_shift(self):
        result = plan(miles2=1800, hours2=30)
        for shift in shifts(result["segments"]):
            drive = sum(s["hours"] for s in shift if s["status"] == DRIVING)
            self.assertLessEqual(drive, MAX_DRIVE_PER_SHIFT + EPS)

    def test_no_driving_after_14h_window(self):
        result = plan(miles2=1800, hours2=30)
        for shift in shifts(result["segments"]):
            if not shift:
                continue
            t0 = datetime.fromisoformat(shift[0]["start"])
            for s in shift:
                if s["status"] == DRIVING:
                    end = datetime.fromisoformat(s["end"])
                    elapsed = (end - t0).total_seconds() / 3600
                    self.assertLessEqual(elapsed, DRIVING_WINDOW + EPS)

    def test_break_after_8h_cumulative_driving(self):
        result = plan(miles2=1800, hours2=30)
        since_break = 0.0
        for s in result["segments"]:
            if s["status"] == DRIVING:
                since_break += s["hours"]
                self.assertLessEqual(since_break, BREAK_AFTER_DRIVING + EPS)
            elif s["status"] in (OFF, SLEEPER) and s["hours"] >= 0.5 - EPS:
                since_break = 0.0

    def test_cycle_limit_triggers_34h_restart(self):
        # 65h already used + long trip → must restart, never exceed 70h
        result = plan(miles2=2400, hours2=42, cycle=65)
        restarts = [s for s in result["plan"]["stops"]
                    if s["kind"] == "restart"] if "plan" in result else []
        restarts = [s for s in result["stops"] if s["kind"] == "restart"]
        self.assertGreaterEqual(len(restarts), 1)
        on_duty = 65.0
        for s in result["segments"]:
            if s["status"] in (DRIVING, ON_DUTY):
                on_duty += s["hours"]
                self.assertLessEqual(on_duty, CYCLE_LIMIT + EPS)
            elif s["status"] == OFF and s["hours"] >= 34 - EPS:
                on_duty = 0.0

    def test_fuel_stop_at_least_every_1000_miles(self):
        result = plan(miles2=2400, hours2=42)
        fuel = [s for s in result["stops"] if s["kind"] == "fuel"]
        self.assertGreaterEqual(len(fuel), 2)
        markers = [0.0] + [s["mile_marker"] for s in fuel] + \
                  [result["total_distance_miles"]]
        for a, b in zip(markers, markers[1:]):
            self.assertLessEqual(b - a, 1000 + 1)

    def test_pickup_and_dropoff_are_1h_on_duty(self):
        result = plan()
        labels = [(s["label"], s["hours"], s["status"])
                  for s in result["segments"] if s["status"] == ON_DUTY]
        pickup = [l for l in labels if "Pickup" in l[0]]
        dropoff = [l for l in labels if "Drop-off" in l[0]]
        self.assertEqual(len(pickup), 1)
        self.assertEqual(len(dropoff), 1)
        self.assertAlmostEqual(pickup[0][1], 1.0, places=3)
        self.assertAlmostEqual(dropoff[0][1], 1.0, places=3)

    def test_short_trip_fits_one_shift(self):
        result = plan(miles1=50, hours1=1, miles2=300, hours2=5.5)
        rests = [s for s in result["segments"]
                 if s["status"] == SLEEPER and s["hours"] >= 10 - EPS]
        self.assertEqual(len(rests), 0)
        self.assertEqual(len(result["daily_logs"]), 1)

    def test_daily_logs_each_total_24h(self):
        result = plan(miles2=1800, hours2=30)
        logs = result["daily_logs"]
        self.assertGreater(len(logs), 1)
        for log in logs[:-1]:  # last day is partial by design
            self.assertAlmostEqual(log["total_hours"], 24.0, delta=0.02)
        for log in logs:
            for g in log["grid"]:
                self.assertGreaterEqual(g["start_hour"], -EPS)
                self.assertLessEqual(g["end_hour"], 24 + EPS)

    def test_timeline_is_continuous(self):
        result = plan(miles2=1800, hours2=30)
        segs = result["segments"]
        for a, b in zip(segs, segs[1:]):
            self.assertEqual(a["end"], b["start"])

    def test_total_driving_matches_route_duration(self):
        result = plan(miles1=250, hours1=4.5, miles2=600, hours2=10.5)
        self.assertAlmostEqual(result["total_driving_hours"], 15.0, delta=0.05)
        self.assertAlmostEqual(result["total_distance_miles"], 850.0, delta=1)


class PlanTripAPITest(TestCase):
    """End-to-end view test with external services mocked."""

    def test_plan_endpoint(self):
        from unittest.mock import patch

        geo = {
            "Chicago, IL": {"display_name": "Chicago, IL", "lat": 41.88, "lng": -87.63},
            "St. Louis, MO": {"display_name": "St. Louis, MO", "lat": 38.63, "lng": -90.20},
            "Los Angeles, CA": {"display_name": "Los Angeles, CA", "lat": 34.05, "lng": -118.24},
        }
        routed = {
            "geometry": [[41.88, -87.63], [38.63, -90.2], [34.05, -118.24]],
            "legs": [
                {"distance_miles": 296, "duration_hours": 4.8,
                 "geometry": [[41.88, -87.63], [38.63, -90.2]]},
                {"distance_miles": 1840, "duration_hours": 27.5,
                 "geometry": [[38.63, -90.2], [34.05, -118.24]]},
            ],
        }
        with patch("trips.views.geocode", side_effect=lambda q: geo[q]), \
             patch("trips.views.route", return_value=routed):
            resp = self.client.post(
                "/api/trips/plan/",
                {
                    "current_location": "Chicago, IL",
                    "pickup_location": "St. Louis, MO",
                    "dropoff_location": "Los Angeles, CA",
                    "current_cycle_used": 22,
                },
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertIn("plan", data)
        self.assertGreaterEqual(len(data["plan"]["daily_logs"]), 3)
        self.assertGreaterEqual(
            len([s for s in data["plan"]["stops"] if s["kind"] == "fuel"]), 2)
        from .models import Trip
        self.assertEqual(Trip.objects.count(), 1)

    def test_validation_error(self):
        resp = self.client.post(
            "/api/trips/plan/",
            {"current_location": "", "pickup_location": "x",
             "dropoff_location": "y", "current_cycle_used": 200},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
