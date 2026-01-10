import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { prisma } from "./db.ts";

serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/questions") {
    const limit = Math.min(100, Number(url.searchParams.get("limit") || 10));
    const questions = await prisma.question.findMany({
      take: limit,
      orderBy: { id: "desc" },
    });
    return new Response(JSON.stringify(questions), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not found", { status: 404 });
}, { port: 8000 });
