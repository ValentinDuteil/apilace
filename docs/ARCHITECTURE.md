# Architecture — Apilace E-Commerce

> **Version :** 1.0
> **Date :** Mai 2026
> **Auteur :** Valentin Duteil

---

## 1. Structure du projet

```
apilace/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        ← Schéma BDD (13 tables)
│   │   ├── seed.ts              ← Données de dev
│   │   └── migrations/
│   ├── src/
│   │   ├── app.ts               ← Entry point Express
│   │   ├── controllers/         ← Logique métier
│   │   ├── middlewares/         ← Auth, CSRF, validation, errors
│   │   ├── routes/              ← index.routes.ts + routes par domaine
│   │   ├── schemas/             ← Validation Zod
│   │   ├── types/               ← Types Express + métier
│   │   └── utils/               ← AppError, auth, cloudinary, cart, order
│   └── lib/                     ← prisma.ts, stripe.ts, cloudinary.ts
├── frontend/
│   ├── public/
│   │   ├── fonts/               ← CenturySchoolbook TTF
│   │   └── img/                 ← Logos Apilace
│   └── src/
│       ├── App.tsx              ← Routes React Router
│       ├── main.tsx             ← Providers (BrowserRouter, Chakra*, Auth, Cart)
│       ├── components/          ← Composants partagés
│       ├── contexts/            ← AuthContext, CartContext
│       ├── hooks/               ← useReveal
│       ├── layouts/             ← MainLayout (Navbar + Outlet + Footer)
│       ├── lib/                 ← axios.ts (instance + interceptors)
│       ├── pages/               ← Pages publiques et membres
│       │   └── admin/           ← Pages admin
│       ├── router/              ← ProtectedRoute, AdminRoute
│       ├── styles/              ← CSS page-specific
│       ├── theme/               ← Thème Chakra* (à désinstaller Phase 5)
│       └── types/               ← models.types.ts (source de vérité frontend)
└── docs/
    ├── ARCHITECTURE.md
    ├── DESIGN.md
    ├── ROADMAP.md
    ├── ROUTES.md
    ├── CONCEPTION.md
    └── STRIPE_SETUP.md
```

---

## 2. Ports Docker

| Service | Local | Container |
|---|---|---|
| PostgreSQL | 5438 | 5432 |
| Backend Express | 3008 | 3000 |
| Frontend Vite | 5178 | 5173 |

---

## 3. Patterns CSS

### Règle fondamentale
Ne jamais mélanger inline styles et classes CSS sur la **même propriété**.

### Décision par cas

| Cas | Approche |
|---|---|
| Hover / focus / active | Classe CSS dans fichier dédié |
| Media queries | Classe CSS dans fichier dédié |
| Animations d'état | Classe CSS (ex: `.sidebar--open`) |
| Layout statique sans interaction | Inline styles |
| Styles partagés multi-pages | Classe CSS dans `index.css` |

### Fichiers CSS

| Fichier | Contenu |
|---|---|
| `index.css` | Reset, font, navbar, sidebar, footer, modals, boutons partagés, animations |
| `[Page].css` | Styles spécifiques à une page avec hover/responsive |

### Breakpoint unique : 992px
Toujours en bas du fichier CSS, jamais au milieu.

### Classes partagées notables (`index.css`)

```
.login-modal-input          → Input texte standard
.login-modal-btn            → Bouton CTA doré plein
.login-modal-btn--outline   → Bouton secondaire transparent
.cart-modal / .cart-modal-overlay → Système modal partagé
.product-viewcart-btn       → Bouton "Voir ma sélection" (modal panier)
.product-continue-btn       → Bouton "Enrichir ma sélection"
.admin-btn-primary/secondary/danger → Boutons admin
.reveal-up / .reveal-up--visible   → Animation scroll
.shimmer                    → Skeleton loading
```

---

## 4. Conventions de code

### Commentaires
```typescript
// ─── Section name ─────────────────────────────────────────────────────────────
// Inline comment for complex logic
```
- Toujours en **anglais**
- Pas de `//===` ni de `//---` — uniquement `// ───`

### Imports
```typescript
// 1. Libs externes
import { useState } from 'react'
import type { AxiosError } from 'axios'
// 2. Locaux
import api from '../lib/axios'
import type { Order } from '../types/models.types'
```
- Pas d'extension `.tsx` dans les imports locaux
- `import type` pour les types purs

### Nommage
- Composants : `PascalCase`
- Fichiers CSS : `PascalCase.css` (même nom que le composant)
- Variables/fonctions : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`

### Git
```
type(scope): description en minuscules
```
Types : `feat` `fix` `refactor` `chore` `style` `docs` `test`

---

## 5. Patterns récurrents

### Gestion erreurs Zod (formulaires)

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
const [globalError, setGlobalError] = useState<string | null>(null)

function clearFieldError(champ: string) {
  setFieldErrors(prev => {
    if (!prev[champ]) return prev
    const next = { ...prev }
    delete next[champ]
    return next
  })
}

// Dans le catch
const axiosError = error as AxiosError<ApiValidationError>
const details = axiosError.response?.data?.details
if (details?.length) {
  const errors: Record<string, string> = {}
  for (const { champ, message } of details) errors[champ] = message
  setFieldErrors(errors)
} else {
  setGlobalError(axiosError.response?.data?.message ?? 'Une erreur est survenue.')
}
```

Pages utilisant ce pattern : `LoginPage`, `RegisterPage`, `AccountPage`,
`AdminStoresPage`, `ResetPasswordPage`, `AdminProductFormPage` (à venir)

### Composant FieldError
```typescript
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p style={{
      fontFamily: 'CenturySchoolbook, serif',
      fontSize: '0.78rem', color: '#212529', marginTop: '4px',
    }}>
      {message}
    </p>
  )
}
```

### Modal partagée
```tsx
<div className={`cart-modal-overlay${isOpen ? ' cart-modal-overlay--open' : ''}`}
  onClick={onClose} />
<div className={`cart-modal${isOpen ? ' cart-modal--open' : ''}`}>
  <button className="cart-modal-close" onClick={onClose}>
    <i className="fa-solid fa-xmark" />
  </button>
  {/* contenu */}
</div>
```

### Skeleton loading
```tsx
<div style={{
  height: '72px',
  background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
}} />
```

---

## 6. Décisions techniques majeures

| Décision | Raison |
|---|---|
| Prisma 7 + `PrismaPg` adapter | Nécessite `prisma.config.ts`, pas de `url` dans `schema.prisma` |
| Express 5 | Pas de `try/catch` ni de `next` dans les controllers |
| Zod v4 | Messages custom : `{ error: '...' }` |
| Axios 1.15.0 | Versions 1.14.1 et 0.30.4 compromises (supply chain 31/03/2026) |
| Stripe webhook avant `express.json()` | `express.raw()` requis pour vérification signature |
| `Decimal` Prisma sérialisé en `string` | Utiliser `Number(price)` pour les calculs frontend |
| Slug produit non modifiable | Évite les URLs cassées après création |
| Flush & fill pour sections/tailles | Garantit l'ordre des positions en transaction atomique |
| `STATUS_CONFIG` dans `models.types.ts` | Source de vérité unique — pas de duplication |
| Breakpoint unique 992px | Cohérence avec site vitrine Bootstrap |
| Chakra UI → suppression Phase 5 | Trop générique, pas assez précis pour la charte Apilace |

---

## 7. Variables d'environnement

| Fichier | Usage |
|---|---|
| `.env` racine | Lu par Docker Compose — injecté dans le container backend |
| `backend/.env` | Prisma CLI local uniquement (`DATABASE_URL`) |
| `frontend/.env` | `VITE_API_URL=http://localhost:3008/api` |

Variables requises dans `.env` racine :
```
POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
JWT_SECRET / JWT_REFRESH_SECRET
FRONTEND_URL
CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
RESEND_API_KEY          ← Phase 2
GOOGLE_CLIENT_ID/SECRET ← Phase 4
```

---

## 8. Comptes de test (seed dev)

| Email | Mot de passe | Rôle |
|---|---|---|
| contact@apilace.com | Admin1234! | ADMIN |
| client@apilace.com | Client1234! | MEMBER |

Commande Stripe test : `cs_test_seed_001` — status `PAID`, liée au compte client.

---

*Architecture Apilace E-Commerce — Mai 2026 — v1.0*