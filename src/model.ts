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
// Starter estimates per stated serving; recipes and brands vary. Not a verified food database.
export const foods: Food[] = [
  {
    id: "basil",
    name: "ข้าวกะเพราไก่",
    emoji: "🍛",
    category: "อาหารจานเดียว",
    grams: 300,
    unit: "จาน",
    kcal: 480,
    protein: 25,
    carbs: 62,
    fat: 15,
  },
  {
    id: "papaya",
    name: "ส้มตำไทย",
    emoji: "🥗",
    category: "กับข้าว",
    grams: 150,
    unit: "จาน",
    kcal: 120,
    protein: 3,
    carbs: 23,
    fat: 2,
  },
  {
    id: "chicken",
    name: "อกไก่ย่าง",
    emoji: "🍗",
    category: "กับข้าว",
    grams: 100,
    unit: "ชิ้น",
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  {
    id: "rice",
    name: "ข้าวสวย",
    emoji: "🍚",
    category: "ข้าวและแป้ง",
    grams: 80,
    unit: "ทัพพี",
    kcal: 104,
    protein: 2.2,
    carbs: 22.6,
    fat: 0.2,
  },
  {
    id: "egg",
    name: "ไข่ต้ม",
    emoji: "🥚",
    category: "กับข้าว",
    grams: 50,
    unit: "ฟอง",
    kcal: 78,
    protein: 6.3,
    carbs: 0.6,
    fat: 5.3,
  },
  {
    id: "banana",
    name: "กล้วยหอม",
    emoji: "🍌",
    category: "ผลไม้",
    grams: 120,
    unit: "ลูก",
    kcal: 107,
    protein: 1.3,
    carbs: 27.4,
    fat: 0.4,
  },
  {
    id: "noodle",
    name: "ก๋วยเตี๋ยวน้ำใส",
    emoji: "🍜",
    category: "อาหารจานเดียว",
    grams: 350,
    unit: "ชาม",
    kcal: 320,
    protein: 18,
    carbs: 45,
    fat: 8,
  },
  {
    id: "salmon",
    name: "แซลมอนย่าง",
    emoji: "🐟",
    category: "กับข้าว",
    grams: 100,
    unit: "ชิ้น",
    kcal: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
  },
  {
    id: "yogurt",
    name: "โยเกิร์ตรสธรรมชาติ",
    emoji: "🥛",
    category: "ของว่าง",
    grams: 135,
    unit: "ถ้วย",
    kcal: 90,
    protein: 5,
    carbs: 12,
    fat: 2.5,
  },
  {
    id: "apple",
    name: "แอปเปิล",
    emoji: "🍎",
    category: "ผลไม้",
    grams: 180,
    unit: "ลูก",
    kcal: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
  },
  {
    id: "oats",
    name: "ข้าวโอ๊ต",
    emoji: "🥣",
    category: "ข้าวและแป้ง",
    grams: 40,
    unit: "ถ้วยเล็ก",
    kcal: 156,
    protein: 6.8,
    carbs: 26.5,
    fat: 2.8,
  },
  {
    id: "tofu",
    name: "เต้าหู้ขาว",
    emoji: "🧊",
    category: "กับข้าว",
    grams: 100,
    unit: "ชิ้น",
    kcal: 76,
    protein: 8,
    carbs: 1.9,
    fat: 4.8,
  },
];
export type Entry = {
  id: string;
  date: string;
  foodId: string;
  grams: number;
  meal: Meal;
};
export type Weight = { date: string; value: number };
export type Profile = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  targetWeight: number;
};
export type State = {
  version: 1;
  profile: Profile;
  entries: Entry[];
  water: Record<string, number>;
  weights: Weight[];
  favorites: string[];
  customFoods: Food[];
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
  },
  entries: [],
  water: {},
  weights: [],
  favorites: [],
  customFoods: [],
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
    typeof s.profile?.name !== "string" ||
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
  "อาหารจานเดียว",
  "กับข้าว",
  "ข้าวและแป้ง",
  "ผลไม้",
  "ของว่าง",
];
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
