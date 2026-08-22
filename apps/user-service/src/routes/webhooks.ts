import express, { Router, type Request, type Response } from 'express';
import { verifyWebhook } from '@clerk/express/webhooks';
import { prisma } from '@biashara-mall/prisma';
import { sendLog } from '@biashara-mall/kafka';

export const webhooksRouter: Router = Router();

// Clerk sends an email-less user only in exotic setups (phone-only sign-up),
// but User.email is @unique and required, so fall back rather than 500.
// A thrown error here would put Clerk into an indefinite retry loop.
function primaryEmail(data: {
  id: string;
  email_addresses?: { id?: string; email_address: string }[];
  primary_email_address_id?: string | null;
}) {
  const addresses = data.email_addresses ?? [];
  const primary =
    addresses.find((e) => e.id === data.primary_email_address_id) ??
    addresses[0];
  return primary?.email_address ?? `${data.id}@no-email.local`;
}

function fullName(data: { first_name?: string | null; last_name?: string | null }) {
  const name = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim();
  return name.length > 0 ? name : null;
}

// express.raw is required: signature verification needs the unparsed bytes.
webhooksRouter.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    let evt;
    try {
      evt = await verifyWebhook(req);
    } catch (err) {
      console.error('[clerk-webhook] verification failed:', err);
      return res.status(400).send('Error verifying webhook');
    }

    try {
      switch (evt.type) {
        case 'user.created':
        case 'user.updated': {
          const email = primaryEmail(evt.data);
          const name = fullName(evt.data);
          const avatarUrl = evt.data.image_url ?? null;

          // The very first user to register becomes the platform admin.
          const isFirstUser = (await prisma.user.count()) === 0;

          await prisma.user.upsert({
            where: { clerkId: evt.data.id },
            create: {
              clerkId: evt.data.id,
              email,
              name,
              avatarUrl,
              ...(isFirstUser && { role: 'admin' as const }),
            },
            // role is intentionally not updated: admin promotion is managed
            // in the admin dashboard, not by Clerk profile edits.
            update: { email, name, avatarUrl, deletedAt: null },
          });
          void sendLog({
            type: 'info',
            message: `Clerk ${evt.type}: ${email}`,
            source: 'user-service',
          });
          break;
        }

        case 'user.deleted': {
          if (!evt.data.id) break;
          await prisma.user.updateMany({
            where: { clerkId: evt.data.id },
            data: { deletedAt: new Date() },
          });
          break;
        }

        case 'organization.updated': {
          // updateMany, not upsert: the Shops row is created by seller-service
          // once the seller submits shop-details. Creating it here would let a
          // seller past requireShop's "finish onboarding first" gate with a
          // shop that has no address or category.
          await prisma.shops.updateMany({
            where: { clerkOrgId: evt.data.id },
            data: { name: evt.data.name },
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      // 5xx tells Svix to retry: correct for a transient DB failure.
      console.error(`[clerk-webhook] handling ${evt.type} failed:`, err);
      return res.status(500).send('Error handling webhook');
    }

    return res.send('Webhook received');
  },
);
