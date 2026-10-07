import { db } from "./firebase.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const T = x => (x && x.toMillis ? x.toMillis() : typeof x === "number" ? x : 0);

export function mountNav(me, active) {
  const home = me.role === "teacher" ? "teacher.html" : "student.html";
  const nav = document.createElement("nav"); nav.className = "nav"; nav.setAttribute("aria-label", "Bölümler");
  let badge = null;
  [["home", "Ana sayfa", home], ["gorev", "Görevler", "gorevler.html"], ["program", "Program", "program.html"], ["kultur", "Bilgi kartları", "kultur.html"], ["sohbet", "Sohbet", "sohbet.html"], ["randevu", "Randevu", "randevu.html"]].forEach(([k, t, h]) => {
    const a = document.createElement("a"); a.href = h; a.textContent = t; if (k === active) a.setAttribute("aria-current", "page");
    if (k === "sohbet") { badge = document.createElement("span"); badge.className = "nbadge"; badge.hidden = true; badge.setAttribute("aria-hidden", "true"); a.append(badge); a.dataset.t = t; }
    nav.append(a);
  });
  (document.querySelector(".top") || document.body).after(nav);
  if (badge && active !== "sohbet") watch(me, badge, badge.parentElement);
}

// Okunmamış mesajları canlı izler: Sohbet düğmesinde rozet, sekme başlığında sayı, yeni mesajda kısa bildirim
function watch(me, badge, link) {
  const base = document.title, seen = {}; let first = true;
  const unread = c => c.son && c.son.uid !== me.uid && T(c.sonTs) > T(c.okundu && c.okundu[me.uid]);
  const est = d => d.data({ serverTimestamps: "estimate" });
  onSnapshot(query(collection(db, "sohbetler"), where("uyeler", "array-contains", me.uid)), snap => {
    let n = 0; snap.forEach(d => { const c = est(d); if (unread(c)) n++; if (first && c.son) seen[d.id] = c.son.id; });
    badge.textContent = n > 9 ? "9+" : String(n); badge.hidden = !n;
    link.setAttribute("aria-label", "Sohbet" + (n ? ", " + n + " okunmamış" : ""));
    document.title = (n ? "(" + n + ") " : "") + base;
    if (!first) snap.docChanges().forEach(ch => {
      if (ch.type === "removed") return;
      const c = est(ch.doc);
      if (unread(c) && c.son.id !== seen[ch.doc.id]) { seen[ch.doc.id] = c.son.id; toast(c); }
    });
    first = false;
  }, () => {});
}

function toast(c) {
  document.querySelector(".ntoast")?.remove();
  const a = document.createElement("a"); a.className = "ntoast"; a.href = "sohbet.html"; a.setAttribute("role", "status");
  const b = document.createElement("b"), s = document.createElement("span");
  b.textContent = "💬 " + (c.son.ad || "Yeni mesaj"); s.textContent = c.son.foto ? "📷 Fotoğraf" : (c.son.metin || "");
  a.append(b, s); document.body.append(a); setTimeout(() => a.remove(), 6000);
}
