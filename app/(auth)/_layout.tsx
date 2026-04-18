import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'ios',
      animationDuration: 320,
    }}>
      <Stack.Screen name="splash" options={{ animation: 'fade', animationDuration: 400 }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade', animationDuration: 400 }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="new-password" />
      <Stack.Screen name="email-sent" />
      <Stack.Screen name="verify-magic-link" />
      <Stack.Screen name="callback" options={{ animation: 'fade' }} />
      <Stack.Screen name="enable-notifications" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
