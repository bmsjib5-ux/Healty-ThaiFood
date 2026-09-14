import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPet,
  isPetSpecies,
  petMood,
  petShape,
  shapeWidth,
  species,
  speciesInfo,
} from "../src/pet.ts";
import { initialState, parseState } from "../src/model.ts";

test("build follows the latest weigh-in against the target", () => {
  assert.equal(petShape(52, 65), "slim");
  assert.equal(petShape(65, 65), "fit");
  assert.equal(petShape(70, 65), "chubby");
  assert.equal(petShape(80, 65), "round");
});

test("a diary with no weigh-in shows a neutral build, not a starving one", () => {
  assert.equal(petShape(undefined, 65), "fit");
});

test("build thresholds are continuous and ordered by weight", () => {
  const order = ["slim", "fit", "chubby", "round"];
  let last = 0;
  for (let w = 40; w <= 100; w += 0.5) {
    const index = order.indexOf(petShape(w, 65));
    assert.ok(index >= last, `build went backwards at ${w} kg`);
    last = index;
  }
  // Every step is reachable, and a wider build never draws narrower.
  assert.deepEqual(new Set(order.map((k) => typeof shapeWidth[k])), new Set(["number"]));
  for (let i = 1; i < order.length; i++)
    assert.ok(shapeWidth[order[i]] > shapeWidth[order[i - 1]]);
});

test("mood follows the day's energy against the goal", () => {
  assert.equal(petMood(0, 1800), "hungry");
  assert.equal(petMood(300, 1800), "peckish");
  assert.equal(petMood(1000, 1800), "content");
  assert.equal(petMood(1750, 1800), "full");
  assert.equal(petMood(1800, 1800), "full");
  assert.equal(petMood(2400, 1800), "stuffed");
});

test("an unusable goal reads as neutral rather than permanently overeaten", () => {
  assert.equal(petMood(500, 0), "content");
  assert.equal(petMood(500, Number.NaN), "content");
  assert.equal(petMood(Number.NaN, 1800), "hungry");
  assert.equal(petMood(-5, 1800), "hungry");
});

test("every species is drawable and has a Thai name", () => {
  for (const sp of species) {
    assert.ok(isPetSpecies(sp.id));
    assert.equal(speciesInfo(sp.id), sp);
    assert.ok(sp.name.length > 0);
    for (const colour of [sp.fur, sp.belly, sp.accent])
      assert.match(colour, /^#[0-9A-Fa-f]{6}$/);
  }
  assert.equal(new Set(species.map((sp) => sp.id)).size, species.length);
  assert.ok(isPetSpecies(defaultPet.species));
});

test("unknown species are rejected rather than drawn", () => {
  assert.equal(isPetSpecies("dragon"), false);
  assert.equal(isPetSpecies(undefined), false);
  assert.throws(() => speciesInfo("dragon"));
});

test("a diary saved before the avatar existed migrates to the default pet", () => {
  const { pet, ...old } = initialState;
  assert.deepEqual(parseState(JSON.stringify(old)).pet, defaultPet);
});

test("a diary naming a species the app cannot draw is rejected", () => {
  assert.throws(
    () =>
      parseState(JSON.stringify({ ...initialState, pet: { species: "dragon" } })),
    /ข้อมูลที่บันทึกไว้ไม่ถูกต้อง/,
  );
});

test("choosing a pet leaves the rest of the diary untouched", () => {
  const saved = { ...initialState, pet: { species: "penguin" } };
  const parsed = parseState(JSON.stringify(saved));
  assert.equal(parsed.pet.species, "penguin");
  assert.deepEqual(parsed.entries, []);
  assert.deepEqual(parsed.profile, initialState.profile);
});
