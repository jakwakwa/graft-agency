"use client";

import { useEffect } from 'react';
import { initDatadog } from '@/lib/datadogRUM-init';

export function DatadogRum() {
  useEffect(() => {
    initDatadog();
  }, []);

  return null;
}
