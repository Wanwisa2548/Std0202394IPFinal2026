import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

/*
 * Hand-drawn, colourful "cute 3D" icon set (64x64 grid).
 * Depth comes from a darker shade underneath + a white gloss highlight.
 * Flat fills only (no <defs> ids), so many instances render safely on web.
 */

const SKIN = '#FFD9BF';
const BLUSH = '#FF9EB0';
const INK = '#2B2B3A';
const GLOSS = { fill: '#FFFFFF', opacity: 0.4 };

function Face({ cx, cy, s = 1 }) {
  return (
    <G>
      <Circle cx={cx - 5 * s} cy={cy} r={1.9 * s} fill={INK} />
      <Circle cx={cx + 5 * s} cy={cy} r={1.9 * s} fill={INK} />
      <Ellipse cx={cx - 8.5 * s} cy={cy + 3.5 * s} rx={2.6 * s} ry={1.6 * s} fill={BLUSH} opacity={0.85} />
      <Ellipse cx={cx + 8.5 * s} cy={cy + 3.5 * s} rx={2.6 * s} ry={1.6 * s} fill={BLUSH} opacity={0.85} />
      <Path
        d={`M${cx - 3 * s} ${cy + 3.2 * s} Q${cx} ${cy + 6.4 * s} ${cx + 3 * s} ${cy + 3.2 * s}`}
        stroke={INK}
        strokeWidth={1.8 * s}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

function Person({ body = '#4F8EF7', bodyDark = '#3467D6', hair = '#4A3428', transform }) {
  return (
    <G transform={transform}>
      <Path d="M14 60 Q14 41 32 41 Q50 41 50 60 Z" fill={body} />
      <Path d="M32 41 Q50 41 50 60 H41 Q43 48 32 41 Z" fill={bodyDark} />
      <Path d="M27 41 L32 49 L37 41 Z" fill="#FFFFFF" />
      <Circle cx="32" cy="25" r="13" fill={SKIN} />
      <Path d="M19 24 Q19 10 32 10 Q45 10 45 24 Q41 17 33 18 Q26 16 19 24 Z" fill={hair} />
      <Ellipse cx="27" cy="14" rx="4" ry="1.8" {...GLOSS} />
      <Face cx={32} cy={27} s={0.9} />
    </G>
  );
}

function PlusBadge({ cx, cy, r }) {
  return (
    <G>
      <Circle cx={cx} cy={cy + 2} r={r} fill="#16A34A" />
      <Circle cx={cx} cy={cy} r={r} fill="#22C55E" />
      <Rect x={cx - r * 0.55} y={cy - r * 0.16} width={r * 1.1} height={r * 0.32} rx={r * 0.16} fill="#fff" />
      <Rect x={cx - r * 0.16} y={cy - r * 0.55} width={r * 0.32} height={r * 1.1} rx={r * 0.16} fill="#fff" />
      <Ellipse cx={cx - r * 0.35} cy={cy - r * 0.5} rx={r * 0.35} ry={r * 0.18} {...GLOSS} />
    </G>
  );
}

function Bar({ x, y, h, color, dark }) {
  return (
    <G>
      <Rect x={x} y={y + 2} width="11" height={h} rx="3.5" fill={dark} />
      <Rect x={x} y={y} width="11" height={h} rx="3.5" fill={color} />
      <Rect x={x + 2} y={y + 2.5} width="2.6" height={Math.max(h - 7, 3)} rx="1.3" {...GLOSS} />
    </G>
  );
}

function Star({ cx, cy, r, fill }) {
  const k = r * 0.32;
  return (
    <Path
      d={`M${cx} ${cy - r} L${cx + k} ${cy - k} L${cx + r} ${cy} L${cx + k} ${cy + k} L${cx} ${cy + r} L${cx - k} ${cy + k} L${cx - r} ${cy} L${cx - k} ${cy - k} Z`}
      fill={fill}
    />
  );
}

function Coin({ cx = 32, cy = 32, r = 22 }) {
  return (
    <G>
      <Circle cx={cx} cy={cy + 3} r={r} fill="#D97706" />
      <Circle cx={cx} cy={cy} r={r} fill="#FBBF24" />
      <Circle cx={cx} cy={cy} r={r * 0.72} fill="#FCD34D" stroke="#F59E0B" strokeWidth={r * 0.08} />
      <SvgText
        x={cx}
        y={cy + r * 0.34}
        fontSize={r * 0.95}
        fontWeight="bold"
        fill="#B45309"
        textAnchor="middle"
      >
        ฿
      </SvgText>
      <Ellipse cx={cx - r * 0.42} cy={cy - r * 0.55} rx={r * 0.32} ry={r * 0.16} {...GLOSS} />
    </G>
  );
}

const ICONS = {
  user: () => <Person />,

  addUser: () => (
    <G>
      <Person transform="translate(-4 0) scale(0.92)" />
      <PlusBadge cx={49} cy={45} r={11} />
    </G>
  ),

  people: () => (
    <G>
      <Person transform="translate(20 7) scale(0.72)" body="#A78BFA" bodyDark="#7C5BE6" hair="#6B3F2A" />
      <Person transform="translate(-3 5) scale(0.86)" />
    </G>
  ),

  chart: () => (
    <G>
      <Rect x="7" y="54" width="50" height="4" rx="2" fill="#CBD5E1" />
      <Bar x={11} y={36} h={18} color="#60A5FA" dark="#3B82F6" />
      <Bar x={26.5} y={25} h={29} color="#A78BFA" dark="#8B5CF6" />
      <Bar x={42} y={14} h={40} color="#F472B6" dark="#DB2777" />
      <Star cx={16} cy={18} r={7} fill="#FBBF24" />
      <Star cx={27} cy={9} r={3.5} fill="#FDE68A" />
    </G>
  ),

  sprout: () => (
    <G>
      <Path d="M32 36 V22" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M32 25 Q18 26 14 12 Q29 9 32 25 Z" fill="#4ADE80" />
      <Path d="M32 23 Q44 22 50 8 Q35 6 32 23 Z" fill="#22C55E" />
      <Ellipse cx="22" cy="15" rx="3.5" ry="1.6" {...GLOSS} />
      <Path d="M19 40 H45 L41 59 H23 Z" fill="#F59E0B" />
      <Path d="M32 40 H45 L41 59 H32 Z" fill="#D97706" opacity="0.5" />
      <Rect x="15" y="34" width="34" height="8" rx="3.5" fill="#FBBF24" />
      <Rect x="18" y="35.5" width="12" height="2.2" rx="1.1" {...GLOSS} />
      <Face cx={32} cy={48} s={0.85} />
    </G>
  ),

  rocket: () => (
    <G>
      <Path d="M26 44 Q32 63 38 44 Z" fill="#F97316" />
      <Path d="M29 44 Q32 55 35 44 Z" fill="#FDE047" />
      <Path d="M22 30 L11 45 L23 43 Z" fill="#EF4444" />
      <Path d="M42 30 L53 45 L41 43 Z" fill="#DC2626" />
      <Path d="M32 5 Q45 16 42 44 H22 Q19 16 32 5 Z" fill="#F8FAFC" />
      <Path d="M32 5 Q45 16 42 44 H35 Q38 18 32 5 Z" fill="#CBD5E1" />
      <Path d="M24 12 Q32 2 40 12 Q32 9 24 12 Z" fill="#EF4444" />
      <Circle cx="32" cy="25" r="7" fill="#1E40AF" />
      <Circle cx="32" cy="25" r="5" fill="#60A5FA" />
      <Ellipse cx="30" cy="23" rx="2" ry="1.2" fill="#fff" opacity="0.8" />
      <Rect x="26" y="15" width="2.5" height="22" rx="1.2" {...GLOSS} />
    </G>
  ),

  crown: () => (
    <G>
      <Path d="M9 22 L20 37 L32 15 L44 37 L55 22 L51 52 H13 Z" fill="#FBBF24" />
      <Path d="M32 15 L44 37 L55 22 L51 52 H32 Z" fill="#F59E0B" opacity="0.45" />
      <Rect x="13" y="45" width="38" height="9" rx="2.5" fill="#F59E0B" />
      <Circle cx="9" cy="21" r="3.6" fill="#FDE047" />
      <Circle cx="32" cy="13" r="3.6" fill="#FDE047" />
      <Circle cx="55" cy="21" r="3.6" fill="#FDE047" />
      <Circle cx="22" cy="49.5" r="2.6" fill="#3B82F6" />
      <Circle cx="32" cy="49.5" r="3.2" fill="#EF4444" />
      <Circle cx="42" cy="49.5" r="2.6" fill="#22C55E" />
      <Path d="M15 29 L19 35" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
      <Face cx={32} cy={34} s={0.85} />
    </G>
  ),

  check: () => (
    <G>
      <Circle cx="32" cy="35" r="23" fill="#16A34A" />
      <Circle cx="32" cy="32" r="23" fill="#22C55E" />
      <Path d="M20 32 L28.5 40.5 L45 23" stroke="#fff" strokeWidth="6.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx="23" cy="18" rx="8" ry="3.6" {...GLOSS} />
    </G>
  ),

  beach: () => (
    <G>
      <Circle cx="52" cy="11" r="6.5" fill="#FBBF24" />
      <Ellipse cx="32" cy="57" rx="25" ry="5.5" fill="#FCD34D" />
      <Path d="M31 27 L39 57" stroke="#92400E" strokeWidth="3.4" strokeLinecap="round" />
      <Path d="M7 30 Q30 2 55 26 Z" fill="#F472B6" />
      <Path d="M30 9 Q22 16 19 29 L41 27.5 Q38 14 30 9 Z" fill="#FDF2F8" />
      <Path d="M7 30 Q30 2 55 26 L48 27 Q30 10 13 30 Z" fill="#DB2777" opacity="0.35" />
      <Ellipse cx="20" cy="18" rx="4" ry="1.8" {...GLOSS} />
    </G>
  ),

  moneyBag: () => (
    <G>
      <Path d="M17 34 Q12 60 32 60 Q52 60 47 34 Q43 24 32 24 Q21 24 17 34 Z" fill="#B7853D" />
      <Path d="M17 32 Q12 57 32 57 Q52 57 47 32 Q43 22 32 22 Q21 22 17 32 Z" fill="#E2B25C" />
      <Path d="M24 19 L19 8 Q32 13 45 8 L40 19 Z" fill="#EBC77F" />
      <Rect x="23" y="17.5" width="18" height="6.5" rx="3.2" fill="#9A6B2C" />
      <SvgText x="32" y="48" fontSize="19" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        ฿
      </SvgText>
      <Ellipse cx="23" cy="31" rx="3.5" ry="2" {...GLOSS} />
    </G>
  ),

  briefcase: () => (
    <G>
      <Path
        d="M23 20 V14 Q23 10 27 10 H37 Q41 10 41 14 V20"
        stroke="#92400E"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Rect x="7" y="21" width="50" height="36" rx="8" fill="#D97706" />
      <Rect x="7" y="19" width="50" height="34" rx="8" fill="#F59E0B" />
      <Rect x="7" y="34" width="50" height="3" fill="#D97706" />
      <Rect x="27" y="31" width="10" height="9" rx="2.5" fill="#FDE68A" />
      <Rect x="12" y="23" width="14" height="3" rx="1.5" {...GLOSS} />
    </G>
  ),

  coin: () => <Coin />,

  search: () => (
    <G>
      <Path d="M41 41 L55 55" stroke="#1E3A8A" strokeWidth="9" strokeLinecap="round" />
      <Circle cx="27" cy="27" r="18" fill="#3B82F6" />
      <Circle cx="27" cy="27" r="12.5" fill="#BFDBFE" />
      <Path d="M19 23 Q21 17 27 16" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </G>
  ),

  lock: () => (
    <G>
      <Path d="M21 30 V22 Q21 11 32 11 Q43 11 43 22 V30" stroke="#94A3B8" strokeWidth="6" fill="none" />
      <Rect x="12" y="29" width="40" height="29" rx="9" fill="#F59E0B" />
      <Rect x="12" y="27" width="40" height="28" rx="9" fill="#FBBF24" />
      <Circle cx="32" cy="38" r="4.2" fill="#92400E" />
      <Rect x="30" y="39" width="4" height="8" rx="2" fill="#92400E" />
      <Rect x="17" y="31" width="12" height="3" rx="1.5" {...GLOSS} />
    </G>
  ),

  key: () => (
    <G>
      <Path d="M30 34 L54 34 L54 42 M46 34 L46 40" stroke="#D97706" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="20" cy="35" r="13" fill="#D97706" />
      <Circle cx="20" cy="33" r="13" fill="#FBBF24" />
      <Circle cx="20" cy="33" r="4.5" fill="#FEF3C7" />
      <Ellipse cx="14" cy="26" rx="3.5" ry="1.8" {...GLOSS} />
    </G>
  ),

  plus: () => <PlusBadge cx={32} cy={31} r={24} />,

  sparkle: () => (
    <G>
      <Star cx={28} cy={34} r={22} fill="#F59E0B" />
      <Star cx={28} cy={32} r={22} fill="#FBBF24" />
      <Star cx={50} cy={13} r={9} fill="#F472B6" />
      <Star cx={51} cy={47} r={6} fill="#60A5FA" />
      <Ellipse cx="23" cy="25" rx="3.5" ry="1.8" {...GLOSS} />
    </G>
  ),

  swap: () => (
    <G>
      <Path d="M12 21 H48 M39 12 L48 21 L39 30" stroke="#3B82F6" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M52 43 H16 M25 34 L16 43 L25 52" stroke="#F97316" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  ),

  trash: () => (
    <G>
      <Path d="M15 22 H49 L45.5 56 Q45 60 41 60 H23 Q19 60 18.5 56 Z" fill="#E11D48" />
      <Path d="M15 20 H49 L45.5 54 Q45 58 41 58 H23 Q19 58 18.5 54 Z" fill="#FB7185" />
      <Rect x="25" y="27" width="3.6" height="24" rx="1.8" fill="#E11D48" opacity="0.55" />
      <Rect x="35.4" y="27" width="3.6" height="24" rx="1.8" fill="#E11D48" opacity="0.55" />
      <Rect x="25" y="7" width="14" height="7" rx="3" fill="#BE123C" />
      <Rect x="10" y="12" width="44" height="8" rx="4" fill="#E11D48" />
      <Rect x="14" y="13.5" width="14" height="2.4" rx="1.2" {...GLOSS} />
    </G>
  ),

  home: () => (
    <G>
      <Rect x="13" y="30" width="38" height="29" rx="5" fill="#E2E8F0" />
      <Rect x="13" y="28" width="38" height="28" rx="5" fill="#FFFFFF" />
      <Path d="M7 32 L32 9 L57 32" stroke="#C2410C" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 30 L32 7 L57 30" stroke="#F97316" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="26" y="38" width="12" height="18" rx="3" fill="#3B82F6" />
      <Circle cx="35" cy="47" r="1.3" fill="#FDE68A" />
      <Rect x="40" y="35" width="7" height="7" rx="1.5" fill="#93C5FD" />
      <Rect x="17" y="35" width="7" height="7" rx="1.5" fill="#93C5FD" />
      <Rect x="44" y="12" width="6" height="11" rx="1.5" fill="#94A3B8" />
    </G>
  ),

  server: () => (
    <G>
      <Rect x="10" y="10" width="44" height="18" rx="6" fill="#1E40AF" />
      <Rect x="10" y="8" width="44" height="18" rx="6" fill="#3B82F6" />
      <Rect x="10" y="34" width="44" height="18" rx="6" fill="#1E40AF" />
      <Rect x="10" y="32" width="44" height="18" rx="6" fill="#3B82F6" />
      <Circle cx="44" cy="17" r="3" fill="#4ADE80" />
      <Circle cx="44" cy="41" r="3" fill="#4ADE80" />
      <Rect x="16" y="15.5" width="16" height="3" rx="1.5" fill="#BFDBFE" />
      <Rect x="16" y="39.5" width="16" height="3" rx="1.5" fill="#BFDBFE" />
      <Rect x="14" y="10" width="14" height="2.4" rx="1.2" {...GLOSS} />
      <Rect x="29" y="52" width="6" height="6" fill="#64748B" />
      <Rect x="18" y="57" width="28" height="4" rx="2" fill="#94A3B8" />
    </G>
  ),

  door: () => (
    <G>
      <Rect x="12" y="7" width="32" height="52" rx="5" fill="#B45309" />
      <Rect x="12" y="7" width="30" height="50" rx="5" fill="#F59E0B" />
      <Rect x="17" y="12" width="20" height="17" rx="3" fill="#FBBF24" />
      <Rect x="17" y="34" width="20" height="17" rx="3" fill="#FBBF24" />
      <Circle cx="37" cy="33" r="2.6" fill="#78350F" />
      <Path d="M44 32 H58 M52 25 L59 32 L52 39" stroke="#22C55E" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  ),
};

export default function CuteIcon({ name, size = 24 }) {
  const draw = ICONS[name];
  if (!draw) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {draw()}
    </Svg>
  );
}
