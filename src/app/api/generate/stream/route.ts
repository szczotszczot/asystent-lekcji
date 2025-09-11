import OpenAI from "openai";
import { z } from "zod";
import { loadRequirements } from "@/lib/loadRequirements";
import { matchRequirements } from "@/lib/matchRequirements";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BodySchema = z.object({
  subject: z.string(),
  grade: z.coerce.number(),
  topic: z.string(),
  minutes: z.coerce.number(),
  conditions: z.array(z.string()).default([]),
  students: z.coerce.number().optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const body = BodySchema.parse(json);

  const requirements = await loadRequirements(body.subject, body.grade);

  console.log("SUBJECT:", body.subject, "GRADE:", body.grade);

  const matched = matchRequirements(
    requirements,
    body.subject,
    body.grade,
    body.topic,
    body.conditions
  );

  if (!matched || matched.length === 0) {
    return new Response("Brak dopasowanych wymagań.", { status: 400 });
  }

  const top = matched.slice(0, 5);
  const ids = top.map((m) => m.id).join(", ");
  const details = top.map((m) => `- [${m.id}] ${m.outcome}`).join("\n");

  const system =
    "Jesteś asystentem nauczyciela. Generuj konspekt wyłącznie na podstawie podanych wymagań. Zwracaj markdown, zwięźle.";

  const user = `
Przedmiot: ${body.subject}; Klasa: ${body.grade}; Temat: ${body.topic}; Czas: ${
    body.minutes
  } min; Warunki: ${body.conditions.join(", ") || "brak"}.
Wymagania (używaj tylko tych):
${details}

Zwróć sekcje:
## Temat
## Cele (3–5)
## Przebieg (minuty)
## Materiały
## Ewaluacja
## Powiązane wymagania: ${ids}
`.trim();

  // 3. Create OpenAI stream
  const aiStream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 550,
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of aiStream) {
          const delta = part.choices?.[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
