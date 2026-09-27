import { Modal, Pressable, View } from 'react-native';

import { PRICES } from '@/game/rules';
import type { Run } from '@/hooks/use-run';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

import { Emoji, Txt } from '../ui';

/** The three clues: reveal an emoji (1 hint), remove 5 wrong emojis (coins), shuffle (free). */
export function ClueSheet({ run, open, onClose }: { run: Run; open: boolean; onClose: () => void }) {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const hints = useProfile((s) => s.hints);
  const coins = useProfile((s) => s.coins);

  const clues = [
    {
      icon: '💡',
      title: t('clue_reveal'),
      sub: hints > 0 ? t('clue_reveal_sub') : t('no_hints'),
      right: `${hints} 💡`,
      disabled: run.hintUsed || hints <= 0,
      go: run.giveHint,
    },
    {
      icon: '🧹',
      title: t('clue_remove'),
      sub: t('clue_remove_sub', { n: PRICES.removeDecoys }),
      right: `${PRICES.removeDecoys} 💰`,
      disabled: run.removed.length > 0 || coins < PRICES.removeDecoys,
      go: run.removeDecoys,
    },
    { icon: '🔀', title: t('clue_shuffle'), sub: t('clue_shuffle_sub'), right: '', disabled: false, go: run.shuffleTiles },
  ];

  return (
    // Never at the same time as the pause sheet: iOS shows only one sheet at a time.
    <Modal visible={open && run.phase === 'play' && !run.paused} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(31,27,45,0.55)' }} onPress={onClose} accessibilityLabel={t('close')} />
      <View
        style={{
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
          backgroundColor: p.bg,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          padding: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 16,
          gap: 12,
        }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: p.line2, alignSelf: 'center' }} />
        <Txt size={18} weight="heavy" center>
          {t('clues')}
        </Txt>
        <View style={{ borderRadius: 18, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, overflow: 'hidden' }}>
          {clues.map((c, i) => (
            <Pressable
              key={c.icon}
              disabled={c.disabled}
              onPress={() => {
                onClose();
                c.go();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${c.title}, ${c.sub}`}
              accessibilityState={{ disabled: c.disabled }}
              style={({ pressed }) => ({
                minHeight: 64,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderColor: p.line,
                backgroundColor: pressed ? p.sunk : 'transparent',
                opacity: c.disabled ? 0.45 : 1,
              })}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: p.goldTint, alignItems: 'center', justifyContent: 'center' }}>
                <Emoji size={22}>{c.icon}</Emoji>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={16} weight="bold">
                  {c.title}
                </Txt>
                <Txt size={13} color={p.muted}>
                  {c.sub}
                </Txt>
              </View>
              {!!c.right && (
                <Txt size={14} weight="heavy">
                  {c.right}
                </Txt>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
