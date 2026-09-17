import React, { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { shade } from "./color.ts";
import { artFor, type Scene } from "./foodArt.ts";
import type { Food } from "./model.ts";

// Drawn rather than photographed. Photographing four hundred dishes is not on
// the table, and a wall of identical emoji read as clip art, so each food gets
// a small still life instead: a real vessel, a horizon, a light source at the
// upper left and a contact shadow underneath. Depth comes from gradients —
// react-native-svg has no dependable blur filter on every platform, so every
// soft edge here is a gradient fading out rather than a blur.
//
// Everything is drawn in a 100x100 box with the table at y = 86, so the dishes
// sit at a consistent height however they are scaled.

const light = (c: string) => shade(c, 0.26);
const deep = (c: string) => shade(c, -0.3);
const darker = (c: string) => shade(c, -0.5);

const CERAMIC = "#FBFAF5",
  CERAMIC_EDGE = "#DCDFD2",
  INK = "#2B3630";

function Table({ id }: { id: string }) {
  return (
    <Ellipse cx={50} cy={87} rx={30} ry={5.5} fill={`url(#${id}shadow)`} />
  );
}

/** Two-stop gradients, named so a scene can ask for one by role. */
function Grad({
  id,
  from,
  to,
  vertical = true,
}: {
  id: string;
  from: string;
  to: string;
  vertical?: boolean;
}) {
  return (
    <LinearGradient
      id={id}
      x1="0"
      y1="0"
      x2={vertical ? "0" : "1"}
      y2={vertical ? "1" : "0"}
    >
      <Stop offset="0" stopColor={from} />
      <Stop offset="1" stopColor={to} />
    </LinearGradient>
  );
}

function Steam({ x, delayOpacity }: { x: number; delayOpacity: number }) {
  return (
    <Path
      d={`M${x} 30 q-4 -6 0 -11 q4 -5 0 -10`}
      stroke="#FFFFFF"
      strokeWidth={2.4}
      strokeLinecap="round"
      fill="none"
      opacity={delayOpacity}
    />
  );
}

// A number in [0, 1) derived from the food's id, so two rice plates next to
// each other are not carbon copies of one another. The same name always gives
// the same picture — the variation is fixed per food, not per render.
function spin(seed: number, degrees: number) {
  return ((seed * 2 - 1) * degrees).toFixed(1);
}
type SceneProps = { id: string; tint: string; seed: number };

function Glass({ id, tint }: SceneProps) {
  return (
    <>
      <Defs>
        <Grad id={`${id}liquid`} from={light(tint)} to={deep(tint)} />
        <Grad id={`${id}glass`} from="#FFFFFF" to="#D9E3E6" />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Path
        d="M33 24 L37 79 Q38 86 50 86 Q62 86 63 79 L67 24 Z"
        fill={`url(#${id}glass)`}
        opacity={0.55}
      />
      <Path
        d="M35.4 33 L38.8 78 Q39.5 83 50 83 Q60.5 83 61.2 78 L64.6 33 Z"
        fill={`url(#${id}liquid)`}
      />
      <Ellipse cx={50} cy={33} rx={14.6} ry={3.4} fill={light(tint)} />
      <Rect
        x={39}
        y={40}
        width={11}
        height={11}
        rx={2.6}
        fill="#FFFFFF"
        opacity={0.42}
        transform="rotate(-12 44 46)"
      />
      <Rect
        x={51}
        y={54}
        width={10}
        height={10}
        rx={2.4}
        fill="#FFFFFF"
        opacity={0.34}
        transform="rotate(14 56 59)"
      />
      <Path
        d="M56 12 L62 48"
        stroke={shade(tint, -0.15)}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path
        d="M40 36 L43 74"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Ellipse
        cx={50}
        cy={24}
        rx={17}
        ry={4.2}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        opacity={0.85}
      />
    </>
  );
}

function Mug({ id, tint }: SceneProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}liquid`} cx="38%" cy="32%" r="78%">
          <Stop offset="0" stopColor={light(tint)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <Grad id={`${id}cup`} from="#FFFFFF" to={CERAMIC_EDGE} vertical={false} />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Ellipse cx={50} cy={82} rx={30} ry={6} fill={CERAMIC} />
      <Ellipse cx={50} cy={81} rx={22} ry={4} fill={CERAMIC_EDGE} opacity={0.6} />
      <Path
        d="M68 47 Q80 48 80 57 Q80 66 67 67"
        stroke={CERAMIC_EDGE}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M29 40 L32.5 71 Q33.5 79 50 79 Q66.5 79 67.5 71 L71 40 Z"
        fill={`url(#${id}cup)`}
      />
      <Ellipse cx={50} cy={40} rx={21} ry={5.8} fill={CERAMIC} />
      <Ellipse cx={50} cy={40.4} rx={18} ry={4.6} fill={`url(#${id}liquid)`} />
      <Ellipse cx={44} cy={39} rx={6} ry={1.8} fill="#FFFFFF" opacity={0.28} />
      <Path
        d="M34 46 L37 70"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Steam x={43} delayOpacity={0.55} />
      <Steam x={57} delayOpacity={0.35} />
    </>
  );
}

function Bottle({ id, tint }: SceneProps) {
  const pale = tint === "#F3EDDF";
  return (
    <>
      <Defs>
        <Grad id={`${id}body`} from={light(tint)} to={deep(tint)} vertical={false} />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Path
        d="M41 32 L41 24 L59 24 L59 32 Q70 39 70 56 L70 78 Q70 85 62 85 L38 85 Q30 85 30 78 L30 56 Q30 39 41 32 Z"
        fill={`url(#${id}body)`}
      />
      <Rect x={39} y={14} width={22} height={11} rx={3} fill={darker(tint)} />
      <Rect
        x={30}
        y={54}
        width={40}
        height={19}
        fill="#FFFFFF"
        opacity={pale ? 0.55 : 0.88}
      />
      <Rect x={30} y={54} width={40} height={3.4} fill={shade(tint, -0.2)} opacity={0.5} />
      <Circle cx={50} cy={64} r={6.4} fill={deep(tint)} opacity={0.55} />
      <Path
        d="M37 38 L36 78"
        stroke="#FFFFFF"
        strokeWidth={3.4}
        strokeLinecap="round"
        opacity={0.45}
      />
      <Path
        d="M64 44 L64 78"
        stroke={darker(tint)}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.3}
      />
    </>
  );
}

function Bowl({ id, tint }: SceneProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}broth`} cx="36%" cy="30%" r="80%">
          <Stop offset="0" stopColor={light(tint)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <Grad id={`${id}bowl`} from="#FFFFFF" to={CERAMIC_EDGE} />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Path
        d="M16 44 Q19 84 50 84 Q81 84 84 44 Z"
        fill={`url(#${id}bowl)`}
      />
      <Ellipse cx={50} cy={44} rx={34} ry={9.5} fill={CERAMIC} />
      <Ellipse cx={50} cy={45} rx={30} ry={7.8} fill={`url(#${id}broth)`} />
      {/* What is in the bowl: two pieces of protein, a herb and a chilli. */}
      <Ellipse cx={42} cy={43} rx={7} ry={3.4} fill={shade(tint, -0.22)} transform="rotate(-14 42 43)" />
      <Ellipse cx={58} cy={47} rx={6.4} ry={3} fill={shade(tint, 0.18)} transform="rotate(10 58 47)" />
      <Circle cx={51} cy={42} r={2.6} fill="#6E9B4E" />
      <Ellipse cx={61} cy={42} rx={4} ry={1.5} fill="#CC4B34" transform="rotate(-18 61 42)" />
      <Path
        d="M24 48 Q26 72 42 79"
        stroke="#FFFFFF"
        strokeWidth={3.4}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
      <Steam x={44} delayOpacity={0.5} />
      <Steam x={58} delayOpacity={0.3} />
    </>
  );
}

function Plate({ id, tint, seed }: SceneProps) {
  return (
    <>
      <Defs>
        <Grad id={`${id}plate`} from="#FFFFFF" to={CERAMIC_EDGE} />
        <RadialGradient id={`${id}rice`} cx="32%" cy="24%" r="82%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#DFDCCD" />
        </RadialGradient>
        <RadialGradient id={`${id}top`} cx="34%" cy="26%" r="82%">
          <Stop offset="0" stopColor={light(tint)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Ellipse cx={50} cy={64} rx={43} ry={20} fill={`url(#${id}plate)`} />
      <Ellipse cx={50} cy={64} rx={34} ry={14.5} fill="#F1F1E8" />
      <Ellipse
        cx={50}
        cy={64}
        rx={34}
        ry={14.5}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        opacity={0.9}
      />
      {/* Rice, built from overlapping domes so it reads as a heap of grains
          rather than as one smooth lump. */}
      <Ellipse cx={36} cy={60} rx={17} ry={9.4} fill={`url(#${id}rice)`} />
      <Ellipse cx={32} cy={54} rx={11} ry={6.6} fill={`url(#${id}rice)`} />
      <Ellipse cx={42} cy={52} rx={9.4} ry={5.8} fill={`url(#${id}rice)`} />
      <G opacity={0.35} stroke="#C9C6B4" strokeWidth={1.3} strokeLinecap="round">
        <Path d="M27 59 l5 -1.6" />
        <Path d="M36 63 l5 -1.4" />
        <Path d="M31 49 l4.6 -1.2" />
      </G>
      {/* The topping: a few pieces at different sizes and angles. */}
      <G transform={`rotate(${spin(seed, 16)} 64 59)`}>
        <Ellipse cx={61} cy={62} rx={8.4} ry={5.2} fill={`url(#${id}top)`} transform="rotate(-12 61 62)" />
        <Ellipse cx={70} cy={57} rx={7} ry={4.4} fill={shade(tint, 0.2)} transform="rotate(18 70 57)" />
        <Ellipse cx={60} cy={53} rx={6.6} ry={4} fill={shade(tint, -0.18)} transform="rotate(-24 60 53)" />
        <Ellipse cx={69} cy={65} rx={6} ry={3.6} fill={`url(#${id}top)`} transform="rotate(10 69 65)" />
      </G>
      <Path d="M50 47 q7 -6 13 -2 q-6 7 -13 2 Z" fill="#6E9B4E" />
      <Ellipse cx={55} cy={67} rx={4.4} ry={1.7} fill="#CC4B34" transform="rotate(14 55 67)" />
      <Path
        d="M17 60 q3 -13 18 -18"
        stroke="#FFFFFF"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
    </>
  );
}

function Grill({ id, tint, seed }: SceneProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}meat`} cx="34%" cy="26%" r="82%">
          <Stop offset="0" stopColor={light(tint)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Ellipse cx={50} cy={64} rx={38} ry={17} fill={CERAMIC} />
      <Ellipse cx={50} cy={64} rx={30} ry={12.5} fill="#F1F1E8" />
      <G transform={`rotate(${spin(seed, 10)} 50 58)`}>
      <Path
        d="M24 48 Q48 36 74 46 Q84 58 74 70 Q48 80 26 70 Q16 58 24 48 Z"
        fill={`url(#${id}meat)`}
      />
      <G opacity={0.55}>
        <Path d="M32 46 L44 72" stroke={darker(tint)} strokeWidth={3.4} strokeLinecap="round" />
        <Path d="M46 41 L58 72" stroke={darker(tint)} strokeWidth={3.4} strokeLinecap="round" />
        <Path d="M60 43 L70 66" stroke={darker(tint)} strokeWidth={3.4} strokeLinecap="round" />
      </G>
      <Path
        d="M30 50 Q46 42 62 45"
        stroke="#FFFFFF"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />
      </G>
      <Path d="M70 40 q8 -6 12 -1 q-7 6 -12 1 Z" fill="#6E9B4E" />
    </>
  );
}

function Fried({ id, tint, seed }: SceneProps) {
  const piece = (cx: number, cy: number, r: number, rot: number) => (
    <Path
      d={`M${cx - r} ${cy} q${r * 0.2} -${r * 0.95} ${r} -${r * 0.85} q${r * 0.9} -${r * 0.1} ${r} ${r * 0.85} q-${r * 0.1} ${r * 0.9} -${r} ${r * 0.8} q-${r * 0.9} ${r * 0.1} -${r} -${r * 0.8} Z`}
      fill={`url(#${tintId(cx)})`}
      transform={`rotate(${rot} ${cx} ${cy})`}
    />
  );
  const tintId = (cx: number) => `${id}p${cx}`;
  return (
    <>
      <Defs>
        {[32, 54, 44].map((cx) => (
          <RadialGradient key={cx} id={tintId(cx)} cx="34%" cy="26%" r="82%">
            <Stop offset="0" stopColor={shade(tint, 0.34)} />
            <Stop offset="1" stopColor={deep(tint)} />
          </RadialGradient>
        ))}
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Ellipse cx={50} cy={66} rx={38} ry={17} fill={CERAMIC} />
      <Ellipse cx={50} cy={66} rx={30} ry={12.5} fill="#F1F1E8" />
      <G transform={`rotate(${spin(seed, 18)} 46 57)`}>
        {piece(32, 60, 15, -18)}
        {piece(54, 64, 17, 12)}
        {piece(44, 46, 14, -4)}
      </G>
      <Circle cx={38} cy={44} r={2} fill={shade(tint, 0.45)} opacity={0.8} />
      <Circle cx={50} cy={42} r={1.6} fill={shade(tint, 0.45)} opacity={0.7} />
      <Circle cx={62} cy={57} r={1.8} fill={shade(tint, 0.45)} opacity={0.7} />
      <Path d="M68 44 q9 -6 13 -1 q-8 6 -13 1 Z" fill="#6E9B4E" />
    </>
  );
}

function Greens({ id, tint, seed }: SceneProps) {
  const leaf = (rot: number, scale: number, fill: string) => (
    <G transform={`translate(50 80) rotate(${rot}) scale(${scale})`}>
      <Path d="M0 0 C-14 -10 -16 -31 0 -46 C16 -31 14 -10 0 0 Z" fill={fill} />
      <Path
        d="M0 -3 L0 -40"
        stroke={darker(tint)}
        strokeWidth={1.5}
        opacity={0.35}
      />
      <G opacity={0.28} stroke={darker(tint)} strokeWidth={1.2}>
        <Path d="M0 -14 l-7 -6" />
        <Path d="M0 -24 l-6 -7" />
        <Path d="M0 -14 l7 -6" />
        <Path d="M0 -24 l6 -7" />
      </G>
    </G>
  );
  return (
    <>
      <Defs>
        <Grad id={`${id}a`} from={shade(tint, 0.34)} to={deep(tint)} />
        <Grad id={`${id}b`} from={shade(tint, 0.1)} to={darker(tint)} />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      {leaf(-36 + Number(spin(seed, 7)), 0.92, `url(#${id}b)`)}
      {leaf(34 + Number(spin(seed, 7)), 0.88, `url(#${id}b)`)}
      {leaf(-2 + Number(spin(seed, 5)), 1.08, `url(#${id}a)`)}
      <Path
        d="M50 84 L50 74"
        stroke={darker(tint)}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.6}
      />
    </>
  );
}

function Fruit({ id, tint, seed }: SceneProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}skin`} cx="33%" cy="26%" r="84%">
          <Stop offset="0" stopColor={shade(tint, 0.42)} />
          <Stop offset="0.62" stopColor={tint} />
          <Stop offset="1" stopColor={darker(tint)} />
        </RadialGradient>
        <RadialGradient id={`${id}bounce`} cx="70%" cy="82%" r="46%">
          <Stop offset="0" stopColor={shade(tint, 0.5)} stopOpacity={0.55} />
          <Stop offset="1" stopColor={shade(tint, 0.5)} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Circle cx={50} cy={55} r={28} fill={`url(#${id}skin)`} />
      <Circle cx={50} cy={55} r={28} fill={`url(#${id}bounce)`} />
      <Ellipse cx={39} cy={43} rx={8.5} ry={5.6} fill="#FFFFFF" opacity={0.42} transform="rotate(-28 39 43)" />
      <Path
        d="M50 28 q1 -8 -2 -13"
        stroke="#7A5A32"
        strokeWidth={3.4}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M50 22 q12 -9 20 -3 q-8 11 -20 3 Z" fill="#6E9B4E" transform={`rotate(${spin(seed, 22)} 50 24)`} />
    </>
  );
}

function Egg({ id, tint }: SceneProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}yolk`} cx="34%" cy="28%" r="80%">
          <Stop offset="0" stopColor={shade(tint, 0.4)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <Grad id={`${id}white`} from="#FFFFFF" to="#EDE9DC" />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Path
        d="M22 58 Q16 40 34 35 Q42 22 58 28 Q80 26 82 46 Q88 64 70 70 Q52 80 34 72 Q22 72 22 58 Z"
        fill={`url(#${id}white)`}
      />
      <Circle cx={53} cy={51} r={15} fill={`url(#${id}yolk)`} />
      <Ellipse cx={47} cy={45} rx={5} ry={3.4} fill="#FFFFFF" opacity={0.45} transform="rotate(-26 47 45)" />
      <Path
        d="M28 58 q-2 -12 8 -18"
        stroke="#FFFFFF"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
    </>
  );
}

function Bread({ id, tint }: SceneProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}crust`} cx="32%" cy="22%" r="86%">
          <Stop offset="0" stopColor={shade(tint, 0.38)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Path
        d="M18 76 Q14 44 50 40 Q86 44 82 76 Q50 84 18 76 Z"
        fill={`url(#${id}crust)`}
      />
      <Path
        d="M20 72 Q50 78 80 72 L80 76 Q50 84 20 76 Z"
        fill="#F3E7CE"
        opacity={0.75}
      />
      <G opacity={0.4}>
        <Path d="M34 50 q6 -6 13 -6" stroke={darker(tint)} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <Path d="M54 46 q7 0 12 6" stroke={darker(tint)} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      </G>
      <Circle cx={42} cy={50} r={1.8} fill="#F6EEDC" opacity={0.85} />
      <Circle cx={58} cy={52} r={1.6} fill="#F6EEDC" opacity={0.85} />
      <Path
        d="M24 66 q-2 -16 14 -22"
        stroke="#FFFFFF"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />
    </>
  );
}

function Sweet({ id, tint }: SceneProps) {
  return (
    <>
      <Defs>
        <Grad id={`${id}top`} from={shade(tint, 0.34)} to={deep(tint)} />
        <Grad id={`${id}base`} from={shade(tint, 0.05)} to={shade(tint, -0.55)} />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Path
        d="M29 44 L33 76 Q34 83 50 83 Q66 83 67 76 L71 44 Z"
        fill="#FFFFFF"
        opacity={0.55}
      />
      <Path d="M31.4 52 L34 75 Q35 80 50 80 Q65 80 66 75 L68.6 52 Z" fill={`url(#${id}base)`} />
      <Path d="M30.4 44 L31.6 53 L68.4 53 L69.6 44 Z" fill={`url(#${id}top)`} />
      <Path
        d="M36 44 q4 -12 14 -12 q10 0 14 12 q-6 4 -14 4 q-8 0 -14 -4 Z"
        fill="#FFFDF6"
      />
      <Circle cx={50} cy={28} r={5} fill="#D8484F" />
      <Ellipse cx={48} cy={26} rx={1.6} ry={1.1} fill="#FFFFFF" opacity={0.6} />
      <Path
        d="M35 56 L37 74"
        stroke="#FFFFFF"
        strokeWidth={2.6}
        strokeLinecap="round"
        opacity={0.45}
      />
    </>
  );
}

function Nuts({ id, tint, seed }: SceneProps) {
  const seeds: [number, number, number][] = [
    [34, 70, -24],
    [52, 73, 14],
    [68, 68, 32],
    [43, 58, -8],
    [60, 56, 20],
    [51, 46, -30],
  ];
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}seed`} cx="32%" cy="26%" r="82%">
          <Stop offset="0" stopColor={shade(tint, 0.4)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      <Ellipse cx={50} cy={72} rx={36} ry={14} fill={CERAMIC} />
      <Ellipse cx={50} cy={72} rx={28} ry={10} fill="#F1F1E8" />
      <G transform={`rotate(${spin(seed, 14)} 50 64)`}>
      {seeds.map(([cx, cy, rot]) => (
        <G key={`${cx}-${cy}`}>
          <Ellipse
            cx={cx}
            cy={cy}
            rx={9}
            ry={6.6}
            fill={`url(#${id}seed)`}
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
          <Path
            d={`M${cx - 4} ${cy - 1} q4 -3 8 0`}
            stroke={darker(tint)}
            strokeWidth={1.4}
            fill="none"
            opacity={0.45}
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
        </G>
      ))}
      </G>
    </>
  );
}

function Dish({ id, tint }: SceneProps) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}sauce`} cx="34%" cy="28%" r="82%">
          <Stop offset="0" stopColor={light(tint)} />
          <Stop offset="1" stopColor={deep(tint)} />
        </RadialGradient>
        <Grad id={`${id}dish`} from="#FFFFFF" to={CERAMIC_EDGE} />
        <RadialGradient id={`${id}shadow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={INK} stopOpacity={0.22} />
          <Stop offset="1" stopColor={INK} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Table id={id} />
      {/* Seasonings come by the spoonful, so they get a small deep dish with a
          spoon in it rather than the dinner plate the dishes use. */}
      <Path
        d="M68 30 L58 57"
        stroke="#CDD2C2"
        strokeWidth={4.2}
        strokeLinecap="round"
      />
      <Ellipse cx={28} cy={70} rx={27} ry={12.5} fill={`url(#${id}dish)`} />
      <Ellipse cx={28} cy={70} rx={20} ry={8.6} fill="#EFEFE6" />
      <Ellipse cx={28} cy={70.5} rx={15} ry={6.2} fill={`url(#${id}sauce)`} />
      <Ellipse cx={23} cy={68} rx={4.6} ry={1.9} fill="#FFFFFF" opacity={0.32} transform="rotate(-14 23 68)" />
      <Ellipse cx={56} cy={61} rx={9} ry={5.8} fill="#EDEFE4" transform="rotate(22 56 61)" />
      <Ellipse cx={56} cy={61} rx={6} ry={3.4} fill={`url(#${id}sauce)`} transform="rotate(22 56 61)" />
      <Path
        d="M8 66 q2 -10 13 -13"
        stroke="#FFFFFF"
        strokeWidth={2.8}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
    </>
  );
}

const painters: Record<Scene, (p: SceneProps) => React.ReactElement> = {
  glass: Glass,
  mug: Mug,
  bottle: Bottle,
  bowl: Bowl,
  plate: Plate,
  grill: Grill,
  fried: Fried,
  greens: Greens,
  fruit: Fruit,
  egg: Egg,
  bread: Bread,
  sweet: Sweet,
  nuts: Nuts,
  dish: Dish,
};

const seedOf = (key: string) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

export function FoodArt({ food, size }: { food: Food; size: number }) {
  // Gradient ids are document-global on the web, so every instance namespaces
  // its own or the first card on screen paints all the others.
  const id = useId().replace(/[^a-zA-Z0-9]/g, "") + "f";
  const { scene, tint } = artFor(food);
  const Painter = painters[scene];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Painter id={id} tint={tint} seed={seedOf(food.id)} />
    </Svg>
  );
}
