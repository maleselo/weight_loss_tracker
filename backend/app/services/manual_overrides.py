"""Champs verrouillés par l'utilisateur (non écrasés par Health Connect)."""

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


def normalize_manual_overrides(raw: object) -> list[str]:
    if not isinstance(raw, list):
        return []
    return sorted({str(x) for x in raw if str(x) in MEASUREMENT_FIELD_NAMES})


def filter_sync_fields(
    fields: dict[str, object],
    manual_overrides: list[str] | None,
) -> tuple[dict[str, object], list[str]]:
    locked = set(normalize_manual_overrides(manual_overrides or []))
    skipped = [k for k in fields if k in locked]
    filtered = {k: v for k, v in fields.items() if k not in locked}
    return filtered, skipped
