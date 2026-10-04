import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDp54kneKobJg55zhTgV4Bt2t6TBPqvDc",
  authDomain: "salvea-7583c.firebaseapp.com",
  projectId: "salvea-7583c",
  storageBucket: "salvea-7583c.firebasestorage.app",
  messagingSenderId: "721321009915",
  appId: "1:721321009915:web:baeb8c28d84ecc47e3c65e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
