// Duyuru yazma formu (öğretmen: kendi okulu, yönetici: tüm okullar): süsleme, hedef seçimi, canlı önizleme, gönderim raporu
import { db } from "./firebase.js";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { bildir, kapsama, hazir } from "./push.js";
import { STILLER, EMOJILER } from "./duyuru-veri.js";
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const ikon = y => '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + y + "</svg>";
export async function yazimKur(kutu, { me, yonetici = false, onGonderildi, okullar = [], varsayilan = {} }) {
  const d = { stil: varsayilan.stil || "duyuru", emoji: varsayilan.emoji ?? "📢", hedef: yonetici ? "herkes" : "okul", sinif: "", okul: okullar[0] ? okullar[0].id : me.okulId || "", secilen: new Set(), takim: "" };
  let ogr = [], takimlar = [], siniflar = [];
  if (!yonetici && me.okulId) {
    try { ogr = (await getDocs(query(collection(db, "users"), where("role", "==", "student"), where("okulId", "==", me.okulId)))).docs.map(x => ({ uid: x.id, ad: x.data().ad + " " + x.data().soyad, sinif: x.data().sinif, sube: x.data().sube })).sort((a, b) => a.ad.localeCompare(b.ad, "tr")); } catch (_) {}
    try { takimlar = (await getDocs(query(collection(db, "takimlar"), where("okulId", "==", me.okulId), where("aktif", "==", true)))).docs.map(x => ({ id: x.id, ad: x.data().ad, uyeler: x.data().uyeler || [] })); } catch (_) {}
    siniflar = [...new Set(ogr.map(o => o.sinif + "-" + o.sube))].sort((a, b) => a.localeCompare(b, "tr")); d.sinif = siniflar[0] || "";
  }
  const adlar = Object.fromEntries(ogr.map(o => [o.uid, o.ad])), kok = el("div", "dyz"), stilK = el("div", "dy-stil"), emK = el("div", "dy-emoji"), bas = el("input"), met = el("textarea"), say = el("small", "hint", "0 / 300"), hs = el("select"), alt = el("div", "dy-alt"), onK = el("div", "dy-onizleme"), gonder = el("button", "btn", "Gönder"), rapor = el("div", "dy-rapor");
  bas.maxLength = 60; bas.placeholder = "Başlık (örn. Yarın film günü!)"; bas.setAttribute("aria-label", "Başlık"); met.rows = 4; met.maxLength = 300; met.placeholder = "Mesajın… Ne zaman, nerede, kimler?"; met.setAttribute("aria-label", "Mesaj"); hs.setAttribute("aria-label", "Kime gönderilsin"); gonder.type = "button";
  const cizStil = () => stilK.replaceChildren(...Object.entries(STILLER).map(([k, s]) => { const b = el("button", "dy-chip"); b.type = "button"; b.setAttribute("aria-pressed", String(d.stil === k)); b.style.setProperty("--c1", s.renk[0]); b.innerHTML = ikon(s.ikon); b.append(s.ad); b.onclick = () => { d.stil = k; cizStil(); onizle(); }; return b; }));
  const cizEm = () => emK.replaceChildren(...["", ...EMOJILER].map(e => { const b = el("button", "dy-em", e || "yok"); b.type = "button"; b.setAttribute("aria-pressed", String(d.emoji === e)); b.onclick = () => { d.emoji = e; cizEm(); onizle(); }; return b; }));
  (yonetici ? [["herkes", "Herkes (tüm okullar)"], ["okul", "Bir okulun herkesi"], ["ogretmenler", "Tüm öğretmenler"], ["okulOgretmen", "Bir okulun öğretmenleri"]] : [["okul", "Tüm öğrencilerim"], ["sinif", "Bir sınıf"], ["kisi", "Seçtiğim öğrenciler"], ["takim", "Bir takım"]]).forEach(([v, t]) => hs.append(new Option(t, v))); hs.value = d.hedef;
  const cizAlt = () => {
    alt.replaceChildren(); const h = hs.value, sec = (etiket, liste, anahtar, f) => { const s = el("select"); s.setAttribute("aria-label", etiket); liste.forEach(([v, t]) => s.append(new Option(t, v))); s.value = d[anahtar] = d[anahtar] || (liste[0] && liste[0][0]) || ""; s.onchange = () => d[anahtar] = s.value; alt.append(liste.length ? s : el("small", "hint", "Seçenek yok.")); };
    if (yonetici && (h === "okul" || h === "okulOgretmen")) sec("Okul", okullar.map(o => [o.id, o.ad]), "okul");
    if (!yonetici && h === "sinif") sec("Sınıf", siniflar.map(x => [x, x + " sınıfı"]), "sinif");
    if (!yonetici && h === "takim") sec("Takım", takimlar.map(t => [t.id, t.ad + " (" + t.uyeler.length + " kişi)"]), "takim");
    if (!yonetici && h === "kisi") { const ara = el("input"), liste = el("div", "dy-liste"), sy = el("small", "hint"); ara.type = "search"; ara.placeholder = "Öğrenci ara";
      const ciz = () => { const q = ara.value.trim().toLocaleLowerCase("tr"); liste.replaceChildren(...ogr.filter(o => !q || o.ad.toLocaleLowerCase("tr").includes(q)).slice(0, 80).map(o => { const l = el("label", "chk"), c = el("input"); c.type = "checkbox"; c.checked = d.secilen.has(o.uid); c.onchange = () => { c.checked ? d.secilen.add(o.uid) : d.secilen.delete(o.uid); sy.textContent = d.secilen.size + " kişi seçildi"; }; l.append(c, el("span", "", o.ad + " · " + o.sinif + "-" + o.sube)); return l; })); sy.textContent = d.secilen.size + " kişi seçildi"; };
      ara.oninput = ciz; ciz(); alt.append(ara, liste, sy); }
  };
  hs.onchange = () => { d.hedef = hs.value; cizAlt(); };
  const onizle = () => {
    const s = STILLER[d.stil], kart = el("div", "dy-kart"), ust = el("div", "dy-kart-ust"), e = d.emoji ? d.emoji + " " : ""; kart.style.background = "linear-gradient(150deg," + s.renk[0] + "," + s.renk[1] + ")"; ust.innerHTML = ikon(s.ikon); ust.append(s.ad);
    kart.append(ust, el("h3", "", e + (bas.value.trim() || "Başlığın burada görünür")), el("p", "", met.value.trim() || "Mesajın burada görünür."));
    const tel = el("div", "dy-tel"), b = el("div", "dy-bildirim"); b.append(el("b", "", "Salvea"), el("div", "", e + (bas.value.trim() || "Başlık")), el("small", "", met.value.trim().slice(0, 90) || "Mesaj")); tel.append(el("small", "", "Telefonda böyle görünür"), b); onK.replaceChildren(kart, tel);
  };
  bas.oninput = onizle; met.oninput = () => { say.textContent = met.value.length + " / 300"; onizle(); };
  const mesaj = (t, ok) => { rapor.className = "dy-rapor" + (ok ? " ok" : t ? " err" : ""); rapor.replaceChildren(typeof t === "string" ? document.createTextNode(t) : t); };
  gonder.onclick = async () => {
    const baslik = bas.value.trim(), metin = met.value.trim(); if (!baslik || !metin) return mesaj("Başlık ve mesaj gerekli.");
    const h = d.hedef; let okulId = yonetici ? (["okul", "okulOgretmen"].includes(h) ? d.okul : null) : me.okulId, kapsam = h, alicilar;
    if (!yonetici) {
      if (h === "sinif") { if (!d.sinif) return mesaj("Bir sınıf seç."); kapsam = "sinif:" + d.sinif; }
      if (h === "kisi") { if (!d.secilen.size) return mesaj("En az bir öğrenci seç."); alicilar = [...d.secilen].slice(0, 300); }
      if (h === "takim") { const t = takimlar.find(x => x.id === d.takim); if (!t) return mesaj("Bir takım seç."); kapsam = "kisi"; alicilar = t.uyeler.slice(0, 300); }
      if (!okulId) return mesaj("Okulun henüz eşleştirilmemiş.");
    } else if (["okul", "okulOgretmen"].includes(h) && !okulId) return mesaj("Bir okul seç.");
    gonder.disabled = true; mesaj("Gönderiliyor…");
    try {
      const v = { olusturan: me.uid, olusturanAd: (me.ad + " " + me.soyad).slice(0, 80), baslik, metin, stil: d.stil, emoji: d.emoji, kapsam, ts: serverTimestamp() }; if (okulId) v.okulId = okulId; if (alicilar) v.alicilar = alicilar; if (varsayilan.etkinlikId) v.etkinlikId = varsayilan.etkinlikId;
      const ref = await addDoc(collection(db, "duyurular"), v);
      if (!hazir()) mesaj("Duyuru kaydedildi; uygulamayı açanlar Duyurular bölümünde görecek. (Telefon bildirimi için bildirim sunucusu kurulmamış.)", true);
      else { const r = await bildir("duyuru", { id: ref.id }, (p, t) => mesaj("Bildirim gönderiliyor… " + p + " / " + t));
        if (!r || r.hata) mesaj("Duyuru kaydedildi; uygulamayı açanlar görecek. Telefon bildirimi gönderilemedi" + (r && r.hata ? ": " + r.hata : "."), true);
        else { const k = el("div"), eksik = r.alici - r.ulasilan; k.append(el("b", "", r.ulasilan + " kişiye telefon bildirimi gitti."), el("br"), document.createTextNode(eksik > 0 ? eksik + " kişide bildirim kapalı ya da ulaşılamadı. Onlar duyuruyu uygulamayı açınca Duyurular'da görecek." : "Hedefteki herkese ulaşıldı."));
          if (r.ulasamayan && r.ulasamayan.length && ogr.length) { const dt = el("details"); dt.append(el("summary", "", "Ulaşılamayanları göster"), el("p", "", r.ulasamayan.map(u => adlar[u] || "Bir kişi").join(", "))); k.append(dt); } mesaj(k, true); } }
      onGonderildi && onGonderildi(ref.id);
    } catch (e) { mesaj("Gönderilemedi: " + (e.code || e.message)); }
    gonder.disabled = false;
  };
  const kapBtn = el("button", "btn ghost sm", "Bildirim durumunu göster"); kapBtn.type = "button";
  kapBtn.onclick = async () => { kapBtn.disabled = true; mesaj("Kontrol ediliyor…"); const r = await kapsama(yonetici ? d.okul || null : null); kapBtn.disabled = false; if (!r || r.hata) return mesaj("Bildirim durumu alınamadı" + (r && r.hata ? ": " + r.hata : "."));
    const k = el("div"); k.append(el("b", "", r.toplam + " öğrenciden " + r.acik + "'inde bildirim açık.")); if (r.kapali.length) { const dt = el("details"); dt.append(el("summary", "", "Bildirimi kapalı olanlar (" + r.kapali.length + ")"), el("p", "", r.kapali.map(u => adlar[u] || "Bir öğrenci").join(", "))); k.append(dt); } mesaj(k, true); };
  const f = (e, ...c) => { const x = el("div", "f"); x.append(el("label", "", e), ...c); return x; };
  kok.append(f("Stil", stilK), f("Süsle (isteğe bağlı emoji)", emK), f("Başlık", bas), f("Mesaj", met, say), f("Kime", hs, alt), el("h4", "dy-bas", "Önizleme"), onK, gonder, rapor, ...(hazir() ? [kapBtn] : []));
  kutu.replaceChildren(kok); if (varsayilan.baslik) bas.value = varsayilan.baslik; if (varsayilan.metin) { met.value = varsayilan.metin; say.textContent = met.value.length + " / 300"; } cizStil(); cizEm(); cizAlt(); onizle();
}
