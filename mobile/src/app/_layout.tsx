import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/rubik';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { SimulatedAd, Toasts } from '@/components/overlays';
import { useLayout, usePalette } from '@/hooks/use-app';
import { initSounds } from '@/services/feedback';
import { useProfile } from '@/store/profile';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useHydrated() {
  const [done, setDone] = useState(useProfile.persist.hasHydrated());
  useEffect(() => useProfile.persist.onFinishHydration(() => setDone(true)), []);
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
  }, []);

  // Phones stay in portrait; iPads can rotate.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const lock = tablet ? ScreenOrientation.OrientationLock.DEFAULT : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    ScreenOrientation.lockAsync(lock).catch(() => {});
  }, [tablet]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
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
