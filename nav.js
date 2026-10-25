import { auth, db } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const T = x => (x && x.toMillis ? x.toMillis() : typeof x === "number" ? x : 0);
const isPast = r => new Date(r.tarih + "T" + r.saat + ":00") < new Date();
const GUN = s => new Date(s + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

// Simgeler (24x24 çizgi stili)
const IC = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  akis: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  gorev: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  sohbet: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  kisi: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  randevu: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  program: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  kultur: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'
};
const svg = k => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + IC[k] + "</svg>";

// Rozetler: aynı sayı hem alttaki düğmede hem açılır menüdeki satırda görünür
const hosts = { sohbet: [], randevu: [] };
function addBadge(key, host, label) { const b = el("span", "nbadge"); b.hidden = true; b.setAttribute("aria-hidden", "true"); host.append(b); host.dataset.label = label; hosts[key].push([b, host]); }
const setBadge = (key, n, what) => hosts[key].forEach(([b, h]) => { b.textContent = n > 9 ? "9+" : String(n); b.hidden = !n; h.setAttribute("aria-label", h.dataset.label + (n ? ", " + n + " " + what : "")); });
const titleCount = () => { const n = Object.values(window.__salveaBadge || {}).reduce((x, y) => x + y, 0); document.title = (n ? "(" + n + ") " : "") + (document.title.replace(/^\(\d+\) /, "")); };
const bump = (k, n) => { (window.__salveaBadge = window.__salveaBadge || {})[k] = n; titleCount(); };

/* Gezinme: 4 ana sayfa altta (geniş ekranda solda), geri kalanlar "Menü"nün içinde.
   Öğrenci: Ana sayfa · Keşfet · Görevler · Sohbet · Menü (Kişiler, Program, Randevu, Bilgi kartları, Çıkış)
   Öğretmen: Panel · Görevler · Sohbet · Randevu · Menü (Keşfet, Kişiler, Program, Bilgi kartları, Çıkış) */
export function mountNav(me, active) {
  if (document.querySelector(".dock")) return;
  const t = me.role === "teacher", home = t ? "teacher.html" : "student.html";
  const P = {
    home: [t ? "Panel" : "Ana sayfa", home, ""],
    akis: ["Keşfet", "akis.html", "Günün kartları ve yeni fikirler"],
    kisi: ["Kişiler", "profil.html", "Okuldakilerle tanış"],
    gorev: ["Görevler", "gorevler.html", ""],
    program: ["Program", "program.html", "Ders ve çalışma planın"],
    kultur: ["Bilgi kartları", "kultur.html", "Öğren, eğlen, tekrar et"],
    sohbet: ["Sohbet", "sohbet.html", ""],
    randevu: ["Randevu", "randevu.html", t ? "Randevuları yönet" : "Rehber öğretmenle görüş"]
  };
  const prim = t ? ["home", "gorev", "sohbet", "randevu"] : ["home", "akis", "gorev", "sohbet"];
  const more = t ? ["akis", "kisi", "program", "kultur"] : ["kisi", "program", "randevu", "kultur"];

  const dock = el("nav", "dock"); dock.setAttribute("aria-label", "Ana gezinme");
  prim.forEach(k => {
    const a = el("a", "dk"); a.href = P[k][1]; a.innerHTML = svg(k) + "<span>" + P[k][0] + "</span>";
    if (k === active) a.setAttribute("aria-current", "page");
    if (k in hosts) addBadge(k, a, P[k][0]);
    dock.append(a);
  });

  const mb = el("button", "dk mm"); mb.type = "button"; mb.innerHTML = svg("more") + "<span>Menü</span>";
  mb.setAttribute("aria-haspopup", "true"); mb.setAttribute("aria-expanded", "false"); mb.setAttribute("aria-controls", "navsheet");
  if (more.includes(active)) mb.setAttribute("aria-current", "page");
  if (more.includes("randevu")) addBadge("randevu", mb, "Menü");

  const sheet = el("div", "sheet"); sheet.id = "navsheet"; sheet.hidden = true; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-label", "Menü");
  const who = el("div", "sh-me"), nm = el("b"), sc = el("small");
  nm.textContent = t ? me.ad + " " + me.soyad : (me.takmaAd || me.ad); sc.textContent = me.okul || ""; who.append(nm, sc); sheet.append(who);
  more.forEach(k => {
    const a = el("a", "sh-i"); a.href = P[k][1]; a.innerHTML = svg(k) + "<span><b>" + P[k][0] + "</b><small>" + P[k][2] + "</small></span>";
    if (k === active) a.setAttribute("aria-current", "page");
    if (k in hosts) addBadge(k, a, P[k][0]);
    sheet.append(a);
  });
  const out = el("button", "sh-i out"); out.type = "button"; out.innerHTML = svg("out") + "<span><b>Çıkış yap</b></span>"; sheet.append(out);

  const scrim = el("div", "scrim"); scrim.hidden = true;
  const close = back => { sheet.hidden = scrim.hidden = true; mb.setAttribute("aria-expanded", "false"); if (back) mb.focus(); };
  const open = () => { sheet.hidden = scrim.hidden = false; mb.setAttribute("aria-expanded", "true"); const f = sheet.querySelector("a"); if (f) f.focus(); };
  mb.onclick = () => sheet.hidden ? open() : close(true);
  scrim.onclick = () => close(false);
  sheet.addEventListener("click", e => { if (e.target.closest("a")) close(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) close(true); });
  out.onclick = async () => { out.disabled = true; try { await signOut(auth); } catch (_) {} location.replace("index.html"); };

  dock.append(mb);
  document.body.classList.add("hasdock");
  document.body.append(dock, scrim, sheet);
  // Başlıktaki eski "Çıkış yap" düğmesi artık Menü'de; kalabalık yapmasın
  document.querySelectorAll(".top .btn").forEach(b => { if (/çıkış/i.test(b.textContent)) b.hidden = true; });

  if (active !== "sohbet") watchChat(me);
  if (active !== "randevu") watchRandevu(me);
}

// ---- Sohbet: okunmamış mesaj rozeti ve kısa bildirim
function watchChat(me) {
  const seen = {}; let first = true;
  const unread = c => c.son && c.son.uid !== me.uid && T(c.sonTs) > T(c.okundu && c.okundu[me.uid]);
  const est = d => d.data({ serverTimestamps: "estimate" });
  onSnapshot(query(collection(db, "sohbetler"), where("uyeler", "array-contains", me.uid)), snap => {
    let n = 0; snap.forEach(d => { const c = est(d); if (unread(c)) n++; if (first && c.son) seen[d.id] = c.son.id; });
    setBadge("sohbet", n, "okunmamış"); bump("chat", n);
    if (!first) snap.docChanges().forEach(ch => { if (ch.type === "removed") return; const c = est(ch.doc); if (unread(c) && c.son.id !== seen[ch.doc.id]) { seen[ch.doc.id] = c.son.id; toast("💬 " + (c.son.ad || "Yeni mesaj"), c.son.foto ? "📷 Fotoğraf" : (c.son.metin || ""), "sohbet.html"); } });
    first = false;
  }, () => {});
}

// ---- Randevu: öğretmende bekleyen talepler, öğrencide yanıt gelen talepler
const SKEY = me => "salvea_rv_" + me.uid;
const readSeen = me => { try { return JSON.parse(localStorage.getItem(SKEY(me)) || "{}"); } catch (_) { return {}; } };
export function markRandevuSeen(me, list) { if (me.role === "teacher") return; const s = readSeen(me); list.forEach(r => s[r.id] = r.durum); try { localStorage.setItem(SKEY(me), JSON.stringify(s)); } catch (_) {} }
function watchRandevu(me) {
  const col = collection(db, "randevular"), t = me.role === "teacher", last = {}; let first = true;
  const qy = t ? query(col, where("ogretmen", "==", me.uid), where("durum", "==", "bekliyor")) : query(col, where("ogrenci", "==", me.uid));
  onSnapshot(qy, snap => {
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })), seen = t ? {} : readSeen(me);
    const n = t ? rows.filter(r => !isPast(r)).length : rows.filter(r => (r.durum === "onaylandi" || r.durum === "reddedildi") && seen[r.id] !== r.durum).length;
    setBadge("randevu", n, t ? "bekleyen talep" : "yeni yanıt"); bump("rv", n);
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
  const a = el("a", "ntoast"); a.href = href; a.setAttribute("role", "status");
  const b = el("b"), s = el("span"); b.textContent = title; s.textContent = text; a.append(b, s); document.body.append(a); setTimeout(() => a.remove(), 7000);
}
