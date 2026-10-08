import { db } from "./firebase.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const T = x => (x && x.toMillis ? x.toMillis() : typeof x === "number" ? x : 0);
const isPast = r => new Date(r.tarih + "T" + r.saat + ":00") < new Date();
const GUN = s => new Date(s + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

export function mountNav(me, active) {
  const home = me.role === "teacher" ? "teacher.html" : "student.html";
  const nav = document.createElement("nav"); nav.className = "nav"; nav.setAttribute("aria-label", "Bölümler");
  const badges = {};
  [["home", "Ana sayfa", home], ["akis", "Keşfet", "akis.html"], ["kisi", "Kişiler", "profil.html"], ["gorev", "Görevler", "gorevler.html"], ["program", "Program", "program.html"], ["kultur", "Kartlar", "kultur.html"], ["sohbet", "Sohbet", "sohbet.html"], ["randevu", "Randevu", "randevu.html"]].forEach(([k, t, h]) => {
    const a = document.createElement("a"); a.href = h; a.textContent = t; if (k === active) a.setAttribute("aria-current", "page");
    if (k === "sohbet" || k === "randevu") { const b = document.createElement("span"); b.className = "nbadge"; b.hidden = true; b.setAttribute("aria-hidden", "true"); a.append(b); badges[k] = [b, a, t]; }
    nav.append(a);
  });
  (document.querySelector(".top") || document.body).after(nav);
  if (active !== "sohbet") watchChat(me, badges.sohbet);
  if (active !== "randevu") watchRandevu(me, badges.randevu);
}
const setBadge = ([b, a, t], n, what) => { b.textContent = n > 9 ? "9+" : String(n); b.hidden = !n; a.setAttribute("aria-label", t + (n ? ", " + n + " " + what : "")); };
const titleCount = () => { const n = Object.values(window.__salveaBadge || {}).reduce((x, y) => x + y, 0); document.title = (n ? "(" + n + ") " : "") + (document.title.replace(/^\(\d+\) /, "")); };
const bump = (k, n) => { (window.__salveaBadge = window.__salveaBadge || {})[k] = n; titleCount(); };

// ---- Sohbet: okunmamış mesaj rozeti ve kısa bildirim
function watchChat(me, bd) {
  const seen = {}; let first = true;
  const unread = c => c.son && c.son.uid !== me.uid && T(c.sonTs) > T(c.okundu && c.okundu[me.uid]);
  const est = d => d.data({ serverTimestamps: "estimate" });
  onSnapshot(query(collection(db, "sohbetler"), where("uyeler", "array-contains", me.uid)), snap => {
    let n = 0; snap.forEach(d => { const c = est(d); if (unread(c)) n++; if (first && c.son) seen[d.id] = c.son.id; });
    setBadge(bd, n, "okunmamış"); bump("chat", n);
    if (!first) snap.docChanges().forEach(ch => { if (ch.type === "removed") return; const c = est(ch.doc); if (unread(c) && c.son.id !== seen[ch.doc.id]) { seen[ch.doc.id] = c.son.id; toast("💬 " + (c.son.ad || "Yeni mesaj"), c.son.foto ? "📷 Fotoğraf" : (c.son.metin || ""), "sohbet.html"); } });
    first = false;
  }, () => {});
}

// ---- Randevu: öğretmende bekleyen talepler, öğrencide yanıt gelen talepler
const SKEY = me => "salvea_rv_" + me.uid;
const readSeen = me => { try { return JSON.parse(localStorage.getItem(SKEY(me)) || "{}"); } catch (_) { return {}; } };
export function markRandevuSeen(me, list) { if (me.role === "teacher") return; const s = readSeen(me); list.forEach(r => s[r.id] = r.durum); try { localStorage.setItem(SKEY(me), JSON.stringify(s)); } catch (_) {} }
function watchRandevu(me, bd) {
  const col = collection(db, "randevular"), t = me.role === "teacher", last = {}; let first = true;
  const qy = t ? query(col, where("ogretmen", "==", me.uid), where("durum", "==", "bekliyor")) : query(col, where("ogrenci", "==", me.uid));
  onSnapshot(qy, snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })), seen = t ? {} : readSeen(me);
    const n = t ? rows.filter(r => !isPast(r)).length : rows.filter(r => (r.durum === "onaylandi" || r.durum === "reddedildi") && seen[r.id] !== r.durum).length;
    setBadge(bd, n, t ? "bekleyen talep" : "yeni yanıt"); bump("rv", n);
    if (!first) rows.forEach(r => {
      if (last[r.id] === r.durum) return;
      if (t && r.durum === "bekliyor") toast("📅 Yeni randevu talebi", r.ogrenciAd + " · " + GUN(r.tarih) + " " + r.saat, "randevu.html");
      if (!t && r.durum === "onaylandi") toast("✅ Randevun onaylandı", GUN(r.tarih) + " " + r.saat + (r.yanit ? " · " + r.yanit : ""), "randevu.html");
      if (!t && r.durum === "reddedildi") toast("Randevu talebin yanıtlandı", GUN(r.tarih) + " " + r.saat + (r.yanit ? " · " + r.yanit : ""), "randevu.html");
    });
    rows.forEach(r => last[r.id] = r.durum); first = false;
  }, () => {});
}

function toast(title, text, href) {
  document.querySelector(".ntoast")?.remove();
  const a = document.createElement("a"); a.className = "ntoast"; a.href = href; a.setAttribute("role", "status");
  const b = document.createElement("b"), s = document.createElement("span"); b.textContent = title; s.textContent = text; a.append(b, s); document.body.append(a); setTimeout(() => a.remove(), 7000);
}
