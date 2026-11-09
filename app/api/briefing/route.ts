import Anthropic from "@anthropic-ai/sdk";
import { templateBriefing, type BriefingInput } from "@/lib/briefing";

type BriefingRequest = BriefingInput & {
  location: { city?: string; lat: number; lon: number };
};

// Returns Claude's summary, or null if Claude can't be used (no key, API error, refusal).
async function claudeBriefing(body: BriefingRequest): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const response = await new Anthropic().beta.messages.create({
      model: "claude-opus-5-5",
      // Re-runs on the fallback model if a safety classifier declines.
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: "claude-opus-4-8" }],
      max_tokens: 500,
      output_config: { effort: "low" },
      system:
        "Write a short daily-briefing paragraph (3-5 sentences) from the structured checkup data given. " +
        "Be direct and factual, no greeting, no preamble like 'Here is your briefing'. Skip any field that's missing or empty.",
      messages: [{ role: "user", content: JSON.stringify(body) }],
    });
    if (response.stop_reason === "refusal") return null;
    return response.content.find((b) => b.type === "text")?.text || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<BriefingRequest>;

  if (!body.location || !body.time) {
    return Response.json(
      { error: "location and time are required" },
      { status: 400 },
    );
  }

  const ai = await claudeBriefing(body as BriefingRequest);
  return Response.json({ summary: ai ?? templateBriefing(body as BriefingRequest), source: ai ? "claude" : "template" });
}
