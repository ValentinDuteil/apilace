# Design System — Apilace E-Commerce

> **Version :** 3.0
> **Date :** Mai 2026
> **Auteur :** Valentin
> **Statut :** MVP - Mis à jour post-audit CSS S5

---

## Table des matières

1. [Identité visuelle](#1-identité-visuelle)
2. [Palette de couleurs](#2-palette-de-couleurs)
3. [Typographie](#3-typographie)
4. [Tokens Chakra UI](#4-tokens-chakra-ui)
5. [Composants clés](#5-composants-clés)
6. [UX — Comportements et états](#6-ux--comportements-et-états)
7. [Responsive](#7-responsive)

---

## 1. Identité visuelle

### Contexte

Le design system du nouveau service e-commerce doit assurer une **cohérence totale** avec le site vitrine existant ([apilace.com](https://www.apilace.com)), développé avec Bootstrap 5 et une police custom `CenturySchoolbook`.

L'objectif est de transposer fidèlement cette identité via CSS et JSX pour React, sans introduire de rupture visuelle entre les deux surfaces.

### Stack visuelle du site existant (référence)

| Élément | Valeur |
|---|---|
| Framework CSS | CSS global (`index.css`) + CSS page-specific + inline styles |
| Police | `CenturySchoolbook` (TTF custom, serif) |
| Icônes | Font Awesome 7.2.0 |
| Slider | Swiper 9 |
| Couleur brand | `#957d4c` — or chaud ("doré") |
| Corps texte | `#212529` |
| Fond pages | `#ffffff` |
| Sections claires | `#f8f9fa` |
| Footer | Fond doré sombre — #957d4c |

### Principes directeurs

- **Luxe sobre** : Pas d'effets tape-à-l'œil. L'or est réservé aux CTA et éléments de mise en valeur.
- **Cohérence** : La police CenturySchoolbook et le `#957d4c` sont les deux piliers identitaires — intouchables.
- **Lisibilité** : Des montres haut de gamme méritent des fiches produit épurées, du blanc et de l'espace.
- **Confiance** : Un tunnel d'achat rassurant — hiérarchie claire, états de validation visibles, feedback immédiat.

---

## 2. Palette de couleurs

### Couleur brand — "Doré Apilace"

| État | Hex | Usage |
|---|---|---|
| Normal | `#957d4c` | Boutons CTA, liens actifs, badges, icônes de mise en valeur |
| Hover | `#7d6840` | Survol des boutons CTA |
| Active | `#665535` | Clic des boutons CTA |
| Fond doux | `#f5efe0` | Background de badges, tags de statut, encarts |

### Backgrounds

| Rôle | Hex | Usage |
|---|---|---|
| Background principal | `#ffffff` | Pages, fond par défaut |
| Background secondaire | `#f8f9fa` | Sections alternées, sidebar, cartes |
| Background tertiaire | `#f0ede8` | Inputs, éléments enfoncés |
| Footer | `#1a1a1a` | Footer sombre (reprend l'existant) |

### Textes

| Rôle | Hex | Usage |
|---|---|---|
| Texte principal | `#212529` | Corps, titres |
| Texte secondaire | `#6c757d` | Labels, metadata, breadcrumbs |
| Texte tertiaire | `#adb5bd` | Placeholders, éléments désactivés |
| Texte sur fond sombre | `#ffffff` | Footer, boutons plein |

### Statuts sémantiques

| Rôle | Hex | Justification |
|---|---|---|
| Succès | `#2d6a4f` | Vert naturel — sobriété luxe |
| Erreur | `#212529` | Gris sombre — non agressif |
| Warning | `#856404` | Ambre sombre — cohérent avec le doré |
| Info | `#084298` | Bleu sobre |

### Statuts de commande — Pastilles

| Statut | Couleur fond | Couleur texte |
|---|---|---|
| `PENDING` | rgba(173,181,189,0.08) | #6c757d |
| `PAID` | rgba(201,169,110,0.08) | #957d4c |
| `READY` | rgba(149,125,76,0.12) | `#6b5a3e |
| `COLLECTED` | rgba(74,63,47,0.08) | #4a3f2f |
| `CANCELLED` | rgba(74,29,29,0.06) | #4a1d1d |
| `REFUNDED` | rgba(184,160,112,0.10) | #7a6040 |

### Bordures

| Rôle | Valeur |
|---|---|
| Bordure par défaut | `1px solid rgba(33, 37, 41, 0.10)` |
| Bordure hover | `1px solid rgba(33, 37, 41, 0.25)` |
| Bordure focus | `2px solid #957d4c` |

---

## 3. Typographie

### Police principale

| Police | Source | Rôle |
|---|---|---|
| **CenturySchoolbook** | Fichier local (`/fonts/CenturySchoolbook.ttf`) | Tous les textes — cohérence totale avec le site vitrine |

La police est chargée localement via `@font-face` dans le projet React. Elle est déclarée comme `font-family` par défaut pour `heading` et `body` dans le thème Chakra.

```css
@font-face {
  font-family: 'CenturySchoolbook';
  src: url('/fonts/Century Schoolbook Regular font.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
```

### Échelle typographique

| Élément | Taille | Poids | Usage |
|---|---|---|---|
| Logo Apilace | 22px | 600 | Navbar |
| H1 — Héro | 36–48px | 600 | Titre de la page d'accueil |
| H2 — Section | 28px | 400 | Titres de sections |
| H3 — Carte | 18px | 600 | Titre d'une fiche produit |
| Prix produit | 22px | 700 | Mise en avant du prix |
| Corps principal | 16px | 400 | Texte courant |
| Label UI | 13px | 400 | Labels, filtres |
| Hint / Helper | 12px | 400 | Textes d'aide, placeholders |
| Mention légale | 12px | 300 | Footer, textes secondaires |

### Line-height

```
Corps      : 1.6
Titres     : 1.2
Labels UI  : 1.4
```

---

## 4. Chakra UI — Suppression

Chakra UI est en cours de désinstallation. Les nouvelles pages n'utilisent plus Chakra.
Les 3 pages admin qui l'utilisent encore (modals + toasts) seront migrées en Phase 5.

Règle : ne plus importer de composants Chakra dans aucun nouveau fichier.

## 5. Composants clés

### ProductPage

Page éditoriale immersive — sections plein écran avec overlays sombres, animations reveal,
typographie or/blanc. Voir `ProductPage.tsx` + `ProductPage.css`.
Ne pas modifier l'identité visuelle de cette page.

### Badge Statut de Commande

```
● EN ATTENTE    → fond rgba(173,181,189,0.08),  texte #6c757d
● PAYÉE         → fond rgba(201,169,110,0.08),  texte #957d4c
● PRÊTE         → fond rgba(149,125,76,0.12),  texte #6b5a3e
● RÉCUPÉRÉE     → fond rgba(74,63,47,0.08),  texte #4a3f2f
● ANNULÉE       → fond rgba(74,29,29,0.06),  texte #4a1d1d
● REMBOURSÉE    → fond rgba(184,160,112,0.10),  texte #7a6040
```

### Navbar — états connecté / déconnecté

```
Visiteur :
Logo | Boutique | Notre histoire | Actualités | Contact | [Connexion] [Inscription] | [🛒 Panier (n)]

Membre connecté :
Logo | Boutique | Notre histoire | Actualités | Contact | Mon compte | [Déconnexion] | [🛒 Panier (n)]

Admin connecté :
Logo | Boutique | Notre histoire | Actualités | Contact | Administration | Mon compte | [Déconnexion] | [🛒 Panier (n)]
```

### Select Point de Retrait (Checkout)

```
┌─────────────────────────────────────────────────┐
│  Choisissez votre point de retrait              │
│                                                 │
│  ◉ Paris 8e — Galerie Joséphine                │
│    12 rue du Faubourg Saint-Honoré              │
│    Lun–Sam : 10h–19h                            │
│                                                 │
│  ○ Lyon — Presqu'île                            │
│    8 place des Jacobins                         │
│    Mar–Sam : 11h–18h                            │
│                                                 │
│  ○ Bordeaux — Centre                            │
│    ...                                          │
└─────────────────────────────────────────────────┘
```

Chaque option affiche : nom du point de retrait, adresse complète, horaires. Les informations du point sélectionné sont injectées dans l'email de confirmation.

---

## 6. UX — Comportements et états

### Feedback des interactions

| Action | Feedback |
|---|---|
| Ajout au panier | Toast succès + compteur panier mis à jour |
| Ajout impossible (stock épuisé) | Toast erreur + bouton désactivé |
| Paiement en cours | Spinner plein écran + message "Redirection vers le paiement sécurisé..." |
| Commande confirmée | Page `/checkout/success` avec récapitulatif et email envoyé |
| Erreur de formulaire | Bordure rouge + message d'erreur sous le champ (Zod) |
| Succès de formulaire | Toast vert haut à droite, disparaît après 3s |
| Annulation commande | Modale de confirmation + toast après succès |

### Persistence du panier

1. **Visiteur** : panier stocké en `localStorage`
2. **À la connexion** : fusion du panier localStorage avec l'éventuel panier BDD (les doublons conservent la quantité la plus haute)
3. **Membre connecté** : panier synchronisé en BDD

### Transitions

```css
transition: all 0.15s ease;         /* Hover états */
transition: transform 0.2s ease;    /* Élévation cartes produit */
transition: opacity 0.2s ease;      /* Apparition/disparition modales */
```

---

## 7. Responsive

## 7. Responsive

### Breakpoint unique : 992px

Tout le projet utilise un seul breakpoint à **992px** (cohérence avec le site vitrine Bootstrap).

| Viewport | Comportement |
|---|---|
| > 992px | Navbar liens visibles, sidebar 50vw, footer 3 colonnes |
| < 992px | Navbar liens masqués → burger, sidebar 100vw, footer 1 colonne |

### Comportement par composant

**Navbar** : liens desktop masqués sous 992px, burger `#DFCF95` affiché

**Sidebar** : `50vw` desktop → `100vw` mobile, animation `translateX`

**Footer** : grid 3 colonnes → 1 colonne

**CartPage** : padding réduit, image produit `90px` → `150px` desktop

**ProductPage** : sections plein écran → image au-dessus + texte en dessous sur fond `#1a1a1a`

**AdminStoresPage** : card horizontale → empilée verticalement, form grid 2 col → 1 col

**AdminUsersPage** : grid 2 colonnes → 1 colonne

**AccountPage** : order cards `flex-wrap`

**OrderDetailPage** : bouton annulation `width: 100%`

### À implémenter (Phase 5 — polish)
- ShopPage : responsive colonnes catalogue
- Pages admin : tableaux avec scroll horizontal

---

*Document de référence design — Apilace E-Commerce*
*Dernière mise à jour : Mai 2026 — v3.0*
