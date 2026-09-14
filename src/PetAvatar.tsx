import React, { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";
import {
  shade,
  shapeWidth,
  speciesInfo,
  type PetMood,
  type PetShape,
  type PetSpecies,
} from "./pet.ts";

// Drawn rather than shipped as art so the body can widen with the weigh-ins and
// the face can change with the day's energy, at any size and with no assets.
// Volume comes from radial gradients lit from the upper left plus a bounce-light
// rim on the opposite edge — react-native-svg has no dependable blur filter on
// every platform, so every soft edge here is a gradient fading to transparent.
const HEAD_Y = 70,
  HEAD_R = 40,
  BODY_Y = 140,
  BODY_RY = 43;

function Ears({
  id,
  lit,
  dark,
  accent,
}: {
  id: PetSpecies;
  lit: string;
  dark: string;
  accent: string;
}) {
  if (id === "cat")
    return (
      <G>
        <Path d="M73 48 Q66 20 70 19 Q82 24 95 36 Z" fill={dark} />
        <Path d="M127 48 Q134 20 130 19 Q118 24 105 36 Z" fill={lit} />
        <Path d="M76 43 Q72 28 74 27 Q82 31 89 39 Z" fill={accent} />
        <Path d="M124 43 Q128 28 126 27 Q118 31 111 39 Z" fill={accent} />
      </G>
    );
  if (id === "rabbit")
    return (
      <G>
        <Ellipse cx={84} cy={22} rx={10} ry={28} fill={dark} />
        <Ellipse cx={116} cy={22} rx={10} ry={28} fill={lit} />
        <Ellipse cx={84} cy={24} rx={5} ry={20} fill={accent} />
        <Ellipse cx={116} cy={24} rx={5} ry={20} fill={accent} />
      </G>
    );
  if (id === "bear")
    return (
      <G>
        <Circle cx={72} cy={40} r={16} fill={dark} />
        <Circle cx={128} cy={40} r={16} fill={lit} />
        <Circle cx={72} cy={40} r={8} fill={accent} />
        <Circle cx={128} cy={40} r={8} fill={accent} />
      </G>
    );
  return null; // penguin has no ears; its beak stands in for the mouth
}

function Face({
  mood,
  accent,
  beak,
  blink,
}: {
  mood: PetMood;
  accent: string;
  beak: boolean;
  blink: boolean;
}) {
  const eyeL = 86,
    eyeR = 114,
    eyeY = 71;
  // A blink borrows the closed-eye shape, so it reads the same on every mood.
  const closed = blink || mood === "stuffed";
  const happy = !closed && mood === "full";
  const eyes = closed ? (
    <G>
      <Path
        d={`M${eyeL - 7} ${eyeY} q7 5 14 0`}
        stroke="#3A4A3F"
        strokeWidth={3.6}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d={`M${eyeR - 7} ${eyeY} q7 5 14 0`}
        stroke="#3A4A3F"
        strokeWidth={3.6}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  ) : happy ? (
    <G>
      <Path
        d={`M${eyeL - 8} ${eyeY + 3} q8 -11 16 0`}
        stroke="#3A4A3F"
        strokeWidth={3.6}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d={`M${eyeR - 8} ${eyeY + 3} q8 -11 16 0`}
        stroke="#3A4A3F"
        strokeWidth={3.6}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  ) : (
    <G>
      <Ellipse cx={eyeL} cy={eyeY} rx={5.6} ry={6.2} fill="#3A4A3F" />
      <Ellipse cx={eyeR} cy={eyeY} rx={5.6} ry={6.2} fill="#3A4A3F" />
      <Circle cx={eyeL + 2} cy={eyeY - 2.4} r={2.1} fill="white" />
      <Circle cx={eyeR + 2} cy={eyeY - 2.4} r={2.1} fill="white" />
      <Circle cx={eyeL - 1.8} cy={eyeY + 2.4} r={1} fill="#FFFFFFAA" />
      <Circle cx={eyeR - 1.8} cy={eyeY + 2.4} r={1} fill="#FFFFFFAA" />
    </G>
  );
  const mouth = beak ? (
    mood === "stuffed" ? (
      <Path d="M91 83 Q100 82 109 83 L100 98 Z" fill={accent} />
    ) : (
      <Path d="M92 84 Q100 83 108 84 L100 94 Z" fill={accent} />
    )
  ) : mood === "hungry" ? (
    <Path
      d="M93 90 q7 -6 14 0"
      stroke="#3A4A3F"
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />
  ) : mood === "peckish" ? (
    <Path
      d="M94 88 h12"
      stroke="#3A4A3F"
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />
  ) : mood === "stuffed" ? (
    <Ellipse cx={100} cy={89} rx={5.5} ry={6.5} fill="#3A4A3F" />
  ) : (
    <Path
      d={mood === "full" ? "M89 84 q11 12 22 0" : "M93 85 q7 8 14 0"}
      stroke="#3A4A3F"
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />
  );
  return (
    <G>
      {eyes}
      {(mood === "full" || mood === "stuffed") && (
        <G opacity={0.5}>
          <Ellipse cx={72} cy={82} rx={8} ry={5} fill={accent} />
          <Ellipse cx={128} cy={82} rx={8} ry={5} fill={accent} />
        </G>
      )}
      {mouth}
    </G>
  );
}

export function PetAvatar({
  species: id,
  shape,
  mood,
  size = 168,
  blink = false,
}: {
  species: PetSpecies;
  shape: PetShape;
  mood: PetMood;
  size?: number;
  blink?: boolean;
}) {
  const { fur, belly, accent } = speciesInfo(id);
  const bodyW = shapeWidth[shape];
  // Gradient ids are document-global on web, and the picker shows four avatars
  // at once, so each instance namespaces its own.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = (name: string) => `${name}${uid}`;
  const lit = shade(fur, 0.26),
    dark = shade(fur, -0.24),
    deep = shade(fur, -0.4);
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={g("body")} cx="34%" cy="24%" r="86%">
          <Stop offset="0" stopColor={lit} />
          <Stop offset="0.52" stopColor={fur} />
          <Stop offset="1" stopColor={deep} />
        </RadialGradient>
        <RadialGradient id={g("head")} cx="33%" cy="24%" r="82%">
          <Stop offset="0" stopColor={lit} />
          <Stop offset="0.5" stopColor={fur} />
          <Stop offset="1" stopColor={dark} />
        </RadialGradient>
        <RadialGradient id={g("belly")} cx="42%" cy="34%" r="78%">
          <Stop offset="0" stopColor={shade(belly, 0.35)} />
          <Stop offset="1" stopColor={shade(belly, -0.12)} />
        </RadialGradient>
        <RadialGradient id={g("gloss")} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.72} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        {/* Soft edges without a blur filter: opaque centre fading to nothing. */}
        <RadialGradient id={g("drop")} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#2B3A31" stopOpacity={0.26} />
          <Stop offset="0.6" stopColor="#2B3A31" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#2B3A31" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={g("occl")} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={deep} stopOpacity={0.5} />
          <Stop offset="1" stopColor={deep} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx={100} cy={186} rx={bodyW + 16} ry={12} fill={`url(#${g("drop")})`} />
      <Ellipse cx={100 - bodyW * 0.58} cy={175} rx={16} ry={9} fill={dark} />
      <Ellipse cx={100 + bodyW * 0.58} cy={175} rx={16} ry={9} fill={shade(fur, 0.1)} />

      <Ellipse cx={100} cy={BODY_Y} rx={bodyW} ry={BODY_RY} fill={`url(#${g("body")})`} />
      {/* Bounce light along the shaded edge keeps the silhouette from going flat. */}
      <Ellipse
        cx={100 + bodyW * 0.3}
        cy={BODY_Y + 8}
        rx={bodyW * 0.72}
        ry={BODY_RY * 0.8}
        fill={lit}
        opacity={0.18}
      />
      <Ellipse cx={100} cy={BODY_Y + 9} rx={bodyW * 0.6} ry={28} fill={`url(#${g("belly")})`} />
      <Ellipse cx={100 - bodyW - 1} cy={BODY_Y - 2} rx={11} ry={18} fill={dark} />
      <Ellipse cx={100 + bodyW + 1} cy={BODY_Y - 2} rx={11} ry={18} fill={shade(fur, 0.12)} />

      <Ears id={id} lit={lit} dark={dark} accent={accent} />
      <Circle cx={100} cy={HEAD_Y} r={HEAD_R} fill={`url(#${g("head")})`} />
      {/* Where the head sits on the body. */}
      <Ellipse cx={100} cy={HEAD_Y + HEAD_R - 4} rx={30} ry={12} fill={`url(#${g("occl")})`} />
      {id === "penguin" && (
        <Ellipse cx={100} cy={HEAD_Y + 8} rx={28} ry={27} fill={`url(#${g("belly")})`} />
      )}
      <Ellipse cx={84} cy={50} rx={19} ry={13} fill={`url(#${g("gloss")})`} />
      <Face mood={mood} accent={accent} beak={id === "penguin"} blink={blink} />
    </Svg>
  );
}
