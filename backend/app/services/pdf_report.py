import datetime as dt
import io
from typing import Sequence

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.daily_measurement import DailyMeasurement
from app.models.user import User
from app.services.chart_dates import configure_weight_chart_axis
from app.services.dashboard import build_metric_summary, extract_metric_rows

MONTHS_FR = (
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
)


def _fmt_date(d: dt.date) -> str:
    return f"{d.day} {MONTHS_FR[d.month - 1]} {d.year}"


def _fmt_num(value: float | int | None, suffix: str = "") -> str:
    if value is None:
        return "—"
    if isinstance(value, float):
        text = f"{value:.1f}".replace(".", ",")
    else:
        text = f"{value:,}".replace(",", " ")
    return f"{text}{suffix}"


def _fmt_delta(value: float | None, suffix: str = "") -> str:
    if value is None:
        return "—"
    sign = "+" if value > 0 else ""
    return f"{sign}{value:.1f}".replace(".", ",") + suffix


def _bool_fr(flag: bool) -> str:
    return "Oui" if flag else "Non"


def _build_weight_chart(
    measurements: Sequence[DailyMeasurement],
    poids_cible: float | None,
) -> io.BytesIO | None:
    dates: list[dt.date] = []
    weights: list[float] = []
    for m in sorted(measurements, key=lambda x: x.date):
        if m.poids_kg is not None:
            dates.append(m.date)
            weights.append(float(m.poids_kg))
    if len(dates) < 1:
        return None

    fig, ax = plt.subplots(figsize=(7.5, 3.2))
    ax.plot(dates, weights, color="#0f766e", linewidth=2, marker="o", markersize=4, label="Poids")
    if poids_cible is not None:
        ax.axhline(poids_cible, color="#d97706", linestyle="--", linewidth=1.5, label="Objectif")
    ax.set_ylabel("kg")
    ax.set_title("Évolution du poids")
    ax.grid(True, alpha=0.3)
    ax.legend(loc="best", fontsize=8)
    configure_weight_chart_axis(ax, dates)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120)
    plt.close(fig)
    buf.seek(0)
    return buf


def build_health_report_pdf(
    *,
    user: User,
    measurements: Sequence[DailyMeasurement],
    start: dt.date,
    end: dt.date,
    include_chart: bool = True,
    include_table: bool = True,
    include_context: bool = True,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleFR",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#134e4a"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleFR",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=12,
    )
    section_style = ParagraphStyle(
        "SectionFR",
        parent=styles["Heading2"],
        fontSize=12,
        textColor=colors.HexColor("#0f766e"),
        spaceBefore=8,
        spaceAfter=6,
    )

    story: list = []
    story.append(Paragraph("Rapport santé — suivi personnel", title_style))
    story.append(
        Paragraph(
            f"Période du <b>{_fmt_date(start)}</b> au <b>{_fmt_date(end)}</b><br/>"
            f"Document généré le {_fmt_date(dt.date.today())} — à usage de suivi, sans valeur diagnostique.",
            subtitle_style,
        )
    )

    poids_rows = extract_metric_rows(measurements, lambda m: m.poids_kg)
    ref_date = end
    if poids_rows:
        last_in_period = [r for r in poids_rows if r[0] <= end]
        if last_in_period:
            ref_date = last_in_period[-1][0]
    poids_summary = build_metric_summary(poids_rows, ref_date)
    poids_cible = float(user.poids_cible_kg) if user.poids_cible_kg is not None else None

    story.append(Paragraph("Synthèse poids", section_style))
    summary_data = [
        ["Indicateur", "Valeur"],
        ["Poids (dernière mesure)", _fmt_num(poids_summary.valeur_actuelle, " kg")],
        ["Objectif", _fmt_num(poids_cible, " kg") if poids_cible else "—"],
        ["Moyenne mobile 7 j", _fmt_num(poids_summary.moyenne_mobile_7j, " kg")],
        ["Variation 7 j", _fmt_delta(poids_summary.delta_7j, " kg")],
        ["Variation 30 j", _fmt_delta(poids_summary.delta_30j, " kg")],
        ["Tendance 14 j", _fmt_delta(poids_summary.tendance_14j_par_jour, " kg/j")],
    ]
    summary_table = Table(summary_data, colWidths=[8 * cm, 8 * cm])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0fdfa")]),
            ]
        )
    )
    story.append(summary_table)
    story.append(Spacer(1, 0.4 * cm))

    if include_chart:
        chart_buf = _build_weight_chart(measurements, poids_cible)
        if chart_buf:
            story.append(Paragraph("Graphique", section_style))
            story.append(Image(chart_buf, width=16 * cm, height=6.5 * cm))
            story.append(Spacer(1, 0.3 * cm))

    if include_table:
        story.append(Paragraph("Détail journalier", section_style))
        table_header = [
            "Date",
            "Poids",
            "% MG",
            "Tension",
            "Pas",
            "Somm.",
            "Stress",
            "Énergie",
            "Faim",
        ]
        table_rows = [table_header]
        for m in sorted(measurements, key=lambda x: x.date):
            tension = (
                f"{m.tension_sys_mmhg}/{m.tension_dia_mmhg}"
                if m.tension_sys_mmhg is not None and m.tension_dia_mmhg is not None
                else "—"
            )
            table_rows.append(
                [
                    m.date.strftime("%d/%m/%Y"),
                    _fmt_num(float(m.poids_kg) if m.poids_kg is not None else None, " kg"),
                    _fmt_num(float(m.masse_grasse_pct) if m.masse_grasse_pct is not None else None, " %"),
                    tension,
                    _fmt_num(m.nb_pas),
                    _fmt_num(m.sommeil),
                    _fmt_num(m.stress),
                    _fmt_num(m.energie),
                    _fmt_num(m.faim),
                ]
            )

        col_widths = [2.2 * cm, 1.5 * cm, 1.3 * cm, 2 * cm, 1.5 * cm, 1.1 * cm, 1.1 * cm, 1.1 * cm, 1.1 * cm]
        data_table = Table(table_rows, colWidths=col_widths, repeatRows=1)
        data_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ]
            )
        )
        story.append(data_table)

    if include_context:
        story.append(Spacer(1, 0.4 * cm))
        story.append(Paragraph("Contexte & notes", section_style))
        context_rows = [["Date", "Entraînement", "Alcool", "Cheat Meal", "Notes"]]
        for m in sorted(measurements, key=lambda x: x.date):
            notes = (m.notes or "").replace("\n", " ").strip()
            if len(notes) > 60:
                notes = notes[:57] + "…"
            context_rows.append(
                [
                    m.date.strftime("%d/%m/%Y"),
                    _bool_fr(m.entrainement),
                    _bool_fr(m.alcool),
                    _bool_fr(m.cheat_meal),
                    notes or "—",
                ]
            )
        context_table = Table(
            context_rows,
            colWidths=[2.2 * cm, 2.5 * cm, 2 * cm, 2.5 * cm, 6.3 * cm],
            repeatRows=1,
        )
        context_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#475569")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(context_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
