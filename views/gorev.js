// Görünüm: gorevler (app.js yönlendiricisi tarafından yüklenir)
import { db } from "../firebase.js";
import { resizeFit, indir } from "../foto.js";
import { GOREVLER, SEVIYE } from "../gorevler.js";
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction, increment, deleteField, Timestamp, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export const html = `<header class="top"><div class="tile"><img src="logo.png" alt="Salvea"></div><div><b id="hi">Yükleniyor…</b><span id="sc"></span></div></header>
<div class="tabs" id="tabs" hidden></div>
<div id="app"></div>`;
export const max = "820px";

export default async function mount(ctx) {
  const me = ctx.me;
  const $ = ctx.$, { show } = S;
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const empty = t => el("div", "empty", t);
  const teacher = me.role === "teacher";
  // Kanıt fotoğrafı saklama süreleri (gün). Süre dolunca fotoğraf otomatik silinir; puan ve onay kaydı kalır.
  const ONAY_SONRA_GUN = 14, BEKLEYEN_MAX_GUN = 60;
  const sonra = g => Timestamp.fromMillis(Date.now() + g * 864e5);
  const fmt = s => new Date(s + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  const fmtTs = t => t && t.toMillis ? new Date(t.toMillis()).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "";
  const safe = s => (s || "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  const hash = s => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
  $("sc").textContent = me.okul || "";
  async function run(btn, label, fn) { const o = btn.textContent; btn.disabled = true; btn.textContent = label; try { await fn(); } catch (e) { show("İşlem başarısız: " + (e.code || e.message)); } btn.disabled = false; btn.textContent = o; }
  const q = (c, ...w) => getDocs(query(collection(db, c), ...w.map(x => where(...x)))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));

  // Fotoğraflar kanıt belgesinde değil, ayrı "kanitFotolari" koleksiyonunda tutulur. Liste yüklenirken fotoğraf çekilmez, yalnızca gösterilirken (ve tek tek) çekilir.
  const fc = {};
  const fotoOf = k => k.foto ? Promise.resolve(k.foto) : !k.fotoVar ? Promise.resolve(null)
    : (fc[k.id] = fc[k.id] || getDoc(doc(db, "kanitFotolari", k.id)).then(s => s.exists() ? s.data().foto : null).catch(() => null));
  function fotoBox(k, ad, indirilebilir) {
    const box = el("div");
    if (!k.foto && !k.fotoVar) { if (k.durum === "onaylandi") box.append(el("small", "hint", "Kanıt fotoğrafı saklama süresi dolduğu için otomatik silindi.")); return box; }
    const ph = el("small", "hint", "Fotoğraf yükleniyor…"); box.append(ph);
    fotoOf(k).then(f => {
      ph.remove();
      if (!f) return box.append(el("small", "hint", "Fotoğraf bulunamadı ya da süresi dolduğu için silindi."));
      const im = el("img", "kanit"); im.src = f; im.alt = "Gönderilen kanıt"; box.append(im);
      if (k.silinmeTs) box.append(el("small", "hint", "Bu fotoğraf " + fmtTs(k.silinmeTs) + " tarihinde otomatik silinir."));
      if (indirilebilir) { const b = el("button", "btn ghost sm", "Fotoğrafı indir"); b.type = "button"; b.style.marginTop = "6px"; b.onclick = () => indir(f, safe(ad) || "kanit"); box.append(b); }
    });
    return box;
  }
  if (!me.okulId) { $("hi").textContent = "Görevler"; $("app").replaceChildren(empty("Okulun henüz yönetici tarafından eşleştirilmedi. Eşleştirilince görevleri burada göreceksin.")); }
  else teacher ? initT() : initS();

  /* ===================== ÖĞRENCİ ===================== */
  async function initS() {
    $("hi").textContent = "Görevlerim";
    let team = null, donem = null, atn = [], kn = [];
    try {
      team = (await q("takimlar", ["uyeler", "array-contains", me.uid])).find(t => t.aktif);
      if (!team) return $("app").replaceChildren(empty("Henüz bir takımın yok. Öğretmenin yeni bir dönem başlattığında görevlerin burada görünecek."));
      donem = (await getDoc(doc(db, "donemler", team.donemId))).data() || {};
      [atn, kn] = await Promise.all([q("atananGorevler", ["donemId", "==", team.donemId], ["okulId", "==", me.okulId]), q("gorevKanitlari", ["uyeler", "array-contains", me.uid])]);
      kn = kn.filter(k => k.takimId === team.id);
    } catch (e) { return show("Veriler okunamadı. Firestore kurallarını güncellediğinden emin ol. (" + (e.code || e.message) + ")"); }
    $("hi").textContent = team.ad + " · görevler";
    const ub = team.uyeBilgi || {};
    const draw = () => {
      const pts = kn.filter(k => k.durum === "onaylandi").reduce((a, k) => a + (k.puan || 0), 0), parts = [], top = el("div", "gor");
      top.append(el("small", "hint", "Takım puanın"), el("h3", "", pts + " puan"));
      if (donem.hedefPuan) { const pc = Math.min(100, Math.round((donem.toplamPuan || 0) / donem.hedefPuan * 100)), b = el("div", "pbar"), i = el("i"); i.style.width = pc + "%"; b.append(i);
        top.append(el("p", "hint", "Okulun ortak hedefi: tüm takımlar birlikte " + (donem.toplamPuan || 0) + " / " + donem.hedefPuan + " puana ulaşıyor. Yarışmıyoruz, birlikte ilerliyoruz."), b); }
      parts.push(top);
      if (!atn.length) parts.push(empty("Henüz görev verilmedi. Öğretmenin görev atayınca burada görünecek."));
      atn.sort((a, b) => (a.bitis || "").localeCompare(b.bitis || "")).forEach(g => {
        const k = kn.find(x => x.atamaId === g.id), c = el("div", "gor"), meta = el("div", "chips");
        [SEVIYE[g.seviye], g.sure + " dk", g.puan + " puan", g.bitis ? "Son gün: " + fmt(g.bitis) : ""].filter(Boolean).forEach(x => meta.append(el("i", "", x)));
        c.append(el("h3", "", g.baslik), meta, el("p", "", g.aciklama));
        if (g.roller && g.roller.length) { const h = hash(g.id + team.id); c.append(el("small", "hint", "Roller (görev, herkes kendi rolünü yapınca tamamlanır)"));
          team.uyeler.forEach((u, i) => { const b = (ub[u] || {}).ad || "Üye", r = g.roller[(i + h) % g.roller.length]; const p = el("p", "", (u === me.uid ? "Sen" : b) + " → " + r); if (u === me.uid) p.style.fontWeight = "600"; p.style.margin = "2px 0"; c.append(p); }); }
        if (g.kanit) c.append(el("small", "hint", "Kanıt: " + g.kanit));
        if (k) { const st = k.durum === "onaylandi" ? ["o", "Onaylandı · +" + k.puan + " puan"] : k.durum === "tekrar" ? ["r", "Tekrar istendi"] : ["b", "Onay bekliyor"], s = el("span", "stat " + st[0], st[1]); s.style.marginTop = "10px"; s.style.display = "inline-block";
          c.append(s, fotoBox(k, g.baslik, false)); if (k.yorum) c.append(el("p", "", "Öğretmen: " + k.yorum)); }
        if (!k || k.durum !== "onaylandi") {
          const f = el("input"), nt = el("input"), go = el("button", "btn sm", k ? "Yeniden gönder" : "Kanıtı gönder"); f.type = "file"; f.accept = "image/*"; nt.placeholder = "Kısa not (isteğe bağlı)"; nt.maxLength = 150; nt.style.margin = "8px 0"; go.type = "button";
          const lb = el("label", "", "Kanıt fotoğrafı (yüzler görünmesin)"); lb.style.marginTop = "12px";
          const sk = el("small", "hint", "Fotoğraf, öğretmen onayladıktan " + ONAY_SONRA_GUN + " gün sonra otomatik silinir.");
          go.onclick = () => run(go, "Gönderiliyor…", async () => {
            if (!f.files[0]) { f.classList.add("bad"); return show("Önce bir kanıt fotoğrafı seç."); }
            const foto = await resizeFit(f.files[0], 900, 0.7), id = g.id + "_" + team.id, st = sonra(BEKLEYEN_MAX_GUN);
            const meta = { okulId: me.okulId, atamaId: g.id, takimId: team.id, takimAd: team.ad, donemId: team.donemId, uyeler: team.uyeler, not: nt.value.trim(), gonderen: me.uid, gonderenAd: me.takmaAd || me.ad, durum: "bekliyor", puan: 0, yorum: "", fotoVar: true, silinmeTs: st, ts: serverTimestamp() };
            const b = writeBatch(db);
            b.set(doc(db, "gorevKanitlari", id), meta);
            b.set(doc(db, "kanitFotolari", id), { okulId: me.okulId, foto, silinmeTs: st, ts: serverTimestamp() });
            await b.commit();
            fc[id] = Promise.resolve(foto); kn = kn.filter(x => x.atamaId !== g.id).concat({ id, ...meta }); show("Kanıtın öğretmene gönderildi.", true); draw(); });
          c.append(lb, f, nt, sk, go);
        }
        parts.push(c);
      });
      $("app").replaceChildren(...parts);
    };
    draw();
  }

  /* ===================== ÖĞRETMEN ===================== */
  async function initT() {
    $("hi").textContent = "Görev yönetimi";
    let donem = null, atn = [], kn = [], tk = [], tab = "onay";
    try {
      const dn = await q("donemler", ["okulId", "==", me.okulId]); donem = dn.find(d => d.aktif) || null;
      [atn, kn, tk] = await Promise.all([q("atananGorevler", ["okulId", "==", me.okulId]), q("gorevKanitlari", ["okulId", "==", me.okulId]), q("takimlar", ["okulId", "==", me.okulId])]);
    } catch (e) { return show("Veriler okunamadı. Firestore kurallarını güncellediğinden emin ol. (" + (e.code || e.message) + ")"); }
    const gAt = id => atn.find(a => a.id === id) || {};
    const tabs = $("tabs"); tabs.hidden = false; tabs.className = "tabs";
    const draw = () => {
      const bek = kn.filter(k => k.durum === "bekliyor").sort((a, b) => ((a.ts && a.ts.seconds) || 0) - ((b.ts && b.ts.seconds) || 0));
      tabs.replaceChildren(...[["onay", "Onay bekleyenler" + (bek.length ? " (" + bek.length + ")" : "")], ["ata", "Görev ata"], ["liste", "Atananlar"]].map(([k, t]) => { const b = el("button", "", t); b.type = "button"; b.setAttribute("aria-selected", String(tab === k)); b.onclick = () => { tab = k; draw(); }; return b; }));
      const app = $("app");
      if (tab === "onay") {
        if (!bek.length) return app.replaceChildren(empty("Onay bekleyen kanıt yok."));
        app.replaceChildren(...bek.map(k => {
          const g = gAt(k.atamaId), c = el("div", "gor"), pi = el("input"), yo = el("input"), ok = el("button", "btn sm", "Onayla"), no = el("button", "btn ghost sm", "Tekrar iste"), ac = el("div");
          pi.type = "number"; pi.min = 0; pi.max = g.puan || 100; pi.value = g.puan || 10; pi.style.width = "90px"; yo.placeholder = "Yorum (tekrar istersen zorunlu)"; yo.maxLength = 150; yo.style.margin = "8px 0"; ok.type = no.type = "button"; ac.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap";
          c.append(el("small", "hint", k.takimAd + " · " + k.gonderenAd), el("h3", "", g.baslik || "Görev"), el("p", "", k.not ? "Not: " + k.not : "Not yok."), fotoBox(k, (k.takimAd || "") + "-" + (g.baslik || "gorev"), true));
          const pl = el("label", "", "Verilecek puan"); pl.style.margin = "0";
          ac.append(pl, pi); c.append(yo, ac, (() => { const r = el("div"); r.style.cssText = "display:flex;gap:8px;margin-top:10px"; r.append(ok, no); return r; })());
          ok.onclick = () => run(ok, "…", async () => {
            const p = Math.max(0, Math.min(+pi.value || 0, g.puan || 100)), kr = doc(db, "gorevKanitlari", k.id), fr = doc(db, "kanitFotolari", k.id), st = sonra(ONAY_SONRA_GUN);
            // İki öğretmen aynı anda onaylasa bile puan yalnızca bir kez eklenir
            await runTransaction(db, async tx => {
              const ks = await tx.get(kr); if (!ks.exists() || ks.data().durum !== "bekliyor") throw new Error("Bu kanıt zaten işlenmiş. Sayfayı yenile.");
              const fs = k.fotoVar ? await tx.get(fr) : null;
              tx.update(kr, { durum: "onaylandi", puan: p, yorum: yo.value.trim(), onaylayan: me.uid, onayTs: serverTimestamp(), silinmeTs: st });
              tx.update(doc(db, "donemler", k.donemId), { toplamPuan: increment(p) });
              if (fs && fs.exists()) tx.update(fr, { silinmeTs: st });
            });
            k.durum = "onaylandi"; k.puan = p; k.yorum = yo.value.trim(); k.silinmeTs = st; show("Onaylandı, takıma " + p + " puan verildi. Fotoğraf " + ONAY_SONRA_GUN + " gün sonra otomatik silinecek; istersen şimdi indirebilirsin.", true); draw(); });
          no.onclick = () => run(no, "…", async () => { if (!yo.value.trim()) { yo.classList.add("bad"); return show("Tekrar istiyorsan kısa bir yorum yaz."); }
            await updateDoc(doc(db, "gorevKanitlari", k.id), { durum: "tekrar", yorum: yo.value.trim() }); k.durum = "tekrar"; draw(); });
          return c;
        }));
      } else if (tab === "ata") {
        if (!donem) return app.replaceChildren(empty("Görev atamak için önce Takımlar sekmesinden bir dönem yayınlamalısın."));
        const assign = async (g, bitis) => {
          const id = g.id ? donem.id + "_" + g.id : donem.id + "_ozel_" + Date.now().toString(36);   // aynı görev aynı döneme iki kez atanamaz
          if (atn.some(a => a.id === id)) return show("Bu görev bu döneme zaten atanmış.");
          await setDoc(doc(db, "atananGorevler", id), { okulId: me.okulId, donemId: donem.id, gorevId: g.id || "ozel", baslik: g.baslik, aciklama: g.aciklama, seviye: g.seviye, sure: g.sure, puan: g.puan, roller: g.roller || [], kanit: g.kanit || "", bitis: bitis || donem.bitis || "", olusturan: me.uid, olusturma: serverTimestamp() });
          atn = await q("atananGorevler", ["okulId", "==", me.okulId]); show("“" + g.baslik + "” bu dönemdeki tüm takımlara atandı.", true); draw(); };
        const parts = [el("p", "hint", "Seçtiğin görev, " + donem.ad + " dönemindeki tüm takımlara atanır. İlk dönemlerde Seviye 1–2 ile başlamanı, sohbet gerektiren görevleri sonraya bırakmanı öneririz.")];
        const cf = el("details", "doc"); cf.style.margin = "0 0 18px"; cf.append(el("summary", "", "+ Kendi görevini yaz"));
        const fm = el("div", "txt"), inp = (ph, t = "text") => { const i = el("input"); i.placeholder = ph; i.type = t; i.style.marginBottom = "8px"; return i; };
        const ad = inp("Görev adı"), ac = el("textarea"), se = el("select"), su = inp("Süre (dakika)", "number"), pu = inp("Puan", "number"), ro = inp("Roller, virgülle ayır (isteğe bağlı): Çizen, Yazan, Renklendiren"), ka = inp("Kanıt olarak ne fotoğraflanacak?"), bi = inp("", "date"), go = el("button", "btn sm", "Görevi ata");
        ac.rows = 3; ac.placeholder = "Açıklama"; ac.style.marginBottom = "8px"; [1, 2, 3, 4].forEach(n => se.append(new Option(SEVIYE[n], n))); se.style.marginBottom = "8px"; su.value = 20; pu.value = 15; bi.value = donem.bitis || ""; go.type = "button";
        go.onclick = () => run(go, "…", async () => { if (!ad.value.trim() || !ac.value.trim()) { ad.classList.add("bad"); return show("Görev adı ve açıklama gerekli."); }
        if (ad.value.trim().length > 120) return show("Görev adı en fazla 120 karakter olabilir.");
        if (ac.value.trim().length > 800) return show("Açıklama en fazla 800 karakter olabilir.");
        if (+su.value < 1 || +su.value > 240) return show("Süre 1 ile 240 dakika arasında olmalı.");
        if (+pu.value < 0 || +pu.value > 100) return show("Puan 0 ile 100 arasında olmalı.");
        if (ro.value.split(",").map(x => x.trim()).filter(Boolean).length > 8) return show("En fazla 8 rol yazabilirsin.");
        if (ka.value.trim().length > 300) return show("Kanıt açıklaması en fazla 300 karakter olabilir.");
          await assign({ baslik: ad.value.trim(), aciklama: ac.value.trim(), seviye: +se.value, sure: +su.value || 20, puan: +pu.value || 10, roller: ro.value.split(",").map(x => x.trim()).filter(Boolean), kanit: ka.value.trim() }, bi.value || donem.bitis); });
        fm.append(ad, ac, se, su, pu, ro, ka, el("label", "", "Son gün"), bi, go); cf.append(fm); parts.push(cf);
        [1, 2, 3, 4].forEach(n => { parts.push(el("h2", "s", SEVIYE[n]));
          GOREVLER.filter(g => g.seviye === n).forEach(g => { const c = el("div", "gor"), meta = el("div", "chips"), row = el("div", "addrow"), bi2 = el("input"), b = el("button", "btn sm", "Ata"), atandi = atn.some(a => a.id === donem.id + "_" + g.id);
            [g.sure + " dk", g.puan + " puan", g.roller.length + " rol"].forEach(x => meta.append(el("i", "", x))); bi2.type = "date"; bi2.value = donem.bitis || ""; bi2.style.maxWidth = "170px"; b.type = "button";
            if (atandi) { b.textContent = "Atandı"; b.disabled = true; bi2.disabled = true; } else b.onclick = () => run(b, "…", () => assign(g, bi2.value || donem.bitis));
            row.append(bi2, b); c.append(el("h3", "", g.baslik), meta, el("p", "", g.aciklama), el("small", "hint", "Son gün"), row); parts.push(c); }); });
        app.replaceChildren(...parts);
      } else {
        const list = atn.filter(a => !donem || a.donemId === donem.id), nt = tk.filter(t => donem && t.donemId === donem.id && t.aktif).length;
        if (!list.length) return app.replaceChildren(empty("Bu dönemde atanmış görev yok. “Görev ata” sekmesinden ekleyebilirsin."));
        app.replaceChildren(...list.map(a => { const c = el("div", "gor"), ks = kn.filter(k => k.atamaId === a.id), b = el("button", "btn ghost sm", "Görevi kaldır"); b.type = "button";
          b.onclick = () => { if (ks.length) return show("Bu görev için gönderim var, kaldırılamaz."); if (!confirm("“" + a.baslik + "” tüm takımlardan kaldırılsın mı?")) return;
            run(b, "…", async () => { await deleteDoc(doc(db, "atananGorevler", a.id)); atn = atn.filter(x => x.id !== a.id); draw(); }); };
          c.append(el("h3", "", a.baslik), el("p", "hint", SEVIYE[a.seviye] + " · son gün " + (a.bitis ? fmt(a.bitis) : "-")), el("p", "", ks.length + " / " + nt + " takım gönderdi · " + ks.filter(k => k.durum === "onaylandi").length + " onaylandı"));
          if (ks.length) { const dt = el("details", "doc"), bx = el("div", "txt"); dt.style.margin = "8px 0"; dt.append(el("summary", "", "Gönderimler ve fotoğraflar"));
            ks.forEach(k => { const r = el("div"), s = el("span", "stat " + (k.durum === "onaylandi" ? "o" : k.durum === "tekrar" ? "r" : "b"), k.durum === "onaylandi" ? "Onaylandı" : k.durum === "tekrar" ? "Tekrar istendi" : "Bekliyor"); r.style.cssText = "padding:8px 0;border-top:1px solid var(--line)";
              r.append(el("b", "", (k.takimAd || "Takım") + " "), s);
              if (k.fotoVar || k.foto) { const ib = el("button", "btn ghost sm", "Fotoğrafı indir"); ib.type = "button"; ib.style.marginLeft = "8px"; ib.onclick = () => run(ib, "…", async () => { const f = await fotoOf(k); if (!f) return show("Fotoğraf bulunamadı ya da süresi dolduğu için silinmiş."); indir(f, safe((k.takimAd || "takim") + "-" + a.baslik)); });
                r.append(ib, el("small", "hint", k.silinmeTs ? "Otomatik silinme: " + fmtTs(k.silinmeTs) : "")); }
              else r.append(el("small", "hint", k.durum === "onaylandi" ? "Fotoğraf süresi dolduğu için silindi." : ""));
              bx.append(r); });
            dt.append(bx); c.append(dt); }
          c.append(b); return c; }));
      }
    };
    // Süresi dolan fotoğrafları siler; eski (belgenin içinde duran) fotoğrafları ayrı koleksiyona taşır.
    async function temizle() {
      const simdi = Date.now(); let silinen = 0;
      for (const k of kn) {
        try {
          if (k.foto) {
            const st = k.silinmeTs || sonra(k.durum === "onaylandi" ? ONAY_SONRA_GUN : BEKLEYEN_MAX_GUN), b = writeBatch(db);
            b.set(doc(db, "kanitFotolari", k.id), { okulId: me.okulId, foto: k.foto, silinmeTs: st, ts: serverTimestamp() });
            b.update(doc(db, "gorevKanitlari", k.id), { foto: deleteField(), fotoVar: true, silinmeTs: st });
            await b.commit(); fc[k.id] = Promise.resolve(k.foto); delete k.foto; k.fotoVar = true; k.silinmeTs = st;
          }
          if (k.fotoVar && k.silinmeTs && k.silinmeTs.toMillis() < simdi) {
            const b = writeBatch(db); b.delete(doc(db, "kanitFotolari", k.id)); b.update(doc(db, "gorevKanitlari", k.id), { fotoVar: false });
            await b.commit(); k.fotoVar = false; delete fc[k.id]; silinen++;
          }
        } catch (_) {}
      }
      if (silinen) { show(silinen + " kanıt fotoğrafı saklama süresi dolduğu için otomatik silindi.", true); draw(); }
    }
    draw(); temizle();
  }
}
