import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Deco } from '@/game/worlds';

/** One small drawing of a world's scenery, on a 48 × 48 grid. Decorative only. */
export function DecoShapes({ kind }: { kind: Deco }) {
  switch (kind) {
    case 'corn':
      return (
        <G>
          <Line x1={24} y1={46} x2={24} y2={10} stroke="#3E9B3A" strokeWidth={3} />
          <Path d="M24 34 Q10 28 8 16 Q18 26 24 28 Z M24 26 Q38 20 40 8 Q30 18 24 20 Z" fill="#4FB548" />
          <Ellipse cx={30} cy={22} rx={5} ry={11} fill="#FFC93C" stroke="#D9A01A" strokeWidth={1.5} />
        </G>
      );
    case 'fence':
      return (
        <G fill="#C08A50" stroke="#8B5A2B" strokeWidth={1.5}>
          <Rect x={6} y={18} width={6} height={26} />
          <Rect x={21} y={18} width={6} height={26} />
          <Rect x={36} y={18} width={6} height={26} />
          <Rect x={2} y={24} width={44} height={5} />
          <Rect x={2} y={34} width={44} height={5} />
        </G>
      );
    case 'palm':
      return (
        <G>
          <Path d="M26 46 C25 36 22 26 26 16" stroke="#A0703C" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M26 16 Q10 8 2 14 Q14 12 26 18 Z M26 16 Q40 6 46 12 Q36 12 26 18 Z M26 16 Q18 2 8 2 Q18 8 25 18 Z M26 16 Q34 2 44 2 Q34 8 27 18 Z" fill="#3FAF5A" />
          <Circle cx={24} cy={19} r={2.5} fill="#8B5A2B" />
          <Circle cx={29} cy={19} r={2.5} fill="#8B5A2B" />
        </G>
      );
    case 'parasol':
      return (
        <G>
          <Line x1={24} y1={16} x2={24} y2={46} stroke="#6E6882" strokeWidth={2.5} />
          <Path d="M4 20 Q24 0 44 20 Z" fill="#D93A3A" />
          <Path d="M18 20 Q22 6 24 4 Q26 6 30 20 Z" fill="#FFFFFF" />
          <Rect x={8} y={40} width={32} height={6} rx={3} fill="#45B5E8" />
        </G>
      );
    case 'mushroom':
      return (
        <G>
          <Rect x={18} y={24} width={12} height={20} rx={5} fill="#F3ECDF" />
          <Path d="M4 28 Q24 0 44 28 Z" fill="#D93A3A" />
          <Circle cx={16} cy={18} r={3} fill="#FFFFFF" />
          <Circle cx={30} cy={14} r={3.5} fill="#FFFFFF" />
          <Circle cx={36} cy={23} r={2.5} fill="#FFFFFF" />
        </G>
      );
    case 'pine':
      return (
        <G>
          <Rect x={21} y={38} width={6} height={9} fill="#8B5A2B" />
          <Path d="M24 2 L40 24 L32 24 L44 40 L4 40 L16 24 L8 24 Z" fill="#2F7A43" />
        </G>
      );
    case 'building':
      return (
        <G>
          <Rect x={4} y={14} width={18} height={34} fill="#140D2E" />
          <Rect x={24} y={4} width={20} height={44} fill="#1E1440" />
          <G fill="#FFD34D">
            <Rect x={8} y={20} width={4} height={4} />
            <Rect x={14} y={30} width={4} height={4} />
            <Rect x={28} y={10} width={4} height={4} />
            <Rect x={36} y={22} width={4} height={4} />
            <Rect x={28} y={34} width={4} height={4} />
          </G>
        </G>
      );
    case 'neon':
      return (
        <G>
          <Rect x={4} y={14} width={40} height={20} rx={10} fill="none" stroke="#FF4FA3" strokeWidth={4} />
          <Rect x={10} y={20} width={28} height={8} rx={4} fill="#45E3FF" />
          <Line x1={24} y1={34} x2={24} y2={46} stroke="#5B4A8A" strokeWidth={3} />
        </G>
      );
    case 'snowman':
      return (
        <G>
          <Circle cx={24} cy={34} r={12} fill="#FFFFFF" stroke="#C7DCEA" strokeWidth={1.5} />
          <Circle cx={24} cy={15} r={8} fill="#FFFFFF" stroke="#C7DCEA" strokeWidth={1.5} />
          <Path d="M24 16 L32 18 L24 19 Z" fill="#FF8A1A" />
          <Circle cx={21} cy={13} r={1.3} fill="#1F1B2D" />
          <Circle cx={27} cy={13} r={1.3} fill="#1F1B2D" />
          <Rect x={16} y={21} width={16} height={3} rx={1.5} fill="#D93A3A" />
        </G>
      );
    case 'fir':
      return (
        <G>
          <Rect x={21} y={38} width={6} height={9} fill="#8B5A2B" />
          <Path d="M24 2 L42 38 L6 38 Z" fill="#2F6B55" />
          <Path d="M24 2 L32 18 L28 16 L24 20 L20 16 L16 18 Z M12 30 L18 26 L24 30 L30 26 L36 30 L40 36 L8 36 Z" fill="#FFFFFF" />
        </G>
      );
    case 'pyramid':
      return (
        <G>
          <Path d="M24 6 L46 44 L2 44 Z" fill="#E3A94A" />
          <Path d="M24 6 L46 44 L28 44 Z" fill="#C98A2E" />
          <Line x1={10} y1={32} x2={38} y2={32} stroke="#B5651D" strokeWidth={1.5} />
        </G>
      );
    case 'cactus':
      return (
        <G fill="#4FA24A">
          <Rect x={19} y={6} width={10} height={40} rx={5} />
          <Path d="M19 26 L10 26 Q6 26 6 20 L6 14 L11 14 L11 21 L19 21 Z" />
          <Path d="M29 30 L38 30 Q42 30 42 24 L42 16 L37 16 L37 25 L29 25 Z" />
        </G>
      );
    case 'leaf':
      return (
        <G>
          <Path d="M6 44 Q2 18 30 4 Q26 30 6 44 Z" fill="#2BA35F" />
          <Path d="M44 46 Q46 22 22 12 Q26 36 44 46 Z" fill="#1F7A4A" />
          <Path d="M6 44 Q16 24 28 8" stroke="#1F7A4A" strokeWidth={1.5} fill="none" />
        </G>
      );
    case 'flower':
      return (
        <G>
          <Line x1={24} y1={26} x2={24} y2={46} stroke="#2BA35F" strokeWidth={3} />
          <G fill="#FF4F8B">
            <Circle cx={24} cy={10} r={7} />
            <Circle cx={34} cy={18} r={7} />
            <Circle cx={14} cy={18} r={7} />
            <Circle cx={30} cy={28} r={7} />
            <Circle cx={18} cy={28} r={7} />
          </G>
          <Circle cx={24} cy={20} r={5} fill="#FFC93C" />
        </G>
      );
    case 'clapper':
      return (
        <G>
          <Rect x={4} y={18} width={40} height={26} rx={3} fill="#1F1B2D" />
          <Path d="M4 10 L42 4 L44 14 L6 20 Z" fill="#FFFFFF" />
          <Path d="M10 9 L16 18 M20 7 L26 16 M30 6 L36 15" stroke="#1F1B2D" strokeWidth={3} />
        </G>
      );
    case 'star':
      return <Path d="M24 3 L30 17 L45 18 L33 28 L37 43 L24 35 L11 43 L15 28 L3 18 L18 17 Z" fill="#FFC93C" stroke="#D9A01A" strokeWidth={2} strokeLinejoin="round" />;
    case 'planet':
      return (
        <G>
          <Circle cx={24} cy={24} r={13} fill="#FF8A5B" />
          <Ellipse cx={24} cy={24} rx={22} ry={6} fill="none" stroke="#FFC93C" strokeWidth={3} />
          <Circle cx={6} cy={6} r={1.5} fill="#FFFFFF" />
          <Circle cx={42} cy={40} r={1.5} fill="#FFFFFF" />
        </G>
      );
    case 'rocket':
      return (
        <G>
          <Path d="M24 2 Q34 12 32 32 L16 32 Q14 12 24 2 Z" fill="#FFFFFF" />
          <Circle cx={24} cy={16} r={4} fill="#45B5E8" />
          <Path d="M16 24 L8 34 L16 32 Z M32 24 L40 34 L32 32 Z" fill="#D93A3A" />
          <Path d="M18 32 L24 46 L30 32 Z" fill="#FF8A1A" />
        </G>
      );
    case 'tower':
      return (
        <G fill="#E0B43A" stroke="#B8891A" strokeWidth={1.5}>
          <Rect x={12} y={14} width={24} height={32} />
          <Path d="M10 14 L10 6 L16 6 L16 10 L21 10 L21 6 L27 6 L27 10 L32 10 L32 6 L38 6 L38 14 Z" />
          <Rect x={20} y={32} width={8} height={14} rx={4} fill="#8B5A2B" />
        </G>
      );
    case 'crown':
      return <Path d="M4 38 L8 12 L18 24 L24 8 L30 24 L40 12 L44 38 Z" fill="#FFC93C" stroke="#D9A01A" strokeWidth={2} strokeLinejoin="round" />;
    case 'ship':
      return (
        <G>
          <Path d="M2 32 L46 32 L40 44 L8 44 Z" fill="#6B4423" />
          <Line x1={24} y1={32} x2={24} y2={4} stroke="#4A2F17" strokeWidth={2.5} />
          <Path d="M26 6 Q42 16 26 28 Z" fill="#FFFFFF" />
          <Rect x={24} y={2} width={10} height={5} fill="#D93A3A" />
        </G>
      );
    case 'chest':
      return (
        <G>
          <Rect x={6} y={20} width={36} height={24} rx={3} fill="#8B5A2B" />
          <Path d="M6 24 Q24 4 42 24 Z" fill="#A0703C" />
          <Rect x={6} y={26} width={36} height={4} fill="#FFC93C" />
          <Rect x={21} y={24} width={6} height={9} rx={1} fill="#FFC93C" />
        </G>
      );
    case 'dino':
      return (
        <G fill="#5FA04A">
          <Path d="M4 40 Q6 28 16 26 L30 26 Q34 16 34 6 Q40 4 42 8 Q40 18 40 30 Q40 40 32 40 Z" />
          <Rect x={12} y={38} width={5} height={8} />
          <Rect x={28} y={38} width={5} height={8} />
          <Circle cx={39} cy={9} r={1.5} fill="#1F1B2D" />
        </G>
      );
    case 'bone':
      return (
        <G fill="#F7F1E3" stroke="#C9B894" strokeWidth={1.5}>
          <Rect x={12} y={20} width={24} height={8} rx={4} />
          <Circle cx={10} cy={19} r={5} />
          <Circle cx={10} cy={29} r={5} />
          <Circle cx={38} cy={19} r={5} />
          <Circle cx={38} cy={29} r={5} />
        </G>
      );
    case 'fish':
      return (
        <G>
          <Path d="M6 24 Q20 8 34 24 Q20 40 6 24 Z" fill="#FF8A5B" />
          <Path d="M34 24 L46 14 L46 34 Z" fill="#FF8A5B" />
          <Circle cx={14} cy={22} r={2} fill="#1F1B2D" />
          <Circle cx={10} cy={8} r={2.5} fill="#FFFFFF" opacity={0.6} />
        </G>
      );
    case 'seaweed':
      return (
        <G fill="#2BA35F">
          <Path d="M14 46 Q6 32 14 20 Q20 10 14 2 Q24 10 20 24 Q16 34 20 46 Z" />
          <Path d="M30 46 Q24 34 32 24 Q38 16 34 8 Q44 18 38 30 Q34 38 36 46 Z" />
        </G>
      );
    case 'ferris':
      return (
        <G>
          <Circle cx={24} cy={20} r={16} fill="none" stroke="#7B3FA0" strokeWidth={3} />
          <G stroke="#7B3FA0" strokeWidth={2}>
            <Line x1={24} y1={4} x2={24} y2={36} />
            <Line x1={8} y1={20} x2={40} y2={20} />
            <Line x1={13} y1={9} x2={35} y2={31} />
            <Line x1={35} y1={9} x2={13} y2={31} />
          </G>
          <Path d="M16 46 L24 20 L32 46" stroke="#7B3FA0" strokeWidth={3} fill="none" />
          <Circle cx={24} cy={4} r={3} fill="#FFC93C" />
          <Circle cx={40} cy={20} r={3} fill="#D93A3A" />
          <Circle cx={8} cy={20} r={3} fill="#45B5E8" />
        </G>
      );
    case 'balloon':
      return (
        <G>
          <Path d="M24 30 Q22 38 26 46" stroke="#6E6882" strokeWidth={1.5} fill="none" />
          <Ellipse cx={24} cy={16} rx={11} ry={14} fill="#FF4F8B" />
          <Path d="M22 29 L26 29 L24 32 Z" fill="#FF4F8B" />
          <Ellipse cx={20} cy={11} rx={3} ry={5} fill="#FFFFFF" opacity={0.5} />
        </G>
      );
    case 'volcano':
      return (
        <G>
          <Path d="M2 46 L18 14 L30 14 L46 46 Z" fill="#6B3A2A" />
          <Path d="M18 14 L24 22 L30 14 Z M22 22 Q18 32 20 40 Q24 32 26 24 Z" fill="#FF7A1A" />
          <Circle cx={20} cy={6} r={4} fill="#8A8A8A" opacity={0.8} />
          <Circle cx={28} cy={3} r={3} fill="#8A8A8A" opacity={0.6} />
        </G>
      );
    case 'rock':
      return (
        <G>
          <Path d="M4 44 L10 24 L22 16 L36 20 L44 44 Z" fill="#5A2E24" />
          <Path d="M18 30 L24 34 L30 28" stroke="#FF7A1A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'column':
      return (
        <G fill="#FFFFFF" stroke="#C9A56A" strokeWidth={1.5}>
          <Rect x={10} y={4} width={28} height={6} />
          <Rect x={15} y={10} width={18} height={30} />
          <Rect x={8} y={40} width={32} height={6} />
          <Line x1={21} y1={12} x2={21} y2={38} />
          <Line x1={27} y1={12} x2={27} y2={38} />
        </G>
      );
    case 'amphora':
      return (
        <G>
          <Path d="M18 6 L30 6 L28 12 Q40 20 34 36 Q30 44 24 44 Q18 44 14 36 Q8 20 20 12 Z" fill="#D9844A" />
          <Path d="M12 20 Q6 18 10 12 M36 20 Q42 18 38 12" stroke="#B5651D" strokeWidth={2.5} fill="none" />
          <Rect x={14} y={24} width={20} height={4} fill="#1F1B2D" opacity={0.6} />
        </G>
      );
    case 'cloud':
      return (
        <G fill="#FFFFFF">
          <Ellipse cx={16} cy={30} rx={13} ry={9} />
          <Ellipse cx={32} cy={30} rx={13} ry={9} />
          <Ellipse cx={24} cy={22} rx={11} ry={10} />
        </G>
      );
    case 'rainbow':
      return (
        <G fill="none" strokeWidth={4}>
          <Path d="M4 40 A20 20 0 0 1 44 40" stroke="#D93A3A" />
          <Path d="M9 40 A15 15 0 0 1 39 40" stroke="#FFC93C" />
          <Path d="M14 40 A10 10 0 0 1 34 40" stroke="#45B5E8" />
        </G>
      );
    case 'robot':
      return (
        <G>
          <Rect x={10} y={12} width={28} height={22} rx={6} fill="#8FA3C0" />
          <Rect x={15} y={18} width={18} height={8} rx={4} fill="#15121E" />
          <Circle cx={20} cy={22} r={2.5} fill="#45E3FF" />
          <Circle cx={28} cy={22} r={2.5} fill="#45E3FF" />
          <Line x1={24} y1={12} x2={24} y2={5} stroke="#8FA3C0" strokeWidth={2.5} />
          <Circle cx={24} cy={4} r={3} fill="#FF4FA3" />
          <Rect x={14} y={36} width={20} height={10} rx={3} fill="#6F83A0" />
        </G>
      );
    case 'gear':
      return (
        <G>
          <Circle cx={24} cy={24} r={14} fill="#6F83A0" />
          <G fill="#6F83A0">
            <Rect x={21} y={4} width={6} height={8} />
            <Rect x={21} y={36} width={6} height={8} />
            <Rect x={4} y={21} width={8} height={6} />
            <Rect x={36} y={21} width={8} height={6} />
          </G>
          <Circle cx={24} cy={24} r={5} fill="#1B2A44" />
        </G>
      );
    case 'crystal':
      return (
        <G>
          <Path d="M24 2 L34 16 L24 46 L14 16 Z" fill="#9FDCF5" stroke="#5FB5DD" strokeWidth={1.5} />
          <Path d="M24 2 L28 16 L24 46 Z" fill="#FFFFFF" opacity={0.6} />
        </G>
      );
    case 'iceblock':
      return (
        <G>
          <Rect x={6} y={14} width={36} height={30} rx={4} fill="#C7EAF9" stroke="#8CCDEB" strokeWidth={2} />
          <Path d="M12 20 L20 20 M12 26 L16 26" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'temple':
      return (
        <G>
          <Path d="M4 16 L24 4 L44 16 Z" fill="#FFE08A" />
          <Rect x={4} y={16} width={40} height={4} fill="#E9E3F7" />
          <G fill="#FFFFFF">
            <Rect x={8} y={20} width={5} height={20} />
            <Rect x={17} y={20} width={5} height={20} />
            <Rect x={26} y={20} width={5} height={20} />
            <Rect x={35} y={20} width={5} height={20} />
          </G>
          <Rect x={2} y={40} width={44} height={6} fill="#E9E3F7" />
        </G>
      );
    case 'lightning':
      return <Path d="M28 2 L12 26 L22 26 L16 46 L38 18 L27 18 L34 2 Z" fill="#FFC93C" stroke="#D9A01A" strokeWidth={1.5} strokeLinejoin="round" />;
    case 'flame':
      return (
        <G>
          <Path d="M24 2 Q40 18 36 32 Q32 46 24 46 Q16 46 12 34 Q10 24 18 16 Q18 26 24 26 Q20 14 24 2 Z" fill="#FF7A1A" />
          <Path d="M24 24 Q32 32 28 40 Q24 46 20 40 Q18 34 24 24 Z" fill="#FFC93C" />
        </G>
      );
    case 'sunburst':
      return (
        <G>
          <G stroke="#FFC93C" strokeWidth={3} strokeLinecap="round">
            <Line x1={24} y1={2} x2={24} y2={10} />
            <Line x1={24} y1={38} x2={24} y2={46} />
            <Line x1={2} y1={24} x2={10} y2={24} />
            <Line x1={38} y1={24} x2={46} y2={24} />
            <Line x1={8} y1={8} x2={14} y2={14} />
            <Line x1={34} y1={34} x2={40} y2={40} />
            <Line x1={40} y1={8} x2={34} y2={14} />
            <Line x1={14} y1={34} x2={8} y2={40} />
          </G>
          <Circle cx={24} cy={24} r={11} fill="#FFE27A" />
        </G>
      );
  }
}

export function WorldDeco({ kind, size = 48 }: { kind: Deco; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <DecoShapes kind={kind} />
    </Svg>
  );
}
