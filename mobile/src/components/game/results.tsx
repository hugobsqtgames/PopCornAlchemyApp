import { router } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { PRICES, REWARDS } from '@/game/rules';
import type { Run } from '@/hooks/use-run';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { showRewardedAd } from '@/services/store-services';
import { useProfile } from '@/store/profile';

import { AdIcon, ShareIcon } from '../icons';
import { Btn, Card, Emoji, Px, Screen, Txt } from '../ui';

function shareScore(run: Run, t: ReturnType<typeof useT>) {
  Share.share({ message: t('share_score', { s: fmt(run.score), n: run.index + 1 }) }).catch(() => {});
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Txt size={15}>{label}</Txt>
      <Txt size={15} weight="heavy">
        {value}
      </Txt>
    </View>
  );
}

function Bottom({ children }: { children: React.ReactNode }) {
  const { insets } = useLayout();
  return <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 12 }}>{children}</View>;
}

export function TierView({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const tier = Math.floor(run.index / 20) + 1;
  return (
    <Screen>
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 24 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: p.goldTint, alignItems: 'center', justifyContent: 'center' }}>
          <Emoji size={52}>🏆</Emoji>
        </View>
        <Txt size={13} weight="bold" color={p.muted} style={{ letterSpacing: 1.2, marginTop: 6 }}>
          {t('tier_of', { n: tier, t: run.totalTiers })}
        </Txt>
        <Txt size={26} weight="heavy" center>
          {t('tier_done')}
        </Txt>
        <Txt size={15} color={p.muted} center>
          {t('tier_sub')}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 22 }}>
        {[
          ['💰', `+${REWARDS.tier.coins}`, p.goldTint],
          ['💡', `+${REWARDS.tier.hints}`, p.blueTint],
          ['❤️', `${run.lives}/${run.lives}`, p.actionTint],
        ].map(([icon, text, tint]) => (
          <View key={icon} style={{ flex: 1, height: 76, borderRadius: 18, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Emoji size={24}>{icon}</Emoji>
            <Txt size={17} weight="heavy">
              {text}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Card style={{ padding: 14, gap: 10 }}>
          <Row label={t('score')} value={fmt(run.score)} />
          <Row label={t('best_combo')} value={`×${run.tierStats.bestCombo}`} />
          <Row label={t('flawless')} value={`${run.tierStats.flawless} / 20`} />
        </Card>
      </View>
      <View style={{ flex: 1 }} />
      <Bottom>
        <Btn label={t('next_tier')} onPress={run.nextTier} />
        <Btn variant="soft" label={t('share')} size={14} height={50} icon={<ShareIcon color={p.ink} />} onPress={() => shareScore(run, t)} />
      </Bottom>
    </Screen>
  );
}

export function OverView({ run, onReplay }: { run: Run; onReplay: () => void }) {
  const p = usePalette();
  const t = useT();
  const coins = useProfile((s) => s.coins);
  const [busy, setBusy] = useState(false);
  const chrono = run.config.mode === 'chrono';
  const canContinue = !run.continued && !chrono;

  const watchAd = async () => {
    setBusy(true);
    const ok = await showRewardedAd();
    setBusy(false);
    if (ok) run.revive(false);
  };

  return (
    <Screen>
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24 }}>
        <Emoji size={52}>{chrono ? '⏱️' : '💔'}</Emoji>
        <Px size={22} color={p.action}>
          {t('gameover')}
        </Px>
        <Txt size={15} color={p.muted} center>
          {chrono ? t('time_over', { n: run.index }) : t('gameover_sub', { n: run.index + 1 })}
        </Txt>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Card style={{ padding: 14, flexDirection: 'row' }}>
          <Stat label={t('score').toUpperCase()} value={fmt(run.score)} />
          <View style={{ width: 1, backgroundColor: p.line }} />
          <Stat label={t('record').toUpperCase()} value={fmt(useProfile.getState().best[run.config.mode] ?? run.score)} />
        </Card>
        {run.result?.newRecord && (
          <Txt size={14} weight="bold" color={p.green} center style={{ marginTop: 8 }}>
            {t('new_record')}
          </Txt>
        )}
      </View>
      {canContinue && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ padding: 14, borderRadius: 20, backgroundColor: p.goldTint, gap: 10 }}>
            <Txt size={15} weight="heavy" center>
              {t('continue_q')}
            </Txt>
            <Btn variant="gold" label={t('watch_ad')} icon={<AdIcon color="#1F1B2D" />} height={52} size={15} disabled={busy} onPress={watchAd} />
            <Btn
              variant="soft"
              label={t('or_coins', { n: PRICES.continue })}
              height={44}
              size={14}
              disabled={coins < PRICES.continue}
              onPress={() => run.revive(true)}
            />
          </View>
        </View>
      )}
      <View style={{ flex: 1 }} />
      <Bottom>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn variant="soft" label={t('home')} size={14} height={52} style={{ flex: 1 }} onPress={() => router.dismissTo('/')} />
          <Btn label={t('replay')} size={14} height={52} style={{ flex: 1 }} onPress={onReplay} />
        </View>
      </Bottom>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const p = usePalette();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Txt size={12} weight="bold" color={p.muted} style={{ letterSpacing: 1.2 }}>
        {label}
      </Txt>
      <Txt size={26} weight="heavy" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Txt>
    </View>
  );
}

export function WinView({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const mode = run.config.mode;
  const r = run.result;
  let icon = '👑';
  let title = t('victory');
  let sub = t('victory_sub');
  let pixel = true;
  if (mode === 'category') {
    icon = '🏅';
    title = t('category_done');
    sub = t('category_done_sub', { cat: t(`cat_${run.config.category ?? 'movie'}` as StringKey) });
    pixel = false;
  } else if (mode === 'daily') {
    icon = '🔥';
    title = t('daily_complete');
    sub = r?.rewarded ? t('daily_complete_sub') : t('daily_again');
    pixel = false;
  } else if (mode === 'challenge') {
    icon = r?.rewarded ? '🥇' : '😅';
    title = r?.rewarded ? t('challenge_won') : t('challenge_lost');
    sub = t('challenge_vs', { a: fmt(run.score), b: fmt(run.config.target ?? 0), name: run.config.challenger ?? '' });
    pixel = false;
  }
  const rewards: string[] = [];
  if (r?.coins) rewards.push(`+${r.coins} 💰`);
  if (mode === 'daily' && r?.rewarded) rewards.push(`+${REWARDS.daily.coins} 💰`, `+${REWARDS.daily.hints} 💡`);
  if (r?.chest) rewards.push(t('chest'));

  return (
    <Screen>
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24 }}>
        <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5, borderColor: p.goldDeep }}>
          <Emoji size={56}>{icon}</Emoji>
        </View>
        {pixel ? (
          <Px size={18} style={{ marginTop: 10, textAlign: 'center' }}>
            {title}
          </Px>
        ) : (
          <Txt size={26} weight="heavy" center style={{ marginTop: 10 }}>
            {title}
          </Txt>
        )}
        <Txt size={15} color={p.muted} center>
          {sub}
        </Txt>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Card style={{ padding: 16, alignItems: 'center', gap: 10 }}>
          <Txt size={12} weight="bold" color={p.muted} style={{ letterSpacing: 1.2 }}>
            {t('final_score')}
          </Txt>
          <Txt size={36} weight="heavy" style={{ fontVariant: ['tabular-nums'], lineHeight: 42 }}>
            {fmt(run.score)}
          </Txt>
          {rewards.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {rewards.map((x) => (
                <View key={x} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: p.goldTint }}>
                  <Txt size={14} weight="bold">
                    {x}
                  </Txt>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
      <View style={{ flex: 1 }} />
      <Bottom>
        <Btn label={t('share_victory')} icon={<ShareIcon color={p.onAction} />} onPress={() => shareScore(run, t)} />
        <Btn variant="soft" label={t('home')} size={14} height={50} onPress={() => router.dismissTo('/')} />
      </Bottom>
    </Screen>
  );
}
