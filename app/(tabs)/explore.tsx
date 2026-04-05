import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useI18n } from '../../src/i18n';

export default function TabTwoScreen() {
  const { language } = useI18n();
  const isEnglish = language === 'en';
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          {isEnglish ? 'Explore' : 'Explorer'}
        </ThemedText>
      </ThemedView>
      <ThemedText>{isEnglish ? 'This app includes example code to help you get started.' : 'Cette application inclut du code exemple pour vous aider à démarrer.'}</ThemedText>
      <Collapsible title={isEnglish ? 'File-based routing' : 'Routage basé sur les fichiers'}>
        <ThemedText>
          {isEnglish ? 'This app has two screens: ' : 'Cette application contient deux écrans : '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>
          {isEnglish ? ' and ' : ' et '}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          {isEnglish ? 'The layout file in ' : 'Le fichier de layout dans '}
          <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>
          {isEnglish ? ' sets up the tab navigator.' : ' configure le navigateur à onglets.'}
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">{isEnglish ? 'Learn more' : 'En savoir plus'}</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title={isEnglish ? 'Android, iOS, and web support' : 'Prise en charge Android, iOS et web'}>
        <ThemedText>
          {isEnglish ? 'You can open this project on Android, iOS, and the web. To open the web version, press ' : 'Vous pouvez ouvrir ce projet sur Android, iOS et le web. Pour ouvrir la version web, appuyez sur '}
          <ThemedText type="defaultSemiBold">w</ThemedText>
          {isEnglish ? ' in the terminal running this project.' : ' dans le terminal qui exécute ce projet.'}
        </ThemedText>
      </Collapsible>
      <Collapsible title={isEnglish ? 'Images' : 'Images'}>
        <ThemedText>
          {isEnglish ? 'For static images, you can use the ' : 'Pour les images statiques, vous pouvez utiliser les suffixes '}
          <ThemedText type="defaultSemiBold">@2x</ThemedText>
          {isEnglish ? ' and ' : ' et '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText>
          {isEnglish ? ' suffixes to provide files for different screen densities' : ' pour fournir des fichiers adaptés aux différentes densités d’écran'}
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">{isEnglish ? 'Learn more' : 'En savoir plus'}</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title={isEnglish ? 'Light and dark mode components' : 'Composants mode clair et sombre'}>
        <ThemedText>
          {isEnglish ? 'This template has light and dark mode support. The ' : 'Ce modèle gère les modes clair et sombre. Le hook '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText>
          {isEnglish ? ' hook lets you inspect the user’s current color scheme so you can adjust UI colors accordingly.' : ' vous permet de connaître le thème actif de l’utilisateur afin d’adapter les couleurs de l’interface.'}
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">{isEnglish ? 'Learn more' : 'En savoir plus'}</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title={isEnglish ? 'Animations' : 'Animations'}>
        <ThemedText>
          {isEnglish ? 'This template includes an example of an animated component. The ' : 'Ce modèle inclut un exemple de composant animé. Le composant '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText>
          {isEnglish ? ' component uses the powerful ' : ' utilise la puissante bibliothèque '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>
          {isEnglish ? ' library to create a waving hand animation.' : ' pour créer une animation de main qui fait signe.'}
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              {isEnglish ? 'The ' : 'Le composant '}
              <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>
              {isEnglish ? ' component provides a parallax effect for the header image.' : ' fournit un effet de parallaxe pour l’image d’en-tête.'}
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
