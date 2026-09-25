import { router, useIsFocused } from 'expo-router';
import { Modal, Pressable, Switch, View } from 'react-native';

import type { Run } from '@/hooks/use-run';
import { fmt, useLayout, usePalette, useT } from '@/hooks/use-app';
import { play } from '@/services/feedback';
import { useProfile } from '@/store/profile';

import { ChevronIcon, PlayIcon } from '../icons';
import { Btn, Emoji, Px, Txt } from '../ui';

export function PauseSheet({ run }: { run: Run }) {
  const p = usePalette();
  const t = useT();
  const { insets } = useLayout();
  const sound = useProfile((s) => s.sound);
  const haptics = useProfile((s) => s.haptics);
  const music = useProfile((s) => s.music);
  const set = useProfile((s) => s.set);
  // Hidden while another screen (rules, challenge) is on top, shown again on return.
  const focused = useIsFocused();
  const resume = () => run.setPaused(false);
  const toggle = (key: 'sound' | 'music' | 'haptics', v: boolean) => {
    set({ [key]: v });
    play('toggle');
  };

  const row = (icon: string, label: string, right: React.ReactNode, onPress?: () => void, first?: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        height: 50,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderTopWidth: first ? 0 : 1,
        borderColor: p.line,
      }}>
      <Emoji size={18}>{icon}</Emoji>
      <Txt size={16} style={{ flex: 1 }}>
        {label}
      </Txt>
      {right}
    </Pressable>
  );

  return (
    <Modal visible={run.paused && run.phase === 'play' && focused} transparent animationType="slide" onRequestClose={resume}>
      <View style={{ flex: 1, backgroundColor: '#1F1B2D' }}>
        <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }} onPress={resume} accessibilityLabel={t('resume')}>
          <Px size={22} color="#FFFFFF">
            {t('pause')}
          </Px>
          <Txt size={14} weight="semibold" color="#D8D2E6">
            {t('pause_sub', { n: run.index + 1, s: fmt(run.score) })}
          </Txt>
        </Pressable>
        <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: p.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 16, paddingTop: 10, paddingBottom: insets.bottom + 16, gap: 12 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: p.line2, alignSelf: 'center', marginBottom: 4 }} />
          <Btn label={t('resume')} icon={<PlayIcon color={p.onAction} />} onPress={resume} />
          <View style={{ borderRadius: 18, backgroundColor: p.surface, borderWidth: p.border, borderColor: p.line, overflow: 'hidden' }}>
            {row('🔊', t('sounds'), <Switch value={sound} onValueChange={(v) => toggle('sound', v)} trackColor={{ true: p.green }} />, undefined, true)}
            {row('🎵', t('music'), <Switch value={music} onValueChange={(v) => toggle('music', v)} trackColor={{ true: p.green }} />)}
            {row('📳', t('haptics'), <Switch value={haptics} onValueChange={(v) => toggle('haptics', v)} trackColor={{ true: p.green }} />)}
            {row('📖', t('rules'), <ChevronIcon color={p.line2} />, () => router.push('/tutoriel'))}
            {row('⚔️', t('challenge_friend'), <ChevronIcon color={p.line2} />, () => router.push('/defier'))}
          </View>
          <Btn variant="soft" label={t('quit')} height={50} size={14} onPress={() => router.dismissTo('/')} />
        </View>
      </View>
    </Modal>
  );
}
