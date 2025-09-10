import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { matchRequirements } from "@/lib/matchRequirements";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BodySchema = z.object({
  subject: z.string(),
  grade: z.coerce.number(),
  topic: z.string(),
  minutes: z.coerce.number(),
  conditions: z.array(z.string()).default([]),
  students: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    const matched = matchRequirements(
      body.subject,
      body.grade,
      body.topic,
      body.conditions
    );

    if (matched.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Brak dopasowanych wymagań." },
        { status: 200 }
      );
    }

    const ids = matched.map((m) => m.id).join(", ");
    const details = matched.map((m) => `- [${m.id}] ${m.outcome}`).join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Jesteś asystentem nauczyciela. Generujesz konspekty lekcji WYŁĄCZNIE na podstawie wymagań MEN.`,
        },
        {
          role: "user",
          content: `
Temat: ${body.topic}
Przedmiot: ${body.subject}, Klasa: ${body.grade}, Czas: ${body.minutes} minut
Warunki: ${body.conditions.join(", ") || "brak"}
Liczba uczniów: ${body.students || "nie podano"}

Wymagania MEN:
${details}

Przygotuj konspekt lekcji (markdown) z sekcjami:
- Temat lekcji
- Cele lekcji (3–5)
- Przebieg (z podziałem na minuty)
- Materiały potrzebne
- Ewaluacja
- Powiązane wymagania MEN (${ids})
          `,
        },
      ],
      max_tokens: 550,
      temperature: 0.3,
    });

    const content = completion.choices[0].message?.content ?? "";
    return NextResponse.json({
      ok: true,
      content,
      citedIds: matched.map((m) => m.id),
    });
  } catch (e: unknown) {
    let message = "Unknown error";

    if (e instanceof Error) {
      message = e.message;
    }

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
