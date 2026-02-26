import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// VAPID 설정 (런타임에 lazy 초기화)
let vapidConfigured = false;
function ensureVapidConfig() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails('mailto:saeuggang77@gmail.com', publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!ensureVapidConfig()) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload)
          );
        } catch (error: any) {
          // 410 Gone or 404: subscription expired, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          throw error;
        }
      })
    );

    return results;
  } catch (error) {
    console.error('Push notification error:', error);
  }
}
