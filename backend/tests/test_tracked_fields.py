from app.services.tracked_fields import (
    DEFAULT_TRACKED_FIELDS,
    effective_tracked_fields,
    needs_onboarding,
    normalize_tracked_fields,
)


class _User:
    def __init__(self, tracked_fields=None, catalog_version_seen=0):
        self.tracked_fields = tracked_fields if tracked_fields is not None else []
        self.catalog_version_seen = catalog_version_seen


def test_normalize_tracked_fields_filters_unknown():
    assert normalize_tracked_fields(["poids_kg", "bogus", "nb_pas"]) == ["nb_pas", "poids_kg"]


def test_needs_onboarding_when_catalog_not_seen():
    assert needs_onboarding(_User(catalog_version_seen=0)) is True
    assert needs_onboarding(_User(catalog_version_seen=1)) is False


def test_effective_tracked_fields_empty_before_onboarding():
    assert effective_tracked_fields(_User(tracked_fields=["poids_kg"], catalog_version_seen=0)) == []


def test_effective_tracked_fields_defaults_when_empty_after_onboarding():
    user = _User(tracked_fields=[], catalog_version_seen=1)
    assert effective_tracked_fields(user) == DEFAULT_TRACKED_FIELDS


def test_effective_tracked_fields_respects_user_selection():
    user = _User(tracked_fields=["poids_kg", "nb_pas"], catalog_version_seen=1)
    assert effective_tracked_fields(user) == ["nb_pas", "poids_kg"]
