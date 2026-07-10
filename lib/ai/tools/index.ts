export { createBookAppointmentTool } from "./book-appointment";
export { createCaptureLeadDetailsTool } from "./capture-lead";
export { createCheckAvailabilityTool } from "./check-availability";
export { handoffToHumanTool } from "./handoff-human";
export { createSearchKnowledgeBaseTool } from "./search-knowledge";
export { createReserveSlotTool } from "./reserve-slot";
export { createListEventTypesTool } from "./list-event-types";

import { createBookAppointmentTool } from "./book-appointment";
import { createCaptureLeadDetailsTool } from "./capture-lead";
import { createCheckAvailabilityTool } from "./check-availability";
import { handoffToHumanTool } from "./handoff-human";
import { createSearchKnowledgeBaseTool } from "./search-knowledge";
import { createReserveSlotTool } from "./reserve-slot";

export interface CreateToolsOptions {
  /**
   * Gated by the Booking Integration add-on. When false the bot gets no
   * scheduling tools at all — it is knowledge-only and relies on lead capture
   * / human handoff so the workspace owner can follow up by email.
   */
  bookingEnabled: boolean;
}

export const createTools = (clientId: string, options: CreateToolsOptions) => ({
  captureLeadDetails: createCaptureLeadDetailsTool(clientId),
  searchKnowledgeBase: createSearchKnowledgeBaseTool(clientId),
  handoffToHuman: handoffToHumanTool,
  ...(options.bookingEnabled
    ? {
        checkAvailability: createCheckAvailabilityTool(clientId),
        bookAppointment: createBookAppointmentTool(clientId),
        reserveSlot: createReserveSlotTool(clientId),
      }
    : {}),
});
