import { NextRequest } from "next/server";
import { processRegistration } from "@/lib/registration-checkout";

export async function POST(req: NextRequest) {
  return processRegistration(req, false);
}
