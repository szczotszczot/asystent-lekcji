import type { Requirement } from "@/lib/types";
import { getRange } from "@/lib/utils";

export async function loadRequirements(
  subject: string,
  grade: number
): Promise<Requirement[]> {
  const range = getRange(grade);
  if (!range) return [];

  const key = `${subject.toLowerCase()}-${range}`;

  try {
    switch (key) {
      case "matematyka-1-3":
      // return (
      //   await import("@/data/requirements/1-3/matematyka-1-3-blok.json")
      // ).default as Requirement[];
      case "matematyka-4-8":
        return (
          await import("@/data/requirements/4-8/matematyka-4-8-blok.json")
        ).default as Requirement[];
      case "matematyka-9-12":
        return (
          await import("@/data/requirements/9-12/matematyka-9-12-blok.json")
        ).default as Requirement[];
      // case "fizyka-1-3":
      //   return (
      //     await import("@/data/requirements/1-3/fizyka-1-3-blok.json")
      //   ).default as Requirement[];
      case "fizyka-4-8":
        return (await import("@/data/requirements/4-8/fizyka-4-8-blok.json"))
          .default as Requirement[];
      case "fizyka-9-12":
        return (await import("@/data/requirements/9-12/fizyka-9-12-blok.json"))
          .default as Requirement[];
      // case "geografia-1-3":
      //   return (
      //     await import("@/data/requirements/1-3/geografia-1-3-blok.json")
      // ).default as Requirement[];
      case "geografia-4-8":
        return (await import("@/data/requirements/4-8/geografia-4-8-blok.json"))
          .default as Requirement[];
      case "geografia-9-12":
        return (
          await import("@/data/requirements/9-12/geografia-9-12-blok.json")
        ).default as Requirement[];
      // case "informatyka-1-3":
      //   return (
      //     await import("@/data/requirements/1-3/informatyka-1-3-blok.json")
      //   ).default as Requirement[];
      case "informatyka-4-8":
        return (
          await import("@/data/requirements/4-8/informatyka-4-8-blok.json")
        ).default as Requirement[];
      case "informatyka-9-12":
        return (
          await import("@/data/requirements/9-12/informatyka-9-12-blok.json")
        ).default as Requirement[];

      default:
        console.warn(`Brak dopasowanego pliku dla: ${key}`);
        return [];
    }
  } catch (e) {
    console.error(
      `❌ Nie udało się załadować wymagań dla ${subject}, klasa ${grade}`,
      e
    );
    return [];
  }
}
