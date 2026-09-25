import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color: string;
  filled?: boolean;
}

const stroke = (color: string, width = 2.2) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function BackIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5l-7 7 7 7" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function ChevronIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5l7 7-7 7" {...stroke(color, 2.8)} />
    </Svg>
  );
}

export function PlayIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4l13 8-13 8z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={6} y={4} width={4} height={16} rx={1.5} fill={color} />
      <Rect x={14} y={4} width={4} height={16} rx={1.5} fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12l5 5 9-10" {...stroke(color, 3.5)} />
    </Svg>
  );
}

export function ShareIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3v12M7 8l5-5 5 5" {...stroke(color, 2.5)} />
      <Path d="M5 13v7h14v-7" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function AdIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={14} rx={3} {...stroke(color)} />
      <Path d="M10 9l5 3-5 3z" fill={color} />
    </Svg>
  );
}

export function PencilIcon({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20h4L19 9l-4-4L4 16z" {...stroke(color, 2.5)} />
    </Svg>
  );
}

export function GearIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        {...stroke(color)}
      />
      <Circle cx={12} cy={12} r={3} {...stroke(color)} />
    </Svg>
  );
}

export function TikTokIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14 3v11a4 4 0 1 1-4-4" {...stroke(color)} />
      <Path d="M14 3c0 3 2 5 5 5" {...stroke(color)} />
    </Svg>
  );
}

export function InstagramIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={18} height={18} rx={5} {...stroke(color)} />
      <Circle cx={12} cy={12} r={4} {...stroke(color)} />
      <Circle cx={17.5} cy={6.5} r={1} fill={color} />
    </Svg>
  );
}

export function YouTubeIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={5} width={20} height={14} rx={4} {...stroke(color)} />
      <Path d="M10 9l5 3-5 3z" {...stroke(color)} />
    </Svg>
  );
}
