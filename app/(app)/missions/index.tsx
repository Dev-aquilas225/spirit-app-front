import { useEffect } from 'react';
import { router } from 'expo-router';
// Missions intégrées dans la home — rediriger
export default function MissionsScreen() {
  useEffect(() => { router.replace('/home'); }, []);
  return null;
}
