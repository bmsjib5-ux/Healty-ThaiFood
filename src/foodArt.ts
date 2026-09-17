import type { Food } from "./model.ts";

// Which picture a food gets, and what colour to paint it. Kept apart from the
// drawing so the choice can be checked across the whole catalogue without a
// renderer, and so a food added later — including one the user types in — gets
// a sensible picture without anyone editing a lookup table by hand.
//
// Thai is written without spaces, so a keyword can appear inside a word that
// means something else entirely: "นม" (milk) sits inside ขนมจีน and even
// straddles the seam in น้ำอัญชันมะนาว. Order therefore carries meaning here —
// the specific pattern has to be tried before the general one — and the tests
// pin the cases that caught this out.
export type Scene =
  | "bowl"
  | "plate"
  | "grill"
  | "fried"
  | "greens"
  | "fruit"
  | "egg"
  | "glass"
  | "mug"
  | "bottle"
  | "bread"
  | "sweet"
  | "nuts"
  | "dish";
export type Art = { scene: Scene; tint: string };
export const scenes: Scene[] = [
  "bowl",
  "plate",
  "grill",
  "fried",
  "greens",
  "fruit",
  "egg",
  "glass",
  "mug",
  "bottle",
  "bread",
  "sweet",
  "nuts",
  "dish",
];

type Rule = [RegExp, Scene, string];
const pick = (name: string, rules: Rule[]): Art | null => {
  for (const [re, scene, tint] of rules)
    if (re.test(name)) return { scene, tint };
  return null;
};
const tintOf = (name: string, table: [RegExp, string][], fallback: string) =>
  table.find(([re]) => re.test(name))?.[1] ?? fallback;

/* ── drinks ────────────────────────────────────────────────────────────── */

const drinkTints: [RegExp, string][] = [
  [/น้ำเปล่า/, "#BFE0EC"],
  [/ชาไทย|ชานม|ชาเย็น/, "#E08A3C"],
  [/มัทฉะ|ชาเขียว/, "#7FA35A"],
  [/ลาเต้|คาปูชิโน|3 in 1|ยกล้อ/, "#B98E63"],
  [/กาแฟ|เอสเพรสโซ|อเมริกาโน|โอเลี้ยง|มอคค่า/, "#6B4226"],
  [/โกโก้|ไมโล|โอวัลติน/, "#6A4231"],
  [/อัญชัน/, "#7E6BC4"],
  [/กระเจี๊ยบ|ทับทิม|น้ำแดง|สละ/, "#C0392B"],
  [/แตงโม|ลิ้นจี่/, "#E8697D"],
  [/องุ่น|เบอร์รี/, "#8A5AA6"],
  [/มะเขือเทศ/, "#C74B3A"],
  [/แครอท|ส้ม|มะม่วง|เสาวรส|สับปะรด|ชูกำลัง|ผลไม้/, "#EFA02E"],
  [/มะนาว|ฝรั่ง|ใบเตย|ตะไคร้|ผักรวม/, "#9BBF5A"],
  [/นมชมพู/, "#F0A9BA"],
  [/^นม|ปั่นนม|เต้าหู้|โปรตีน|มะพร้าว/, "#F3EDDF"],
  [/เก๊กฮวย|ลำไย|อ้อย|บาร์เลย์|ขิง|ชาดำ|ชาอู่หลง|กล้วย|แอปเปิล|สาลี่/, "#DFBE63"],
  [/เฉาก๊วย/, "#3A3138"],
  [/เบียร์/, "#D9A441"],
  [/น้ำแร่|โซดา|เกลือแร่|วิตามิน/, "#BFE0EC"],
  [/อัดลม|โคล่า/, "#4A2B1E"],
];
function drinkArt(name: string): Art {
  const tint = tintOf(name, drinkTints, "#BFE0EC");
  const unsweetened = /ไม่หวาน|ไม่ใส่น้ำตาล/.test(name);
  // A sealed drink is drawn as the bottle or can it comes in, a drink served
  // hot as a cup, everything else as a tall glass over ice.
  const scene: Scene = /เกลือแร่|ชูกำลัง|วิตามิน|อัดลม|เบียร์/.test(name)
    ? "bottle"
    : /ร้อน|เอสเพรสโซ|คาปูชิโน|มัทฉะลาเต้|3 in 1/.test(name) ||
        (unsweetened && /ชา|กาแฟ|อเมริกาโน/.test(name))
      ? "mug"
      : "glass";
  return { scene, tint };
}

/* ── vegetables and fruit ──────────────────────────────────────────────── */

const vegetables =
  /ผัก|คะน้า|กะหล่ำ|ผักบุ้ง|บรอกโคลี|ตำลึง|โขม|สลัด|เห็ด|หน่อไม้|ถั่วฝักยาว|ถั่วงอก|ถั่วพู|แตงกวา|ฟัก|มะเขือ|บวบ|ข้าวโพด|แครอท|หัวไช|กระเจี๊ยบ|ชะอม|ขึ้นฉ่าย|โหระพา|กะเพรา|มะระ|ดอกแค|สะตอ|หัวหอม|ต้นหอม|ผักชี|พริก|ยอดมะพร้าว|บุก|สาหร่าย/;
const fruitTints: [RegExp, string][] = [
  [/กล้วย|มะละกอ|ขนุน|สับปะรด|มะม่วง|เสาวรส|พีช/, "#EFBB3C"],
  [/แอปเปิล|เชอร์รี|สตรอ|ลิ้นจี่|แตงโม|ทับทิม|ชมพู่/, "#D8484F"],
  [/องุ่นเขียว/, "#9BBF5A"],
  [/องุ่น|พรุน|บลูเบอร์รี|มัลเบอร์รี|มังคุด/, "#7B4B8A"],
  [/ส้ม|แคนตาลูป|ลูกแพร|ลูกพลับ/, "#F0922E"],
  [/ฝรั่ง|แก้วมังกร|อะโวคาโด|มะนาว|มะกอก|กีวี/, "#8FB755"],
  [/ลำไย|ลางสาด|ลองกอง|ละมุด|มะพร้าว|สาลี่|น้อยหน่า|ทุเรียน|เงาะ|สละ|พุทรา|มะขาม|กระท้อน/, "#D9B46A"],
];
const produceArt = (name: string): Art =>
  vegetables.test(name)
    ? { scene: "greens", tint: "#6E9B4E" }
    : { scene: "fruit", tint: tintOf(name, fruitTints, "#E2643F") };

/* ── everything else ───────────────────────────────────────────────────── */

const foodRules: Rule[] = [
  // Milk is matched at the start of the name, because "นม" also sits inside
  // ขนม (sweet) and แหนม (cured pork).
  [/^นม/, "bottle", "#F3EDDF"],
  // Sweets, several of which are named after a dish or a fruit.
  [/ไอศกรีม|ไอติม/, "sweet", "#F3D9B5"],
  [/ข้าวเหนียวมะม่วง/, "sweet", "#F2C14E"],
  [/ลอดช่อง|บัวลอย|ทับทิมกรอบ|บวชชี|ขนมครก|ขนมถ้วย|ขนมชั้น|เฉาก๊วย/, "sweet", "#E8D9BC"],
  [/ทองหยิบ|ฝอยทอง|ทองหยอด/, "sweet", "#EFC03B"],
  [/เค้ก|บราวนี่|โดนัท|คุกกี้|บิสกิต|พาย|ทาร์ต|เยลลี่|มาร์ชเมลโลว์|ช็อกโกแลต/, "sweet", "#B5793F"],
  [/ป๊อปคอร์น/, "nuts", "#EFD9A0"],
  // Bowls: soup, noodles and curry.
  [/ก๋วยเตี๋ยว|ก๋วยจั๊บ|บะหมี่|ราเมง|เกาเหลา|โจ๊ก|ข้าวต้ม|ซุป|เย็นตาโฟ|ขนมจีน|สุกี้น้ำ|เส้นเล็ก|เส้นใหญ่|วุ้นเส้นลวก|มาม่า/, "bowl", "#D8C08A"],
  [/ต้มยำ|ต้มแซ่บ/, "bowl", "#D8543A"],
  [/ต้มข่า|แกงจืด|ต้มจืด|แกงเลียง/, "bowl", "#EBDFC4"],
  [/เขียวหวาน/, "bowl", "#8FAE5C"],
  [/แกงส้ม/, "bowl", "#E08A3C"],
  [/แกง|พะแนง|มัสมั่น|ฉู่ฉี่|คั่วกลิ้ง|ผัดพริกแกง/, "bowl", "#C4632B"],
  [/ซีเรียล|ข้าวโอ๊ต|กราโนล่า/, "bowl", "#D9BE87"],
  // Dough, before the meats: ซาลาเปาไส้หมู and ขนมจีบ are not cuts of pork.
  [/ขนมปัง|โรตี|ตอร์ตียา|ครัวซอง|แซนด์วิช|เบอร์เกอร์|ซาลาเปา|ขนมจีบ|เกี๊ยว|พิซซ่า|บาแกตต์|ปัง/, "bread", "#C99657"],
  // Deep fried, before the plates: หมูกรอบ and ไก่ทอด are dishes too.
  [/ทอด|กรอบ|นักเก็ต|คาราอาเกะ|เฟรนช์ฟราย|ปาท่องโก๋|แผ่นทอด|อบกรอบ|ปลาดุกฟู/, "fried", "#D79A3C"],
  // Rice plates and stir fries.
  [/ข้าวสวย|ข้าวกล้อง|ข้าวเหนียว|ข้าวไรซ์|ข้าวหอม/, "plate", "#F2EADA"],
  [/ส้มตำ|ยำ|ลาบ|น้ำตก|พล่า/, "plate", "#CC5B3E"],
  [/สปาเกตตี|มักกะโรนี|พาสต้า/, "plate", "#E0C182"],
  [/ผัดผัก|สลัด/, "greens", "#6E9B4E"],
  [/ข้าว|ผัด|ราดหน้า|สุกี้|ซูชิ/, "plate", "#C98A3E"],
  // Eggs, after the plates so ข้าวกะเพราไก่ไข่ดาว stays a plate.
  [/ไข่/, "egg", "#F3B233"],
  // Seasonings and nuts come before the meats, so น้ำปลา and ซอสหอยนางรม
  // are not read as fish and ถั่วดำต้ม is not read as something boiled.
  [/น้ำมัน|กะทิ|มายองเนส|ซอส|น้ำปลา|ซีอิ๊ว|น้ำตาล|น้ำผึ้ง|น้ำพริก|พริกไทย|เกลือ/, "dish", "#C86A38"],
  [/ถั่วลิสง|เม็ดมะม่วง|อัลมอนด์|วอลนัท|พิสตาชิโอ|เมล็ด|เจีย|ถั่วแดง|ถั่วดำ|ถั่วขาว|ถั่วแระ/, "nuts", "#B8804B"],
  // Soy blocks read as a pale slab rather than as meat.
  [/เต้าหู้|เทมเป้/, "grill", "#EDE3CD"],
  // Meat and fish.
  [/แซลมอน|ทูน่า|ปลา|กุ้ง|ปู|หมึก|หอย|ทะเล/, "grill", "#E08A64"],
  [/ไก่|หมู|เนื้อ|เป็ด|แกะ|เบคอน|ไส้กรอก|แฮม|ตับ|แหนม|กุนเชียง/, "grill", "#B0663A"],
  [/ย่าง|เผา|สเต็ก|สเต๊ก|อบ|รมควัน|นึ่ง|ต้ม|ลวก|พะโล้/, "grill", "#A25B33"],
  // Dairy and the pantry.
  [/โยเกิร์ต|ชีส|มอสซาเรลลา|ครีม|เนย|เวย์/, "bottle", "#F3EDDF"],
  [/สาหร่าย|บุก/, "greens", "#5F8E52"],
];

const byCategory: Record<string, Art> = {
  อาหารตามสั่ง: { scene: "plate", tint: "#C98A3E" },
  เนื้อสัตว์: { scene: "grill", tint: "#B0663A" },
  "นม ไข่": { scene: "bottle", tint: "#F3EDDF" },
};

export function artFor(food: Pick<Food, "name" | "category">): Art {
  if (food.category === "เครื่องดื่ม") return drinkArt(food.name);
  if (food.category === "ผัก ผลไม้") return produceArt(food.name);
  // A food the user typed in lands on the fallback, so it has to be a picture
  // that suits anything rather than an apology.
  return (
    pick(food.name, foodRules) ??
    byCategory[food.category] ?? { scene: "dish", tint: "#C98A3E" }
  );
}
