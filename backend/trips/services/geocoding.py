"""Geocoding via OpenStreetMap Nominatim (free, no API key).

Nominatim usage policy requires a descriptive User-Agent and at most
1 req/s — fine for an assessment app. Results are cached in-process.
"""

from __future__ import annotations

from functools import lru_cache

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "spotter-hos-assessment/1.0 (trip planner demo)"}


class GeocodingError(Exception):
    """Raised when a location can't be resolved."""


@lru_cache(maxsize=256)
def geocode(query: str) -> dict:
    """Resolve a free-text location to {display_name, lat, lng}."""
    query = (query or "").strip()
    if not query:
        raise GeocodingError("Location is empty.")
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1, "addressdetails": 0},
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json()
    except requests.RequestException as exc:
        raise GeocodingError(f"Geocoding service unavailable: {exc}") from exc

    if not results:
        raise GeocodingError(f'Could not find a location for "{query}".')

    top = results[0]
    return {
        "display_name": top.get("display_name", query),
        "lat": float(top["lat"]),
        "lng": float(top["lon"]),
    }
