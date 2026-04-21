# Stripe Setup — Apilace E-Commerce

> **Version :** 1.0
> **Date :** Avril 2026

---

## 1. Créer un compte Stripe

1. Aller sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Créer un **nouveau compte dédié** au projet (ne pas réutiliser un compte existant)
3. Rester en **mode test** pour le développement

---

## 2. Récupérer les clés API

**Dashboard Stripe → Développeurs → Clés API → Clé standard**

| Variable | Où la trouver | Environnement |
|---|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète `sk_test_...` | Test |
| `STRIPE_SECRET_KEY` | Clé secrète `sk_live_...` | Production |

Ajouter dans le `.env` racine :
```dotenv
STRIPE_SECRET_KEY=sk_test_...
```

---

## 3. Installer la Stripe CLI (WSL / Linux)

```bash
# Récupérer la dernière version disponible
curl -s https://api.github.com/repos/stripe/stripe-cli/releases/latest | grep '"tag_name"'

# Télécharger (remplacer X.X.X par la version trouvée)
curl -sL https://github.com/stripe/stripe-cli/releases/download/vX.X.X/stripe_X.X.X_linux_x86_64.tar.gz -o stripe.tar.gz

# Installer
tar -xzf stripe.tar.gz
sudo mv stripe /usr/local/bin/stripe
rm stripe.tar.gz

# Vérifier
stripe --version
```

---

## 4. Connecter la CLI au compte Stripe

```bash
stripe login
```

Suivre le lien affiché dans le terminal pour authentifier.

> **Note :** la session expire après 90 jours — relancer `stripe login` si nécessaire.

---

## 5. Générer le STRIPE_WEBHOOK_SECRET

Lancer Docker d'abord :
```bash
docker-compose up
```

Dans un second terminal, démarrer l'écoute des webhooks :
```bash
stripe listen --forward-to localhost:3008/api/webhooks/stripe
```

La CLI affiche :

```bash
Ready! Your webhook signing secret is whsec_...
```

Copier le `whsec_...` dans le `.env` racine :
```dotenv
STRIPE_WEBHOOK_SECRET=whsec_...
```

Redémarrer Docker pour prendre en compte la nouvelle variable :
```bash
docker-compose down && docker-compose up
```

---

## 6. Tester le webhook

Avec Docker et `stripe listen` actifs, dans un troisième terminal :

```bash
stripe trigger checkout.session.completed
```

**Résultat attendu dans les logs Docker :**

NotFoundError: Commande introuvable pour la session Stripe cs_test_...

C'est le comportement correct — `stripe trigger` génère une fausse session qui n'existe pas en BDD. Le `404` confirme que le webhook est bien reçu, la signature vérifiée et le controller exécuté.

---

## 7. Mise en production

Remplacer les clés test par les clés live dans le `.env` de production :
```dotenv
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   ← généré depuis le Dashboard Stripe (pas la CLI)
```

> **Note :** En production, le `STRIPE_WEBHOOK_SECRET` est généré depuis **Dashboard Stripe → Développeurs → Webhooks → Ajouter un endpoint**, et non via la CLI.

---

## 8. Variables d'environnement récapitulatif

| Variable | Fichier | Rôle |
|---|---|---|
| `STRIPE_SECRET_KEY` | `.env` racine | Authentification API Stripe |
| `STRIPE_WEBHOOK_SECRET` | `.env` racine | Vérification signature webhook |

> ⚠️ Ces valeurs ne doivent jamais être committées. Vérifier que `.env` est bien dans `.gitignore`.