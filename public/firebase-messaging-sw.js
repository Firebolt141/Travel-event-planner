importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDRKayzpNwn12eaY7PB1yYUoKf_09T0axE",
  authDomain: "event-planner-9f4df.firebaseapp.com",
  projectId: "event-planner-9f4df",
  storageBucket: "event-planner-9f4df.firebasestorage.app",
  messagingSenderId: "588739955577",
  appId: "1:588739955577:web:77faf6871ceaffab86bda8D",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Reminder";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icon.png",
  };
  self.registration.showNotification(title, options);
});
