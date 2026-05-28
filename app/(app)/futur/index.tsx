import { Redirect } from 'expo-router';

/** /futur → onglet Voyance (chat direct, sans flash) */
export default function FuturRedirect() {
  return <Redirect href="/(app)/(tabs)/ai" />;
}
