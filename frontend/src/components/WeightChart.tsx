import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "../types";
import { formatDateFR } from "../lib/dates";
import {
  chartSpanDays,
  formatChartAxisLabel,
  pickChartTickIndices,
} from "../lib/chartAxis";

interface Props {
  points: SeriesPoint[];
  poidsCible?: number | null;
  unit?: string;
}

export function WeightChart({ points, poidsCible, unit = " kg" }: Props) {
  const axis = useMemo(() => {
    const dates = points.map((p) => p.date);
    const span = chartSpanDays(dates);
    const tickIndices = pickChartTickIndices(points.length, span);
    const ticks = tickIndices.map((i) => points[i].date);
    return { span, ticks };
  }, [points]);

  if (points.length === 0) {
    return <p className="empty">Pas encore de données pour afficher une courbe.</p>;
  }

  const values = points.map((p) => p.valeur).filter((v): v is number => v != null);
  const yMin = Math.min(...values, ...(poidsCible != null ? [poidsCible] : []));
  const yMax = Math.max(...values, ...(poidsCible != null ? [poidsCible] : []));
  const padding = (yMax - yMin) * 0.08 || 1;

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            ticks={axis.ticks}
            tick={{ fontSize: 10 }}
            tickFormatter={(iso: string) => formatChartAxisLabel(iso, axis.span)}
            interval={0}
            minTickGap={28}
            height={48}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            domain={[yMin - padding, yMax + padding]}
            tickFormatter={(v) => `${v}`.replace(".", ",")}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              value != null ? `${value}${unit}` : "—",
              name === "valeur" ? "Mesure" : "Moyenne 7 j",
            ]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.date ? formatDateFR(payload[0].payload.date) : ""
            }
          />
          <Legend />
          {poidsCible != null && (
            <ReferenceLine
              y={poidsCible}
              stroke="#d97706"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: `Objectif ${poidsCible.toLocaleString("fr-FR")} kg`,
                position: "insideTopRight",
                fill: "#d97706",
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="valeur"
            name="Mesure"
            stroke="#0f766e"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="moyenne_mobile_7j"
            name="Moyenne 7 j"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
