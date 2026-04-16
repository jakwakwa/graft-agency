const ATTIO_API_BASE = "https://api.attio.com/v2";

/** Values for Attio `entry_values` on list entries (attribute slug or UUID → scalar or multiselect). */
export type AttioListEntryValues = Record<string, string | string[]>;

type AttioServiceResult<TData> = { ok: true; data: TData } | { ok: false; error: string };
type AttioLegacyResult<TData> = TData | { error: string };

type AttioRecordResponse = {
  data?: {
    id?: {
      record_id?: string;
    };
  };
};

type AttioCompanyAssertValues = {
  name?: Array<{ value: string }>;
  domains: Array<{ domain: string }>;
};

type AttioPersonAssertValues = {
  name?: Array<{ value: string }>;
  email_addresses: Array<{ email_address: string }>;
  company?: Array<{ target_record_id: string }>;
};

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

function toLegacyResult<TData>(result: AttioServiceResult<TData>): AttioLegacyResult<TData> {
  return result.ok ? result.data : { error: result.error };
}

async function putRecordAssert<TValues>(input: {
  objectSlug: "companies" | "people";
  matchingAttribute: "domains" | "email_addresses";
  values: TValues;
  failureContext: string;
}): Promise<AttioServiceResult<{ recordId: string }>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, error: "ATTIO_API_KEY is not configured" };
  }

  let res: Response;
  try {
    res = await fetch(
      `${ATTIO_API_BASE}/objects/${input.objectSlug}/records?matching_attribute=${input.matchingAttribute}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            values: input.values,
          },
        }),
      },
    );
  } catch (err) {
    return { ok: false, error: `Attio network error: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `${input.failureContext}: ${res.status} ${text.slice(0, 200)}` };
  }

  const body = (await res.json()) as AttioRecordResponse;
  const recordId = body.data?.id?.record_id;
  if (!recordId) {
    return { ok: false, error: "Attio response missing record_id" };
  }

  return { ok: true, data: { recordId } };
}

export const attioService = {
  async assertCompanyRecord(input: {
    values: AttioCompanyAssertValues;
  }): Promise<AttioServiceResult<{ recordId: string }>> {
    return putRecordAssert({
      objectSlug: "companies",
      matchingAttribute: "domains",
      values: input.values,
      failureContext: "Attio company assert failed",
    });
  },

  async assertPersonRecord(input: {
    values: AttioPersonAssertValues;
  }): Promise<AttioServiceResult<{ recordId: string }>> {
    return putRecordAssert({
      objectSlug: "people",
      matchingAttribute: "email_addresses",
      values: input.values,
      failureContext: "Attio person assert failed",
    });
  },

  async upsertCompany(input: {
    customerName: string;
    websiteUrl: string;
  }): Promise<{ recordId: string } | { error: string }> {
    const domain = extractDomain(input.websiteUrl);
    if (!domain) {
      return { error: "Lead has no valid website URL" };
    }

    const result = await attioService.assertCompanyRecord({
      values: {
        name: [{ value: input.customerName }],
        domains: [{ domain }],
      },
    });
    return toLegacyResult(result);
  },

  async addToList(input: {
    recordId: string;
    entryValues?: AttioListEntryValues;
  }): Promise<{ entryId: string } | { error: string }> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { error: "ATTIO_API_KEY is not configured" };
    }

    const listId = process.env.ATTIO_LIST_ID;
    if (!listId) {
      return { error: "ATTIO_LIST_ID is not configured" };
    }

    const data: {
      parent_object: string;
      parent_record_id: string;
      entry_values?: AttioListEntryValues;
    } = {
      parent_object: "companies",
      parent_record_id: input.recordId,
    };

    if (input.entryValues !== undefined && Object.keys(input.entryValues).length > 0) {
      data.entry_values = input.entryValues;
    }

    let res: Response;
    try {
      res = await fetch(`${ATTIO_API_BASE}/lists/${listId}/entries`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ data }),
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
