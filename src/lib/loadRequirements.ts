// src/lib/requirements.ts
import type { Requirement } from "@/lib/types";
import { getRange } from "@/lib/utils";

export async function loadRequirements(
  subject: string,
  grade: number
): Promise<Requirement[]> {
  const range = getRange(grade);
  if (!range) return [];

  try {
    const path = `@/data/requirements/${range}/${subject.toLowerCase()}-${range}-blok.json`;
    const mod = await import(path);
    return mod.default as Requirement[];
  } catch (e) {
    console.error(
      `Nie udało się załadować wymagań dla ${subject}, klasa ${grade}`,
      e
    );
    return [];
  }
}
