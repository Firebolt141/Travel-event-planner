import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDRKayzpNwn12eaY7PB1yYUoKf_09T0axE",
  authDomain: "event-planner-9f4df.firebaseapp.com",
  projectId: "event-planner-9f4df",
  storageBucket: "event-planner-9f4df.firebasestorage.app",
  messagingSenderId: "588739955577",
  appId: "1:588739955577:web:77faf6871ceaffab86bda8D",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
