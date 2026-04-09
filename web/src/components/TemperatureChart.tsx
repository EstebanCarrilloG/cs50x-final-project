"use client";

import type { TemperaturePoint } from "../hooks/useMqtt";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TemperatureChartProps = {
  data: TemperaturePoint[];
  domain: [number, number];
};

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString("en-GB", { hour12: false });
}

function TemperatureChart({ data, domain }: TemperatureChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(value) =>
            typeof value === "number" ? formatTime(value) : ""
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          domain={domain}
        />
        <Tooltip
          labelFormatter={(value) =>
            typeof value === "number" ? formatTime(value) : value
          }
          formatter={(value) => {
            if (typeof value === "number") {
              return [`${value.toFixed(1)} °C`, "Temperature"];
            }

            return [`${value} °C`, "Temperature"];
          }}
          contentStyle={{
            borderRadius: "0.75rem",
            borderColor: "var(--color-border)",
          }}
        />
        <Line
          type="linear"
          dataKey="value"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          dot={false}
          activeDot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default TemperatureChart;
