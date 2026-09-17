import test from "node:test";
import assert from "node:assert/strict";
import { artFor, scenes } from "../src/foodArt.ts";
import { shade } from "../src/color.ts";
import { foods, foodCategories } from "../src/model.ts";

test("every food in the catalogue gets a picture it can actually draw", () => {
  for (const f of foods) {
    const art = artFor(f);
    assert.ok(scenes.includes(art.scene), `${f.name}: ${art.scene}`);
    assert.match(art.tint, /^#[0-9A-Fa-f]{6}$/, f.name);
    // The painters shade the tint in both directions; a colour the shader
    // rejects would throw mid-render and take the food list down.
    for (const amount of [0.5, 0.26, 0, -0.3, -0.5])
      assert.match(shade(art.tint, amount), /^#[0-9a-f]{6}$/, f.name);
  }
});

test("a food the user typed in still gets a picture", () => {
  for (const category of [...foodCategories, "หมวดที่ไม่มีอยู่"]) {
    const art = artFor({ name: "อะไรก็ไม่รู้", category });
    assert.ok(scenes.includes(art.scene), category);
    assert.match(art.tint, /^#[0-9A-Fa-f]{6}$/);
  }
});

// Thai has no spaces, so a keyword lands inside words that mean something else.
// Each of these was wrong at some point while the rules were being ordered.
test("keywords buried inside other Thai words do not pick the picture", () => {
  const cases = [
    // "นม" (milk) sits inside ขนม (sweet) and แหนม (cured pork)
    ["ขนมจีนน้ำยา", "อาหารตามสั่ง", "bowl"],
    ["ขนมปังโฮลวีต", "อื่นๆ", "bread"],
    ["แหนม", "เนื้อสัตว์", "grill"],
    ["นมข้าวโอ๊ต", "นม ไข่", "bottle"],
    ["ซาลาเปาไส้หมู", "อาหารตามสั่ง", "bread"],
    // "ปลา"/"หอย" inside the names of seasonings
    ["น้ำปลา", "อื่นๆ", "dish"],
    ["ซอสหอยนางรม", "อื่นๆ", "dish"],
    // cooking words attached to things that are not meat
    ["ถั่วดำต้ม", "อื่นๆ", "nuts"],
    ["ผักบุ้งลวก", "ผัก ผลไม้", "greens"],
    ["ข้าวโพดต้ม", "ผัก ผลไม้", "greens"],
    // "กะเพรา" is a herb, but ข้าวกะเพรา is a plate of food
    ["ข้าวกะเพราไก่", "อาหารตามสั่ง", "plate"],
    ["ข้าวกะเพราไก่ไข่ดาว", "อาหารตามสั่ง", "plate"],
    ["ไข่ดาว", "นม ไข่", "egg"],
    // fried beats the plate it is served on
    ["ข้าวหมูกรอบ", "อาหารตามสั่ง", "fried"],
  ];
  for (const [name, category, scene] of cases)
    assert.equal(artFor({ name, category }).scene, scene, name);
});

test("a drink is drawn as the vessel it comes in", () => {
  const drink = (name) => artFor({ name, category: "เครื่องดื่ม" });
  for (const name of ["กาแฟดำไม่ใส่น้ำตาล", "ลาเต้ร้อน", "เอสเพรสโซ", "โกโก้ร้อน"])
    assert.equal(drink(name).scene, "mug", name);
  for (const name of ["น้ำอัดลม", "เครื่องดื่มเกลือแร่", "เบียร์", "น้ำวิตามิน"])
    assert.equal(drink(name).scene, "bottle", name);
  for (const name of ["ชาไทยเย็น", "น้ำเปล่า", "น้ำส้มคั้น", "น้ำเต้าหู้ไม่หวาน"])
    assert.equal(drink(name).scene, "glass", name);
});

test("a drink is painted the colour it is poured", () => {
  const tint = (name) => artFor({ name, category: "เครื่องดื่ม" }).tint;
  assert.equal(tint("ชาไทยเย็น"), "#E08A3C");
  assert.equal(tint("ชาเขียวเย็น"), "#7FA35A");
  assert.equal(tint("โอเลี้ยง"), "#6B4226");
  // "นม" straddles the seam of ชัน and มะ here, which used to paint it cream
  assert.equal(tint("น้ำอัญชันมะนาว"), "#7E6BC4");
  // sparkling water is not cola
  assert.equal(tint("น้ำแร่อัดลม"), "#BFE0EC");
  assert.equal(tint("น้ำอัดลม"), "#4A2B1E");
  assert.equal(tint("น้ำเปล่าผสมมะนาว"), "#BFE0EC");
});

test("the same food is always drawn the same way", () => {
  for (const f of foods.slice(0, 40))
    assert.deepEqual(artFor(f), artFor({ ...f }), f.name);
});
