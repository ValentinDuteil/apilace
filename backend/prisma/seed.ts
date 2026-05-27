import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import argon2 from 'argon2'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding...')

  // Admin
  await prisma.user.upsert({
    where: { email: 'contact@apilace.com' },
    update: {
      email: 'contact@apilace.com',
      passwordHash: await argon2.hash('Admin1234!'),
      firstName: 'Louis',
      lastName: 'Desnoyers',
      phone: '+33682503749',
      address: '72 B Avenue Thabaud Boislareine',
      postalCode: '36230',
      city: 'Neuvy Saint-Sépulchre',
      role: 'ADMIN',
    },
    create: {
      email: 'contact@apilace.com',
      passwordHash: await argon2.hash('Admin1234!'),
      firstName: 'Louis',
      lastName: 'Desnoyers',
      phone: '+33682503749',
      address: '72 B Avenue Thabaud Boislareine',
      postalCode: '36230',
      city: 'Neuvy Saint-Sépulchre',
      role: 'ADMIN',
    }
  })

  // Membre
  const member = await prisma.user.upsert({
    where: { email: 'client@apilace.com' },
    update: {},
    create: {
      email: 'client@apilace.com',
      passwordHash: await argon2.hash('Client1234!'),
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33611111111',
      address: '12 rue de la Paix',
      postalCode: '75001',
      city: 'Paris',
      role: 'MEMBER',
    }
  })

  // Magasin
  const store = await prisma.store.upsert({
    where: { id: 1 },
    update: {
      name: 'Neuvy Saint-Sépulchre — Galerie Joséphine',
      address: '72 B Avenue Thabaud Boislareine',
      city: 'Neuvy Saint-Sépulchre',
      postalCode: '36230',
      email: 'contact@apilace.com',
      phone: '+33682503749',
      openingHours: {
        lun: '10h-19h',
        mar: '10h-19h',
        mer: '10h-19h',
        jeu: '10h-19h',
        ven: '10h-19h',
        sam: '10h-19h',
        dim: 'Fermé',
      },
    },
    create: {
      name: 'Neuvy Saint-Sépulchre — Galerie Joséphine',
      address: '72 B Avenue Thabaud Boislareine',
      city: 'Neuvy Saint-Sépulchre',
      postalCode: '36230',
      email: 'contact@apilace.com',
      phone: '+33682503749',
      openingHours: {
        lun: '10h-19h',
        mar: '10h-19h',
        mer: '10h-19h',
        jeu: '10h-19h',
        ven: '10h-19h',
        sam: '10h-19h',
        dim: 'Fermé',
      },
    }
  })

  // Produit
  const product = await prisma.product.upsert({
    where: { slug: 'm22-collection' },
    update: {
      price: 15000,
      tagline: 'Pour les amoureux du biomimétisme',
      images: {
        deleteMany: {},
        create: [
          { url: '/img/test1.jpeg', isPrimary: true, position: 0 },
        ]
      },
    },
    create: {
      name: 'M22 Collection by Apilace®',
      slug: 'm22-collection',
      description: 'Inspirée par le biomimétisme et les structures alvéolaires, la M22 est le reflet de l\'équilibre entre légèreté et robustesse.',
      tagline: 'Pour les amoureux du biomimétisme',
      price: 15000,
      isActive: true,
      images: {
        create: [
          { url: '/img/test1.jpeg', isPrimary: true, position: 0 },
        ]
      },
      sizes: {
        create: [
          { size: 'S', stock: 2 },
          { size: 'M', stock: 3 },
          { size: 'L', stock: 1 },
          { size: 'Standard', stock: 5 },
        ]
      },
    }
  })

  // Sections — reset and recreate
  await prisma.productSection.deleteMany({
    where: { product: { slug: 'm22-collection' } }
  })

  await prisma.productSection.createMany({
    data: [
      {
        productId: product.id,
        type: 'IMAGE_TEXT',
        position: 1,
        imageUrl: '/img/boitierexample.png',
        textSide: 'RIGHT',
        title1: 'Boîtier',
        description1: 'Conçu par optimisation topologique, chaque gramme est justifié. La structure alvéolaire confère au M22 une rigidité exceptionnelle pour seulement 58 grammes.',
        text2: 'Diamètre', desc2: '42mm',
        text3: 'Épaisseur', desc3: '9mm',
        text4: 'Matière', desc4: 'Acier 316L',
      },
      {
        productId: product.id,
        type: 'IMAGE_TEXT',
        position: 2,
        imageUrl: '/img/cadranexample.png',
        textSide: 'LEFT',
        title1: 'Cadran',
        description1: 'Inspiré des structures alvéolaires de la ruche, le cadran du M22 révèle à la loupe une géométrie d\'une précision troublante.',
        text2: 'Verre', desc2: 'Saphir anti-reflet',
        text3: 'Étanchéité', desc3: '5 ATM',
        text4: null, desc4: null,
      },
      {
        productId: product.id,
        type: 'IMAGE_TEXT',
        position: 3,
        imageUrl: '/img/braceletexample.png',
        textSide: 'RIGHT',
        title1: 'Bracelet',
        description1: 'Cuir végétal tanné en France, souple et durable. Un savoir-faire artisanal au service du confort quotidien.',
        text2: 'Matière', desc2: 'Cuir végétal',
        text3: 'Longueur', desc3: '130 à 180mm',
        text4: 'Boucle', desc4: 'Ardillon acier',
      },
      {
        productId: product.id,
        type: 'PRODUCT_CTA',
        position: 999,
        imageUrl: '/img/CTAmirrorexample.png',
        textSide: 'LEFT',
        title1: 'M22 Collection',
        description1: 'Fabriquée à la main en France. Garantie à vie.',
        text2: null, desc2: null,
        text3: null, desc3: null,
        text4: null, desc4: null,
        specs: {
          left: [
            {
              title: 'Boîtier',
              items: [
                { label: 'Taille', value: '42mm' },
                { label: 'Épaisseur', value: '9mm' },
                { label: 'Étanchéité', value: '5 ATM' },
              ],
            },
            {
              title: 'Bracelet',
              items: [
                { label: 'Taille', value: 'Standard' },
                { label: 'Matière', value: 'Cuir végétal' },
              ],
            },
            {
              title: 'Cadran',
              items: [
                { label: 'Teinte', value: 'Anthracite' },
                { label: 'Revêtement', value: 'NAC' },
                { label: 'Aiguilles', value: 'Acier poli' },
              ],
            },
          ],
          right: [
            {
              title: 'Mécanisme',
              text: 'Remontage à la main, 42 heures de réserve de marche.',
            },
            {
              title: 'Matériaux',
              text: 'Acier 316L, verre saphir antireflet double face, cuir végétal tanné en France.',
            },
            {
              title: 'Garantie',
              text: 'Chaque M22 incarne un achat de confiance, soutenu par un savoir-faire artisanal d\'exception. Garantie à vie.',
            },
          ],
        },
      },
    ]
  })

  // ─── Order ────────────────────────────────────────────────────────────────
  await prisma.order.upsert({
    where: { stripeSessionId: 'cs_test_seed_001' },
    update: {},
    create: {
      userId: member.id,
      storeId: store.id,
      status: 'PAID',
      totalAmount: 15000,
      stripeSessionId: 'cs_test_seed_001',
      stripePaymentIntentId: 'pi_test_seed_001',
      items: {
        create: [{
          productId: product.id,
          size: 'M',
          quantity: 1,
          unitPrice: 15000,
        }]
      }
    }
  })

  // ─── Legal pages ──────────────────────────────────────────────────────────────
  // Flush & fill: upsert each LegalPage, delete existing sections, recreate

  const legalData: Array<{
    type: 'CGV' | 'RGPD' | 'MENTIONS_LEGALES'
    sections: Array<{ title: string; content: string; position: number }>
  }> = [
      // ── MENTIONS LÉGALES ────────────────────────────────────────────────────────
      {
        type: 'MENTIONS_LEGALES',
        sections: [
          {
            position: 1,
            title: 'Article 1 — Éditeur du site',
            content:
              '<p>Le site internet disponible à l\'adresse apilace.com est édité par la société RAVEAU DESNOYERS MANUFACTURE HORLOGERE, Société par actions simplifiée (SAS) au capital de 1 000,00 €, immatriculée au Registre du Commerce et des Sociétés (RCS) de Châteauroux sous le numéro SIREN 887 682 961.</p>' +
              '<ul>' +
              '<li>Siège social : 72B avenue Thabaud Boislareine, 36230 Neuvy-Saint-Sepulchre, France.</li>' +
              '<li>Numéro de TVA intracommunautaire : FR31887682961.</li>' +
              '<li>Code APE / NAF : 2652Z (Horlogerie).</li>' +
              '</ul>',
          },
          {
            position: 2,
            title: 'Article 2 — Responsable de la publication et contacts',
            content:
              '<p>Le directeur de la publication du site internet est Monsieur Louis DESNOYERS, en sa qualité de Président de la société RAVEAU DESNOYERS MANUFACTURE HORLOGERE. Pour toute question, demande d\'information ou réclamation, l\'éditeur peut être contacté directement :</p>' +
              '<ul>' +
              '<li>Par e-mail : <a href="mailto:contact@apilace.com">contact@apilace.com</a></li>' +
              '<li>Par téléphone : 06 82 50 37 49 (numéro non surtaxé).</li>' +
              '</ul>',
          },
          {
            position: 3,
            title: 'Article 3 — Hébergement du site web',
            content:
              '<p>Le site internet et ses bases de données sont hébergés par la société IONOS SE (1&amp;1 Internet SARL).</p>' +
              '<ul>' +
              '<li>Adresse postale France : 7, place de la Gare, BP 70109, 57200 Sarreguemines Cedex.</li>' +
              '<li>Téléphone assistance : 09 70 80 89 11.</li>' +
              '<li>Siège social de l\'infrastructure : IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, Allemagne.</li>' +
              '</ul>',
          },
          {
            position: 4,
            title: 'Article 4 — Propriété intellectuelle et marques déposées',
            content:
              '<p>La consultation et l\'utilisation du Site sont subordonnées à l\'acceptation intégrale et au respect, par les internautes, des présentes mentions légales. L\'internaute s\'engage d\'ores et déjà à faire des informations contenues sur le Site un usage strictement personnel et non commercial.</p>' +
              '<p>Le Site, son architecture technique, son configurateur interactif, ainsi que l\'ensemble de ses contenus (textes, photographies, chartes graphiques, logos, identités visuelles, images, icônes) constituent une œuvre protégée au sens des articles L.111-1 et suivants du Code de la propriété intellectuelle. Toute représentation ou reproduction, totale ou partielle, permanente ou temporaire, sur un support informatique et/ou papier, et par quelque procédé que ce soit, sans l\'accord préalable et exprès de RAVEAU DESNOYERS MANUFACTURE HORLOGERE est strictement interdite. Elle constitue un acte de contrefaçon pouvant entraîner des condamnations civiles et/ou pénales. Seule l\'impression papier est autorisée aux fins de copie privée à l\'usage exclusif du copiste (article L.122-5 2° du Code de la propriété intellectuelle).</p>' +
              '<p>Les dénominations RAVEAU DESNOYERS et APILACE sont des marques françaises dûment enregistrées auprès de l\'INPI sous les numéros n°4864375 et 4864376. La société est également propriétaire exclusive des dessins et modèles déposés auprès de l\'EUIPO sous le numéro 009009434.</p>',
          },
          {
            position: 5,
            title: 'Article 5 — Limitation de responsabilité',
            content:
              '<p>La société RAVEAU DESNOYERS MANUFACTURE HORLOGERE met en œuvre ses meilleurs moyens pour assurer la sécurité et l\'exactitude des informations diffusées sur le Site. Néanmoins, elle décline toute responsabilité quant aux éventuels dysfonctionnements techniques, interruptions de service, pertes de données ou erreurs d\'affichage pouvant survenir indépendamment de sa volonté.</p>' +
              '<p>La société se réserve le droit de faire évoluer, de modifier ou de suspendre temporairement l\'accès au Site et à son configurateur pour des raisons techniques ou de maintenance, sans préavis. Sauf faute grave exclusive de RAVEAU DESNOYERS MANUFACTURE HORLOGERE, sa responsabilité ne peut être engagée pour des dommages directs ou indirects liés à l\'utilisation du Site, de son configurateur, ou des informations qui y sont produites.</p>',
          },
          {
            position: 6,
            title: 'Article 6 — Liens hypertextes',
            content:
              '<p>Le Site peut contenir des liens vers des sites internet de tiers. RAVEAU DESNOYERS MANUFACTURE HORLOGERE n\'exerçant aucun contrôle sur le contenu de ces sites externes, elle ne saurait être tenue pour responsable de leur accessibilité, de la véracité de leurs informations ou de leurs pratiques en matière de protection des données. Aucun lien hypertexte vers le site apilace.com ne peut être installé sans l\'accord préalable, écrit et exprès de la société.</p>',
          },
        ],
      },

      // ── CGV ─────────────────────────────────────────────────────────────────────
      {
        type: 'CGV',
        sections: [
          {
            position: 1,
            title: 'Préambule',
            content:
              '<p>Les présentes Conditions Générales d\'Utilisation et de Vente (ci-après désignées « CGUV ») sont conclues d\'une part entre la société RAVEAU DESNOYERS MANUFACTURE HORLOGERE, SAS au capital de 1 000 €, inscrite au RCS de Châteauroux sous le numéro 887 682 961, dont le siège social est sis 72B avenue Thabaud Boislareine, 36230 Neuvy-Saint-Sepulchre, prise en la personne de son représentant légal (ci-après dénommée « APILACE »), et d\'autre part, toute personne physique majeure ayant la qualité de consommateur, souhaitant utiliser le configurateur et effectuer un achat sur le site apilace.com (ci-après dénommée « le Client »).</p>',
          },
          {
            position: 2,
            title: 'Article 1 — Définitions',
            content:
              '<ul>' +
              '<li><strong>Site :</strong> Le site internet accessible à l\'adresse www.apilace.com.</li>' +
              '<li><strong>Configurateur :</strong> L\'outil interactif exclusif développé par APILACE permettant d\'assembler virtuellement et de personnaliser un garde-temps.</li>' +
              '<li><strong>Client :</strong> Toute personne physique consommateur disposant de la pleine capacité juridique, contractuellement engagée avec APILACE par la validation d\'une commande en ligne et le paiement de l\'acompte correspondant.</li>' +
              '<li><strong>Produit / Garde-temps :</strong> Les montres d\'exception et pièces de haute horlogerie configurées par l\'Utilisateur et proposées à la vente par APILACE.</li>' +
              '</ul>',
          },
          {
            position: 3,
            title: 'Article 2 — Objet et acceptation des conditions',
            content:
              '<p>Les présentes CGUV ont pour objet d\'encadrer l\'utilisation du configurateur en ligne ainsi que l\'ensemble du processus de vente, depuis la réservation de la montre jusqu\'à sa fabrication, son paiement, son retrait et l\'application des garanties.</p>' +
              '<p>L\'accès au configurateur et la validation d\'une commande impliquent obligatoirement l\'acceptation sans réserve par le Client des présentes CGUV, des Mentions Légales et de la Politique de Confidentialité disponibles sur le Site.</p>',
          },
          {
            position: 4,
            title: 'Article 3 — Accès au Service et Disponibilité',
            content:
              '<p>L\'accès au Site et l\'utilisation du configurateur sont gratuits. APILACE met en œuvre ses meilleurs moyens pour rendre le Service accessible 24h/24 et 7j/7. Néanmoins, APILACE se réserve le droit d\'interrompre momentanément l\'accès au Site pour assurer des opérations de maintenance technique ou de mise à jour des stocks de composants, sans que sa responsabilité ne puisse être recherchée.</p>' +
              '<p>APILACE s\'engage à honorer les commandes validées dans la limite des stocks de matières premières et de composants horlogers disponibles. En cas de rupture de stock sur un composant spécifique de la configuration choisie, APILACE en informera le Client dans les plus brefs délais afin de lui proposer une alternative ou un ajustement du délai de fabrication.</p>',
          },
          {
            position: 5,
            title: 'Article 4 — Processus de commande et Acompte de 30 %',
            content:
              '<p>Le Client réalise la configuration de son garde-temps étape par étape sur le configurateur. S\'il souhaite uniquement conserver ou recevoir sa configuration par e-mail, il renseigne ses informations sans que cela ne constitue un engagement d\'achat.</p>' +
              '<p>Pour valider fermement sa commande et lancer la fabrication artisanale de la montre, le Client doit valider son panier sur le Site et procéder au versement en ligne d\'un acompte obligatoire équivalent à 30 % du montant total TTC de la commande. Ce paiement s\'effectue par carte bancaire via l\'infrastructure chiffrée et sécurisée du prestataire tiers Stripe. Dès la validation du paiement, le contrat de réservation à distance est valablement formé, la pièce est retirée du catalogue en ligne, et un e-mail de confirmation reprenant les spécifications de la commande est transmis au Client.</p>',
          },
          {
            position: 6,
            title: 'Article 5 — Délais de fabrication et Garde exclusive de 3 mois',
            content:
              '<p>Les Produits étant des pièces de haute horlogerie d\'exception assemblées et finalisées à la main au sein de notre atelier sur la base de la configuration du Client, ils nécessitent un délai de fabrication artisanal. Sauf stipulation contraire lors de la commande, le délai d\'exécution et de mise à disposition du garde-temps est de 30 jours maximum à compter du versement complet de l\'acompte de 30 %.</p>' +
              '<p>Dès que la montre est finalisée, testée et prête à être délivrée, le Client en est immédiatement informé par e-mail. Afin de s\'adapter aux contraintes de déplacement de notre clientèle internationale et de lui offrir un service de conciergerie haut de gamme, APILACE conserve le garde-temps à la disposition exclusive du Client au sein de son atelier pendant un délai exceptionnel de 3 mois (90 jours calendaires) à compter de la notification de mise à disposition.</p>',
          },
          {
            position: 7,
            title: 'Article 6 — Retrait en atelier et Règlement du solde (70 %)',
            content:
              '<p>Le modèle de vente d\'APILACE repose exclusivement sur le principe du Click &amp; Collect en atelier. Le transfert physique du Produit s\'effectue obligatoirement au sein de l\'atelier d\'APILACE sis au 72B avenue Thabaud Boislareine, 36230 Neuvy-Saint-Sepulchre, France.</p>' +
              '<p>Lors du retrait, le Client procède à la vérification de la parfaite conformité et de l\'état esthétique du garde-temps. Il doit obligatoirement procéder au règlement du solde restant, soit 70 % du montant total TTC de la commande. Ce règlement final s\'effectue sur place exclusivement par carte bancaire ou par virement bancaire instantané. Une pièce d\'identité officielle en cours de validité ainsi que l\'e-mail de confirmation de la commande seront exigés pour la remise de la montre.</p>',
          },
          {
            position: 8,
            title: 'Article 7 — Défaut de retrait et clause résolutoire',
            content:
              '<p>À l\'expiration du délai de garde exceptionnel de 3 mois, et à défaut pour le Client d\'être venu retirer son Produit et d\'avoir acquitté le solde de 70 %, APILACE lui adressera une mise en demeure par lettre recommandée avec accusé de réception.</p>' +
              '<p>Si cette mise en demeure reste infructueuse plus de 15 jours après sa réception, APILACE se réserve le droit de prononcer la résolution unilatérale de la vente. En contrepartie du préjudice lié à l\'immobilisation prolongée de la pièce, au travail d\'assemblage personnalisé et à la perte d\'opportunité de vente, l\'acompte de 30 % versé en ligne lors de la commande sera définitivement conservé par APILACE à titre d\'indemnité forfaitaire, sauf cas de force majeure légitimement justifié par le Client.</p>',
          },
          {
            position: 9,
            title: 'Article 8 — Droit de rétractation légal de 14 jours',
            content:
              '<p>L\'engagement d\'achat et le paiement de l\'acompte contraignant ayant été réalisés en ligne à distance, le Client bénéficie pleinement, conformément à l\'article L.221-18 du Code de la consommation, d\'un droit de rétractation de 14 jours calendaires. Par dérogation aux règles standards de livraison, ce délai de 14 jours commence à courir le lendemain du jour où le Client prend physiquement possession de la montre au sein de l\'atelier.</p>' +
              '<p>Pour que l\'exercice de ce droit de rétractation donne lieu à un remboursement, le Produit doit être restitué dans son état d\'origine strict et parfait de présentation :</p>' +
              '<ul>' +
              '<li>La montre ne doit jamais avoir été portée et ne doit présenter aucune micro-rayure ni trace d\'usure.</li>' +
              '<li>L\'intégralité des scellés de sécurité, films de protection plastiques, écrins, documentations et certificats d\'authenticité doivent être intacts.</li>' +
              '<li>Tout produit endommagé, incomplet ou descellé ne sera ni repris ni remboursé.</li>' +
              '</ul>' +
              '<p>En cas de rétractation conforme, APILACE remboursera l\'intégralité des sommes perçues (acompte et solde) dans un délai de 14 jours par le même moyen de paiement que celui utilisé lors du règlement.</p>',
          },
          {
            position: 10,
            title: 'Article 9 — Propriété intellectuelle',
            content:
              '<p>Le Site, les marques françaises enregistrées auprès de l\'INPI sous les numéros n°4864375 et 4864376, ainsi que les dessins et modèles déposés auprès de l\'EUIPO sous le numéro 009009434 sont la propriété exclusive d\'APILACE.</p>' +
              '<p>Le configurateur et la base de données de pièces associés sont la propriété pleine et entière d\'APILACE. Le Client comprend et accepte qu\'en utilisant le configurateur pour assembler sa montre, il réalise une œuvre composite à partir de choix limités imposés par APILACE. Par conséquent, l\'achat de la montre transfère la propriété du support matériel (le garde-temps), mais ne transfère aucun droit de propriété intellectuelle ou droit d\'auteur sur le modèle ou le design final. Toute reproduction, modification ou contrefaçon du modèle est strictement interdite.</p>',
          },
          {
            position: 11,
            title: 'Article 10 — Garanties Légales et Service Après-Vente',
            content:
              '<p>Pour toute question relative au fonctionnement ou à une demande de prise en charge, le SAV d\'APILACE est joignable par e-mail à <a href="mailto:contact@apilace.com">contact@apilace.com</a> ou par téléphone au 06 82 50 37 49 (numéro non surtaxé). Les Produits vendus bénéficient de plein droit des garanties légales suivantes, applicables sur présentation de la facture d\'achat :</p>' +
              '<ul>' +
              '<li><strong>Garantie légale de conformité</strong> (Articles L.217-3 et suivants du Code de la consommation) : Le Client dispose d\'un délai de 2 ans à compter de la délivrance de la montre pour faire valoir un défaut de conformité existant au moment de la remise. En cas de défaut avéré, APILACE procédera prioritairement à la réparation ou au remplacement gratuit du garde-temps.</li>' +
              '<li><strong>Garantie des vices cachés</strong> (Articles 1641 à 1649 du Code civil) : Le Client dispose d\'un délai de 2 ans à compter de la découverte d\'un vice caché pour actionner la garantie. Il appartient au Client d\'en apporter la preuve. Si le vice est reconnu, le Client peut restituer la montre et se faire rembourser le prix, ou la garder et obtenir une réduction de prix.</li>' +
              '</ul>' +
              '<p>Ces garanties ne couvrent pas l\'usure normale de la montre (cuir du bracelet, usure des piles le cas échéant), les dommages résultant d\'un accident, d\'une négligence, d\'un choc, d\'une immersion non conforme ou d\'une manipulation/ouverture du boîtier par un tiers non agréé par APILACE. Les frais de transport retour sont pris en charge par APILACE pour les clients résidant en France Métropolitaine uniquement si la garantie est validée.</p>',
          },
          {
            position: 12,
            title: 'Article 11 — Droit applicable et Règlement des litiges',
            content:
              '<p>Les présentes CGUV sont régies exclusivement par le droit français.</p>' +
              '<p>En cas de litige ou de réclamation, le Client s\'engage à contacter en priorité le service client d\'APILACE afin de rechercher une solution amiable. À défaut d\'accord, le Client consommateur est informé qu\'il peut recourir gratuitement à un médiateur de la consommation agréé. Le médiateur d\'APILACE est le <strong>CM2C</strong> (Centre de la Médiation de la Consommation des Conciliateurs de Justice) — 49 Rue de Ponthieu, 75008 Paris — Téléphone : 01 89 47 00 14 — E-mail : <a href="mailto:cm2c@cm2c.net">cm2c@cm2c.net</a>.</p>' +
              '<p>Le Client peut également utiliser la <a href="https://ec.europa.eu/consumers/odr/">plateforme européenne de Règlement en Ligne des Litiges (RLL)</a>. À défaut de résolution amiable ou de médiation, tout litige sera soumis aux tribunaux français compétents.</p>',
          },
        ],
      },

      // ── RGPD ────────────────────────────────────────────────────────────────────
      {
        type: 'RGPD',
        sections: [
          {
            position: 1,
            title: 'Préambule',
            content:
              '<p>Dans le cadre de son activité e-commerce de haute horlogerie, la société RAVEAU DESNOYERS MANUFACTURE HORLOGERE (ci-après dénommée « APILACE ») met en œuvre des traitements de données à caractère personnel.</p>' +
              '<p>Conformément au Règlement Général sur la Protection des Données (RGPD n°2016/679) et à la Loi Informatique et Libertés du 6 janvier 1978 modifiée, APILACE s\'engage à assurer le plus haut niveau de protection et de confidentialité pour vos données privées, une exigence indispensable dans le cadre de transactions de haute valeur.</p>',
          },
          {
            position: 2,
            title: 'Article 1 — Responsable du traitement des données',
            content:
              '<p>Le responsable du traitement des données personnelles collectées sur le Site est :</p>' +
              '<ul>' +
              '<li>Identité : Monsieur Louis DESNOYERS, en sa qualité de Président.</li>' +
              '<li>Adresse postale : 72B avenue Thabaud Boislareine, 36230 Neuvy-Saint-Sepulchre, France.</li>' +
              '<li>E-mail dédié : <a href="mailto:rgpd@apilace.com">rgpd@apilace.com</a> (ou <a href="mailto:contact@apilace.com">contact@apilace.com</a>).</li>' +
              '<li>Téléphone : 06 82 50 37 49.</li>' +
              '</ul>',
          },
          {
            position: 3,
            title: 'Article 2 — Données personnelles collectées',
            content:
              '<p>APILACE veille à ne collecter que les données strictement nécessaires au regard des finalités pour lesquelles elles sont traitées (principe de minimisation).</p>' +
              '<p><strong>1. Données que vous nous transmettez volontairement :</strong></p>' +
              '<ul>' +
              '<li><strong>Formulaire de contact :</strong> Civilité, nom, prénom, adresse e-mail, numéro de téléphone et le contenu libre de votre message.</li>' +
              '<li><strong>Utilisation du configurateur et commandes :</strong> Adresse e-mail pour l\'envoi de la configuration, puis données d\'identification (nom, prénom, téléphone) indispensables à la validation de la réservation Click &amp; Collect et à la mise en fabrication.</li>' +
              '<li><strong>Espace Membre :</strong> Identifiants de connexion, mot de passe chiffré, ou données de profil d\'authentification sociale (provenant de Google OAuth 2.0 si vous choisissez ce mode de connexion).</li>' +
              '<li><strong>Newsletter :</strong> Adresse e-mail collectée lors de votre inscription volontaire.</li>' +
              '</ul>' +
              '<p><strong>2. Données recueillies automatiquement :</strong></p>' +
              '<p>Lors de chaque connexion au site apilace.com, notre système collecte l\'adresse IP, les données de connexion (date et heure de la visite) et les données de navigation (pages consultées).</p>',
          },
          {
            position: 4,
            title: 'Article 3 — Finalités et bases légales des traitements',
            content:
              '<p>La collecte et le traitement de vos données reposent sur des bases juridiques claires et servent les finalités suivantes :</p>' +
              '<ul>' +
              '<li><strong>Exécution de mesures contractuelles et précontractuelles :</strong> Gestion de vos commandes Click &amp; Collect, suivi de la fabrication artisanale, gestion de votre espace membre et envoi des e-mails transactionnels (confirmation de commande, mise à disposition en atelier).</li>' +
              '<li><strong>Votre consentement explicite :</strong> Traitement de vos demandes via le formulaire de contact, gestion de vos abonnements à la newsletter commerciale (révocable à tout moment via l\'unsubscribe token inséré dans chaque e-mail).</li>' +
              '<li><strong>L\'intérêt légitime d\'APILACE :</strong> Sécurisation de la plateforme (lutte contre la fraude) et élaboration de statistiques de consultation anonymes pour améliorer les performances du configurateur.</li>' +
              '</ul>',
          },
          {
            position: 5,
            title: 'Article 4 — Durées de conservation des données',
            content:
              '<p>Vos données personnelles sont conservées de manière hautement sécurisée pour les durées strictement nécessaires :</p>' +
              '<ul>' +
              '<li><strong>Données de commande / Client :</strong> Conservées pendant toute la durée de la relation contractuelle, puis archivées pendant 5 ans à des fins d\'obligations légales et d\'application des garanties horlogères.</li>' +
              '<li><strong>Données du formulaire de contact (Prospects) :</strong> Supprimées ou anonymisées dans un délai maximum de 3 ans à compter du dernier échange.</li>' +
              '<li><strong>Newsletter :</strong> Conservées tant que le Client ne manifeste pas sa volonté de se désabonner.</li>' +
              '<li><strong>Données de navigation et de connexion (Statistiques) :</strong> Conservées pour une durée maximale de 14 mois.</li>' +
              '</ul>',
          },
          {
            position: 6,
            title: 'Article 5 — Partage et sécurité des données',
            content:
              '<p>Vos données personnelles sont confidentielles. APILACE s\'interdit formellement de vendre, louer ou céder vos données personnelles à des fins commerciales ou publicitaires. Au sein d\'APILACE, seules les personnes habilitées ayant un intérêt légitime à y accéder y ont effectivement accès. Pour accomplir les finalités du Site, les données sont transmises de manière chiffrée et hautement sécurisée uniquement à nos sous-traitants techniques indispensables :</p>' +
              '<ul>' +
              '<li><strong>Stripe :</strong> Infrastructure de paiement certifiée PCI-DSS pour le traitement sécurisé de l\'acompte de 30 %.</li>' +
              '<li><strong>Resend :</strong> Service de routage chiffré pour l\'acheminement de nos e-mails de service et de newsletter.</li>' +
              '<li><strong>IONOS SE :</strong> Hébergeur de notre site internet et de nos bases de données. L\'infrastructure et les serveurs sont situés physiquement en France et en Allemagne. Aucun transfert de données n\'est réalisé en dehors de l\'Union Européenne.</li>' +
              '</ul>',
          },
          {
            position: 7,
            title: 'Article 6 — Droits de la personne concernée',
            content:
              '<p>Conformément à la réglementation européenne, vous disposez des droits suivants concernant vos données personnelles : droits d\'accès, de rectification, d\'effacement (droit à l\'oubli), de limitation, d\'opposition pour motifs légitimes, et de portabilité de vos données.</p>' +
              '<p>Pour exercer vos droits, vous pouvez contacter notre Service RGPD :</p>' +
              '<ul>' +
              '<li>Par e-mail : <a href="mailto:rgpd@apilace.com">rgpd@apilace.com</a></li>' +
              '<li>Par courrier postal : APILACE – Service RGPD, 72B avenue Thabaud Boislareine, 36230 Neuvy-Saint-Sepulchre.</li>' +
              '</ul>' +
              '<p>Pour être traitée, votre demande doit impérativement spécifier vos nom, prénom, adresse e-mail, être accompagnée d\'une copie de votre pièce d\'identité (qui sera immédiatement détruite après vérification) et préciser l\'objet de votre démarche. APILACE s\'engage à y apporter la plus grande attention et à y répondre sous un mois maximum. Sans préjudice de tout autre recours, vous disposez également du droit d\'introduire une réclamation auprès de la <a href="https://www.cnil.fr">CNIL</a>.</p>',
          },
          {
            position: 8,
            title: 'Article 7 — Gestion des Cookies',
            content:
              '<p>Un cookie est un petit fichier temporaire téléchargé sur votre équipement lors de la consultation du Site.</p>' +
              '<p><strong>1. Cookies fonctionnels et de sécurité (Strictement nécessaires) :</strong> Ces cookies ont pour seule finalité de permettre ou de faciliter la navigation et de sécuriser la plateforme. Ils ne peuvent pas être désactivés :</p>' +
              '<ul>' +
              '<li><strong>CsrfToken :</strong> Garantit la sécurité des formulaires que vous remplissez en luttant contre les attaques de falsification de requêtes (Cross-Site Request Forgery).</li>' +
              '<li><strong>Cookies de session :</strong> Stockent temporairement les informations de votre contexte utilisateur et de votre configuration horlogère en cours d\'une page à l\'autre.</li>' +
              '</ul>' +
              '<p><strong>2. Cookies d\'analyse (Soumis à consentement) :</strong> Le Site implémente des outils de mesure d\'audience (Google Analytics : cookies de type _ga). Ces cookies nécessitent votre acceptation préalable via le bandeau de consentement affiché lors de votre première visite. Ils sont conservés pour une durée maximale de 13 mois. Vous pouvez à tout moment configurer votre navigateur pour bloquer les cookies tiers (via le menu Paramètres / Vie privée de Chrome, Firefox, Safari ou Edge).</p>',
          },
          {
            position: 9,
            title: 'Article 8 — Plug-ins de réseaux sociaux',
            content:
              '<p>Afin de faciliter le partage de nos garde-temps d\'exception, des extensions vers Facebook, Instagram et YouTube sont intégrées au Site. Ces plug-ins sont directement liés aux plateformes sociales concernées et peuvent déposer des cookies de traçage. APILACE n\'exerçant aucun contrôle sur les données collectées par ces fournisseurs, nous vous conseillons de consulter leurs propres politiques de confidentialité.</p>',
          },
        ],
      },
    ]

  for (const { type, sections } of legalData) {
    const page = await prisma.legalPage.upsert({
      where: { type },
      update: {},
      create: { type },
    })

    // Flush & fill — same pattern as product sections
    await prisma.legalSection.deleteMany({ where: { legalPageId: page.id } })
    await prisma.legalSection.createMany({
      data: sections.map(s => ({ ...s, legalPageId: page.id })),
    })
  }
  console.log('✅ Seed terminé')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())