import cron from 'node-cron';
import { prisma } from '@biashara-mall/prisma';
import { imagekit } from '../lib/imagekit';

/**
 * Products soft-deleted more than PRODUCT_PURGE_DELAY_MS ago (deletedAt is set
 * to the purge deadline at delete time) are removed for real, ImageKit files
 * included. Runs hourly.
 */
async function purgeExpiredProducts() {
  const expired = await prisma.product.findMany({
    where: { isDeleted: true, deletedAt: { lte: new Date() } },
    include: { images: true },
  });
  if (!expired.length) return;

  for (const product of expired) {
    for (const image of product.images) {
      try {
        await imagekit.deleteFile(image.fileId);
      } catch (err) {
        console.error(`purge: ImageKit delete failed for ${image.fileId}`, err);
      }
    }
    await prisma.images.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }

  console.log(`purge: removed ${expired.length} expired product(s)`);
}

cron.schedule('0 * * * *', () => {
  purgeExpiredProducts().catch((err) => console.error('purge failed', err));
});
