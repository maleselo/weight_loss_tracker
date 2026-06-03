import datetime as dt
from collections.abc import Sequence

import matplotlib.dates as mdates
from matplotlib.axes import Axes
from matplotlib.ticker import FuncFormatter, MaxNLocator

MONTHS_SHORT_FR = (
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
)


def _format_fr_date(d: dt.date, span_days: int) -> str:
    month = MONTHS_SHORT_FR[d.month - 1]
    if span_days <= 90:
        return f"{d.day} {month}"
    if span_days <= 365:
        return f"{month} {d.year}"
    return str(d.year)


def configure_weight_chart_axis(ax: Axes, dates: Sequence[dt.date]) -> None:
    if not dates:
        return
    span = (max(dates) - min(dates)).days if len(dates) > 1 else 0

    if span <= 14:
        ax.xaxis.set_major_locator(mdates.DayLocator(interval=max(1, span // 6 or 1)))
    elif span <= 90:
        ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=mdates.MO, interval=1))
    elif span <= 365:
        ax.xaxis.set_major_locator(mdates.MonthLocator(interval=max(1, span // 90)))
    else:
        ax.xaxis.set_major_locator(MaxNLocator(nbins=6))

    ax.xaxis.set_major_formatter(
        FuncFormatter(lambda x, _pos: _format_fr_date(mdates.num2date(x).date(), span))
    )
    for label in ax.get_xticklabels():
        label.set_rotation(35)
        label.set_ha("right")
        label.set_fontsize(8)
