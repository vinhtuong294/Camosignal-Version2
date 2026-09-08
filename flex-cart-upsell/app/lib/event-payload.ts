import type { Placement } from "./recommendation-types";

export interface EventPayload {
  placement?: Placement;
  eventType?: "VIEW" | "CLICK" | "ADD";
  productId?: string;
  sessionKey?: string;
  value?: number;
}

export function parseEventPayloadBody(body: string): EventPayload {
  if (!body.trim()) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    parsed = undefined;
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as EventPayload;
  }

  const params = new URLSearchParams(body);
  const placement = params.get("placement") || undefined;
  const eventType = params.get("eventType") || undefined;
  const productId = params.get("productId") || undefined;
  const sessionKey = params.get("sessionKey") || undefined;
  const value = params.get("value");
  const numericValue = value === null ? undefined : Number(value);

  if (!placement && !eventType && !productId && !sessionKey && value === null) {
    return {};
  }

  return {
    placement: placement as Placement | undefined,
    eventType: eventType as EventPayload["eventType"] | undefined,
    productId,
    sessionKey,
    value:
      numericValue !== undefined && Number.isFinite(numericValue)
        ? numericValue
        : undefined,
  };
}
