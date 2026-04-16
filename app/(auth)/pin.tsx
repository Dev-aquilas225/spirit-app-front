import { Redirect } from 'expo-router';

// Écran PIN supprimé — l'authentification se fait désormais par magic link email
export default function PinScreen() {
  return <Redirect href="/(auth)/login" />;
}
