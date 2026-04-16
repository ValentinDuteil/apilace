# Routes — Apilace E-Commerce

> **Version :** 1.0
> **Date :** Avril 2026
> **Auteur :** Valentin

---

## Table des matières

1. [Routes Frontend (React Router)](#1-routes-frontend-react-router)
2. [Routes API Backend (Express)](#2-routes-api-backend-express)
3. [Middlewares](#3-middlewares)
4. [Codes de réponse HTTP](#4-codes-de-réponse-http)

---

## 1. Routes Frontend (React Router)

### Légende

| Symbole | Signification |
|---|---|
| 🌐 | Accessible à tous |
| 🔒 | Requiert d'être connecté (`<ProtectedRoute>`) |
| 🛡️ | Requiert le rôle Admin (`<AdminRoute>`) |

### Pages publiques

| Route | Composant | Description |
|---|---|---|
| `/` | `HomePage` | Accueil — mise en avant de la boutique |
| `/boutique` | `ShopPage` | Catalogue produits avec filtres |
| `/boutique/:slug` | `ProductPage` | Fiche produit détaillée |
| `/panier` | `CartPage` | Récapitulatif du panier |
| `/connexion` | `LoginPage` | Formulaire de connexion + lien inscription |
| `/inscription` | `RegisterPage` | Formulaire de création de compte |
| `/mot-de-passe-oublie` | `ForgotPasswordPage` | Demande de réinitialisation par email |
| `/reinitialisation/:token` | `ResetPasswordPage` | Formulaire de nouveau mot de passe |
| `/mentions-legales` | `LegalPage` | Mentions légales (contenu dynamique Admin) |
| `/cgv` | `LegalPage` | Conditions générales de vente |
| `/confidentialite` | `LegalPage` | Politique de confidentialité |
| `*` | `NotFoundPage` | Page 404 |

> **Note :** Les pages légales existantes du site vitrine (`/pages/mentions-legales`, `/pages/conditions-generales-d-utilisation-et-de-vente`, `/pages/politique-de-protection-des-donnees-personnelles`) restent inchangées sur le site actuel.

### Pages membres 🔒

| Route | Composant | Description |
|---|---|---|
| `/checkout` | `CheckoutPage` | Sélection du point de retrait + récapitulatif |
| `/checkout/success` | `CheckoutSuccessPage` | Confirmation de commande post-paiement Stripe |
| `/mon-compte` | `AccountPage` | Tableau de bord de l'espace client |
| `/mon-compte/commandes` | `OrdersPage` | Historique des commandes |
| `/mon-compte/commandes/:id` | `OrderDetailPage` | Détail d'une commande + actions (annuler, facture) |
| `/mon-compte/parametres` | `AccountSettingsPage` | Modification du profil et du mot de passe |

### Pages Admin 🛡️

| Route | Composant | Description |
|---|---|---|
| `/admin` | `AdminDashboardPage` | Tableau de bord avec indicateurs clés |
| `/admin/produits` | `AdminProductsPage` | Liste des produits avec actions rapides |
| `/admin/produits/nouveau` | `AdminProductFormPage` | Formulaire de création d'un produit |
| `/admin/produits/:id/modifier` | `AdminProductFormPage` | Formulaire de modification d'un produit |
| `/admin/commandes` | `AdminOrdersPage` | Liste de toutes les commandes avec filtres |
| `/admin/commandes/:id` | `AdminOrderDetailPage` | Détail commande + mise à jour statut + remboursement |
| `/admin/magasins` | `AdminStoresPage` | Liste des points de retrait |
| `/admin/magasins/nouveau` | `AdminStoreFormPage` | Formulaire de création d'un point de retrait |
| `/admin/magasins/:id/modifier` | `AdminStoreFormPage` | Formulaire de modification d'un point de retrait |
| `/admin/utilisateurs` | `AdminUsersPage` | Liste des comptes membres |
| `/admin/exports` | `AdminExportsPage` | Génération d'exports comptables (CSV / PDF) |
| `/admin/textes-legaux` | `AdminLegalPage` | Édition des pages légales (CGV, RGPD, Mentions) |

---

## 2. Routes API Backend (Express)

**Base URL :** `/api`

### Légende

| Symbole | Middleware requis |
|---|---|
| 🌐 | Public — aucun middleware |
| 🔒 | `requireAuth` — JWT valide dans le cookie |
| 🛡️ | `requireAuth` + `requireAdmin` — rôle ADMIN requis |
| ⚡ | `stripeWebhook` — signature Stripe vérifiée |

---

### Auth

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/auth/register` | 🌐 | Création de compte (email + mot de passe) |
| `POST` | `/auth/login` | 🌐 | Connexion — renvoie Access Token + Refresh Token en cookies |
| `POST` | `/auth/logout` | 🔒 | Déconnexion — invalide les tokens |
| `POST` | `/auth/refresh` | 🌐 | Renouvelle l'Access Token via le Refresh Token |
| `POST` | `/auth/google` | 🌐 | Authentification via Google OAuth 2.0 |
| `POST` | `/auth/forgot-password` | 🌐 | Envoi d'un email de réinitialisation |
| `POST` | `/auth/reset-password` | 🌐 | Réinitialisation du mot de passe via token |
| `GET` | `/auth/me` | 🔒 | Récupère le profil de l'utilisateur connecté |
| `PATCH` | `/auth/me` | 🔒 | Modifie le profil (prénom, nom) |
| `PATCH` | `/auth/password` | 🔒 | Modifie le mot de passe (requiert l'ancien) |
| `DELETE` | `/auth/me` | 🔒 | Soft delete du compte + invalidation des tokens |

---

### Produits

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/products` | 🌐 | Liste des produits actifs (avec filtres et pagination) |
| `GET` | `/products/:slug` | 🌐 | Détail d'un produit (images, tailles, stocks) |

---

### Points de retrait

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/stores` | 🌐 | Liste des points de retrait actifs (nom, adresse, horaires) |

---

### Panier & Checkout

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/checkout/session` | 🔒 | Vérifie les stocks, crée une Checkout Session Stripe, renvoie l'URL de paiement |
| `POST` | `/webhooks/stripe` | ⚡ | Reçoit les événements Stripe (paiement, remboursement...) |

> **Sécurité Webhook :** La route `/webhooks/stripe` est exclue du middleware `express.json()` standard. Elle utilise `express.raw()` pour conserver le corps brut de la requête, indispensable à la vérification de la signature Stripe.

---

### Commandes (Client)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/orders` | 🔒 | Liste des commandes de l'utilisateur connecté |
| `GET` | `/orders/:id` | 🔒 | Détail d'une commande (produits, statut, point de retrait) |
| `POST` | `/orders/:id/cancel` | 🔒 | Annulation de la commande (uniquement si ≤ 14 jours et statut PAID / READY) |
| `POST` | `/orders/:id/invoice` | 🔒 | Demande de facture — notifie l'admin par email |

---

### Newsletter & Contact

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/newsletter/subscribe` | 🌐 | Inscription à la newsletter |
| `POST` | `/newsletter/unsubscribe` | 🌐 | Désinscription via token (lien email) |
| `POST` | `/contact` | 🌐 | Envoi du formulaire de contact (redirigé depuis le site vitrine) |

---

### Administration — Produits

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/admin/products` | 🛡️ | Liste de tous les produits (actifs et inactifs) |
| `POST` | `/admin/products` | 🛡️ | Création d'un produit (avec images Cloudinary et tailles) |
| `GET` | `/admin/products/:id` | 🛡️ | Détail d'un produit (vue admin complète) |
| `PATCH` | `/admin/products/:id` | 🛡️ | Modification d'un produit |
| `DELETE` | `/admin/products/:id` | 🛡️ | Suppression d'un produit |
| `PATCH` | `/admin/products/:id/toggle` | 🛡️ | Active ou désactive la vente du produit |

---

### Administration — Commandes

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/admin/orders` | 🛡️ | Liste de toutes les commandes (avec filtres par statut, date, store) |
| `GET` | `/admin/orders/:id` | 🛡️ | Détail complet d'une commande |
| `PATCH` | `/admin/orders/:id/status` | 🛡️ | Mise à jour du statut (`READY` → `COLLECTED`) — déclenche l'email client |
| `POST` | `/admin/orders/:id/refund` | 🛡️ | Lance le remboursement via Stripe + passe le statut à `REFUNDED` |

---

### Administration — Points de retrait

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/admin/stores` | 🛡️ | Liste de tous les points de retrait |
| `POST` | `/admin/stores` | 🛡️ | Création d'un point de retrait |
| `PATCH` | `/admin/stores/:id` | 🛡️ | Modification (nom, adresse, horaires) |
| `DELETE` | `/admin/stores/:id` | 🛡️ | Suppression d'un point de retrait |

---

### Administration — Utilisateurs

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/admin/users` | 🛡️ | Liste des comptes (avec pagination) |
| `PATCH` | `/admin/users/:id/role` | 🛡️ | Modification du rôle (`MEMBER` ↔ `ADMIN`) |
| `DELETE` | `/admin/users/:id` | 🛡️ | Soft delete d'un compte |

---

### Administration — Exports

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/admin/exports/sales` | 🛡️ | Export des ventes sur une période donnée (`?from=&to=&format=csv\|pdf`) |

---

### Administration — Textes légaux

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/admin/legal/:type` | 🛡️ | Récupère le contenu d'une page légale (`CGV`, `RGPD`, `MENTIONS_LEGALES`) |
| `PATCH` | `/admin/legal/:type` | 🛡️ | Mise à jour du contenu |

---

### Administration — Newsletter

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `GET` | `/admin/newsletter` | 🛡️ | Liste des abonnés actifs (avec export CSV possible) |

---

## 3. Middlewares

| Middleware | Fichier | Rôle |
|---|---|---|
| `requireAuth` | `auth.middleware.ts` | Vérifie la validité du JWT Access Token dans le cookie. Renvoie `401` si absent ou expiré |
| `requireAdmin` | `auth.middleware.ts` | Vérifie que `req.user.role === 'ADMIN'`. Renvoie `403` si rôle insuffisant. Toujours utilisé après `requireAuth` |
| `validateBody(schema)` | `validate.middleware.ts` | Valide `req.body` contre un schéma Zod. Renvoie `400` avec les erreurs détaillées si invalide |
| `csrfProtection` | `csrf.middleware.ts` | Vérifie la présence et la validité du header `X-XSRF-TOKEN` sur les mutations |
| `stripeWebhook` | `stripe.middleware.ts` | Utilise `express.raw()` et vérifie la signature Stripe avant tout traitement |
| `notFound` | `notFound.middleware.ts` | Intercepte toutes les routes non définies et renvoie un `404` JSON |
| `errorHandler` | `errorHandler.middleware.ts` | Middleware global d'erreur — renvoie un JSON normalisé pour toute erreur non gérée |

### Ordre de montage dans `app.ts`

```typescript
app.use(cors(corsOptions))
app.use(csrfProtection)
app.use(express.json())

// Routes publiques
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/newsletter', newsletterRoutes)
app.use('/api/contact', contactRoutes)

// Webhook Stripe (express.raw — AVANT express.json)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler)

// Routes protégées
app.use('/api/checkout', requireAuth, checkoutRoutes)
app.use('/api/orders', requireAuth, orderRoutes)

// Routes Admin
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes)

// Middlewares de gestion d'erreurs — toujours en dernier
app.use(notFound)
app.use(errorHandler)
```

---

## 4. Codes de réponse HTTP

| Code | Signification | Usage typique |
|---|---|---|
| `200` | OK | Succès d'une requête GET, PATCH |
| `201` | Created | Ressource créée avec succès (POST) |
| `204` | No Content | Suppression réussie (DELETE) |
| `400` | Bad Request | Validation Zod échouée — corps de réponse avec le détail des erreurs |
| `401` | Unauthorized | JWT absent, invalide ou expiré |
| `403` | Forbidden | Authentifié mais rôle insuffisant |
| `404` | Not Found | Ressource introuvable |
| `409` | Conflict | Email déjà utilisé lors de l'inscription |
| `422` | Unprocessable Entity | Erreur métier (stock insuffisant, commande non annulable...) |
| `500` | Internal Server Error | Erreur serveur non gérée |

---

*Document de référence routes — Apilace E-Commerce*
*Dernière mise à jour : Avril 2026 — v1.0*
