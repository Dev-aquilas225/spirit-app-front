import { Redirect } from 'expo-router';

// La création de compte est désormais unifiée avec la connexion :
// numéro de téléphone → code PIN (création automatique si nouveau numéro)
export default function RegisterScreen() {
  return <Redirect href="/(auth)/login" />;
}
