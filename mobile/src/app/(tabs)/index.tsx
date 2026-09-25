import { Redirect, router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ChevronIcon, GearIcon, PlayIcon } from '@/components/icons';
import { Badge, Btn, Emoji, IconBtn, Logo, Pill, Tap, Txt } from '@/components/ui';
import { dayKey } from '@/game/dates';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import { showLeaderboard } from '@/services/leaderboard';
import { useProfile } from '@/store/profile';

export default function Home() {
  const p = usePalette();
  const t = useT();
  const { wide, height, tabTop } = useLayout();
  const s = useProfile();
  const streak = s.streak();
  const today = dayKey();
  const bestAll = Math.max(0, ...Object.values(s.best).map((v) => v ?? 0));
  const big = height > 800;

  if (!s.lang) return <Redirect href="/langue" />;
  if (!s.tutorialDone) return <Redirect href="/tutoriel" />;

  const topBar = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
      <Tap onPress={() => router.navigate('/profil')} label={t('tab_profile')} tint={p.goldTint} style={{ width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
        <Emoji size={22}>{s.avatar}</Emoji>
      </Tap>
      {wide && (
        <Txt size={16} weight="bold">
          {s.name || t('default_name')}
        </Txt>
      )}
      <View style={{ flex: 1 }} />
      <Pill onPress={() => router.navigate('/boutique')} label={`${s.coins} ${t('shop_coins')}`}>
        <Emoji size={15}>💰</Emoji>
        <Txt size={14} weight="bold">
          {fmt(s.coins)}
        </Txt>
      </Pill>
      <Pill label={`${s.hints} 💡`}>
        <Emoji size={15}>💡</Emoji>
        <Txt size={14} weight="bold">
          {s.hints}
        </Txt>
      </Pill>
      <IconBtn round label={t('settings')} onPress={() => router.push('/reglages')}>
        <GearIcon color={p.ink} />
      </IconBtn>
    </View>
  );

  const hero = (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {(big || wide) && (
        <View
          style={{
            width: wide ? 120 : 96,
            height: wide ? 120 : 96,
            borderRadius: 28,
            backgroundColor: p.gold,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
            borderBottomWidth: 5,
            borderColor: p.goldDeep,
          }}>
          <Emoji size={wide ? 64 : 52}>🍿</Emoji>
        </View>
      )}
      <Logo size={wide ? 34 : big ? 26 : 22} />
      <Txt size={14} weight="semibold" color={p.muted} style={{ marginTop: 6 }}>
        {[streak > 0 ? `🔥 ${t('streak_line', { n: streak })}` : '', bestAll > 0 ? t('record_line', { n: bestAll }) : '']
          .filter(Boolean)
          .join(' · ') || t('tagline')}
      </Txt>
    </View>
  );

  const play = (
    <View style={{ gap: 6 }}>
      {s.save ? (
        <Btn
          label={t('continue')}
          sub={t('run_info', { mode: t(`mode_${s.save.mode}`), n: s.save.index + 1 })}
          icon={<PlayIcon color={p.onAction} />}
          height={big || wide ? 76 : 64}
          size={19}
          onPress={() => router.push({ pathname: '/jeu', params: { resume: '1' } })}
        />
      ) : (
        <Btn label={t('play')} icon={<PlayIcon color={p.onAction} />} height={big || wide ? 76 : 64} size={19} onPress={() => router.push('/categories')} />
      )}
      {s.save && (
        <Tap onPress={() => router.push('/categories')} tint="transparent" border="transparent" style={{ alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8 }}>
          <Txt size={14} weight="bold" color={p.muted}>
            {t('new_game')}
          </Txt>
        </Tap>
      )}
    </View>
  );

  const dailyDone = s.dailyLast === today;
  const now = new Date();
  const daily = (
    <Tap onPress={() => router.push('/defi')} label={t('daily')} style={{ height: big || wide ? 84 : 70, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: p.actionTint, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={10} weight="heavy" color={p.action}>
          {now.toLocaleDateString(s.lang, { month: 'short' }).replace('.', '').toUpperCase()}
        </Txt>
        <Txt size={18} weight="heavy" style={{ lineHeight: 20 }}>
          {now.getDate()}
        </Txt>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt size={16} weight="heavy">
          {t('daily')}
        </Txt>
        <Txt size={12} weight="semibold" color={dailyDone ? p.green : p.muted}>
          {dailyDone ? t('daily_done') : t('daily_sub')}
        </Txt>
      </View>
      <ChevronIcon color={p.muted} />
    </Tap>
  );

  const wheelReady = s.wheelLast !== today;
  const quick = [
    { icon: '🎮', label: t('modes'), tint: p.blueTint, go: () => router.push('/modes') },
    { icon: '🎡', label: t('wheel'), tint: p.goldTint, go: () => router.push('/roue'), dot: wheelReady },
    { icon: '⚔️', label: t('challenge_friend'), tint: p.mintTint, go: () => router.push('/defier') },
    { icon: '🏆', label: t('leaderboard'), tint: p.lilacTint, go: () => showLeaderboard(t) },
  ];
  const grid = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {quick.map((q) => (
        <Tap key={q.label} onPress={q.go} label={q.label} style={{ width: '48.4%', height: wide ? 130 : big ? 80 : 64, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Badge tint={q.tint}>
            <Emoji size={20}>{q.icon}</Emoji>
          </Badge>
          <Txt size={15} weight="bold" style={{ flex: 1 }} lines={2}>
            {q.label}
          </Txt>
          {q.dot && <View style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: p.action }} />}
        </Tap>
      ))}
    </View>
  );

  if (wide) {
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, paddingTop: tabTop }}>
        {topBar}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 56, paddingHorizontal: 64, paddingBottom: 90 }}>
          <View style={{ width: 460, gap: 26 }}>
            {hero}
            {play}
          </View>
          <View style={{ flex: 1, gap: 16 }}>
            {daily}
            {grid}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.bg }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, paddingTop: tabTop, paddingBottom: 12 }}>
      {topBar}
      <View style={{ flexGrow: 1, minHeight: 12, maxHeight: 70 }} />
      {hero}
      <View style={{ flexGrow: 1, minHeight: 12, maxHeight: 70 }} />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {play}
        {daily}
        {grid}
      </View>
    </ScrollView>
  );
}
