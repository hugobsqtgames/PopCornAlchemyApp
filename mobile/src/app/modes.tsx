import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Badge, Emoji, Header, Screen, Tap, Txt } from '@/components/ui';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { useProfile } from '@/store/profile';

/** A new value each time, so the same mode can be started twice in a row. */
const freshKey = () => String(Date.now());

export default function Modes() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const best = useProfile((s) => s.best);

  const modes: { id: 'classic' | 'chrono' | 'hardcore' | 'zen'; icon: string; tint: string; tags: string[] }[] = [
    { id: 'classic', icon: '🧪', tint: p.goldTint, tags: [`❤️ ${t('tag_lives')}`] },
    { id: 'chrono', icon: '⏱️', tint: p.blueTint, tags: [t('tag_chrono')] },
    { id: 'hardcore', icon: '💀', tint: p.actionTint, tags: [`🖤 ${t('tag_1life')}`, `💰 ${t('tag_x2')}`] },
    { id: 'zen', icon: '🧘', tint: p.mintTint, tags: [t('tag_zen')] },
  ];

  return (
    <Screen>
      <Header title={t('modes_title')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 16 }}>
        {modes.map((m) => (
          <Tap
            key={m.id}
            label={t(`mode_${m.id}`)}
            onPress={() =>
              m.id === 'classic'
                ? router.push('/categories')
                : router.push({ pathname: '/jeu', params: { mode: m.id, fresh: freshKey() } })
            }
            style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Badge tint={m.tint} size={48}>
                <Emoji size={24}>{m.icon}</Emoji>
              </Badge>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={18} weight="heavy">
                  {t(`mode_${m.id}`)}
                </Txt>
                <Txt size={14} color={p.muted}>
                  {t(`mode_${m.id}_sub` as StringKey)}
                </Txt>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[...m.tags, ...(best[m.id] && m.id !== 'zen' ? [`⭐ ${fmt(best[m.id] ?? 0)}`] : [])].map((tag) => (
                <View key={tag} style={{ height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: p.sunk, justifyContent: 'center' }}>
                  <Txt size={12} weight="bold">
                    {tag}
                  </Txt>
                </View>
              ))}
            </View>
          </Tap>
        ))}
      </ScrollView>
    </Screen>
  );
}
