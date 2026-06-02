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
    if not rows:
        return MetricSummary()

    latest_date, latest_value = rows[-1]
    _ = latest_date

    val_7 = _value_at_or_before(rows, reference_date - dt.timedelta(days=7))
    val_30 = _value_at_or_before(rows, reference_date - dt.timedelta(days=30))

    values_only = [v for _, v in rows]
    ma7 = _moving_average(values_only)[-1] if values_only else None

    return MetricSummary(
        valeur_actuelle=latest_value,
        delta_7j=round(latest_value - val_7, 2) if val_7 is not None else None,
        delta_30j=round(latest_value - val_30, 2) if val_30 is not None else None,
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
            moyenne_mobile_7j=round(ma, 2) if ma is not None else None,
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
