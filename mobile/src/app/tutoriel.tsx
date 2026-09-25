import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { Btn, Card, Emoji, Screen, Txt } from '@/components/ui';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

const DEMO = ['🔥', '🚢', '🎸', '👽', '🍕', '🚀', '🧊', '🎲'];
const RIGHT = new Set(['🚢', '🧊']);

export default function Tutoriel() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const set = useProfile((s) => s.set);
  const lang = useProfile((s) => s.lang) ?? 'fr';
  const [step, setStep] = useState(0);
  const pulse = useState(() => new Animated.Value(1))[0];

  // A small looping animation on the right tiles to show what to tap.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    const id = setInterval(() => setStep((n) => (n + 1) % 3), 1400);
    return () => {
      loop.stop();
      clearInterval(id);
    };
  }, [pulse]);

  const finish = () => {
    set({ tutorialDone: true });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const slot = (e: string | null, done = false) => (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: 14,
        borderWidth: 2,
        borderStyle: e ? 'solid' : 'dashed',
        borderColor: done ? p.green : e ? p.ink : p.line2,
        backgroundColor: done ? p.greenTint : e ? p.surface : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {e && <Emoji size={24}>{e}</Emoji>}
    </View>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 52 }}>
        <Txt size={13} weight="bold" color={p.muted} style={{ letterSpacing: 1.2 }}>
          {t('tuto_label')}
        </Txt>
        <Pressable onPress={finish} hitSlop={10} accessibilityRole="button">
          <Txt size={15} weight="bold" color={p.muted}>
            {t('skip')}
          </Txt>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Card style={{ padding: 14, alignItems: 'center', gap: 12 }}>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Txt size={12} weight="bold" color={p.muted}>
              🎬 {t('cat_movie')}
            </Txt>
            <Txt size={22} weight="heavy">
              Titanic
            </Txt>
          </View>
          <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DEMO.map((e, i) => {
              const hit = RIGHT.has(e);
              return (
                <Animated.View
                  key={i}
                  style={{
                    width: '22.8%',
                    height: 46,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: hit ? p.gold : p.line,
                    backgroundColor: hit ? p.goldTint : p.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: hit ? 1 : 0.35,
                    transform: [{ scale: hit ? pulse : 1 }],
                  }}>
                  <Emoji size={22}>{e}</Emoji>
                </Animated.View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {slot(step >= 1 ? '🚢' : null)}
            <Txt size={20} weight="heavy" color={p.muted}>
              +
            </Txt>
            {slot(step >= 2 ? '🧊' : null)}
            <Txt size={20} weight="heavy" color={p.muted}>
              =
            </Txt>
            {slot(step >= 2 ? '✨' : null, step >= 2)}
          </View>
        </Card>
      </View>

      <Txt size={22} weight="heavy" center style={{ marginTop: 20, marginHorizontal: 24 }}>
        {t('tuto_title')}
      </Txt>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 10 }}>
        {[
          ['❤️', t('tuto_1')],
          ['⏱️', t('tuto_2')],
          ['🔥', t('tuto_3')],
        ].map(([icon, text]) => (
          <View key={icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Emoji size={20}>{icon}</Emoji>
            <Txt size={15} weight="semibold" style={{ flex: 1 }}>
              {text}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
        <Btn label={t('tuto_go')} onPress={finish} accessibilityLabel={`${t('tuto_go')} (${lang})`} />
      </View>
    </Screen>
  );
}
