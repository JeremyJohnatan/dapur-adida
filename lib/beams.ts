import PushNotifications from "@pusher/push-notifications-server";

// Pastikan variabel environment ini sudah ada di .env kamu
export const beamsClient = new PushNotifications({
  instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
  secretKey: process.env.PUSHER_BEAMS_SECRET_KEY!,
});