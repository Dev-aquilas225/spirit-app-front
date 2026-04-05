import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { useI18n } from '../../src/i18n';

export default function HomeScreen() {
  const { language } = useI18n();
  const isEnglish = language === 'en';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{isEnglish ? 'Welcome!' : 'Bienvenue !'}</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">{isEnglish ? 'Step 1: Try it' : 'Étape 1 : Essayez'}</ThemedText>
        <ThemedText>
          {isEnglish ? 'Edit ' : 'Modifiez '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>
          {isEnglish ? ' to see changes. Press ' : ' pour voir les changements. Appuyez sur '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>
          {isEnglish ? ' to open developer tools.' : ' pour ouvrir les outils de développement.'}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">{isEnglish ? 'Step 2: Explore' : 'Étape 2 : Explorer'}</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title={isEnglish ? 'Action' : 'Action'} icon="cube" onPress={() => alert(isEnglish ? 'Action pressed' : 'Action déclenchée')} />
            <Link.MenuAction
              title={isEnglish ? 'Share' : 'Partager'}
              icon="square.and.arrow.up"
              onPress={() => alert(isEnglish ? 'Share pressed' : 'Partage déclenché')}
            />
            <Link.Menu title={isEnglish ? 'More' : 'Plus'} icon="ellipsis">
              <Link.MenuAction
                title={isEnglish ? 'Delete' : 'Supprimer'}
                icon="trash"
                destructive
                onPress={() => alert(isEnglish ? 'Delete pressed' : 'Suppression déclenchée')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {isEnglish
            ? `Tap the Explore tab to learn more about what's included in this starter app.`
            : `Touchez l’onglet Explorer pour en savoir plus sur ce qui est inclus dans cette application de démarrage.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">{isEnglish ? 'Step 3: Get a fresh start' : 'Étape 3 : Repartir sur une base saine'}</ThemedText>
        <ThemedText>
          {isEnglish ? `When you're ready, run ` : `Quand vous êtes prêt, lancez `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>
          {isEnglish ? ` to recreate a fresh ` : ` pour recréer un dossier `}
          <ThemedText type="defaultSemiBold">app</ThemedText>
          {isEnglish
            ? ` directory. The current one will be moved to `
            : ` neuf. Le dossier actuel sera déplacé vers `}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
