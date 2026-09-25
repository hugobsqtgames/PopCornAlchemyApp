import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { AdIcon } from '@/components/icons';
import { Emoji, Pill, Segments, Tap, Txt } from '@/components/ui';
import { AVATARS, COIN_PACKS, NO_ADS_PACK, STYLES, stylePrice, THEMES, type ThemeId } from '@/game/catalog';
import { PRICES, REWARDS } from '@/game/rules';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import type { StringKey } from '@/i18n/strings';
import { checkAchievements } from '@/services/achievements';
import { buzz, play } from '@/services/feedback';
import { purchase, showRewardedAd } from '@/services/store-services';
import { useProfile, type Item } from '@/store/profile';
import { paletteFor } from '@/theme/palettes';

type Tab = 'coins' | 'bonus' | 'themes' | 'styles' | 'avatars';

export default function Boutique() {
  const p = usePalette();
  const t = useT();
  const { tabTop, tablet } = useLayout();
  const s = useProfile();
  const [tab, setTab] = useState<Tab>('coins');
  const cols = tablet ? 4 : 2;
  const cell = { width: `${100 / cols - 2.6}%` as const };

  const buy = (price: number, give: () => void) => {
    if (!useProfile.getState().spend(price)) {
      buzz('error');
      play('error');
      Alert.alert('', t('missing_coins', { n: price - useProfile.getState().coins }));
      return;
    }
    give();
    play('buy');
    buzz('success');
    checkAchievements();
  };

  const watchAd = async () => {
    if (s.adsLeft() <= 0) return;
    const ok = await showRewardedAd();
    if (!ok) return;
    s.countAd();
    s.addCoins(REWARDS.ad);
    play('coin');
  };

  const coins = (
    <View style={{ gap: 18 }}>
      <Tap onPress={watchAd} tint={p.goldTint} label={t('free_coins', { n: REWARDS.ad })} style={{ height: 62, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AdIcon size={26} color={p.ink} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={15} weight="heavy">
            {t('free_coins', { n: REWARDS.ad })}
          </Txt>
          <Txt size={12} weight="semibold" color={p.muted}>
            {s.adsLeft() > 0 ? t('free_coins_sub', { n: s.adsLeft() }) : t('free_coins_none')}
          </Txt>
        </View>
        {s.adsLeft() > 0 && (
          <View style={{ height: 32, paddingHorizontal: 12, borderRadius: 10, backgroundColor: p.gold, justifyContent: 'center' }}>
            <Txt size={13} weight="heavy" color="#1F1B2D">
              {t('watch')}
            </Txt>
          </View>
        )}
      </Tap>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, rowGap: 18 }}>
        {COIN_PACKS.map((pack) => (
          <Tap
            key={pack.id}
            onPress={() => purchase(pack.id, t('iap_unavailable'))}
            border={pack.flag === 'best' ? p.action : pack.flag === 'popular' ? p.gold : undefined}
            label={`${pack.coins} ${pack.price}`}
            style={[cell, { height: 128, padding: 10, paddingTop: 12, alignItems: 'center', gap: 4 }]}>
            {pack.flag && (
              <View style={{ position: 'absolute', top: -10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: pack.flag === 'best' ? p.action : p.gold }}>
                <Txt size={10} weight="heavy" color={pack.flag === 'best' ? p.onAction : '#1F1B2D'}>
                  {t(pack.flag === 'best' ? 'pack_best' : 'pack_popular')}
                </Txt>
              </View>
            )}
            <Emoji size={28}>{pack.icon}</Emoji>
            <Txt size={17} weight="heavy">
              {fmt(pack.coins)}
            </Txt>
            <Txt size={12} weight="semibold" color={p.muted}>
              {t(`pack_${pack.id}` as StringKey)}
              {pack.bonus ? ` · +${pack.bonus} %` : ''}
            </Txt>
            <View style={{ marginTop: 'auto', alignSelf: 'stretch', height: 30, borderRadius: 10, backgroundColor: p.action, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={15} weight="heavy" color={p.onAction}>
                {pack.price}
              </Txt>
            </View>
          </Tap>
        ))}
      </View>
      <Tap
        onPress={() => !s.noAds && purchase(NO_ADS_PACK.id, t('iap_unavailable'))}
        label={t('no_ads_pack')}
        style={{ height: 60, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Emoji size={24}>🚫</Emoji>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={15} weight="heavy">
            {s.noAds ? t('no_ads_owned') : t('no_ads_pack')}
          </Txt>
          <Txt size={12} weight="semibold" color={p.muted}>
            {t('no_ads_sub')}
          </Txt>
        </View>
        {!s.noAds && (
          <Txt size={15} weight="heavy">
            {NO_ADS_PACK.price}
          </Txt>
        )}
      </Tap>
    </View>
  );

  const bonusItems: { item: Item; icon: string; price: number; qty: number; key: 'hints' | 'shield' | 'skip' | 'double' }[] = [
    { item: 'hints', icon: '💡', price: PRICES.hints5, qty: 5, key: 'hints' },
    { item: 'shields', icon: '🛡️', price: PRICES.shield, qty: 1, key: 'shield' },
    { item: 'skips', icon: '⏭️', price: PRICES.skip, qty: 1, key: 'skip' },
    { item: 'doubles', icon: '✨', price: PRICES.double, qty: 1, key: 'double' },
  ];
  const bonus = (
    <View style={{ gap: 10 }}>
      {bonusItems.map((b) => (
        <Tap
          key={b.item}
          onPress={() => buy(b.price, () => s.addItem(b.item, b.qty))}
          label={t(`bonus_${b.key}`)}
          style={{ minHeight: 72, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: p.sunk, alignItems: 'center', justifyContent: 'center' }}>
            <Emoji size={24}>{b.icon}</Emoji>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={16} weight="heavy">
              {t(`bonus_${b.key}`)}
            </Txt>
            <Txt size={13} color={p.muted}>
              {t(`bonus_${b.key}_sub` as StringKey)} · {t('you_have', { n: s[b.item] })}
            </Txt>
          </View>
          <PricePill price={b.price} />
        </Tap>
      ))}
    </View>
  );

  const themes = (
    <View style={{ gap: 12 }}>
      <Txt size={13} color={p.muted}>
        {t('themes_note')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {THEMES.map((th) => {
          const owned = s.ownedThemes.includes(th.id);
          const on = s.theme === th.id;
          const pal = paletteFor(th.id, false);
          return (
            <Tap
              key={th.id}
              label={t(`theme_${th.id}` as StringKey)}
              border={on ? p.ink : undefined}
              onPress={() => {
                if (owned) s.set({ theme: th.id });
                else buy(th.price, () => s.set({ ownedThemes: [...s.ownedThemes, th.id as ThemeId], theme: th.id }));
              }}
              style={{ width: tablet ? '23%' : '31.3%', padding: 7, gap: 7, borderWidth: on ? 2 : p.border }}>
              <View style={{ height: 74, borderRadius: 12, padding: 7, gap: 4, backgroundColor: pal.bg, borderWidth: th.id === 'retro' ? 2 : 0, borderColor: '#2D2D2D' }}>
                <View style={{ height: 14, borderRadius: 4, backgroundColor: pal.surface }} />
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={{ flex: 1, height: 12, borderRadius: 3, backgroundColor: pal.surface }} />
                  ))}
                </View>
                <View style={{ marginTop: 'auto', height: 12, borderRadius: 3, backgroundColor: pal.action }} />
              </View>
              <Txt size={13} weight="bold" lines={1}>
                {t(`theme_${th.id}` as StringKey)}
              </Txt>
              <Txt size={12} weight="bold" color={on ? p.green : p.ink}>
                {on ? t('equipped') : owned ? t('owned') : `${fmt(th.price)} 💰`}
              </Txt>
            </Tap>
          );
        })}
      </View>
    </View>
  );

  const styles = (
    <View style={{ gap: 12 }}>
      <Txt size={13} color={p.muted}>
        {t('styles_note')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {STYLES.map((st, i) => {
          const owned = s.ownedStyles.includes(st);
          const on = s.style === st;
          return (
            <Tap
              key={st}
              label={st}
              border={on ? p.ink : undefined}
              onPress={() => {
                if (owned) s.set({ style: st });
                else buy(stylePrice(i), () => s.set({ ownedStyles: [...s.ownedStyles, st], style: st }));
              }}
              style={{ width: tablet ? '15.3%' : '22.9%', paddingVertical: 10, alignItems: 'center', gap: 4, borderWidth: on ? 2 : p.border }}>
              <Emoji size={28} style={{ opacity: owned ? 1 : 0.5 }}>
                {st}
              </Emoji>
              <Txt size={11} weight="bold" color={p.muted}>
                {t('style_bonus', { n: i * 5 })}
              </Txt>
              <Txt size={11} weight="heavy" color={on ? p.green : p.ink}>
                {on ? '✓' : owned ? t('owned') : `${fmt(stylePrice(i))} 💰`}
              </Txt>
            </Tap>
          );
        })}
      </View>
    </View>
  );

  const avatars = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {AVATARS.map((a) => {
        const owned = s.ownedAvatars.includes(a);
        const on = s.avatar === a;
        return (
          <Tap
            key={a}
            label={a}
            border={on ? p.ink : undefined}
            onPress={() => {
              if (owned) s.set({ avatar: a });
              else buy(PRICES.avatar, () => s.set({ ownedAvatars: [...s.ownedAvatars, a], avatar: a }));
            }}
            style={{ width: tablet ? '15.3%' : '22.9%', paddingVertical: 12, alignItems: 'center', gap: 6, borderWidth: on ? 2 : p.border }}>
            <Emoji size={32} style={{ opacity: owned ? 1 : 0.5 }}>
              {a}
            </Emoji>
            <Txt size={11} weight="heavy" color={on ? p.green : p.ink}>
              {on ? '✓' : owned ? t('owned') : `${PRICES.avatar} 💰`}
            </Txt>
          </Tap>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: tabTop, paddingBottom: 24 }}>
      <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, height: 52 }}>
          <Txt size={24} weight="heavy">
            {t('shop')}
          </Txt>
          <Pill label={`${s.coins}`}>
            <Emoji size={15}>💰</Emoji>
            <Txt size={14} weight="bold">
              {fmt(s.coins)}
            </Txt>
          </Pill>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Segments
            value={tab}
            onChange={setTab}
            items={[
              { id: 'coins', label: t('shop_coins') },
              { id: 'bonus', label: t('shop_bonus') },
              { id: 'themes', label: t('shop_themes') },
              { id: 'styles', label: t('shop_styles') },
              { id: 'avatars', label: t('shop_avatars') },
            ]}
          />
        </View>
        <View style={{ padding: 16 }}>
          {tab === 'coins' && coins}
          {tab === 'bonus' && bonus}
          {tab === 'themes' && themes}
          {tab === 'styles' && styles}
          {tab === 'avatars' && avatars}
        </View>
      </View>
    </ScrollView>
  );
}

function PricePill({ price }: { price: number }) {
  const p = usePalette();
  return (
    <View style={{ height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: p.action, justifyContent: 'center' }}>
      <Txt size={14} weight="heavy" color={p.onAction}>
        {fmt(price)} 💰
      </Txt>
    </View>
  );
}
