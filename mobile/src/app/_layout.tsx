import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/rubik';
import { Stack, usePathname } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';

import { SimulatedAd, Toasts } from '@/components/overlays';
import { useLayout, usePalette } from '@/hooks/use-app';
import { initSounds } from '@/services/feedback';
import { setTrack, suspendMusic } from '@/services/music';
import { scheduleReminders } from '@/services/reminder';
import { useProfile } from '@/store/profile';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** True once the saved profile is loaded; never waits more than 3 s (the app then starts fresh). */
function useHydrated() {
  const [done, setDone] = useState(useProfile.persist.hasHydrated());
  useEffect(() => {
    const unsub = useProfile.persist.onFinishHydration(() => setDone(true));
    const timer = setTimeout(() => setDone(true), 3000);
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);
  return done;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_800ExtraBold,
    PressStart2P_400Regular,
  });
  const hydrated = useHydrated();
  const p = usePalette();
  const { tablet } = useLayout();
  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    initSounds();
    const sub = AppState.addEventListener('change', (st) => suspendMusic(st !== 'active'));
    return () => sub.remove();
  }, []);

  // Calm loop in the menus, faster one during a game.
  const pathname = usePathname();
  useEffect(() => {
    if (ready) setTrack(pathname.startsWith('/jeu') ? 'game' : 'menu');
  }, [pathname, ready]);

  // Phones stay in portrait; iPads can rotate.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const lock = tablet ? ScreenOrientation.OrientationLock.DEFAULT : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    ScreenOrientation.lockAsync(lock).catch(() => {});
  }, [tablet]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Keep the next evenings' reminders up to date (language, daily already done…).
  useEffect(() => {
    if (!ready) return;
    scheduleReminders();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && scheduleReminders());
    return () => sub.remove();
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: p.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar style={p.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="jeu" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="langue" options={{ gestureEnabled: false }} />
      </Stack>
      <Toasts />
      <SimulatedAd />
    </View>
  );
}
