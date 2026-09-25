import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, View } from 'react-native';

import { ChevronIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from '@/components/icons';
import { Emoji, Header, Screen, Section, Txt } from '@/components/ui';
import { NO_ADS_PACK } from '@/game/catalog';
import { useLayout, usePalette, useT } from '@/hooks/use-app';
import { purchase, restorePurchases } from '@/services/store-services';
import { useProfile } from '@/store/profile';

const LANG_NAMES = { fr: 'Français', en: 'English', es: 'Español' };
const SOCIALS = [
  { name: 'TikTok', url: 'https://www.tiktok.com/@hugo_bsqt', Icon: TikTokIcon, tint: 'actionTint' as const },
  { name: 'Instagram', url: 'https://www.instagram.com/hugo_bsqt/', Icon: InstagramIcon, tint: 'goldTint' as const },
  { name: 'YouTube', url: 'https://www.youtube.com/channel/UCUAfM0_WdPb1o-gRWAP8xWg', Icon: YouTubeIcon, tint: 'blueTint' as const },
];

function Group({ children }: { children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ marginHorizontal: 16, borderRadius: 18, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

function Row({ icon, label, right, onPress, first }: { icon: string; label: string; right?: ReactNode; onPress?: () => void; first?: boolean }) {
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
      <Txt size={16} style={{ flex: 1 }}>
        {label}
      </Txt>
      {right ?? (onPress ? <ChevronIcon color={p.line2} /> : null)}
    </Pressable>
  );
}

export default function Reglages() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const s = useProfile();

  return (
    <Screen>
      <Header title={t('settings')} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Section>{t('sec_game')}</Section>
        <Group>
          <Row first icon="🔊" label={t('sounds')} right={<Switch value={s.sound} onValueChange={(v) => s.set({ sound: v })} trackColor={{ true: p.green }} />} />
          <Row icon="🎵" label={t('music')} right={<Switch value={s.music} onValueChange={(v) => s.set({ music: v })} trackColor={{ true: p.green }} />} />
          <Row icon="📳" label={t('haptics')} right={<Switch value={s.haptics} onValueChange={(v) => s.set({ haptics: v })} trackColor={{ true: p.green }} />} />
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

        <Section>{t('sec_account')}</Section>
        <Group>
          <Row first icon="🎮" label={t('game_center')} right={<Txt size={14} color={p.muted}>{t('gc_soon')}</Txt>} />
          <Row
            icon="🚫"
            label={s.noAds ? t('no_ads_owned') : t('remove_ads')}
            onPress={s.noAds ? undefined : () => purchase(NO_ADS_PACK.id, t('iap_unavailable'))}
            right={s.noAds ? null : <Txt size={15} weight="bold">{NO_ADS_PACK.price}</Txt>}
          />
          <Row icon="🔄" label={t('restore')} onPress={() => restorePurchases(t('iap_unavailable'))} right={null} />
        </Group>

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
          <Row first icon="📖" label={t('replay_tuto')} onPress={() => router.push('/tutoriel')} />
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
