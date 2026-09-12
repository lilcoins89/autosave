import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Groq is not configured." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const context = body?.context ?? {};
  if (!prompt) return NextResponse.json({ error: "A question is required." }, { status: 400 });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 320,
      messages: [
        { role: "system", content: "You are AURA, a concise Solana trading copilot. Explain signals and risk clearly. Never promise profit. Paper mode is mandatory. Use the supplied context and recommend safety-first actions." },
        { role: "user", content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${prompt}` },
      ],
    }),
  });

  if (!response.ok) return NextResponse.json({ error: "Groq could not answer right now." }, { status: 502 });
  const data = await response.json();
  return NextResponse.json({ answer: data.choices?.[0]?.message?.content ?? "No answer returned.", provider: "groq" });
}
