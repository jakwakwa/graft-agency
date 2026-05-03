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
import { createListEventTypesTool } from "./list-event-types";

export const createTools = (clientId: string) => ({
  captureLeadDetails: createCaptureLeadDetailsTool(clientId),
  checkAvailability: createCheckAvailabilityTool(clientId),
  bookAppointment: createBookAppointmentTool(clientId),
  reserveSlot: createReserveSlotTool(clientId),
  listEventTypes: createListEventTypesTool(clientId),
  searchKnowledgeBase: createSearchKnowledgeBaseTool(clientId),
  handoffToHuman: handoffToHumanTool,
});
