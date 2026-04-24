import { serve } from "inngest/next";
import {
  engagementReconcilerFunction,
  julesBuilderFunction,
  julesPollerFunction,
  leadProfilerFunction,
  offerDispatcherFunction,
  prdWriterFunction,
  prospectingScheduledTick,
  stitchDesignerFunction,
} from "@/lib/inngest";
import { inngest } from "@/lib/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    prospectingScheduledTick,
    leadProfilerFunction,
    prdWriterFunction,
    stitchDesignerFunction,
    julesBuilderFunction,
    julesPollerFunction,
    offerDispatcherFunction,
    engagementReconcilerFunction,
  ],
});
