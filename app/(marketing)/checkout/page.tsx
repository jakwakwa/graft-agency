import type { Metadata } from "next";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Secure checkout | GRAFT TODAY",
  description: "Complete your GRAFT TODAY payment securely.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <CheckoutClient
      clientToken={process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ""}
      environment={process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox"}
    />
  );
}
