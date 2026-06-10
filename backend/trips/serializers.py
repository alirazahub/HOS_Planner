from rest_framework import serializers

from .models import Trip


class PlanTripRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)

    def validate(self, attrs):
        for f in ("current_location", "pickup_location", "dropoff_location"):
            attrs[f] = attrs[f].strip()
            if not attrs[f]:
                raise serializers.ValidationError({f: "This field may not be blank."})
        return attrs


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "created_at",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "result",
        ]
