import { useEffect, useState } from 'react';
import { Animated, Modal, View } from 'react-native';

import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { play } from '@/services/feedback';
import { useUi } from '@/store/ui';

import { AdIcon } from './icons';
import { Btn, Emoji, Txt } from './ui';

/** Achievement toasts, shown one at a time at the top of the screen. */
export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  const p = usePalette();
  const { insets } = useLayout();
  const y = useState(() => new Animated.Value(-120))[0];
  const current = toasts[0];

  useEffect(() => {
    if (!current) return;
    y.setValue(-120);
    Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(y, { toValue: -140, duration: 250, useNativeDriver: true }).start(() => dismiss(current.id));
    }, 2800);
    return () => clearTimeout(timer);
  }, [current, dismiss, y]);

  if (!current) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        alignItems: 'center',
        transform: [{ translateY: y }],
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          maxWidth: 420,
          width: '100%',
          padding: 12,
          borderRadius: 18,
          backgroundColor: p.surface,
          borderWidth: 2,
          borderColor: p.gold,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: p.goldTint, alignItems: 'center', justifyContent: 'center' }}>
          <Emoji size={24}>{current.icon}</Emoji>
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={12} weight="bold" color={p.muted}>
            {current.title}
          </Txt>
          <Txt size={16} weight="heavy">
            {current.body}
          </Txt>
        </View>
      </View>
    </Animated.View>
  );
}

const AD_SECONDS = 3;

/**
 * Stand-in for a rewarded video ad (Expo Go cannot load AdMob).
 * It is clearly labelled as a placeholder and gives the reward at the end.
 */
export function SimulatedAd() {
  const open = useUi((s) => s.adOpen);
  const close = useUi((s) => s.closeAd);
  const p = usePalette();
  const t = useT();
  const openedAt = useUi((s) => s.adOpenedAt);
  const [now, setNow] = useState(openedAt);
  const left = Math.min(AD_SECONDS, Math.max(0, AD_SECONDS - Math.floor((now - openedAt) / 1000)));

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [open]);

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={() => close(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,12,24,0.92)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 380, padding: 22, borderRadius: 24, backgroundColor: p.surface, gap: 14, alignItems: 'center' }}>
          <AdIcon size={40} color={p.muted} />
          <Txt size={18} weight="heavy">
            {t('ad_title')}
          </Txt>
          <Txt size={14} color={p.muted} center>
            {t('ad_body')}
          </Txt>
          <Btn
            label={left > 0 ? `${left}…` : t('ad_done')}
            variant={left > 0 ? 'off' : 'gold'}
            disabled={left > 0}
            onPress={() => {
              play('win');
              close(true);
            }}
            style={{ alignSelf: 'stretch' }}
          />
        </View>
      </View>
    </Modal>
  );
}
