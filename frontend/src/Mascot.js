import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Cute HR mascot: a smiling employee in a navy suit with sparkles. */
export default function Mascot({ size = 88 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E0EDFF" />
          <Stop offset="1" stopColor="#BFD7FF" />
        </LinearGradient>
        <LinearGradient id="suit" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2952C8" />
          <Stop offset="1" stopColor="#1E3A8A" />
        </LinearGradient>
      </Defs>

      {/* background */}
      <Rect x="0" y="0" width="120" height="120" rx="30" fill="url(#bg)" />

      {/* body / suit */}
      <Path d="M24 120 Q24 88 60 85 Q96 88 96 120 Z" fill="url(#suit)" />
      {/* neck */}
      <Rect x="54" y="72" width="12" height="14" rx="4" fill="#F7C9A8" />
      {/* shirt collar */}
      <Path d="M48 86 L60 103 L72 86 Q60 90 48 86 Z" fill="#FFFFFF" />
      {/* tie */}
      <Path d="M57 89 L63 89 L64.8 105 L60 111 L55.2 105 Z" fill="#60A5FA" />
      <Path d="M57 89 L63 89 L61.6 93 L58.4 93 Z" fill="#3B82F6" />
      {/* ID badge */}
      <Rect x="74" y="96" width="11" height="14" rx="2.5" fill="#FFFFFF" />
      <Rect x="76.5" y="99" width="6" height="2.2" rx="1.1" fill="#60A5FA" />
      <Rect x="76.5" y="103" width="6" height="1.6" rx="0.8" fill="#BFD7FF" />

      {/* ears */}
      <Circle cx="35" cy="54" r="5.5" fill="#F7C9A8" />
      <Circle cx="85" cy="54" r="5.5" fill="#F7C9A8" />
      {/* head */}
      <Circle cx="60" cy="52" r="25" fill="#FFDCC2" />
      {/* hair */}
      <Path
        d="M35 52 Q33 24 60 24 Q87 24 85 52 Q82 40 70 37 Q66 44 52 42 Q40 41 35 52 Z"
        fill="#3A2A22"
      />
      <Path d="M64 30 Q72 31 76 38" stroke="#5A4236" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* eyes */}
      <Ellipse cx="50.5" cy="55" rx="3" ry="3.6" fill="#1F2937" />
      <Ellipse cx="69.5" cy="55" rx="3" ry="3.6" fill="#1F2937" />
      <Circle cx="51.6" cy="53.6" r="1.1" fill="#FFFFFF" />
      <Circle cx="70.6" cy="53.6" r="1.1" fill="#FFFFFF" />
      {/* blush */}
      <Ellipse cx="44" cy="63" rx="5" ry="3" fill="#FB9FB1" opacity="0.75" />
      <Ellipse cx="76" cy="63" rx="5" ry="3" fill="#FB9FB1" opacity="0.75" />
      {/* smile */}
      <Path d="M53.5 64 Q60 70.5 66.5 64" stroke="#1F2937" strokeWidth="2.4" fill="none" strokeLinecap="round" />

      {/* sparkles */}
      <Path d="M98 14 L100.6 21.4 L108 24 L100.6 26.6 L98 34 L95.4 26.6 L88 24 L95.4 21.4 Z" fill="#FBBF24" />
      <Path d="M20 30 L21.6 34.4 L26 36 L21.6 37.6 L20 42 L18.4 37.6 L14 36 L18.4 34.4 Z" fill="#FCD34D" />
      <Circle cx="104" cy="44" r="2.2" fill="#FFFFFF" />
      <Circle cx="14" cy="56" r="1.8" fill="#FFFFFF" />
    </Svg>
  );
}
