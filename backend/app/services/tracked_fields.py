"""Préférences utilisateur : champs suivis dans l'interface."""

from app.models.user import User

TRACKING_CATALOG_VERSION = 1

MEASUREMENT_FIELD_NAMES = frozenset(
    {
        "poids_kg",
        "masse_grasse_pct",
        "tour_taille_cm",
        "tension_sys_mmhg",
        "tension_dia_mmhg",
        "fc_repos_bpm",
        "nb_pas",
        "sommeil",
        "stress",
        "energie",
        "faim",
        "entrainement",
        "alcool",
        "cheat_meal",
        "notes",
    }
)

DEFAULT_TRACKED_FIELDS: list[str] = sorted(MEASUREMENT_FIELD_NAMES)


def normalize_tracked_fields(raw: object) -> list[str]:
    if not isinstance(raw, list):
        return []
    return sorted({str(x) for x in raw if str(x) in MEASUREMENT_FIELD_NAMES})


def effective_tracked_fields(user: User) -> list[str]:
    """Champs à afficher / exporter. Vide si onboarding non terminé."""
    if user.catalog_version_seen < 1:
        return []
    fields = normalize_tracked_fields(user.tracked_fields)
    return fields if fields else list(DEFAULT_TRACKED_FIELDS)


def needs_onboarding(user: User) -> bool:
    return user.catalog_version_seen < 1
