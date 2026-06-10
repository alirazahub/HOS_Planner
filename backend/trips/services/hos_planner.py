"""
Hours-of-Service trip planner.

Simulates a property-carrying CMV trip under the FMCSA HOS rules
(49 CFR Part 395) and produces a duty-status timeline, scheduled
stops, and per-day log sheet data.

Rules implemented (70-hour/8-day carrier, no adverse conditions):
  - 11-hour driving limit per shift            (§ 395.3(a)(3))
  - 14-hour driving window per shift           (§ 395.3(a)(2))
  - 30-minute break after 8h cumulative drive  (§ 395.3(a)(3)(ii))
  - 10 consecutive hours off duty between shifts
  - 70-hour/8-day on-duty cycle limit          (§ 395.3(b))
  - 34-hour restart when the cycle is exhausted (§ 395.3(c))

Operational assumptions from the assessment brief:
  - Fuel stop (30 min, on duty) at least every 1,000 miles
  - 1 hour on duty for pickup and 1 hour for drop-off
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional

# ---------------------------------------------------------------- constants

MAX_DRIVE_PER_SHIFT = 11.0      # hours of driving per shift
DRIVING_WINDOW = 14.0           # hours from shift start in which driving may occur
BREAK_AFTER_DRIVING = 8.0       # cumulative driving hours before 30-min break
BREAK_DURATION = 0.5            # 30-minute break
DAILY_REST = 10.0               # consecutive off-duty hours that reset the shift
CYCLE_LIMIT = 70.0              # on-duty hours per 8-day cycle
RESTART_DURATION = 34.0         # 34-hour restart
FUEL_INTERVAL_MILES = 1000.0
FUEL_DURATION = 0.5             # on duty, not driving
PICKUP_DURATION = 1.0           # on duty, not driving
DROPOFF_DURATION = 1.0          # on duty, not driving

EPS = 1e-6

# Duty statuses (match the four rows of the paper log grid)
OFF, SLEEPER, DRIVING, ON_DUTY = "off_duty", "sleeper", "driving", "on_duty"


# ------------------------------------------------------------------- models

@dataclass
class Leg:
    """One routed leg between two known waypoints."""
    name: str                       # e.g. "Deadhead to pickup"
    distance_miles: float
    duration_hours: float           # pure driving time from the router
    geometry: List[List[float]]     # [[lat, lng], ...]

    @property
    def avg_speed(self) -> float:
        if self.duration_hours <= 0:
            return 55.0
        return self.distance_miles / self.duration_hours


@dataclass
class Segment:
    """A continuous block of one duty status on the timeline."""
    status: str
    start: datetime
    end: datetime
    label: str
    location: str = ""
    miles_at_end: float = 0.0       # trip odometer at segment end

    @property
    def hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600.0

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "hours": round(self.hours, 3),
            "label": self.label,
            "location": self.location,
        }


@dataclass
class Stop:
    """A point of interest along the route (rendered on the map)."""
    kind: str                       # start | pickup | dropoff | fuel | break | rest | restart
    label: str
    time: datetime
    duration_hours: float
    mile_marker: float
    lat: Optional[float] = None
    lng: Optional[float] = None
    location: str = ""

    def to_dict(self) -> dict:
        return {
            "kind": self.kind,
            "label": self.label,
            "time": self.time.isoformat(),
            "duration_hours": round(self.duration_hours, 2),
            "mile_marker": round(self.mile_marker, 1),
            "lat": self.lat,
            "lng": self.lng,
            "location": self.location,
        }


# ----------------------------------------------------------------- geometry

def _haversine_miles(a: List[float], b: List[float]) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 3958.8 * 2 * math.asin(math.sqrt(h))


def build_mile_index(legs: List[Leg]) -> List[tuple]:
    """Cumulative (mile, lat, lng) index along the full route geometry,
    scaled so geometry length matches the router's reported distance."""
    index: List[tuple] = []
    offset = 0.0
    for leg in legs:
        pts = leg.geometry or []
        if len(pts) < 2:
            offset += leg.distance_miles
            continue
        raw = [0.0]
        for i in range(1, len(pts)):
            raw.append(raw[-1] + _haversine_miles(pts[i - 1], pts[i]))
        scale = (leg.distance_miles / raw[-1]) if raw[-1] > 0 else 1.0
        for d, p in zip(raw, pts):
            index.append((offset + d * scale, p[0], p[1]))
        offset += leg.distance_miles
    return index


def point_at_mile(index: List[tuple], mile: float) -> tuple:
    """Linear interpolation of a (lat, lng) at a given trip mile."""
    if not index:
        return (None, None)
    if mile <= index[0][0]:
        return (index[0][1], index[0][2])
    if mile >= index[-1][0]:
        return (index[-1][1], index[-1][2])
    lo, hi = 0, len(index) - 1
    while lo + 1 < hi:
        mid = (lo + hi) // 2
        if index[mid][0] <= mile:
            lo = mid
        else:
            hi = mid
    m0, lat0, lng0 = index[lo]
    m1, lat1, lng1 = index[hi]
    f = 0.0 if m1 == m0 else (mile - m0) / (m1 - m0)
    return (lat0 + f * (lat1 - lat0), lng0 + f * (lng1 - lng0))


# ------------------------------------------------------------------ planner

class HOSPlanner:
    def __init__(self, legs: List[Leg], current_cycle_used: float,
                 start_time: Optional[datetime] = None):
        self.legs = legs
        self.start_time = start_time or self._default_start()
        self.t = self.start_time

        # HOS state
        self.cycle_used = max(0.0, float(current_cycle_used))
        self.drive_in_shift = 0.0
        self.drive_since_break = 0.0
        self.shift_start: Optional[datetime] = None

        # odometer state
        self.miles = 0.0
        self.miles_since_fuel = 0.0

        # outputs
        self.segments: List[Segment] = []
        self.stops: List[Stop] = []
        self.mile_index = build_mile_index(legs)

    # -- helpers -------------------------------------------------------

    @staticmethod
    def _default_start() -> datetime:
        now = datetime.now().replace(second=0, microsecond=0)
        return now + timedelta(minutes=(15 - now.minute % 15) % 15)

    def _loc(self, mile: float) -> str:
        lat, lng = point_at_mile(self.mile_index, mile)
        if lat is None:
            return ""
        return f"{lat:.4f}, {lng:.4f}"

    def _push(self, status: str, hours: float, label: str, location: str = ""):
        if hours <= EPS:
            return
        end = self.t + timedelta(hours=hours)
        # merge with previous identical status & label (e.g. drive chunks)
        if self.segments and self.segments[-1].status == status \
                and self.segments[-1].label == label:
            self.segments[-1].end = end
            self.segments[-1].miles_at_end = self.miles
        else:
            self.segments.append(Segment(status, self.t, end, label,
                                         location, self.miles))
        self.t = end

    def _push_stop(self, kind: str, label: str, duration: float, location: str = ""):
        lat, lng = point_at_mile(self.mile_index, self.miles)
        self.stops.append(Stop(kind, label, self.t, duration, self.miles,
                               lat, lng, location or self._loc(self.miles)))

    # -- HOS state transitions ------------------------------------------

    def _ensure_shift(self):
        if self.shift_start is None:
            self.shift_start = self.t

    def _window_left(self) -> float:
        if self.shift_start is None:
            return DRIVING_WINDOW
        elapsed = (self.t - self.shift_start).total_seconds() / 3600.0
        return DRIVING_WINDOW - elapsed

    def _daily_rest(self):
        self._push_stop("rest", "10-hour rest (off duty / sleeper)", DAILY_REST)
        self._push(SLEEPER, DAILY_REST, "10-hr daily rest")
        self.drive_in_shift = 0.0
        self.drive_since_break = 0.0
        self.shift_start = None

    def _restart(self):
        self._push_stop("restart", "34-hour cycle restart", RESTART_DURATION)
        self._push(OFF, RESTART_DURATION, "34-hr cycle restart")
        self.cycle_used = 0.0
        self.drive_in_shift = 0.0
        self.drive_since_break = 0.0
        self.shift_start = None

    def _break_30(self):
        self._push_stop("break", "30-minute rest break", BREAK_DURATION)
        self._push(OFF, BREAK_DURATION, "30-min break")
        self.drive_since_break = 0.0

    def _on_duty_task(self, hours: float, label: str, kind: str, location: str = ""):
        """Pickup / drop-off / fueling: on duty, not driving."""
        if self.cycle_used + hours > CYCLE_LIMIT + EPS:
            self._restart()
        self._ensure_shift()
        self._push_stop(kind, label, hours, location)
        self._push(ON_DUTY, hours, label, location)
        self.cycle_used += hours

    # -- driving loop ----------------------------------------------------

    def _drive_leg(self, leg: Leg, label: str):
        remaining = leg.duration_hours
        speed = leg.avg_speed
        while remaining > EPS:
            self._ensure_shift()

            avail = min(
                MAX_DRIVE_PER_SHIFT - self.drive_in_shift,
                self._window_left(),
                CYCLE_LIMIT - self.cycle_used,
            )
            to_break = BREAK_AFTER_DRIVING - self.drive_since_break
            to_fuel = (FUEL_INTERVAL_MILES - self.miles_since_fuel) / speed

            if avail <= EPS:
                # which limit is binding?
                if CYCLE_LIMIT - self.cycle_used <= EPS:
                    self._restart()
                else:
                    self._daily_rest()
                continue
            if to_break <= EPS:
                self._break_30()
                continue

            chunk = min(remaining, avail, to_break, to_fuel)
            miles = chunk * speed
            self.miles += miles
            self.miles_since_fuel += miles
            self._push(DRIVING, chunk, label)
            self.drive_in_shift += chunk
            self.drive_since_break += chunk
            self.cycle_used += chunk
            remaining -= chunk

            if remaining > EPS and self.miles_since_fuel >= FUEL_INTERVAL_MILES - EPS:
                self._on_duty_task(FUEL_DURATION, "Fuel stop", "fuel")
                self.miles_since_fuel = 0.0

    # -- entry point ------------------------------------------------------

    def plan(self, locations: dict) -> dict:
        """locations: {'current': {...}, 'pickup': {...}, 'dropoff': {...}}
        each with display_name, lat, lng."""
        cur, pick, drop = locations["current"], locations["pickup"], locations["dropoff"]

        self.stops.append(Stop("start", "Trip start (current location)",
                               self.t, 0, 0.0, cur["lat"], cur["lng"],
                               cur["display_name"]))

        if self.legs[0].duration_hours > EPS:
            self._drive_leg(self.legs[0], "Drive to pickup")
        self._on_duty_task(PICKUP_DURATION, "Pickup — loading (1 hr)",
                           "pickup", pick["display_name"])
        self._drive_leg(self.legs[1], "Drive to drop-off")
        self._on_duty_task(DROPOFF_DURATION, "Drop-off — unloading (1 hr)",
                           "dropoff", drop["display_name"])

        # pin exact coordinates for the named stops
        for s in self.stops:
            if s.kind == "pickup":
                s.lat, s.lng = pick["lat"], pick["lng"]
            elif s.kind == "dropoff":
                s.lat, s.lng = drop["lat"], drop["lng"]

        return self._results()

    # -- output -----------------------------------------------------------

    def _results(self) -> dict:
        total_drive = sum(s.hours for s in self.segments if s.status == DRIVING)
        total_on = sum(s.hours for s in self.segments
                       if s.status in (DRIVING, ON_DUTY))
        return {
            "start_time": self.start_time.isoformat(),
            "end_time": self.t.isoformat(),
            "total_distance_miles": round(self.miles, 1),
            "total_duration_hours": round(
                (self.t - self.start_time).total_seconds() / 3600.0, 2),
            "total_driving_hours": round(total_drive, 2),
            "total_on_duty_hours": round(total_on, 2),
            "cycle_used_at_end": round(self.cycle_used, 2),
            "segments": [s.to_dict() for s in self.segments],
            "stops": [s.to_dict() for s in self.stops],
            "daily_logs": build_daily_logs(self.segments, self.start_time),
        }


# --------------------------------------------------------------- log sheets

def build_daily_logs(segments: List[Segment], start_time: datetime) -> List[dict]:
    """Split the duty timeline at midnight boundaries into per-day log
    sheets, including grid segments, status totals, daily miles and
    remarks (one per duty-status change, as on a paper log)."""
    if not segments:
        return []

    days: dict = {}
    miles_at_day_start: dict = {}
    prev_miles = 0.0

    def day_bucket(d: datetime):
        key = d.date()
        if key not in days:
            days[key] = []
            miles_at_day_start[key] = prev_miles
        return days[key]

    for seg in segments:
        cursor, seg_start_miles = seg.start, prev_miles
        seg_total_h = seg.hours
        while cursor < seg.end:
            midnight = datetime.combine(cursor.date(), datetime.min.time()) + timedelta(days=1)
            piece_end = min(seg.end, midnight)
            piece_h = (piece_end - cursor).total_seconds() / 3600.0
            # prorate miles across midnight for driving segments
            if seg.status == DRIVING and seg_total_h > 0:
                frac = ((piece_end - seg.start).total_seconds() / 3600.0) / seg_total_h
                miles_now = seg_start_miles + frac * (seg.miles_at_end - seg_start_miles)
            else:
                miles_now = seg.miles_at_end
            day_bucket(cursor).append({
                "status": seg.status,
                "start_hour": cursor.hour + cursor.minute / 60.0 + cursor.second / 3600.0,
                "end_hour": 24.0 if piece_end == midnight
                            else piece_end.hour + piece_end.minute / 60.0 + piece_end.second / 3600.0,
                "label": seg.label,
                "location": seg.location,
                "hours": round(piece_h, 3),
            })
            prev_miles = miles_now
            cursor = piece_end
        prev_miles = seg.miles_at_end

    logs = []
    sorted_keys = sorted(days.keys())
    end_miles_prev = 0.0
    for i, key in enumerate(sorted_keys):
        grid = days[key]
        totals = {OFF: 0.0, SLEEPER: 0.0, DRIVING: 0.0, ON_DUTY: 0.0}
        for g in grid:
            totals[g["status"]] += g["hours"]
        # pad the first day with off-duty time before trip start
        if i == 0 and grid and grid[0]["start_hour"] > 0:
            lead = grid[0]["start_hour"]
            grid.insert(0, {"status": OFF, "start_hour": 0.0, "end_hour": lead,
                            "label": "Off duty (pre-trip)", "location": "",
                            "hours": round(lead, 3)})
            totals[OFF] += lead
        start_m = miles_at_day_start[key] if i > 0 else 0.0
        next_start = (miles_at_day_start[sorted_keys[i + 1]]
                      if i + 1 < len(sorted_keys) else None)
        day_end_miles = next_start if next_start is not None else max(
            [g_m for g_m in [end_miles_prev]] + [seg.miles_at_end for seg in segments])
        daily_miles = max(0.0, day_end_miles - start_m)
        end_miles_prev = day_end_miles

        remarks = [{"hour": g["start_hour"], "text": g["label"],
                    "location": g["location"]}
                   for g in grid if g["status"] in (ON_DUTY, DRIVING)
                   or "rest" in g["label"].lower() or "break" in g["label"].lower()]

        logs.append({
            "date": key.isoformat(),
            "day_number": i + 1,
            "grid": grid,
            "totals": {k: round(v, 2) for k, v in totals.items()},
            "total_hours": round(sum(totals.values()), 2),
            "miles_today": round(daily_miles, 1),
            "remarks": remarks,
        })
    return logs
