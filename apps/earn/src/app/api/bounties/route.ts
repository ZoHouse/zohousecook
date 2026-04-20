import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source");
  const status = searchParams.get("status") || "open";
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, string> = { status };
  if (source) where.source = source;

  try {
    const bounties = await prisma.bounty.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(bounties);
  } catch (err) {
    console.error("[earn] bounties fetch failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}
