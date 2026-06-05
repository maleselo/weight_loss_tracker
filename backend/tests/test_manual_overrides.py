from app.services.manual_overrides import filter_sync_fields, normalize_manual_overrides


def test_normalize_manual_overrides_filters_unknown():
    assert normalize_manual_overrides(["poids_kg", "invalid", "sommeil"]) == ["poids_kg", "sommeil"]


def test_filter_sync_fields_skips_locked():
    fields = {"poids_kg": 80.0, "nb_pas": 5000, "sommeil": 2}
    filtered, skipped = filter_sync_fields(fields, ["poids_kg", "sommeil"])
    assert filtered == {"nb_pas": 5000}
    assert skipped == ["poids_kg", "sommeil"]
