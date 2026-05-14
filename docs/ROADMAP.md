# Roadmap — Apilace E-Commerce

> **Version :** 1.0
> **Date :** Mai 2026
> **Auteur :** Valentin Duteil
> **Objectif :** MVP production-ready + Admin Builder (portfolio)

---

## État actuel

### ✅ Terminé

**Infrastructure**
- Setup Docker, PostgreSQL, Express 5, Prisma 7
- Auth JWT (access + refresh token, cookies HttpOnly, CSRF)
- Schéma BDD complet (13 tables), seed de dev

**Backend — routes publiques et protégées**
- Auth (register, login, logout, refresh, forgot/reset password)
- Produits, Magasins (lecture publique)
- Panier (CRUD + fusion localStorage → BDD)
- Checkout Stripe (session création)
- Commandes client (liste, détail, annulation, facture)
- Admin : Dashboard, Commandes, Magasins, Utilisateurs, Produits (CRUD basique)

**Frontend — pages**
- ShopPage, ProductPage (éditoriale), CartPage
- LoginPage (+ forgot password inline), RegisterPage, ResetPasswordPage
- CheckoutSuccessPage
- AccountPage, OrderDetailPage
- AdminDashboardPage, AdminOrderDetailPage
- AdminStoresPage, AdminUsersPage
- NotFoundPage, LegalPage (placeholder)

**UI/UX**
- Navbar, Footer, Sidebar burger
- Modals partagées (LoginModal, AddToCartModal, SizeGuideModal)
- StatusBadge composant partagé
- Audit CSS complet — cohérence couleurs, commentaires, breakpoint 992px

---

## Phase 1 — Infrastructure produit *(~4h)*

> Prérequis au Builder et aux flux transactionnels

- [ ] Migration Prisma : ajout `mirrorBackground Boolean @default(false)` sur `ProductSection`
- [ ] `admin.product.controller.ts` — Full Sync (flush & fill sections + tailles en transaction)
- [ ] Endpoint `POST /admin/products/upload-image` — retourne URL Cloudinary
- [ ] Mise à jour `product.schemas.ts` + `product.routes.ts`
- [ ] `AdminProductsPage` — liste avec toggle `isActive`, recherche, lien vers éditeur

---

## Phase 2 — Flux transactionnels & emails *(~11h)*

> Cycle de vente complet

- [ ] **Stripe Webhook** `PENDING → PAID` + décrémentation stock + clear panier *(~3h)*
- [ ] **Resend** — 6 templates HTML :
  - Confirmation commande (PAID)
  - Commande prête en boutique (READY)
  - Annulation client
  - Demande de facture → admin
  - Confirmation remboursement
  - Réinitialisation mot de passe
- [ ] Refund Stripe réel dans `admin-order.controller.ts` *(actuellement status seulement)*

---

## Phase 3 — Admin Builder WYSIWYG *(~15-18h)*

> Le "wow factor" portfolio

**Architecture**
- [ ] `AdminProductFormPage.tsx` — mode création + édition (même composant)
- [ ] `ProductSectionEditor.tsx` — wrapper éditable autour des composants ProductPage
- [ ] Reveal forcé en mode admin (`reveal-up--visible` constant, pas d'animations)

**Fonctionnalités**
- [ ] Ghost inputs — héritent du CSS doré/blanc, contour au focus uniquement
- [ ] Drag & Drop sections (`dnd-kit`) — réordonnancement par position
- [ ] Toggle Mirror Background — flip image horizontalement en live
- [ ] Upload image par section — prévisualisation immédiate
- [ ] CTA auto-rempli depuis les specs des sections IMAGE_TEXT

---

## Phase 4 — Services & contenu *(~14h)*

- [ ] **Google OAuth 2.0** — login social *(~4h)*
- [ ] **Newsletter** — subscribe/unsubscribe + liste admin *(~2h)*
- [ ] **Formulaire de contact** — rate limiting + email admin *(~1h)*
- [ ] **LegalPage** frontend — affichage CGV / RGPD / Mentions légales *(~1h)*
- [ ] **AdminLegalPage** — édition des textes légaux *(~3h)*
- [ ] **AdminExportsPage** — export CSV des ventes *(~2h)*
- [ ] Route `/admin/utilisateurs/:id` — profil client détaillé *(~3h)*

---

## Phase 5 — Excellence technique *(~20h)*

**Polish**
- [ ] Désinstallation Chakra UI — remplacer modals/toasts dans 3 pages admin
- [ ] Audit CSS final — cohérence boutons, titres, spacings sur toutes les pages
- [ ] Responsive polish — ShopPage colonnes, tableaux admin scroll horizontal

**Tests**
- [ ] Vitest — tests unitaires (auth utils, calculs prix, date utils)
- [ ] Tests d'intégration — transactions Prisma, flux commande complet
- [ ] Cypress/Playwright E2E — tunnel d'achat du panier à la confirmation

**CI/CD**
- [ ] GitHub Actions — lint + `tsc --noEmit` + tests à chaque push
- [ ] Mise en prod `dev → main` PR

---

## Estimation totale restante

| Phase | Temps |
|---|---|
| Phase 1 | ~4h |
| Phase 2 | ~11h |
| Phase 3 | ~15-18h |
| Phase 4 | ~14h |
| Phase 5 | ~20h |
| **Total** | **~64-67h** |

---

## Conventions de branche

feat/admin-product     → Phase 1 + 3
feat/transactions      → Phase 2
feat/services          → Phase 4
chore/phase-5-polish   → Phase 5

Toujours : `feat/* → PR → dev` — jamais merge direct.
`dev → main` uniquement mise en prod finale (fin Phase 5).

---

*Roadmap Apilace E-Commerce — Mai 2026*