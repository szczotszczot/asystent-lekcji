import { synonyms } from "./synonyms";

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeWord(word: string): string {
  const w = normalize(word);
  return synonyms[w] ?? w;
}

export function normalizeText(text: string): string {
  return text.replace(/-/g, " ").split(/\s+/).map(normalizeWord).join(" ");
}

export function getRange(grade: number): string | null {
  if (grade >= 1 && grade <= 3) return "1-3";
  if (grade >= 4 && grade <= 8) return "4-8";
  if (grade >= 9 && grade <= 12) return "9-12";
  return null;
}
