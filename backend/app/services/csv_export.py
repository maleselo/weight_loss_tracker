import csv
import io
from typing import Sequence

from app.models.daily_measurement import DailyMeasurement

HEADERS = [
    "Date",
    "Poids (kg)",
    "Masse grasse (%)",
    "Tour de taille (cm)",
    "Tension SYS (mmHg)",
    "Tension DIA (mmHg)",
    "FC repos (bpm)",
    "Nombre de pas",
    "Sommeil (1-3)",
    "Stress (1-3)",
    "Énergie (1-3)",
    "Faim (1-3)",
    "Entraînement",
    "Alcool",
    "Cheat meal",
    "Notes",
]


def _cell(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Oui" if value else "Non"
    if isinstance(value, float):
        return f"{value:.2f}".replace(".", ",")
    return str(value)


def build_measurements_csv(measurements: Sequence[DailyMeasurement]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";", lineterminator="\n")
    writer.writerow(HEADERS)
    for m in sorted(measurements, key=lambda x: x.date):
        writer.writerow(
            [
                m.date.strftime("%d/%m/%Y"),
                _cell(m.poids_kg),
                _cell(m.masse_grasse_pct),
                _cell(m.tour_taille_cm),
                _cell(m.tension_sys_mmhg),
                _cell(m.tension_dia_mmhg),
                _cell(m.fc_repos_bpm),
                _cell(m.nb_pas),
                _cell(m.sommeil),
                _cell(m.stress),
                _cell(m.energie),
                _cell(m.faim),
                _cell(m.entrainement),
                _cell(m.alcool),
                _cell(m.cheat_meal),
                (m.notes or "").replace("\n", " ").strip(),
            ]
        )
    return buf.getvalue().encode("utf-8-sig")
