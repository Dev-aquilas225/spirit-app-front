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
        <meta name="msapplication-TileColor" content="#0B1628" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />

        {/* ── Android Chrome PWA ───────────────────────────────────────── */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* ── Apple PWA (iOS Safari) ───────────────────────────────────── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Oracle Plus" />
        {/* Icône principale iOS — 180x180 obligatoire */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        {/* Splash screens iOS par taille d'écran */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/splash-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/splash-icon.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/splash-icon.png" />
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

        {/* Variables d'environnement runtime — injectées avant le bundle JS */}
        <script src="/env-config.js" />

        {/* Capturer beforeinstallprompt AVANT que React monte — évite de le rater */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__pwaInstallPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__pwaInstallPrompt = e;
          });
        ` }} />

        {/* Google Identity Services chargé dynamiquement dans LoginModal uniquement */}

        {/* ── Plein écran PWA + safe areas iOS ─────────────────────────── */}
        <style dangerouslySetInnerHTML={{ __html: `
          html {
            height: 100%;
            height: -webkit-fill-available;
            height: 100dvh;
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #0B1628;
            -webkit-text-size-adjust: 100%;
          }
          body {
            height: 100%;
            height: -webkit-fill-available;
            height: 100dvh;
            margin: 0;
            padding: 0;
            overflow: hidden;
            overscroll-behavior: none;
            background-color: #0B1628;
            /* Safe areas iOS (notch, home indicator) */
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          #root {
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          /* Désactive le pull-to-refresh natif sur Android PWA */
          body { touch-action: pan-x pan-y; }
          /* Désactive le tap highlight bleu sur iOS */
          * { -webkit-tap-highlight-color: transparent; }
          @media print { body { display: none !important; } }
        ` }} />

        {/* ── Expo Router reset styles ─────────────────────────────────── */}
        <ScrollViewStyleReset />

        {/* Service Worker — requis pour l'installation PWA et les notifications push */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[SW] Enregistré:', reg.scope);
                      // Écouter les mises à jour
                      reg.addEventListener('updatefound', function() {
                        var newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                          });
                        }
                      });
                    })
                    .catch(function(err) { console.warn('[SW] Erreur:', err); });

                  // Recharger la page quand le SW prend le contrôle
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    window.location.reload();
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
