import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const cache = new Map();
// Bir öğrencinin profilini ve (izin varsa) fotoğrafını getirir. Erişim yoksa {denied:true} döner.
export function getProfile(uid, asTeacher) {
  const k = uid + (asTeacher ? "|t" : "");
  if (!cache.has(k)) cache.set(k, (async () => {
    let p; try { const s = await getDoc(doc(db, "profiller", uid)); if (!s.exists()) return { empty: true }; p = s.data(); } catch (_) { return { denied: true }; }
    let foto = null;
    if (asTeacher || p.fotoPaylas) { try { const f = await getDoc(doc(db, "fotolar", uid)); if (f.exists()) foto = f.data().foto; } catch (_) {} }
    return { ...p, foto };
  })());
  return cache.get(k);
}
export const initial = n => (n || "?").trim().charAt(0).toLocaleUpperCase("tr");
export function setAvatar(box, foto, name) {
  box.replaceChildren();
  if (foto) { const i = document.createElement("img"); i.src = foto; i.alt = ""; box.append(i); } else box.textContent = initial(name);
}
