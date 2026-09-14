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
const HEAD_Y = 74,
  HEAD_R = 39,
  BODY_Y = 140,
  BODY_RY = 42;

const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const at = (p: number[]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/**
 * An ellipse whose outline is broken into soft tufts, so the silhouette reads as
 * fur rather than as a balloon. At avatar sizes the outline carries more of the
 * impression than any interior detail, which is why the shaping happens here.
 * `where` keeps the tufts on the skirt of a body or the crown of a head.
 */
function furEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tufts: number,
  depth: number,
  where: "bottom" | "top",
) {
  const n = tufts * 2;
  const pts: number[][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    // Tufts fade out over the half that should stay smooth.
    const side = where === "bottom" ? Math.sin(a) : -Math.sin(a);
    const fade = Math.max(0, Math.min(1, side + 0.35));
    const r = 1 + (i % 2 === 0 ? depth : -depth * 0.4) * fade;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  let d = `M ${at(mid(pts[n - 1], pts[0]))}`;
  for (let i = 0; i < n; i++)
    d += ` Q ${at(pts[i])} ${at(mid(pts[i], pts[(i + 1) % n]))}`;
  return d + " Z";
}

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
        <Path d="M72 52 Q62 22 68 19 Q82 25 95 39 Z" fill={dark} />
        <Path d="M128 52 Q138 22 132 19 Q118 25 105 39 Z" fill={lit} />
        <Path d="M75 46 Q69 29 72 27 Q81 32 89 41 Z" fill={accent} />
        <Path d="M125 46 Q131 29 128 27 Q119 32 111 41 Z" fill={accent} />
      </G>
    );
  if (id === "rabbit")
    return (
      <G>
        <Path d="M83 52 Q72 20 79 12 Q92 20 93 50 Z" fill={dark} />
        <Path d="M117 52 Q128 20 121 12 Q108 20 107 50 Z" fill={lit} />
        <Path d="M84 48 Q77 24 81 19 Q89 26 90 47 Z" fill={accent} />
        <Path d="M116 48 Q123 24 119 19 Q111 26 110 47 Z" fill={accent} />
      </G>
    );
  if (id === "bear")
    return (
      <G>
        <Circle cx={70} cy={44} r={16} fill={dark} />
        <Circle cx={130} cy={44} r={16} fill={lit} />
        <Circle cx={70} cy={44} r={8.5} fill={accent} />
        <Circle cx={130} cy={44} r={8.5} fill={accent} />
      </G>
    );
  return null; // penguin has no ears; its beak stands in for the mouth
}

function Tail({
  id,
  bodyW,
  fur,
  dark,
}: {
  id: PetSpecies;
  bodyW: number;
  fur: string;
  dark: string;
}) {
  const x = 100 + bodyW;
  if (id === "cat")
    return (
      <Path
        d={`M${x - 4} ${BODY_Y + 20} Q${x + 30} ${BODY_Y + 22} ${x + 26} ${BODY_Y - 14} Q${x + 24} ${BODY_Y - 30} ${x + 12} ${BODY_Y - 28}`}
        stroke={dark}
        strokeWidth={13}
        strokeLinecap="round"
        fill="none"
      />
    );
  if (id === "rabbit")
    return <Circle cx={x + 6} cy={BODY_Y + 16} r={12} fill={shade(fur, 0.3)} />;
  if (id === "bear")
    return <Circle cx={x + 2} cy={BODY_Y + 12} r={9} fill={dark} />;
  return null;
}

function Face({
  id,
  mood,
  accent,
  muzzle,
  blink,
}: {
  id: PetSpecies;
  mood: PetMood;
  accent: string;
  muzzle: string;
  blink: boolean;
}) {
  const eyeL = 86,
    eyeR = 114,
    eyeY = 74;
  const beak = id === "penguin";
  const closed = blink || mood === "stuffed";
  const happy = !closed && mood === "full";

  const eyes = closed ? (
    <G>
      {[eyeL, eyeR].map((x) => (
        <Path
          key={x}
          d={`M${x - 8} ${eyeY} q8 6 16 0`}
          stroke="#3A4A3F"
          strokeWidth={3.4}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </G>
  ) : happy ? (
    <G>
      {[eyeL, eyeR].map((x) => (
        <Path
          key={x}
          d={`M${x - 9} ${eyeY + 3} q9 -12 18 0`}
          stroke="#3A4A3F"
          strokeWidth={3.4}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </G>
  ) : (
    <G>
      {[eyeL, eyeR].map((x) => (
        <G key={x}>
          {/* A muted version of the species' accent, not the accent itself: at
              full saturation the rabbit's pink read as red-eye rather than
              as an iris. */}
          <Ellipse cx={x} cy={eyeY} rx={7.4} ry={8.2} fill="#2B3630" />
          <Ellipse cx={x} cy={eyeY + 0.6} rx={5.8} ry={6.6} fill={shade(accent, -0.34)} />
          <Ellipse cx={x} cy={eyeY + 1} rx={3.2} ry={4.4} fill="#1E2723" />
          <Circle cx={x + 2.4} cy={eyeY - 2.8} r={2.4} fill="white" />
          <Circle cx={x - 2.4} cy={eyeY + 3} r={1.2} fill="#FFFFFFAA" />
        </G>
      ))}
    </G>
  );

  if (beak)
    return (
      <G>
        {eyes}
        {(mood === "full" || mood === "stuffed") && (
          <G opacity={0.5}>
            <Ellipse cx={70} cy={86} rx={8} ry={5} fill={accent} />
            <Ellipse cx={130} cy={86} rx={8} ry={5} fill={accent} />
          </G>
        )}
        <Path
          d={
            mood === "stuffed"
              ? "M90 88 Q100 86 110 88 L100 104 Z"
              : "M91 89 Q100 87 109 89 L100 100 Z"
          }
          fill={accent}
        />
        <Path
          d="M93 92 Q100 94 107 92"
          stroke={shade(accent, -0.35)}
          strokeWidth={1.6}
          fill="none"
        />
      </G>
    );

  const mouth =
    mood === "hungry" ? (
      <Path d="M92 101 q8 -4.5 16 0" stroke="#3A4A3F" strokeWidth={2.6} fill="none" strokeLinecap="round" />
    ) : mood === "peckish" ? (
      <Path d="M94 98 h12" stroke="#3A4A3F" strokeWidth={2.8} fill="none" strokeLinecap="round" />
    ) : mood === "stuffed" ? (
      <Ellipse cx={100} cy={99} rx={5} ry={6} fill="#3A4A3F" />
    ) : (
      // The double curve of an animal's mouth, hung under the nose.
      <Path
        d={
          mood === "full"
            ? "M88 94 q6 10 12 3 q6 7 12 -3"
            : "M92 94 q4 7 8 2 q4 5 8 -2"
        }
        stroke="#3A4A3F"
        strokeWidth={2.8}
        fill="none"
        strokeLinecap="round"
      />
    );

  return (
    <G>
      {eyes}
      {(mood === "full" || mood === "stuffed") && (
        <G opacity={0.5}>
          <Ellipse cx={69} cy={88} rx={8.5} ry={5.5} fill={accent} />
          <Ellipse cx={131} cy={88} rx={8.5} ry={5.5} fill={accent} />
        </G>
      )}
      {/* Two soft lobes make a snout, which is most of what separates an
          animal face from a smiley. */}
      <Ellipse cx={94} cy={96} rx={10} ry={8} fill={muzzle} opacity={0.7} />
      <Ellipse cx={106} cy={96} rx={10} ry={8} fill={muzzle} opacity={0.7} />
      {id === "cat" && (
        <G stroke="#3A4A3F" strokeWidth={1.3} strokeLinecap="round" opacity={0.5}>
          <Path d="M78 90 L58 85" />
          <Path d="M78 95 L56 95" />
          <Path d="M78 100 L58 105" />
          <Path d="M122 90 L142 85" />
          <Path d="M122 95 L144 95" />
          <Path d="M122 100 L142 105" />
        </G>
      )}
      <Path d="M95 88 Q100 85 105 88 Q102.5 93 100 93 Q97.5 93 95 88 Z" fill={shade(accent, -0.5)} />
      <Path d="M100 93 v3" stroke="#3A4A3F" strokeWidth={1.8} strokeLinecap="round" />
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
  const smooth = id === "penguin"; // feathers, not fur
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
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        {/* Soft edges without a blur filter: opaque centre fading to nothing. */}
        <RadialGradient id={g("drop")} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#2B3A31" stopOpacity={0.26} />
          <Stop offset="0.6" stopColor="#2B3A31" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#2B3A31" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={g("occl")} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={deep} stopOpacity={0.55} />
          <Stop offset="1" stopColor={deep} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx={100} cy={186} rx={bodyW + 16} ry={12} fill={`url(#${g("drop")})`} />
      <Tail id={id} bodyW={bodyW} fur={fur} dark={dark} />

      {/* Hind paws, with toes — feet are where a shape stops looking like a jar. */}
      {[-1, 1].map((s) => (
        <G key={s}>
          <Ellipse
            cx={100 + s * bodyW * 0.56}
            cy={176}
            rx={17}
            ry={10}
            fill={s < 0 ? dark : shade(fur, 0.12)}
          />
          {[-5, 0, 5].map((o) => (
            <Path
              key={o}
              d={`M${100 + s * bodyW * 0.56 + o} 171 v5`}
              stroke={deep}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.45}
            />
          ))}
        </G>
      ))}

      <Path
        d={
          smooth
            ? furEllipse(100, BODY_Y, bodyW, BODY_RY, 16, 0, "bottom")
            : furEllipse(100, BODY_Y, bodyW, BODY_RY, 9, 0.045, "bottom")
        }
        fill={`url(#${g("body")})`}
      />
      {/* Bounce light along the shaded edge keeps the silhouette from going flat. */}
      <Ellipse
        cx={100 + bodyW * 0.3}
        cy={BODY_Y + 8}
        rx={bodyW * 0.72}
        ry={BODY_RY * 0.8}
        fill={lit}
        opacity={0.16}
      />
      <Ellipse cx={100} cy={BODY_Y + 10} rx={bodyW * 0.6} ry={27} fill={`url(#${g("belly")})`} />

      {/* Front paws, also with toes. */}
      {[-1, 1].map((s) => (
        <G key={s}>
          <Ellipse
            cx={100 + s * (bodyW + 1)}
            cy={BODY_Y + 2}
            rx={11.5}
            ry={18}
            fill={s < 0 ? dark : shade(fur, 0.12)}
          />
          {[-4, 0, 4].map((o) => (
            <Path
              key={o}
              d={`M${100 + s * (bodyW + 1) + o} ${BODY_Y + 13} v5`}
              stroke={deep}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.4}
            />
          ))}
        </G>
      ))}

      <Ears id={id} lit={lit} dark={dark} accent={accent} />
      <Path
        d={
          smooth
            ? furEllipse(100, HEAD_Y, HEAD_R, HEAD_R, 16, 0, "top")
            : furEllipse(100, HEAD_Y, HEAD_R, HEAD_R, 11, 0.038, "top")
        }
        fill={`url(#${g("head")})`}
      />
      {/* Where the head sits on the body. */}
      <Ellipse cx={100} cy={HEAD_Y + HEAD_R - 4} rx={30} ry={12} fill={`url(#${g("occl")})`} />
      {id === "penguin" && (
        <Ellipse cx={100} cy={HEAD_Y + 8} rx={28} ry={27} fill={`url(#${g("belly")})`} />
      )}
      <Ellipse cx={84} cy={54} rx={18} ry={12} fill={`url(#${g("gloss")})`} />
      <Face
        id={id}
        mood={mood}
        accent={accent}
        muzzle={shade(belly, 0.2)}
        blink={blink}
      />
    </Svg>
  );
}
