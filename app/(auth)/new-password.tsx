import { Redirect } from 'expo-router';

// Écran supprimé — l'authentification se fait par magic link email
export default function NewPasswordScreen() {
  return <Redirect href="/(auth)/login" />;
}
