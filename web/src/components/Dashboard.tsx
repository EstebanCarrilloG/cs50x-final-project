"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useMqtt from "./hooks/useMqtt";

type SwitchCardProps = {
  label: string;
  name: string;
  description: string;
  enabled: boolean;
  onChange: (target: string, value: boolean) => void;
};



function SwitchCard({
  label,
  name,
  description,
  enabled,
  onChange,
}: SwitchCardProps) {
  return (
    <label className="flex w-full items-center justify-between rounded-xl border bg-card/80 px-4 py-3 shadow-sm transition-colors hover:bg-card">
      <span>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </span>

      <span className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) =>
            onChange(event.target.name, event.target.checked)
          }
          className="peer sr-only"
          aria-label={label}
          name={name}
        />
        <span className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

const Dashboard = () => {
  const { data, clientRef } = useMqtt("esp/status");

  const [graphicLength, setGraphicLength] = useState(50);

  const [temperatureData, setTemperatureData] = useState<{ hour: string; value: number }[]>([]);
  function handleSend(target: string, value: boolean) {
    if (!clientRef.current?.connected) {
      console.warn("MQTT no está conectado");
      return;
    }
    clientRef.current.publish(
      "esp/status",
      JSON.stringify({ ...data, [target]: value }),
    );
  }
  useEffect(() => {
    let time = new Date().toLocaleString().split(", ")[1];
    setTemperatureData((prev) => [...prev, { hour: time, value: data.temperature }]);
  }, [data.temperature]);
  return (
    <section className="w-full m-auto max-w-5xl rounded-2xl border bg-background/70 p-5 shadow-sm sm:p-6">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Device control and temperature monitoring.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <SwitchCard
            label="Light"
            name="switch1"
            description={data.switch1 ? "Light on" : "Light off"}
            enabled={data.switch1}
            onChange={handleSend}
          />
          <SwitchCard
            label="Fan"
            name="switch2"
            description={data.switch2 ? "Active" : "On hold"}
            enabled={data.switch2}
            onChange={handleSend}
          />
          <SwitchCard
            label="Alarm"
            name="switch3"
            description={data.switch3 ? "Active protection" : "Deactivated"}
            enabled={data.switch3}
            onChange={handleSend}
          />
        </div>

        <article className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Temperature (°C)
            </h3>
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {`Average: ${(temperatureData.reduce((sum, point) => sum + point.value, 0) / temperatureData.length).toFixed(1) || 0} °C`}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              

              <LineChart
                data={temperatureData.slice(temperatureData.length - graphicLength)}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  domain={[20, 30]}
                />
                <Tooltip
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
          type="monotone"
          dataKey="value"
          stroke="var(--color-chart-1)"
          fill="var(--color-chart-1)"
          activeDot={{
            stroke: 'var(--color-surface-base)',
          }}
        />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
