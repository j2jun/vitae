import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface BriefingRequest {
  location: { city?: string; lat: number; lon: number };
  time: { iso: string; timezone: string };
  weather?: unknown;
  air?: unknown;
  news?: unknown;
  stocks?: unknown;
  traffic?: unknown;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<BriefingRequest>;

  if (!body.location || !body.time) {
    return Response.json(
      { error: "location and time are required" },
      { status: 400 },
    );
  }

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 500,
      output_config: { effort: "low" },
      system:
        "Write a short daily-briefing paragraph (3-5 sentences) from the structured checkup data given. " +
        "Be direct and factual, no greeting, no preamble like 'Here is your briefing'. Skip any field that's missing or empty.",
      messages: [{ role: "user", content: JSON.stringify(body) }],
    });
  } catch {
    return Response.json({ error: "briefing generation failed" }, { status: 502 });
  }

  if (response.stop_reason === "refusal") {
    return Response.json({ error: "briefing declined" }, { status: 502 });
  }

  const summary = response.content.find((b) => b.type === "text")?.text ?? "";
  return Response.json({ summary });
}
