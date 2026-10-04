import { auth, db } from "./firebase.js";
import { verifyBeforeUpdateEmail } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const ERR = { "auth/requires-recent-login": "Güvenlik için çıkış yapıp yeniden giriş yap, sonra tekrar dene.", "auth/email-already-in-use": "Bu e-posta başka bir hesapta kullanılıyor.", "auth/invalid-email": "E-posta adresi geçersiz.", "auth/network-request-failed": "İnternet bağlantını kontrol et." };

// E-posta değiştirme formunu verilen kutuya kurar
export function mountEmail(box, uid) {
  const f = document.createElement("form"); f.noValidate = true;
  f.innerHTML = '<div class="f"><label>Yeni e-posta adresi</label><input type="email" autocomplete="email"></div><button class="btn" type="submit">Doğrulama bağlantısı gönder</button><div class="msg" role="status"></div><small class="hint">Yeni adrese bir bağlantı göndeririz. Bağlantıya tıklayınca e-postan değişir; sonra yeni adresinle giriş yaparsın.</small>';
  const inp = f.querySelector("input"), btn = f.querySelector("button"), msg = f.querySelector(".msg");
  const say = (t, ok) => { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "err"); };
  f.onsubmit = async e => {
    e.preventDefault();
    const v = inp.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { inp.classList.add("bad"); return say("Geçerli bir e-posta adresi yaz."); }
    btn.disabled = true;
    try {
      await verifyBeforeUpdateEmail(auth.currentUser, v);
      if (uid) { try { await updateDoc(doc(db, "users", uid), { uyari: deleteField() }); } catch (_) {} }
      say(v + " adresine doğrulama bağlantısı gönderdik. Spam klasörüne de bak.", true);
    } catch (err) { say(ERR[err.code] || "Gönderilemedi: " + (err.code || err.message)); }
    btn.disabled = false;
  };
  box.replaceChildren(f);
}

// Yönetici bir uyarı bıraktıysa sayfanın üstünde gösterir
export function warnBanner(me) {
  if (!me.uyari) return;
  const host = document.querySelector(".shell, .card"); if (!host) return;
  const b = document.createElement("div"); b.className = "warnin";
  const p = document.createElement("p"); p.textContent = me.uyari;
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "link"; btn.textContent = "E-postamı değiştir";
  const box = document.createElement("div"); box.hidden = true; box.style.marginTop = "12px";
  btn.onclick = () => { if (!box.childElementCount) mountEmail(box, me.uid); box.hidden = !box.hidden; };
  b.append(p, btn, box); host.prepend(b);
}