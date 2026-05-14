# 📘 Fiche Technique : Le Pattern "Flush & Fill"

**Domaine :** Gestion des relations complexes en Base de Données (ORM Prisma)  
**Projet :** Apilace E-Commerce  
**Concept :** Synchronisation d'état complexe (Builder / Drag & Drop)

---

## 1. Définition du Concept
Le **Flush & Fill** (littéralement "Vider et Remplir") est une stratégie de mise à jour de données consistant à supprimer l'intégralité des enregistrements liés à une entité parente pour les recréer immédiatement à partir d'un nouvel état source.

Au lieu de calculer les différences (diffing) entre l'ancien et le nouvel état, on fait "table rase" pour repartir sur une base saine.



---

## 2. Pourquoi l'utiliser pour Apilace ?

Dans le cadre du **Builder de Produit** d'Apilace, nous gérons des `ProductSection` (sections de page) et des `ProductSize` (tailles). Le Flush & Fill s'impose pour trois raisons majeures :

### A. La gestion de l'ordre (Positioning)
Dans le Builder, l'utilisateur peut glisser-déposer (Drag & Drop) les sections pour changer leur ordre visuel.
* **Problème :** Si on modifie juste les champs, gérer manuellement le décalage des index de position en SQL (ex: l'ancienne position 5 devient la 2) est complexe et source d'erreurs.
* **Solution :** En supprimant tout et en ré-insérant le tableau reçu du Front, l'index de chaque élément dans le tableau JavaScript devient naturellement sa nouvelle `position` en base de données.

### B. La simplification du code
Comparer deux tableaux d'objets complexes pour savoir quel item a été modifié, ajouté ou supprimé demande un algorithme de "reconciliation" lourd. Le Flush & Fill réduit cela à deux opérations atomiques simples.

### C. Éviter les "données fantômes"
Si un utilisateur retire une taille (ex: supprimer la taille 'S') depuis l'interface, le Flush & Fill garantit qu'elle disparaît réellement de la base. Avec un simple `update`, l'ancienne taille 'S' resterait présente en base de données car elle n'aurait pas été explicitement ciblée par la mise à jour.

---

## 3. Implémentation technique (Backend)
L'implémentation repose sur le système de **Transactions** de Prisma pour garantir l'atomicité : si le "Fill" échoue, le "Flush" est annulé.

### Extrait du `admin-product.controller.ts` :

```typescript
// ─── Stratégie Flush & Fill ─────────────────────────────────────────────

await prisma.$transaction(async (tx) => {
    
    // 1. FLUSH : On vide l'existant pour ce produit spécifique
    await tx.productSection.deleteMany({ where: { productId: id } });

    // 2. FILL : On remplit avec les nouvelles données du Builder
    if (data.sections && data.sections.length > 0) {
        await tx.productSection.createMany({
            data: data.sections.map((section, index) => ({
                ...section,
                productId: id,
                position: index // L'ordre du tableau est préservé nativement
            })),
        });
    }
});