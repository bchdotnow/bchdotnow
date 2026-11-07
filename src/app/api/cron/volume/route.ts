import { connection } from "next/server";
import { reconcile } from "@/lib/volume";

// Daily backstop for the swap-volume check (the market route runs it every few minutes while people visit).
export async function GET(req: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  // Locked unless CRON_SECRET is set; Vercel Cron sends it automatically.
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  return Response.json(await reconcile({ force: true }));
}
