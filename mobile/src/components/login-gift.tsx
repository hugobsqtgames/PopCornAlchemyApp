import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import { Modal, View } from 'react-native';

import { dayKey } from '@/game/dates';
import { canClaimLogin, LOGIN_REWARDS } from '@/game/progress';
import { rewardText, type GiftReward } from '@/game/codes';
import { useLayout, useNow, usePalette, useT } from '@/hooks/use-app';
import { buzz, play, playLater } from '@/services/feedback';
import { useProfile } from '@/store/profile';

import { CheckIcon } from './icons';
import { Btn, Emoji, Txt } from './ui';
import { Confetti } from './confetti';

function giftIcon(r: GiftReward) {
  if (r.streakSaves) return '🎁';
  if (r.shields) return '🛡️';
  if (r.hints) return '💡';
  return '💰';
}

/** The daily gift calendar: 7 days, one gift each day the app is opened, the 7th the biggest. */
export function LoginGift() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const focused = useIsFocused();
  const today = dayKey(useNow());
  const loginLast = useProfile((s) => s.loginLast);
  const loginDay = useProfile((s) => s.loginDay);
  const [got, setGot] = useState<{ reward: GiftReward; day: number } | null>(null);
  const open = focused && (got !== null || canClaimLogin(loginLast, today));
  // Before collecting, the next gift is `loginDay`; after, the one just collected stays marked.
  const current = got ? got.day : loginDay;

  const claim = () => {
    const r = useProfile.getState().claimLogin();
    if (!r) return;
    setGot(r);
    play('win');
    playLater('coin', 350);
    buzz('success');
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => (got ? setGot(null) : claim())}>
      <View style={{ flex: 1, backgroundColor: 'rgba(31,27,45,0.55)', alignItems: 'center', justifyContent: 'center', padding: 16, paddingBottom: insets.bottom + 16 }}>
        {got && <Confetti />}
        <View style={{ width: '100%', maxWidth: 440, backgroundColor: p.bg, borderRadius: 26, padding: 18, gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Txt size={22} weight="heavy" center>
              {t('login_title')}
            </Txt>
            <Txt size={14} color={p.muted} center>
              {t('login_sub')}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
            {LOGIN_REWARDS.map((r, i) => {
              const done = got ? i <= current : i < current;
              const now = i === current;
              const last = i === LOGIN_REWARDS.length - 1;
              return (
                <View
                  key={i}
                  accessible
                  accessibilityLabel={`${t('login_day', { n: i + 1 })}, ${rewardText(r)}`}
                  accessibilityState={{ selected: now }}
                  style={{
                    width: last ? '47%' : '22.5%',
                    minHeight: 78,
                    borderRadius: 14,
                    paddingVertical: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    backgroundColor: done ? p.greenTint : now ? p.goldTint : p.surface,
                    borderWidth: now ? 2 : p.border,
                    borderColor: done ? p.green : now ? p.gold : p.line,
                  }}>
                  <Txt size={11} weight="bold" color={p.muted}>
                    {t('login_day', { n: i + 1 })}
                  </Txt>
                  <Emoji size={last ? 28 : 22}>{giftIcon(r)}</Emoji>
                  <Txt size={11} weight="heavy" center lines={1}>
                    {rewardText(r)}
                  </Txt>
                  {done && (
                    <View style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: p.green, alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon size={9} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          {got ? (
            <>
              <Txt size={17} weight="heavy" center>
                {t('login_got', { r: rewardText(got.reward) })}
              </Txt>
              <Btn variant="green" label={t('login_ok')} onPress={() => setGot(null)} />
            </>
          ) : (
            <Btn variant="gold" label={`🎁 ${t('login_claim')}`} onPress={claim} />
          )}
        </View>
      </View>
    </Modal>
  );
}
