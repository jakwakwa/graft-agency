import { appendFileSync } from "node:fs";
import { join } from "node:path";

const CAL_SLOTS_API_VERSION = "2024-09-04";
const CAL_BOOKINGS_API_VERSION = "2026-02-25";
const CAL_EVENT_TYPES_API_VERSION = "2024-06-14";
const DEBUG_LOG = join(process.cwd(), ".cursor", "debug-0b2dc2.log");
const dbg = (loc: string, msg: string, data: object, h: string) => {
  try {
    appendFileSync(
      DEBUG_LOG,
      `${JSON.stringify({ location: loc, message: msg, data, hypothesisId: h, timestamp: Date.now() })}\n`,
    );
  } catch {}
};

function getOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getCalApiBase(): string {
  return getOptionalEnv("CAL_API_BASE") ?? "https://api.cal.com/v2";
}

function getHeaders(version: string): Record<string, string> {
  const apiKey = process.env.CAL_COM_API_KEY;
  const headers: Record<string, string> = {
    "cal-api-version": version,
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

type JsonObject = Record<string, unknown>;

export type CalBookingStatusFilter = "upcoming" | "recurring" | "past" | "cancelled" | "unconfirmed";
export type CalBookingSortOrder = "asc" | "desc";

export interface CalBookingAttendee {
  name: string;
  email: string;
  displayEmail: string;
  timeZone: string;
  absent: boolean;
  phoneNumber?: string;
}

export interface CalBookingEventType {
  id: number;
  slug: string;
}

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  description?: string;
  status: string;
  start: string;
  end: string;
  duration: number;
  eventTypeId?: number;
  eventType?: CalBookingEventType;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  attendees: CalBookingAttendee[];
}

export interface CalBookingsPagination {
  totalItems: number;
  remainingItems: number;
  returnedItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListBookingsInput {
  status?: CalBookingStatusFilter;
  attendeeEmail?: string;
  attendeeName?: string;
  bookingUid?: string;
  eventTypeIds?: string;
  eventTypeId?: string;
  teamIds?: string;
  teamId?: string;
  afterStart?: string;
  beforeEnd?: string;
  afterCreatedAt?: string;
  beforeCreatedAt?: string;
  afterUpdatedAt?: string;
  beforeUpdatedAt?: string;
  sortStart?: CalBookingSortOrder;
  sortEnd?: CalBookingSortOrder;
  sortCreated?: CalBookingSortOrder;
  sortUpdatedAt?: CalBookingSortOrder;
  take?: number;
  skip?: number;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getCalendarErrorMessage(body: JsonObject | null, fallback: string): string {
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

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function parseBookingAttendee(value: unknown): CalBookingAttendee | null {
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

function parseBookingEventType(value: unknown): CalBookingEventType | undefined {
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

function parseBooking(value: unknown): CalBooking | null {
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

function parsePagination(value: unknown): CalBookingsPagination {
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

function appendSearchParam(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value !== undefined) {
    params.set(key, String(value));
  }
}

async function readJsonObject(response: Response): Promise<{ body: JsonObject | null; textPreview?: string }> {
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

export const calService = {
  async getAvailability(input: {
    username?: string;
    eventTypeSlug?: string;
    eventTypeId?: number;
    dateRange?: { from: string; to: string };
    start?: string;
    end?: string;
    timeZone?: string;
  }) {
    const apiKey = process.env.CAL_COM_API_KEY;
    // #region agent log
    dbg(
      "cal.service:getAvailability",
      "entry",
      {
        apiKeyPresent: !!apiKey,
        username: input.username,
        eventTypeSlug: input.eventTypeSlug,
        eventTypeId: input.eventTypeId,
      },
      "H2",
    );
    // #endregion
    if (!apiKey) {
      return { slots: [], error: "Calendar integration is not configured yet." };
    }

    let start: string;
    let end: string;
    if (input.dateRange) {
      start = input.dateRange.from;
      end = input.dateRange.to;
    } else if (input.start && input.end) {
      start = input.start;
      end = input.end;
    } else {
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      start = now.toISOString();
      end = weekLater.toISOString();
    }

    const params = new URLSearchParams({
      start,
      end,
    });
    if (input.username) params.set("username", input.username);
    if (input.eventTypeSlug) params.set("eventTypeSlug", input.eventTypeSlug);
    if (input.eventTypeId) params.set("eventTypeId", String(input.eventTypeId));

    if (input.timeZone) {
      params.set("timeZone", input.timeZone);
    }

    const response = await fetch(`${getCalApiBase()}/slots?${params.toString()}`, {
      method: "GET",
      headers: getHeaders(getOptionalEnv("CAL_SLOTS_API_VERSION") ?? CAL_SLOTS_API_VERSION),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const errMsg = `Calendar API error: ${response.status} ${text.slice(0, 200)}`;
      // #region agent log
      dbg(
        "cal.service:apiError",
        "Cal.com API error",
        { status: response.status, errorPreview: text.slice(0, 200) },
        "H3",
      );
      // #endregion
      return { slots: [], error: errMsg };
    }

    const { body, textPreview } = await readJsonObject(response);
    if (!body) {
      return { slots: [], error: `Calendar API error: ${response.status} ${textPreview ?? "Invalid JSON response"}` };
    }
    const data = body.data ?? {};
    // v2 returns data as { "date": [slot, ...] } or data.slots as { "date": [slot, ...] }
    const slotsData = isJsonObject(data) ? (data.slots ?? data) : {};
    const slotsObj = typeof slotsData === "object" && !Array.isArray(slotsData) ? slotsData : {};

    const slots = Object.entries(slotsObj).flatMap(([date, times]) => {
      const arr = Array.isArray(times) ? times : [];
      return arr.map((slot: { time?: string; start?: string }) => ({
        date,
        time: typeof slot === "object" ? (slot.time ?? slot.start ?? "") : String(slot),
        duration: 30,
      }));
    });

    // #region agent log
    dbg(
      "cal.service:success",
      "getAvailability success",
      { slotCount: slots.length, rawKeys: Object.keys(slotsObj) },
      "H3",
    );
    // #endregion

    return { slots };
  },

  async reserveSlot(input: {
    eventTypeId: number;
    slotStart: string;
    slotDuration?: number;
    reservationDuration?: number;
  }) {
    const apiKey = process.env.CAL_COM_API_KEY;
    if (!apiKey) {
      return { error: "Calendar integration is not configured yet." };
    }

    const body: Record<string, unknown> = {
      eventTypeId: input.eventTypeId,
      slotStart: input.slotStart,
    };
    if (input.slotDuration) body.slotDuration = input.slotDuration;
    if (input.reservationDuration) body.reservationDuration = input.reservationDuration;

    const response = await fetch(`${getCalApiBase()}/slots/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getHeaders(getOptionalEnv("CAL_SLOTS_API_VERSION") ?? CAL_SLOTS_API_VERSION),
      },
      body: JSON.stringify(body),
    });

    const { body: result, textPreview } = await readJsonObject(response);
    if (!response.ok) {
      const message = getCalendarErrorMessage(
        result,
        `Calendar reservation error: ${response.status} ${textPreview ?? ""}`.trim(),
      );
      return { error: message };
    }
    if (!result) {
      return { error: `Calendar reservation error: ${response.status} ${textPreview ?? "Invalid JSON response"}` };
    }

    return {
      status: "success",
      data: result.data,
    };
  },

  async createBooking(input: {
    username?: string;
    eventTypeSlug?: string;
    eventTypeId?: number;
    start: string;
    name: string;
    email: string;
    timeZone?: string;
    notes?: string;
    leadId?: string;
  }) {
    const apiKey = process.env.CAL_COM_API_KEY;
    if (!apiKey) {
      return { error: "Calendar integration is not configured yet." };
    }

    const timeZone = input.timeZone ?? "Africa/Johannesburg";
    const body: Record<string, unknown> = {
      start: input.start,
      attendee: {
        name: input.name,
        email: input.email,
        timeZone,
      },
      bookingFieldsResponses: {
        notes: input.notes ?? "Booked via Graft AI",
      },
    };
    if (input.eventTypeId) {
      body.eventTypeId = input.eventTypeId;
    } else {
      body.username = input.username;
      body.eventTypeSlug = input.eventTypeSlug;
    }

    if (input.leadId) {
      body.metadata = { leadId: input.leadId };
    }

    const response = await fetch(`${getCalApiBase()}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getHeaders(getOptionalEnv("CAL_BOOKINGS_API_VERSION") ?? CAL_BOOKINGS_API_VERSION),
      },
      body: JSON.stringify(body),
    });

    const { body: result, textPreview } = await readJsonObject(response);
    if (!response.ok) {
      const message = getCalendarErrorMessage(
        result,
        `Calendar booking error: ${response.status} ${textPreview ?? ""}`.trim(),
      );
      return { error: message };
    }
    if (!result) {
      return { error: `Calendar booking error: ${response.status} ${textPreview ?? "Invalid JSON response"}` };
    }

    const data = isJsonObject(result.data) ? result.data : null;
    const uid = data?.uid ?? result.uid ?? result.id;
    return {
      bookingUid: uid,
      confirmationUrl: uid ? `https://cal.com/booking/${uid}` : undefined,
    };
  },

  async listBookings(input: ListBookingsInput) {
    const apiKey = process.env.CAL_COM_API_KEY;
    if (!apiKey) {
      return { error: "Calendar integration is not configured yet." };
    }

    const params = new URLSearchParams();
    appendSearchParam(params, "status", input.status);
    appendSearchParam(params, "attendeeEmail", input.attendeeEmail);
    appendSearchParam(params, "attendeeName", input.attendeeName);
    appendSearchParam(params, "bookingUid", input.bookingUid);
    appendSearchParam(params, "eventTypeIds", input.eventTypeIds);
    appendSearchParam(params, "eventTypeId", input.eventTypeId);
    appendSearchParam(params, "teamIds", input.teamIds);
    appendSearchParam(params, "teamId", input.teamId);
    appendSearchParam(params, "afterStart", input.afterStart);
    appendSearchParam(params, "beforeEnd", input.beforeEnd);
    appendSearchParam(params, "afterCreatedAt", input.afterCreatedAt);
    appendSearchParam(params, "beforeCreatedAt", input.beforeCreatedAt);
    appendSearchParam(params, "afterUpdatedAt", input.afterUpdatedAt);
    appendSearchParam(params, "beforeUpdatedAt", input.beforeUpdatedAt);
    appendSearchParam(params, "sortStart", input.sortStart);
    appendSearchParam(params, "sortEnd", input.sortEnd);
    appendSearchParam(params, "sortCreated", input.sortCreated);
    appendSearchParam(params, "sortUpdatedAt", input.sortUpdatedAt);
    appendSearchParam(params, "take", input.take);
    appendSearchParam(params, "skip", input.skip);

    const query = params.toString();
    const response = await fetch(`${getCalApiBase()}/bookings${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: getHeaders(getOptionalEnv("CAL_BOOKINGS_API_VERSION") ?? CAL_BOOKINGS_API_VERSION),
    });

    const { body: result, textPreview } = await readJsonObject(response);
    if (!response.ok) {
      const message = getCalendarErrorMessage(
        result,
        `Calendar list bookings error: ${response.status} ${textPreview ?? ""}`.trim(),
      );
      return { error: message };
    }
    if (!result) {
      return { error: `Calendar list bookings error: ${response.status} ${textPreview ?? "Invalid JSON response"}` };
    }

    const bookings = Array.isArray(result.data)
      ? result.data.map(parseBooking).filter((booking): booking is CalBooking => booking !== null)
      : [];

    return {
      status: "success",
      data: bookings,
      pagination: parsePagination(result.pagination),
    };
  },

  async getActiveBookingCount(input?: { afterStart?: string }) {
    const afterStart = input?.afterStart ?? new Date().toISOString();
    const result = await calService.listBookings({
      status: "upcoming",
      afterStart,
      take: 1,
      skip: 0,
    });

    if ("error" in result) {
      return {
        count: 0,
        error: result.error,
      };
    }

    return {
      count: result.pagination.totalItems,
    };
  },

  async cancelBooking(input: {
    bookingUid: string;
    cancellationReason?: string;
    cancelSubsequentBookings?: boolean;
    seatUid?: string;
  }) {
    const apiKey = process.env.CAL_COM_API_KEY;
    if (!apiKey) {
      return { error: "Calendar integration is not configured yet." };
    }

    const body: Record<string, unknown> = {};
    if (input.cancellationReason) body.cancellationReason = input.cancellationReason;
    if (input.cancelSubsequentBookings !== undefined) body.cancelSubsequentBookings = input.cancelSubsequentBookings;
    if (input.seatUid) body.seatUid = input.seatUid;

    const response = await fetch(`${getCalApiBase()}/bookings/${encodeURIComponent(input.bookingUid)}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getHeaders(getOptionalEnv("CAL_BOOKINGS_API_VERSION") ?? CAL_BOOKINGS_API_VERSION),
      },
      body: JSON.stringify(body),
    });

    const { body: result, textPreview } = await readJsonObject(response);
    if (!response.ok) {
      const message = getCalendarErrorMessage(
        result,
        `Calendar cancel booking error: ${response.status} ${textPreview ?? ""}`.trim(),
      );
      return { error: message };
    }
    if (!result) {
      return { error: `Calendar cancel booking error: ${response.status} ${textPreview ?? "Invalid JSON response"}` };
    }

    return {
      status: "success",
      data: result.data,
    };
  },

  async getEventTypes() {
    const apiKey = process.env.CAL_COM_API_KEY;
    if (!apiKey) {
      return { error: "Calendar integration is not configured yet." };
    }

    const response = await fetch(`${getCalApiBase()}/event-types`, {
      method: "GET",
      headers: getHeaders(getOptionalEnv("CAL_EVENT_TYPES_API_VERSION") ?? CAL_EVENT_TYPES_API_VERSION),
    });

    const { body: result, textPreview } = await readJsonObject(response);
    if (!response.ok) {
      const message = getCalendarErrorMessage(
        result,
        `Calendar get event types error: ${response.status} ${textPreview ?? ""}`.trim(),
      );
      return { error: message };
    }
    if (!result) {
      return { error: `Calendar get event types error: ${response.status} ${textPreview ?? "Invalid JSON response"}` };
    }

    return {
      status: "success",
      data: result.data,
    };
  },
};
