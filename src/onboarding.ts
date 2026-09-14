// Turns the answers given before the app opens into the daily targets the rest
// of the app already works from. Every number here is an estimate for a healthy
// adult, not medical advice, and the UI says so.
export type Sex = "male" | "female" | "unspecified";
export type Activity = "sedentary" | "light" | "moderate" | "active";
export type Goal = "lose" | "maintain" | "gain" | "health";
export type Pace = "gentle" | "steady" | "brisk";

export type Answers = {
  goal: Goal;
  sex: Sex;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  activity: Activity;
  pace: Pace;
};

export const goals: { id: Goal; label: string; detail: string }[] = [
  { id: "lose", label: "ลดน้ำหนัก", detail: "กินน้อยกว่าที่ใช้ อย่างค่อยเป็นค่อยไป" },
  { id: "maintain", label: "รักษาน้ำหนัก", detail: "กินให้พอดีกับที่ร่างกายใช้" },
  { id: "gain", label: "เพิ่มกล้ามเนื้อ", detail: "กินมากขึ้นเล็กน้อย เน้นโปรตีน" },
  { id: "health", label: "สุขภาพดีขึ้นโดยรวม", detail: "ไม่เน้นตัวเลข เน้นกินให้สมดุล" },
];
export const sexes: { id: Sex; label: string }[] = [
  { id: "female", label: "หญิง" },
  { id: "male", label: "ชาย" },
  { id: "unspecified", label: "ไม่ระบุ" },
];
export const activities: {
  id: Activity;
  label: string;
  detail: string;
  factor: number;
}[] = [
  { id: "sedentary", label: "นั่งเป็นส่วนใหญ่", detail: "แทบไม่ได้ออกกำลังกาย", factor: 1.2 },
  { id: "light", label: "ขยับบ้าง", detail: "ออกกำลังเบา ๆ 1–3 วันต่อสัปดาห์", factor: 1.375 },
  { id: "moderate", label: "ขยับปานกลาง", detail: "ออกกำลัง 3–5 วันต่อสัปดาห์", factor: 1.55 },
  { id: "active", label: "ขยับมาก", detail: "ออกกำลัง 6–7 วันต่อสัปดาห์", factor: 1.725 },
];
// Weekly change in kilograms. Capped well inside what is generally considered a
// safe rate, and capped again against body weight in weeklyRate().
export const paces: { id: Pace; label: string; kgPerWeek: number }[] = [
  { id: "gentle", label: "ค่อยเป็นค่อยไป", kgPerWeek: 0.25 },
  { id: "steady", label: "ปานกลาง", kgPerWeek: 0.5 },
  { id: "brisk", label: "เร็วขึ้น", kgPerWeek: 0.75 },
];

export const LIMITS = {
  age: [13, 100],
  height: [120, 230],
  weight: [30, 300],
} as const;

// Energy in one kilogram of body mass, the usual figure behind "a 500 kcal
// daily deficit is about half a kilo a week".
const KCAL_PER_KG = 7700;
// Floors below which a self-directed plan should not go. Clamping here is what
// stops an aggressive pace plus a small body from producing an unsafe number.
const FLOOR = { male: 1500, female: 1200, unspecified: 1200 };

export function isSex(x: unknown): x is Sex {
  return sexes.some((s) => s.id === x);
}
export function isActivity(x: unknown): x is Activity {
  return activities.some((a) => a.id === x);
}
export function isGoal(x: unknown): x is Goal {
  return goals.some((g) => g.id === x);
}
export function isPace(x: unknown): x is Pace {
  return paces.some((p) => p.id === x);
}
export function inRange(value: number, key: keyof typeof LIMITS): boolean {
  const [lo, hi] = LIMITS[key];
  return Number.isFinite(value) && value >= lo && value <= hi;
}

export function bmi(weight: number, heightCm: number): number {
  if (!(heightCm > 0)) throw Error("ส่วนสูงต้องมากกว่า 0");
  const m = heightCm / 100;
  return weight / (m * m);
}

// Asia-Pacific cut-offs rather than the international ones: the same body
// carries more metabolic risk at a lower BMI across Asian populations, and this
// app is written for Thai users.
export type BmiBand = "under" | "healthy" | "raised" | "high" | "veryHigh";
export const bmiBands: { id: BmiBand; label: string; upTo: number }[] = [
  { id: "under", label: "ต่ำกว่าเกณฑ์", upTo: 18.5 },
  { id: "healthy", label: "สมส่วน", upTo: 23 },
  { id: "raised", label: "ท้วม", upTo: 25 },
  { id: "high", label: "เกินเกณฑ์", upTo: 30 },
  { id: "veryHigh", label: "เกินเกณฑ์มาก", upTo: Infinity },
];
export function bmiBand(value: number): BmiBand {
  return (bmiBands.find((b) => value < b.upTo) ?? bmiBands[bmiBands.length - 1])
    .id;
}
/** The weight range that lands inside the healthy band for this height. */
export function healthyWeightRange(heightCm: number): [number, number] {
  const m = heightCm / 100;
  return [round1(18.5 * m * m), round1(22.9 * m * m)];
}

export function bmr(a: Pick<Answers, "sex" | "age" | "height" | "weight">) {
  // Mifflin-St Jeor. "Unspecified" sits between the two sex constants rather
  // than defaulting to either, so the estimate is not skewed by a non-answer.
  const constant = a.sex === "male" ? 5 : a.sex === "female" ? -161 : -78;
  return 10 * a.weight + 6.25 * a.height - 5 * a.age + constant;
}
export function tdee(a: Answers) {
  const factor =
    activities.find((x) => x.id === a.activity)?.factor ??
    activities[1].factor;
  return bmr(a) * factor;
}

/**
 * Weekly change actually planned, in kg. Positive means losing. Capped at 1% of
 * body weight per week so a "brisk" pace does not become extreme for someone
 * light, and zero for goals that are not about the scale.
 */
export function weeklyRate(a: Answers): number {
  if (a.goal === "maintain" || a.goal === "health") return 0;
  const chosen = paces.find((p) => p.id === a.pace)?.kgPerWeek ?? 0.5;
  const capped = Math.min(chosen, a.weight * 0.01);
  if (a.goal === "gain") return -Math.min(capped, 0.5); // muscle gain is slower
  // Never plan to lose past the target weight.
  if (a.targetWeight >= a.weight) return 0;
  return capped;
}

export type Targets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  /** True when the calorie floor, not the chosen pace, set the final number. */
  floored: boolean;
};

export function targets(a: Answers): Targets {
  const maintenance = tdee(a);
  const daily = (weeklyRate(a) * KCAL_PER_KG) / 7;
  const floor = FLOOR[a.sex];
  const raw = maintenance - daily;
  const calories = Math.max(floor, raw);
  // Protein is set from target weight, so someone with a lot to lose is not
  // given a protein goal scaled to weight they are working to shed.
  const reference = Math.min(a.weight, Math.max(a.targetWeight, 40));
  const protein = Math.round(reference * 1.6);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(
    0,
    Math.round((calories - protein * 4 - fat * 9) / 4),
  );
  return {
    calories: Math.round(calories / 10) * 10,
    protein,
    carbs,
    fat,
    water: Math.min(4000, Math.max(1500, Math.round((a.weight * 32) / 50) * 50)),
    floored: raw < floor,
  };
}

/** How far the target sits from where they are now, as a share of body weight. */
export function goalEffort(a: Answers): {
  percent: number;
  label: string;
  hard: boolean;
} {
  const percent =
    a.weight > 0 ? (Math.abs(a.weight - a.targetWeight) / a.weight) * 100 : 0;
  if (percent < 5)
    return { percent, label: "เป้าหมายที่ทำได้สบาย ๆ", hard: false };
  if (percent < 10)
    return { percent, label: "เป้าหมายระดับปานกลาง", hard: false };
  if (percent < 20)
    return { percent, label: "เป้าหมายที่ต้องใช้เวลา", hard: false };
  return { percent, label: "เป้าหมายที่ท้าทายมาก", hard: true };
}

/** Weeks to reach the target at the planned rate; null when not applicable. */
export function weeksToTarget(a: Answers): number | null {
  const rate = Math.abs(weeklyRate(a));
  if (rate <= 0) return null;
  const gap = Math.abs(a.weight - a.targetWeight);
  if (gap <= 0) return null;
  return Math.ceil(gap / rate);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
