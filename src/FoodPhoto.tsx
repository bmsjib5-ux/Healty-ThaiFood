import React, { useEffect, useState } from "react";
import { Image, View, Text } from "react-native";
import { Camera } from "lucide-react-native";
import { Food } from "./model";
import { loadPhoto, releasePhoto } from "./photos";
import { C, s } from "./styles";
const atlas = require("../assets/food-atlas.png");
const positions = [
  "basil",
  "papaya",
  "chicken",
  "rice",
  "egg",
  "banana",
  "noodle",
  "salmon",
  "yogurt",
  "apple",
  "oats",
  "tofu",
];
export function FoodPhoto({ food, size = 80 }: { food: Food; size?: number }) {
  const [uri, setUri] = useState<string | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true,
      loaded: string | null = null;
    setUri(null);
    setFailed(false);
    if (food.photoId)
      loadPhoto(food.photoId)
        .then((value) => {
          loaded = value;
          if (alive) setUri(value);
          else if (value) releasePhoto(value);
        })
        .catch(() => {
          if (alive) setFailed(true);
        });
    return () => {
      alive = false;
      if (loaded) releasePhoto(loaded);
    };
  }, [food.photoId]);
  const index = positions.indexOf(food.id);
  return (
    <View
      accessibilityLabel={`รูป ${food.name}`}
      accessibilityRole="image"
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(18, size / 4),
        backgroundColor: C.soft,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{ width: size, height: size }}
          onError={() => setFailed(true)}
        />
      ) : index >= 0 ? (
        <Image
          source={atlas}
          resizeMode="stretch"
          style={{
            position: "absolute",
            width: size * 4,
            height: size * 3,
            left: -(index % 4) * size,
            top: -Math.floor(index / 4) * size,
          }}
        />
      ) : food.emoji ? (
        // The catalogue is hundreds of items deep and the sprite sheet only
        // covers the original twelve, so everything else shows its emoji rather
        // than a wall of identical camera icons.
        <Text style={{ fontSize: Math.round(size * 0.52) }}>{food.emoji}</Text>
      ) : (
        <>
          <Camera size={size < 60 ? 20 : 28} color={C.muted} />
          {size >= 80 && (
            <Text style={[s.caption, { fontSize: 10 }]}>ไม่มีรูปภาพ</Text>
          )}
        </>
      )}
    </View>
  );
}
