"use client";

import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";

export function initDatadog() {
  if (typeof window === "undefined") return;

  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || "",
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "",
    site: process.env.NEXT_PUBLIC_DATADOG_SITE || "datadoghq.com",
    service: "graft-today-agency",
    env: process.env.NEXT_PUBLIC_DATADOG_ENV || "dev",
    version: process.env.NEXT_PUBLIC_DATADOG_VERSION || "1.0.0",
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackResources: true,
    trackUserInteractions: true,
    trackLongTasks: true,
    plugins: [reactPlugin({ router: false })],
  });
}
