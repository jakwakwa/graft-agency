import { appendFileSync } from "node:fs";
import { join } from "node:path";
import type { CalBooking, CalBookingAttendee, CalBookingEventType, CalBookingsPagination, JsonObject } from "./types";

export const CAL_SLOTS_API_VERSION = "2024-09-04";
export const CAL_BOOKINGS_API_VERSION = "2026-02-25";
export const CAL_EVENT_TYPES_API_VERSION = "2024-06-14";
export const DEBUG_LOG = join(process.cwd(), ".cursor", "debug-0b2dc2.log");

export const dbg = (loc: string, msg: string, data: object, h: string) => {
  try {
    appendFileSync(
      DEBUG_LOG,
      `${JSON.stringify({ location: loc, message: msg, data, hypothesisId: h, timestamp: Date.now() })}\n`,
    );
  } catch {}
};

export function getOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function getCalApiBase(): string {
  return getOptionalEnv("CAL_API_BASE") ?? "https://api.cal.com/v2";
}

export function getHeaders(version: string): Record<string, string> {
  const apiKey = process.env.CAL_COM_API_KEY;
  const headers: Record<string, string> = {
    "cal-api-version": version,
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getCalendarErrorMessage(body: JsonObject | null, fallback: string): string {
  const message = body?.message;
  if (typeof message === "string") {
    return message;
  }

  const error = body?.error;
  if (typeof error === "string") {
    return error;
  }

  if (isJsonObject(error) && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

export function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function parseBookingAttendee(value: unknown): CalBookingAttendee | null {
  if (!isJsonObject(value)) {
    return null;
  }

  const name = getString(value.name);
  const email = getString(value.email);
  const displayEmail = getString(value.displayEmail);
  const timeZone = getString(value.timeZone);
  const absent = getBoolean(value.absent);

  if (!name || !email || !displayEmail || !timeZone || absent === undefined) {
    return null;
  }

  return {
    name,
    email,
    displayEmail,
    timeZone,
    absent,
    phoneNumber: getString(value.phoneNumber),
  };
}

export function parseBookingEventType(value: unknown): CalBookingEventType | undefined {
  if (!isJsonObject(value)) {
    return undefined;
  }

  const id = getNumber(value.id);
  const slug = getString(value.slug);
  if (id === undefined || !slug) {
    return undefined;
  }

  return { id, slug };
}

export function parseBooking(value: unknown): CalBooking | null {
  if (!isJsonObject(value)) {
    return null;
  }

  const id = getNumber(value.id);
  const uid = getString(value.uid);
  const title = getString(value.title);
  const status = getString(value.status);
  const start = getString(value.start);
  const end = getString(value.end);
  const duration = getNumber(value.duration);

  if (id === undefined || !uid || !title || !status || !start || !end || duration === undefined) {
    return null;
  }

  const attendees = Array.isArray(value.attendees)
    ? value.attendees.map(parseBookingAttendee).filter((attendee): attendee is CalBookingAttendee => attendee !== null)
    : [];

  return {
    id,
    uid,
    title,
    description: getString(value.description),
    status,
    start,
    end,
    duration,
    eventTypeId: getNumber(value.eventTypeId),
    eventType: parseBookingEventType(value.eventType),
    location: getString(value.location),
    createdAt: getString(value.createdAt),
    updatedAt: getString(value.updatedAt),
    attendees,
  };
}

export function parsePagination(value: unknown): CalBookingsPagination {
  const pagination = isJsonObject(value) ? value : {};

  return {
    totalItems: getNumber(pagination.totalItems) ?? 0,
    remainingItems: getNumber(pagination.remainingItems) ?? 0,
    returnedItems: getNumber(pagination.returnedItems) ?? 0,
    itemsPerPage: getNumber(pagination.itemsPerPage) ?? 0,
    currentPage: getNumber(pagination.currentPage) ?? 1,
    totalPages: getNumber(pagination.totalPages) ?? 0,
    hasNextPage: getBoolean(pagination.hasNextPage) ?? false,
    hasPreviousPage: getBoolean(pagination.hasPreviousPage) ?? false,
  };
}

export function appendSearchParam(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value !== undefined) {
    params.set(key, String(value));
  }
}

export async function readJsonObject(response: Response): Promise<{ body: JsonObject | null; textPreview?: string }> {
  const contentType = response.headers?.get("content-type") ?? "application/json";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    return { body: null, textPreview: text.slice(0, 200) };
  }

  try {
    const value: unknown = await response.json();
    return { body: isJsonObject(value) ? value : null };
  } catch {
    const text = await response.text().catch(() => "");
    return { body: null, textPreview: text.slice(0, 200) };
  }
}
