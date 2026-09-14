import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform } from "react-native";
import { PetAvatar } from "./PetAvatar.tsx";
import type { PetMood, PetShape, PetSpecies } from "./pet.ts";

// Transforms drive every motion, so the SVG itself never re-renders for the
// idle loops. The native driver handles them off the JS thread on device; web
// has no native driver, so it opts out there rather than warning on every tick.
const NATIVE = Platform.OS !== "web";

export function PetStage({
  species,
  shape,
  mood,
  size,
  celebrate,
  onCelebrated,
}: {
  species: PetSpecies;
  shape: PetShape;
  mood: PetMood;
  size: number;
  /**
   * Non-zero asks for one hop. Logging a meal also switches back to this tab,
   * which remounts the pet, so the request has to be held by the caller — a
   * count compared against a ref here would reset on every remount and the hop
   * would never play.
   */
  celebrate: number;
  /** Called once the hop has been claimed, so the caller can clear it. */
  onCelebrated: () => void;
}) {
  const breath = useRef(new Animated.Value(0)).current,
    sway = useRef(new Animated.Value(0)).current,
    hop = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = useState(false);
  const [still, setStill] = useState(false);

  // Continuous motion is exactly what "reduce motion" is meant to suppress.
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => alive && setStill(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (on) => alive && setStill(on),
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (still) {
      breath.setValue(0);
      sway.setValue(0);
      return;
    }
    const loop = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: NATIVE,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: NATIVE,
          }),
        ]),
      );
    // Slightly different periods so the two never lock into one stiff rhythm.
    const breathing = loop(breath, 1900),
      swaying = loop(sway, 2600);
    breathing.start();
    swaying.start();
    return () => {
      breathing.stop();
      swaying.stop();
    };
  }, [still, breath, sway]);

  // Irregular gaps read as alive; a fixed interval reads as a machine.
  useEffect(() => {
    if (still) {
      setBlink(false);
      return;
    }
    let open: ReturnType<typeof setTimeout>;
    let next = setTimeout(function tick() {
      setBlink(true);
      open = setTimeout(() => {
        setBlink(false);
        next = setTimeout(tick, 2200 + Math.random() * 3600);
      }, 140);
    }, 1200 + Math.random() * 2600);
    return () => {
      clearTimeout(next);
      clearTimeout(open);
    };
  }, [still]);

  useEffect(() => {
    if (!celebrate) return;
    onCelebrated();
    if (still) return;
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE,
      }),
      Animated.spring(hop, {
        toValue: 0,
        friction: 4,
        tension: 90,
        useNativeDriver: NATIVE,
      }),
    ]).start();
  }, [celebrate, onCelebrated, still, hop]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
          {
            translateY: breath.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -3],
            }),
          },
          {
            rotate: sway.interpolate({
              inputRange: [0, 1],
              outputRange: ["-2.2deg", "2.2deg"],
            }),
          },
          {
            scaleY: breath.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.035],
            }),
          },
          {
            scaleX: hop.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.94],
            }),
          },
        ],
      }}
    >
      <PetAvatar
        species={species}
        shape={shape}
        mood={mood}
        size={size}
        blink={blink}
      />
    </Animated.View>
  );
}
