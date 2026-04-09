export interface Payload {
  switch1: boolean;
  switch2: boolean;
  switch3: boolean;
  temperature: number;
}

export const DEFAULT_PAYLOAD: Payload = {
  switch1: false,
  switch2: false,
  switch3: false,
  temperature: 0,
};

export function isPayload(value: unknown): value is Payload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.switch1 === "boolean" &&
    typeof payload.switch2 === "boolean" &&
    typeof payload.switch3 === "boolean" &&
    typeof payload.temperature === "number" &&
    Number.isFinite(payload.temperature)
  );
}

export function parsePayloadMessage(message: string): Payload | null {
  try {
    const parsed: unknown = JSON.parse(message);
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}