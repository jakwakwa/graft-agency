import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { prospectingScheduledTick } from "@/lib/inngest/functions/prospecting-tick";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [prospectingScheduledTick],
});
