import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "kona-agency",
  name: "Kona Agency",
  eventKey: process.env.KONA_INNGEST_EVENT_KEY,
  signingKey: process.env.KONA_INNGEST_SIGNING_KEY,
});
