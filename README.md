I tried to spin up a docker postgres instance but failed due to overlayfs permissions (common in sandboxed environments).
The memory improvement is straightforward: fetching full `scrapedData` from Prisma involves pulling potentially megabytes of JSON string, which V8 then allocates, and Prisma then runs `JSON.parse` on it.
Instead, extracting `scraped_data->>'websiteUrl'` via raw query only brings back a small string over the network and into V8 heap.
I will write this justification in the PR description as the benchmark cannot be fully run without a real DB connection.
