import { beforeEach, describe, expect, it, vi } from "vitest";
import { calService } from "@/lib/services/cal.service";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("calService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAvailability", () => {
    it("calls Cal.com API with correct date range", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              slots: {
                "2026-03-20": [{ time: "2026-03-20T10:00:00Z" }, { time: "2026-03-20T14:00:00Z" }],
              },
            },
          }),
      });

      await calService.getAvailability({
        dateRange: { from: "2026-03-18", to: "2026-03-22" },
        calComUserId: 123,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("cal.com"),
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("returns formatted slots array", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              slots: {
                "2026-03-20": [{ time: "2026-03-20T10:00:00Z" }],
              },
            },
          }),
      });

      const result = await calService.getAvailability({
        dateRange: { from: "2026-03-18", to: "2026-03-22" },
        calComUserId: 123,
      });

      expect(result).toHaveProperty("slots");
      expect(Array.isArray(result.slots)).toBe(true);
      expect(result.slots.length).toBeGreaterThan(0);
    });

    it("handles API error gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        calService.getAvailability({
          dateRange: { from: "2026-03-18", to: "2026-03-22" },
          calComUserId: 123,
        }),
      ).rejects.toThrow();
    });
  });

  describe("createBooking", () => {
    it("sends booking request with correct payload", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              uid: "booking-abc",
              metadata: { videoCallUrl: null },
            },
          }),
      });

      await calService.createBooking({
        slotStart: "2026-03-20T10:00:00Z",
        slotEnd: "2026-03-20T10:30:00Z",
        name: "Alice Smith",
        email: "alice@example.com",
        eventTypeId: 1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("cal.com"),
        expect.objectContaining({
          method: "POST",
          body: expect.any(String),
        }),
      );
    });

    it("returns bookingUid and confirmationUrl", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              uid: "booking-abc",
              metadata: { videoCallUrl: null },
            },
          }),
      });

      const result = await calService.createBooking({
        slotStart: "2026-03-20T10:00:00Z",
        slotEnd: "2026-03-20T10:30:00Z",
        name: "Alice",
        email: "alice@example.com",
        eventTypeId: 1,
      });

      expect(result).toHaveProperty("bookingUid", "booking-abc");
      expect(result).toHaveProperty("confirmationUrl");
    });

    it("handles booking conflict error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        statusText: "Conflict",
      });

      await expect(
        calService.createBooking({
          slotStart: "2026-03-20T10:00:00Z",
          slotEnd: "2026-03-20T10:30:00Z",
          name: "Alice",
          email: "alice@example.com",
          eventTypeId: 1,
        }),
      ).rejects.toThrow();
    });
  });
});
