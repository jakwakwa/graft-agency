import { beforeEach, describe, expect, it, vi } from "vitest";
import { calService } from "@/lib/services/cal";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("calService", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.stubEnv("CAL_COM_API_KEY", "test-api-key");
    vi.stubEnv("CAL_SLOTS_API_VERSION", "2024-09-04");
    vi.stubEnv("CAL_BOOKINGS_API_VERSION", "2026-02-25");
    vi.stubEnv("CAL_EVENT_TYPES_API_VERSION", "2024-06-14");
  });

  describe("getAvailability", () => {
    it("uses the standard Cal.com slots API version key", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: {},
          }),
      });

      await calService.getAvailability({
        username: "testuser",
        eventTypeSlug: "15min",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.cal.com/v2/slots"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "cal-api-version": "2024-09-04",
          }),
        }),
      );
    });

    it("returns error when API key is missing", async () => {
      vi.stubEnv("CAL_COM_API_KEY", "");
      const result = await calService.getAvailability({
        username: "testuser",
        eventTypeSlug: "15min",
      });
      expect(result.error).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("calls Cal.com v2 API with correct params and headers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              "2026-03-20": [{ time: "2026-03-20T10:00:00Z" }, { time: "2026-03-20T14:00:00Z" }],
            },
          }),
      });

      await calService.getAvailability({
        username: "testuser",
        eventTypeSlug: "15min",
        dateRange: { from: "2026-03-18", to: "2026-03-22" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/api\.cal\.com\/v2\/slots\?.*username=testuser.*eventTypeSlug=15min/),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "cal-api-version": "2024-09-04",
          }),
        }),
      );
    });

    it("returns formatted slots array", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              "2026-03-20": [{ time: "2026-03-20T10:00:00Z" }],
            },
          }),
      });

      const result = await calService.getAvailability({
        username: "testuser",
        eventTypeSlug: "15min",
        dateRange: { from: "2026-03-18", to: "2026-03-22" },
      });

      expect(result).toHaveProperty("slots");
      expect(Array.isArray(result.slots)).toBe(true);
      expect(result.slots.length).toBeGreaterThan(0);
      expect(result.slots[0]).toMatchObject({ date: "2026-03-20", time: "2026-03-20T10:00:00Z" });
    });

    it("handles API error gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      const result = await calService.getAvailability({
        username: "testuser",
        eventTypeSlug: "15min",
        dateRange: { from: "2026-03-18", to: "2026-03-22" },
      });

      expect(result.slots).toEqual([]);
      expect(result.error).toContain("500");
    });
  });

  describe("createBooking", () => {
    it("returns error when API key is missing", async () => {
      vi.stubEnv("CAL_COM_API_KEY", "");
      const result = await calService.createBooking({
        username: "testuser",
        eventTypeSlug: "15min",
        start: "2026-03-20T10:00:00Z",
        name: "Alice",
        email: "alice@example.com",
      });
      expect(result.error).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("sends v2 booking request with correct payload and headers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { uid: "booking-abc" },
          }),
      });

      await calService.createBooking({
        username: "testuser",
        eventTypeSlug: "15min",
        start: "2026-03-20T10:00:00Z",
        name: "Alice Smith",
        email: "alice@example.com",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("cal.com/v2/bookings"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-api-key",
            "cal-api-version": "2026-02-25",
          }),
          body: expect.stringContaining("testuser"),
        }),
      );
      const firstCall = mockFetch.mock.calls[0];
      if (!firstCall) {
        throw new Error("Expected fetch to be called");
      }
      const init = firstCall[1] as RequestInit;
      const body = JSON.parse(String(init.body));
      expect(body).toMatchObject({
        username: "testuser",
        eventTypeSlug: "15min",
        start: "2026-03-20T10:00:00Z",
        attendee: {
          name: "Alice Smith",
          email: "alice@example.com",
          timeZone: "Africa/Johannesburg",
        },
      });
    });

    it("returns bookingUid and confirmationUrl", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { uid: "booking-abc" },
          }),
      });

      const result = await calService.createBooking({
        username: "testuser",
        eventTypeSlug: "15min",
        start: "2026-03-20T10:00:00Z",
        name: "Alice",
        email: "alice@example.com",
      });

      expect(result).toHaveProperty("bookingUid", "booking-abc");
      expect(result).toHaveProperty("confirmationUrl");
    });

    it("handles booking conflict error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ message: "Slot no longer available" }),
      });

      const result = await calService.createBooking({
        username: "testuser",
        eventTypeSlug: "15min",
        start: "2026-03-20T10:00:00Z",
        name: "Alice",
        email: "alice@example.com",
      });

      expect(result.error).toBeDefined();
    });
  });

  describe("listBookings", () => {
    it("returns error when API key is missing", async () => {
      vi.stubEnv("CAL_COM_API_KEY", "");

      const result = await calService.listBookings({
        status: "upcoming",
        afterStart: "2026-05-01T00:00:00.000Z",
        beforeEnd: "2026-05-31T23:59:59.999Z",
        take: 25,
        skip: 0,
      });

      expect(result.error).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("sends v2 bookings list request with filters, pagination, sorting and headers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            status: "success",
            data: [],
            pagination: {
              totalItems: 0,
              remainingItems: 0,
              returnedItems: 0,
              itemsPerPage: 25,
              currentPage: 1,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }),
      });

      await calService.listBookings({
        status: "upcoming",
        afterStart: "2026-05-01T00:00:00.000Z",
        beforeEnd: "2026-05-31T23:59:59.999Z",
        sortStart: "asc",
        take: 25,
        skip: 50,
      });

      const firstCall = mockFetch.mock.calls[0];
      if (!firstCall) {
        throw new Error("Expected fetch to be called");
      }

      const url = new URL(String(firstCall[0]));
      expect(url.pathname).toBe("/v2/bookings");
      expect(url.searchParams.get("status")).toBe("upcoming");
      expect(url.searchParams.get("afterStart")).toBe("2026-05-01T00:00:00.000Z");
      expect(url.searchParams.get("beforeEnd")).toBe("2026-05-31T23:59:59.999Z");
      expect(url.searchParams.get("sortStart")).toBe("asc");
      expect(url.searchParams.get("take")).toBe("25");
      expect(url.searchParams.get("skip")).toBe("50");
      expect(firstCall[1]).toEqual(
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "cal-api-version": "2026-02-25",
          }),
        }),
      );
    });

    it("returns bookings data and pagination", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            status: "success",
            data: [
              {
                id: 123,
                uid: "booking-abc",
                title: "Consultation",
                status: "accepted",
                start: "2026-05-12T10:00:00.000Z",
                end: "2026-05-12T10:30:00.000Z",
                duration: 30,
                eventType: { id: 50, slug: "consultation" },
                location: "https://cal.com/video/booking-abc",
                attendees: [
                  {
                    name: "Alice",
                    email: "alice@example.com",
                    displayEmail: "alice@example.com",
                    timeZone: "Africa/Johannesburg",
                    absent: false,
                  },
                ],
              },
            ],
            pagination: {
              totalItems: 1,
              remainingItems: 0,
              returnedItems: 1,
              itemsPerPage: 25,
              currentPage: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }),
      });

      const result = await calService.listBookings({
        status: "upcoming",
        afterStart: "2026-05-01T00:00:00.000Z",
        beforeEnd: "2026-05-31T23:59:59.999Z",
        take: 25,
        skip: 0,
      });

      expect(result).toMatchObject({
        status: "success",
        data: [
          {
            uid: "booking-abc",
            title: "Consultation",
            attendees: [{ email: "alice@example.com" }],
          },
        ],
        pagination: {
          totalItems: 1,
          currentPage: 1,
          totalPages: 1,
        },
      });
    });

    it("returns calendar error message when bookings list fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ message: "Missing BOOKING_READ scope" }),
      });

      const result = await calService.listBookings({
        status: "upcoming",
        afterStart: "2026-05-01T00:00:00.000Z",
        beforeEnd: "2026-05-31T23:59:59.999Z",
        take: 25,
        skip: 0,
      });

      expect(result).toEqual({ error: "Missing BOOKING_READ scope" });
    });
  });

  describe("getActiveBookingCount", () => {
    it("returns error when API key is missing", async () => {
      vi.stubEnv("CAL_COM_API_KEY", "");

      const result = await calService.getActiveBookingCount({
        afterStart: "2026-05-03T16:00:00.000Z",
      });

      expect(result).toEqual({
        count: 0,
        error: "Calendar integration is not configured yet.",
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("requests one future upcoming booking and returns the Cal.com total count", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            status: "success",
            data: [],
            pagination: {
              totalItems: 7,
              remainingItems: 6,
              returnedItems: 1,
              itemsPerPage: 1,
              currentPage: 1,
              totalPages: 7,
              hasNextPage: true,
              hasPreviousPage: false,
            },
          }),
      });

      const result = await calService.getActiveBookingCount({
        afterStart: "2026-05-03T16:00:00.000Z",
      });

      const firstCall = mockFetch.mock.calls[0];
      if (!firstCall) {
        throw new Error("Expected fetch to be called");
      }

      const url = new URL(String(firstCall[0]));
      expect(url.pathname).toBe("/v2/bookings");
      expect(url.searchParams.get("status")).toBe("upcoming");
      expect(url.searchParams.get("afterStart")).toBe("2026-05-03T16:00:00.000Z");
      expect(url.searchParams.get("take")).toBe("1");
      expect(url.searchParams.get("skip")).toBe("0");
      expect(result).toEqual({ count: 7 });
    });
  });

  describe("cancelBooking", () => {
    it("returns error when API key is missing", async () => {
      vi.stubEnv("CAL_COM_API_KEY", "");

      const result = await calService.cancelBooking({
        bookingUid: "booking-abc",
        cancellationReason: "Cancelled from GRAFT Portal",
      });

      expect(result.error).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("sends v2 booking cancel request with reason and headers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            status: "success",
            data: { uid: "booking-abc", status: "cancelled" },
          }),
      });

      await calService.cancelBooking({
        bookingUid: "booking-abc",
        cancellationReason: "Cancelled from GRAFT Portal",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.cal.com/v2/bookings/booking-abc/cancel",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-api-key",
            "cal-api-version": "2026-02-25",
          }),
          body: JSON.stringify({
            cancellationReason: "Cancelled from GRAFT Portal",
          }),
        }),
      );
    });

    it("returns cancelled booking response data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () =>
          Promise.resolve({
            status: "success",
            data: { uid: "booking-abc", status: "cancelled" },
          }),
      });

      const result = await calService.cancelBooking({
        bookingUid: "booking-abc",
        cancellationReason: "Cancelled from GRAFT Portal",
      });

      expect(result).toEqual({
        status: "success",
        data: { uid: "booking-abc", status: "cancelled" },
      });
    });

    it("returns calendar error message when cancellation fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ error: { message: "Booking already cancelled" } }),
      });

      const result = await calService.cancelBooking({
        bookingUid: "booking-abc",
        cancellationReason: "Cancelled from GRAFT Portal",
      });

      expect(result).toEqual({ error: "Booking already cancelled" });
    });

    it("returns fallback error when cancellation response is not JSON", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: () => Promise.resolve("<!DOCTYPE html><html>Server error</html>"),
      });

      const result = await calService.cancelBooking({
        bookingUid: "booking-abc",
        cancellationReason: "Cancelled from GRAFT Portal",
      });

      expect(result).toEqual({
        error: "Calendar cancel booking error: 500 <!DOCTYPE html><html>Server error</html>",
      });
    });
  });

  describe("getEventTypes", () => {
    it("uses the Cal.com event-types API version that returns event types", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "success",
            data: [{ id: 123, slug: "kona-dev" }],
          }),
      });

      await calService.getEventTypes();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.cal.com/v2/event-types",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "cal-api-version": "2024-06-14",
          }),
        }),
      );
    });

    it("returns a calendar error when event types response is not JSON", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: () => Promise.resolve("<!DOCTYPE html><html>Not found</html>"),
      });

      const result = await calService.getEventTypes();

      expect(result).toEqual({
        error: "Calendar get event types error: 404 <!DOCTYPE html><html>Not found</html>",
      });
    });
  });
});
