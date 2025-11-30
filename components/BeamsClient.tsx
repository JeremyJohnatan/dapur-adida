"use client";

import { useEffect } from "react";
import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { useSession } from "next-auth/react";

export default function BeamsClient() {
  const { data: session } = useSession();

  useEffect(() => {
    // Jangan jalankan jika belum login atau tidak di browser
    if (!session?.user || typeof window === 'undefined') return;

    const initBeams = async () => {
      try {
        const beamsClient = new PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        });

        // 1. Mulai service beams (Minta izin notifikasi ke browser)
        await beamsClient.start();

        // 2. Tentukan Interest (Topik Langganan)
        // Admin subscribe ke "admin-global" untuk terima notifikasi semua order
        // Customer subscribe ke ID mereka sendiri "user-{id}" untuk balasan chat
        if (session.user.role === "ADMIN") {
          await beamsClient.addDeviceInterest("admin-global");
          console.log("Beams: Admin registered to admin-global");
        } else {
          const interest = `user-${session.user.id}`;
          await beamsClient.addDeviceInterest(interest);
          console.log(`Beams: Customer registered to ${interest}`);
        }

      } catch (error) {
        console.error("Gagal setup Beams:", error);
      }
    };

    initBeams();
  }, [session]);

  return null; // Komponen ini invisible (tidak merender UI)
}