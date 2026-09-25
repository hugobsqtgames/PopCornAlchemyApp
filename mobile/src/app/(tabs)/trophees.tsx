import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Bar, Card, Emoji, Segments, Txt } from '@/components/ui';
import { ACHIEVEMENTS, type AchievementGroup } from '@/game/achievements';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { achievementText } from '@/services/achievements';
import { buzz } from '@/services/feedback';
import { useProfile } from '@/store/profile';

const STEP = 76;
const NODE = 52;
const PAD = 24;
const minX = Math.min(...ACHIEVEMENTS.map((a) => a.x));
const maxX = Math.max(...ACHIEVEMENTS.map((a) => a.x));
const minY = Math.min(...ACHIEVEMENTS.map((a) => a.y));
const maxY = Math.max(...ACHIEVEMENTS.map((a) => a.y));
const W = (maxX - minX) * STEP + NODE + PAD * 2;
const H = (maxY - minY) * STEP + NODE + PAD * 2;
const pos = (x: number, y: number) => ({ left: PAD + (x - minX) * STEP, top: PAD + (y - minY) * STEP });

type Filter = 'all' | AchievementGroup;

export default function Trophees() {
  const p = usePalette();
  const t = useT();
  const { tabTop } = useLayout();
  const unlocked = useProfile((s) => s.achievements);
  const lang = useProfile((s) => s.lang) ?? 'fr';
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const sel = ACHIEVEMENTS.find((a) => a.id === selected);
  const selText = sel ? achievementText(sel.id, lang) : null;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg, paddingTop: tabTop }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, height: 52 }}>
        <Txt size={24} weight="heavy">
          {t('trophies')}
        </Txt>
        <Txt size={15} weight="bold" color={p.muted}>
          {unlocked.length} / {ACHIEVEMENTS.length}
        </Txt>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        <Bar value={unlocked.length / ACHIEVEMENTS.length} color={p.gold} />
        <Segments
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: t('filter_all') },
            { id: 'progress', label: t('filter_progress') },
            { id: 'combo', label: t('filter_combo') },
            { id: 'collection', label: t('filter_collection') },
          ]}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={{ width: W, height: H }}>
            <Svg width={W} height={H} style={{ position: 'absolute' }}>
              {ACHIEVEMENTS.filter((a) => a.parent).map((a) => {
                const parent = ACHIEVEMENTS.find((b) => b.id === a.parent);
                if (!parent) return null;
                const from = pos(parent.x, parent.y);
                const to = pos(a.x, a.y);
                const on = unlocked.includes(a.id);
                return (
                  <Line
                    key={a.id}
                    x1={from.left + NODE / 2}
                    y1={from.top + NODE / 2}
                    x2={to.left + NODE / 2}
                    y2={to.top + NODE / 2}
                    stroke={on ? p.gold : p.line2}
                    strokeWidth={on ? 4 : 3}
                    strokeDasharray={on ? undefined : '2 8'}
                    strokeLinecap="round"
                  />
                );
              })}
            </Svg>
            {ACHIEVEMENTS.map((a) => {
              const on = unlocked.includes(a.id);
              const faded = filter !== 'all' && a.group !== filter;
              const isSel = a.id === selected;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    buzz('select');
                    setSelected(a.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${achievementText(a.id, lang).title}, ${on ? t('unlocked') : t('locked')}`}
                  style={{
                    position: 'absolute',
                    ...pos(a.x, a.y),
                    width: NODE,
                    height: NODE,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? p.goldTint : p.sunk,
                    borderWidth: 2,
                    borderStyle: on ? 'solid' : 'dashed',
                    borderColor: isSel ? p.action : on ? p.gold : p.line2,
                    borderBottomWidth: on ? 5 : 2,
                    borderBottomColor: isSel ? p.action : on ? p.goldDeep : p.line2,
                    opacity: faded ? 0.25 : 1,
                  }}>
                  <Emoji size={24} style={{ opacity: on ? 1 : 0.3 }}>
                    {a.icon}
                  </Emoji>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Card style={{ padding: 12, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {sel && selText ? (
            <>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: p.goldTint, alignItems: 'center', justifyContent: 'center' }}>
                <Emoji size={24}>{sel.icon}</Emoji>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={16} weight="heavy">
                  {selText.title}
                </Txt>
                <Txt size={14} color={p.muted}>
                  {selText.desc}
                </Txt>
              </View>
              <Txt size={12} weight="bold" color={unlocked.includes(sel.id) ? p.green : p.muted}>
                {unlocked.includes(sel.id) ? t('unlocked') : `🔒 ${t('locked')}`}
              </Txt>
            </>
          ) : (
            <Txt size={14} color={p.muted} style={{ flex: 1 }} center>
              {t('tap_trophy')}
            </Txt>
          )}
        </Card>
      </View>
    </View>
  );
}
