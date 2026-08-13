# Video preview Play Store + eliminare panou SEO

## 1. Video preview 30 secunde

Un clip de 30s (30fps, 900 frame-uri), realizat cu Remotion (motion graphics în cod), randat ca MP4 în `/mnt/documents/`.

- Format: 1920x1080 (16:9) — formatul recomandat de Google Play pentru videoclipul promoțional, care se încarcă pe YouTube și se leagă în listing.
- Stil vizual: navy (#00264d) + accent, identic cu screenshot-urile și feature graphic-ul deja generate, deci listing-ul arată unitar.
- Fără sunet (Play acceptă; evită probleme de licențiere muzicală).
- Text on-screen bilingv: fiecare scenă are titlu RO mare + linie EN mai mică, deci un singur video acoperă ambele piețe.

Storyboard (6 scene, ritm variat):

```text
0-4s    Logo + tagline            "Controlează-ți banii" / "Take control of your money"
4-9s    Dashboard + sold, carduri Venit/Cheltuieli/Balanță animate
9-14s   Adăugare tranzacție rapidă + scanare bon cu AI
14-19s  Bugete pe categorii, bară care se umple, alertă 80%
19-24s  Grafice & rapoarte PDF, evoluție sold
24-30s  Securitate (biometrie), 9 limbi, CTA final "Descarcă acum"
```

Mockup-ul de telefon și ecranele din interior sunt recreate ca UI animat în cod (nu capturi statice), ca să existe mișcare reală în fiecare scenă.

## 2. Eliminare panou SEO / Search Console din aplicație

Se scot complet din interfață starea SEO, verificarea site-ului, erorile și avertizările:

- Șterg componenta `src/components/SEOStatus.tsx` (status verificare, sitemap-uri, erori/avertizări, istoric, export CSV/PDF, auto-refresh).
- Scot importul și randarea `<SEOStatus />` din secțiunea Setări în `src/pages/Index.tsx`.
- Șterg edge function-ul `supabase/functions/seo-status/` (nu mai are consumator) și intrarea lui din `supabase/config.toml`.

Rămân neatinse (nu sunt UI și ajută la indexare): `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, hook-ul `useSEO`, meta tag-urile din `index.html` — inclusiv `google-site-verification`, care trebuie păstrat ca să nu pierzi proprietatea site-ului în Search Console. Spune-mi dacă vrei scos și acel tag.

## Detalii tehnice

- Remotion instalat în `remotion/` (versionat în proiect, ca să poți re-randa/ajusta ulterior): `src/Root.tsx`, `src/MainVideo.tsx`, `src/scenes/*.tsx`, plus `scripts/render-remotion.mjs`.
- Animație exclusiv frame-based (`useCurrentFrame`, `interpolate`, `spring`), scene legate cu `TransitionSeries`.
- Fonturi via `@remotion/google-fonts`; paletă preluată din tokenii aplicației.
- Randare headless: `node scripts/render-remotion.mjs` → `/mnt/documents/cashflow-buddy-preview.mp4`.
- Verificare pe cadre cheie cu `remotion still` înainte de randarea finală.