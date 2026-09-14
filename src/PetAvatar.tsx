import React from "react";
import Svg, { Circle, Ellipse, Path, G } from "react-native-svg";
import {
  shapeWidth,
  speciesInfo,
  type PetMood,
  type PetShape,
  type PetSpecies,
} from "./pet.ts";

// Drawn rather than shipped as art so the body can widen with the weigh-ins and
// the face can change with the day's energy, at any size and with no assets.
const HEAD_Y = 72,
  HEAD_R = 36,
  BODY_Y = 134;

function Ears({
  id,
  fur,
  accent,
}: {
  id: PetSpecies;
  fur: string;
  accent: string;
}) {
  if (id === "cat")
    return (
      <G>
        <Path d="M74 50 L67 21 L95 37 Z" fill={fur} />
        <Path d="M126 50 L133 21 L105 37 Z" fill={fur} />
        <Path d="M76 46 L72 30 L88 39 Z" fill={accent} />
        <Path d="M124 46 L128 30 L112 39 Z" fill={accent} />
      </G>
    );
  if (id === "rabbit")
    return (
      <G>
        <Ellipse cx={85} cy={24} rx={10} ry={27} fill={fur} />
        <Ellipse cx={115} cy={24} rx={10} ry={27} fill={fur} />
        <Ellipse cx={85} cy={26} rx={5} ry={19} fill={accent} />
        <Ellipse cx={115} cy={26} rx={5} ry={19} fill={accent} />
      </G>
    );
  if (id === "bear")
    return (
      <G>
        <Circle cx={73} cy={43} r={15} fill={fur} />
        <Circle cx={127} cy={43} r={15} fill={fur} />
        <Circle cx={73} cy={43} r={7} fill={accent} />
        <Circle cx={127} cy={43} r={7} fill={accent} />
      </G>
    );
  return null; // penguin has no ears; it gets a beak below instead
}

function Face({
  mood,
  accent,
  beak,
}: {
  mood: PetMood;
  accent: string;
  beak: boolean;
}) {
  const eyeL = 87,
    eyeR = 113,
    eyeY = 72;
  const eyes =
    mood === "stuffed" ? (
      <G>
        <Path
          d={`M${eyeL - 6} ${eyeY} h12`}
          stroke="#2B3A31"
          strokeWidth={3.4}
          strokeLinecap="round"
        />
        <Path
          d={`M${eyeR - 6} ${eyeY} h12`}
          stroke="#2B3A31"
          strokeWidth={3.4}
          strokeLinecap="round"
        />
      </G>
    ) : mood === "full" ? (
      <G>
        <Path
          d={`M${eyeL - 7} ${eyeY + 3} q7 -10 14 0`}
          stroke="#2B3A31"
          strokeWidth={3.4}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M${eyeR - 7} ${eyeY + 3} q7 -10 14 0`}
          stroke="#2B3A31"
          strokeWidth={3.4}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    ) : (
      <G>
        <Circle cx={eyeL} cy={eyeY} r={4.6} fill="#2B3A31" />
        <Circle cx={eyeR} cy={eyeY} r={4.6} fill="#2B3A31" />
        <Circle cx={eyeL + 1.6} cy={eyeY - 1.8} r={1.5} fill="white" />
        <Circle cx={eyeR + 1.6} cy={eyeY - 1.8} r={1.5} fill="white" />
      </G>
    );
  // The beak stands in for the mouth, so a penguin carries its mood in the eyes
  // and in how far the beak opens.
  const mouth = beak ? (
    mood === "stuffed" ? (
      <Path d="M91 84 L109 84 L100 99 Z" fill={accent} />
    ) : (
      <Path d="M92 85 L108 85 L100 95 Z" fill={accent} />
    )
  ) : mood === "hungry" ? (
      <Path
        d="M92 90 q8 -7 16 0"
        stroke="#2B3A31"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    ) : mood === "peckish" ? (
      <Path
        d="M93 89 h14"
        stroke="#2B3A31"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    ) : mood === "stuffed" ? (
      <Ellipse cx={100} cy={90} rx={5} ry={6} fill="#2B3A31" />
    ) : (
      <Path
        d={mood === "full" ? "M89 85 q11 12 22 0" : "M93 86 q7 8 14 0"}
        stroke="#2B3A31"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
    );
  return (
    <G>
      {eyes}
      {(mood === "full" || mood === "stuffed") && (
        <G opacity={0.55}>
          <Ellipse cx={74} cy={83} rx={7} ry={4.5} fill={accent} />
          <Ellipse cx={126} cy={83} rx={7} ry={4.5} fill={accent} />
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
}: {
  species: PetSpecies;
  shape: PetShape;
  mood: PetMood;
  size?: number;
}) {
  const { fur, belly, accent } = speciesInfo(id);
  const bodyW = shapeWidth[shape];
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Ellipse cx={100} cy={184} rx={bodyW + 6} ry={7} fill="#00000012" />
      <Ellipse cx={100 - bodyW * 0.62} cy={176} rx={15} ry={8} fill={fur} />
      <Ellipse cx={100 + bodyW * 0.62} cy={176} rx={15} ry={8} fill={fur} />
      <Ellipse cx={100} cy={BODY_Y} rx={bodyW} ry={45} fill={fur} />
      <Ellipse
        cx={100}
        cy={BODY_Y + 8}
        rx={bodyW * 0.63}
        ry={31}
        fill={belly}
      />
      <Ellipse cx={100 - bodyW - 2} cy={BODY_Y + 2} rx={10} ry={17} fill={fur} />
      <Ellipse cx={100 + bodyW + 2} cy={BODY_Y + 2} rx={10} ry={17} fill={fur} />
      <Ears id={id} fur={fur} accent={accent} />
      <Circle cx={100} cy={HEAD_Y} r={HEAD_R} fill={fur} />
      {id === "penguin" && (
        <Ellipse cx={100} cy={HEAD_Y + 6} rx={26} ry={26} fill={belly} />
      )}
      <Face mood={mood} accent={accent} beak={id === "penguin"} />
    </Svg>
  );
}
