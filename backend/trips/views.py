from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Trip
from .serializers import PlanTripRequestSerializer
from .services.geocoding import GeocodingError, geocode
from .services.hos_planner import HOSPlanner, Leg
from .services.routing import RoutingError, route


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class PlanTripView(APIView):
    """POST /api/trips/plan/

    Body: { current_location, pickup_location, dropoff_location,
            current_cycle_used }

    Pipeline: geocode the three locations → route the two legs with
    OSRM → simulate the trip under FMCSA HOS rules → return route
    geometry, stops and per-day ELD log sheets.
    """

    def post(self, request):
        ser = PlanTripRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            locations = {
                "current": geocode(data["current_location"]),
                "pickup": geocode(data["pickup_location"]),
                "dropoff": geocode(data["dropoff_location"]),
            }
        except GeocodingError as exc:
            return Response({"detail": str(exc)},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            routed = route([locations["current"], locations["pickup"],
                            locations["dropoff"]])
        except RoutingError as exc:
            return Response({"detail": str(exc)},
                            status=status.HTTP_502_BAD_GATEWAY)

        legs = [
            Leg("Drive to pickup", l["distance_miles"], l["duration_hours"],
                l["geometry"])
            for l in routed["legs"]
        ]
        legs[1].name = "Drive to drop-off"

        plan = HOSPlanner(legs, data["current_cycle_used"]).plan(locations)

        result = {
            "inputs": {
                "current_location": data["current_location"],
                "pickup_location": data["pickup_location"],
                "dropoff_location": data["dropoff_location"],
                "current_cycle_used": data["current_cycle_used"],
            },
            "locations": locations,
            "route": {
                "geometry": routed["geometry"],
                "legs": [
                    {
                        "name": leg.name,
                        "distance_miles": round(leg.distance_miles, 1),
                        "duration_hours": round(leg.duration_hours, 2),
                    }
                    for leg in legs
                ],
            },
            "plan": plan,
        }

        trip = Trip.objects.create(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_used=data["current_cycle_used"],
            result=result,
        )
        result["trip_id"] = trip.id
        return Response(result, status=status.HTTP_201_CREATED)
