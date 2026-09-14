// The avatar mirrors the diary: its build follows weight against the target,
// its mood follows how much of today's energy goal has been eaten.
export type PetSpecies = "cat" | "rabbit" | "bear" | "penguin";
export type PetShape = "slim" | "fit" | "chubby" | "round";
export type PetMood = "hungry" | "peckish" | "content" | "full" | "stuffed";
export type Pet = { species: PetSpecies };

export type SpeciesInfo = {
  id: PetSpecies;
  name: string;
  fur: string;
  belly: string;
  accent: string;
};
export const species: SpeciesInfo[] = [
  { id: "cat", name: "แมว", fur: "#E8A657", belly: "#FAE3C4", accent: "#C9762F" },
  { id: "rabbit", name: "กระต่าย", fur: "#D8D3EA", belly: "#F3F1FA", accent: "#EBA9BE" },
  { id: "bear", name: "หมี", fur: "#B98B6B", belly: "#E6CDB6", accent: "#8A6248" },
  { id: "penguin", name: "เพนกวิน", fur: "#3F5566", belly: "#F2F4F3", accent: "#E9A23B" },
];
export const defaultPet: Pet = { species: "cat" };

export function isPetSpecies(x: unknown): x is PetSpecies {
  return species.some((s) => s.id === x);
}
export function speciesInfo(id: PetSpecies): SpeciesInfo {
  const found = species.find((s) => s.id === id);
  if (!found) throw Error("ไม่รู้จักตัวละครนี้");
  return found;
}

// Build tracks the latest weigh-in against the target. No weigh-in yet reads as
// neutral rather than thin, so an empty diary doesn't show a starving pet.
export function petShape(
  latestWeight: number | undefined,
  targetWeight: number,
): PetShape {
  if (
    latestWeight === undefined ||
    !Number.isFinite(latestWeight) ||
    !Number.isFinite(targetWeight) ||
    targetWeight <= 0
  )
    return "fit";
  const ratio = latestWeight / targetWeight;
  if (ratio < 0.93) return "slim";
  if (ratio < 1.07) return "fit";
  if (ratio < 1.18) return "chubby";
  return "round";
}

// Mood tracks today's energy against the goal. An unreachable goal (0 or less)
// would make every day look overeaten, so it reads as neutral instead.
export function petMood(kcal: number, goalKcal: number): PetMood {
  if (!Number.isFinite(kcal) || kcal <= 0) return "hungry";
  if (!Number.isFinite(goalKcal) || goalKcal <= 0) return "content";
  const ratio = kcal / goalKcal;
  if (ratio < 0.35) return "peckish";
  if (ratio < 0.8) return "content";
  if (ratio <= 1.1) return "full";
  return "stuffed";
}

export const moodText: Record<PetMood, string> = {
  hungry: "ยังไม่ได้กินอะไรเลยวันนี้ หิวแล้วนะ",
  peckish: "เพิ่งได้กินนิดเดียว ยังหิวอยู่เลย",
  content: "อิ่มกำลังดี ไปต่อได้สบาย ๆ",
  full: "อิ่มพอดีแล้ว ขอบคุณที่ดูแลกันนะ",
  stuffed: "วันนี้อิ่มเกินไปหน่อย แน่นท้องเลย",
};
export const shapeText: Record<PetShape, string> = {
  slim: "ตอนนี้ตัวผอมกว่าเป้าหมาย",
  fit: "ตอนนี้หุ่นกำลังดี",
  chubby: "ตอนนี้ตัวท้วมกว่าเป้าหมายนิดหน่อย",
  round: "ตอนนี้ตัวกลมกว่าเป้าหมายอยู่พอสมควร",
};
export const shapeLabel: Record<PetShape, string> = {
  slim: "ผอม",
  fit: "กำลังดี",
  chubby: "ท้วม",
  round: "กลม",
};

// Body width in the 200-unit drawing space, so the pet visibly fills out as the
// weigh-ins move away from the target.
export const shapeWidth: Record<PetShape, number> = {
  slim: 38,
  fit: 47,
  chubby: 57,
  round: 67,
};
