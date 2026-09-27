import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';

import { ChevronIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from '@/components/icons';
import { Emoji, Header, Screen, Section, Toggle, Txt } from '@/components/ui';
import { NO_ADS_PACK } from '@/game/catalog';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { play } from '@/services/feedback';
import { disableReminder, enableReminder } from '@/services/reminder';
import { GAME_CENTER_READY, MONEY_READY, purchase, restorePurchases } from '@/services/store-services';
import { useProfile } from '@/store/profile';

const LANG_NAMES = { fr: 'Français', en: 'English', es: 'Español' };
const SOCIALS = [
  { name: 'TikTok', url: 'https://www.tiktok.com/@hugo_bsqt', Icon: TikTokIcon, tint: 'actionTint' as const },
  { name: 'Instagram', url: 'https://www.instagram.com/hugo_bsqt/', Icon: InstagramIcon, tint: 'goldTint' as const },
  { name: 'YouTube', url: 'https://www.youtube.com/channel/UCUAfM0_WdPb1o-gRWAP8xWg', Icon: YouTubeIcon, tint: 'blueTint' as const },
];

function Group({ children, style }: { children: ReactNode; style?: object }) {
  const p = usePalette();
  return (
    <View style={{ ...style, marginHorizontal: 16, borderRadius: 18, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  sub,
  right,
  onPress,
  first,
}: {
  icon: string;
  label: string;
  sub?: string;
  right?: ReactNode;
  onPress?: () => void;
  first?: boolean;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        minHeight: 50,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderTopWidth: first ? 0 : 1,
        borderColor: p.line,
        backgroundColor: pressed ? p.sunk : 'transparent',
      })}>
      <Emoji size={18}>{icon}</Emoji>
      <View style={{ flex: 1, paddingVertical: sub ? 8 : 0 }}>
        <Txt size={16}>{label}</Txt>
        {sub && (
          <Txt size={12} color={p.muted}>
            {sub}
          </Txt>
        )}
      </View>
      {right ?? (onPress ? <ChevronIcon color={p.line2} /> : null)}
    </Pressable>
  );
}

export default function Reglages() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const s = useProfile();
  const toggle = (key: 'sound' | 'music' | 'haptics' | 'reduceMotion', v: boolean) => {
    s.set({ [key]: v });
    play('toggle');
  };
  const toggleReminder = async (v: boolean) => {
    play('toggle');
    if (!v) return disableReminder();
    if (!(await enableReminder())) Alert.alert(t('reminder'), t('notif_denied'));
  };

  return (
    <Screen>
      <Header title={t('settings')} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Section>{t('sec_game')}</Section>
        <Group>
          <Row first icon="🔊" label={t('sounds')} right={<Toggle label={t('sounds')} value={s.sound} onValueChange={(v) => toggle('sound', v)} />} />
          <Row icon="🎵" label={t('music')} right={<Toggle label={t('music')} value={s.music} onValueChange={(v) => toggle('music', v)} />} />
          <Row icon="📳" label={t('haptics')} right={<Toggle label={t('haptics')} value={s.haptics} onValueChange={(v) => toggle('haptics', v)} />} />
          <Row
            icon="🎞️"
            label={t('reduce_motion')}
            right={<Toggle label={t('reduce_motion')} value={s.reduceMotion} onValueChange={(v) => toggle('reduceMotion', v)} />}
          />
          <Row
            icon="⏰"
            label={t('reminder')}
            sub={t('reminder_sub')}
            right={<Toggle label={t('reminder')} value={s.reminder} onValueChange={toggleReminder} />}
          />
          <Row
            icon="🌐"
            label={t('language')}
            onPress={() => router.push('/langue')}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Txt size={15} color={p.muted}>
                  {LANG_NAMES[s.lang ?? 'fr']}
                </Txt>
                <ChevronIcon color={p.line2} />
              </View>
            }
          />
        </Group>

        <Group style={{ marginTop: 16 }}>
          <Row first icon="🎁" label={t('gift_code')} onPress={() => router.push('/code')} />
        </Group>

        {(MONEY_READY || GAME_CENTER_READY) && (
          <>
            <Section>{t('sec_account')}</Section>
            <Group>
              {GAME_CENTER_READY && <Row first icon="🎮" label={t('game_center')} />}
              {MONEY_READY && (
                <>
                  <Row
                    first={!GAME_CENTER_READY}
                    icon="🚫"
                    label={s.noAds ? t('no_ads_owned') : t('remove_ads')}
                    onPress={s.noAds ? undefined : () => purchase(NO_ADS_PACK.id, t('iap_unavailable'))}
                    right={s.noAds ? null : <Txt size={15} weight="bold">{NO_ADS_PACK.price}</Txt>}
                  />
                  <Row icon="🔄" label={t('restore')} onPress={() => restorePurchases(t('iap_unavailable'))} right={null} />
                </>
              )}
            </Group>
          </>
        )}

        <Section>{t('follow')}</Section>
        <Group>
          <View style={{ flexDirection: 'row' }}>
            {SOCIALS.map(({ name, url, Icon, tint }) => (
              <Pressable key={name} onPress={() => Linking.openURL(url)} accessibilityRole="link" accessibilityLabel={name} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: p[tint], alignItems: 'center', justifyContent: 'center' }}>
                  <Icon color={p.ink} />
                </View>
                <Txt size={13} weight="semibold">
                  {name}
                </Txt>
              </Pressable>
            ))}
          </View>
        </Group>

        <Section>{t('sec_help')}</Section>
        <Group>
          <Row first icon="📖" label={t('rules')} onPress={() => router.push('/tutoriel')} />
          <Row icon="👆" label={t('replay_tuto')} onPress={() => router.push({ pathname: '/jeu', params: { mode: 'tutorial', fresh: String(Date.now()) } })} />
          <Row icon="🔒" label={t('privacy')} onPress={() => router.push({ pathname: '/texte', params: { doc: 'privacy' } })} />
          <Row icon="📄" label={t('legal')} onPress={() => router.push({ pathname: '/texte', params: { doc: 'legal' } })} />
        </Group>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(t('reset'), t('reset_confirm'), [
              { text: t('cancel'), style: 'cancel' },
              { text: t('reset'), style: 'destructive', onPress: () => s.reset() },
            ])
          }
          style={{ marginHorizontal: 16, marginTop: 22, height: 50, borderRadius: 16, borderWidth: p.border, borderColor: p.line, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={16} weight="semibold" color={p.action}>
            {t('reset')}
          </Txt>
        </Pressable>
        <Txt size={12} color={p.muted} center style={{ marginTop: 14 }}>
          {t('version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
        </Txt>
      </ScrollView>
    </Screen>
  );
}
