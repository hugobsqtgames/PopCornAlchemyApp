import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { Card, Header, Screen, Txt } from '@/components/ui';
import { useLayout, useT } from '@/hooks/use-app';

export default function Texte() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const t = useT();
  const { insets } = useLayout();
  const legal = doc === 'legal';
  return (
    <Screen>
      <Header title={legal ? t('legal') : t('privacy')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <Card style={{ padding: 18 }}>
          <Txt size={15} style={{ lineHeight: 22 }}>
            {legal ? t('legal_text') : t('privacy_text')}
          </Txt>
        </Card>
      </ScrollView>
    </Screen>
  );
}
