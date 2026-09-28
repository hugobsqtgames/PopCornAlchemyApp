import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { Btn, Emoji, Header, Screen, Txt } from '@/components/ui';
import type { Lang } from '@/game/types';
import { useLayout, usePalette } from '@/hooks/use-app';
import { deviceLang } from '@/i18n/device';
import { LANG_NAMES, LANGS } from '@/i18n/langs';
import { STRINGS } from '@/i18n/strings';
import { buzz } from '@/services/feedback';
import { useProfile } from '@/store/profile';

/** Settings › Language: the phone's language (default) or one picked by hand. */
export default function Langue() {
  const p = usePalette();
  const { insets } = useLayout();
  const current = useProfile((s) => s.lang);
  const tutorialDone = useProfile((s) => s.tutorialDone);
  const set = useProfile((s) => s.set);
  // null: follow the phone's language.
  const [pick, setPick] = useState<Lang | null>(current);
  const phone = deviceLang();
  const T = STRINGS[pick ?? phone];
  const options: { id: Lang | null; flag: string; name: string; sub?: string }[] = [
    { id: null, flag: '📱', name: T.lang_auto, sub: LANG_NAMES[phone] },
    ...LANGS,
  ];

  return (
    <Screen>
      <Header title={T.lang_title} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
        <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
          {options.map((l) => {
            const on = l.id === pick;
            return (
              <Pressable
                key={l.id ?? 'auto'}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={l.sub ? `${l.name}, ${l.sub}` : l.name}
                onPress={() => {
                  buzz('select');
                  setPick(l.id);
                }}
                style={{
                  minHeight: 60,
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: on ? p.actionTint : p.surface,
                  borderWidth: 2,
                  borderColor: on ? p.action : p.line,
                }}>
                <Emoji size={28}>{l.flag}</Emoji>
                <View style={{ flex: 1 }}>
                  <Txt size={17} weight="bold">
                    {l.name}
                  </Txt>
                  {l.sub ? (
                    <Txt size={13} weight="semibold" color={p.muted}>
                      {l.sub}
                    </Txt>
                  ) : null}
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: on ? p.action : p.line2,
                    backgroundColor: on ? p.action : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {on && <CheckIcon size={12} color="#FFFFFF" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>
        <Btn
          label={T.continue}
          onPress={() => {
            set({ lang: pick });
            if (!tutorialDone) router.replace({ pathname: '/jeu', params: { mode: 'tutorial' } });
            else if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}
