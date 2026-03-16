const CAL_API_BASE = "https://api.cal.com/v2";

export const calService = {
  async getAvailability(input: {
    dateRange?: { from: string; to: string };
    calComUserId?: number;
    eventTypeId?: number;
  }) {
    const params = new URLSearchParams();
    if (input.dateRange) {
      params.set("startTime", input.dateRange.from);
      params.set("endTime", input.dateRange.to);
    }
    if (input.calComUserId) {
      params.set("userId", String(input.calComUserId));
    }

    const response = await fetch(`${CAL_API_BASE}/slots/available?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CAL_COM_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Cal.com API error: ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    const slotsData = body.data?.slots ?? {};

    const slots = Object.entries(slotsData).flatMap(([date, times]) =>
      (times as Array<{ time: string }>).map((slot) => ({
        date,
        time: slot.time,
        duration: 30,
      })),
    );

    return { slots };
  },

  async createBooking(input: {
    slotStart: string;
    slotEnd: string;
    name: string;
    email: string;
    eventTypeId?: number;
    notes?: string;
    leadId?: string;
  }) {
    const response = await fetch(`${CAL_API_BASE}/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CAL_COM_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: input.slotStart,
        end: input.slotEnd,
        name: input.name,
        email: input.email,
        eventTypeId: input.eventTypeId,
        notes: input.notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cal.com booking error: ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    return {
      bookingUid: body.data.uid,
      confirmationUrl: `https://cal.com/booking/${body.data.uid}`,
    };
  },
};
