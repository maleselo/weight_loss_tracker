import csv
import io
from typing import Sequence

from app.models.daily_measurement import DailyMeasurement

COLUMN_DEFS: list[tuple[str, str, str]] = [
    ("poids_kg", "Poids (kg)", "poids_kg"),
    ("masse_grasse_pct", "Masse grasse (%)", "masse_grasse_pct"),
    ("tour_taille_cm", "Tour de taille (cm)", "tour_taille_cm"),
    ("tension_sys_mmhg", "Tension SYS (mmHg)", "tension_sys_mmhg"),
    ("tension_dia_mmhg", "Tension DIA (mmHg)", "tension_dia_mmhg"),
    ("fc_repos_bpm", "FC repos (bpm)", "fc_repos_bpm"),
    ("nb_pas", "Nombre de pas", "nb_pas"),
    ("sommeil", "Sommeil (1-3)", "sommeil"),
    ("stress", "Stress (1-3)", "stress"),
    ("energie", "Énergie (1-3)", "energie"),
    ("faim", "Faim (1-3)", "faim"),
    ("entrainement", "Entraînement", "entrainement"),
    ("alcool", "Alcool", "alcool"),
    ("cheat_meal", "Repas plaisir", "cheat_meal"),
    ("notes", "Notes", "notes"),
]


def _cell(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Oui" if value else "Non"
    if isinstance(value, float):
        return f"{value:.2f}".replace(".", ",")
    return str(value)


def build_measurements_csv(
    measurements: Sequence[DailyMeasurement],
    tracked_fields: Sequence[str] | None = None,
) -> bytes:
    active = {f for f in (tracked_fields or [])}
    cols = [c for c in COLUMN_DEFS if not active or c[0] in active]

    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";", lineterminator="\n")
    writer.writerow(["Date"] + [c[1] for c in cols])
    for m in sorted(measurements, key=lambda x: x.date):
        row = [m.date.strftime("%d/%m/%Y")]
        for _, _, attr in cols:
            if attr == "notes":
                row.append((m.notes or "").replace("\n", " ").strip())
            else:
                row.append(_cell(getattr(m, attr)))
        writer.writerow(row)
    return buf.getvalue().encode("utf-8-sig")
