import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useI18n } from '../src/i18n';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  const { language } = useI18n();
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{language === 'en' ? 'This is a modal' : 'Ceci est une fenêtre modale'}</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">{language === 'en' ? 'Go to home screen' : "Aller à l'écran d'accueil"}</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
