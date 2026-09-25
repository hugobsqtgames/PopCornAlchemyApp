import { router } from 'expo-router';
import { View } from 'react-native';

import { CheckIcon, PlayIcon } from '@/components/icons';
import { Btn, Card, Emoji, Header, Screen, Txt } from '@/components/ui';
import { dayKey, daysBetween, msUntilTomorrow } from '@/game/dates';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

export default function Defi() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const s = useProfile();
  const lang = s.lang ?? 'fr';
  const now = new Date();
  const today = dayKey(now);
  const streak = s.streak();
  const doneToday = s.dailyLast === today;
  const left = msUntilTomorrow(now);
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);

  // Monday-first week with the days the daily challenge was done, derived from the streak.
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = dayKey(d);
    const back = s.dailyLast ? daysBetween(key, s.dailyLast) : -1;
    const done = streak > 0 && back >= 0 && back < streak;
    return {
      key,
      label: d.toLocaleDateString(lang, { weekday: 'narrow' }).toUpperCase(),
      done,
      today: key === today,
      last: i === 6,
    };
  });

  return (
    <Screen>
      <Header title={t('daily')} />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        <Card tint={p.actionTint} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Txt size={11} weight="heavy" color={p.action}>
              {now.toLocaleDateString(lang, { weekday: 'long' }).toUpperCase()}
            </Txt>
            <Txt size={28} weight="heavy" style={{ lineHeight: 32 }}>
              {now.getDate()}
            </Txt>
            <Txt size={11} weight="bold" color={p.muted}>
              {now.toLocaleDateString(lang, { month: 'short' })}
            </Txt>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt size={17} weight="heavy">
              {t('daily_mystery')}
            </Txt>
            <Txt size={14} color={p.muted}>
              {t('daily_same', { t: `${h} h ${String(m).padStart(2, '0')}` })}
            </Txt>
          </View>
        </Card>

        <Card style={{ padding: 14, paddingHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 12 }}>
            <Txt size={15} weight="heavy">
              🔥 {t('streak_title', { n: streak })}
            </Txt>
            <Txt size={13} color={p.muted}>
              {t('streak_record', { n: s.dailyBestStreak })}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {week.map((d) => (
              <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Txt size={12} weight="bold" color={d.today ? p.action : p.muted}>
                  {d.label}
                </Txt>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: d.done ? p.green : 'transparent',
                    borderWidth: d.done ? 0 : 2,
                    borderStyle: d.today ? 'solid' : 'dashed',
                    borderColor: d.today ? p.action : p.line2,
                  }}>
                  {d.done ? (
                    <CheckIcon size={14} color="#FFFFFF" />
                  ) : d.today ? (
                    <Txt size={14} weight="heavy" color={p.action}>
                      ?
                    </Txt>
                  ) : d.last ? (
                    <Emoji size={16}>🎁</Emoji>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ paddingHorizontal: 4, paddingTop: 6, gap: 12 }}>
          {[
            ['🏅', t('daily_rule1')],
            ['🎁', t('daily_rule2')],
            ['🔁', t('daily_rule3')],
          ].map(([icon, text]) => (
            <View key={icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Emoji size={20}>{icon}</Emoji>
              <Txt size={15} weight="semibold" style={{ flex: 1 }}>
                {text}
              </Txt>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
        <Btn
          label={t('play_daily')}
          sub={doneToday ? t('daily_done') : undefined}
          icon={<PlayIcon color={p.onAction} />}
          onPress={() => router.push({ pathname: '/jeu', params: { mode: 'daily', fresh: String(Date.now()) } })}
        />
      </View>
    </Screen>
  );
}
