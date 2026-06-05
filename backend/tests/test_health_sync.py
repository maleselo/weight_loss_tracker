import datetime as dt

from pydantic import ValidationError

from app.schemas.health_sync import HealthSyncIn, parse_health_sync_payload


def test_health_sync_partial_fields():
    payload = HealthSyncIn.model_validate(
        {"date": "2026-06-03", "weight": 80.0, "step_count": 5000},
    )
    fields = payload.to_measurement_fields()
    assert fields == {"poids_kg": 80.0, "nb_pas": 5000}


def test_health_sync_tension_invalid():
    try:
        HealthSyncIn.model_validate(
            {
                "date": "2026-06-03",
                "blood_pressure_sys": 120,
                "blood_pressure_dia": 130,
            },
        )
        raise AssertionError("expected ValidationError")
    except ValidationError:
        pass


def test_parse_rejects_non_object():
    try:
        parse_health_sync_payload([])
        raise AssertionError("expected ValueError")
    except ValueError as e:
        assert "objet JSON" in str(e)


def test_boolean_fields_included_when_false():
    payload = HealthSyncIn.model_validate(
        {"date": "2026-06-03", "workout": False, "alcohol": False},
    )
    fields = payload.to_measurement_fields()
    assert fields["entrainement"] is False
    assert fields["alcool"] is False
