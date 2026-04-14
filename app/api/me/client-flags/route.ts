import { resolveClientIdFromAuth } from "@/lib/auth/resolve-client";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const clientId = await resolveClientIdFromAuth();
  if (!clientId) {
    return Response.json({ isPlatformOwner: false, isReseller: false }, { status: 200 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { isPlatformOwner: true, isReseller: true },
  });

  return Response.json({
    isPlatformOwner: client?.isPlatformOwner ?? false,
    isReseller: client?.isReseller ?? false,
  });
}
