import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Btn, Card, Emoji, Header, MAX_TEXT_SCALE, Screen, Txt } from '@/components/ui';
import { checkCode, rewardText } from '@/game/codes';
import { dayKey } from '@/game/dates';
import { usePalette, useT } from '@/hooks/use-app';
import { checkAchievements } from '@/services/achievements';
import { buzz, play } from '@/services/feedback';
import { useProfile } from '@/store/profile';
import { FONTS } from '@/theme/palettes';

/** Gift codes from the videos: one use per device. */
export default function Code() {
  const p = usePalette();
  const t = useT();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const redeem = () => {
    const s = useProfile.getState();
    const r = checkCode(value, s.redeemedCodes, dayKey());
    if (!r.ok) {
      play('error');
      buzz('error');
      setResult({ ok: false, text: t(r.reason === 'used' ? 'gift_code_used' : 'gift_code_bad') });
      return;
    }
    const { coins, hints, shields, skips } = r.reward;
    if (coins) s.addCoins(coins);
    if (hints) s.addItem('hints', hints);
    if (shields) s.addItem('shields', shields);
    if (skips) s.addItem('skips', skips);
    s.set({ redeemedCodes: [...s.redeemedCodes, r.code] });
    play('buy');
    buzz('success');
    checkAchievements();
    setValue('');
    setResult({ ok: true, text: t('gift_code_ok', { r: rewardText(r.reward) }) });
  };

  return (
    <Screen>
      <Header title={t('gift_code')} />
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <Emoji size={48}>🎁</Emoji>
          <Txt size={14} color={p.muted} center>
            {t('gift_code_sub')}
          </Txt>
        </View>
        <TextInput
          value={value}
          onChangeText={(v) => {
            setValue(v);
            setResult(null);
          }}
          onSubmitEditing={redeem}
          placeholder={t('gift_code_hint')}
          placeholderTextColor={p.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={24}
          maxFontSizeMultiplier={MAX_TEXT_SCALE}
          accessibilityLabel={t('gift_code_hint')}
          style={{
            height: 56,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: p.line2,
            backgroundColor: p.surface,
            paddingHorizontal: 16,
            fontFamily: FONTS.bold,
            fontSize: 20,
            letterSpacing: 2,
            textAlign: 'center',
            color: p.ink,
          }}
        />
        <Btn label={t('gift_code_btn')} disabled={!value.trim()} onPress={redeem} />
        {result && (
          <Card tint={result.ok ? p.greenTint : p.actionTint} style={{ padding: 14 }}>
            <Txt size={15} weight="bold" center color={result.ok ? p.greenDeep : p.action}>
              {result.text}
            </Txt>
          </Card>
        )}
      </View>
    </Screen>
  );
}
