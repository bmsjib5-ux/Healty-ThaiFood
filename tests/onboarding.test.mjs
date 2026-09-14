import test from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  activities,
  bmi,
  bmiBand,
  bmr,
  goalEffort,
  goals,
  healthyWeightRange,
  inRange,
  isActivity,
  isGoal,
  isPace,
  isSex,
  paces,
  sexes,
  targets,
  tdee,
  weeklyRate,
  weeksToTarget,
} from "../src/onboarding.ts";
import { initialState, parseState } from "../src/model.ts";

const base = {
  goal: "lose",
  sex: "female",
  age: 28,
  height: 163,
  weight: 70,
  targetWeight: 62,
  activity: "light",
  pace: "steady",
};

test("BMR follows Mifflin-St Jeor, and an unstated sex sits between the two", () => {
  const female = bmr({ sex: "female", age: 28, height: 163, weight: 70 });
  const male = bmr({ sex: "male", age: 28, height: 163, weight: 70 });
  const unspecified = bmr({ sex: "unspecified", age: 28, height: 163, weight: 70 });
  // 10*70 + 6.25*163 - 5*28 - 161 = 1417.75
  assert.equal(Math.round(female), 1418);
  assert.equal(Math.round(male - female), 166);
  assert.ok(unspecified > female && unspecified < male);
});

test("activity multiplies maintenance in the documented order", () => {
  const seen = activities.map((a) => tdee({ ...base, activity: a.id }));
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] > seen[i - 1]);
  assert.equal(Math.round(tdee({ ...base, activity: "sedentary" })), Math.round(bmr(base) * 1.2));
});

test("BMI and the healthy range agree with each other", () => {
  assert.equal(Math.round(bmi(70, 163) * 10) / 10, 26.3);
  const [lo, hi] = healthyWeightRange(163);
  assert.equal(bmiBand(bmi(lo + 0.1, 163)), "healthy");
  assert.equal(bmiBand(bmi(hi - 0.1, 163)), "healthy");
  assert.equal(bmiBand(bmi(lo - 1, 163)), "under");
  assert.throws(() => bmi(70, 0));
});

test("BMI bands use the Asia-Pacific cut-offs, not the international ones", () => {
  // 24 is "overweight" here but still "normal" on the international scale.
  assert.equal(bmiBand(18.4), "under");
  assert.equal(bmiBand(22.9), "healthy");
  assert.equal(bmiBand(24), "raised");
  assert.equal(bmiBand(27), "high");
  assert.equal(bmiBand(31), "veryHigh");
});

test("goals that are not about the scale plan no weekly change", () => {
  for (const goal of ["maintain", "health"])
    assert.equal(weeklyRate({ ...base, goal }), 0);
  assert.equal(weeksToTarget({ ...base, goal: "maintain" }), null);
});

test("a target at or above today's weight never plans a loss", () => {
  assert.equal(weeklyRate({ ...base, targetWeight: 70 }), 0);
  assert.equal(weeklyRate({ ...base, targetWeight: 80 }), 0);
});

test("the weekly rate is capped at 1% of body weight", () => {
  // A brisk 0.75 kg/week would be 1.9% of a 40 kg body, so it is capped to 0.4.
  const light = weeklyRate({ ...base, weight: 40, targetWeight: 35, pace: "brisk" });
  assert.equal(Math.round(light * 100) / 100, 0.4);
  // At 100 kg the cap is above the chosen pace, so the choice stands.
  const heavy = weeklyRate({ ...base, weight: 100, targetWeight: 80, pace: "brisk" });
  assert.equal(heavy, 0.75);
});

test("a faster pace means fewer calories, and every pace stays above the floor", () => {
  const cals = paces.map((p) => targets({ ...base, pace: p.id }).calories);
  for (let i = 1; i < cals.length; i++) assert.ok(cals[i] < cals[i - 1]);
  for (const c of cals) assert.ok(c >= 1200, `${c} kcal is below the floor`);
});

test("the calorie floor holds even for a small body on the fastest pace", () => {
  const extreme = { ...base, sex: "female", weight: 45, height: 150, age: 60, targetWeight: 40, pace: "brisk", activity: "sedentary" };
  const t = targets(extreme);
  assert.ok(t.calories >= 1200, `${t.calories} kcal`);
  assert.equal(t.floored, true);
  // A comfortable plan is not floored, and says so.
  assert.equal(targets({ ...base, goal: "maintain" }).floored, false);
});

test("macros add up to roughly the calorie target and are never negative", () => {
  for (const goal of goals.map((g) => g.id))
    for (const pace of paces.map((p) => p.id)) {
      const t = targets({ ...base, goal, pace });
      assert.ok(t.protein > 0 && t.fat > 0 && t.carbs >= 0);
      const fromMacros = t.protein * 4 + t.carbs * 4 + t.fat * 9;
      assert.ok(
        Math.abs(fromMacros - t.calories) <= 30,
        `${goal}/${pace}: macros ${fromMacros} vs ${t.calories}`,
      );
    }
});

test("water sits inside sane bounds for any body", () => {
  for (const weight of [30, 60, 120, 300]) {
    const { water } = targets({ ...base, weight, targetWeight: weight });
    assert.ok(water >= 1500 && water <= 4000, `${weight}kg -> ${water}ml`);
  }
});

test("goal effort is reported as a share of body weight", () => {
  assert.equal(goalEffort({ ...base, weight: 70, targetWeight: 68 }).hard, false);
  const hard = goalEffort({ ...base, weight: 70, targetWeight: 50 });
  assert.ok(hard.hard);
  assert.ok(Math.abs(hard.percent - 28.6) < 0.1);
});

test("weeks to target follow the planned rate", () => {
  // 8 kg at a steady 0.5 kg/week.
  assert.equal(weeksToTarget({ ...base, weight: 70, targetWeight: 62, pace: "steady" }), 16);
  assert.equal(weeksToTarget({ ...base, weight: 70, targetWeight: 70 }), null);
});

test("the answer guards accept every listed option and nothing else", () => {
  for (const x of sexes) assert.ok(isSex(x.id));
  for (const x of activities) assert.ok(isActivity(x.id));
  for (const x of goals) assert.ok(isGoal(x.id));
  for (const x of paces) assert.ok(isPace(x.id));
  for (const bad of ["", "other", null, 1])
    assert.ok(!isSex(bad) && !isActivity(bad) && !isGoal(bad) && !isPace(bad));
});

test("range checks match the stated limits", () => {
  for (const key of Object.keys(LIMITS)) {
    const [lo, hi] = LIMITS[key];
    assert.ok(inRange(lo, key) && inRange(hi, key));
    assert.ok(!inRange(lo - 0.1, key) && !inRange(hi + 0.1, key));
    assert.ok(!inRange(Number.NaN, key));
  }
});

test("a diary saved before the questions existed is treated as already answered", () => {
  const { onboarded, sex, age, height, activity, goal, pace, ...oldProfile } =
    initialState.profile;
  const parsed = parseState(
    JSON.stringify({ ...initialState, profile: oldProfile }),
  );
  assert.equal(parsed.profile.onboarded, true);
  assert.equal(parsed.profile.sex, "unspecified");
  assert.equal(parsed.profile.height, 165);
  // The targets they had already set are untouched by the migration.
  assert.equal(parsed.profile.calories, initialState.profile.calories);
});

test("a fresh diary has not been onboarded", () => {
  assert.equal(initialState.profile.onboarded, false);
});

test("a stored profile with an impossible answer is rejected", () => {
  const bad = [
    { sex: "other" },
    { activity: "extreme" },
    { goal: "vibes" },
    { pace: "instant" },
    { age: 5 },
    { age: 500 },
    { height: 10 },
    { onboarded: "yes" },
  ];
  for (const patch of bad)
    assert.throws(
      () =>
        parseState(
          JSON.stringify({
            ...initialState,
            profile: { ...initialState.profile, onboarded: true, ...patch },
          }),
        ),
      /ข้อมูลที่บันทึกไว้ไม่ถูกต้อง/,
      `should reject ${JSON.stringify(patch)}`,
    );
});
