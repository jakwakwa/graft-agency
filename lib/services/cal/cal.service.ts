import type { CalBooking, ListBookingsInput } from "./types";
import {
  appendSearchParam,
  CAL_BOOKINGS_API_VERSION,
  CAL_EVENT_TYPES_API_VERSION,
  CAL_SLOTS_API_VERSION,
  dbg,
  getCalApiBase,
  getCalendarErrorMessage,
  getHeaders,
  getOptionalEnv,
  isJsonObject,
  parseBooking,
  parsePagination,
  readJsonObject,
} from "./utils";

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
