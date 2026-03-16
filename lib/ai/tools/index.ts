export { bookAppointmentTool } from "./book-appointment";
export { captureLeadDetailsTool } from "./capture-lead";
export { checkAvailabilityTool } from "./check-availability";
export { handoffToHumanTool } from "./handoff-human";
export { createSearchKnowledgeBaseTool } from "./search-knowledge";

import { bookAppointmentTool } from "./book-appointment";
import { captureLeadDetailsTool } from "./capture-lead";
import { checkAvailabilityTool } from "./check-availability";
import { handoffToHumanTool } from "./handoff-human";
import { createSearchKnowledgeBaseTool } from "./search-knowledge";

export const createTools = (clientId: string) => ({
  captureLeadDetails: captureLeadDetailsTool,
  checkAvailability: checkAvailabilityTool,
  bookAppointment: bookAppointmentTool,
  searchKnowledgeBase: createSearchKnowledgeBaseTool(clientId),
  handoffToHuman: handoffToHumanTool,
});
