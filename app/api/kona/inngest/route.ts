import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  prospectingScheduledTick,
  leadProfilerFunction,
  prdWriterFunction,
  stitchDesignerFunction,
  julesBuilderFunction,
  julesPollerFunction,
  offerDispatcherFunction,
  engagementReconcilerFunction,
} from "@/lib/inngest";

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
