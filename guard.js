// Korumalı sayfalarda:  const me = await guard("student" | "teacher" | "admin");
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export function guard(role) {
  return new Promise(resolve => {
    let started = false;
    onAuthStateChanged(auth, async user => {
      if (!user) return location.replace("index.html");   // başka sekmede çıkış yapılırsa da buraya düşer
      if (started) return; started = true;
      try {
        const ref = doc(db, "users", user.uid), snap = await getDoc(ref), me = snap.data();
        if (!me) return location.replace("index.html");
        // Kullanıcı e-postasını doğrulayıp değiştirdiyse kayıt güncellenir ve yönetici uyarısı kalkar
        if (user.email && me.email !== user.email) {
          try { await updateDoc(ref, me.uyari ? { email: user.email, uyari: deleteField() } : { email: user.email }); me.email = user.email; delete me.uyari; } catch (_) {}
        }
        const home = "app.html";
        if (role === "admin") { if (me.admin !== true) return location.replace(home); }
        else {
          if (me.role === "teacher" && me.onayli !== true) return location.replace("bekle.html");
          if (role && me.role !== role) return location.replace(home);
        }
        resolve({ uid: user.uid, ...me });
      } catch (e) {
        // Sayfa sessizce "Yükleniyor…" ile kalmasın: nedenini göster
        started = false;
        if (window.S) S.show("Hesap bilgilerin okunamadı. Bağlantını kontrol edip sayfayı yenile. (" + (e.code || e.message) + ")");
      }
    });
  });
}
