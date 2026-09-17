import { catalogue } from "./foods.ts";
import {
  defaultPet,
  isPetName,
  isPetSpecies,
  type Pet,
} from "./pet.ts";
import {
  isActivity,
  isGoal,
  isPace,
  isSex,
  inRange,
  type Activity,
  type Goal,
  type Pace,
  type Sex,
} from "./onboarding.ts";
export type Food = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  grams: number;
  unit: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  photoId?: string;
};
export type Meal = "เช้า" | "กลางวัน" | "เย็น" | "ของว่าง";
export const meals: Meal[] = ["เช้า", "กลางวัน", "เย็น", "ของว่าง"];
export const foods: Food[] = catalogue;
export type Entry = {
  id: string;
  date: string;
  foodId: string;
  grams: number;
  meal: Meal;
};
export type Weight = { date: string; value: number };
export type { Pet };
export type Profile = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  targetWeight: number;
  // Answers from the opening questions. They are kept so the targets can be
  // recalculated later, not just applied once.
  sex: Sex;
  age: number;
  height: number;
  activity: Activity;
  goal: Goal;
  pace: Pace;
  /** False only until the opening questions have been answered. */
  onboarded: boolean;
};
export type State = {
  version: 1;
  profile: Profile;
  entries: Entry[];
  water: Record<string, number>;
  weights: Weight[];
  favorites: string[];
  customFoods: Food[];
  pet: Pet;
};
export const initialState: State = {
  version: 1,
  profile: {
    name: "",
    calories: 1800,
    protein: 100,
    carbs: 225,
    fat: 56,
    water: 2000,
    targetWeight: 65,
    sex: "unspecified",
    age: 30,
    height: 165,
    activity: "light",
    goal: "health",
    pace: "steady",
    onboarded: false,
  },
  entries: [],
  water: {},
  weights: [],
  favorites: [],
  customFoods: [],
  pet: defaultPet,
};
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftDate(key: string, days: number) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}
export function nutrition(food: Food, grams: number) {
  if (!Number.isFinite(grams) || grams <= 0) throw Error("ปริมาณต้องมากกว่า 0");
  const f = grams / food.grams;
  return {
    kcal: food.kcal * f,
    protein: food.protein * f,
    carbs: food.carbs * f,
    fat: food.fat * f,
  };
}
export function totals(
  entries: Entry[],
  date: string,
  catalog: Food[] = foods,
) {
  return entries
    .filter((e) => e.date === date)
    .reduce(
      (s, e) => {
        const food = catalog.find((f) => f.id === e.foodId);
        if (!food) return s;
        const n = nutrition(food, e.grams);
        return {
          kcal: s.kcal + n.kcal,
          protein: s.protein + n.protein,
          carbs: s.carbs + n.carbs,
          fat: s.fat + n.fat,
        };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
}
export function saveWeight(weights: Weight[], date: string, value: number) {
  if (!Number.isFinite(value) || value < 20 || value > 400)
    throw Error("กรอกน้ำหนักระหว่าง 20–400 กก.");
  return [...weights.filter((w) => w.date !== date), { date, value }].sort(
    (a, b) => a.date.localeCompare(b.date),
  );
}
export function parseState(raw: string): State {
  const s = JSON.parse(raw);
  // Backwards-compatible migration: v1 diaries had no custom food catalogue.
  if (s && s.customFoods === undefined) s.customFoods = [];
  // Same for the avatar: older diaries predate it, so they start on the default.
  if (s && s.pet === undefined) s.pet = defaultPet;
  // A diary saved before the opening questions existed belongs to someone who
  // is already using the app, so it is marked answered rather than sending them
  // back through onboarding with data already in hand.
  if (s?.profile && s.profile.onboarded === undefined)
    s.profile = {
      sex: "unspecified",
      age: 30,
      height: 165,
      activity: "light",
      goal: "health",
      pace: "steady",
      ...s.profile,
      onboarded: true,
    };
  if (Array.isArray(s?.customFoods))
    for (const f of s.customFoods)
      if (f && renamedCategories[f.category])
        f.category = renamedCategories[f.category];
  if (!Array.isArray(s?.customFoods) || !s.customFoods.every(validCustomFood))
    throw Error("รายการอาหารที่บันทึกไว้ไม่ถูกต้อง");
  const catalog = [...foods, ...s.customFoods];
  if (new Set(catalog.map((f) => f.id)).size !== catalog.length)
    throw Error("รหัสอาหารซ้ำกัน");
  const positive = (x: unknown) =>
    typeof x === "number" && Number.isFinite(x) && x > 0;
  const validDate = (x: unknown) =>
    typeof x === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(x) &&
    !Number.isNaN(Date.parse(x));
  if (
    s?.version !== 1 ||
    !s.pet ||
    typeof s.pet !== "object" ||
    !isPetSpecies(s.pet.species) ||
    (s.pet.name !== undefined && !isPetName(s.pet.name)) ||
    typeof s.profile?.name !== "string" ||
    typeof s.profile.onboarded !== "boolean" ||
    !isSex(s.profile.sex) ||
    !isActivity(s.profile.activity) ||
    !isGoal(s.profile.goal) ||
    !isPace(s.profile.pace) ||
    !inRange(s.profile.age, "age") ||
    !inRange(s.profile.height, "height") ||
    !["calories", "protein", "carbs", "fat", "water", "targetWeight"].every(
      (k) => positive(s.profile[k]),
    ) ||
    !Array.isArray(s.entries) ||
    !s.entries.every(
      (e: any) =>
        typeof e.id === "string" &&
        validDate(e.date) &&
        catalog.some((f) => f.id === e.foodId) &&
        positive(e.grams) &&
        meals.includes(e.meal),
    ) ||
    !Array.isArray(s.weights) ||
    !s.weights.every((w: any) => validDate(w.date) && positive(w.value)) ||
    !Array.isArray(s.favorites) ||
    !s.favorites.every((id: any) => catalog.some((f) => f.id === id)) ||
    !s.water ||
    typeof s.water !== "object" ||
    !Object.entries(s.water).every(
      ([k, v]) =>
        validDate(k) && typeof v === "number" && Number.isFinite(v) && v >= 0,
    )
  )
    throw Error("ข้อมูลที่บันทึกไว้ไม่ถูกต้อง");
  return s;
}

export const foodCategories = [
  "อาหารตามสั่ง",
  "ผัก ผลไม้",
  "เนื้อสัตว์",
  "นม ไข่",
  "อื่นๆ",
];
// The categories were renamed once the catalogue grew. A custom food carrying
// an old name would fail validCustomFood and take the whole diary down with it,
// so saved entries are mapped forward on load rather than rejected.
const renamedCategories: Record<string, string> = {
  อาหารจานเดียว: "อาหารตามสั่ง",
  กับข้าว: "อาหารตามสั่ง",
  ข้าวและแป้ง: "อื่นๆ",
  ผลไม้: "ผัก ผลไม้",
  ของว่าง: "อื่นๆ",
};
export type FoodDraft = {
  name: string;
  unit: string;
  category: string;
  grams: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
};
export function createCustomFood(
  draft: FoodDraft,
  id: string,
  photoId?: string,
): Food {
  if (!draft.name.trim() || draft.name.trim().length > 100)
    throw Error("กรอกชื่ออาหาร 1–100 ตัวอักษร");
  if (!draft.unit.trim() || draft.unit.trim().length > 30)
    throw Error("กรอกหน่วยบริโภค เช่น จาน ชาม หรือชิ้น");
  if (!foodCategories.includes(draft.category)) throw Error("เลือกหมวดอาหาร");
  const values: Record<string, number> = {};
  for (const [key, label, max] of [
    ["grams", "น้ำหนักต่อหน่วย", 5000],
    ["kcal", "พลังงาน", 20000],
    ["protein", "โปรตีน", 5000],
    ["carbs", "คาร์บ", 5000],
    ["fat", "ไขมัน", 5000],
  ] as const) {
    const text = draft[key].trim(),
      value = Number(text);
    if (
      !text ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > max ||
      (key === "grams" && value === 0)
    )
      throw Error(
        `กรอก${label}${key === "grams" ? "มากกว่า 0" : "ตั้งแต่ 0"} และไม่เกิน ${max}`,
      );
    values[key] = value;
  }
  const result: Food = {
    id,
    name: draft.name.trim(),
    unit: draft.unit.trim(),
    category: draft.category,
    emoji: "🍽️",
    grams: values.grams,
    kcal: values.kcal,
    protein: values.protein,
    carbs: values.carbs,
    fat: values.fat,
    ...(photoId ? { photoId } : {}),
  };
  if (!validCustomFood(result)) throw Error("ข้อมูลอาหารไม่ถูกต้อง");
  return result;
}
export function validCustomFood(f: unknown): f is Food {
  if (!f || typeof f !== "object") return false;
  const v = f as Food;
  return (
    typeof v.id === "string" &&
    /^custom-[a-zA-Z0-9-]+$/.test(v.id) &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    v.name.length <= 100 &&
    typeof v.unit === "string" &&
    v.unit.trim().length > 0 &&
    v.unit.length <= 30 &&
    typeof v.emoji === "string" &&
    foodCategories.includes(v.category) &&
    Number.isFinite(v.grams) &&
    v.grams > 0 &&
    v.grams <= 5000 &&
    ["kcal", "protein", "carbs", "fat"].every((k) => {
      const n = v[k as "kcal"];
      return (
        typeof n === "number" &&
        Number.isFinite(n) &&
        n >= 0 &&
        n <= (k === "kcal" ? 20000 : 5000)
      );
    }) &&
    (v.photoId === undefined || /^[a-zA-Z0-9-]+$/.test(v.photoId))
  );
}
