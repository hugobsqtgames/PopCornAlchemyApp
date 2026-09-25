import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { usePalette, useT } from '@/hooks/use-app';

/** Native iOS tab bar (it becomes the floating top bar on iPad automatically). */
export default function TabsLayout() {
  const p = usePalette();
  const t = useT();
  return (
    <NativeTabs tintColor={p.action} backgroundColor={p.surface} labelStyle={{ color: p.muted }} iconColor={p.muted}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tab_play')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="boutique">
        <NativeTabs.Trigger.Label>{t('tab_shop')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="shopping_bag" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trophees">
        <NativeTabs.Trigger.Label>{t('tab_trophies')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} md="emoji_events" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Label>{t('tab_profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
