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
    where: { email: 'admin@apilace.com' },
    update: {},
    create: {
      email: 'admin@apilace.com',
      passwordHash: await argon2.hash('Admin1234!'),
      firstName: 'Louis',
      lastName: 'Desnoyers',
      phone: '+33600000000',
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
    update: {},
    create: {
      name: 'Paris 8e — Galerie Joséphine',
      address: '12 rue du Faubourg Saint-Honoré',
      city: 'Paris',
      postalCode: '75008',
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
      },
    ]
  })

  // Commande — upsert pour éviter le conflit sur stripeSessionId
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

  // Pages légales
  for (const type of ['CGV', 'RGPD', 'MENTIONS_LEGALES'] as const) {
    await prisma.legalPage.upsert({
      where: { type },
      update: {},
      create: { type, content: `Contenu ${type} à rédiger.` }
    })
  }

  console.log('✅ Seed terminé')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())