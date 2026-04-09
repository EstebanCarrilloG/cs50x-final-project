"use client";

import { DEFAULT_VISIBLE_POINTS } from "@/lib/mqtt";
import type { Payload } from "@/types/payload";
import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import useMqtt from "../hooks/useMqtt";

const TemperatureChart = dynamic(() => import("./TemperatureChart"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-lg bg-muted/40" />
  ),
});

type SwitchKey = keyof Pick<Payload, "switch1" | "switch2" | "switch3">;

type SwitchConfig = {
  label: string;
  name: SwitchKey;
  descriptionOn: string;
  descriptionOff: string;
};

const SWITCHES: SwitchConfig[] = [
  {
    label: "Light",
    name: "switch1",
    descriptionOn: "Light on",
    descriptionOff: "Light off",
  },
  {
    label: "Fan",
    name: "switch2",
    descriptionOn: "Active",
    descriptionOff: "Deactivated",
  },
  {
    label: "Alarm",
    name: "switch3",
    descriptionOn: "Active protection",
    descriptionOff: "Deactivated",
  },
];

const PROJECT_NAME = "NexIoT";
const PROJECT_DESCRIPTION =
  "Home automation dashboard — control devices and monitor sensors in real time via MQTT.";

type SwitchCardProps = {
  label: string;
  name: SwitchKey;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onChange: (target: SwitchKey, value: boolean) => void;
};

function SwitchCard({
  label,
  name,
  description,
  enabled,
  disabled,
  onChange,
}: SwitchCardProps) {
  return (
    <label
      className={`flex w-full items-center justify-between rounded-xl border bg-card/80 px-4 py-3 shadow-sm transition-colors ${
        disabled ? "opacity-70" : "hover:bg-card"
      }`}
    >
      <span>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </span>

      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange(name, event.target.checked)}
          className="peer sr-only"
          aria-label={label}
          name={name}
          disabled={disabled}
        />
        <span className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-70" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 peer-disabled:bg-zinc-200" />
      </span>
    </label>
  );
}

const Dashboard = () => {
  const { connected, data, temperatureHistory, publish } = useMqtt();

  const visibleTemperatureData = useMemo(
    () => temperatureHistory.slice(-DEFAULT_VISIBLE_POINTS),
    [temperatureHistory],
  );

  const averageTemperature = useMemo(() => {
    if (visibleTemperatureData.length === 0) {
      return 0;
    }

    const total = visibleTemperatureData.reduce(
      (sum, point) => sum + point.value,
      0,
    );
    return total / visibleTemperatureData.length;
  }, [visibleTemperatureData]);

  const temperatureDomain = useMemo<[number, number]>(() => {
    if (visibleTemperatureData.length === 0) {
      return [0, 40];
    }

    const values = visibleTemperatureData.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      const delta = Math.max(1, Math.abs(min) * 0.05);
      return [
        Number((min - delta).toFixed(1)),
        Number((max + delta).toFixed(1)),
      ];
    }

    const padding = Math.max(0.5, (max - min) * 0.2);
    return [
      Number((min - padding).toFixed(1)),
      Number((max + padding).toFixed(1)),
    ];
  }, [visibleTemperatureData]);

  const handleSend = useCallback(
    (target: SwitchKey, value: boolean) => {
      const sent = publish({ ...data, [target]: value });
      if (!sent) {
        console.warn("MQTT is not connected");
      }
    },
    [data, publish],
  );

  return (
    <section className="m-auto w-full max-w-5xl rounded-2xl border bg-background/70 p-5 shadow-sm sm:p-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {PROJECT_NAME}
          </h2>
          <p className="text-sm text-muted-foreground">{PROJECT_DESCRIPTION}</p>
        </div>
        <div className="space-y-1 text-right">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              connected
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
            }`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {SWITCHES.map((item) => (
            <SwitchCard
              key={item.name}
              label={item.label}
              name={item.name}
              description={
                data[item.name] ? item.descriptionOn : item.descriptionOff
              }
              enabled={data[item.name]}
              disabled={!connected}
              onChange={handleSend}
            />
          ))}
        </div>

        <article className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Temperature (°C)
            </h3>
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {`Average: ${averageTemperature.toFixed(1)} °C`}
            </span>
          </div>

          <div className="h-72 w-full">
            <TemperatureChart
              data={visibleTemperatureData}
              domain={temperatureDomain}
            />
          </div>
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
