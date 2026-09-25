import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useLayout, usePalette } from '@/hooks/use-app';
import { buzz } from '@/services/feedback';
import { FONTS, type Palette } from '@/theme/palettes';

import { BackIcon } from './icons';

type Weight = keyof Omit<typeof FONTS, 'pixel'>;

interface TxtProps {
  children: ReactNode;
  size?: number;
  weight?: Weight;
  color?: string;
  center?: boolean;
  lines?: number;
  style?: StyleProp<TextStyle>;
}

export function Txt({ children, size = 15, weight = 'medium', color, center, lines, style }: TxtProps) {
  const p = usePalette();
  return (
    <Text
      numberOfLines={lines}
      style={[
        { fontFamily: FONTS[weight], fontSize: size, color: color ?? p.ink, lineHeight: Math.round(size * 1.3) },
        center && { textAlign: 'center' },
        style,
      ]}>
      {children}
    </Text>
  );
}

/** Pixel font: logo and big moments only. */
export function Px({ children, size = 20, color, style }: Omit<TxtProps, 'weight'>) {
  const p = usePalette();
  return (
    <Text style={[{ fontFamily: FONTS.pixel, fontSize: size, color: color ?? p.ink, lineHeight: size * 1.35 }, style]}>
      {children}
    </Text>
  );
}

export function Emoji({ children, size = 20, style }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontSize: size, lineHeight: Math.round(size * 1.2) }, style]}>{children}</Text>;
}

export function Logo({ size = 22 }: { size?: number }) {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center', gap: size * 0.35 }} accessibilityRole="header" accessibilityLabel="Pop-Corn Alchemy">
      <Px size={size}>
        <Text style={{ color: p.action }}>POP</Text>-CORN
      </Px>
      <Px size={size}>ALCHEMY</Px>
    </View>
  );
}

export type BtnVariant = 'action' | 'gold' | 'soft' | 'off' | 'green';

function btnColors(v: BtnVariant, p: Palette) {
  switch (v) {
    case 'action':
      return { bg: p.action, deep: p.actionDeep, fg: p.onAction, border: 'transparent' };
    case 'gold':
      return { bg: p.gold, deep: p.goldDeep, fg: '#1F1B2D', border: 'transparent' };
    case 'green':
      return { bg: p.greenDeep, deep: '#0F5F2D', fg: '#FFFFFF', border: 'transparent' };
    case 'soft':
      return { bg: p.surface, deep: p.line2, fg: p.ink, border: p.line2 };
    case 'off':
      return { bg: p.sunk, deep: 'transparent', fg: p.muted, border: p.line2 };
  }
}

interface BtnProps {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: ReactNode;
  sub?: string;
  height?: number;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Chunky "key" button: it sinks into its own shadow when pressed. */
export function Btn({ label, onPress, variant = 'action', icon, sub, height = 56, size = 16, disabled, style, accessibilityLabel }: BtnProps) {
  const p = usePalette();
  const c = btnColors(disabled ? 'off' : variant, p);
  const depth = variant === 'soft' ? 3 : 4;
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPressIn={() => buzz('tap')}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (sub ? `${label}, ${sub}` : label)}
      accessibilityState={{ disabled: !!disabled }}
      style={[{ height: height + depth }, style]}>
      {({ pressed }) => (
        <View style={{ flex: 1 }}>
          {c.deep !== 'transparent' && (
            <View style={[StyleSheet.absoluteFill, { top: depth, borderRadius: 16, backgroundColor: c.deep }]} />
          )}
          <View
            style={{
              height,
              marginTop: pressed ? depth : 0,
              borderRadius: 16,
              backgroundColor: c.bg,
              borderWidth: variant === 'soft' || variant === 'off' || disabled ? 2 : 0,
              borderColor: c.border,
              borderStyle: variant === 'off' || disabled ? 'dashed' : 'solid',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 14,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {icon}
              <Text
                numberOfLines={1}
                style={{ fontFamily: FONTS.heavy, fontSize: size, letterSpacing: 0.8, color: c.fg, textTransform: 'uppercase' }}>
                {label}
              </Text>
            </View>
            {sub ? (
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, color: c.fg, opacity: 0.9, marginTop: 3 }}>{sub}</Text>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function Card({ children, style, tint, border }: { children: ReactNode; style?: StyleProp<ViewStyle>; tint?: string; border?: string }) {
  const p = usePalette();
  return (
    <View
      style={[
        { backgroundColor: tint ?? p.surface, borderColor: border ?? tint ?? p.line, borderWidth: p.border, borderRadius: 20 },
        style,
      ]}>
      {children}
    </View>
  );
}

/** A card-shaped button. */
export function Tap({
  children,
  onPress,
  style,
  tint,
  border,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  tint?: string;
  border?: string;
  label?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={() => {
        buzz('select');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          backgroundColor: tint ?? p.surface,
          borderColor: border ?? tint ?? p.line,
          borderWidth: p.border,
          borderRadius: 20,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

export function Pill({ children, onPress, label }: { children: ReactNode; onPress?: () => void; label?: string }) {
  const p = usePalette();
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: p.surface,
        borderWidth: p.border,
        borderColor: p.line,
      }}>
      {children}
    </View>
  );
  if (!onPress) return <View accessibilityLabel={label}>{inner}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}>
      {inner}
    </Pressable>
  );
}

export function IconBtn({ children, onPress, label, round }: { children: ReactNode; onPress: () => void; label: string; round?: boolean }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: round ? 999 : 14,
        backgroundColor: p.surface,
        borderWidth: p.border,
        borderColor: p.line,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      {children}
    </Pressable>
  );
}

/** Top bar of pushed screens: back button + title. */
export function Header({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, minHeight: 52 }}>
      <IconBtn label="Retour" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}>
        <BackIcon color={p.ink} />
      </IconBtn>
      <Txt size={20} weight="heavy" style={{ flex: 1 }} lines={1}>
        {title}
      </Txt>
      {right}
    </View>
  );
}

/** Full-screen container with the theme background and safe areas. */
export function Screen({ children, bg, noTop, style }: { children: ReactNode; bg?: string; noTop?: boolean; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  const { insets, tablet } = useLayout();
  return (
    <View style={{ flex: 1, backgroundColor: bg ?? p.bg, paddingTop: noTop ? 0 : insets.top }}>
      <View style={[{ flex: 1, width: '100%', maxWidth: tablet ? 640 : undefined, alignSelf: 'center' }, style]}>{children}</View>
    </View>
  );
}

export function Bar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const p = usePalette();
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: p.sunk, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: color ?? p.ink }} />
    </View>
  );
}

export function Section({ children }: { children: string }) {
  const p = usePalette();
  return (
    <Txt size={12} weight="bold" color={p.muted} style={{ letterSpacing: 1.2, marginHorizontal: 20, marginTop: 18, marginBottom: 8 }}>
      {children.toUpperCase()}
    </Txt>
  );
}

export function Badge({ children, tint, size = 40 }: { children: ReactNode; tint: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

/** Segmented control (shop tabs, trophy filters). */
export function Segments<T extends string>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', padding: 3, gap: 2, borderRadius: 13, backgroundColor: p.sunk }} accessibilityRole="tablist">
      {items.map((it) => {
        const on = it.id === value;
        return (
          <Pressable
            key={it.id}
            onPress={() => {
              buzz('select');
              onChange(it.id);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? p.surface : 'transparent',
            }}>
            <Txt size={13} weight={on ? 'bold' : 'semibold'} color={on ? p.ink : p.muted} lines={1}>
              {it.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
