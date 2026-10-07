# Validation du MVP — 7 octobre 2026

Vérifications exécutées sans credentials externes, avec Node.js 24.19.0 et Chromium 151 :

- Installation npm réussie ; dépendances enregistrées dans `package-lock.json`.
- `npm run build` : compilation et génération des pages réussies.
- `npm run typecheck` : réussi.
- `npm test` : 5 tests réussis, aucun échec ou test ignoré.
- `npm run start` : serveur de production démarré.
- `npm run test:e2e -- --workers=2` contre ce serveur : 14 tests réussis, aucun échec ou test ignoré. Les cas couvrent l’accueil et le message de facturation non configurée, la création de demandes et les commentaires persistants en démo, ainsi que l’avancement de la queue administrateur, sur ordinateur et mobile. Les parcours français vérifient aussi le changement FR/EN, la persistance du choix, les métadonnées, les valeurs techniques des formulaires et la conservation des textes saisis par les utilisateurs.

Corrections nécessaires : fermeture de l’expression JSX `onSubmit` dans `components/request-form.tsx` et sélection précise de l’alerte de facturation dans le test navigateur pour éviter l’annonceur de navigation Next.js.

## Intégrations non validées

Supabase (authentification, base de données, RLS et stockage), Stripe (checkout, portail et webhooks), Resend et PostHog ne sont pas configurés dans l’environnement de validation. Leurs parcours réels n’ont pas été exécutés. Le mode démo ne nécessite pas ces services et ne réalise aucun paiement.

Ces résultats valident le build et les parcours démo locaux. Ils ne prouvent pas un déploiement public ni une préparation à la vente. Suivre les étapes Supabase et Stripe du README avant activation des intégrations réelles.
