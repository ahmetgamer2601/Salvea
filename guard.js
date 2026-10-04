// Korumalı sayfalarda:  const me = await guard("student" | "teacher" | "admin");
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export function guard(role) {
  return new Promise(resolve => {
    onAuthStateChanged(auth, async user => {
      if (!user) return location.replace("index.html");
      const snap = await getDoc(doc(db, "users", user.uid));
      const me = snap.data();
      if (!me) return location.replace("index.html");
      const home = me.role === "teacher" ? "teacher.html" : "student.html";
      if (role === "admin") { if (me.admin !== true) return location.replace(home); }
      else {
        if (me.role === "teacher" && me.onayli !== true) return location.replace("bekle.html");
        if (role && me.role !== role) return location.replace(home);
      }
      resolve({ uid: user.uid, ...me });
    });
  });
}