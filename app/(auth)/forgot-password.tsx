import { Redirect } from 'expo-router';

// Écran supprimé — l'authentification se fait par magic link email (sans mot de passe)
export default function ForgotPasswordScreen() {
  return <Redirect href="/(auth)/login" />;
}
