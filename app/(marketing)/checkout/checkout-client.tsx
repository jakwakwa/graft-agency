"use client";

import { initializePaddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";

interface CheckoutClientProps {
  clientToken: string;
  environment: "sandbox" | "production";
}

export function CheckoutClient({ clientToken, environment }: CheckoutClientProps) {
  const [initializationFailed, setInitializationFailed] = useState(false);

  useEffect(() => {
    if (!clientToken) return;

    void initializePaddle({
      environment,
      token: clientToken,
    }).catch(() => {
      setInitializationFailed(true);
    });
  }, [clientToken, environment]);

  const unavailable = !clientToken || initializationFailed;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md text-center" aria-live="polite">
        <a className="font-display text-xl font-medium tracking-tight" href="/">
          GRAFT TODAY
        </a>
        <div className="mt-12 border-t border-border pt-10">
          <h1 className="text-3xl font-medium tracking-tight">Secure checkout</h1>
          {unavailable ? (
            <p className="mt-4 text-sm leading-6 text-destructive" role="alert">
              Checkout is temporarily unavailable. Please return to GRAFT TODAY and try again.
            </p>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Your payment window is opening. If nothing appears, check that this payment link is complete.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
