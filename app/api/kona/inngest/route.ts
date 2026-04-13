import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  prospectingScheduledTick,
  leadProfilerFunction,
  prdWriterFunction,
  stitchDesignerFunction,
  julesBuilderFunction,
  offerDispatcherFunction,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    prospectingScheduledTick,
    leadProfilerFunction,
    prdWriterFunction,
    stitchDesignerFunction,
    julesBuilderFunction,
    offerDispatcherFunction,
  ],
});
