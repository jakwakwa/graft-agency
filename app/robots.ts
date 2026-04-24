import type { MetadataRoute } from "next";

function siteOrigin(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }
  return undefined;
}

/**
 * Crawl policy: keep dashboards, APIs, embeds, and auth flows out of public indexes.
 * Robots directives are hints only; access control remains in middleware and Clerk.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/portal", "/tenant", "/widget", "/sign-in", "/sign-up"],
    },
    ...(origin ? { host: origin } : {}),
  };
}
