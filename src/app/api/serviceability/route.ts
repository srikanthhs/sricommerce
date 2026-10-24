import { NextResponse } from "next/server";
import { findZone } from "@/lib/catalog";

export async function GET(req: Request) {
  const pincode = new URL(req.url).searchParams.get("pincode") ?? "";
  const zone = /^\d{6}$/.test(pincode) ? await findZone(pincode) : undefined;
  return NextResponse.json(zone ? { serviceable: true, area: zone.area, eta: zone.eta_minutes } : { serviceable: false });
}
