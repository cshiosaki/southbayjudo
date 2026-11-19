import { NextRequest } from "next/server";
import { processRegistration } from "@/lib/registration-checkout";

// Protected by ADMIN_PASSWORD inside processRegistration before the
// registration-window override is evaluated. Never invokes live checkout.
export async function POST(req: NextRequest) {
  return processRegistration(req, true);
}
