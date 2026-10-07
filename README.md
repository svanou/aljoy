# AIflow

Service premium par abonnement pour l’IA, l’automatisation et les petits outils. Application Next.js App Router / TypeScript strict, composants de base shadcn/ui, Tailwind CSS, Supabase et Stripe. Le repository initial était vide.

## État et limites de validation

Le code inclut landing, auth, dashboard, queue, admin, fichiers privés, livrables, révisions et facturation. Les intégrations externes nécessitent vos comptes et les variables ci-dessous. Le mode démo n’utilise aucun backend et ne facture rien. **Ne pas ouvrir les ventes avant d’avoir exécuté les vérifications Supabase et Stripe de cette documentation.** Les tests de logique de queue peuvent fonctionner sans dépendances avec Node 24. Le fichier `VALIDATION.md` consigne les vérifications réellement exécutées.

## Installation locale

Prérequis : Node.js 22.13+ (Node 24 recommandé), npm, compte Supabase et compte Stripe.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir http://localhost:3000. Démo client : `/dashboard?demo=1`. Démo opérateur : `/admin?demo=1`. Les actions démo sont enregistrées dans localStorage et partagées entre ces deux vues dans le même navigateur. Pour réinitialiser, effacer les entrées `aiflow-demo` et `aiflow-comments-*`. Le mode démo ne présente que des données fictives ; le paramètre `demo=1` ne donne aucun accès aux données réelles ou aux privilèges admin.

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Pour Playwright, définir `CHROMIUM_PATH` vers un Chromium installé. La configuration utilise `/usr/bin/chromium` dans cet environnement. Les tests de checkout sans credentials attendent une réponse de configuration manquante. Exécuter ces tests avec les intégrations non configurées.

## Configuration du produit

- `config/site.ts` : marque, domaine, email, tagline, titre et sous-titre hero, promesse de délai, lien de call, futurs logos et témoignages. Le lien de call est provisoirement un email : remplacer `callUrl` par votre calendrier réel.
- `config/pricing.ts` : noms, montants, devise et capacité. Les montants affichés doivent correspondre aux Price IDs Stripe.
- `config/services.ts` : services, exemples et FAQ.

Aucun faux client ni faux témoignage n’est utilisé. Les noms d’outils de la landing indiquent les technologies, sans suggérer qu’elles sont clientes.

## Supabase

1. Créer un projet Supabase.
2. Copier Project URL et la clé publique anon dans `.env.local`. Copier la clé service role dans `SUPABASE_SERVICE_ROLE_KEY` : serveur uniquement, jamais avec le préfixe `NEXT_PUBLIC_`.
3. Exécuter `supabase/migrations/001_initial.sql` une fois dans le SQL Editor, dans un projet neuf. Avec la CLI Supabase : `supabase login`, `supabase link --project-ref VOTRE_REF`, puis `supabase db push`.
4. Dans Authentication → URL Configuration, définir Site URL : `http://localhost:3000` en local, puis votre domaine HTTPS en production. Autoriser `http://localhost:3000/auth/callback` et `https://VOTRE_DOMAINE/auth/callback` comme redirect URLs. Pour le reset, autoriser aussi la variante avec `?next=/update-password` ou un motif de callback contrôlé correspondant.
5. Activer email/password et la confirmation d’email. Configurer votre SMTP pour la production. Les emails de confirmation et de reset sont envoyés par Supabase.
6. Le trigger de signup crée un profil, un workspace et un abonnement inactif. Le webhook Stripe l’active après paiement. L’espace est préparé avant paiement, mais aucune demande ne peut être créée sans abonnement actif.
7. Le bucket privé `request-files` est créé par la migration. Taille maximale : 10 MB. Les liens de téléchargement expirent après 60 secondes. Les utilisateurs ne peuvent lire ou uploader que sous les IDs des demandes auxquelles ils ont accès.

Les tables comprennent `profiles`, `workspaces`, `subscriptions`, `requests`, `request_comments`, `request_files`, `deliverables`, `request_events` et `stripe_events`. RLS protège les données ; les clients ne peuvent pas modifier leur rôle, leur abonnement ou les statuts directement. Les mutations de queue passent par des RPC avec verrou du workspace. Le réordonnancement vérifie que la liste contient exactement les demandes queued actuelles ; en cas de concurrence, le client doit rafraîchir et réessayer.

### Premier admin

Créer et confirmer un compte normalement. Dans le SQL Editor avec les droits propriétaire :

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'VOTRE_EMAIL');
```

Ne jamais ajouter une commande de promotion admin dans l’interface client. Se connecter avec ce compte puis ouvrir `/admin`.

### Vérification réelle de RLS

Sur un projet Supabase **de test** migré, via une connexion PostgreSQL autorisée :

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/rls.sql
```

Le test ouvre une transaction, crée deux clients et un admin, vérifie la séparation des données, l’absence d’escalade de rôle, l’avancement de queue et l’interdiction de création après expiration, puis fait rollback. Vérifier également le storage avec deux sessions Supabase : le client B ne doit pas pouvoir télécharger un fichier du client A, même avec son chemin exact. Ne pas utiliser la service role pour tester RLS : elle contourne volontairement les politiques.

## Stripe

1. Commencer en mode test. Créer deux produits/prix récurrents mensuels EUR : `AI Team` à 2990 EUR et `AI Team ×2` à 4990 EUR.
2. Renseigner les Price IDs (`price_…`) dans `STRIPE_STANDARD_PRICE_ID` et `STRIPE_DOUBLE_PRICE_ID`, ainsi que les clés secret et publique.
3. Activer le Customer Portal : historique et annulation à la fin de période. Garder le changement de plan désactivé au lancement ; administrer les upgrades manuellement pour préserver les engagements de demandes actives.
4. Le checkout exige un compte connecté pour lier le paiement à un workspace vérifié. Le parcours est donc landing → pricing → compte → pricing/checkout → dashboard. Depuis le dashboard inactif, le lien “Start a subscription” permet de finaliser l’abonnement.
5. Le webhook, et non la page de succès, active les droits. Quelques secondes peuvent être nécessaires ; rafraîchir le dashboard si le webhook est encore en cours.

### Webhook local

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copier le secret `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET`, puis redémarrer Next.js. Les clés CLI et application doivent être celles du même compte/mode Stripe.

En production, créer un endpoint `https://VOTRE_DOMAINE/api/stripe/webhook` écoutant `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Utiliser son propre secret de signature, distinct du secret CLI.

Le handler vérifie la signature sur le corps brut, récupère l’état courant de l’abonnement Stripe pour éviter de faire confiance à un payload ancien, vérifie le customer du workspace et conserve les IDs des événements traités. Une erreur de traitement renvoie 500 pour permettre la relivraison. Les prix inconnus sont rejetés. Un ancien abonnement annulé ne peut pas écraser un nouvel abonnement actif.

### Annulation et pause

L’annulation programmée laisse `status=active` jusqu’à la fin de la période. Toute nouvelle demande ou révision exige aussi `current_period_end > now()` en base. Après expiration, les anciens fichiers, commentaires et livrables restent consultables.

La pause automatique n’est pas implémentée. Texte produit : **“Contact us to pause your subscription.”** L’opérateur confirme les dates et traite la facturation dans Stripe. `workspaces.auto_advance` permet aussi de suspendre l’avancement automatique du travail, indépendamment de la facturation.

## Exécution du service

Client : créer la demande → elle arrive en fin de queue → réordonner avec drag & drop ou flèches (mobile/clavier). Une demande queued peut être modifiée ou supprimée. Les conversations et fichiers restent accessibles sur la page de demande.

Admin : `/admin` → sélectionner un client ou toutes les demandes actives → ouvrir une demande → passer en In Progress → ajouter un lien ou fichier livrable → passer en Completed. Si l’avancement automatique est activé, la demande queued suivante passe en In Progress sans dépasser la capacité du plan. “Start next queued” déclenche manuellement l’avancement. Les projets importants se découpent en demandes/milestones. Une révision remet la demande en tête de queue ; elle ne déplace pas une demande déjà en cours.

## Analytics et emails

PostHog est facultatif : configurer `NEXT_PUBLIC_POSTHOG_KEY` et `NEXT_PUBLIC_POSTHOG_HOST`. L’API capture reçoit `landing_view`, `pricing_view`, `checkout_started`, `subscription_created`, `request_created`, `request_completed`. Les pannes d’analytics ne bloquent pas les mutations. Prévoir une politique de confidentialité adaptée à votre marché avant activation.

`lib/emails.ts` fournit les événements Welcome, New request received, Request started, Request completed, New comment, Subscription cancelled. Renseigner `RESEND_API_KEY` et `EMAIL_FROM` avec un domaine vérifié pour activer l’envoi. Sans configuration, l’abstraction ne bloque rien. Les démarrages automatiques sont visibles dans l’historique ; la notification email “Request started” est actuellement envoyée uniquement au démarrage manuel de statut. Pour le MVP, l’espace reste la source de vérité. Les emails ne contiennent pas le texte des commentaires ou les données sensibles du brief.

## Déploiement Vercel

1. Pousser ce dossier dans votre repository Git.
2. Importer `svanou/aljoy` dans Vercel, framework Next.js, branche `main`. Le code est à la racine : laisser Root Directory à `.`. Utiliser Node.js 24, `npm ci`, `npm run build` et le répertoire de sortie par défaut.

   Sans credentials, l’accueil et les démos `/dashboard?demo=1` et `/admin?demo=1` fonctionnent ; l’authentification et les paiements réels restent désactivés. Après attribution du domaine Vercel, définir `NEXT_PUBLIC_APP_URL` sur cette URL HTTPS puis redéployer pour mettre à jour les liens et métadonnées.
3. Renseigner les variables de `.env.example`. `NEXT_PUBLIC_APP_URL` doit être le domaine HTTPS canonique, sans slash final. Les secrets serveur ne doivent jamais avoir le préfixe `NEXT_PUBLIC_`.
4. Appliquer la migration au projet Supabase de production ; configurer Auth et Storage comme ci-dessus.
5. Remplacer les clés Stripe test par live et renseigner les deux Price IDs live. Créer le webhook live et son secret.
6. Exécuter `npm run build`, puis déployer. Ne pas utiliser des clés live sur des previews publics.
7. Créer le premier admin, effectuer le parcours critique en mode test avant ouverture, et contrôler les événements dans Stripe ainsi que les logs Vercel.

## Parcours avant ouverture des ventes

- Landing → pricing → compte → checkout test avec carte `4242 4242 4242 4242` → webhook → dashboard actif.
- Signup → confirmation → login → logout → reset password → nouveau login.
- Client A crée, joint un fichier, réordonne, modifie et supprime une demande queued.
- Admin démarre, commente, ajoute un livrable, complète ; vérifier qu’une seule demande suivante commence (deux avec le plan supérieur).
- Client approuve et demande une révision ; vérifier que la révision est queued et que la limite reste respectée.
- Client B ne peut lire ou écrire les demandes, commentaires, fichiers, abonnements ou livrables de A (requêtes directes avec son JWT, pas seulement navigation).
- Annuler à fin de période ; vérifier l’accès historique et l’interdiction de création après expiration.
- Tester le rendu mobile 390 px, les champs, le dialog clavier, les boutons de réordonnancement et le portail Stripe.

## Architecture volontairement limitée

Une app, un opérateur, un propriétaire par workspace. Pas de marketplace, gestion d’équipe, credits ou facturation custom. Les intégrations serveur restent dans `lib/`, les mutations dans les Server Actions et la facturation dans les Route Handlers. Le mode démo est explicitement isolé des actions serveur réelles.
