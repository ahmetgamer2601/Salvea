// Görünüm: sohbet (app.js yönlendiricisi tarafından yüklenir)
import { db } from "../firebase.js";
import { resizeFit } from "../foto.js";
import { SORULAR } from "../veri.js";
import { ayarYukle, ayar, ayarKaydet, temaUygula, TEMALAR, BALONLAR, yerelOkundu, yerelOkunduYaz } from "../ayar.js";
import { bildir } from "../push.js";
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, writeBatch, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const P = {
  plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="M19 12H5M12 19l-7-7 7-7"/>', more: '<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>', image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>', check2: '<path d="M2 12.5l4.5 4.5L16 7.5"/><path d="M9.5 15.5l1.5 1.5L21 7"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  reply: '<path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>', copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3a4.9 4.9 0 0 0 4.7-5C22 5.6 17.5 2 12 2z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', down: '<path d="M6 9l6 6 6-6"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="12" cy="12" r="1.2"/>'
};
const ic = (k, c = "") => '<svg class="i ' + c + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + P[k] + "</svg>";

export const html = `<div class="app" id="app">
<aside class="side">
<div class="sh"><b>Sohbetler</b><button class="ib" id="newb" type="button" aria-label="Yeni mesaj" title="Yeni mesaj">${ic("plus")}</button></div>
<div class="newp" id="newp" hidden></div>
<div id="clist" class="clist"></div>
</aside>
<section class="main">
<div class="emptym" id="emp"><div class="eic">${ic("chat")}</div><b>Bir sohbet seç</b><p>Ya da sağ üstteki artı ile yeni bir mesaj başlat.</p><small>Rehber öğretmenle yazışabilir, takım sohbetine katılabilirsin.</small></div>
<div class="chat" id="chat" hidden>
<header class="ch"><button class="ib" id="cback" type="button" aria-label="Sohbet listesine dön">${ic("back")}</button><button class="chp" id="chp" type="button"><span id="cavw"></span><span class="cht"><b id="ct"></b><small id="cs"></small></span></button><button class="ib" id="cmore" type="button" aria-label="Sohbet seçenekleri" aria-haspopup="dialog">${ic("more")}</button></header>
<div class="msgs" id="msgs" aria-live="polite"></div>
<button class="jb" id="jb" type="button" hidden aria-label="En alta git">${ic("down")}</button>
<div class="rbar" id="rbar" hidden><div class="q" id="rq"></div><button class="ib" id="rx" type="button" aria-label="Yanıtı kaldır">${ic("x")}</button></div>
<div class="pv" id="pv" hidden><img id="pvi" alt="Seçilen fotoğraf"><span class="pvt">Fotoğraf gönderilecek. İstersen yazı da ekle.</span><button class="ib" id="pvx" type="button" aria-label="Fotoğrafı kaldır">${ic("x")}</button></div>
<div class="qpanel" id="qpanel" hidden></div>
<footer class="comp" id="comp"><button class="ib" id="qb" type="button" aria-label="Sohbet sorusu seç" title="Gruba sohbet sorusu at" hidden>${ic("bulb")}</button><label class="ib" for="pf" aria-label="Fotoğraf ekle">${ic("image")}</label><input type="file" id="pf" accept="image/*" hidden>
<textarea id="txt" rows="1" maxlength="1000" placeholder="Mesaj yaz" aria-label="Mesaj"></textarea><button class="send" id="send" type="button" aria-label="Gönder">${ic("send")}</button></footer>
<div class="closed" id="closed" hidden>${ic("lock")}<span>Bu sohbet kapandı. Dönem sona erdiği için mesajlar yalnızca okunabilir.</span></div>
</div></section></div>
<div class="lb" id="lb" hidden><button class="ib lbx" id="lbx" type="button" aria-label="Kapat">${ic("x")}</button><img id="lbi" alt="Fotoğraf"></div>
<div class="scrim2" id="scrim2" hidden></div>
<div class="sheet2" id="sheet2" hidden role="dialog" aria-modal="true"></div>`;
export const max = "none";

export default async function mount(ctx) {
  const me = ctx.me, $ = ctx.$, root = ctx.root;
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const I = (k, c) => { const s = el("span", "ico " + (c || "")); s.innerHTML = ic(k); return s; };
  const toast = t => { S.show(t); clearTimeout(toast.t); toast.t = setTimeout(() => S.$("msg").className = "msg", 3800); };
  const myName = me.role === "teacher" ? me.ad + " " + me.soyad : (me.takmaAd || me.ad);
  await ayarYukle(me.uid); temaUygula(root);
  const PAL = ["#2c5545", "#8a5a2b", "#4a6a8a", "#7a4a6a", "#5a7a3a", "#a0522d", "#3a6a6a", "#6a5a8a"];
  const colorOf = u => PAL[[...(u || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % PAL.length];
  const T = x => (x && x.toMillis ? x.toMillis() : typeof x === "number" ? x : 0);
  const hm = ms => new Date(ms).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const dayLabel = ms => { const d = new Date(ms), t = new Date(), y = new Date(t); y.setDate(t.getDate() - 1); const k = x => x.toDateString(); return k(d) === k(t) ? "Bugün" : k(d) === k(y) ? "Dün" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }); };
  const mobil = () => matchMedia("(max-width:760px)").matches;
  let chats = {}, curId = null, msgs = [], nodes = new Map(), unsubMsg = null, unsubDur = null, hb = null, reply = null, pend = null, lastTyping = 0, firstLoad = true, lastDay = "", seen = {}, people = [], dur = {};
  let istenenSohbet = ctx.query.get("c"), istenenKisi = ctx.query.get("dm");
  const C = () => chats[curId];
  const other = c => c.uyeler.find(u => u !== me.uid);
  const title = c => c.tur === "dm" ? (c.uyeAd[other(c)] || "Sohbet") : c.ad;
  const closed = c => c.kapali === true || (c.bitisTs && T(c.bitisTs) < Date.now());
  const unread = c => c.son && c.son.uid !== me.uid && T(c.sonTs) > Math.max(T(c.okundu && c.okundu[me.uid]), yerelOkundu(me.uid, c.id));
  const ref = () => doc(db, "sohbetler", curId);
  const durRef = () => doc(db, "sohbetler", curId, "durum", "anlik");   // çevrimiçi/yazıyor bilgisi ayrı belgede: sohbet listesini ve rozetleri gereksiz tetiklemez
  const profilGit = uid => { kapatSheet(); ctx.go("kisi", "u=" + encodeURIComponent(uid)); };
  const initial = s => (s || "?").trim().charAt(0).toLocaleUpperCase("tr");
  const avc = (c, cls) => { const a = el("div", "avc" + (cls ? " " + cls : "")); a.style.background = colorOf(c.tur === "dm" ? other(c) : c.id); if (c.tur === "dm") a.textContent = initial(title(c)); else a.append(I("users")); return a; };
  const avUser = (uid, ad, cls) => { const a = el("div", "avc " + (cls || "s"), initial(ad)); a.style.background = colorOf(uid); return a; };

  /* ---------- Alt sayfa (sheet) ---------- */
  function kapatSheet() { $("sheet2").hidden = $("scrim2").hidden = true; $("sheet2").replaceChildren(); }
  function acSheet(baslik, ...cocuklar) { const s = $("sheet2"); s.replaceChildren(el("div", "grip"), ...(baslik ? [el("h3", "", baslik)] : []), ...cocuklar); s.hidden = $("scrim2").hidden = false; const f = s.querySelector("button"); if (f) f.focus(); }
  const satir = (ikon, ad, ip, f, tehlike) => { const b = el("button", "srow" + (tehlike ? " dng" : "")); b.type = "button"; b.append(I(ikon)); const m = el("span"); m.append(el("b", "", ad)); if (ip) m.append(el("small", "", ip)); b.append(m); b.onclick = () => { kapatSheet(); f(); }; return b; };
  $("scrim2").onclick = kapatSheet;
  ctx.on(document, "keydown", e => { if (e.key === "Escape") { kapatSheet(); $("lb").hidden = true; } });
  $("lb").onclick = () => $("lb").hidden = true;

  /* ---------- Sohbet listesi ---------- */
  ctx.snap(query(collection(db, "sohbetler"), where("uyeler", "array-contains", me.uid)), snap => {
    chats = {}; snap.forEach(d => chats[d.id] = { id: d.id, ...d.data({ serverTimestamps: "estimate" }) });
    renderList();
    if (curId && chats[curId]) { sub(); comp(); updTicks(); markRead(); }
    if (istenenSohbet && chats[istenenSohbet]) { const id = istenenSohbet; istenenSohbet = null; open(id); }
    if (istenenKisi) { const u = istenenKisi; istenenKisi = null; kisiyeYaz(u); }
  }, e => toast("Sohbetler okunamadı: " + (e.code || e.message)));
  function onizleme(c) {
    const f = document.createDocumentFragment(); if (!c.son) { f.append("Henüz mesaj yok"); return f; }
    if (c.son.uid === me.uid) f.append("Sen: "); else if (c.tur === "takim") f.append((c.son.ad || "").split(" ")[0] + ": ");
    if (c.son.foto) f.append(I("image", "mini"));
    const t = (c.son.metin || "").replace(/^💡 /, ""); if (c.son.metin && c.son.metin.startsWith("💡 ")) f.append(I("bulb", "mini")); f.append(c.son.foto && !c.son.metin ? "Fotoğraf" : t); return f;
  }
  function renderList() {
    const list = Object.values(chats).sort((a, b) => (T(b.sonTs) || T(b.olusturma)) - (T(a.sonTs) || T(a.olusturma)));
    if (!list.length) return $("clist").replaceChildren(el("div", "emptym kucuk", "Henüz sohbetin yok. Artı düğmesiyle rehber öğretmenine yazabilirsin."));
    $("clist").replaceChildren(...list.map(c => {
      const b = el("button", "citem" + (c.id === curId ? " on" : "") + (unread(c) ? " un" : "")), mid = el("div", "cm"), nm = el("div", "t", title(c)), tm = el("div", "tm"), p = el("div", "p");
      b.type = "button"; if (closed(c)) nm.append(el("span", "clo", "kapandı"));
      p.append(onizleme(c)); mid.append(nm, p);
      if (c.sonTs && c.son) tm.append(el("div", "", hm(T(c.sonTs)))); if (unread(c)) tm.append(el("span", "udot"));
      if (unread(c) && seen[c.id] && seen[c.id] !== T(c.sonTs) && c.id !== curId) b.classList.add("flash");
      seen[c.id] = T(c.sonTs);
      b.append(avc(c), mid, tm); b.onclick = () => open(c.id); return b;
    }));
  }

  /* ---------- Sohbeti aç / kapat ---------- */
  function open(id) {
    if (unsubMsg) unsubMsg(); if (unsubDur) unsubDur(); dur = {}; clearInterval(hb);
    curId = id; msgs = []; nodes = new Map(); lastDay = ""; firstLoad = true; reply = null; pend = null; kapatSheet();
    $("msgs").replaceChildren(); updReply(); updPv(); $("newp").hidden = true;
    $("app").classList.add("inchat"); $("emp").hidden = true; $("chat").hidden = false;
    if (mobil() && !(history.state && history.state.sohbet)) history.pushState({ sohbet: id }, "");   // telefonun geri tuşu önce listeye dönsün
    const c = C(); $("ct").textContent = title(c); $("cavw").replaceChildren(avc(c));
    sub(); comp(); renderList();
    unsubDur = ctx.snap(durRef(), s => { dur = s.exists() ? s.data() : {}; sub(); }, () => {});
    unsubMsg = ctx.snap(query(collection(db, "sohbetler", id, "mesajlar"), orderBy("ts", "desc"), limit(120)), snap => {
      msgs = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }), pending: d.metadata.hasPendingWrites })).reverse();
      paint(); markRead();
    }, e => toast("Mesajlar okunamadı: " + (e.code || e.message)));
    beat(); hb = ctx.every(beat, 60000);
  }
  function kapatSohbet() {
    if (unsubMsg) unsubMsg(); if (unsubDur) unsubDur(); unsubMsg = unsubDur = null; clearInterval(hb); curId = null; kapatSheet();
    $("app").classList.remove("inchat"); $("chat").hidden = true; $("emp").hidden = false; renderList();
  }
  $("cback").onclick = () => { if (history.state && history.state.sohbet) history.back(); else kapatSohbet(); };
  ctx.on(window, "popstate", () => { if ($("app").classList.contains("inchat") && !(history.state && history.state.sohbet)) kapatSohbet(); });

  /* ---------- Üst bilgi: yazıyor / çevrimiçi ---------- */
  function sub() {
    const c = C(); if (!c) return; const now = Date.now(), others = c.uyeler.filter(u => u !== me.uid), s = $("cs"); s.className = "";
    if (closed(c)) return void (s.textContent = "Bu sohbet kapandı");
    const typing = others.filter(u => now - T(dur.yaziyor && dur.yaziyor[u]) < 8000);
    if (typing.length) { s.className = "typing"; s.replaceChildren(el("span", "", c.tur === "dm" ? "yazıyor" : typing.map(u => (c.uyeAd[u] || "").split(" ")[0]).join(", ") + " yazıyor")); const d = el("span", "dots"); d.append(el("i"), el("i"), el("i")); s.append(d); return; }
    const online = others.filter(u => now - T(dur.aktif && dur.aktif[u]) < 150000);
    s.className = online.length ? "on" : "";
    if (c.tur === "dm") { const t = T(dur.aktif && dur.aktif[others[0]]); s.textContent = online.length ? "çevrimiçi" : t ? "son görülme " + dayLabel(t).toLowerCase() + " " + hm(t) : "çevrimdışı"; }
    else s.textContent = c.uyeler.length + " üye" + (online.length ? " · " + online.length + " çevrimiçi" : "");
  }
  ctx.every(sub, 4000);
  function beat() { if (!curId || document.hidden || !C() || closed(C())) return; setDoc(durRef(), { aktif: { [me.uid]: Date.now() } }, { merge: true }).catch(() => {}); }
  ctx.on(document, "visibilitychange", () => { if (!document.hidden) { beat(); markRead(); } });
  $("chp").onclick = () => { const c = C(); if (!c) return; if (c.tur === "dm") profilGit(other(c)); else uyeler(c); };
  $("cmore").onclick = () => {
    const c = C(); if (!c) return;
    acSheet(title(c), satir("palette", "Görünümü özelleştir", "Sohbet rengi, mesaj rengi, okundu bilgisi", gorunum),
      c.tur === "dm" ? satir("user", "Profili gör", null, () => profilGit(other(c))) : satir("users", "Üyeleri gör", c.uyeler.length + " kişi", () => uyeler(c)),
      satir("bell", "Bildirim ayarları", null, () => ctx.go("ayarlar")));
  };
  function uyeler(c) {
    acSheet(c.ad, ...c.uyeler.map(u => { const b = el("button", "srow"); b.type = "button"; const nm = (c.uyeAd[u] || "Üye"); b.append(avUser(u, nm), (() => { const m = el("span"); m.append(el("b", "", nm + (u === me.uid ? " (sen)" : ""))); m.append(el("small", "", "Profili gör")); return m; })()); b.onclick = () => profilGit(u); return b; }));
  }
  function gorunum() {
    const kayit = (() => { let t; return y => { clearTimeout(t); t = setTimeout(() => ayarKaydet(me.uid, y).catch(e => toast("Kaydedilemedi: " + (e.code || e.message))), 400); }; })();
    const grup = (liste, alan, renk) => { const g = el("div", "swg"); const ciz = () => g.replaceChildren(...liste.map(x => { const b = el("button", "swb"); b.type = "button"; b.setAttribute("aria-pressed", String(ayar()[alan] === x.id)); b.setAttribute("aria-label", x.ad); const d = el("span", "swc"); d.style.background = renk(x); b.append(d, el("small", "", x.ad)); b.onclick = () => { Object.assign(ayar(), { [alan]: x.id }); temaUygula(root); ciz(); kayit({ [alan]: x.id }); }; return b; })); ciz(); return g; };
    const ok = el("div", "setrow"), okm = el("div"), okb = el("button", "swt"); okb.type = "button"; okb.setAttribute("role", "switch"); okb.setAttribute("aria-checked", String(!ayar().okunduGizle)); okb.setAttribute("aria-label", "Okundu bilgisini göster"); okb.append(el("i"));
    okm.append(el("b", "", "Okundu bilgisini göster"), el("small", "", "Kapatırsan başkaları mesajlarını ne zaman okuduğunu göremez; sen de onların okundu bilgisini göremezsin."));
    okb.onclick = () => { const v = okb.getAttribute("aria-checked") !== "true"; okb.setAttribute("aria-checked", String(v)); Object.assign(ayar(), { okunduGizle: !v }); tumunuYenile(); kayit({ okunduGizle: !v }); if (v) markRead(); };
    ok.append(okm, okb);
    acSheet("Sohbet görünümü", el("h4", "", "Sohbet rengi"), grup(TEMALAR, "sohbetTema", x => x.bg), el("h4", "", "Mesaj rengi"), grup(BALONLAR, "balonRenk", x => x.bg), ok);
  }
  const tumunuYenile = () => { nodes.forEach(n => n._sig = ""); updTicks(); };

  /* ---------- Mesajları çiz ---------- */
  function readState(m) {
    if (m.uid !== me.uid) return ""; const c = C(), mt = T(m.ts); if (!mt || m.pending) return "p";
    if (ayar().okunduGizle) return "s";
    const o = c.uyeler.filter(u => u !== me.uid), n = o.filter(u => T(c.okundu && c.okundu[u]) >= mt).length;
    return n === o.length && n > 0 ? "r" : n > 0 ? "h" : "s";
  }
  const sigOf = m => [m.silindi, T(m.ts), m.pending, readState(m), m.foto ? 1 : 0, ayar().okunduGizle].join("|");
  function paint() {
    const box = $("msgs"), first = firstLoad, near = box.scrollHeight - box.scrollTop - box.clientHeight < 150, ids = new Set(msgs.map(m => m.id));
    nodes.forEach((n, id) => { if (!ids.has(id)) { n.remove(); nodes.delete(id); } });
    let added = false, mine = false;
    msgs.forEach(m => {
      let n = nodes.get(m.id);
      if (!n) {
        const d = dayLabel(T(m.ts) || Date.now()); if (d !== lastDay) { box.append(el("div", "sep", d)); lastDay = d; }
        n = el("div", "row " + (m.uid === me.uid ? "me" : "them") + (first ? "" : " anim")); n.dataset.id = m.id; nodes.set(m.id, n); box.append(n); added = true; if (m.uid === me.uid) mine = true;
      }
      const sig = sigOf(m); if (n._sig !== sig) { n._sig = sig; fill(n, m); }
    });
    firstLoad = false;
    if (added && (first || near || mine)) box.scrollTo({ top: box.scrollHeight, behavior: first ? "auto" : "smooth" });
  }
  function updTicks() { msgs.forEach(m => { const n = nodes.get(m.id); if (!n) return; const sig = sigOf(m); if (n._sig !== sig) { n._sig = sig; fill(n, m); } }); }
  const tikSpan = st => { const s = el("span", "tick" + (st === "r" ? " read" : "")); s.setAttribute("aria-label", st === "p" ? "Gönderiliyor" : st === "s" ? "Gönderildi" : st === "r" ? "Okundu" : "Teslim edildi"); s.innerHTML = ic(st === "p" ? "clock" : st === "s" ? "check" : "check2"); return s; };
  function fill(n, m) {
    const c = C(), mine = m.uid === me.uid, grp = c.tur === "takim", b = el("div", "bub");
    if (m.silindi) { b.classList.add("del"); b.append(I("ban"), el("span", "", m.silan && m.silan !== m.uid ? "Bu mesaj rehber öğretmen tarafından silindi" : "Bu mesaj silindi")); }
    else {
      if (grp && !mine) { const nm = el("button", "nm", m.ad); nm.type = "button"; nm.style.color = colorOf(m.uid); nm.onclick = () => profilGit(m.uid); b.append(nm); }
      if (m.yanit) { const q = el("button", "quote"); q.type = "button"; const qs = el("span"); if (m.yanit.foto) qs.append(I("image", "mini")); qs.append(m.yanit.metin || (m.yanit.foto ? "Fotoğraf" : "")); q.append(el("b", "", m.yanit.ad), qs); q.onclick = () => jump(m.yanit.id); b.append(q); }
      if (m.fotoSil && (!m.foto || T(m.fotoSil) < Date.now())) { const e = el("em", "tx exp"); e.append(I("image", "mini"), "Fotoğrafın saklama süresi doldu"); b.append(e); }
      else if (m.foto) { const im = el("img", "ph"); im.src = m.foto; im.alt = "Gönderilen fotoğraf"; im.onclick = () => { $("lbi").src = m.foto; $("lb").hidden = false; }; b.append(im); }
      if (m.metin) { if (m.metin.startsWith("💡 ")) { b.classList.add("soru"); b.append(I("bulb", "qi")); b.append(el("span", "tx", m.metin.slice(3))); } else b.append(el("span", "tx", m.metin)); }
    }
    const mt = el("span", "mt"); if (m.ts) mt.append(el("time", "", hm(T(m.ts)))); if (mine && !m.silindi) mt.append(tikSpan(readState(m)));
    b.append(mt);
    n.replaceChildren();
    if (grp && !mine) { const av = el("button", "mav"); av.type = "button"; av.setAttribute("aria-label", m.ad + " profilini aç"); av.append(avUser(m.uid, m.ad, "xs")); av.onclick = () => profilGit(m.uid); n.append(av); }
    n.append(b);
    if (!m.silindi) {
      const mb = el("button", "mb"); mb.type = "button"; mb.setAttribute("aria-label", "Mesaj seçenekleri"); mb.innerHTML = ic("down"); mb.onclick = e => { e.stopPropagation(); aksiyon(m); }; b.append(mb);
      basili(b, m); kaydir(n, b, m);
    }
  }
  function jump(id) { const n = nodes.get(id); if (!n) return toast("Yanıtlanan mesaj artık listede yok."); n.scrollIntoView({ behavior: "smooth", block: "center" }); n.classList.remove("flash"); void n.offsetWidth; n.classList.add("flash"); setTimeout(() => n.classList.remove("flash"), 1500); }
  const box0 = $("msgs"), jb = $("jb");
  box0.onscroll = () => { jb.hidden = box0.scrollHeight - box0.scrollTop - box0.clientHeight < 320; };
  jb.onclick = () => box0.scrollTo({ top: box0.scrollHeight, behavior: "smooth" });

  /* ---------- Mesaj işlemleri: basılı tut, sağ tık ya da (bilgisayarda) ok düğmesi ---------- */
  function basili(b, m) {
    let t, x0 = 0, y0 = 0; const iptal = () => clearTimeout(t);
    b.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") return; x0 = e.clientX; y0 = e.clientY; t = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(12); aksiyon(m); }, 430); });
    b.addEventListener("pointermove", e => { if (Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8) iptal(); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(ev => b.addEventListener(ev, iptal));
    b.addEventListener("contextmenu", e => { e.preventDefault(); aksiyon(m); });
  }
  // Mesajı sağa kaydırınca yanıtla (telefonda)
  function kaydir(n, b, m) {
    let x0 = 0, y0 = 0, dx = 0, yon = null;
    n.addEventListener("touchstart", e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = 0; yon = null; }, { passive: true });
    n.addEventListener("touchmove", e => { const t = e.touches[0], ax = t.clientX - x0, ay = t.clientY - y0; if (yon === null && (Math.abs(ax) > 10 || Math.abs(ay) > 10)) yon = ax > 0 && Math.abs(ax) > Math.abs(ay) * 1.4 ? "x" : "y"; if (yon !== "x") return; dx = Math.min(ax, 80); b.style.transform = "translateX(" + dx + "px)"; n.classList.toggle("sw", dx > 56); }, { passive: true });
    const bit = () => { if (yon === "x" && dx > 56 && !closed(C())) { if (navigator.vibrate) navigator.vibrate(8); reply = m; updReply(); $("txt").focus(); } b.style.transform = ""; n.classList.remove("sw"); yon = null; dx = 0; };
    n.addEventListener("touchend", bit); n.addEventListener("touchcancel", bit);
  }
  function aksiyon(m) {
    const c = C(); if (!c || m.silindi) return;
    const onizle = el("div", "msgp"); onizle.textContent = m.metin ? m.metin.replace(/^💡 /, "").slice(0, 90) : "Fotoğraf";
    const satirlar = [onizle];
    if (!closed(c)) satirlar.push(satir("reply", "Yanıtla", null, () => { reply = m; updReply(); $("txt").focus(); }));
    if (m.metin) satirlar.push(satir("copy", "Kopyala", null, () => kopyala(m.metin.replace(/^💡 /, ""))));
    if (m.uid === me.uid && !ayar().okunduGizle) { const o = c.uyeler.filter(u => u !== me.uid), rd = o.filter(u => T(c.okundu && c.okundu[u]) >= T(m.ts)).map(u => (c.uyeAd[u] || "").split(" ")[0]); satirlar.push(el("p", "bilgi", rd.length ? "Okuyanlar: " + rd.join(", ") : "Henüz okunmadı")); }
    if (!closed(c) && (m.uid === me.uid || (me.role === "teacher" && c.tur === "takim"))) satirlar.push(satir("trash", "Herkesten sil", "Mesaj ve fotoğrafı kalıcı olarak silinir", () => del(m), true));
    acSheet("", ...satirlar);
  }
  async function kopyala(t) { try { await navigator.clipboard.writeText(t); toast("Kopyalandı."); } catch (_) { const a = el("textarea"); a.value = t; document.body.append(a); a.select(); try { document.execCommand("copy"); toast("Kopyalandı."); } catch (__) { toast("Kopyalanamadı."); } a.remove(); } }
  async function del(m) {
    const c = C(), bt = writeBatch(db);
    bt.update(doc(db, "sohbetler", curId, "mesajlar", m.id), { silindi: true, metin: "", foto: null, silan: me.uid });
    if (c.son && c.son.id === m.id) bt.update(ref(), { "son.metin": "Bu mesaj silindi", "son.foto": false });
    try { await bt.commit(); } catch (e) { toast("Silinemedi: " + (e.code || e.message)); }
  }
  function updReply() {
    $("rbar").hidden = !reply; if (!reply) return;
    const s = el("span"); if (reply.foto) s.append(I("image", "mini")); s.append((reply.metin || "Fotoğraf").replace(/^💡 /, ""));
    $("rq").replaceChildren(el("b", "", reply.uid === me.uid ? "Sen" : reply.ad), s);
  }
  $("rx").onclick = () => { reply = null; updReply(); };

  /* ---------- Okundu bilgisi ---------- */
  function markRead() {
    const c = C(); if (!c || document.hidden || !msgs.length) return;
    const lo = [...msgs].reverse().find(m => m.uid !== me.uid && !m.pending); if (!lo) return;
    yerelOkunduYaz(me.uid, c.id, T(lo.ts));   // bu cihazdaki rozetler için
    if (ayar().okunduGizle) return renderList();
    if (T(lo.ts) > T(c.okundu && c.okundu[me.uid])) updateDoc(ref(), { ["okundu." + me.uid]: serverTimestamp() }).catch(() => {});
    renderList();
  }

  /* ---------- Yazma alanı ---------- */
  function comp() { const c = C(), k = closed(c); $("comp").hidden = k; $("closed").hidden = !k; $("qb").hidden = !c || c.tur !== "takim" || k; if (k || $("qb").hidden) $("qpanel").hidden = true; if (k) { $("rbar").hidden = true; $("pv").hidden = true; } }
  function updPv() { $("pv").hidden = !pend; if (pend) $("pvi").src = pend; sendDurum(); }
  $("pvx").onclick = () => { pend = null; updPv(); };
  $("pf").onchange = async () => {
    const f = $("pf").files[0]; $("pf").value = ""; if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Lütfen bir görsel seç.");
    try { pend = await resizeFit(f, 900, 0.72, 380000); updPv(); } catch (e) { toast(e && e.message ? e.message : "Fotoğraf okunamadı."); }
  };
  const sendDurum = () => $("send").classList.toggle("on", !!($("txt").value.trim() || pend));
  const grow = () => { const t = $("txt"); t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; sendDurum(); };
  $("txt").oninput = () => {
    grow();
    if (curId && Date.now() - lastTyping > 2500) { lastTyping = Date.now(); setDoc(durRef(), { yaziyor: { [me.uid]: Date.now() } }, { merge: true }).catch(() => {}); }
  };
  // Bilgisayarda Enter gönderir; telefonda Enter yeni satırdır (gönder düğmesi gönderir)
  $("txt").onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !matchMedia("(pointer:coarse)").matches) { e.preventDefault(); send(); } };
  $("send").onclick = send;
  async function send(over) {
    const custom = typeof over === "string", c = C(), cid = curId, text = custom ? over : $("txt").value.trim(); if (!c || (!text && (custom || !pend)) || closed(c)) return;
    const mref = doc(collection(db, "sohbetler", cid, "mesajlar")), foto = custom ? null : pend, yn = custom ? null : reply;
    const m = { uid: me.uid, ad: myName, metin: text, foto: foto || null, yanit: yn ? { id: yn.id, ad: yn.uid === me.uid ? "Sen" : yn.ad, metin: (yn.metin || "").slice(0, 80), foto: !!yn.foto } : null, silindi: false, ts: serverTimestamp() };
    if (foto) m.fotoSil = Timestamp.fromMillis(Date.now() + 7 * 864e5);   // fotoğraf 7 gün sonra otomatik silinir
    if (!custom) { $("txt").value = ""; grow(); pend = null; reply = null; updPv(); updReply(); lastTyping = 0; }
    const b = writeBatch(db);
    b.set(mref, m);
    b.update(ref(), { son: { id: mref.id, uid: me.uid, ad: myName, metin: text || "Fotoğraf", foto: !!foto }, sonTs: serverTimestamp(), ["okundu." + me.uid]: serverTimestamp() });
    try { await b.commit(); setDoc(durRef(), { yaziyor: { [me.uid]: 0 } }, { merge: true }).catch(() => {}); bildir("sohbet", { sohbet: cid, mesaj: mref.id }); }
    catch (e) { toast("Mesaj gönderilemedi: " + (e.code || e.message)); if (!custom) { $("txt").value = text; grow(); } }
  }

  /* ---------- Sohbet soruları ---------- */
  $("qb").onclick = () => {
    const p = $("qpanel"); p.hidden = !p.hidden; if (p.hidden) return;
    const go = s => { p.hidden = true; send("💡 " + s); };
    const rnd = el("button", "qitem rnd"); rnd.type = "button"; rnd.append(I("dice"), "Rastgele bir soru at"); rnd.onclick = () => go(SORULAR[Math.floor(Math.random() * SORULAR.length)]);
    p.replaceChildren(el("small", "hint", "Bir soru seç, takım sohbetine gönderilsin:"), rnd, ...SORULAR.map(s => { const b = el("button", "qitem", s); b.type = "button"; b.onclick = () => go(s); return b; }));
  };

  /* ---------- Yeni mesaj ---------- */
  $("newb").onclick = async () => {
    const p = $("newp"); p.hidden = !p.hidden; if (p.hidden) return;
    if (!me.okulId) return p.replaceChildren(el("small", "hint", "Okulun henüz yönetici tarafından eşleştirilmedi. Eşleştirilince sohbet başlatabilirsin."));
    p.replaceChildren(el("small", "hint", "Yükleniyor…"));
    try {
      if (me.role === "teacher") people = (await getDocs(query(collection(db, "users"), where("role", "==", "student"), where("okulId", "==", me.okulId)))).docs.map(d => ({ uid: d.id, ad: d.data().ad + " " + d.data().soyad, alt: d.data().sinif + "-" + d.data().sube }));
      else people = (await getDocs(query(collection(db, "ogretmenler"), where("okulId", "==", me.okulId)))).docs.filter(d => d.id !== me.uid).map(d => ({ uid: d.id, ad: d.data().ad, alt: d.data().brans || "Rehber öğretmen" }));
    } catch (e) { return p.replaceChildren(el("small", "hint", "Liste okunamadı: " + (e.code || e.message))); }
    const inp = el("input"); inp.type = "search"; inp.placeholder = me.role === "teacher" ? "Öğrenci ara" : "Öğretmen ara"; const box = el("div");
    const draw = () => { const q = inp.value.trim().toLocaleLowerCase("tr"); const rows = people.filter(x => !q || x.ad.toLocaleLowerCase("tr").includes(q)).sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
      box.replaceChildren(...(rows.length ? rows.map(x => { const b = el("button", "pp"), d = el("div"); d.append(el("b", "", x.ad), el("small", "", x.alt)); b.type = "button"; b.append(avUser(x.uid, x.ad, "m"), d); b.onclick = () => startDm(x); return b; }) : [el("small", "hint", me.role === "teacher" ? "Öğrenci bulunamadı." : "Okulunda henüz profilini oluşturmuş rehber öğretmen yok.")])); };
    inp.oninput = draw; p.replaceChildren(inp, box); draw();
  };
  async function startDm(x) {
    const t = me.role === "teacher", s = t ? x.uid : me.uid, tu = t ? me.uid : x.uid, id = "dm_" + s + "_" + tu;
    if (!chats[id]) {
      const data = { tur: "dm", okulId: me.okulId, ad: "", uyeler: [s, tu], uyeAd: { [s]: t ? x.ad : myName, [tu]: t ? myName : x.ad }, kapali: false, olusturma: serverTimestamp(), son: null, sonTs: serverTimestamp(), okundu: {}, yaziyor: {}, aktif: {} };
      try { await setDoc(doc(db, "sohbetler", id), data); } catch (e) { return toast("Sohbet başlatılamadı: " + (e.code || e.message)); }
      chats[id] = { id, ...data, sonTs: null, olusturma: null };
    }
    open(id);
  }
  // Profil sayfasındaki "Mesaj yaz" düğmesi buraya gelir (#/sohbet?dm=KULLANICI)
  async function kisiyeYaz(uid) {
    try {
      if (me.role === "teacher") { const d = await getDoc(doc(db, "users", uid)); if (d.exists() && d.data().role === "student") startDm({ uid, ad: d.data().ad + " " + d.data().soyad }); }
      else { const d = await getDoc(doc(db, "ogretmenler", uid)); if (d.exists()) startDm({ uid, ad: d.data().ad }); else toast("Bu kişiye sohbetten yazamazsın."); }
    } catch (e) { toast("Sohbet başlatılamadı: " + (e.code || e.message)); }
  }

  // Süresi dolan fotoğrafları temizler: yalnızca öğretmen oturumu, bu cihazda saatte bir
  if (me.role === "teacher") {
    const sk = "salvea_sweep_" + me.uid;
    const tmo = setTimeout(async () => {
      if (Date.now() - +(localStorage.getItem(sk) || 0) < 36e5) return;
      try {
        localStorage.setItem(sk, String(Date.now()));
        for (const id of Object.keys(chats).slice(0, 30)) {
          const s = await getDocs(query(collection(db, "sohbetler", id, "mesajlar"), where("fotoSil", "<", Timestamp.now()), limit(20)));
          for (const d of s.docs) if (d.data().foto) await updateDoc(d.ref, { foto: null }).catch(() => {});
        }
      } catch (_) {}
    }, 6000);
    ctx.leave(() => clearTimeout(tmo));
  }
}
