import data from "@/data/requirements/matematyka-kl7.json";
import { synonyms } from "@/lib/synonyms";
import Fuse from "fuse.js";

export type Requirement = {
  id: string;
  subject: string;
  grade: number;
  outcome: string;
  tags: string[];
};

const ALL: Requirement[] = data as Requirement[];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeWord(word: string): string {
  const w = normalize(word);
  return synonyms[w] ?? w;
}

function normalizeText(text: string): string {
  return text.replace(/-/g, " ").split(/\s+/).map(normalizeWord).join(" ");
}

export function matchRequirements(
  subject: string,
  grade: number,
  topic: string,
  conditions: string[]
) {
  const q = normalizeText(topic + " " + conditions.join(" "));

  const pool = ALL.filter(
    (r) => normalize(r.subject) === normalize(subject) && r.grade === grade
  );

  const scored = pool.map((r) => {
    const hay = normalizeText(r.outcome + " " + r.tags.join(" "));
    let score = 0;

    r.tags.forEach((t) => {
      if (q.includes(normalizeWord(t))) score += 2;
    });

    if (hay.includes("pitagoras") && q.includes("pitagoras")) score += 3;
    if (hay.includes("procent") && q.includes("procent")) score += 3;

    return { r, score };
  });

  let filtered = scored.filter((s) => s.score > 0);

  if (filtered.length === 0) {
    const fuse = new Fuse(pool, {
      keys: ["tags", "outcome"],
      threshold: 0.4,
    });

    const results = fuse.search(q);

    if (results.length > 0) {
      filtered = results.slice(0, 5).map((res) => ({ r: res.item, score: 1 }));
    }
  }

  return filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(10, filtered.length))
    .map((x) => x.r);
}
