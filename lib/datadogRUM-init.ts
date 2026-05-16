"use client";

import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';

export function initDatadog() {
    if (typeof window === 'undefined') return;

    datadogRum.init({
        applicationId: 'b423dab9-46d4-4867-a82b-aa5f5030b6e8',
        clientToken: 'pub5a9cfde86120e02980faca968cf11feb',
        site: 'datadoghq.eu',
        service: 'graft-today-agency',
        env: process.env.NEXT_PUBLIC_DATADOG_ENV || 'dev',
        version: process.env.NEXT_PUBLIC_DATADOG_VERSION || '1.0.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackResources: true,
        trackUserInteractions: true,
        trackLongTasks: true,
        plugins: [reactPlugin({ router: false })],
    });
}
