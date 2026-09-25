import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { PencilIcon } from '@/components/icons';
import { Btn, Card, Emoji, Section, Txt } from '@/components/ui';
import { CATEGORIES } from '@/game/rules';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { showLeaderboard } from '@/services/leaderboard';
import { useProfile } from '@/store/profile';

function titleKey(levels: number): StringKey {
  if (levels >= 200) return 'title_3';
  if (levels >= 100) return 'title_2';
  if (levels >= 25) return 'title_1';
  return 'title_0';
}

export default function Profil() {
  const p = usePalette();
  const t = useT();
  const { tabTop, tablet } = useLayout();
  const s = useProfile();
  const name = s.name || t('default_name');

  const rename = () =>
    Alert.prompt(
      t('edit_name'),
      undefined,
      (v) => v.trim() && s.set({ name: v.trim().slice(0, 20) }),
      'plain-text',
      name
    );

  const stats = [
    { label: t('stat_levels'), value: fmt(s.stats.levels) },
    { label: t('stat_combo'), value: `×${s.stats.bestCombo}` },
    { label: t('stat_daily'), value: fmt(s.stats.daily) },
    { label: t('stat_coins'), value: fmt(s.stats.coinsEarned) },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: tabTop, paddingBottom: 24 }}>
      <View style={{ width: '100%', maxWidth: tablet ? 640 : undefined, alignSelf: 'center' }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, height: 52, justifyContent: 'center' }}>
          <Txt size={24} weight="heavy">
            {t('profile')}
          </Txt>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable
              onPress={() => router.navigate('/boutique')}
              accessibilityRole="button"
              accessibilityLabel={t('shop_avatars')}
              style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: p.goldTint, alignItems: 'center', justifyContent: 'center' }}>
              <Emoji size={32}>{s.avatar}</Emoji>
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <Pressable onPress={rename} accessibilityRole="button" accessibilityLabel={t('edit_name')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Txt size={18} weight="heavy">
                  {name}
                </Txt>
                <PencilIcon color={p.muted} />
              </Pressable>
              <Txt size={13} color={p.muted}>
                {t(titleKey(s.stats.levels))}
              </Txt>
            </View>
          </Card>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 }}>
          <Btn variant="soft" label={`🏆 ${t('leaderboard')}`} height={46} size={13} style={{ flex: 1 }} onPress={() => showLeaderboard(t)} />
          <Btn variant="soft" label={`🎖️ ${t('achievements_btn')}`} height={46} size={13} style={{ flex: 1 }} onPress={() => router.navigate('/trophees')} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 14 }}>
          {stats.map((st) => (
            <Card key={st.label} style={{ width: '48.8%', padding: 12, gap: 4, borderRadius: 16 }}>
              <Txt size={12} weight="semibold" color={p.muted}>
                {st.label}
              </Txt>
              <Txt size={20} weight="heavy">
                {st.value}
              </Txt>
            </Card>
          ))}
        </View>
        <Section>{t('by_category')}</Section>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16 }}>
          {CATEGORIES.map((c) => (
            <Card key={c.id} style={{ width: "18.6%", paddingVertical: 8, alignItems: "center", gap: 4, borderRadius: 12 }}>
              <Emoji size={18}>{c.icon}</Emoji>
              <Txt size={12} weight="bold">
                {s.stats.cat[c.id]}
              </Txt>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
