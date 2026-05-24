// email.utils.ts — Centralized email service for Apilace
// 6 transactional templates sent via Resend:
//   1. sendOrderConfirmation  — client, on PAID
//   2. sendOrderReady         — client, on READY
//   3. sendRefundConfirmation — client, on REFUNDED
//   4. sendPasswordReset      — client, on forgot password
//   5. sendCancellationNotification — admin, on client cancellation
//   6. sendInvoiceRequest     — admin, on client invoice request
//
// All functions are fail-safe: a Resend error is logged but never re-thrown.
// Email failures must not interrupt the main business flow.

import { resend } from '../lib/resend.js'

// ─── Config ───────────────────────────────────────────────────────────────────

// Must match a domain verified in the Resend dashboard
const FROM = `Apilace <${process.env.RESEND_FROM_EMAIL ?? 'noreply@apilace.com'}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'contact@apilace.com'
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5178'
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3008'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailOrderItem {
  productName: string
  size: string
  quantity: number
  unitPrice: number
}

export interface EmailStore {
  name: string
  address: string
  city: string
  postalCode: string
}

export interface OrderConfirmationData {
  orderId: number
  firstName: string | null
  items: EmailOrderItem[]
  totalAmount: number
  store: EmailStore
}

export interface OrderReadyData {
  orderId: number
  firstName: string | null
  store: EmailStore
}

export interface RefundConfirmationData {
  orderId: number
  firstName: string | null
  totalAmount: number
}

export interface PasswordResetData {
  firstName: string | null
  resetToken: string
}

export interface CancellationNotificationData {
  orderId: number
  clientEmail: string
  clientName: string
}

export interface InvoiceRequestData {
  orderId: number
  clientEmail: string
  clientName: string
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

// Wraps any email content in the shared Apilace branded layout.
// Note: custom fonts (CenturySchoolbook) are not used — email clients strip @font-face.
// Georgia is the closest system serif that preserves the brand's editorial tone.
function baseLayout(title: string, bodyContent: string): string {
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td style="padding:40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid rgba(33,37,41,0.10);">

          <!-- ─ Header ──────────────────────────────────────────────────────── -->
          <tr>
            <td style="padding:32px 40px;border-bottom:2px solid #957d4c;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:600;color:#212529;letter-spacing:3px;text-transform:uppercase;">
                APILACE
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#957d4c;letter-spacing:2px;text-transform:uppercase;">
                Horlogerie de luxe
              </p>
            </td>
          </tr>

          <!-- ─ Body ───────────────────────────────────────────────────────── -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- ─ Footer ─────────────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#f8f9fa;padding:24px 40px;border-top:1px solid rgba(33,37,41,0.10);text-align:center;">
              <p style="margin:0;font-size:12px;color:#6c757d;">
                © ${year} Apilace — Tous droits réservés
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#adb5bd;">
                Vous recevez cet email suite à une action effectuée sur apilace.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Section label in gold — mirrors the admin UI visual hierarchy
function sectionLabel(text: string): string {
  return `<p style="margin:0 0 12px;font-size:10px;font-weight:600;color:#957d4c;letter-spacing:2px;text-transform:uppercase;">
    ${text}
  </p>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid rgba(33,37,41,0.10);margin:28px 0;">`
}

// Gold CTA button — consistent with the site's .login-modal-btn style
function ctaButton(label: string, href: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding-top:8px;">
        <a href="${href}"
           style="display:inline-block;background-color:#957d4c;color:#ffffff;text-decoration:none;
                  font-family:Georgia,serif;font-size:12px;font-weight:600;letter-spacing:2px;
                  text-transform:uppercase;padding:13px 32px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

// ─── 1. Order confirmation (PAID) — sent to client ───────────────────────────

export async function sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<void> {
  const greeting = data.firstName ? `Merci pour votre commande, ${data.firstName}.` : 'Merci pour votre commande.'

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(33,37,41,0.06);">
        <p style="margin:0;font-size:14px;color:#212529;">${item.productName}</p>
        <p style="margin:3px 0 0;font-size:12px;color:#6c757d;">Réf. ${item.size} · Quantité : ${item.quantity}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(33,37,41,0.06);text-align:right;vertical-align:top;white-space:nowrap;padding-left:16px;">
        <p style="margin:0;font-size:14px;color:#212529;">${formatPrice(item.unitPrice)}</p>
      </td>
    </tr>`).join('')

  const body = `
    <p style="margin:0 0 6px;font-size:20px;color:#212529;">${greeting}</p>
    <p style="margin:0 0 32px;font-size:14px;color:#6c757d;line-height:1.6;">
      Votre paiement a bien été reçu. Retrouvez ci-dessous le récapitulatif de votre commande.
    </p>

    ${sectionLabel('Commande n°' + data.orderId)}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${itemRows}
      <tr>
        <td style="padding-top:16px;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#212529;">Total payé</p>
        </td>
        <td style="padding-top:16px;text-align:right;padding-left:16px;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#957d4c;">${formatPrice(data.totalAmount)}</p>
        </td>
      </tr>
    </table>

    ${divider()}

    ${sectionLabel('Point de retrait')}
    <p style="margin:0;font-size:14px;color:#212529;">${data.store.name}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#6c757d;">${data.store.address}, ${data.store.postalCode} ${data.store.city}</p>
    <p style="margin:16px 0 0;font-size:13px;color:#6c757d;line-height:1.6;">
      Vous recevrez un email dès que votre montre sera disponible en boutique.
    </p>

    ${divider()}

    ${ctaButton('Suivre ma commande', `${FRONTEND_URL}/mon-compte/commandes/${data.orderId}`)}`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Apilace — Confirmation de commande #${data.orderId}`,
      html: baseLayout(`Confirmation de commande #${data.orderId}`, body),
    })
  } catch (error) {
    console.error(`[email] sendOrderConfirmation failed for order #${data.orderId}:`, error)
  }
}

// ─── 2. Order ready (READY) — sent to client ─────────────────────────────────

export async function sendOrderReady(to: string, data: OrderReadyData): Promise<void> {
  const greeting = data.firstName ? `${data.firstName}, votre montre est prête.` : 'Votre montre est prête.'

  const body = `
    <p style="margin:0 0 6px;font-size:20px;color:#212529;">${greeting}</p>
    <p style="margin:0 0 32px;font-size:14px;color:#6c757d;line-height:1.6;">
      Votre commande n°${data.orderId} est disponible en boutique. Vous pouvez venir la récupérer aux horaires d'ouverture.
    </p>

    ${sectionLabel('Votre point de retrait')}
    <p style="margin:0;font-size:14px;color:#212529;">${data.store.name}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#6c757d;">${data.store.address}, ${data.store.postalCode} ${data.store.city}</p>

    ${divider()}

    ${ctaButton('Voir ma commande', `${FRONTEND_URL}/mon-compte/commandes/${data.orderId}`)}`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Apilace — Votre commande #${data.orderId} est prête`,
      html: baseLayout(`Commande #${data.orderId} prête`, body),
    })
  } catch (error) {
    console.error(`[email] sendOrderReady failed for order #${data.orderId}:`, error)
  }
}

// ─── 3. Refund confirmation — sent to client ──────────────────────────────────

export async function sendRefundConfirmation(to: string, data: RefundConfirmationData): Promise<void> {
  const greeting = data.firstName ? `${data.firstName}, votre remboursement a été initié.` : 'Votre remboursement a été initié.'

  const body = `
    <p style="margin:0 0 6px;font-size:20px;color:#212529;">${greeting}</p>
    <p style="margin:0 0 32px;font-size:14px;color:#6c757d;line-height:1.6;">
      Le remboursement de votre commande n°${data.orderId} d'un montant de <strong style="color:#212529;">${formatPrice(data.totalAmount)}</strong> a bien été initié. Il sera recrédité sur votre moyen de paiement d'origine sous 5 à 10 jours ouvrés selon votre banque.
    </p>

    ${divider()}

    <p style="margin:0;font-size:13px;color:#6c757d;text-align:center;line-height:1.6;">
      Pour toute question, contactez-nous à
      <a href="mailto:contact@apilace.com" style="color:#957d4c;text-decoration:none;">contact@apilace.com</a>
    </p>`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Apilace — Remboursement de la commande #${data.orderId}`,
      html: baseLayout(`Remboursement commande #${data.orderId}`, body),
    })
  } catch (error) {
    console.error(`[email] sendRefundConfirmation failed for order #${data.orderId}:`, error)
  }
}

// ─── 4. Password reset — sent to client ───────────────────────────────────────

export async function sendPasswordReset(to: string, data: PasswordResetData): Promise<void> {
  const resetLink = `${FRONTEND_URL}/reinitialisation/${data.resetToken}`
  const greeting = data.firstName ? `${data.firstName}, réinitialisez votre mot de passe.` : 'Réinitialisation de votre mot de passe.'

  const body = `
    <p style="margin:0 0 6px;font-size:20px;color:#212529;">${greeting}</p>
    <p style="margin:0 0 32px;font-size:14px;color:#6c757d;line-height:1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous — ce lien est valable <strong style="color:#212529;">15 minutes</strong>.
    </p>

    ${ctaButton('Réinitialiser mon mot de passe', resetLink)}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#adb5bd;text-align:center;line-height:1.6;">
      Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.<br>
      Votre mot de passe restera inchangé.
    </p>`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Apilace — Réinitialisation de votre mot de passe',
      html: baseLayout('Réinitialisation de mot de passe', body),
    })
  } catch (error) {
    console.error(`[email] sendPasswordReset failed for ${to}:`, error)
  }
}

// ─── 5. Cancellation notification — sent to admin ────────────────────────────

export async function sendCancellationNotification(data: CancellationNotificationData): Promise<void> {
  const body = `
    <p style="margin:0 0 6px;font-size:20px;color:#212529;">Annulation de commande</p>
    <p style="margin:0 0 32px;font-size:14px;color:#6c757d;line-height:1.6;">
      Un client a annulé sa commande. Aucune action immédiate requise — la commande est passée au statut ANNULÉE.
    </p>

    ${sectionLabel('Détails de la commande')}
    <p style="margin:0;font-size:14px;color:#212529;">Commande <strong>#${data.orderId}</strong></p>
    <p style="margin:4px 0 0;font-size:13px;color:#6c757d;">${data.clientName}</p>
    <p style="margin:2px 0 0;font-size:13px;">
      <a href="mailto:${data.clientEmail}" style="color:#957d4c;text-decoration:none;">${data.clientEmail}</a>
    </p>

    ${divider()}

    ${ctaButton('Voir la commande', `${FRONTEND_URL}/admin/commandes/${data.orderId}`)}`

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Apilace — Annulation commande #${data.orderId}`,
      html: baseLayout(`Annulation commande #${data.orderId}`, body),
    })
  } catch (error) {
    console.error(`[email] sendCancellationNotification failed for order #${data.orderId}:`, error)
  }
}

// ─── 6. Invoice request — sent to admin ──────────────────────────────────────

export async function sendInvoiceRequest(data: InvoiceRequestData): Promise<void> {
  const body = `
    <p style="margin:0 0 6px;font-size:20px;color:#212529;">Demande de facture</p>
    <p style="margin:0 0 32px;font-size:14px;color:#6c757d;line-height:1.6;">
      Un client souhaite recevoir la facture de sa commande. Pensez à la lui transmettre par email.
    </p>

    ${sectionLabel('Détails de la commande')}
    <p style="margin:0;font-size:14px;color:#212529;">Commande <strong>#${data.orderId}</strong></p>
    <p style="margin:4px 0 0;font-size:13px;color:#6c757d;">${data.clientName}</p>
    <p style="margin:2px 0 0;font-size:13px;">
      <a href="mailto:${data.clientEmail}" style="color:#957d4c;text-decoration:none;">${data.clientEmail}</a>
    </p>

    ${divider()}

    ${ctaButton('Voir la commande', `${FRONTEND_URL}/admin/commandes/${data.orderId}`)}`

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Apilace — Demande de facture commande #${data.orderId}`,
      html: baseLayout(`Demande de facture #${data.orderId}`, body),
    })
  } catch (error) {
    console.error(`[email] sendInvoiceRequest failed for order #${data.orderId}:`, error)
  }
}

// ─── 7. Newsletter subscription confirmation — sent to subscriber ─────────────

export async function sendNewsletterConfirmation(to: string, unsubscribeToken: string): Promise<void> {
  const unsubscribeLink = `${BACKEND_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`

  const body = `
    <p style="margin:0 0 6px;font-size:20px;color:#212529;">Bienvenue dans l'univers Apilace.</p>
    <p style="margin:0 0 32px;font-size:14px;color:#6c757d;line-height:1.6;">
      Vous êtes désormais abonné à notre newsletter. Nous vous tiendrons informé en exclusivité
      de nos nouveautés, événements et actualités horlogères.
    </p>

    ${divider()}

    <p style="margin:0;font-size:12px;color:#adb5bd;text-align:center;line-height:1.6;">
      Vous recevez cet email car vous vous êtes inscrit sur apilace.com.<br>
      <a href="${unsubscribeLink}" style="color:#adb5bd;text-decoration:underline;">
        Se désinscrire
      </a>
    </p>`

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Apilace — Confirmation d\'inscription à la newsletter',
      html: baseLayout('Inscription newsletter', body),
    })
  } catch (error) {
    console.error(`[email] sendNewsletterConfirmation failed for ${to}:`, error)
  }
}