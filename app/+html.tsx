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
        {/* apple-touch-icon.png = 180x180, taille recommandée pour iPhone/iPad */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-startup-image" href="/splash-icon.png" />

        {/* ── SEO / Open Graph ─────────────────────────────────────────── */}
        <meta name="description" content="Votre compagnon spirituel — Prières, Livres et Formations" />
        <meta property="og:title" content="Oracle Plus" />
        <meta property="og:description" content="Votre compagnon spirituel — Prières, Livres et Formations" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Oracle Plus" />
        <meta name="twitter:description" content="Votre compagnon spirituel — Prières, Livres et Formations" />
        <meta name="twitter:image" content="/og-image.png" />

        {/* ── Icône navigateur (favicon dans public/) ──────────────────── */}
        <link rel="icon" type="image/png" href="/favicon.png" />

        {/* Google Identity Services chargé dynamiquement dans LoginModal uniquement */}

        {/* ── Plein écran PWA + safe areas ─────────────────────────────── */}
        {/* Empêche l'espace blanc en bas quand l'app est installée en PWA     */}
        <style dangerouslySetInnerHTML={{ __html: `
          html {
            height: 100%;
            height: 100dvh;
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #1A1A3E;
          }
          body {
            height: 100%;
            height: 100dvh;
            margin: 0;
            padding: 0;
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #1A1A3E;
          }
          #root {
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          /* Désactive le pull-to-refresh natif sur Android PWA */
          body { touch-action: pan-x pan-y; }
          @media print {
            body { display: none !important; }
          }
        ` }} />

        {/* ── Expo Router reset styles ─────────────────────────────────── */}
        <ScrollViewStyleReset />

        {/* Service Worker désactivé temporairement — évite les problèmes de cache */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(r) { r.unregister(); });
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
