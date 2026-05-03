import { appendFileSync } from "node:fs";
import { join } from "node:path";

const CAL_API_BASE = process.env.CAL_API_BASE ?? "https://api.cal.com/v2";
const CAL_API_VERSION = process.env.CAL_COM_VERSION ?? "2026-02-25";
const DEBUG_LOG = join(process.cwd(), ".cursor", "debug-0b2dc2.log");
const dbg = (loc: string, msg: string, data: object, h: string) => {
  try {
    appendFileSync(
      DEBUG_LOG,
      `${JSON.stringify({ location: loc, message: msg, data, hypothesisId: h, timestamp: Date.now() })}\n`,
    );
  } catch {}
};

function getHeaders(versionOverride?: string): Record<string, string> {
  const apiKey = process.env.CAL_COM_API_KEY;
  const version = versionOverride ?? process.env.CAL_COM_VERSION ?? CAL_API_VERSION;
  const headers: Record<string, string> = {
    "cal-api-version": version,
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
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
        eventTypeId: input.eventTypeId
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

    const response = await fetch(`${CAL_API_BASE}/slots?${params.toString()}`, {
      method: "GET",
      headers: getHeaders("2024-09-04"),
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

    const body = await response.json();
    const data = body.data ?? {};
    // v2 returns data as { "date": [slot, ...] } or data.slots as { "date": [slot, ...] }
    const slotsData = (typeof data === "object" && !Array.isArray(data) && (data.slots ?? data)) ?? {};
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

    const response = await fetch(`${CAL_API_BASE}/slots/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getHeaders("2024-09-04"),
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result.message ?? result.error ?? `Calendar reservation error: ${response.status}`;
      return { error: message };
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

    const response = await fetch(`${CAL_API_BASE}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getHeaders("2024-09-04"),
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result.message ?? result.error ?? `Calendar booking error: ${response.status}`;
      return { error: message };
    }

    const uid = result.data?.uid ?? result.uid ?? result.id;
    return {
      bookingUid: uid,
      confirmationUrl: uid ? `https://cal.com/booking/${uid}` : undefined,
    };
  },

  async getEventTypes() {
    const apiKey = process.env.CAL_COM_API_KEY;
    if (!apiKey) {
      return { error: "Calendar integration is not configured yet." };
    }

    const response = await fetch(`${CAL_API_BASE}/event-types`, {
      method: "GET",
      headers: getHeaders("2024-09-04"),
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result.message ?? result.error ?? `Calendar get event types error: ${response.status}`;
      return { error: message };
    }

    return {
      status: "success",
      data: result.data,
    };
  },
};
