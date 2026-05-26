import { Redirect } from 'expo-router';

// La page racine redirige vers /home.
// Le splash est géré dans home/index.tsx en overlay — évite la navigation inter-pages statiques.
export default function Index() {
  return <Redirect href="/home" />;
}
