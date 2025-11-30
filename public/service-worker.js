// Script ini wajib ada agar browser bisa menerima notifikasi dari Pusher Beams
// walaupun tab website sedang tertutup.
importScripts("https://js.pusher.com/beams/service-worker.js");

// (Opsional) Logika tambahan saat notifikasi diterima
PusherPushNotifications.onNotificationReceived = ({ pushEvent, payload }) => {
  console.log("Notifikasi diterima dari Pusher:", payload);
  return Promise.resolve(); 
};