import { beforeEach, describe, expect, it, vi } from "vitest";
import { calService } from "@/lib/services/cal.service";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("calService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CAL_COM_API_KEY", "test-api-key");
    vi.stubEnv("CAL_COM_VERSION", "2026-02-25");
  });

  describe("getAvailability", () => {
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
            "cal-api-version": "2026-02-25",
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
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
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
});
