import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { lastAddress } from "@/lib/orders";

// The address from the shopper's most recent order, to prefill checkout.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ address: null });
  return NextResponse.json({ address: (await lastAddress(user.id)) ?? null });
}
