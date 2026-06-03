import datetime as dt
from collections.abc import Callable, Sequence

from app.schemas.dashboard import MetricSummary, SeriesPoint


def _value_at_or_before(
    rows: Sequence[tuple[dt.date, float]],
    target: dt.date,
) -> float | None:
    for d, v in reversed(rows):
        if d <= target:
            return v
    return None


def _comparison_date_for_delta(rows: Sequence[tuple[dt.date, float]], days: int) -> dt.date | None:
    if not rows:
        return None
    latest_date = rows[-1][0]
    target = latest_date - dt.timedelta(days=days)
    candidates = [d for d, _ in rows if d <= target]
    if not candidates:
        return None
    comp_date = max(candidates)
    if comp_date >= latest_date:
        return None
    if (latest_date - comp_date).days < days:
        return None
    return comp_date


def _delta_days(rows: Sequence[tuple[dt.date, float]], days: int) -> float | None:
    if len(rows) < 2:
        return None
    latest_date, latest_value = rows[-1]
    comp_date = _comparison_date_for_delta(rows, days)
    if comp_date is None:
        return None
    comp_value = _value_at_or_before(rows, comp_date)
    if comp_value is None:
        return None
    return round(latest_value - comp_value, 2)


def _moving_average(values: list[float | None], window: int = 7) -> list[float | None]:
    out: list[float | None] = []
    for i in range(len(values)):
        window_vals = [v for v in values[max(0, i - window + 1) : i + 1] if v is not None]
        out.append(sum(window_vals) / len(window_vals) if window_vals else None)
    return out


def _linear_slope_per_day(rows: Sequence[tuple[dt.date, float]], days: int = 14) -> float | None:
    if len(rows) < 2:
        return None
    subset = list(rows)[-days:]
    if len(subset) < 2:
        return None
    x0 = subset[0][0].toordinal()
    xs = [d.toordinal() - x0 for d, _ in subset]
    ys = [v for _, v in subset]
    n = len(xs)
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    denom = sum((x - mean_x) ** 2 for x in xs)
    if denom == 0:
        return None
    slope = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys, strict=True)) / denom
    return round(slope, 4)


def build_metric_summary(
    rows: Sequence[tuple[dt.date, float]],
    reference_date: dt.date,
) -> MetricSummary:
    del reference_date  # deltas basés sur la dernière mesure réelle
    if not rows:
        return MetricSummary()

    latest_value = rows[-1][1]
    values_only = [v for _, v in rows]
    ma7 = _moving_average(values_only)[-1] if len(values_only) >= 2 else None

    return MetricSummary(
        valeur_actuelle=latest_value,
        delta_7j=_delta_days(rows, 7),
        delta_30j=_delta_days(rows, 30),
        tendance_14j_par_jour=_linear_slope_per_day(rows),
        moyenne_mobile_7j=round(ma7, 2) if ma7 is not None else None,
    )


def build_series(
    rows: Sequence[tuple[dt.date, float | None]],
    *,
    include_ma7: bool = True,
) -> list[SeriesPoint]:
    values = [v for _, v in rows]
    ma_list = _moving_average(values) if include_ma7 else [None] * len(values)
    return [
        SeriesPoint(
            date=d,
            valeur=v,
            moyenne_mobile_7j=round(ma, 2) if ma is not None and len(values) >= 2 else None,
        )
        for (d, v), ma in zip(rows, ma_list, strict=True)
    ]


def extract_metric_rows(
    measurements: Sequence,
    getter: Callable,
) -> list[tuple[dt.date, float]]:
    rows: list[tuple[dt.date, float]] = []
    for m in sorted(measurements, key=lambda x: x.date):
        val = getter(m)
        if val is not None:
            rows.append((m.date, float(val)))
    return rows
