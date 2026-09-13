import test from "node:test";
import assert from "node:assert/strict";
import {
  foods,
  nutrition,
  totals,
  saveWeight,
  parseState,
  initialState,
  shiftDate,
  dateKey,
  createCustomFood,
} from "../src/model.ts";
const customDraft = {
  name: "ข้าวผัดทำเอง",
  category: "อาหารจานเดียว",
  unit: "จาน",
  grams: "250",
  kcal: "400",
  protein: "20",
  carbs: "50",
  fat: "10",
};
test("old diary migration preserves entries and initializes the custom catalogue", () => {
  const { customFoods, ...old } = initialState;
  const migrated = parseState(
    JSON.stringify({
      ...old,
      entries: [
        {
          id: "old",
          date: "2026-09-13",
          foodId: "egg",
          grams: 50,
          meal: "เช้า",
        },
      ],
      favorites: ["egg"],
    }),
  );
  assert.deepEqual(migrated.customFoods, []);
  assert.equal(migrated.entries[0].id, "old");
  assert.deepEqual(migrated.favorites, ["egg"]);
});
test("custom food and image ID survive reload, contribute scaled daily nutrition", () => {
  const food = createCustomFood(customDraft, "custom-test", "photo-test");
  const d = {
    ...initialState,
    customFoods: [food],
    favorites: [food.id],
    entries: [
      {
        id: "entry",
        date: "2026-09-13",
        foodId: food.id,
        grams: 125,
        meal: "กลางวัน",
      },
    ],
  };
  const restored = parseState(JSON.stringify(d));
  assert.equal(restored.customFoods[0].photoId, "photo-test");
  assert.deepEqual(
    totals(restored.entries, "2026-09-13", [...foods, ...restored.customFoods]),
    { kcal: 200, protein: 10, carbs: 25, fat: 5 },
  );
});
test("custom form rejects missing and invalid numbers but accepts explicit zero", () => {
  for (const update of [
    { name: " " },
    { grams: "0" },
    { kcal: "" },
    { protein: "NaN" },
    { fat: "-1" },
    { carbs: "Infinity" },
    { grams: "5001" },
  ])
    assert.throws(() =>
      createCustomFood({ ...customDraft, ...update }, "custom-test"),
    );
  assert.equal(
    createCustomFood(
      { ...customDraft, kcal: "0", protein: "0", carbs: "0", fat: "0" },
      "custom-zero",
    ).kcal,
    0,
  );
});
test("duplicate custom IDs and unsafe image IDs are rejected on restore", () => {
  const food = createCustomFood(customDraft, "custom-test");
  assert.throws(() =>
    parseState(JSON.stringify({ ...initialState, customFoods: [food, food] })),
  );
  assert.throws(() =>
    parseState(
      JSON.stringify({
        ...initialState,
        customFoods: [{ ...food, photoId: "../outside" }],
      }),
    ),
  );
});
test("portion scales calories and all macros without rounding intermediate values", () => {
  const f = foods.find((f) => f.id === "chicken");
  assert.deepEqual(nutrition(f, 150), {
    kcal: 247.5,
    protein: 46.5,
    carbs: 0,
    fat: 5.4,
  });
  assert.throws(() => nutrition(f, -1));
  assert.throws(() => nutrition(f, NaN));
});
test("daily totals isolate dates and sum different servings", () => {
  const entries = [
    {
      id: "1",
      foodId: "chicken",
      grams: 150,
      meal: "กลางวัน",
      date: "2026-09-13",
    },
    { id: "2", foodId: "rice", grams: 160, meal: "เย็น", date: "2026-09-13" },
    { id: "3", foodId: "egg", grams: 50, meal: "เช้า", date: "2026-09-12" },
  ];
  assert.equal(totals(entries, "2026-09-13").kcal, 455.5);
  assert.equal(totals(entries, "2026-09-12").kcal, 78);
  assert.equal(totals(entries, "2026-09-14").kcal, 0);
});
test("same-day weight replaces existing point and history stays chronological", () => {
  const saved = saveWeight(
    [
      { date: "2026-09-13", value: 70 },
      { date: "2026-09-12", value: 71 },
    ],
    "2026-09-13",
    68.5,
  );
  assert.deepEqual(saved, [
    { date: "2026-09-12", value: 71 },
    { date: "2026-09-13", value: 68.5 },
  ]);
  assert.throws(() => saveWeight([], "2026-09-13", 0));
  assert.throws(() => saveWeight([], "2026-09-13", Infinity));
});
test("storage roundtrip preserves food, water, favorites and profile", () => {
  const d = {
    ...initialState,
    entries: [
      { id: "a", foodId: "egg", grams: 50, meal: "เช้า", date: "2026-09-13" },
    ],
    water: { "2026-09-13": 250 },
    favorites: ["egg"],
  };
  assert.deepEqual(parseState(JSON.stringify(d)), d);
});
test("corrupt storage rejected rather than silently overwriting it", () => {
  assert.throws(() => parseState("{"));
  assert.throws(() =>
    parseState(
      JSON.stringify({
        ...initialState,
        profile: { ...initialState.profile, calories: 0 },
      }),
    ),
  );
  assert.throws(() =>
    parseState(
      JSON.stringify({ ...initialState, entries: [{ foodId: "missing" }] }),
    ),
  );
  assert.throws(() =>
    parseState(
      JSON.stringify({ ...initialState, water: { "2026-09-13": -250 } }),
    ),
  );
});
test("date navigation handles month/year boundaries and leap days", () => {
  assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDate("2024-03-01", -1), "2024-02-29");
  assert.equal(dateKey(new Date(2026, 8, 13, 0, 1)), "2026-09-13");
});
