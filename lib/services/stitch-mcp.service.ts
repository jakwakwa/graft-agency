import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { DesignConcept } from "@/lib/types/engagement";

interface StitchDesignRequest {
  productName: string;
  description: string;
  styleHint: string;
  components: string[];
}

export async function generateDesignConcepts(request: StitchDesignRequest): Promise<DesignConcept[]> {
  const stitchUrl = process.env.STITCH_MCP_URL ?? "http://localhost:3100";

  const client = new Client({ name: "graft-today-engagement", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${stitchUrl}/mcp`));

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: "generate_ui_concepts",
      arguments: {
        product_name: request.productName,
        description: request.description,
        style_hint: request.styleHint,
        required_components: request.components,
        num_concepts: 3,
        output_format: "json",
      },
    });

    const text = (result.content as Array<{ type: string; text: string }>)
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");

    return JSON.parse(text) as DesignConcept[];
  } finally {
    await client.close();
  }
}
