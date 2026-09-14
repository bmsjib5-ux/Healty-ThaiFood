import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { NotoSansThai_400Regular } from "@expo-google-fonts/noto-sans-thai/400Regular";
import { NotoSansThai_500Medium } from "@expo-google-fonts/noto-sans-thai/500Medium";
import { NotoSansThai_600SemiBold } from "@expo-google-fonts/noto-sans-thai/600SemiBold";
import { NotoSansThai_700Bold } from "@expo-google-fonts/noto-sans-thai/700Bold";
import {
  BarChart3,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flame,
  Heart,
  Home,
  Leaf,
  Minus,
  PawPrint,
  Plus,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  User,
  Utensils,
  X,
} from "lucide-react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import {
  Food,
  Meal,
  Profile,
  State,
  dateKey,
  foods,
  initialState,
  meals,
  nutrition,
  parseState,
  saveWeight,
  shiftDate,
  totals,
} from "./src/model";
import { C, s } from "./src/styles";
import { FoodPhoto } from "./src/FoodPhoto";
import { CustomFoodModal } from "./src/CustomFoodModal";
import { PetAvatar } from "./src/PetAvatar";
import { PetStage } from "./src/PetStage";
import {
  MAX_PET_NAME,
  cleanPetName,
  moodText,
  petMood,
  petShape,
  petTitle,
  shapeLabel,
  shapeText,
  species,
  type PetSpecies,
} from "./src/pet.ts";
import * as ImagePicker from "expo-image-picker";

// Keeps the pre-rename key: renaming it would orphan every existing diary.
const STORE = "nutri-thai:v1";
type Tab = "today" | "food" | "trends" | "profile";
const tabs = [
  { id: "today" as Tab, label: "วันนี้", icon: Home },
  { id: "food" as Tab, label: "อาหาร", icon: Utensils },
  { id: "trends" as Tab, label: "สถิติ", icon: BarChart3 },
  { id: "profile" as Tab, label: "โปรไฟล์", icon: User },
];
const fmt = (v: number) => Math.round(v).toLocaleString("en-US");
const thaiDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
function T({ children, style, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text {...props} style={[s.text, style]}>
      {children}
    </Text>
  );
}
function Button({
  label,
  onPress,
  secondary = false,
  icon: Icon = Plus,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  icon?: typeof Plus;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Icon size={19} color={secondary ? C.green : "white"} />
      <T style={[s.buttonText, secondary && { color: C.green }]}>{label}</T>
    </Pressable>
  );
}
function IconButton({
  label,
  onPress,
  icon: Icon,
  color = C.green,
}: {
  label: string;
  onPress: () => void;
  icon: typeof Plus;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={s.iconButton}
    >
      <Icon size={21} color={color} />
    </Pressable>
  );
}
function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}
function Field({
  label,
  value,
  onChange,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      <T style={s.label}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "decimal-pad" : "default"}
        inputMode={numeric ? "decimal" : "text"}
        style={s.input}
      />
    </View>
  );
}
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        s.chip,
        active && { backgroundColor: C.green, borderColor: C.green },
      ]}
    >
      <T style={[s.chipText, active && { color: "white" }]}>{label}</T>
    </Pressable>
  );
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Leaf size={25} color={C.green} />
      </View>
      <T style={s.cardTitle}>{title}</T>
      <T style={[s.caption, { textAlign: "center" }]}>{detail}</T>
    </View>
  );
}
function Macro({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  return (
    <View style={[s.macro, { backgroundColor: color }]}>
      <View style={s.between}>
        <T style={s.label}>{label}</T>
        <T style={s.caption}>
          {fmt(value)} / {target} ก.
        </T>
      </View>
      <View style={s.track}>
        <View
          style={[
            s.fill,
            {
              width: `${Math.min(100, (value / target) * 100)}%`,
              backgroundColor:
                label === "โปรตีน"
                  ? "#D7856C"
                  : label === "คาร์บ"
                    ? "#9987CB"
                    : "#C5A149",
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AmHealtyApp />
    </SafeAreaProvider>
  );
}
function AmHealtyApp() {
  const [createOpen, setCreateOpen] = useState(false);
  const [recovered, setRecovered] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_500Medium,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
  });
  const [data, setData] = useState<State>(initialState),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState("");
  const [tab, setTab] = useState<Tab>("today"),
    [day, setDay] = useState(dateKey()),
    [today, setToday] = useState(dateKey()),
    [toast, setToast] = useState("");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("ทั้งหมด"),
    [selected, setSelected] = useState<Food | null>(null),
    [amount, setAmount] = useState("1"),
    [unit, setUnit] = useState<"serving" | "grams">("serving"),
    [meal, setMeal] = useState<Meal>("กลางวัน"),
    [error, setError] = useState("");
  const [petOpen, setPetOpen] = useState(false),
    [petNameDraft, setPetNameDraft] = useState(""),
    [petError, setPetError] = useState("");
  // Held here rather than in the pet: logging a meal returns to this tab and
  // remounts it, so the request to hop has to outlive that remount.
  const [celebrate, setCelebrate] = useState(0);
  const [weightOpen, setWeightOpen] = useState(false),
    [weight, setWeight] = useState(""),
    [period, setPeriod] = useState(30);
  const [draft, setDraft] = useState<Record<keyof Profile, string>>({
    name: "",
    calories: "1800",
    protein: "100",
    carbs: "225",
    fat: "56",
    water: "2000",
    targetWeight: "65",
  });
  const current = useRef(data),
    saveQueue = useRef(Promise.resolve()),
    scroll = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  useEffect(() => {
    if (Platform.OS !== "android") return;
    ImagePicker.getPendingResultAsync()
      .then((result) => {
        if (
          result &&
          "assets" in result &&
          !result.canceled &&
          result.assets?.[0]
        ) {
          setRecovered(result.assets[0]);
          setCreateOpen(true);
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    AsyncStorage.getItem(STORE)
      .then((raw) => {
        const value = raw ? parseState(raw) : initialState;
        current.current = value;
        setData(value);
        setDraft(
          Object.fromEntries(
            Object.entries(value.profile).map(([k, v]) => [k, String(v)]),
          ) as any,
        );
        setReady(true);
      })
      .catch(() =>
        setStorageError(
          "อ่านข้อมูลในเครื่องไม่สำเร็จ กรุณาปิดแล้วเปิดแอปใหม่ ข้อมูลเดิมยังไม่ถูกเขียนทับ",
        ),
      );
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const update = () => {
      const next = dateKey();
      setToday((old) => {
        if (old !== next) setDay((d) => (d === old ? next : d));
        return next;
      });
    };
    const timer = setInterval(update, 30000);
    const sub = AppState.addEventListener("change", (st) => {
      if (st === "active") update();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);
  function commit(fn: (old: State) => State): Promise<boolean> {
    const next = fn(current.current);
    current.current = next;
    setData(next);
    const write = saveQueue.current
      .then(() => AsyncStorage.setItem(STORE, JSON.stringify(next)))
      .then(() => {
        setStorageError("");
        return true;
      })
      .catch(() => {
        setStorageError(
          "บันทึกลงเครื่องไม่สำเร็จ กรุณาลองบันทึกอีกครั้งก่อนปิดแอป",
        );
        return false;
      });
    saveQueue.current = write.then(() => {});
    return write;
  }
  function openFood(food: Food) {
    setSelected(food);
    setAmount("1");
    setUnit("serving");
    setError("");
  }
  function addFood() {
    if (!selected) return;
    const a = Number(amount);
    const g = unit === "serving" ? a * selected.grams : a;
    if (!Number.isFinite(g) || g <= 0 || g > 5000) {
      setError("กรอกปริมาณมากกว่า 0 และไม่เกิน 5,000 กรัม");
      return;
    }
    commit((d) => ({
      ...d,
      entries: [
        ...d.entries,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          date: day,
          foodId: selected.id,
          grams: g,
          meal,
        },
      ],
    }));
    setSelected(null);
    setTab("today");
    setCelebrate((c) => c + 1);
    setToast(`เพิ่ม${selected.name}ในมื้อ${meal}แล้ว`);
  }
  function openPet() {
    setPetNameDraft(data.pet.name ?? "");
    setPetError("");
    setPetOpen(true);
  }
  function choosePet(next: PetSpecies) {
    // Keeps the sheet open so the preview updates while the name is still
    // being typed; the name is what "เสร็จแล้ว" commits.
    commit((d) => ({ ...d, pet: { ...d.pet, species: next } }));
  }
  function savePet() {
    let name: string | undefined;
    try {
      name = cleanPetName(petNameDraft);
    } catch (e) {
      setPetError((e as Error).message);
      return;
    }
    // Omitting the key rather than storing "" keeps a cleared name out of the
    // saved diary entirely.
    commit((d) => ({
      ...d,
      pet: { species: d.pet.species, ...(name ? { name } : {}) },
    }));
    setPetOpen(false);
    setToast(name ? `ตั้งชื่อว่า ${name} แล้ว` : "บันทึกสัตว์เลี้ยงแล้ว");
  }
  function toggleFavorite(id: string) {
    commit((d) => ({
      ...d,
      favorites: d.favorites.includes(id)
        ? d.favorites.filter((i) => i !== id)
        : [...d.favorites, id],
    }));
  }
  function saveProfile() {
    const p = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [
        k,
        k === "name" ? v.trim() : Number(v),
      ]),
    ) as Profile;
    const limits: Record<string, [number, number]> = {
      calories: [500, 10000],
      protein: [1, 1000],
      carbs: [1, 1500],
      fat: [1, 1000],
      water: [250, 10000],
      targetWeight: [20, 400],
    };
    for (const [k, [min, max]] of Object.entries(limits)) {
      const n = p[k as keyof Profile];
      if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) {
        setError(`กรุณาตรวจสอบช่องเป้าหมาย: ต้องอยู่ระหว่าง ${min}–${max}`);
        return;
      }
    }
    commit((d) => ({ ...d, profile: p }));
    setError("");
    setToast("บันทึกเป้าหมายแล้ว");
  }
  const catalog = [...foods, ...data.customFoods];
  const total = totals(data.entries, day, catalog),
    water = data.water[day] ?? 0,
    latest = data.weights.at(-1),
    first = data.weights[0];
  const shownFoods = catalog.filter(
    (f) =>
      f.name.includes(query.trim()) &&
      (filter === "ทั้งหมด" ||
        (filter === "รายการโปรด"
          ? data.favorites.includes(f.id)
          : filter === "อาหารของฉัน"
            ? f.id.startsWith("custom-")
            : f.category === filter)),
  );
  const selectedGrams = selected
    ? unit === "serving"
      ? Number(amount) * selected.grams
      : Number(amount)
    : 0;
  const n =
    selected && Number.isFinite(selectedGrams) && selectedGrams > 0
      ? nutrition(selected, selectedGrams)
      : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const remaining = Math.round(data.profile.calories) - Math.round(total.kcal);
  // The avatar mirrors the day on screen: build from the latest weigh-in, mood
  // from what has been logged for the day being viewed.
  const shape = petShape(latest?.value, data.profile.targetWeight),
    mood = petMood(total.kcal, data.profile.calories),
    petName =
      species.find((sp) => sp.id === data.pet.species)?.name ?? "สัตว์เลี้ยง";
  const clearCelebrate = useCallback(() => setCelebrate(0), []);
  function datePicker() {
    return (
      <View style={s.datePicker}>
        <IconButton
          label="วันก่อนหน้า"
          icon={ChevronLeft}
          onPress={() => setDay(shiftDate(day, -1))}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="กลับมาวันนี้"
          onPress={() => setDay(today)}
        >
          <T style={s.label}>
            {day === today ? "วันนี้" : thaiDate(day)} ·{" "}
            {new Date(day + "T12:00:00").getFullYear() + 543}
          </T>
        </Pressable>
        <IconButton
          label="วันถัดไป"
          icon={ChevronRight}
          color={day >= today ? "#C8CEC4" : C.green}
          onPress={() => {
            if (day < today) setDay(shiftDate(day, 1));
          }}
        />
      </View>
    );
  }
  if (!ready || (!fontsLoaded && !fontError))
    return (
      <View style={[s.root, s.center]}>
        <Leaf color={C.green} size={38} />
        <T style={s.title}>AmHealty</T>
        {storageError ? (
          <T style={s.error}>{storageError}</T>
        ) : (
          <ActivityIndicator color={C.green} />
        )}
      </View>
    );
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <View style={s.app}>
        {desktop && (
          <View style={s.sidebar}>
            <View style={s.brand}>
              <View style={s.brandIcon}>
                <Leaf size={25} color="white" />
              </View>
              <View>
                <T style={s.brandName}>AmHealty</T>
                <T style={s.caption}>สุขภาพดี เริ่มที่มื้อของคุณ</T>
              </View>
            </View>
            <T style={s.eyebrow}>พื้นที่สุขภาพของคุณ</T>
            {tabs.map((t) => (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                onPress={() => {
                  setTab(t.id);
                  setError("");
                }}
                style={[
                  s.sideNav,
                  tab === t.id && { backgroundColor: C.green },
                ]}
              >
                <t.icon size={21} color={tab === t.id ? "white" : C.muted} />
                <T
                  style={[s.label, { color: tab === t.id ? "white" : C.muted }]}
                >
                  {t.label}
                </T>
                {tab === t.id && <View style={s.activeDot} />}
              </Pressable>
            ))}
            <View style={{ flex: 1 }} />
            <View style={s.sideNote}>
              <Leaf color={C.green} size={25} />
              <T style={s.cardTitle}>ทีละมื้อ ทีละก้าว</T>
              <T style={s.caption}>
                ดูแลตัวเองในแบบของคุณ{"\n"}ทุกการเริ่มต้นมีความหมาย
              </T>
            </View>
            <View style={[s.row, { marginTop: 25 }]}>
              <ShieldCheck size={17} color={C.muted} />
              <T style={s.caption}>ข้อมูลอยู่ในอุปกรณ์นี้</T>
            </View>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              s.content,
              desktop && { paddingHorizontal: 42, paddingTop: 35 },
            ]}
          >
            <View style={s.page}>
              <View style={s.between}>
                <View style={{ flex: 1 }}>
                  <T style={s.eyebrow}>
                    {desktop
                      ? "YOUR DAILY BALANCE"
                      : "AMHEALTY  /  สุขภาพดีทุกวัน"}
                  </T>
                  <T accessibilityRole="header" style={s.title}>
                    {tab === "today"
                      ? `สวัสดี${data.profile.name ? " " + data.profile.name : ""} 🌿`
                      : tab === "food"
                        ? "มื้อนี้ ทานอะไรดี?"
                        : tab === "trends"
                          ? "ทุกก้าวของคุณ"
                          : "เป้าหมายของฉัน"}
                  </T>
                  <T style={s.subtitle}>
                    {tab === "today"
                      ? "เติมสิ่งดี ๆ ให้ร่างกาย เริ่มจากมื้อเล็ก ๆ วันนี้"
                      : tab === "food"
                        ? "เลือกอาหาร ปรับปริมาณ แล้วบันทึกได้เลย"
                        : tab === "trends"
                          ? "มองเห็นความเปลี่ยนแปลง ในจังหวะของตัวเอง"
                          : "ปรับให้เหมาะกับชีวิตและเป้าหมายของคุณ"}
                  </T>
                </View>
                {desktop && (
                  <View style={s.avatar}>
                    <User size={23} color={C.green} />
                  </View>
                )}
              </View>
              {storageError && (
                <View style={s.notice}>
                  <T accessibilityRole="alert" style={s.error}>
                    {storageError}
                  </T>
                  {ready && (
                    <Button
                      label="ลองบันทึกอีกครั้ง"
                      icon={Check}
                      secondary
                      onPress={() => commit((d) => ({ ...d }))}
                    />
                  )}
                </View>
              )}
              {(tab === "today" || tab === "food") && (
                <View style={[s.between, { marginTop: 23, marginBottom: 22 }]}>
                  {datePicker()}
                  {desktop && <T style={s.caption}>ค่อย ๆ สร้างวันที่สมดุล</T>}
                </View>
              )}
              {tab === "today" && (
                <View
                  style={[s.columns, !desktop && { flexDirection: "column" }]}
                >
                  <View style={{ flex: 1.35, gap: 20 }}>
                    <Card>
                      <View style={s.between}>
                        <View style={s.row}>
                          <PawPrint size={21} color={C.green} />
                          <T style={s.cardTitle}>{petTitle(data.pet)}</T>
                        </View>
                        <View style={s.badge}>
                          <T style={s.badgeText}>{shapeLabel[shape]}</T>
                        </View>
                      </View>
                      <View
                        accessibilityRole="image"
                        accessibilityLabel={`${petTitle(data.pet)} (${petName}) ${shapeLabel[shape]} ${moodText[mood]}`}
                        style={{ alignItems: "center", paddingTop: 14 }}
                      >
                        <PetStage
                          species={data.pet.species}
                          shape={shape}
                          mood={mood}
                          size={desktop ? 172 : 146}
                          celebrate={celebrate}
                          onCelebrated={clearCelebrate}
                        />
                      </View>
                      <T
                        style={[
                          s.cardTitle,
                          { textAlign: "center", marginTop: 6 },
                        ]}
                      >
                        {moodText[mood]}
                      </T>
                      <T
                        style={[
                          s.caption,
                          { textAlign: "center", marginTop: 4, marginBottom: 16 },
                        ]}
                      >
                        {shapeText[shape]}
                      </T>
                      <Button
                        label="ตั้งค่าสัตว์เลี้ยง"
                        icon={PawPrint}
                        secondary
                        onPress={openPet}
                      />
                    </Card>
                    <Card>
                      <View style={s.between}>
                        <View style={s.row}>
                          <Flame size={21} color={C.green} />
                          <T style={s.cardTitle}>พลังงานวันนี้</T>
                        </View>
                        <View style={s.badge}>
                          <T style={s.badgeText}>
                            เป้าหมาย {fmt(data.profile.calories)}
                          </T>
                        </View>
                      </View>
                      <View
                        style={[
                          s.row,
                          {
                            justifyContent: "space-around",
                            paddingVertical: 25,
                            flexWrap: "wrap",
                          },
                        ]}
                      >
                        <View
                          style={[
                            s.ring,
                            !desktop && { width: 148, height: 148 },
                          ]}
                        >
                          <Svg
                            width={desktop ? 188 : 148}
                            height={desktop ? 188 : 148}
                            viewBox="0 0 188 188"
                          >
                            <Circle
                              cx={94}
                              cy={94}
                              r={80}
                              stroke={C.soft}
                              strokeWidth={13}
                              fill="none"
                            />
                            <Circle
                              cx={94}
                              cy={94}
                              r={80}
                              stroke={C.green}
                              strokeWidth={13}
                              fill="none"
                              strokeDasharray={`${Math.min(1, total.kcal / data.profile.calories) * 502.65} 502.65`}
                              strokeLinecap="round"
                              rotation={-90}
                              origin="94,94"
                            />
                          </Svg>
                          <View style={s.ringLabel}>
                            <T style={s.caption}>ทานไปแล้ว</T>
                            <T
                              style={[
                                s.bigNumber,
                                !desktop && { fontSize: 32, lineHeight: 44 },
                              ]}
                            >
                              {fmt(total.kcal)}
                            </T>
                            <T style={s.caption}>kcal</T>
                          </View>
                        </View>
                        <View style={{ gap: 10, flexShrink: 1 }}>
                          <T style={s.caption}>
                            {remaining >= 0
                              ? "พลังงานที่เหลือ"
                              : "เกินเป้าหมาย"}
                          </T>
                          <T
                            style={[
                              s.bigNumber,
                              {
                                fontSize: desktop ? 32 : 26,
                                color: remaining >= 0 ? C.green : "#B06A43",
                              },
                            ]}
                          >
                            {fmt(Math.abs(remaining))}
                            <T style={s.caption}> kcal</T>
                          </T>
                          <T style={s.caption}>
                            {total.kcal === 0
                              ? "เริ่มบันทึกมื้อแรกของวันนี้"
                              : remaining >= 0
                                ? "จัดมื้อถัดไปในแบบของคุณ"
                                : "ดูภาพรวม แล้วปรับมื้อถัดไป"}
                          </T>
                        </View>
                      </View>
                      <View style={{ gap: 10 }}>
                        <Macro
                          label="โปรตีน"
                          value={total.protein}
                          target={data.profile.protein}
                          color={C.peach}
                        />
                        <Macro
                          label="คาร์บ"
                          value={total.carbs}
                          target={data.profile.carbs}
                          color={C.purple}
                        />
                        <Macro
                          label="ไขมัน"
                          value={total.fat}
                          target={data.profile.fat}
                          color="#F9F2DB"
                        />
                      </View>
                      {!desktop && (
                        <View style={{ marginTop: 18 }}>
                          <Button
                            label="บันทึกอาหาร"
                            onPress={() => setTab("food")}
                          />
                        </View>
                      )}
                    </Card>
                    <Card>
                      <View style={s.between}>
                        <View style={s.row}>
                          <Utensils size={20} color={C.green} />
                          <T style={s.cardTitle}>บันทึกมื้ออาหาร</T>
                        </View>
                        <T style={s.caption}>
                          {data.entries.filter((e) => e.date === day).length}{" "}
                          รายการ
                        </T>
                      </View>
                      {meals.map((m) => {
                        const entries = data.entries.filter(
                          (e) => e.date === day && e.meal === m,
                        );
                        return (
                          <View key={m} style={s.mealSection}>
                            <View style={s.between}>
                              <T style={s.label}>
                                {m === "ของว่าง" ? m : `มื้อ${m}`}
                              </T>
                              <IconButton
                                label={`เพิ่มอาหารมื้อ${m}`}
                                icon={Plus}
                                onPress={() => {
                                  setMeal(m);
                                  setTab("food");
                                }}
                              />
                            </View>
                            {entries.length === 0 ? (
                              <T style={s.caption}>
                                ยังไม่มีรายการ · เพิ่มมื้ออร่อยของคุณ
                              </T>
                            ) : (
                              entries.map((e) => {
                                const f = catalog.find(
                                  (f) => f.id === e.foodId,
                                )!;
                                return (
                                  <View
                                    key={e.id}
                                    style={[s.row, { marginTop: 9 }]}
                                  >
                                    <FoodPhoto food={f} size={48} />
                                    <View style={{ flex: 1 }}>
                                      <T style={s.label}>{f.name}</T>
                                      <T style={s.caption}>
                                        {Math.round(e.grams)} กรัม ·{" "}
                                        {fmt(nutrition(f, e.grams).kcal)} kcal
                                      </T>
                                    </View>
                                    <IconButton
                                      icon={Trash2}
                                      label={`ลบ ${f.name}`}
                                      color={C.muted}
                                      onPress={() => {
                                        commit((d) => ({
                                          ...d,
                                          entries: d.entries.filter(
                                            (x) => x.id !== e.id,
                                          ),
                                        }));
                                        setToast("ลบรายการอาหารแล้ว");
                                      }}
                                    />
                                  </View>
                                );
                              })
                            )}
                          </View>
                        );
                      })}
                    </Card>
                  </View>
                  <View style={{ flex: 1, gap: 20 }}>
                    <Card
                      style={{ backgroundColor: C.green, borderColor: C.green }}
                    >
                      <View style={s.between}>
                        <T style={[s.cardTitle, { color: "white" }]}>
                          มื้อดี ๆ เริ่มตรงนี้
                        </T>
                        <View style={s.lightIcon}>
                          <Utensils size={24} color={C.lime} />
                        </View>
                      </View>
                      <T
                        style={{
                          color: "#DCE8D9",
                          marginTop: 10,
                          marginBottom: 20,
                        }}
                      >
                        ไม่ต้องสมบูรณ์แบบทุกมื้อ{"\n"}
                        แค่ได้รู้จักสิ่งที่ทานมากขึ้น
                      </T>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setTab("food")}
                        style={[s.button, { backgroundColor: C.lime }]}
                      >
                        <Plus size={20} color={C.dark} />
                        <T style={[s.buttonText, { color: C.dark }]}>
                          บันทึกอาหาร
                        </T>
                      </Pressable>
                    </Card>
                    <Card>
                      <View style={s.between}>
                        <View style={s.row}>
                          <Droplets color="#528DAC" size={22} />
                          <T style={s.cardTitle}>เติมน้ำให้ร่างกาย</T>
                        </View>
                      </View>
                      <T style={[s.bigNumber, { marginTop: 16 }]}>
                        {(water / 1000).toFixed(2)}
                        <T style={s.caption}>
                          {" "}
                          / {data.profile.water / 1000} ลิตร
                        </T>
                      </T>
                      <View
                        style={[
                          s.track,
                          {
                            height: 9,
                            marginVertical: 17,
                            backgroundColor: C.blue,
                          },
                        ]}
                      >
                        <View
                          style={[
                            s.fill,
                            {
                              width: `${Math.min(100, (water / data.profile.water) * 100)}%`,
                              backgroundColor: "#72ACC6",
                            },
                          ]}
                        />
                      </View>
                      <View style={s.row}>
                        <IconButton
                          label="ลดน้ำ 250 มล."
                          icon={Minus}
                          onPress={() =>
                            commit((d) => ({
                              ...d,
                              water: {
                                ...d.water,
                                [day]: Math.max(0, (d.water[day] ?? 0) - 250),
                              },
                            }))
                          }
                        />
                        <View style={{ flex: 1 }}>
                          <Button
                            label="เพิ่ม 250 มล."
                            secondary
                            onPress={() => {
                              commit((d) => ({
                                ...d,
                                water: {
                                  ...d.water,
                                  [day]: (d.water[day] ?? 0) + 250,
                                },
                              }));
                              setToast("บันทึกน้ำดื่มแล้ว");
                            }}
                          />
                        </View>
                      </View>
                    </Card>
                    <Card>
                      <View style={s.row}>
                        <Target size={22} color={C.green} />
                        <T style={s.cardTitle}>น้ำหนักของคุณ</T>
                      </View>
                      <T style={[s.bigNumber, { marginTop: 16 }]}>
                        {latest ? latest.value.toFixed(1) : "—"}
                        <T style={s.caption}> กก.</T>
                      </T>
                      <T style={[s.caption, { marginBottom: 18 }]}>
                        {latest
                          ? `บันทึกล่าสุด ${thaiDate(latest.date)}`
                          : "ยังไม่มีข้อมูลน้ำหนัก"}{" "}
                        · เป้าหมาย {data.profile.targetWeight} กก.
                      </T>
                      <Button
                        label="บันทึกน้ำหนัก"
                        secondary
                        onPress={() => {
                          setWeightOpen(true);
                          setError("");
                          setWeight("");
                        }}
                      />
                    </Card>
                    <View style={s.gentleNote}>
                      <Leaf size={21} color={C.green} />
                      <T style={[s.caption, { flex: 1, color: C.green }]}>
                        ความสม่ำเสมอเล็ก ๆ ในวันนี้{"\n"}
                        คือการดูแลตัวเองในระยะยาว
                      </T>
                    </View>
                  </View>
                </View>
              )}
              {tab === "food" && (
                <View style={{ gap: 20 }}>
                  <View
                    style={[
                      s.gentleNote,
                      {
                        backgroundColor: C.green,
                        alignItems: desktop ? "center" : "stretch",
                        flexDirection: desktop ? "row" : "column",
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <T style={[s.cardTitle, { color: "white" }]}>
                        เมนูของคุณ รูปของคุณ
                      </T>
                      <T style={[s.caption, { color: "#DDE9DC" }]}>
                        ถ่ายรูปหรือเลือกรูป แล้วเก็บอาหารไว้ใช้ได้ทุกมื้อ
                      </T>
                    </View>
                    <Button
                      label="เพิ่มอาหารเอง"
                      icon={Camera}
                      secondary
                      onPress={() => {
                        setRecovered(null);
                        setCreateOpen(true);
                      }}
                    />
                  </View>
                  <Card>
                    <T style={s.label}>ค้นหาอาหาร</T>
                    <View style={[s.row, s.search]}>
                      <Search size={22} color={C.muted} />
                      <TextInput
                        accessibilityLabel="ค้นหาอาหารไทย"
                        placeholder="ลองค้นหา กะเพรา ไข่ต้ม หรือข้าวสวย"
                        placeholderTextColor={C.muted}
                        value={query}
                        onChangeText={setQuery}
                        style={[
                          s.input,
                          {
                            borderWidth: 0,
                            backgroundColor: "transparent",
                            flex: 1,
                            paddingHorizontal: 0,
                          },
                        ]}
                      />
                      {query !== "" && (
                        <IconButton
                          label="ล้างคำค้น"
                          icon={X}
                          onPress={() => setQuery("")}
                        />
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, marginTop: 15 }}
                    >
                      {[
                        "ทั้งหมด",
                        "รายการโปรด",
                        "อาหารของฉัน",
                        "อาหารจานเดียว",
                        "กับข้าว",
                        "ข้าวและแป้ง",
                        "ผลไม้",
                        "ของว่าง",
                      ].map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          active={filter === c}
                          onPress={() => setFilter(c)}
                        />
                      ))}
                    </ScrollView>
                  </Card>
                  <View style={s.between}>
                    <T style={s.cardTitle}>เลือกมื้อที่ใช่สำหรับคุณ</T>
                    <T style={s.caption}>{shownFoods.length} รายการ</T>
                  </View>
                  <View
                    style={[
                      s.foodGrid,
                      !desktop && { flexDirection: "column" },
                    ]}
                  >
                    {shownFoods.map((f) => (
                      <View
                        key={f.id}
                        style={[s.foodCard, desktop && { width: "48.7%" }]}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`เลือก ${f.name}`}
                          onPress={() => openFood(f)}
                          style={[s.row, { flex: 1 }]}
                        >
                          <FoodPhoto food={f} size={84} />
                          <View style={{ flex: 1 }}>
                            <T style={s.cardTitle}>{f.name}</T>
                            {f.id.startsWith("custom-") && (
                              <T
                                style={[
                                  s.caption,
                                  { color: C.green, fontSize: 10 },
                                ]}
                              >
                                อาหารของฉัน
                              </T>
                            )}
                            <T style={s.caption}>
                              1 {f.unit} · {f.grams} กรัม
                            </T>
                            <T
                              style={[
                                s.label,
                                { color: C.green, marginTop: 6 },
                              ]}
                            >
                              {f.kcal} <T style={s.caption}>kcal</T>
                            </T>
                          </View>
                        </Pressable>
                        <View>
                          <IconButton
                            label={`รายการโปรด ${f.name}`}
                            icon={Heart}
                            color={
                              data.favorites.includes(f.id)
                                ? "#BF7761"
                                : C.muted
                            }
                            onPress={() => toggleFavorite(f.id)}
                          />
                          <IconButton
                            label={`เพิ่ม ${f.name}`}
                            icon={Plus}
                            onPress={() => openFood(f)}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                  {shownFoods.length === 0 && (
                    <Empty
                      title="ยังไม่พบอาหาร"
                      detail="ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดอาหาร"
                    />
                  )}
                  <T style={s.caption}>
                    ข้อมูลอาหารเริ่มต้น {foods.length}{" "}
                    รายการเป็นค่าประมาณต่อหน่วยบริโภค
                    สูตรและวัตถุดิบอาจทำให้ค่าแตกต่างกัน
                    ภาพอาหารเริ่มต้นเป็นภาพสมจริงที่สร้างด้วย AI
                  </T>
                </View>
              )}
              {tab === "trends" && (
                <View style={{ gap: 20, marginTop: 28 }}>
                  <View style={s.between}>
                    <View style={s.row}>
                      {[7, 30, 90].map((p) => (
                        <Chip
                          key={p}
                          label={`${p} วัน`}
                          active={period === p}
                          onPress={() => setPeriod(p)}
                        />
                      ))}
                    </View>
                    {desktop && (
                      <Button
                        label="บันทึกน้ำหนัก"
                        onPress={() => {
                          setWeightOpen(true);
                          setError("");
                          setWeight("");
                        }}
                      />
                    )}
                  </View>
                  <Card>
                    <View style={s.between}>
                      <View>
                        <T style={s.caption}>น้ำหนักปัจจุบัน</T>
                        <T style={s.bigNumber}>
                          {latest ? latest.value.toFixed(1) : "—"}
                          <T style={s.caption}> กก.</T>
                        </T>
                      </View>
                      <View style={s.badge}>
                        <Target size={17} color={C.green} />
                        <T style={s.badgeText}>
                          เป้าหมาย {data.profile.targetWeight} กก.
                        </T>
                      </View>
                    </View>
                    {data.weights.length === 0 ? (
                      <Empty
                        title="เริ่มต้นจากน้ำหนักวันนี้"
                        detail="บันทึกครั้งแรก แล้วดูแนวโน้มของคุณได้ที่นี่"
                      />
                    ) : (
                      <WeightChart
                        weights={data.weights.filter(
                          (w) =>
                            w.date >= shiftDate(today, -period + 1) &&
                            w.date <= today,
                        )}
                        target={data.profile.targetWeight}
                        start={shiftDate(today, -period + 1)}
                        end={today}
                      />
                    )}
                  </Card>
                  <View style={s.row}>
                    <Card style={{ flex: 1 }}>
                      <T style={s.caption}>เปลี่ยนแปลงจากครั้งแรก</T>
                      <T style={[s.cardTitle, { fontSize: 26, marginTop: 9 }]}>
                        {latest && first
                          ? `${latest.value - first.value > 0 ? "+" : ""}${(latest.value - first.value).toFixed(1)}`
                          : "—"}
                        <T style={s.caption}> กก.</T>
                      </T>
                    </Card>
                    <Card style={{ flex: 1 }}>
                      <T style={s.caption}>จำนวนวันที่บันทึก</T>
                      <T style={[s.cardTitle, { fontSize: 26, marginTop: 9 }]}>
                        {data.weights.length}
                        <T style={s.caption}> วัน</T>
                      </T>
                    </Card>
                  </View>
                  {!desktop && (
                    <Button
                      label="บันทึกน้ำหนัก"
                      onPress={() => {
                        setWeightOpen(true);
                        setError("");
                        setWeight("");
                      }}
                    />
                  )}
                  <Card>
                    <T style={s.cardTitle}>ประวัติน้ำหนัก</T>
                    {data.weights.length === 0 ? (
                      <T style={[s.caption, { marginTop: 12 }]}>
                        ยังไม่มีข้อมูล
                      </T>
                    ) : (
                      [...data.weights].reverse().map((w) => (
                        <View key={w.date} style={[s.between, s.historyRow]}>
                          <T>
                            {thaiDate(w.date)}{" "}
                            {new Date(w.date).getFullYear() + 543}
                          </T>
                          <View style={s.row}>
                            <T style={s.label}>{w.value.toFixed(1)} กก.</T>
                            <IconButton
                              label={`ลบน้ำหนัก ${w.date}`}
                              icon={Trash2}
                              color={C.muted}
                              onPress={() =>
                                commit((d) => ({
                                  ...d,
                                  weights: d.weights.filter(
                                    (x) => x.date !== w.date,
                                  ),
                                }))
                              }
                            />
                          </View>
                        </View>
                      ))
                    )}
                  </Card>
                </View>
              )}
              {tab === "profile" && (
                <View style={{ gap: 20, marginTop: 28, maxWidth: 650 }}>
                  <Card>
                    <View style={s.row}>
                      <View style={s.avatar}>
                        <User color={C.green} size={26} />
                      </View>
                      <View>
                        <T style={s.cardTitle}>พื้นที่ของคุณ</T>
                        <T style={s.caption}>
                          ไม่ต้องสมัครสมาชิก เริ่มบันทึกได้เลย
                        </T>
                      </View>
                    </View>
                    <View style={{ marginTop: 24, gap: 18 }}>
                      <Field
                        label="ชื่อที่อยากให้เรียก"
                        value={draft.name}
                        onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
                      />
                      <T style={s.cardTitle}>เป้าหมายรายวัน</T>
                      <T style={s.caption}>
                        ค่าเริ่มต้นเป็นเพียงตัวอย่าง ปรับตามเป้าหมายที่คุณกำหนด
                      </T>
                      {(
                        [
                          ["calories", "พลังงาน (kcal)"],
                          ["protein", "โปรตีน (กรัม)"],
                          ["carbs", "คาร์บ (กรัม)"],
                          ["fat", "ไขมัน (กรัม)"],
                          ["water", "น้ำดื่ม (มล.)"],
                          ["targetWeight", "น้ำหนักเป้าหมาย (กก.)"],
                        ] as [keyof Profile, string][]
                      ).map(([k, label]) => (
                        <Field
                          key={k}
                          numeric
                          label={label}
                          value={draft[k]}
                          onChange={(v) => {
                            setError("");
                            setDraft((d) => ({ ...d, [k]: v }));
                          }}
                        />
                      ))}
                      {error && (
                        <T accessibilityRole="alert" style={s.error}>
                          {error}
                        </T>
                      )}
                      <Button
                        label="บันทึกเป้าหมาย"
                        icon={Check}
                        onPress={saveProfile}
                      />
                    </View>
                  </Card>
                  <View style={s.gentleNote}>
                    <ShieldCheck size={25} color={C.green} />
                    <T style={[s.caption, { flex: 1 }]}>
                      บันทึกเฉพาะในแอปหรือเบราว์เซอร์นี้
                      ยังไม่มีระบบสำรองหรือซิงก์
                      การล้างข้อมูลแอปหรือเบราว์เซอร์จะลบประวัติ
                    </T>
                  </View>
                </View>
              )}
              <View style={s.footer}>
                <Leaf size={15} color={C.muted} />
                <T style={[s.caption, { fontSize: 11 }]}>
                  AMHEALTY · ดูแลตัวเอง ทีละมื้อ
                </T>
              </View>
            </View>
          </ScrollView>
          {!desktop && (
            <View style={s.bottomNav}>
              {tabs.map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === t.id }}
                  onPress={() => {
                    setTab(t.id);
                    setError("");
                  }}
                  style={s.bottomItem}
                >
                  <View
                    style={[
                      s.navIcon,
                      tab === t.id && { backgroundColor: C.soft },
                    ]}
                  >
                    <t.icon
                      size={23}
                      color={tab === t.id ? C.green : C.muted}
                    />
                  </View>
                  <T
                    style={[
                      s.caption,
                      {
                        color: tab === t.id ? C.green : C.muted,
                        fontFamily:
                          tab === t.id
                            ? "NotoSansThai_600SemiBold"
                            : "NotoSansThai_400Regular",
                      },
                    ]}
                  >
                    {t.label}
                  </T>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
      {toast !== "" && (
        <View pointerEvents="none" style={s.toast}>
          <Check size={18} color="white" />
          <T
            accessibilityLiveRegion="polite"
            style={{ color: "white", flexShrink: 1 }}
          >
            {toast}
          </T>
        </View>
      )}
      <Modal
        transparent
        visible={petOpen}
        animationType="fade"
        onRequestClose={() => setPetOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.overlay}
        >
          <View accessibilityViewIsModal style={s.modal}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 25, gap: 18 }}
            >
              <View style={s.between}>
                <T style={s.cardTitle}>สัตว์เลี้ยงของคุณ</T>
                <IconButton
                  label="ปิดหน้าต่าง"
                  icon={X}
                  onPress={() => setPetOpen(false)}
                />
              </View>
              <Field
                label={`ตั้งชื่อ (ไม่เกิน ${MAX_PET_NAME} ตัวอักษร เว้นว่างได้)`}
                value={petNameDraft}
                onChange={(v) => {
                  setPetNameDraft(v);
                  setPetError("");
                }}
              />
              {!!petError && (
                <T accessibilityRole="alert" style={s.error}>
                  {petError}
                </T>
              )}
              <T style={s.caption}>
                ตัวละครจะอ้วนหรือผอมตามน้ำหนักล่าสุดเทียบกับเป้าหมาย
                และหิวหรืออิ่มตามมื้อที่บันทึกไว้ในวันนั้น
              </T>
              <View style={s.petGrid}>
                {species.map((sp) => (
                  <Pressable
                    key={sp.id}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: data.pet.species === sp.id,
                    }}
                    accessibilityLabel={sp.name}
                    onPress={() => choosePet(sp.id)}
                    style={[
                      s.petChoice,
                      data.pet.species === sp.id && {
                        borderColor: C.green,
                        backgroundColor: C.soft,
                      },
                    ]}
                  >
                    <PetAvatar
                      species={sp.id}
                      shape={shape}
                      mood={mood}
                      size={92}
                    />
                    <T style={s.label}>{sp.name}</T>
                  </Pressable>
                ))}
              </View>
              <Button label="เสร็จแล้ว" icon={Check} onPress={savePet} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        transparent
        visible={!!selected || weightOpen}
        animationType="fade"
        onRequestClose={() => {
          setSelected(null);
          setWeightOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.overlay}
        >
          <View accessibilityViewIsModal style={s.modal}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 25, gap: 18 }}
            >
              <View style={s.between}>
                <T style={s.cardTitle}>
                  {selected ? "เพิ่มในบันทึกอาหาร" : "บันทึกน้ำหนัก"}
                </T>
                <IconButton
                  label="ปิดหน้าต่าง"
                  icon={X}
                  onPress={() => {
                    setSelected(null);
                    setWeightOpen(false);
                  }}
                />
              </View>
              {selected ? (
                <>
                  <View style={s.row}>
                    <FoodPhoto food={selected} size={88} />
                    <View style={{ flex: 1 }}>
                      <T style={[s.cardTitle, { fontSize: 21 }]}>
                        {selected.name}
                      </T>
                      <T style={s.caption}>
                        1 {selected.unit} = {selected.grams} กรัม
                      </T>
                    </View>
                  </View>
                  <T style={s.label}>วันที่บันทึก: {thaiDate(day)}</T>
                  <T style={s.label}>มื้ออาหาร</T>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}
                  >
                    {meals.map((m) => (
                      <Chip
                        key={m}
                        label={m}
                        active={meal === m}
                        onPress={() => setMeal(m)}
                      />
                    ))}
                  </View>
                  <View style={s.row}>
                    <Chip
                      label={selected.unit}
                      active={unit === "serving"}
                      onPress={() => {
                        setUnit("serving");
                        setAmount("1");
                      }}
                    />
                    <Chip
                      label="กรัม"
                      active={unit === "grams"}
                      onPress={() => {
                        setUnit("grams");
                        setAmount(String(selected.grams));
                      }}
                    />
                  </View>
                  <Field
                    label={`ปริมาณ (${unit === "serving" ? selected.unit : "กรัม"})`}
                    value={amount}
                    numeric
                    onChange={(v) => {
                      setAmount(v);
                      setError("");
                    }}
                  />
                  <View style={s.summary}>
                    <T style={s.bigNumber}>
                      {fmt(n.kcal)}
                      <T style={s.caption}> kcal</T>
                    </T>
                    <T style={s.caption}>
                      โปรตีน {n.protein.toFixed(1)} · คาร์บ {n.carbs.toFixed(1)}{" "}
                      · ไขมัน {n.fat.toFixed(1)} กรัม
                    </T>
                  </View>
                  {error && (
                    <T accessibilityRole="alert" style={s.error}>
                      {error}
                    </T>
                  )}
                  <Button label={`เพิ่มในมื้อ${meal}`} onPress={addFood} />
                </>
              ) : (
                <>
                  <T style={s.caption}>
                    วันที่ {thaiDate(today)} · หากบันทึกซ้ำในวันเดียวกัน
                    จะแทนค่าก่อนหน้า
                  </T>
                  <Field
                    label="น้ำหนัก (กก.)"
                    numeric
                    value={weight}
                    onChange={(v) => {
                      setWeight(v);
                      setError("");
                    }}
                  />
                  {error && (
                    <T accessibilityRole="alert" style={s.error}>
                      {error}
                    </T>
                  )}
                  <Button
                    label="บันทึกน้ำหนัก"
                    icon={Check}
                    onPress={() => {
                      try {
                        const next = saveWeight(
                          current.current.weights,
                          today,
                          Number(weight),
                        );
                        commit((d) => ({ ...d, weights: next }));
                        setWeightOpen(false);
                        setToast("บันทึกน้ำหนักแล้ว");
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {createOpen && (
        <CustomFoodModal
          recovered={recovered}
          onClose={() => {
            setCreateOpen(false);
            setRecovered(null);
          }}
          onSave={async (food) => {
            const saved = await commit((d) => ({
              ...d,
              customFoods: [
                ...d.customFoods.filter((f) => f.id !== food.id),
                food,
              ],
            }));
            if (saved) {
              setQuery("");
              setFilter("อาหารของฉัน");
              setTab("food");
              setToast(
                `เพิ่ม ${food.name} แล้ว เลือกเพื่อบันทึกในมื้ออาหารได้เลย`,
              );
            }
            return saved;
          }}
        />
      )}
    </SafeAreaView>
  );
}
function WeightChart({
  weights,
  target,
  start,
  end,
}: {
  weights: State["weights"];
  target: number;
  start: string;
  end: string;
}) {
  if (!weights.length)
    return (
      <Empty
        title="ไม่มีข้อมูลในช่วงนี้"
        detail="ลองเลือกช่วงเวลาที่ยาวขึ้น หรือบันทึกน้ำหนักวันนี้"
      />
    );
  const low = Math.floor(Math.min(target, ...weights.map((w) => w.value)) - 1),
    high = Math.ceil(Math.max(target, ...weights.map((w) => w.value)) + 1);
  const y = (v: number) => 210 - ((v - low) / (high - low)) * 170;
  const a = new Date(start).getTime(),
    b = new Date(end).getTime();
  const x = (d: string) =>
    45 + ((new Date(d).getTime() - a) / (b - a || 1)) * 485;
  const points = weights.map((w) => [x(w.date), y(w.value)]);
  return (
    <View style={{ marginTop: 24 }}>
      <Svg width="100%" height={260} viewBox="0 0 560 260">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = low + ((high - low) * i) / 4;
          return (
            <React.Fragment key={i}>
              <Line x1={45} x2={530} y1={y(v)} y2={y(v)} stroke={C.border} />
              <SvgText
                x={30}
                y={y(v) + 4}
                textAnchor="end"
                fill={C.muted}
                fontSize={11}
              >
                {v.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Line
          x1={45}
          x2={530}
          y1={y(target)}
          y2={y(target)}
          stroke={C.green}
          strokeDasharray="5 5"
        />
        {points.length > 1 && (
          <Path
            d={`M ${points.map((p) => p.join(",")).join(" L ")}`}
            fill="none"
            stroke={C.green}
            strokeWidth={3}
          />
        )}{" "}
        {points.map(([px, py], i) => (
          <Circle
            key={i}
            cx={px}
            cy={py}
            r={5}
            fill={C.green}
            stroke="white"
            strokeWidth={2}
          />
        ))}
        <SvgText x={45} y={243} fill={C.muted} fontSize={11}>
          {thaiDate(start)}
        </SvgText>
        <SvgText x={530} y={243} textAnchor="end" fill={C.muted} fontSize={11}>
          {thaiDate(end)}
        </SvgText>
      </Svg>
      <T style={s.caption}>
        เส้นประ: เป้าหมาย {target} กก. · จุด: น้ำหนักที่คุณบันทึก
      </T>
    </View>
  );
}
