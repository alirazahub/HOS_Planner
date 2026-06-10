"""Routing via the public OSRM demo server (free, no API key).

Returns distance, drive time and GeoJSON geometry for each leg.
Coordinates go in as lng,lat (OSRM convention) and come back as
[lat, lng] pairs ready for Leaflet.
"""

from __future__ import annotations

import requests

OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
HEADERS = {"User-Agent": "spotter-hos-assessment/1.0 (trip planner demo)"}

METERS_PER_MILE = 1609.344


class RoutingError(Exception):
    """Raised when a route can't be computed."""


def route(points: list) -> dict:
    """points: [{'lat':…, 'lng':…}, …] (2+ points, one leg per pair).

    Returns {'legs': [{'distance_miles', 'duration_hours', 'geometry'}],
             'geometry': full [lat,lng] polyline}.
    """
    coords = ";".join(f"{p['lng']},{p['lat']}" for p in points)
    try:
        resp = requests.get(
            f"{OSRM_URL}/{coords}",
            params={
                "overview": "full",
                "geometries": "geojson",
                "steps": "false",
                "annotations": "false",
            },
            headers=HEADERS,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise RoutingError(f"Routing service unavailable: {exc}") from exc

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError("No drivable route found between those locations.")

    rt = data["routes"][0]
    full_geometry = [[lat, lng] for lng, lat in rt["geometry"]["coordinates"]]

    # OSRM returns per-leg distance/duration but only a full-route
    # geometry; split the polyline between legs proportionally to length.
    legs_meta = rt["legs"]
    legs = []
    if len(legs_meta) == 1:
        slices = [full_geometry]
    else:
        total = sum(l["distance"] for l in legs_meta) or 1.0
        slices, start = [], 0
        n = len(full_geometry)
        acc = 0.0
        for i, leg in enumerate(legs_meta):
            acc += leg["distance"]
            end = n - 1 if i == len(legs_meta) - 1 else max(start + 1, int(round(acc / total * (n - 1))))
            slices.append(full_geometry[start:end + 1])
            start = end

    for meta, geom in zip(legs_meta, slices):
        legs.append({
            "distance_miles": meta["distance"] / METERS_PER_MILE,
            "duration_hours": meta["duration"] / 3600.0,
            "geometry": geom,
        })

    return {"legs": legs, "geometry": full_geometry}
