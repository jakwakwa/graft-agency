export { createBookAppointmentTool } from "./book-appointment";
export { captureLeadDetailsTool } from "./capture-lead";
export { createCheckAvailabilityTool } from "./check-availability";
export { handoffToHumanTool } from "./handoff-human";
export { createSearchKnowledgeBaseTool } from "./search-knowledge";

import { createBookAppointmentTool } from "./book-appointment";
import { captureLeadDetailsTool } from "./capture-lead";
import { createCheckAvailabilityTool } from "./check-availability";
import { handoffToHumanTool } from "./handoff-human";
import { createSearchKnowledgeBaseTool } from "./search-knowledge";

export const createTools = (clientId: string) => ({
  captureLeadDetails: captureLeadDetailsTool,
  checkAvailability: createCheckAvailabilityTool(clientId),
  bookAppointment: createBookAppointmentTool(clientId),
  searchKnowledgeBase: createSearchKnowledgeBaseTool(clientId),
  handoffToHuman: handoffToHumanTool,
});
