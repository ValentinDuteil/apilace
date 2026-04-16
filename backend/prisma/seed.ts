import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import argon2 from 'argon2'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding...')

  // Admin
  const admin = await prisma.user.upsert({
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
    update: {},
    create: {
      name: 'M22 Collection by Apilace®',
      slug: 'm22-collection',
      description: 'Inspirée par le biomimétisme et les structures alvéolaires, la M22 est le reflet de l\'équilibre entre légèreté et robustesse.',
      price: 15000,
      isActive: true,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/apilace/image/upload/v1/products/m22-hero.jpg', isPrimary: true, position: 0 },
          { url: 'https://res.cloudinary.com/apilace/image/upload/v1/products/m22-detail.jpg', isPrimary: false, position: 1 },
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
      sections: {
        create: [
          {
            type: 'IMAGE_TEXT',
            position: 1,
            imageUrl: 'https://res.cloudinary.com/apilace/image/upload/v1/products/m22-boitier.jpg',
            textSide: 'RIGHT',
            title1: 'Boîtier',
            description1: 'Conçu par optimisation topologique, chaque gramme est justifié.',
            text2: 'Diamètre',
            desc2: '42mm',
            text3: 'Épaisseur',
            desc3: '9mm',
          },
          {
            type: 'IMAGE_TEXT',
            position: 2,
            imageUrl: 'https://res.cloudinary.com/apilace/image/upload/v1/products/m22-bracelet.jpg',
            textSide: 'LEFT',
            title1: 'Bracelet',
            description1: 'Cuir végétal tanné en France, souple et durable.',
            text2: 'Matière',
            desc2: 'Cuir vegan',
            text3: 'Taille',
            desc3: '130 à 180mm',
          },
          {
            type: 'PRODUCT_CTA',
            position: 999,
            imageUrl: 'https://res.cloudinary.com/apilace/image/upload/v1/products/m22-cta.jpg',
            textSide: 'RIGHT',
            title1: 'M22 Collection',
            description1: 'Fabriquée à la main en France. Garantie à vie.',
          }
        ]
      }
    }
  })

  // Commande
  await prisma.order.create({
    data: {
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