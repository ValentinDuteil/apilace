# Design System — Apilace E-Commerce

> **Version :** 1.0
> **Date :** Avril 2026
> **Auteur :** Valentin
> **Statut :** MVP

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

L'objectif est de transposer fidèlement cette identité dans un thème **Chakra UI** pour React, sans introduire de rupture visuelle entre les deux surfaces.

### Stack visuelle du site existant (référence)

| Élément | Valeur |
|---|---|
| Framework CSS | Bootstrap 5.0.2 |
| Police | `CenturySchoolbook` (TTF custom, serif) |
| Icônes | Font Awesome 6 |
| Slider | Swiper 9 |
| Couleur brand | `#957d4c` — or chaud ("doré") |
| Corps texte | `#212529` |
| Fond pages | `#ffffff` |
| Sections claires | `#f8f9fa` |
| Footer | Fond sombre — `#1a1a1a` |

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
| Erreur | `#842029` | Rouge sombre — non agressif |
| Warning | `#856404` | Ambre sombre — cohérent avec le doré |
| Info | `#084298` | Bleu sobre |

### Statuts de commande — Pastilles

| Statut | Couleur fond | Couleur texte |
|---|---|---|
| `PENDING` | `#f8f9fa` | `#6c757d` |
| `PAID` | `#d1ecf1` | `#0c5460` |
| `READY` | `#d4edda` | `#155724` |
| `COLLECTED` | `#e8f4e8` | `#2d6a4f` |
| `CANCELLED` | `#f8d7da` | `#721c24` |
| `REFUNDED` | `#fff3cd` | `#856404` |

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

## 4. Tokens Chakra UI

### `frontend/src/theme/index.ts`

```typescript
import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50:  '#fdf6eb',
      100: '#f5efe0',
      200: '#e8d5b0',
      300: '#d4b87a',
      400: '#b89a5e',
      500: '#957d4c',   // Couleur principale — "Doré Apilace"
      600: '#7d6840',
      700: '#665535',
      800: '#4d3f28',
      900: '#342a1a',
    },
    neutral: {
      50:  '#ffffff',
      100: '#f8f9fa',
      200: '#f0ede8',
      300: '#dee2e6',
      400: '#ced4da',
      500: '#adb5bd',
      600: '#6c757d',
      700: '#495057',
      800: '#343a40',
      900: '#212529',
    },
    dark: {
      footer: '#1a1a1a',
    }
  },

  fonts: {
    heading: "'CenturySchoolbook', 'Times New Roman', serif",
    body:    "'CenturySchoolbook', 'Times New Roman', serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },

  fontSizes: {
    xs:  '12px',
    sm:  '13px',
    md:  '14px',
    lg:  '16px',
    xl:  '18px',
    '2xl': '22px',
    '3xl': '28px',
    '4xl': '36px',
    '5xl': '48px',
  },

  styles: {
    global: {
      body: {
        bg: '#ffffff',
        color: '#212529',
        fontFamily: "'CenturySchoolbook', 'Times New Roman', serif",
      },
      '::selection': {
        bg: '#957d4c',
        color: 'white',
      },
    }
  },

  components: {
    Button: {
      variants: {
        primary: {
          bg: '#957d4c',
          color: 'white',
          fontWeight: '600',
          _hover: { bg: '#7d6840' },
          _active: { bg: '#665535' },
        },
        outline: {
          color: '#957d4c',
          border: '1px solid #957d4c',
          _hover: { bg: '#f5efe0' },
        },
        ghost: {
          color: '#957d4c',
          _hover: { bg: '#f5efe0' },
        },
      },
      defaultProps: { variant: 'primary' }
    },

    Input: {
      variants: {
        filled: {
          field: {
            bg: '#f0ede8',
            border: '1px solid transparent',
            _hover: { bg: '#e8e3dc' },
            _focus: {
              bg: '#f8f9fa',
              borderColor: '#957d4c',
              boxShadow: 'none',
            },
          }
        }
      },
      defaultProps: { variant: 'filled' }
    },

    Select: {
      variants: {
        filled: {
          field: {
            bg: '#f0ede8',
            _focus: { borderColor: '#957d4c' },
          }
        }
      },
      defaultProps: { variant: 'filled' }
    },

    Card: {
      baseStyle: {
        container: {
          bg: '#ffffff',
          border: '1px solid rgba(33, 37, 41, 0.10)',
          borderRadius: '8px',
          overflow: 'hidden',
          transition: 'all 0.15s ease',
          _hover: {
            border: '1px solid rgba(33, 37, 41, 0.25)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(33, 37, 41, 0.12)',
          }
        }
      }
    },

    Badge: {
      variants: {
        order: (props: { colorScheme: string }) => ({
          bg: `${props.colorScheme}.100`,
          color: `${props.colorScheme}.800`,
          borderRadius: '999px',
          px: 3,
          py: 1,
          fontSize: '12px',
          fontWeight: '600',
        })
      }
    }
  },

  radii: {
    none: '0',
    sm:   '4px',
    md:   '6px',
    lg:   '8px',
    xl:   '12px',
    full: '9999px',
  },

  shadows: {
    card:    '0 1px 3px rgba(33, 37, 41, 0.08)',
    product: '0 2px 8px rgba(33, 37, 41, 0.10)',
    nav:     '0 2px 8px rgba(33, 37, 41, 0.08)',
  }
})

export default theme
```

---

## 5. Composants clés

### Carte Produit

```
┌─────────────────────────────────┐
│                                 │
│   [Photo produit 300px]         │  ← object-fit: cover, hover overlay
│   [Hover: "Voir le produit →"]  │
│                                 │
├─────────────────────────────────┤
│ Nom de la montre                │  ← CenturySchoolbook 18px 600
│ 1 290 €                         │  ← CenturySchoolbook 22px 700 brand.500
│                                 │
│ [Taille: S  M  L  Standard]     │  ← Selector de taille (pill buttons)
│                                 │
│ [Ajouter au panier         →]   │  ← Button primary full-width
└─────────────────────────────────┘
```

**États de la carte :**
- `default` : fond blanc, bordure subtile
- `hover` : légère élévation, bordure renforcée
- `out-of-stock` : overlay semi-transparent "Épuisé", bouton désactivé
- `inactive` : non visible en boutique (admin uniquement)

### Badge Statut de Commande

```
● EN ATTENTE    → fond #f8f9fa,  texte #6c757d
● PAYÉE         → fond #d1ecf1,  texte #0c5460
● PRÊTE         → fond #d4edda,  texte #155724
● RÉCUPÉRÉE     → fond #e8f4e8,  texte #2d6a4f
● ANNULÉE       → fond #f8d7da,  texte #721c24
● REMBOURSÉE    → fond #fff3cd,  texte #856404
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

### Breakpoints (Chakra UI — defaults)

```
sm  : 480px   → Mobile large
md  : 768px   → Tablette
lg  : 992px   → Desktop petit
xl  : 1280px  → Desktop standard
2xl : 1536px  → Desktop large
```

### Comportement par breakpoint

**Mobile (< 768px)**
- Navbar → burger menu (slide-in overlay)
- Boutique → 1 colonne de produits
- Checkout → étapes empilées verticalement
- Panier → drawer latéral plein écran

**Tablette (768px – 992px)**
- Boutique → 2 colonnes
- Dashboard Admin → tableaux avec scroll horizontal

**Desktop (> 992px)**
- Boutique → 3–4 colonnes
- Admin → sidebar fixe gauche (240px) + contenu principal
- Fiche produit → layout 2 colonnes (galerie gauche, infos droite)

---

*Document de référence design — Apilace E-Commerce*
*Dernière mise à jour : Avril 2026 — v1.0*
