# RouteLog — HOS Trip Planner & ELD Log Generator

Full-stack assessment app: enter a trip (current location → pickup → drop-off
+ current cycle hours) and get a routed plan with every stop scheduled under
FMCSA Hours-of-Service rules, plus drawn Driver's Daily Log sheets for each
24-hour period.

**Stack:** Django + DRF · React 18 + Material UI · Leaflet/OpenStreetMap ·
OSRM (routing) · Nominatim (geocoding) — all map services are free, no API keys.

---

## How it works

```
React (MUI)  ──POST /api/trips/plan/──▶  Django REST Framework
                                          ├─ geocoding.py   Nominatim (free)
                                          ├─ routing.py     OSRM public server (free)
                                          └─ hos_planner.py HOS simulation engine
                                               ▼
            route geometry · stops · duty segments · daily log sheets (JSON)
                                               ▼
        Leaflet map · schedule timeline · SVG-drawn FMCSA log grids
```

### The HOS engine (`backend/trips/services/hos_planner.py`)

A minute-accurate event-loop simulation of a property-carrying driver on the
**70 hr / 8 day** cycle. Before each driving chunk it computes the binding
constraint and inserts the right event:

| Rule | Implementation |
|---|---|
| 11-hour driving limit (§395.3(a)(3)) | drive time capped per shift |
| 14-hour driving window (§395.3(a)(2)) | no driving past 14h from shift start |
| 30-min break after 8h driving (§395.3(a)(3)(ii)) | cumulative drive counter |
| 10-hour daily rest | resets shift clocks (logged as sleeper berth) |
| 70-hour/8-day cycle (§395.3(b)) | on-duty accumulator incl. input cycle hours |
| 34-hour restart (§395.3(c)) | inserted when the cycle is exhausted |
| Fuel every 1,000 miles | 30 min on-duty, tracked by odometer |
| Pickup / drop-off | 1 hour on-duty each |

Stops are pinned to coordinates by interpolating the trip odometer along the
OSRM route geometry, so fuel/break/rest markers sit on the actual route.

The duty timeline is then split at midnight boundaries into per-day log
sheets: grid segments, per-status totals (each full day sums to 24.0 h),
daily miles (prorated across midnight for driving segments) and remarks.

**Simplification, stated openly:** the rolling 8-day recap is approximated by
a single accumulator (`current_cycle_used` + on-duty time since start) with a
34-hour restart when 70 h is reached. A full recap would need the prior
7 days' per-day history, which is not part of the input contract.

### Tests

12 unit/integration tests assert every rule above plus log-sheet integrity
and the API contract (external services mocked):

```bash
cd backend && python manage.py test
```

---

## Run locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver        # http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173 (proxies /api → :8000)
```

## Deploy

**Backend → Render** (free tier): `render.yaml` included — or manually:
build `pip install -r requirements.txt && python manage.py migrate`,
start `gunicorn config.wsgi`. Set `DJANGO_DEBUG=false`,
`CORS_ALLOWED_ORIGINS=https://<your-app>.vercel.app`.

**Frontend → Vercel:** root directory `frontend`, framework Vite.
Set `VITE_API_BASE_URL=https://<your-backend>.onrender.com`.

## API

`POST /api/trips/plan/`
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "St. Louis, MO",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 22
}
```
Returns geocoded locations, route geometry + per-leg stats, the full duty
timeline, scheduled stops with coordinates/timestamps/mile markers, and
`daily_logs` ready to render. Trips are persisted (`Trip` model) for history.

## Assumptions (per the brief)

Property-carrying driver · 70 hr/8 day · no adverse driving conditions ·
fuel at least every 1,000 miles · 1 h pickup + 1 h drop-off. Trip starts at
the next quarter-hour from "now" in driver-local time (logs use the home
terminal time convention from the FMCSA guide).
