import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, ChevronLeft, Minus, Plus, X } from "lucide-react-native";
import { C, s } from "./styles.ts";
import { PetAvatar } from "./PetAvatar.tsx";
import {
  MAX_PET_NAME,
  cleanPetName,
  species,
  type Pet,
  type PetSpecies,
} from "./pet.ts";
import {
  LIMITS,
  activities,
  bmi,
  bmiBand,
  bmiBands,
  goalEffort,
  goals,
  healthyWeightRange,
  inRange,
  paces,
  sexes,
  targets,
  weeklyRate,
  weeksToTarget,
  type Activity,
  type Answers,
  type Goal,
  type Pace,
  type Sex,
} from "./onboarding.ts";
import type { Profile } from "./model.ts";

type StepId =
  | "goal"
  | "sex"
  | "age"
  | "height"
  | "weight"
  | "targetWeight"
  | "activity"
  | "pace"
  | "pet"
  | "plan";

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toString();

function Title({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={{ gap: 8, marginBottom: 22 }}>
      <Text style={[s.title, { fontSize: 25, lineHeight: 40 }]}>{title}</Text>
      {!!detail && <Text style={[s.text, s.subtitle]}>{detail}</Text>}
    </View>
  );
}

function Choice({
  label,
  detail,
  active,
  onPress,
}: {
  label: string;
  detail?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.choice, active && s.choiceOn]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.text, s.label, active && { color: C.green }]}>
          {label}
        </Text>
        {!!detail && <Text style={[s.text, s.caption]}>{detail}</Text>}
      </View>
      <View style={[s.radio, active && { backgroundColor: C.green, borderColor: C.green }]}>
        {active && <Check size={14} color="white" />}
      </View>
    </Pressable>
  );
}

function NumberStep({
  value,
  onChange,
  unit,
  step = 1,
  limit,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  step?: number;
  limit: keyof typeof LIMITS;
}) {
  const nudge = (by: number) => {
    const n = Number(value);
    const [lo, hi] = LIMITS[limit];
    const next = Math.min(hi, Math.max(lo, (Number.isFinite(n) ? n : lo) + by));
    onChange(fmt1(next));
  };
  const [lo, hi] = LIMITS[limit];
  return (
    <View style={{ gap: 12 }}>
      <View style={[s.row, { justifyContent: "center", gap: 18 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`ลด ${step}`}
          onPress={() => nudge(-step)}
          style={s.stepper}
        >
          <Minus size={22} color={C.green} />
        </Pressable>
        <View style={[s.row, { alignItems: "flex-end", gap: 6 }]}>
          <TextInput
            accessibilityLabel={`ค่าที่กรอก (${unit})`}
            value={value}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            inputMode="decimal"
            style={s.bigInput}
          />
          <Text style={[s.text, s.caption, { marginBottom: 14 }]}>{unit}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`เพิ่ม ${step}`}
          onPress={() => nudge(step)}
          style={s.stepper}
        >
          <Plus size={22} color={C.green} />
        </Pressable>
      </View>
      <Text style={[s.text, s.caption, { textAlign: "center" }]}>
        กรอกได้ระหว่าง {lo}–{hi} {unit}
      </Text>
    </View>
  );
}

function Readout({
  tone = "soft",
  title,
  children,
}: {
  tone?: "soft" | "warn";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        s.summary,
        { marginTop: 20, gap: 6 },
        tone === "warn" && { backgroundColor: "#FFF0E8" },
      ]}
    >
      <Text style={[s.text, s.label]}>{title}</Text>
      {children}
    </View>
  );
}

export function Onboarding({
  pet,
  profile,
  weightKg,
  onDone,
  onCancel,
}: {
  pet: Pet;
  /** Current answers, so revisiting the questions starts from them. */
  profile?: Profile;
  /** Latest weigh-in, which is the honest starting point for the weight step. */
  weightKg?: number;
  onDone: (profile: Partial<Profile>, pet: Pet, weightKg: number) => void;
  /** Supplied only when the questions are being revisited, never at setup. */
  onCancel?: () => void;
}) {
  const startWeight = String(
    weightKg ?? profile?.targetWeight ?? 65,
  );
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? "health");
  const [sex, setSex] = useState<Sex>(profile?.sex ?? "unspecified");
  const [activity, setActivity] = useState<Activity>(
    profile?.activity ?? "light",
  );
  const [pace, setPace] = useState<Pace>(profile?.pace ?? "steady");
  const [age, setAge] = useState(String(profile?.age ?? 30));
  const [height, setHeight] = useState(String(profile?.height ?? 165));
  const [weight, setWeight] = useState(startWeight);
  const [targetWeight, setTargetWeight] = useState(
    String(profile?.targetWeight ?? startWeight),
  );
  const [petSpecies, setPetSpecies] = useState<PetSpecies>(pet.species);
  const [petName, setPetName] = useState(pet.name ?? "");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");

  // Pace only changes anything when the plan is meant to move the scale.
  const scaleGoal = goal === "lose" || goal === "gain";
  const order: StepId[] = [
    "goal",
    "sex",
    "age",
    "height",
    "weight",
    ...((scaleGoal ? ["targetWeight"] : []) as StepId[]),
    "activity",
    ...((scaleGoal ? ["pace"] : []) as StepId[]),
    "pet",
    "plan",
  ];
  const step = order[Math.min(index, order.length - 1)];

  const answers: Answers = {
    goal,
    sex,
    activity,
    pace,
    age: Number(age),
    height: Number(height),
    weight: Number(weight),
    // Goals that are not about the scale keep the target equal to today's
    // weight, so nothing downstream plans a deficit.
    targetWeight: scaleGoal ? Number(targetWeight) : Number(weight),
  };

  function problem(): string {
    if (step === "age" && !inRange(answers.age, "age"))
      return `กรอกอายุระหว่าง ${LIMITS.age[0]}–${LIMITS.age[1]} ปี`;
    if (step === "height" && !inRange(answers.height, "height"))
      return `กรอกส่วนสูงระหว่าง ${LIMITS.height[0]}–${LIMITS.height[1]} ซม.`;
    if (step === "weight" && !inRange(answers.weight, "weight"))
      return `กรอกน้ำหนักระหว่าง ${LIMITS.weight[0]}–${LIMITS.weight[1]} กก.`;
    if (step === "targetWeight") {
      if (!inRange(answers.targetWeight, "weight"))
        return `กรอกน้ำหนักระหว่าง ${LIMITS.weight[0]}–${LIMITS.weight[1]} กก.`;
      if (goal === "lose" && answers.targetWeight > answers.weight)
        return "เป้าหมายลดน้ำหนักควรน้อยกว่าน้ำหนักปัจจุบัน";
      if (goal === "gain" && answers.targetWeight < answers.weight)
        return "เป้าหมายเพิ่มน้ำหนักควรมากกว่าน้ำหนักปัจจุบัน";
    }
    if (step === "pet" && petName.trim().length > MAX_PET_NAME)
      return `ตั้งชื่อได้ไม่เกิน ${MAX_PET_NAME} ตัวอักษร`;
    return "";
  }

  function next() {
    const bad = problem();
    if (bad) {
      setError(bad);
      return;
    }
    setError("");
    if (step === "plan") {
      const t = targets(answers);
      const name = cleanPetName(petName);
      onDone(
        {
          calories: t.calories,
          protein: t.protein,
          carbs: t.carbs,
          fat: t.fat,
          water: t.water,
          targetWeight: answers.targetWeight,
          sex,
          age: answers.age,
          height: answers.height,
          activity,
          goal,
          pace,
          onboarded: true,
        },
        { species: petSpecies, ...(name ? { name } : {}) },
        answers.weight,
      );
      return;
    }
    setIndex((i) => i + 1);
  }

  const bodyMass = inRange(answers.weight, "weight") && inRange(answers.height, "height")
    ? bmi(answers.weight, answers.height)
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <View style={s.onboardBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
          disabled={index === 0}
          onPress={() => {
            setError("");
            setIndex((i) => Math.max(0, i - 1));
          }}
          style={[s.iconButton, index === 0 && { opacity: 0.3 }]}
        >
          <ChevronLeft size={22} color={C.green} />
        </Pressable>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${((index + 1) / order.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={[s.text, s.label]}>
          {index + 1} / {order.length}
        </Text>
        {!!onCancel && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ปิดหน้าต่าง"
            onPress={onCancel}
            style={s.iconButton}
          >
            <X size={21} color={C.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 22, paddingBottom: 30 }}
      >
        {step === "goal" && (
          <>
            <Title title="เป้าหมายหลักของคุณคืออะไร?" />
            {goals.map((g) => (
              <Choice
                key={g.id}
                label={g.label}
                detail={g.detail}
                active={goal === g.id}
                onPress={() => setGoal(g.id)}
              />
            ))}
          </>
        )}

        {step === "sex" && (
          <>
            <Title
              title="เพศของคุณ"
              detail="ใช้ประกอบการประมาณพลังงานที่ร่างกายใช้ เลือกไม่ระบุก็ได้"
            />
            {sexes.map((x) => (
              <Choice
                key={x.id}
                label={x.label}
                active={sex === x.id}
                onPress={() => setSex(x.id)}
              />
            ))}
          </>
        )}

        {step === "age" && (
          <>
            <Title
              title="อายุของคุณเท่าไหร่?"
              detail="พลังงานที่ร่างกายใช้ต่อวันเปลี่ยนไปตามอายุ"
            />
            <NumberStep
              value={age}
              onChange={(v) => {
                setAge(v);
                setError("");
              }}
              unit="ปี"
              limit="age"
            />
          </>
        )}

        {step === "height" && (
          <>
            <Title
              title="ส่วนสูงของคุณเท่าไหร่?"
              detail="ส่วนสูงกับน้ำหนักเป็นตัวตั้งต้นของการประมาณพลังงาน"
            />
            <NumberStep
              value={height}
              onChange={(v) => {
                setHeight(v);
                setError("");
              }}
              unit="ซม."
              limit="height"
            />
          </>
        )}

        {step === "weight" && (
          <>
            <Title title="น้ำหนักปัจจุบันของคุณเท่าไหร่?" />
            <NumberStep
              value={weight}
              onChange={(v) => {
                setWeight(v);
                setError("");
                if (!scaleGoal) setTargetWeight(v);
              }}
              unit="กก."
              step={0.5}
              limit="weight"
            />
            {bodyMass !== null && (
              <Readout title="ดัชนีมวลกาย (BMI)">
                <Text style={[s.text, s.bigNumber, { fontSize: 30, lineHeight: 44 }]}>
                  {fmt1(bodyMass)}
                  <Text style={[s.text, s.caption]}>
                    {"  "}
                    {bmiBands.find((b) => b.id === bmiBand(bodyMass))?.label}
                  </Text>
                </Text>
                <Text style={[s.text, s.caption]}>
                  ช่วงน้ำหนักสมส่วนสำหรับส่วนสูงนี้คือ{" "}
                  {healthyWeightRange(answers.height)[0]}–
                  {healthyWeightRange(answers.height)[1]} กก.
                </Text>
                <Text style={[s.text, s.caption]}>
                  ใช้เกณฑ์เอเชียแปซิฟิก ซึ่งต่างจากเกณฑ์สากล และเป็นการประเมิน
                  คร่าว ๆ ไม่ใช่การวินิจฉัยทางการแพทย์
                </Text>
              </Readout>
            )}
          </>
        )}

        {step === "targetWeight" && (
          <>
            <Title
              title="น้ำหนักที่อยากไปให้ถึงคือเท่าไหร่?"
              detail="ตัวเลขนี้มีผลกับพลังงานต่อวันที่แอปจะตั้งให้"
            />
            <NumberStep
              value={targetWeight}
              onChange={(v) => {
                setTargetWeight(v);
                setError("");
              }}
              unit="กก."
              step={0.5}
              limit="weight"
            />
            {inRange(answers.targetWeight, "weight") && (
              <Readout
                title={goalEffort(answers).label}
                tone={goalEffort(answers).hard ? "warn" : "soft"}
              >
                <Text style={[s.text, s.caption]}>
                  ต่างจากน้ำหนักตอนนี้{" "}
                  {fmt1(Math.abs(answers.weight - answers.targetWeight))} กก. (
                  {fmt1(goalEffort(answers).percent)}% ของน้ำหนักตัว)
                </Text>
                {goalEffort(answers).hard && (
                  <Text style={[s.text, s.caption]}>
                    เป้าหมายที่ห่างมากใช้เวลานานและมักต้องมีคนช่วยดูแล
                    ลองตั้งเป้าใกล้ ๆ ก่อนแล้วค่อยขยับก็ได้
                  </Text>
                )}
              </Readout>
            )}
          </>
        )}

        {step === "activity" && (
          <>
            <Title
              title="ปกติคุณขยับตัวมากแค่ไหน?"
              detail="รวมทั้งการทำงาน เดิน และการออกกำลังกาย"
            />
            {activities.map((a) => (
              <Choice
                key={a.id}
                label={a.label}
                detail={a.detail}
                active={activity === a.id}
                onPress={() => setActivity(a.id)}
              />
            ))}
          </>
        )}

        {step === "pace" && (
          <>
            <Title
              title="อยากไปถึงเป้าหมายเร็วแค่ไหน?"
              detail="ยิ่งเร็วยิ่งต้องกินน้อยลง ซึ่งทำต่อเนื่องได้ยากกว่า"
            />
            {paces.map((p) => (
              <Choice
                key={p.id}
                label={p.label}
                detail={`ประมาณ ${p.kgPerWeek} กก. ต่อสัปดาห์`}
                active={pace === p.id}
                onPress={() => setPace(p.id)}
              />
            ))}
            {weeksToTarget(answers) !== null && (
              <Readout title="ถ้าทำได้ตามนี้">
                <Text style={[s.text, s.caption]}>
                  จะถึงเป้าหมายในราว {weeksToTarget(answers)} สัปดาห์ (
                  {fmt1(Math.abs(weeklyRate(answers)))} กก. ต่อสัปดาห์)
                </Text>
              </Readout>
            )}
          </>
        )}

        {step === "pet" && (
          <>
            <Title
              title="เลือกเพื่อนร่วมทางของคุณ"
              detail="ตัวละครจะอ้วนหรือผอมตามน้ำหนัก และหิวหรืออิ่มตามมื้อที่บันทึก"
            />
            <View style={s.petGrid}>
              {species.map((sp) => (
                <Pressable
                  key={sp.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: petSpecies === sp.id }}
                  accessibilityLabel={sp.name}
                  onPress={() => setPetSpecies(sp.id)}
                  style={[
                    s.petChoice,
                    petSpecies === sp.id && {
                      borderColor: C.green,
                      backgroundColor: C.soft,
                    },
                  ]}
                >
                  <PetAvatar species={sp.id} shape="fit" mood="content" size={92} />
                  <Text style={[s.text, s.label]}>{sp.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ gap: 7, marginTop: 18 }}>
              <Text style={[s.text, s.label]}>
                ตั้งชื่อ (ไม่เกิน {MAX_PET_NAME} ตัวอักษร เว้นว่างได้)
              </Text>
              <TextInput
                accessibilityLabel="ตั้งชื่อสัตว์เลี้ยง"
                value={petName}
                onChangeText={(v) => {
                  setPetName(v);
                  setError("");
                }}
                style={s.input}
              />
            </View>
          </>
        )}

        {step === "plan" && (
          <>
            <Title
              title={onCancel ? "เป้าหมายใหม่ของคุณ" : "แผนของคุณพร้อมแล้ว"}
              detail={
                onCancel
                  ? "บันทึกแล้วจะแทนที่เป้าหมายรายวันเดิม รวมถึงตัวเลขที่เคยปรับเอง"
                  : "ปรับตัวเลขทั้งหมดนี้ได้ทีหลังในแท็บโปรไฟล์"
              }
            />
            {(() => {
              const t = targets(answers);
              return (
                <View style={{ gap: 14 }}>
                  <View style={[s.summary, { alignItems: "center", gap: 4 }]}>
                    <Text style={[s.text, s.caption]}>พลังงานต่อวัน</Text>
                    <Text style={[s.text, s.bigNumber]}>
                      {t.calories.toLocaleString("en-US")}
                      <Text style={[s.text, s.caption]}> kcal</Text>
                    </Text>
                  </View>
                  <View style={[s.row, { gap: 10 }]}>
                    {[
                      ["โปรตีน", `${t.protein} ก.`],
                      ["คาร์บ", `${t.carbs} ก.`],
                      ["ไขมัน", `${t.fat} ก.`],
                    ].map(([label, value]) => (
                      <View key={label} style={[s.summary, { flex: 1, alignItems: "center", gap: 2 }]}>
                        <Text style={[s.text, s.caption]}>{label}</Text>
                        <Text style={[s.text, s.label]}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[s.summary, { gap: 4 }]}>
                    <Text style={[s.text, s.caption]}>
                      น้ำดื่มต่อวัน {t.water.toLocaleString("en-US")} มล.
                    </Text>
                    {weeksToTarget(answers) !== null && (
                      <Text style={[s.text, s.caption]}>
                        ถ้าทำได้ตามนี้จะถึงเป้าหมายในราว{" "}
                        {weeksToTarget(answers)} สัปดาห์
                      </Text>
                    )}
                  </View>
                  {t.floored && (
                    <View style={s.notice}>
                      <Text style={[s.text, s.caption]}>
                        ความเร็วที่เลือกจะทำให้พลังงานต่ำกว่าที่ควร
                        แอปจึงตั้งไว้ที่ขั้นต่ำ {t.calories.toLocaleString("en-US")} kcal
                        แทน การกินน้อยกว่านี้ต่อเนื่องควรอยู่ในความดูแลของแพทย์
                      </Text>
                    </View>
                  )}
                  <Text style={[s.text, s.caption]}>
                    ตัวเลขเหล่านี้เป็นค่าประมาณจากสูตรมาตรฐาน (Mifflin-St Jeor)
                    สำหรับผู้ใหญ่สุขภาพดี ไม่ใช่คำแนะนำทางการแพทย์
                    หากมีโรคประจำตัว กำลังตั้งครรภ์ หรือให้นมบุตร ควรปรึกษาแพทย์
                  </Text>
                </View>
              );
            })()}
          </>
        )}

        {!!error && (
          <Text accessibilityRole="alert" style={[s.error, { marginTop: 16 }]}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={{ padding: 22, paddingTop: 8 }}>
        <Pressable
          accessibilityRole="button"
          onPress={next}
          style={({ pressed }) => [s.button, pressed && { opacity: 0.75 }]}
        >
          <Check size={19} color="white" />
          <Text style={[s.text, s.buttonText]}>
            {step !== "plan"
              ? "ดำเนินการต่อ"
              : onCancel
                ? "บันทึกเป้าหมายใหม่"
                : "เริ่มใช้งาน"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
