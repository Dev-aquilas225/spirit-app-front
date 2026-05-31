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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
        <meta name="description" content="Oracle Plus : votre application de voyance en ligne et de prière, de suivi et d'interprétation des rêves. Cliquez sur ce lien pour découvrir et bénéficier d'une voyance ou prophétie maintenant en 3 min." />
        <meta property="og:title" content="Oracle Plus : voyance en ligne, prière et interprétation des rêves" />
        <meta property="og:description" content="Oracle Plus : votre application de voyance en ligne et de prière, de suivi et d'interprétation des rêves. Cliquez sur ce lien pour découvrir et bénéficier d'une voyance ou prophétie maintenant en 3 min." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Oracle Plus : voyance en ligne, prière et interprétation des rêves" />
        <meta name="twitter:description" content="Oracle Plus : votre application de voyance en ligne et de prière, de suivi et d'interprétation des rêves. Cliquez pour bénéficier d'une voyance ou prophétie maintenant en 3 min." />
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

        {/* ── Facebook Pixel ────────────────────────────────────────────── */}
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','136534062330794');
          fbq('track','PageView');
        ` }} />
        <noscript dangerouslySetInnerHTML={{ __html:
          `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=136534062330794&ev=PageView&noscript=1"/>` }} />

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
            /* Safe areas gérées par useSafeAreaInsets dans React Native */
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

                  // Recharger une seule fois quand le SW prend le contrôle
                  var refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (refreshing) return;
                    refreshing = true;
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
