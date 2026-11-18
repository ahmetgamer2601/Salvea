// Yönetici paneli eklentileri: Sınıflar (sınıf öğretmeni / rehber atama), Duyuru, Güvenlik (toplu onay, hesap askıya alma)
import { db } from "./firebase.js";
import { guard } from "./guard.js";
import { sinifIslem } from "./push.js";
import { yazimKur } from "./duyuru-yaz.js";
import { collection, getDocs, doc, setDoc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const me = await guard("admin"), { $, show } = S;
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const tabs = document.querySelector(".tabs");
const ekle = (id, ad) => { const b = el("button", "", ad); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", "false"); b.dataset.tab = id; tabs.append(b); const s = el("section"); s.id = id; s.hidden = true; tabs.after(...[]); document.querySelector("script[src='ortak.js']").before(s); return s; };
const sSinif = ekle("sinifTab", "Sınıflar"), sDuyuru = ekle("duyuruTab", "Duyuru"), sGuv = ekle("guvTab", "Güvenlik");
const sec = b => document.querySelectorAll(".tabs button").forEach(x => { x.setAttribute("aria-selected", String(x === b)); $(x.dataset.tab).hidden = x !== b; });
document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { sec(b); if (b.dataset.tab === "duyuruTab" && !sDuyuru.dataset.hazir) { sDuyuru.dataset.hazir = "1"; yazimKur(sDuyuru, { me, yonetici: true, okullar }); } });
let okullar = [], users = [], siniflar = [];
const yukle = async () => { const [a, b, c] = await Promise.all([getDocs(collection(db, "okullar")), getDocs(collection(db, "users")), getDocs(collection(db, "siniflar"))]); okullar = a.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => x.ad.localeCompare(y.ad, "tr")); users = b.docs.map(d => ({ uid: d.id, ...d.data() })); siniflar = c.docs.map(d => ({ id: d.id, ...d.data() })); };
await yukle();

/* ---------- Sınıflar ---------- */
let okulSec = okullar[0] ? okullar[0].id : "";
function ciz() {
  const sel = el("select"); sel.setAttribute("aria-label", "Okul"); okullar.forEach(o => sel.append(new Option(o.ad, o.id))); sel.value = okulSec; sel.onchange = () => { okulSec = sel.value; ciz(); };
  const parts = [el("h2", "s", "Sınıf öğretmenleri ve rehber öğretmenler"), el("p", "hint", "Her sınıfa bir sınıf öğretmeni ve bir rehber öğretmen (isteğe bağlı birden fazla) ata. Atanan öğretmenler Sınıfım sayfasından öğrencileri onaylar, sınıf sohbetini ve otomatik soruları yönetir."), sel];
  const ogr = users.filter(u => u.role === "student" && u.okulId === okulSec), ogrt = users.filter(u => u.role === "teacher" && u.onayli === true && u.okulId === okulSec).sort((a, b) => (a.ad + a.soyad).localeCompare(b.ad + b.soyad, "tr"));
  const anahtarlar = [...new Set([...ogr.map(o => o.sinif + "-" + o.sube), ...siniflar.filter(s => s.okulId === okulSec).map(s => s.sinif + "-" + s.sube)])].filter(k => !k.includes("undefined")).sort((a, b) => a.localeCompare(b, "tr"));
  if (!anahtarlar.length) parts.push(el("div", "empty", "Bu okulda henüz sınıf (kayıtlı öğrenci) yok."));
  const bekT = ogr.filter(o => o.sinifOnay !== true).length;
  anahtarlar.forEach(k => {
    const [sn, sb] = k.split("-"), id = okulSec + "_" + k, s = siniflar.find(x => x.id === id) || { sinifOgretmenleri: [], rehberOgretmenleri: [], sorular: true, siklik: "haftada3" }, kt = el("section", "sn-kart"), ogrS = ogr.filter(o => o.sinif === sn && o.sube === sb);
    const secili = { s: new Set(s.sinifOgretmenleri || []), r: new Set(s.rehberOgretmenleri || []) };
    const grup = (baslik, anah) => { const g = el("div", "f"); g.append(el("label", "", baslik)); const l = el("div", "dy-liste"); ogrt.forEach(t => { const lb = el("label", "chk"), c = el("input"); c.type = "checkbox"; c.checked = secili[anah].has(t.uid); c.onchange = () => c.checked ? secili[anah].add(t.uid) : secili[anah].delete(t.uid); lb.append(c, el("span", "", t.ad + " " + t.soyad + (t.brans ? " · " + t.brans : ""))); l.append(lb); }); g.append(ogrt.length ? l : el("small", "hint", "Bu okulda onaylı öğretmen yok.")); return g; };
    const bas = el("div", "sn-bas"); bas.append(el("h2", "", sn + "-" + sb + " sınıfı"), el("small", "", ogrS.length + " öğrenci · " + ogrS.filter(o => o.sinifOnay !== true).length + " onay bekliyor"));
    const kaydet = el("button", "btn sm", "Kaydet"), sohbet = el("button", "btn sm ghost", "Kaydet ve sınıf sohbetini kur"), onay = el("button", "btn sm ghost", "Bu sınıfı onayla"); [kaydet, sohbet, onay].forEach(b => b.type = "button");
    const yaz = async () => { await setDoc(doc(db, "siniflar", id), { okulId: okulSec, sinif: sn, sube: sb, ad: k, sinifOgretmenleri: [...secili.s], rehberOgretmenleri: [...secili.r], sorular: s.sorular !== false, siklik: s.siklik || "haftada3" }, { merge: true }); await yukle(); };
    kaydet.onclick = async () => { kaydet.disabled = true; try { await yaz(); show("Kaydedildi.", true); } catch (e) { show("Kaydedilemedi: " + (e.code || e.message)); } kaydet.disabled = false; };
    sohbet.onclick = async () => { sohbet.disabled = true; try { await yaz(); const r = await sinifIslem("sinifSohbet", id); show(r.hata ? "Kaydedildi, sohbet kurulamadı: " + r.hata : "Kaydedildi. Sınıf sohbeti hazır: " + r.uye + " üye.", !r.hata); } catch (e) { show("Hata: " + (e.code || e.message)); } sohbet.disabled = false; };
    onay.onclick = async () => { const bek = ogrS.filter(o => o.sinifOnay !== true); if (!bek.length) return show("Onay bekleyen öğrenci yok.", true); if (!confirm(bek.length + " öğrenci onaylansın mı?")) return; try { const b = writeBatch(db); bek.forEach(o => b.update(doc(db, "users", o.uid), { sinifOnay: true })); await b.commit(); await yukle(); show("Onaylandı.", true); ciz(); } catch (e) { show("Onaylanamadı: " + (e.code || e.message)); } };
    const isl = el("div", "setbtns"); isl.append(kaydet, sohbet, onay); kt.append(bas, grup("Sınıf öğretmeni", "s"), grup("Rehber öğretmen", "r"), isl); parts.push(kt);
  });
  sSinif.replaceChildren(...parts);
}
ciz();

/* ---------- Güvenlik ---------- */
function guvCiz() {
  const toplamBek = users.filter(u => u.role === "student" && u.sinifOnay !== true).length, hepsi = el("button", "btn sm", "Tüm okulların bekleyen öğrencilerini onayla (" + toplamBek + ")"); hepsi.type = "button";
  hepsi.onclick = async () => { const bek = users.filter(u => u.role === "student" && u.sinifOnay !== true); if (!bek.length) return show("Onay bekleyen öğrenci yok.", true); if (!confirm(bek.length + " öğrenci onaylansın mı? (Geçiş için: mevcut öğrencileri tek seferde onaylar.)")) return;
    hepsi.disabled = true; try { for (let i = 0; i < bek.length; i += 400) { const b = writeBatch(db); bek.slice(i, i + 400).forEach(o => b.update(doc(db, "users", o.uid), { sinifOnay: true })); await b.commit(); } await yukle(); show("Onaylandı.", true); guvCiz(); } catch (e) { show("Onaylanamadı: " + (e.code || e.message)); hepsi.disabled = false; } };
  const ara = el("input"), liste = el("div", "sn-liste"); ara.type = "search"; ara.placeholder = "Ad, soyad ya da e-posta ile ara";
  const cizL = () => { const q = ara.value.trim().toLocaleLowerCase("tr"); liste.replaceChildren(...(q.length < 2 ? [] : users.filter(u => ((u.ad || "") + " " + (u.soyad || "") + " " + (u.email || "")).toLocaleLowerCase("tr").includes(q)).slice(0, 25).map(u => {
    const k = el("div", "sn-kisi"), m = el("div"), b = el("button", "btn ghost sm", u.engelli ? "Askıyı kaldır" : "Askıya al"); b.type = "button"; b.style.marginLeft = "auto"; m.append(el("b", "", (u.ad || "") + " " + (u.soyad || "")), el("small", "", (u.role === "teacher" ? "Öğretmen" : "Öğrenci") + (u.engelli ? " · ASKIDA" : "") + " · " + (u.email || "")));
    b.onclick = async () => { if (!u.engelli && !confirm("Bu hesap askıya alınsın mı? Hesap hiçbir şey yazamaz (mesaj, fotoğraf, duyuru vb.).")) return; try { await updateDoc(doc(db, "users", u.uid), { engelli: !u.engelli }); u.engelli = !u.engelli; show(u.engelli ? "Hesap askıya alındı." : "Askı kaldırıldı.", true); cizL(); } catch (e) { show("Yapılamadı: " + (e.code || e.message)); } };
    k.append(el("div", "sn-av", (u.ad || "?").charAt(0)), m, b); return k; })));
  };
  ara.oninput = cizL;
  sGuv.replaceChildren(el("h2", "s", "Öğrenci onayı (geçiş)"), el("p", "hint", "Sınıf öğretmeni onayı, okula sonradan sızan yabancı kayıtların sınıf sohbetlerine girmesini engeller. Mevcut tüm öğrencileri tek seferde onaylayabilirsin; sonra sınıf öğretmenleri yeni kayıtları tek tek onaylar."), hepsi,
    el("h2", "s", "Hesap askıya alma"), el("p", "hint", "Kötüye kullanım durumunda bir hesabı geçici olarak yazma yetkisinden çıkarır (hesap silinmez)."), ara, liste);
}
guvCiz();
