import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Camera,
  Check,
  ImagePlus,
  Plus,
  Utensils,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Food, FoodDraft, createCustomFood, foodCategories } from "./model";
import { preparePhoto } from "./preparePhoto";
import { savePhoto } from "./photos";
import { C, s } from "./styles";

type Props = {
  onClose: () => void;
  onSave: (food: Food) => Promise<boolean>;
  recovered?: ImagePicker.ImagePickerAsset | null;
};
const emptyDraft: FoodDraft = {
  name: "",
  unit: "จาน",
  category: "อาหารตามสั่ง",
  grams: "",
  kcal: "",
  protein: "",
  carbs: "",
  fat: "",
};
export function CustomFoodModal({ onClose, onSave, recovered }: Props) {
  const [draft, setDraft] = useState<FoodDraft>(emptyDraft),
    [photo, setPhoto] = useState<string | null>(null),
    [error, setError] = useState(""),
    [processing, setProcessing] = useState(false),
    [saving, setSaving] = useState(false),
    [settings, setSettings] = useState(false);
  const id = useRef(
      `custom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ),
    operation = useRef(0),
    mounted = useRef(true),
    savingRef = useRef(false);
  const busy = processing || saving;
  useEffect(
    () => () => {
      mounted.current = false;
      operation.current++;
    },
    [],
  );
  useEffect(() => {
    if (recovered) void receivePhoto(recovered, ++operation.current);
  }, [recovered]);
  async function receivePhoto(
    asset: ImagePicker.ImagePickerAsset,
    seq: number,
  ) {
    if (!mounted.current || seq !== operation.current) return;
    setProcessing(true);
    try {
      const uri = await preparePhoto(asset);
      if (mounted.current && seq === operation.current) {
        setPhoto(uri);
        setError("");
      }
    } catch (e) {
      if (mounted.current && seq === operation.current)
        setError(
          e instanceof Error
            ? e.message
            : "อ่านรูปไม่สำเร็จ ลองใช้ JPG หรือ PNG",
        );
    } finally {
      if (mounted.current && seq === operation.current) setProcessing(false);
    }
  }
  async function pick(source: "camera" | "library") {
    if (busy) return;
    const seq = ++operation.current;
    setError("");
    setSettings(false);
    try {
      // On web the picker must launch in the click handler before any await.
      if (Platform.OS !== "web" && source === "camera") {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!mounted.current || seq !== operation.current) return;
        if (!p.granted) {
          setError("ยังไม่ได้รับอนุญาตใช้กล้อง คุณเลือกรูปจากเครื่องแทนได้");
          setSettings(!p.canAskAgain);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
        exif: false,
      };
      const result = await (source === "camera"
        ? ImagePicker.launchCameraAsync({
            ...options,
            cameraType: ImagePicker.CameraType.back,
          })
        : ImagePicker.launchImageLibraryAsync(options));
      if (!result.canceled && result.assets?.[0])
        await receivePhoto(result.assets[0], seq);
    } catch {
      if (mounted.current && seq === operation.current)
        setError(
          "เปิดกล้องหรือคลังรูปไม่ได้ ลองเลือกรูปอีกครั้ง หรือเปิดสิทธิ์ในตั้งค่าอุปกรณ์",
        );
    }
  }
  async function submit() {
    if (busy || savingRef.current) return;
    setError("");
    let food: Food;
    try {
      food = createCustomFood(
        draft,
        id.current,
        photo ? id.current : undefined,
      );
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (photo) await savePhoto(id.current, photo);
      if (await onSave(food)) {
        onClose();
        return;
      }
      setError("บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง ข้อมูลในฟอร์มยังอยู่");
    } catch {
      setError(
        "บันทึกรูปไม่ได้ พื้นที่จัดเก็บอาจเต็มหรือถูกปิดกั้น กรุณาลองอีกครั้ง",
      );
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  function field(key: keyof FoodDraft, label: string, numeric = false) {
    return (
      <View style={{ gap: 7 }}>
        <Text style={[s.text, s.label]}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          value={draft[key]}
          editable={!busy}
          onChangeText={(value) => {
            setDraft((d) => ({ ...d, [key]: value }));
            setError("");
          }}
          maxLength={key === "name" ? 100 : 30}
          keyboardType={numeric ? "decimal-pad" : "default"}
          inputMode={numeric ? "decimal" : "text"}
          style={s.input}
        />
      </View>
    );
  }
  function action(
    label: string,
    Icon: typeof Camera,
    handler: () => void,
    primary = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={handler}
        style={[s.button, !primary && s.secondary, busy && { opacity: 0.6 }]}
      >
        <Icon size={20} color={primary ? "white" : C.green} />
        <Text style={[s.text, s.buttonText, !primary && { color: C.green }]}>
          {label}
        </Text>
      </Pressable>
    );
  }
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View accessibilityViewIsModal style={[s.modal, { maxWidth: 540 }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, gap: 18 }}
          >
            <View style={s.between}>
              <View>
                <Text
                  accessibilityRole="header"
                  style={[s.text, s.cardTitle, { fontSize: 21 }]}
                >
                  อาหารของฉัน
                </Text>
                <Text style={[s.text, s.caption]}>
                  เก็บเมนูโปรดไว้บันทึกได้ทุกวัน
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="ปิดเพิ่มอาหารเอง"
                disabled={busy}
                onPress={onClose}
                style={s.iconButton}
              >
                <X size={22} color={C.green} />
              </Pressable>
            </View>
            <View
              style={{
                height: 185,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: C.soft,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {photo ? (
                <Image
                  accessibilityLabel="รูปอาหารที่เลือก"
                  source={{ uri: photo }}
                  resizeMode="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <>
                  <Utensils size={34} color={C.green} />
                  <Text style={[s.text, s.label]}>เพิ่มรูปมื้ออร่อยของคุณ</Text>
                  <Text style={[s.text, s.caption]}>
                    ถ่ายใหม่ หรือเลือกจากรูปในเครื่อง
                  </Text>
                </>
              )}
              {processing && (
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#FFFFFFC9",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator color={C.green} />
                  <Text style={s.text}>กำลังเตรียมรูป…</Text>
                </View>
              )}
            </View>
            <View style={[s.row, { alignItems: "stretch" }]}>
              <View style={{ flex: 1 }}>
                {action("ถ่ายรูป", Camera, () => void pick("camera"))}
              </View>
              <View style={{ flex: 1 }}>
                {action("เลือกรูป", ImagePlus, () => void pick("library"))}
              </View>
            </View>
            {photo && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => {
                  setPhoto(null);
                  operation.current++;
                }}
                style={{ alignSelf: "center", padding: 10 }}
              >
                <Text style={[s.text, s.caption]}>นำรูปออก</Text>
              </Pressable>
            )}
            {field("name", "ชื่ออาหาร *")}
            <Text style={[s.text, s.label]}>หมวดอาหาร</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {foodCategories.map((category) => (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityState={{ selected: draft.category === category }}
                  disabled={busy}
                  onPress={() => setDraft((d) => ({ ...d, category }))}
                  style={[
                    s.chip,
                    draft.category === category && { backgroundColor: C.green },
                  ]}
                >
                  <Text
                    style={[
                      s.text,
                      s.chipText,
                      draft.category === category && { color: "white" },
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[s.row, { alignItems: "flex-start" }]}>
              <View style={{ flex: 1 }}>{field("unit", "หน่วยบริโภค *")}</View>
              <View style={{ flex: 1 }}>
                {field("grams", "กรัมต่อ 1 หน่วย *", true)}
              </View>
            </View>
            <View style={[s.gentleNote, { padding: 15 }]}>
              <Text style={[s.text, s.caption, { flex: 1 }]}>
                กรอกโภชนาการต่อ 1 {draft.unit || "หน่วย"} ({draft.grams || "—"}{" "}
                กรัม) จากฉลากหรือสูตรอาหาร รูปภาพไม่ได้ใช้คำนวณสารอาหารอัตโนมัติ
              </Text>
            </View>
            {field("kcal", "พลังงาน (kcal) *", true)}
            {field("protein", "โปรตีน (กรัม) *", true)}
            {field("carbs", "คาร์บ (กรัม) *", true)}
            {field("fat", "ไขมัน (กรัม) *", true)}
            <Text style={[s.text, s.caption]}>
              * จำเป็นต้องกรอก · ใส่ 0 หากไม่มีสารอาหารนั้น · รูปภาพไม่บังคับ
            </Text>
            {!!error && (
              <Text accessibilityRole="alert" style={[s.text, s.error]}>
                {error}
              </Text>
            )}
            {settings &&
              Platform.OS !== "web" &&
              action(
                "เปิดการตั้งค่า",
                Camera,
                () => void Linking.openSettings(),
              )}
            {action(
              saving ? "กำลังบันทึก…" : "บันทึกอาหารของฉัน",
              Check,
              () => void submit(),
              true,
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
