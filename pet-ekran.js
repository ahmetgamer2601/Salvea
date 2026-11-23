// Sınıf hayvanı penceresi (TikTok tarzı tam ekran alt sayfa). Canlı sahne, seçim, besleme, çamur temizliği, seri ve bakıcı listesi.
// Veri ek okuma doğurmaz: getChat() zaten dinlenen sınıf sohbet belgesini döndürür; yenileme "salvea-sohbetler" olayıyla gelir.
import { petSvg, yumurtaSvg, yildizSvg } from "./pet-cizim.js";
import { petDurum, HAYVANLAR, SABIT, gunAnahtar, seriHesapla, dondurulabilir, camurAdimim, oySayim, oyAyir, isimTemizle, bakimEkibi, bugunGorevler, hedefler, ogrenciListe } from "./petmantik.js";
import { sozSec, dokunTepkisi, eylemSozu } from "./pet-soz.js";
import { petSec, oyVer, besle, temizle, yeniYumurta, seriDondur } from "./pet.js";
import { maskotTur, maskotSec } from "./pet-rehber.js";
import { miniKafa, alevSvg } from "./pet-cizim.js";
import { env } from "./ayar.js";

const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
let toastT = 0;
const toast = m => { try { S.show(m); clearTimeout(toastT); toastT = setTimeout(() => S.$("msg").className = "msg", 3800); } catch (_) {} };   // S: ortak.js'teki genel uyarı kutusu

const IK = {
  kapat: '<path d="M6 6l12 12M18 6L6 18"/>', alev: '<path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.4 1 2 2 2 0-3-1-5 1-8z"/>',
  mama: '<path d="M4 11h16l-1.5 7a2 2 0 0 1-2 1.6H7.5a2 2 0 0 1-2-1.6z"/><path d="M8 11c0-2 1.8-3.4 4-3.4s4 1.4 4 3.4"/><path d="M12 4v1.6M9 5l.6 1.4M15 5l-.6 1.4"/>',
  su: '<path d="M12 3s6 6.2 6 10.4A6 6 0 0 1 6 13.4C6 9.2 12 3 12 3z"/><path d="M9.2 14.2a3 3 0 0 0 2.2 2.2"/>',
  sunger: '<rect x="4" y="9" width="16" height="9" rx="3.5"/><path d="M8 9V7M12 9V6.5M16 9V7"/><circle cx="8.5" cy="13.5" r=".7"/><circle cx="12" cy="14.5" r=".7"/><circle cx="15.5" cy="13.2" r=".7"/>',
  kalp: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', tik: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  kisi: '<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c3 0 5 1.4 5 4.3"/>', soru: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6M12 17h.01"/>',
  buz: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9 4.5L12 6.5l3-2M9 19.5l3-2 3 2"/>',
};
const ik = (k, sinif = "") => `<svg class="pe-i ${sinif}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[k]}</svg>`;
const titret = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} };
const ilk = a => (String(a || "?").trim()[0] || "?").toLocaleUpperCase("tr");
const renkOf = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return "hsl(" + (h % 360) + " 38% 46%)"; };
const kalanYaz = ms => { const g = Math.floor(ms / 864e5), s = Math.floor((ms % 864e5) / 36e5); return g > 0 ? g + " gün " + s + " saat" : s > 0 ? s + " saat" : "birkaç dakika"; };

export function petEkraniAc({ chatId, me, getChat, onKapat }) {
  if (document.querySelector(".pe-ov")) return;
  const ov = el("div", "pe-ov"), sheet = el("div", "pe-sheet"), sahne = el("div", "pe-sahne"), panel = el("div", "pe-panel");
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Sınıf hayvanı");
  const gok = el("div", "pe-gok"), tepe = el("div", "pe-tepe"), zemin = el("div", "pe-zemin"), hayvanKutu = el("div", "pe-hayvan"), balon = el("div", "pe-balon"), kapatB = el("button", "pe-kapat"), ust = el("div", "pe-ust");
  kapatB.type = "button"; kapatB.setAttribute("aria-label", "Kapat"); kapatB.innerHTML = ik("kapat");
  const yardimB = el("button", "pe-yardim"); yardimB.type = "button"; yardimB.setAttribute("aria-label", "Rehber: hayvan seni gezdirsin"); yardimB.innerHTML = ik("soru"); balon.setAttribute("role", "status"); balon.setAttribute("aria-live", "polite"); gok.innerHTML = '<i class="pe-bulut b1"></i><i class="pe-bulut b2"></i><i class="pe-bulut b3"></i><span class="pe-gunes"></span><span class="pe-yildizlar"></span>';
  zemin.innerHTML = '<i class="pe-tepe1"></i><i class="pe-tepe2"></i><i class="pe-cim"></i>';
  sahne.append(gok, zemin, ust, balon, hayvanKutu, yardimB, kapatB); sheet.append(sahne, panel); ov.append(sheet); document.body.append(ov); document.body.classList.add("pe-kilit");
  requestAnimationFrame(() => ov.classList.add("ac"));

  let prevTemiz = null, taslak = null, ekipAcik = false, tur = null, dokunma = 0, mod = null, secim = null, anahtar = "", konusTimer = 0, balonTimer = 0, uykuUyanik = 0, kapali = false, yazilan = "", islemde = false;
  const veri = () => { const c = getChat(); return { c, d: c ? petDurum(c) : { var: false }, saat: new Date().getHours() }; };
  const ad = me.ad || "";

  /* ---------- konuşma balonu, kalpler, konfeti ---------- */
  function konus(m) {
    if (!m || kapali) return; balon.textContent = m; balon.classList.remove("goster"); void balon.offsetWidth; balon.classList.add("goster");
    clearTimeout(balonTimer); balonTimer = setTimeout(() => balon.classList.remove("goster"), 5600);
  }
  function kalpler(n = 5) { for (let i = 0; i < n; i++) { const k = el("span", "pe-kalp"); k.innerHTML = ik("kalp"); k.style.setProperty("--x", (Math.random() * 120 - 60) + "px"); k.style.setProperty("--g", (i * 90) + "ms"); k.style.setProperty("--b", (14 + Math.random() * 14) + "px"); hayvanKutu.append(k); setTimeout(() => k.remove(), 1700 + i * 90); } }
  function konfeti(n = 36) { const R = ["#f6c945", "#ef8fa5", "#7cc4f0", "#9bd36b", "#ffb15c", "#b69cf2"]; for (let i = 0; i < n; i++) { const k = el("i", "pe-konfeti"); k.style.setProperty("--x", (Math.random() * 280 - 140) + "px"); k.style.setProperty("--y", (-120 - Math.random() * 160) + "px"); k.style.setProperty("--r", (Math.random() * 720 - 360) + "deg"); k.style.background = R[i % R.length]; k.style.animationDelay = (Math.random() * 180) + "ms"; sahne.append(k); setTimeout(() => k.remove(), 1900); } }

  /* ---------- sahne ---------- */
  function sahneCiz(zorla) {
    const { c, d, saat } = veri(); if (!c || !d.var) return;
    const gece = saat >= 21 || saat < 6, aksam = saat >= 17 && !gece, uyku = gece && !uykuUyanik && d.mod === "yasiyor";
    sahne.className = "pe-sahne " + (gece ? "gece" : aksam ? "aksam" : "gunduz");
    const cm0 = d.camur || {}, kirli = !!(cm0.var && !cm0.adimA) && d.mod === "yasiyor", kopuklu = !!(cm0.var && cm0.adimA && !cm0.temiz) && d.mod === "yasiyor";
    const lider = d.mod === "secim" && d.oyDurumu && d.oyDurumu.toplam ? Object.keys(d.oyDurumu.dag).sort((a, b) => d.oyDurumu.dag[b] - d.oyDurumu.dag[a])[0] : "", onizle = mod === "degistir" ? (secim || "") : d.mod === "secim" ? ((taslak && taslak.tur) || lider || "") : "", k = [d.mod, d.tur && d.tur.id, d.evre, d.ruh, uyku ? 1 : 0, kirli ? 1 : 0, kopuklu ? 1 : 0, onizle, mod].join("|");
    if (k === anahtar && !zorla) return; const ilkMi = !anahtar; anahtar = k;
    const kap = el("div", "pe-oyun"); kap.tabIndex = 0; kap.setAttribute("role", "button"); kap.setAttribute("aria-label", d.ad ? d.ad + " ile oyna" : "Hayvanla oyna");
    kap.innerHTML = onizle ? petSvg({ tur: onizle, evre: 2, kimlik: "pe" }) : d.mod === "yildiz" ? yildizSvg() : d.mod === "secim" ? yumurtaSvg(null, { kimlik: "pe" }) : d.evre === 0 ? yumurtaSvg(d.tur.id, { kimlik: "pe" }) : petSvg({ tur: d.tur.id, evre: d.evre, ruh: d.ruh, uyku, kirli, kopuklu, kimlik: "pe" });
    kap.onclick = () => oyna(); kap.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); oyna(); } };
    hayvanKutu.querySelector(".pe-oyun")?.remove(); hayvanKutu.prepend(kap); if (!ilkMi && !zorla) { kap.classList.add("pop"); }
  }
  function oyna() {
    const { d, saat } = veri(); if (!d.var || d.mod === "yildiz") return; const kap = hayvanKutu.querySelector(".pe-oyun"); if (!kap) return;
    if (sahne.dataset.kaydi) return; dokunma++;
    if ((saat >= 21 || saat < 6) && d.mod === "yasiyor" && !uykuUyanik) { uykuUyanik = Date.now(); sahneCiz(true); setTimeout(() => { uykuUyanik = 0; sahneCiz(true); }, 20000); konus("Hm? Uyanıyorum… günaydın… yani iyi geceler."); return; }
    const t = dokunTepkisi(d, dokunma, { ad });
    kap.classList.remove("zipla", "cekingen"); void kap.offsetWidth;
    if (t.tur === "cekingen") { kap.classList.add("cekingen"); setTimeout(() => kap.classList.remove("cekingen"), 1900); } else { kap.classList.add("zipla"); kalpler(t.tur === "yumurta" ? 0 : 4); setTimeout(() => kap.classList.remove("zipla"), 800); }
    konus(t.soz);
  }
  function rastgeleKonus() {
    const { c, d, saat } = veri(); if (!c || !d.var) return;
    const sr = seriHesapla(c), dun = (() => { const p = c.pet || {}, dk = gunAnahtar(new Date(Date.now() - 864e5)), kim = Object.keys(p.bes || {}).filter(u => (p.bes[u] || []).some(x => x.startsWith(dk))); return kim.length ? (c.uyeAd && c.uyeAd[kim[Math.floor(Math.random() * kim.length)]]) : ""; })();
    konus(sozSec(d, { ad, saat, seri: sr.n, bakici: (dun || "").split(" ")[0], siraBende: d.sira.includes(me.uid) && !benVerdi("m"), temizSirasi: !!(d.camur.var && !d.camur.temiz && (d.camur.a === me.uid || d.camur.b === me.uid)), es: ((c.uyeAd || {})[d.camur.a === me.uid ? d.camur.b : d.camur.a] || "").split(" ")[0] }));
  }

  /* ---------- panel ---------- */
  const benVerdi = t => { const { c } = veri(), l = (((c && c.pet && c.pet.bes) || {})[me.uid]) || []; return l.includes(gunAnahtar(new Date()) + t); };
  const bar = (n, g, sinif) => { const b = el("div", "pe-bar " + (sinif || "")), i = el("i"); i.style.width = Math.min(100, g ? Math.round(n / g * 100) : 0) + "%"; b.append(i); return b; };

  /* ---------- ilk seçim: sınıf oylaması ---------- */
  function oyCiz(d, c) {
    const k = el("div", "pe-sec"), s = d.oyDurumu || oySayim(c), p = c.pet, benim = p.oy && p.oy[me.uid] ? oyAyir(p.oy[me.uid]) : null;
    const bas = el("div", "pe-bas"); bas.append(el("h2", "", "Sınıfınızın hayvanını birlikte seçin"));
    bas.append(el("p", "pe-alt pe-oy-bilgi", d.secimKalanMs ? "Herkes oy verir, en çok oyu alan hayvan sınıfınızın olur. Oylama " + kalanYaz(d.secimKalanMs) + " sonra bitiyor. Bu sürede fikrini istediğin kadar değiştirebilirsin, ücretsiz." : "Oylama bitti, sonuç birazdan açıklanacak."));
    k.append(bas);
    const kat = el("div", "pe-kat"); kat.append(bar(s.toplam, s.kisi, "oy"), el("small", "", s.toplam + "/" + s.kisi + " kişi oy verdi")); k.append(kat);
    const izgara = el("div", "pe-izgara");
    HAYVANLAR.forEach(h => {
      const sec = taslak ? taslak.tur === h.id : benim && benim.tur === h.id, n = s.dag[h.id] || 0;
      const b = el("button", "pe-kart" + (sec ? " secili" : "") + (benim && benim.tur === h.id ? " oyum" : "")); b.type = "button"; b.setAttribute("aria-pressed", String(!!sec));
      const r = el("div", "pe-kart-r"); r.innerHTML = petSvg({ tur: h.id, evre: 2, kimlik: "k" + h.id }); const rozet = el("span", "pe-oy-rozet" + (n ? " var" : ""), n ? String(n) : ""); b.append(r, rozet, el("b", "", h.ad), el("small", "", h.ozellik));
      if (n) { const av = el("div", "pe-av mini"); (s.oylar[h.id] || []).slice(0, 4).forEach(o => { const a = el("span", "pe-a", ilk((c.uyeAd || {})[o.uid])); a.style.background = renkOf(o.uid); a.title = (c.uyeAd || {})[o.uid] || ""; av.append(a); }); if (n > 4) av.append(el("span", "pe-a daha", "+" + (n - 4))); b.append(av); }
      b.onclick = () => { taslak = { tur: h.id, ad: (benim && benim.tur === h.id && benim.ad) || (taslak && taslak.tur === h.id && taslak.ad) || "" }; sahneCiz(); konus("Merhaba! Ben " + h.ad.toLocaleLowerCase("tr") + ". " + h.ozellik + ". Bana oy verir misin?"); panelCiz(); setTimeout(() => { const i = panel.querySelector(".pe-isim"); if (i) i.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 60); };
      izgara.append(b);
    });
    k.append(izgara);
    if (taslak) {
      const h = HAYVANLAR.find(x => x.id === taslak.tur), kutu = el("div", "pe-isim"), inp = el("input"); inp.type = "text"; inp.maxLength = 20; inp.value = taslak.ad; inp.placeholder = "İsim önerisi (isteğe bağlı)"; inp.setAttribute("aria-label", "Hayvanın adı için öneri"); inp.autocomplete = "off";
      inp.oninput = () => { taslak.ad = inp.value; };
      const oner = el("div", "pe-oner"); h.isimler.forEach(n => { const c2 = el("button", "pe-chip", n); c2.type = "button"; c2.onclick = () => { taslak.ad = n; inp.value = n; }; oner.append(c2); });
      const onay = el("button", "btn pe-onay", benim ? "Oyumu değiştir" : "Oyumu ver"); onay.type = "button";
      onay.onclick = async () => {
        if (islemde) return; islemde = true; onay.disabled = true;
        try { const r = await oyVer(getChat(), taslak.tur, taslak.ad, me.uid); toast(r.ayni ? "Oyun zaten bu." : "Oyun kaydedildi. Arkadaşlarınla konuşup onları da ikna edebilirsin!", true); titret(); kalpler(3); taslak = null; anahtar = ""; sahneCiz(true); }
        catch (e) { toast(e.message || "Oy verilemedi."); onay.disabled = false; } finally { islemde = false; panelCiz(); }
      };
      kutu.append(inp, oner, el("small", "pe-ipucu", "İsim önermek isteğe bağlı. Kazanan hayvana en çok önerilen isim verilir."), onay);
      const vz = el("button", "pe-link", "Vazgeç"); vz.type = "button"; vz.onclick = () => { taslak = null; sahneCiz(true); panelCiz(); }; kutu.append(vz); k.append(kutu);
    } else if (benim) { const t = HAYVANLAR.find(x => x.id === benim.tur); k.append(el("p", "pe-senin", "Senin oyun: " + (t ? t.ad : "") + (benim.ad ? " · “" + benim.ad + "”" : "") + ". Değiştirmek için başka bir karta dokun.")); }
    k.append(ekipCiz(d, c)); return k;
  }
  /* ---------- bakım ekibi: kim ne yaptı, kimin sırası ---------- */
  function ekipCiz(d, c) {
    const kutu = el("div", "pe-ekip"), satirlar = bakimEkibi(c), b = el("button", "pe-ekip-ac"); b.type = "button"; b.setAttribute("aria-expanded", String(ekipAcik));
    const bugun = satirlar.filter(x => x.mama || x.su).length, oyVeren = satirlar.filter(x => x.oy).length;
    b.innerHTML = ik("kisi") + "<span>Sınıf ekibi</span><small>" + (d.mod === "secim" ? oyVeren + " kişi oy verdi" : bugun + " kişi bugün ilgilendi") + "</small><i class=\"pe-ok\"></i>";
    b.onclick = () => { ekipAcik = !ekipAcik; panelCiz(); if (ekipAcik) setTimeout(() => b.scrollIntoView({ block: "start", behavior: "smooth" }), 40); }; kutu.append(b);
    if (!ekipAcik) return kutu;
    const liste = el("div", "pe-ekip-liste");
    satirlar.forEach(x => {
      const sat = el("div", "pe-uye" + (x.uid === me.uid ? " ben" : "")), av = el("span", "pe-a", ilk(x.ad)); av.style.background = renkOf(x.uid);
      const kim = el("div", "pe-uye-k"), ismi = el("b", "", x.ad.split(" ")[0] + (x.uid === me.uid ? " (sen)" : "")), alt = el("div", "pe-rozetler");
      if (d.mod === "secim") { if (x.oy) { const h = HAYVANLAR.find(z => z.id === x.oy), r = el("span", "pe-rz oy"); r.innerHTML = miniKafa(x.oy, 2, "o" + x.uid.slice(0, 4)) + (h ? h.ad : ""); alt.append(r); } else alt.append(el("span", "pe-rz bekle", "henüz oy vermedi")); }
      else {
        if (x.sira && !(x.mama && x.su)) alt.append(el("span", "pe-rz sira", "Sırası bugün"));
        if (x.temiz) alt.append(el("span", "pe-rz temiz" + (x.temizYapti ? " yapti" : ""), (x.temiz === "a" ? "Köpükle" : "Durula") + (x.temizYapti ? " ✓" : "")));
        if (x.mama) alt.append(el("span", "pe-rz mama", "mama ✓")); if (x.su) alt.append(el("span", "pe-rz su", "su ✓"));
        if (x.hafta) alt.append(el("span", "pe-rz hafta", "bu hafta " + x.hafta + " bakım"));
        if (!alt.childNodes.length) alt.append(el("span", "pe-rz bekle", "bugün serbest"));
      }
      kim.append(ismi, alt); sat.append(av, kim); liste.append(sat);
    });
    liste.append(el("p", "pe-gizli", "Mama ve su çantan sana özel; başkaları görmez. Burada yalnızca bugünkü sıra ve yapılan işler görünür."));
    kutu.append(liste); return kutu;
  }
  /* ---------- sınıf hedefleri ve iyilik görevleri ---------- */
  function hedefCiz(c) {
    const kutu = el("div", "pe-hedef");
    hedefler(c).forEach(h => { const sat = el("div", "pe-hs"), ust2 = el("div", "pe-hs-u"); ust2.append(el("small", "", "Sınıf hedefi: " + h.ad), el("b", "", h.n + "/" + h.hedef)); sat.append(ust2, bar(h.n, h.hedef, "hdf")); kutu.append(sat); });
    return kutu;
  }
  function fikirCiz() {   // ödülsüz "günün iyilik fikri": sınıfça birbirimize yaklaşmak için küçük bir öneri
    const g = bugunGorevler(me.uid, gunAnahtar(new Date()))[0], k = el("div", "pe-fikir"); k.append(el("small", "", "Günün iyilik fikri · " + g.kat), el("p", "", g.metin)); return k;
  }
  function kazanCiz() {
    const k = el("p", "pe-kazan"); k.innerHTML = "<b>Mama ve su nasıl kazanılır?</b><br>Takım görevi kanıtı: <b>3 mama</b> · Keşfet’i sonuna kadar gezmek: <b>1 mama</b> (günde bir) · Çamuru temizlemek: <b>1 mama</b> · Günün ilk sınıf mesajı: <b>1 su</b>"; return k;
  }
  function seciciCiz(d, degistirMi) {
    const k = el("div", "pe-sec");
    const bas = el("div", "pe-bas"); bas.append(el("h2", "", "Hayvanı değiştir"));
    bas.append(el("p", "pe-alt", degistirMi ? "Bu hakkı yalnızca bir kez kullanabilirsiniz ve " + SABIT.DEGISTIR_MAMA + " mama harcar." : "Yumurtanız hazır! " + (d.secimKalanMs ? "Seçmek için " + kalanYaz(d.secimKalanMs) + " kalan süre var. Süre dolarsa hayvan kendiliğinden atanır." : "Süre doldu, hayvan birazdan atanacak.")));
    k.append(bas);
    const izgara = el("div", "pe-izgara");
    HAYVANLAR.forEach(h => {
      const b = el("button", "pe-kart" + (secim === h.id ? " secili" : "")); b.type = "button"; b.setAttribute("aria-pressed", String(secim === h.id));
      const r = el("div", "pe-kart-r"); r.innerHTML = petSvg({ tur: h.id, evre: 2, kimlik: "k" + h.id }); b.append(r, el("b", "", h.ad), el("small", "", h.ozellik));
      b.onclick = () => { secim = h.id; if (!yazilan || HAYVANLAR.some(x => x.isimler.includes(yazilan))) yazilan = h.isimler[Math.floor(Math.random() * h.isimler.length)]; sahneCiz(); konus("Merhaba! Ben " + h.ad.toLocaleLowerCase("tr") + ". " + h.ozellik + ". Beni seçer misin?"); panelCiz(); setTimeout(() => { const i = panel.querySelector(".pe-isim"); if (i) i.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 60); }; izgara.append(b);
    });
    k.append(izgara);
    if (secim) {
      const h = HAYVANLAR.find(x => x.id === secim), kutu = el("div", "pe-isim"), inp = el("input"); inp.type = "text"; inp.maxLength = 20; inp.value = yazilan; inp.placeholder = "Bir isim ver"; inp.setAttribute("aria-label", "Hayvanın adı");
      inp.oninput = () => { yazilan = inp.value; };
      const oner = el("div", "pe-oner"); h.isimler.forEach(n => { const c = el("button", "pe-chip", n); c.type = "button"; c.onclick = () => { yazilan = n; inp.value = n; }; oner.append(c); });
      const onay = el("button", "btn pe-onay", degistirMi ? "Değiştir (" + SABIT.DEGISTIR_MAMA + " mama)" : "Sınıfımızın hayvanı olsun"); onay.type = "button";
      onay.onclick = async () => {
        if (islemde) return; islemde = true; onay.disabled = true;
        try { await petSec(chatId, secim, inp.value, me.uid, !!degistirMi); toast((inp.value || h.ad).trim() + " sınıfınıza katıldı!", true); mod = null; secim = null; yazilan = ""; anahtar = ""; konfeti(); sahneCiz(true); panelCiz(); setTimeout(() => konus(eylemSozu("evre", { ad })), 600); }
        catch (e) { toast(e.message || "Seçilemedi."); onay.disabled = false; } finally { islemde = false; }
      };
      kutu.append(inp, oner, onay); if (degistirMi) { const v = el("button", "pe-link", "Vazgeç"); v.type = "button"; v.onclick = () => { mod = null; secim = null; panelCiz(); }; kutu.append(v); }
      k.append(kutu);
    }
    return k;
  }
  function yildizCiz(d, c) {
    const k = el("div", "pe-yildiz-p"), p = c.pet;
    k.append(el("h2", "", (d.ad || "Hayvanınız") + " yıldız oldu"));
    k.append(el("p", "pe-alt", "Sınıfınız " + (p.gelisim || 0) + " gün boyunca ona iyi baktı. Şimdi gökyüzünden sizi izliyor. Yeni bir yumurta alınca ona daha dikkatli bakın."));
    const b = el("button", "btn pe-onay", "Yeni bir yumurta al"); b.type = "button";
    b.onclick = async () => { b.disabled = true; try { await yeniYumurta(chatId); anahtar = ""; toast("Yeni bir yumurta geldi!", true); } catch (e) { toast("Yumurta alınamadı."); b.disabled = false; } };
    k.append(b); return k;
  }
  function bakimCiz(d, c) {
    const k = el("div", "pe-bakim"), sr = seriHesapla(c), e = env(), bk = gunAnahtar(new Date());
    // başlık
    const bas = el("div", "pe-bas"), t = el("h2", "", d.evre === 0 ? "Yumurta (" + d.tur.ad + ")" : d.ad); bas.append(t);
    const alt = d.evre === 0 ? "İlk bakım gününde çatlayacak." : d.evreAd + " · " + d.gelisim + " bakım günü";
    bas.append(el("p", "pe-alt", alt)); k.append(bas);
    if (d.sonrakiEvre) { const g = el("div", "pe-gel"); const e0 = [0, 1, 5, 12, 24][d.evre], e1 = [0, 1, 5, 12, 24][d.evre + 1]; g.append(bar(d.gelisim - e0, e1 - e0, "gel"), el("small", "", d.sonrakiEvre.ad + " olmasına " + d.sonrakiEvre.kalan + " bakım günü")); k.append(g); }
    // seri
    const sat = el("div", "pe-seri"); const chip = el("span", "pe-seri-chip" + (sr.n >= 30 ? " b3" : sr.n >= 7 ? " b2" : "")); chip.innerHTML = alevSvg(sr.n) + "<b>" + sr.n + "</b> günlük seri"; sat.append(chip);
    if (sr.dondurulmus) sat.append(el("span", "pe-donuk", "Bugün donduruldu"));
    else { const dd = dondurulabilir(c, bk); if (dd.ok && sr.n >= 2) { const b = el("button", "pe-dondur", ""); b.type = "button"; b.innerHTML = ik("buz") + " Seriyi dondur <small>(" + d.dondur.kalan + " hak)</small>"; let onay = false; b.onclick = async () => { if (!onay) { onay = true; b.classList.add("emin"); b.innerHTML = ik("buz") + " Emin misin? Tekrar dokun"; setTimeout(() => { if (!b.isConnected) return; onay = false; b.classList.remove("emin"); b.innerHTML = ik("buz") + " Seriyi dondur <small>(" + d.dondur.kalan + " hak)</small>"; }, 3500); return; } try { await seriDondur(getChat(), bk); toast("Bugün donduruldu. Seri güvende!", true); panelCiz(); } catch (er) { toast(er.message || "Dondurulamadı."); } }; sat.append(b); } }
    k.append(sat); k.append(hedefCiz(c));
    // bugünkü bakım
    if (d.evre > 0) {
      const g = el("div", "pe-gun"); g.append(el("h3", "", "Bugünkü bakım"), el("p", "pe-alt", "Sınıfın yarısı (" + d.gerek + " kişi) mama ve su verirse " + d.ad + " mutlu olur."));
      [["mama", "Mama", d.bugun.mama], ["su", "Su", d.bugun.su]].forEach(([t2, y, n]) => { const sat2 = el("div", "pe-sat"), ye = el("span", "pe-et", ""); ye.innerHTML = ik(t2) + y; sat2.append(ye, bar(n, d.gerek, t2 + (n >= d.gerek ? " tam" : "")), el("b", "", n + "/" + d.gerek)); g.append(sat2); });
      // bakıcılar
      const p = c.pet || {}, kim = Object.keys(p.bes || {}).filter(u => (p.bes[u] || []).some(x => x.startsWith(bk)));
      if (kim.length || d.sira.includes(me.uid)) { const b = el("div", "pe-bakici"); b.append(el("small", "", kim.length ? "Bugün ilgilenenler" : "Henüz kimse ilgilenmedi")); const av = el("div", "pe-av"); kim.slice(0, 10).forEach(u => { const a = el("span", "pe-a", ilk((c.uyeAd || {})[u])); a.style.background = renkOf(u); a.title = (c.uyeAd || {})[u] || ""; av.append(a); }); if (kim.length > 10) av.append(el("span", "pe-a daha", "+" + (kim.length - 10))); b.append(av); g.append(b); }
      if (d.sira.includes(me.uid) && !(benVerdi("m") && benVerdi("s"))) g.append(el("div", "pe-sira", "Bugün sıra sende! Bir mama ve bir su vermen yeter."));
      k.append(g);
      if (d.camur.var) k.append(camurKart(d, c));
      // düğmeler
      const eylem = el("div", "pe-eylem");
      const bekletildi = ogrenciListe(c).includes(me.uid) && new Date().getHours() < SABIT.SIRA_SAATI && !d.sira.includes(me.uid);   // önce sırası gelenler beslesin
      const mk = (t2, y, kalan, gonder, verdi) => { const b = el("button", "pe-btn " + t2 + (verdi ? " tamam" : ""), ""); b.type = "button"; b.innerHTML = ik(t2) + "<span>" + (verdi ? y + " verdin" : y + " ver") + "</span><small>" + (verdi ? "✓" : bekletildi ? SABIT.SIRA_SAATI + ":00'den sonra" : kalan + " var") + "</small>"; b.disabled = verdi || bekletildi; b.onclick = gonder; return b; };
      const yem = async t2 => { if (islemde) return; islemde = true; try { const r = await besle(getChat(), t2, me.uid); if (r.zatenVar) toast("Bugün zaten verdin."); else { yemAnim(t2); } } catch (er) { toast(er.message || "Olmadı."); } finally { islemde = false; panelCiz(); } };
      eylem.append(mk("mama", "Mama", e.mama, () => yem("m"), benVerdi("m")), mk("su", "Su", e.su, () => yem("s"), benVerdi("s")));
      k.append(eylem);
      if (bekletildi) k.append(el("p", "pe-sira-not", "Önce sırası gelen arkadaşlar besler: " + d.sira.map(u => ad1(c, u)).join(", ") + ". Saat " + SABIT.SIRA_SAATI + "’den sonra herkes katılabilir."));
      k.append(el("p", "pe-canta", "Çantan: " + e.mama + " mama · " + e.su + " su"));
    }
    k.append(fikirCiz()); k.append(kazanCiz());
    k.append(ekipCiz(d, c));
    if (d.degistirilebilir && d.evre >= 0) { const l = el("button", "pe-link", "Hayvanı değiştir (bir kez, " + SABIT.DEGISTIR_MAMA + " mama)"); l.type = "button"; l.onclick = () => { mod = "degistir"; secim = null; yazilan = ""; panelCiz(); }; k.append(l); }
    return k;
  }
  /* ---------- çamur: iki kişilik temizlik ---------- */
  const ad1 = (c, u) => String(((c.uyeAd || {})[u]) || "Arkadaşın").split(" ")[0];
  async function temizleIslem() {
    if (islemde) return; islemde = true;
    try {
      const r = await temizle(getChat(), me.uid, new Date().getHours());
      if (r.zatenVar) toast("Bu adımı zaten yaptın.");
      else { kalpler(r.bitti ? 9 : 4); if (r.bitti) { konfeti(34); konus(eylemSozu("temiz", { ad })); toast("Tertemiz oldu! Birlikte harika iş çıkardınız.", true); } else { konus(eylemSozu("kopuk", { ad })); toast("Köpüklendi! Şimdi durulama sırası.", true); } }
      anahtar = ""; sahneCiz(true);
    } catch (er) { toast(er.message || "Olmadı."); } finally { islemde = false; panelCiz(); }
  }
  function camurKart(d, c) {
    const cm = d.camur, k = el("div", "pe-camur" + (cm.temiz ? " temiz" : "")), benim = camurAdimim(cm, me.uid), ikilide = cm.a === me.uid || cm.b === me.uid, es = cm.a === me.uid ? cm.b : cm.a;
    const bas = el("p", "pe-camur-bas"); bas.innerHTML = cm.temiz ? "<b>" + (d.ad || "Hayvan") + " tertemiz!</b> " + ad1(c, cm.yapanA || cm.a) + " ve " + ad1(c, cm.yapanB || cm.b) + " birlikte temizledi." : "<b>Çamur günü!</b> " + (d.ad || "Hayvan") + " çamura girdi. Bugünkü temizlik ikilisi:";
    k.append(bas);
    const adimlar = el("div", "pe-adimlar");
    [["a", cm.a, "Köpükle", cm.adimA, cm.yapanA], ["b", cm.b, "Durula", cm.adimB, cm.yapanB]].forEach(([s, u, rol, yapti, yapan]) => {
      const sat = el("div", "pe-adim" + (yapti ? " tamam" : "") + (!yapti && benim === s ? " sira" : "")), av = el("span", "pe-a", ilk((c.uyeAd || {})[yapan || u])); av.style.background = renkOf(yapan || u);
      const kim = el("div", "pe-adim-k"), ismi = el("b", "", (yapan && yapan !== u ? ad1(c, yapan) + " (yardım etti)" : ad1(c, u)) + (u === me.uid && !yapti ? " (sen)" : "")); kim.append(ismi, el("small", "", rol));
      sat.append(av, kim);
      if (yapti) { const t = el("span", "pe-tik"); t.innerHTML = ik("tik"); sat.append(t); }
      else if (benim === s) { const b = el("button", "pe-adim-btn", (ikilide ? "" : "Yardım et: ") + rol); b.type = "button"; b.onclick = temizleIslem; sat.append(b); }
      else sat.append(el("small", "pe-bekle", s === "b" && !cm.adimA ? "köpüklenince" : cm.yardim ? "" : "bekliyor"));
      adimlar.append(sat);
    });
    k.append(adimlar);
    if (!cm.temiz) {
      if (ikilide && !cm.tek && es) { const y = el("button", "pe-yaz", ""); y.type = "button"; y.textContent = ad1(c, es) + "’a mesaj yaz"; y.onclick = () => { kapat(); setTimeout(() => window.dispatchEvent(new CustomEvent("salvea-dmac", { detail: { uid: es, chatId } })), 380); }; k.append(y); k.append(el("small", "pe-ipucu", "Köpüklemeyi kim yapsın, durulamayı kim? Birbirinize yazıp anlaşın.")); }
      else if (!ikilide) k.append(el("small", "pe-ipucu", cm.yardim ? "Öğleden sonra oldu: sen de yardım edebilirsin." : "İkili hallederse harika; öğleden sonra herkes yardım edebilir."));
    }
    return k;
  }
  function yemAnim(t2) {
    const f = el("span", "pe-yem " + (t2 === "m" ? "mama" : "su")); f.innerHTML = ik(t2 === "m" ? "mama" : "su"); hayvanKutu.append(f); setTimeout(() => f.remove(), 1100);
    const kap = hayvanKutu.querySelector(".pe-oyun"); setTimeout(() => { if (kap) { kap.classList.remove("yiyor"); void kap.offsetWidth; kap.classList.add("yiyor"); setTimeout(() => kap.classList.remove("yiyor"), 1400); } kalpler(5); konus(eylemSozu(t2 === "m" ? "yem" : "su", { ad })); }, 700);
  }
  function ustCiz(d, c) {
    ust.replaceChildren(); if (!d.var) return; const sr = seriHesapla(c);
    if (d.mod !== "secim") { const s = el("span", "pe-ust-seri"); s.innerHTML = alevSvg(sr.n) + "<b>" + sr.n + "</b>"; ust.append(s); }
    const sinif = (c.ad || "").replace(/ Sınıfı$/, ""); ust.append(el("span", "pe-ust-ad", d.mod === "secim" ? sinif + " sınıfı" : (d.ad ? d.ad + " · " + sinif : sinif)));
  }
  function panelCiz() {
    const { c, d } = veri(); panel.replaceChildren(); if (!c || !d.var) { panel.append(el("p", "pe-alt", "Hayvan hazırlanıyor… birazdan burada olacak.")); return; }
    ustCiz(d, c);
    if (mod === "degistir") panel.append(seciciCiz(d, true));
    else if (d.mod === "secim") panel.append(oyCiz(d, c));
    else if (d.mod === "yildiz") panel.append(yildizCiz(d, c));
    else panel.append(bakimCiz(d, c));
  }

  /* ---------- maskot rehberi ---------- */
  function turAdimlari() {
    const { d } = veri(), q = s => () => panel.querySelector(s) || sahne.querySelector(s) || null, a = [];
    a.push({ hedef: () => hayvanKutu.querySelector(".pe-oyun") || hayvanKutu, metin: m => "Merhaba, ben " + m.ad + "! Bir " + m.tanim + "yim. " + (d.mod === "secim" ? "Sınıfınızın hayvanını birlikte seçmeniz için buradayım." : "Bu pencerede sınıfınızın hayvanına birlikte bakacaksınız.") + " Ona dokunursan tepki verir." });
    a.push({ hedef: q(".pe-ust-seri"), metin: () => "Bu, sınıfınızın günlük sohbet serisi. Her gün yazışırsanız büyür. Hafta sonu seriyi bozmaz, istersen ayda iki kez dondurabilirsin." });
    if (d.mod === "secim") {
      a.push({ hedef: q(".pe-kart"), metin: () => "Bir karta dokunup oy ver. En çok oyu alan hayvan sınıfınız olur. Önce davranan değil, herkes birlikte karar verir." });
      a.push({ hedef: q(".pe-oy-bilgi"), metin: () => "Üç gün boyunca fikrini istediğin kadar değiştirebilirsin, ücretsiz. Arkadaşlarınla konuşup onları ikna etmeyi dene!" });
    } else if (d.mod === "yasiyor") {
      a.push({ hedef: q(".pe-gel"), metin: () => "Hayvan bakım günleriyle büyür: yumurtadan yetişkine beş evre var." });
      a.push({ hedef: q(".pe-gun"), metin: () => "Her gün sınıfın yarısı mama ve su verirse hayvan mutlu olur. Üç okul günü bakılmazsa yıldıza döner, o yüzden birlikte ilgilenin." });
      a.push({ hedef: q(".pe-btn.mama"), metin: () => "Mama vermek için buraya bas. Mama ve suyu görev yaparak ve sohbet ederek kazanırsın." });
      a.push({ hedef: q(".pe-btn.su"), metin: () => "Su da aynı şekilde. Bugün sıra sende olabilir, haberin olsun!" });
      a.push({ hedef: q(".pe-camur"), metin: () => "Hayvan arada çamura girer. İki kişi birlikte temizler: biri köpükler, diğeri durular. Konuşup anlaşın!" });
      a.push({ hedef: q(".pe-kazan"), metin: () => "Mama kolay kazanılmaz: en çok takım görevlerini yapınca (3 mama), Keşfet’i sonuna kadar gezince ve çamuru temizleyince kazanırsın. Önce o gün sırası gelen arkadaşlar besler." });
    }
    a.push({ hedef: q(".pe-ekip-ac"), metin: () => "Burada kimin sırası olduğunu ve kimlerin ilgilendiğini görürsün." });
    a.push({ hedef: () => yardimB, metin: m => "Beni tekrar görmek istersen buraya bas. Hayvanınıza iyi bakın, hoşça kalın!" });
    return a;
  }
  function turBaslat() {
    if (kapali || document.querySelector(".hr-ov")) return; tur = maskotTur({ adimlar: turAdimlari(), maskot: maskotSec(), onBitir: () => { tur = null; } });
    try { localStorage.setItem("salvea_hr_" + me.uid, "1"); } catch (_) {}
  }
  yardimB.onclick = turBaslat;

  /* ---------- evre kutlaması (yalnızca evre artınca) ---------- */
  function evreKontrol() {
    const { c, d } = veri(); if (!c || !d.var || d.mod !== "yasiyor") return;
    const ak = "salvea_pet_evre_" + chatId + "_" + (c.pet.seriNo || 1); let onceki = null; try { onceki = localStorage.getItem(ak); } catch (_) {}
    if (onceki !== null && d.evre > +onceki) {
      konfeti(44); const b = el("div", "pe-banner"); b.innerHTML = "<b>" + (d.evre === 1 ? d.ad + " yumurtadan çıktı!" : d.ad + " büyüdü!") + "</b><span>" + d.evreAd + " oldu. Hepinize teşekkürler.</span>"; sahne.append(b); setTimeout(() => b.classList.add("git"), 3600); setTimeout(() => b.remove(), 4200);
      const kap = hayvanKutu.querySelector(".pe-oyun"); if (kap) kap.classList.add("pop"); setTimeout(() => konus(eylemSozu("evre", { ad })), 900);
    }
    try { localStorage.setItem(ak, String(d.evre)); } catch (_) {}
  }

  /* ---------- yaşam döngüsü ---------- */
  function yenile() { if (kapali) return; const { d } = veri(), t = d.var && d.camur ? d.camur.temiz : null; if (prevTemiz === false && t === true && !islemde) { kalpler(8); konfeti(26); const c = getChat(); konus(ad1(c, d.camur.yapanA || d.camur.a) + " ve " + ad1(c, d.camur.yapanB || d.camur.b) + " beni tertemiz yaptı, teşekkürler!"); } prevTemiz = t; sahneCiz(); if (!islemde) panelCiz(); evreKontrol(); }
  function kapat() {
    if (kapali) return; kapali = true; clearInterval(zaman); clearTimeout(konusTimer); clearTimeout(balonTimer); window.removeEventListener("salvea-sohbetler", yenile); document.removeEventListener("keydown", tus); window.removeEventListener("resize", vvGuncelle); if (vv) { vv.removeEventListener("resize", vvGuncelle); vv.removeEventListener("scroll", vvGuncelle); } if (tur) tur.kapat();
    ov.classList.remove("ac"); ov.classList.add("kapan"); setTimeout(() => { ov.remove(); document.body.classList.remove("pe-kilit"); if (onKapat) onKapat(); }, 320);
  }
  const tus = e => {
    if (e.key === "Escape") { if (!document.querySelector(".hr-ov")) kapat(); return; }
    if (e.key !== "Tab" || document.querySelector(".hr-ov")) return;   // odak pencerenin içinde kalsın
    const f = [...ov.querySelectorAll("button:not([disabled]),input,[tabindex]:not([tabindex='-1'])")].filter(x => x.offsetParent !== null); if (!f.length) return;
    const ilkE = f[0], sonE = f[f.length - 1]; if (e.shiftKey && document.activeElement === ilkE) { e.preventDefault(); sonE.focus(); } else if (!e.shiftKey && document.activeElement === sonE) { e.preventDefault(); ilkE.focus(); }
  };
  // klavye açılınca pencere görünür alana sığar, sahne küçülür (yazı alanı ve düğme kaymaz)
  const vv = window.visualViewport, vvGuncelle = () => { ov.style.setProperty("--pvh", (vv ? vv.height : innerHeight) + "px"); ov.style.setProperty("--pvt", (vv ? vv.offsetTop : 0) + "px"); };
  vvGuncelle(); if (vv) { vv.addEventListener("resize", vvGuncelle); vv.addEventListener("scroll", vvGuncelle); } window.addEventListener("resize", vvGuncelle);
  ov.addEventListener("focusin", e => { if (e.target.matches && e.target.matches("input")) { ov.classList.add("klavye"); setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 250); } });
  ov.addEventListener("focusout", () => setTimeout(() => { if (!ov.contains(document.activeElement) || !document.activeElement.matches("input")) ov.classList.remove("klavye"); }, 120));
  // aşağı kaydırarak kapat (sahne alanından)
  { let y0 = null, dy = 0, kaydi = false;
    sahne.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; y0 = e.clientY; dy = 0; kaydi = false; });
    sahne.addEventListener("pointermove", e => { if (y0 == null) return; dy = e.clientY - y0; if (dy > 10 && !kaydi) { kaydi = true; sheet.style.transition = "none"; try { sahne.setPointerCapture(e.pointerId); } catch (_) {} } if (kaydi) sheet.style.transform = "translate3d(0," + Math.max(0, dy) + "px,0)"; });
    const bit = () => { if (y0 == null) return; if (kaydi) { sheet.style.transition = ""; if (dy > 110) kapat(); else sheet.style.transform = ""; sahne.dataset.kaydi = "1"; setTimeout(() => delete sahne.dataset.kaydi, 300); } y0 = null; };
    sahne.addEventListener("pointerup", bit); sahne.addEventListener("pointercancel", bit); }
  kapatB.onclick = kapat; ov.addEventListener("click", e => { if (e.target === ov) kapat(); }); document.addEventListener("keydown", tus); window.addEventListener("salvea-sohbetler", yenile);
  const zaman = setInterval(() => { if (!document.hidden) { sahneCiz(); } }, 60000);
  const donguKonus = () => { konusTimer = setTimeout(() => { rastgeleKonus(); donguKonus(); }, 13000 + Math.random() * 9000); };
  { const { d } = veri(); prevTemiz = d.var && d.camur ? d.camur.temiz : null; } evreKontrol(); sahneCiz(true); panelCiz(); setTimeout(rastgeleKonus, 900); donguKonus(); setTimeout(() => kapatB.focus(), 400);
  { let gordu = false; try { gordu = !!localStorage.getItem("salvea_hr_" + me.uid); } catch (_) {} if (!gordu) setTimeout(turBaslat, 1500); }
  return { kapat, yenile, konus, oyna, turBaslat };
}
