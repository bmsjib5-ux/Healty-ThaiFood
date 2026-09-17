import React, { useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Food } from "./model";
import { FoodArt } from "./FoodArt";
import { loadPhoto, releasePhoto } from "./photos";
import { C } from "./styles";
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
function Photo({ food, size = 80 }: { food: Food; size?: number }) {
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
      ) : (
        // The sprite sheet only covers the original twelve. Everything else is
        // drawn — a plate, a bowl, a glass — rather than shown as an emoji,
        // which read as clip art once there were hundreds of them.
        <FoodArt food={food} size={size} />
      )}
    </View>
  );
}

// The drawing is the most expensive thing on a food card, and a keystroke in
// the search box re-renders every card that is still on screen. Memoising it
// means only the cards that actually changed food are redrawn.
export const FoodPhoto = React.memo(Photo);
