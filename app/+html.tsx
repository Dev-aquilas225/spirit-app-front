import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

/**
 * HTML Shell — Expo Router v4 (SDK 55)
 * Ce fichier est utilisé UNIQUEMENT pour les builds web (static output).
 * Il injecte les meta tags PWA, le manifest et démarre le Service Worker.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* ── PWA Manifest ─────────────────────────────────────────────── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── Theme & couleurs ─────────────────────────────────────────── */}
        <meta name="theme-color" content="#C9A84C" />
        <meta name="msapplication-TileColor" content="#1A1A3E" />

        {/* ── Apple PWA (iOS Safari) ───────────────────────────────────── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Oracle Plus" />
        {/* Icônes dans public/ — servis à la racine, pas via Metro asset pipeline */}
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-startup-image" href="/splash-icon.png" />

        {/* ── SEO / Open Graph ─────────────────────────────────────────── */}
        <meta name="description" content="Votre compagnon spirituel — Prières, IA, Livres et Formations" />
        <meta property="og:title" content="Oracle Plus" />
        <meta property="og:description" content="Votre compagnon spirituel — Prières, IA, Livres et Formations" />
        <meta property="og:image" content="/icon.png" />
        <meta property="og:type" content="website" />

        {/* ── Icône navigateur (favicon dans public/) ──────────────────── */}
        <link rel="icon" type="image/png" href="/favicon.png" />

        {/* ── Protection capture d'écran (web) ─────────────────────────── */}
        {/* Désactive PrintScreen / impression sur les pages de contenu premium */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { display: none !important; }
          }
        ` }} />

        {/* ── Expo Router reset styles ─────────────────────────────────── */}
        <ScrollViewStyleReset />

        {/* ── Enregistrement du Service Worker + mise à jour automatique ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(function(reg) {
                      console.log('[SW] Enregistré :', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[SW] Échec :', err);
                    });

                  // Écouter le message SW_UPDATED envoyé par le nouveau Service Worker
                  // Quand un nouveau déploiement est détecté, recharger la page automatiquement
                  navigator.serviceWorker.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'SW_UPDATED') {
                      console.log('[SW] Nouvelle version détectée — rechargement...');
                      window.location.reload();
                    }
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
