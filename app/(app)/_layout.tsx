import React from 'react';
import { Stack } from 'expo-router';
import { AuthGuard } from '../../src/components/auth/AuthGuard';

/**
 * App Layout — Toutes les routes sous (app) sont protégées par AuthGuard.
 */
export default function AppLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="consultation/index" />
        <Stack.Screen name="consultation/form" />
        <Stack.Screen name="consultation/my-consultations" />
        <Stack.Screen name="formations/index" />
        <Stack.Screen name="formations/[id]" />
        <Stack.Screen name="formations/reader/[id]" />
        <Stack.Screen name="dreams/index" />
        <Stack.Screen name="prayer-program/index" />
        <Stack.Screen name="subscription/index" />
        <Stack.Screen name="subscription/payment" />
        <Stack.Screen name="subscription/success" />
        <Stack.Screen name="subscription/failure" />
        <Stack.Screen name="subscription/history" />
        <Stack.Screen name="subscription/manage" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="referral/index" />
        <Stack.Screen name="support/index" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/privacy" />
      </Stack>
    </AuthGuard>
  );
}
