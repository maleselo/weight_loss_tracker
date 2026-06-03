import datetime as dt

from app.services.dashboard import build_metric_summary, extract_metric_rows


class _M:
    def __init__(self, date: dt.date, poids_kg: float | None):
        self.date = date
        self.poids_kg = poids_kg


def test_delta_none_with_single_entry():
    today = dt.date(2026, 6, 2)
    rows = extract_metric_rows([_M(today, 80.0)], lambda m: m.poids_kg)
    s = build_metric_summary(rows, today)
    assert s.valeur_actuelle == 80.0
    assert s.delta_7j is None
    assert s.delta_30j is None
    assert s.moyenne_mobile_7j is None


def test_delta_7j_requires_seven_day_gap():
    d0 = dt.date(2026, 5, 1)
    d8 = dt.date(2026, 5, 9)
    rows = extract_metric_rows([_M(d0, 82.0), _M(d8, 80.0)], lambda m: m.poids_kg)
    s = build_metric_summary(rows, d8)
    assert s.delta_7j == -2.0
    assert s.delta_30j is None


def test_moving_average_with_two_points():
    d0 = dt.date(2026, 5, 1)
    d1 = dt.date(2026, 5, 2)
    rows = extract_metric_rows([_M(d0, 80.0), _M(d1, 82.0)], lambda m: m.poids_kg)
    s = build_metric_summary(rows, d1)
    assert s.moyenne_mobile_7j == 81.0
