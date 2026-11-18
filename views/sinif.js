// Görünüm: Sınıfım. Öğrenci: öğretmenler ve sınıf sohbeti. Öğretmen: sınıf yönetimi, onaylar, otomatik sorular, bildirilen mesajlar.
import { db } from "../firebase.js";
import { sinifIslem, kapsama, hazir } from "../push.js";
import { collection, query, where, getDocs, getDoc, doc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
export const html = `<header class="top"><div class="tile"><img src="logo.png" alt="Salvea"></div><div><b id="hi">Sınıfım</b><span id="sc"></span></div></header><div id="app"></div>`;
export const max = "760px";
export default async function mount(ctx) {
  const me = ctx.me, $ = ctx.$, el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }, bos = t => el("div", "empty", t), toast = (t, ok) => S.show(t, ok);
  $("sc").textContent = me.okul || ""; if (!me.okulId) return $("app").replaceChildren(bos("Okulun henüz yönetici tarafından eşleştirilmedi."));
  const kisi = (ad, alt) => { const k = el("div", "sn-kisi"), m = el("div"); m.append(el("b", "", ad), el("small", "", alt || "")); k.append(el("div", "sn-av", (ad || "?").trim().charAt(0).toLocaleUpperCase("tr")), m); return k; };
  const ogrt = {}; try { (await getDocs(query(collection(db, "ogretmenler"), where("okulId", "==", me.okulId)))).forEach(d => ogrt[d.id] = d.data()); } catch (_) {}
  const ad = u => (ogrt[u] && ogrt[u].ad) || "Öğretmen", link = (t, h, c = "btn ghost sm", st = "") => { const a = el("a", c, t); a.href = h; a.style.cssText = "text-decoration:none;" + st; return a; };
  async function ogrenci() {
    if (!me.sinif || !me.sube) return $("app").replaceChildren(bos("Sınıf bilgin bulunamadı."));
    let s = null; try { const d = await getDoc(doc(db, "siniflar", me.okulId + "_" + me.sinif + "-" + me.sube)); if (d.exists()) s = { id: d.id, ...d.data() }; } catch (e) { return toast("Sınıf bilgisi okunamadı: " + (e.code || e.message)); }
    if (!s) return $("app").replaceChildren(bos("Sınıfın henüz tanımlanmadı. Yöneticin tanımlayınca burada öğretmenlerini ve sınıf sohbetini göreceksin."));
    const onayli = me.sinifOnay === true, hero = el("div", "sn-hero"); hero.append(el("small", "", "Sınıfın"), el("h2", "", me.sinif + "-" + me.sube), el("span", "sn-durum" + (onayli ? " ok" : ""), onayli ? "Sınıf sohbetine katıldın" : "Sınıf öğretmeninin onayı bekleniyor"));
    if (onayli && s.sohbetId) hero.append(link("Sınıf sohbetini aç", "sohbet.html?c=" + encodeURIComponent(s.sohbetId), "btn sm", "display:inline-block;margin-top:14px")); else if (!onayli) hero.append(el("p", "", "Sınıf öğretmenin seni onayladığında sınıf sohbetine eklenirsin. O zamana kadar Salvea'nın diğer bölümlerini kullanabilirsin."));
    const lst = el("div", "sn-liste"), rol = (u, e) => { const k = kisi(ad(u), e); k.append(link("Mesaj yaz", "sohbet.html?dm=" + encodeURIComponent(u), "btn ghost sm", "margin-left:auto;white-space:nowrap")); lst.append(k); };
    (s.sinifOgretmenleri || []).forEach(u => rol(u, "Sınıf öğretmenin")); (s.rehberOgretmenleri || []).forEach(u => rol(u, "Rehber öğretmenin"));
    const n = el("p", "hint", "Sınıf sohbetine ara sıra eğlenceli sorular, mini etkinlikler ve quizler gelir. Katıldıkça sınıfın serisi büyür."); n.style.marginTop = "18px";
    $("app").replaceChildren(hero, el("h2", "s", "Öğretmenlerin"), lst.childElementCount ? lst : bos("Sınıfına henüz öğretmen atanmamış."), n);
  }
  async function ogretmen() {
    let siniflar = [], ogrler = [], raporlar = [], kapali = new Set(), kv = false;
    try {
      const [a, b, c] = await Promise.all([getDocs(query(collection(db, "siniflar"), where("okulId", "==", me.okulId))), getDocs(query(collection(db, "users"), where("role", "==", "student"), where("okulId", "==", me.okulId))), getDocs(query(collection(db, "raporlar"), where("okulId", "==", me.okulId))).catch(() => ({ docs: [] }))]);
      siniflar = a.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => me.admin === true || (s.sinifOgretmenleri || []).includes(me.uid) || (s.rehberOgretmenleri || []).includes(me.uid)).sort((x, y) => (x.sinif + x.sube).localeCompare(y.sinif + y.sube, "tr"));
      ogrler = b.docs.map(d => ({ uid: d.id, ...d.data() })); const m = x => x.ts && x.ts.toMillis ? x.ts.toMillis() : 0; raporlar = c.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => m(y) - m(x));
    } catch (e) { return toast("Veriler okunamadı: " + (e.code || e.message)); }
    if (hazir()) { const r = await kapsama(null); if (r && !r.hata) { kapali = new Set(r.kapali); kv = true; } }
    const parts = []; if (!siniflar.length) parts.push(bos("Henüz bir sınıfın öğretmeni olarak atanmadın. Yönetici seni sınıf öğretmeni ya da rehber öğretmen olarak atadığında burada göreceksin."));
    siniflar.forEach(s => parts.push(kart(s))); parts.push(raporBolumu()); $("app").replaceChildren(...parts);
    function kart(s) {
      const k = el("section", "sn-kart"), bas = el("div", "sn-bas"), roster = ogrler.filter(o => o.sinif === s.sinif && o.sube === s.sube).sort((a, b) => (a.ad + a.soyad).localeCompare(b.ad + b.soyad, "tr")), roller = el("div", "chips");
      bas.append(el("h2", "", s.sinif + "-" + s.sube + " sınıfı"), el("small", "", roster.length + " öğrenci")); (s.sinifOgretmenleri || []).forEach(u => roller.append(el("i", "", "Sınıf öğr.: " + ad(u)))); (s.rehberOgretmenleri || []).forEach(u => roller.append(el("i", "on", "Rehber: " + ad(u)))); k.append(bas, roller);
      const ay = el("div", "sn-ayar"), sw = el("button", "swt"), sik = el("select"), sol = el("div"); sw.type = "button"; sw.setAttribute("role", "switch"); sw.setAttribute("aria-checked", String(s.sorular !== false)); sw.setAttribute("aria-label", "Otomatik sorular"); sw.append(el("i")); sik.setAttribute("aria-label", "Sıklık");
      [["gunluk", "Her okul günü"], ["haftada3", "Haftada 2-3 kez"], ["haftada1", "Haftada bir"]].forEach(([v, t]) => sik.append(new Option(t, v))); sik.value = s.siklik || "haftada3";
      const yaz = async y => { try { await updateDoc(doc(db, "siniflar", s.id), y); Object.assign(s, y); } catch (e) { toast("Kaydedilemedi: " + (e.code || e.message)); } };
      sw.onclick = () => { const v = sw.getAttribute("aria-checked") !== "true"; sw.setAttribute("aria-checked", String(v)); yaz({ sorular: v }); }; sik.onchange = () => yaz({ siklik: sik.value });
      sol.append(el("b", "", "Sınıf sohbetine otomatik soru ve etkinlik"), el("small", "", "Hafta içi 15:00-19:00 arasında geniş bir havuzdan eğlenceli sorular, mini etkinlikler ve quizler gönderilir.")); ay.append(sol, sw); k.append(ay, sik);
      const isl = el("div", "setbtns"), dugme = (t, f, g) => { const b = el("button", "btn sm" + (g ? " ghost" : ""), t); b.type = "button"; b.onclick = async () => { b.disabled = true; try { await f(); } catch (e) { toast(e.message || "İşlem başarısız."); } b.disabled = false; }; isl.append(b); };
      dugme("Sınıf sohbetini kur / güncelle", async () => { const r = await sinifIslem("sinifSohbet", s.id); if (r.hata) throw new Error(r.hata); toast("Sınıf sohbeti hazır: " + r.uye + " üye.", true); });
      dugme("Şimdi bir soru gönder", async () => { const r = await sinifIslem("soruGonder", s.id); if (r.hata) throw new Error(r.hata); toast("Soru sınıf sohbetine gönderildi (" + r.etiket + ").", true); }, true);
      isl.append(link("Sohbeti aç", "sohbet.html?c=" + encodeURIComponent("sinif_" + s.id))); k.append(isl, el("h3", "sn-alt", "Öğrenciler"));
      const bek = roster.filter(o => o.sinifOnay !== true);
      if (bek.length) { const kt = el("div", "sn-bek"), hepsi = el("button", "btn sm", "Bekleyenlerin hepsini onayla"); kt.append(el("b", "", bek.length + " öğrenci onay bekliyor"), el("small", "", "Onayladıkların sınıf sohbetine eklenir. Tanımadığın biri varsa onaylama.")); hepsi.type = "button";
        hepsi.onclick = async () => { if (!confirm(bek.length + " öğrenci onaylansın mı?")) return; hepsi.disabled = true; try { for (let i = 0; i < bek.length; i += 400) { const b = writeBatch(db); bek.slice(i, i + 400).forEach(o => b.update(doc(db, "users", o.uid), { sinifOnay: true })); await b.commit(); } bek.forEach(o => o.sinifOnay = true); toast("Onaylandı. Sınıf sohbetini güncellemeyi unutma.", true); ogretmen(); } catch (e) { toast("Onaylanamadı: " + (e.code || e.message)); hepsi.disabled = false; } }; kt.append(hepsi); k.append(kt); }
      const lst = el("div", "sn-liste"); roster.forEach(o => {
        const r = kisi(o.ad + " " + o.soyad, [o.sinifOnay === true ? "Onaylı" : "Onay bekliyor", kv ? (kapali.has(o.uid) ? "bildirim kapalı" : "bildirim açık") : ""].filter(Boolean).join(" · ")), b = el("button", "btn ghost sm", o.sinifOnay === true ? "Kaldır" : "Onayla"); b.type = "button"; b.style.marginLeft = "auto";
        b.onclick = async () => { b.disabled = true; try { const v = o.sinifOnay !== true; await updateDoc(doc(db, "users", o.uid), { sinifOnay: v }); o.sinifOnay = v; ogretmen(); } catch (e) { toast("Kaydedilemedi: " + (e.code || e.message)); b.disabled = false; } }; r.append(b); lst.append(r); });
      k.append(roster.length ? lst : bos("Bu sınıfta henüz kayıtlı öğrenci yok.")); return k;
    }
    function raporBolumu() {
      const b = el("section", "sn-kart"), acik = raporlar.filter(r => r.durum !== "tamam"); b.append(el("h2", "", "Bildirilen mesajlar")); if (!acik.length) { b.append(el("p", "hint", "İncelenmeyi bekleyen bildirim yok.")); return b; }
      acik.forEach(r => { const k = el("div", "sn-rapor"), t = el("button", "btn ghost sm", "İncelendi"); k.append(el("b", "", (r.mesajAd || "Bir öğrenci") + " yazdı:"), el("p", "", r.metin || ""), el("small", "", "Bildiren: " + (r.bildirenAd || "bir öğrenci"))); t.type = "button";
        t.onclick = async () => { t.disabled = true; try { await updateDoc(doc(db, "raporlar", r.id), { durum: "tamam" }); r.durum = "tamam"; ogretmen(); } catch (e) { toast("Kaydedilemedi: " + (e.code || e.message)); t.disabled = false; } }; k.append(t, link("Sohbete git", "sohbet.html?c=" + encodeURIComponent(r.sohbetId), "btn ghost sm", "margin-left:8px")); b.append(k); }); return b;
    }
  }
  me.role === "teacher" ? await ogretmen() : await ogrenci();
}
