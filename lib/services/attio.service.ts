const ATTIO_API_BASE = "https://api.attio.com/v2";

function extractDomain(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function getApiKey(): string | null {
  return process.env.ATTIO_API_KEY ?? null;
}

export const attioService = {
  async upsertCompany(input: {
    customerName: string;
    websiteUrl: string;
  }): Promise<{ recordId: string } | { error: string }> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { error: "ATTIO_API_KEY is not configured" };
    }

    const domain = extractDomain(input.websiteUrl);
    if (!domain) {
      return { error: "Lead has no valid website URL" };
    }

    let res: Response;
    try {
      res = await fetch(`${ATTIO_API_BASE}/objects/companies/records`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            values: {
              name: [{ value: input.customerName }],
              domains: [{ domain }],
            },
          },
        }),
      });
    } catch (err) {
      return { error: `Attio network error: ${err instanceof Error ? err.message : String(err)}` };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: `Attio company upsert failed: ${res.status} ${text.slice(0, 200)}` };
    }

    const body = await res.json();
    const recordId = body?.data?.id?.record_id as string | undefined;
    if (!recordId) {
      return { error: "Attio response missing record_id" };
    }

    return { recordId };
  },

  async addToList(input: { recordId: string }): Promise<{ entryId: string } | { error: string }> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { error: "ATTIO_API_KEY is not configured" };
    }

    const listId = process.env.ATTIO_LIST_ID;
    if (!listId) {
      return { error: "ATTIO_LIST_ID is not configured" };
    }

    let res: Response;
    try {
      res = await fetch(`${ATTIO_API_BASE}/lists/${listId}/entries`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            parent_object: "companies",
            parent_record_id: input.recordId,
          },
        }),
      });
    } catch (err) {
      return { error: `Attio network error: ${err instanceof Error ? err.message : String(err)}` };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: `Attio list entry failed: ${res.status} ${text.slice(0, 200)}` };
    }

    const body = await res.json();
    const entryId = body?.data?.id?.entry_id as string | undefined;
    return { entryId: entryId ?? input.recordId };
  },

  async addNote(input: {
    recordId: string;
    leadId: string;
    customerName: string;
    painPoints: string[];
    targetOutreachAngle?: string;
    draftSubject?: string;
  }): Promise<{ noteId: string } | { error: string }> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { error: "ATTIO_API_KEY is not configured" };
    }

    const painPointsText =
      input.painPoints.length > 0 ? input.painPoints.map((p, i) => `  ${i + 1}. ${p}`).join("\n") : "  None identified";

    const content = [
      `GRAFT TODAY Prospect Push — Lead ID: ${input.leadId}`,
      "",
      `Company: ${input.customerName}`,
      "",
      "Pain Points:",
      painPointsText,
      input.targetOutreachAngle ? `\nOutreach Angle: ${input.targetOutreachAngle}` : "",
      input.draftSubject ? `Email Subject: ${input.draftSubject}` : "",
    ]
      .filter((line) => line !== undefined)
      .join("\n")
      .trim();

    let res: Response;
    try {
      res = await fetch(`${ATTIO_API_BASE}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            parent_object: "companies",
            parent_record_id: input.recordId,
            title: `GRAFT prospect push — ${input.customerName}`,
            content,
            format: "plaintext",
          },
        }),
      });
    } catch (err) {
      return { error: `Attio network error: ${err instanceof Error ? err.message : String(err)}` };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: `Attio note creation failed: ${res.status} ${text.slice(0, 200)}` };
    }

    const body = await res.json();
    const noteId = body?.data?.id?.note_id as string | undefined;
    return { noteId: noteId ?? "created" };
  },
};
