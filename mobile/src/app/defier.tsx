import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Share, View } from 'react-native';

import { ShareIcon } from '@/components/icons';
import { Btn, Card, Emoji, Header, Screen, Section, Tap, Txt } from '@/components/ui';
import { parseLevelIds, parseName, parseScore } from '@/game/links';
import { levelById } from '@/game/rules';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import { useProfile } from '@/store/profile';

/** Also the target of challenge links: popcornalchemy://defier?l=12,40&s=1200&n=Léa */
export default function Defier() {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const params = useLocalSearchParams<{ l?: string | string[]; s?: string | string[]; n?: string | string[] }>();
  const s = useProfile();
  const name = s.name || t('default_name');

  // A challenge link was opened: keep it in the received list.
  const link = [params.l, params.s, params.n].map((v) => (Array.isArray(v) ? v[0] : v)).join('|');
  useEffect(() => {
    const [l, sc, n] = link.split('|');
    const ids = parseLevelIds(l);
    if (!ids.length) return;
    const received = useProfile.getState().received;
    if (received.some((r) => r.ids.join() === ids.join())) return;
    useProfile.getState().set({
      received: [{ ids, score: parseScore(sc), name: parseName(n), receivedAt: new Date().toISOString() }, ...received].slice(0, 20),
    });
  }, [link]);

  const run = s.lastRun;
  const send = () => {
    if (!run) return;
    const url = Linking.createURL('/defier', { queryParams: { l: run.ids.join(','), s: String(run.score), n: name } });
    Share.share({ message: t('share_challenge', { name, n: run.ids.length, s: fmt(run.score), url }) }).catch(() => {});
  };

  const playChallenge = (ids: number[], target: number, who: string) =>
    router.push({ pathname: '/jeu', params: { mode: 'challenge', ids: ids.join(','), target: String(target), name: who } });

  return (
    <Screen>
      <Header title={t('defier_title')} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
          {run ? (
            <>
              <Card style={{ overflow: 'hidden' }}>
                <View style={{ padding: 12, paddingHorizontal: 16, backgroundColor: p.actionTint, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Emoji size={22}>{s.avatar}</Emoji>
                  <Txt size={15} weight="heavy">
                    {t('defies_you', { name })}
                  </Txt>
                </View>
                <View style={{ padding: 16, alignItems: 'center', gap: 12, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: p.line }}>
                  <Txt size={12} weight="bold" color={p.muted} style={{ letterSpacing: 1.2 }}>
                    {t('challenge_levels', { n: run.ids.length })}
                  </Txt>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {run.ids.map((id) => (
                      <Emoji key={id} size={28}>
                        {levelById(id)?.sol[0] ?? '❓'}
                      </Emoji>
                    ))}
                  </View>
                  <Txt size={14} color={p.muted} center>
                    {t('challenge_guess')}
                  </Txt>
                </View>
                <View style={{ padding: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt size={13} weight="bold" color={p.muted}>
                    {t('to_beat')}
                  </Txt>
                  <Txt size={20} weight="heavy">
                    {fmt(run.score)}
                  </Txt>
                </View>
              </Card>
              <Btn label={t('send_challenge')} icon={<ShareIcon color={p.onAction} />} onPress={send} />
            </>
          ) : (
            <Card style={{ padding: 18, alignItems: 'center', gap: 10 }}>
              <Emoji size={36}>⚔️</Emoji>
              <Txt size={15} color={p.muted} center>
                {t('no_run')}
              </Txt>
            </Card>
          )}
        </View>

        <Section>{t('received')}</Section>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {s.received.length === 0 && (
            <Txt size={14} color={p.muted} style={{ marginHorizontal: 4 }}>
              {t('no_received')}
            </Txt>
          )}
          {s.received.map((r) => (
            <Tap key={r.ids.join()} onPress={() => playChallenge(r.ids, r.score, r.name)} label={`${r.name} ${r.score}`} style={{ padding: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.lilacTint, alignItems: 'center', justifyContent: 'center' }}>
                <Emoji size={20}>🦊</Emoji>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={15} weight="heavy">
                  {r.name}
                </Txt>
                <Txt size={13} color={p.muted}>
                  {t('challenge_levels', { n: r.ids.length }).toLowerCase()} · {fmt(r.score)} pts
                </Txt>
              </View>
              <View style={{ height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: p.ink, justifyContent: 'center' }}>
                <Txt size={13} weight="heavy" color={p.bg}>
                  {t('play').toUpperCase()}
                </Txt>
              </View>
            </Tap>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
