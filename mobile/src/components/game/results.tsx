import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Share, View } from 'react-native';

import { tierChest, type ChestKind } from '@/game/chests';
import { PRICES, REWARDS } from '@/game/rules';
import { WORLDS } from '@/game/worlds';
import type { Run } from '@/hooks/use-run';
import { fmt, useLayout, useLevelName, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { MONEY_READY, showRewardedAd } from '@/services/store-services';
import { useProfile } from '@/store/profile';
import { langOf } from '@/i18n/device';
import { worldName } from '@/i18n/names';

import { AdIcon, ShareIcon } from '../icons';
import { CHEST_IMAGES } from '../chest/fallback';
import { Btn, Card, Emoji, Px, Screen, Tap, Txt } from '../ui';

import { Confetti } from '../confetti';
import { Popi } from '../mascot';
import { WorldPreview } from '../world-scene';

import { AnswerEmojis, Stars } from './board';

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

const CHEST_NAME: Record<ChestKind, StringKey> = { wood: 'chest_wood', gold: 'chest_gold', legend: 'chest_legend' };

/** The chest won at the end of a tier: its picture and its name. */
function ChestTile({ kind }: { kind: ChestKind }) {
  const p = usePalette();
  const t = useT();
  return (
    <View style={{ flex: 1.4, height: 76, borderRadius: 18, backgroundColor: p.goldTint, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 6 }}>
      <Image source={CHEST_IMAGES[kind]} style={{ width: 52, height: 52 }} resizeMode="contain" />
      <Txt size={13} weight="heavy" lines={2} style={{ flexShrink: 1 }}>
        {t(CHEST_NAME[kind])}
      </Txt>
    </View>
  );
}

export function TierView({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const tier = Math.floor(run.index / 20) + 1;
  const lang = langOf(useProfile((s) => s.lang));
  // On the adventure map, the next tier is a new world.
  const d = run.config.adventure ? run.config.difficulty : undefined;
  const next = d && tier < WORLDS[d].length ? WORLDS[d][tier] : null;
  return (
    <Screen>
      <Confetti />
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 24 }}>
        <Popi mood="joy" size={110} />
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
        <ChestTile kind={tierChest(tier)} />
        {[
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
      {next && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: next.bg, borderWidth: 2, borderColor: next.sign }}>
            <View style={{ width: 80, height: 56, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' }}>
              <WorldPreview world={next} width={76} height={52} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={12} weight="heavy" color={next.dark ? '#FFFFFF' : p.ink} style={{ letterSpacing: 0.8 }}>
                {t('world_unlocked').toUpperCase()}
              </Txt>
              <Txt size={17} weight="heavy" color={next.dark ? '#FFFFFF' : p.ink} lines={2}>
                {worldName(next, lang)}
              </Txt>
            </View>
          </View>
        </View>
      )}
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
        <Btn variant="gold" label={t('chest_open')} size={14} height={50} onPress={() => router.push({ pathname: '/coffres', params: { open: tierChest(tier) } })} />
        <Btn variant="soft" label={t('share')} size={14} height={50} icon={<ShareIcon color={p.ink} />} onPress={() => shareScore(run, t)} />
      </Bottom>
    </Screen>
  );
}

export function OverView({ run, onReplay }: { run: Run; onReplay: () => void }) {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  const coins = useProfile((s) => s.coins);
  const [busy, setBusy] = useState(false);
  const chrono = run.config.mode === 'chrono';
  const canContinue = !run.continued && !chrono && !run.practice;

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
        <Popi mood="sad" size={96} />
        <Px size={22} color={p.action}>
          {t('gameover')}
        </Px>
        <Txt size={15} color={p.muted} center>
          {chrono ? t('time_over', { n: run.index }) : t('gameover_sub', { n: run.index + 1 })}
        </Txt>
        {run.missed && !chrono && (
          <View style={{ alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Txt size={13} weight="bold" color={p.muted}>
              {t('answer_was')} · {name(run.missed.level)}
            </Txt>
            <AnswerEmojis level={run.missed.level} size={44} />
          </View>
        )}
      </View>
      {!run.practice && (
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
      )}
      {canContinue && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ padding: 14, borderRadius: 20, backgroundColor: p.goldTint, gap: 10 }}>
            <Txt size={15} weight="heavy" center>
              {t('continue_q')}
            </Txt>
            {MONEY_READY && (
              <Btn variant="gold" label={t('watch_ad')} icon={<AdIcon color="#1F1B2D" />} height={52} size={15} disabled={busy} onPress={watchAd} />
            )}
            <Btn
              variant={MONEY_READY ? 'soft' : 'gold'}
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
          {run.practice ? (
            <Btn variant="soft" label={t(run.config.origin === 'map' ? 'back_map' : 'back_dex')} size={14} height={52} style={{ flex: 1 }} onPress={backToDex} />
          ) : (
            <Btn variant="soft" label={t('home')} size={14} height={52} style={{ flex: 1 }} onPress={() => router.dismissTo('/')} />
          )}
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

/** A replayed level sits on top of the Pop-Cornédex page it came from. */
function backToDex() {
  if (router.canGoBack()) router.back();
  else router.dismissTo('/popcornedex');
}

/** The end of a level replayed from the Pop-Cornédex: its stars, and a way to try for more. */
function ReplayWinView({ run, onReplay }: { run: Run; onReplay: () => void }) {
  const p = usePalette();
  const t = useT();
  const name = useLevelName();
  const stars = run.last.stars ?? 1;
  const best = useProfile((s) => (run.level ? (s.stars[run.level.id] ?? stars) : stars));
  return (
    <Screen>
      {stars === 3 && <Confetti />}
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24 }}>
        <Popi mood={stars === 3 ? 'joy' : 'happy'} size={96} />
        {run.level && <AnswerEmojis level={run.level} size={56} />}
        <Txt size={26} weight="heavy" center style={{ marginTop: 10 }}>
          {t('replay_done')}
        </Txt>
        {run.level && (
          <Txt size={16} weight="bold" color={p.muted} center lines={2}>
            {name(run.level)}
          </Txt>
        )}
        <Stars n={stars} size={44} />
        <Txt size={13} color={p.muted} center>
          {t('star_rules')}
        </Txt>
        {best > stars && (
          <Txt size={13} weight="bold" color={p.muted} center>
            {t('dex_best', { n: best })}
          </Txt>
        )}
      </View>
      <View style={{ flex: 1 }} />
      <Bottom>
        <Btn label={t('replay')} onPress={onReplay} variant={stars === 3 ? 'soft' : 'action'} />
        <Btn variant={stars === 3 ? 'action' : 'soft'} label={t(run.config.origin === 'map' ? 'back_map' : 'back_dex')} size={14} height={50} onPress={backToDex} />
      </Bottom>
    </Screen>
  );
}

export function WinView({ run, onReplay }: { run: Run; onReplay: () => void }) {
  const p = usePalette();
  const t = useT();
  const mode = run.config.mode;
  const r = run.result;
  if (run.practice) return <ReplayWinView run={run} onReplay={onReplay} />;
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
  if (r?.saved) rewards.push(t('streak_saved'));

  const party = mode !== 'challenge' || !!r?.rewarded;
  return (
    <Screen>
      {party && <Confetti />}
      <View style={{ flex: 1 }} />
      <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Popi mood={party ? 'joy' : 'sad'} size={120} />
          {/* The mode's own badge, pinned to Popi. */}
          <View style={{ position: 'absolute', right: -8, bottom: 4, width: 44, height: 44, borderRadius: 22, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderColor: p.goldDeep }}>
            <Emoji size={24}>{icon}</Emoji>
          </View>
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
      {r?.chest && (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Tap onPress={() => router.push({ pathname: '/coffres', params: { open: r.chest ?? 'wood' } })} tint={p.goldTint} label={t('chest_open')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }}>
            <Image source={CHEST_IMAGES[r.chest]} style={{ width: 64, height: 64 }} resizeMode="contain" />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt size={12} weight="heavy" color={p.muted} style={{ letterSpacing: 0.8 }}>
                {t('chest_won').toUpperCase()}
              </Txt>
              <Txt size={17} weight="heavy">
                {t(CHEST_NAME[r.chest])}
              </Txt>
            </View>
            <View style={{ height: 34, paddingHorizontal: 12, borderRadius: 12, backgroundColor: p.gold, justifyContent: 'center' }}>
              <Txt size={13} weight="heavy" color="#1F1B2D">
                {t('chest_open')}
              </Txt>
            </View>
          </Tap>
        </View>
      )}
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
