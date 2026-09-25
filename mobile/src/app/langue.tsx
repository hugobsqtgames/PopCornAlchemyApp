import { getLocales } from 'expo-localization';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { Btn, Emoji, Logo, Screen, Txt } from '@/components/ui';
import type { Lang } from '@/game/types';
import { useLayout, usePalette } from '@/hooks/use-app';
import { STRINGS } from '@/i18n/strings';
import { buzz } from '@/services/feedback';
import { useProfile } from '@/store/profile';

const LANGS: { id: Lang; flag: string; name: string }[] = [
  { id: 'fr', flag: '🇫🇷', name: 'Français' },
  { id: 'en', flag: '🇬🇧', name: 'English' },
  { id: 'es', flag: '🇪🇸', name: 'Español' },
];

function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode;
  return code === 'en' || code === 'es' ? code : 'fr';
}

export default function Langue() {
  const p = usePalette();
  const { insets } = useLayout();
  const current = useProfile((s) => s.lang);
  const tutorialDone = useProfile((s) => s.tutorialDone);
  const set = useProfile((s) => s.set);
  const [pick, setPick] = useState<Lang>(current ?? deviceLang());
  const T = STRINGS[pick];

  return (
    <Screen>
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderBottomWidth: 5, borderColor: p.goldDeep }}>
          <Emoji size={44}>🍿</Emoji>
        </View>
        <Logo size={18} />
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Txt size={22} weight="heavy" center>
          {T.lang_title}
        </Txt>
        <Txt size={14} weight="semibold" color={p.muted} center style={{ marginBottom: 8 }}>
          {T.lang_sub}
        </Txt>
        <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
          {LANGS.map((l) => {
            const on = l.id === pick;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  buzz('select');
                  setPick(l.id);
                }}
                style={{
                  height: 60,
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: on ? p.actionTint : p.surface,
                  borderWidth: 2,
                  borderColor: on ? p.action : p.line,
                }}>
                <Emoji size={28}>{l.flag}</Emoji>
                <Txt size={17} weight="bold" style={{ flex: 1 }}>
                  {l.name}
                </Txt>
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
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
        <Btn
          label={T.continue}
          onPress={() => {
            set({ lang: pick });
            if (!tutorialDone) router.replace('/tutoriel');
            else if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}
