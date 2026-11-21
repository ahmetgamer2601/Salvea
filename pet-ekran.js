// Sınıf hayvanı penceresi (TikTok tarzı tam ekran alt sayfa). Canlı sahne, seçim, besleme, çamur temizliği, seri ve bakıcı listesi.
// Veri ek okuma doğurmaz: getChat() zaten dinlenen sınıf sohbet belgesini döndürür; yenileme "salvea-sohbetler" olayıyla gelir.
import { petSvg, yumurtaSvg, yildizSvg } from "./pet-cizim.js";
import { petDurum, HAYVANLAR, SABIT, gunAnahtar, seriHesapla, dondurulabilir, uyeListe } from "./petmantik.js";
import { sozSec, dokunTepkisi, eylemSozu } from "./pet-soz.js";
import { petSec, besle, temizle, yeniYumurta, seriDondur } from "./pet.js";
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
  buz: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9 4.5L12 6.5l3-2M9 19.5l3-2 3 2"/>',
};
const ik = (k, sinif = "") => `<svg class="pe-i ${sinif}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IK[k]}</svg>`;
const ilk = a => (String(a || "?").trim()[0] || "?").toLocaleUpperCase("tr");
const renkOf = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return "hsl(" + (h % 360) + " 38% 46%)"; };
const kalanYaz = ms => { const g = Math.floor(ms / 864e5), s = Math.floor((ms % 864e5) / 36e5); return g > 0 ? g + " gün " + s + " saat" : s > 0 ? s + " saat" : "birkaç dakika"; };

export function petEkraniAc({ chatId, me, getChat, onKapat }) {
  if (document.querySelector(".pe-ov")) return;
  const ov = el("div", "pe-ov"), sheet = el("div", "pe-sheet"), sahne = el("div", "pe-sahne"), panel = el("div", "pe-panel");
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Sınıf hayvanı");
  const gok = el("div", "pe-gok"), tepe = el("div", "pe-tepe"), zemin = el("div", "pe-zemin"), hayvanKutu = el("div", "pe-hayvan"), balon = el("div", "pe-balon"), kapatB = el("button", "pe-kapat"), ust = el("div", "pe-ust");
  kapatB.type = "button"; kapatB.setAttribute("aria-label", "Kapat"); kapatB.innerHTML = ik("kapat"); gok.innerHTML = '<i class="pe-bulut b1"></i><i class="pe-bulut b2"></i><i class="pe-bulut b3"></i><span class="pe-gunes"></span><span class="pe-yildizlar"></span>';
  zemin.innerHTML = '<i class="pe-tepe1"></i><i class="pe-tepe2"></i><i class="pe-cim"></i>';
  sahne.append(gok, zemin, ust, balon, hayvanKutu, kapatB); sheet.append(sahne, panel); ov.append(sheet); document.body.append(ov); document.body.classList.add("pe-kilit");
  requestAnimationFrame(() => ov.classList.add("ac"));

  let dokunma = 0, mod = null, secim = null, anahtar = "", konusTimer = 0, balonTimer = 0, uykuUyanik = 0, kapali = false, yazilan = "", islemde = false;
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
    const kirli = !!(d.camur && d.camur.var && !d.camur.temiz) && d.mod === "yasiyor";
    const onizle = (d.mod === "secim" || mod === "degistir") && secim ? secim : "", k = [d.mod, d.tur && d.tur.id, d.evre, d.ruh, uyku ? 1 : 0, kirli ? 1 : 0, onizle, mod].join("|");
    if (k === anahtar && !zorla) return; const ilkMi = !anahtar; anahtar = k;
    const kap = el("div", "pe-oyun"); kap.tabIndex = 0; kap.setAttribute("role", "button"); kap.setAttribute("aria-label", d.ad ? d.ad + " ile oyna" : "Hayvanla oyna");
    kap.innerHTML = onizle ? petSvg({ tur: onizle, evre: 2, kimlik: "pe" }) : d.mod === "yildiz" ? yildizSvg() : d.mod === "secim" ? yumurtaSvg(null, { kimlik: "pe" }) : d.evre === 0 ? yumurtaSvg(d.tur.id, { kimlik: "pe" }) : petSvg({ tur: d.tur.id, evre: d.evre, ruh: d.ruh, uyku, kirli, kimlik: "pe" });
    kap.onclick = () => oyna(); kap.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); oyna(); } };
    hayvanKutu.querySelector(".pe-oyun")?.remove(); hayvanKutu.prepend(kap); if (!ilkMi && !zorla) { kap.classList.add("pop"); }
  }
  function oyna() {
    const { d, saat } = veri(); if (!d.var || d.mod === "yildiz") return; const kap = hayvanKutu.querySelector(".pe-oyun"); if (!kap) return;
    dokunma++;
    if ((saat >= 21 || saat < 6) && d.mod === "yasiyor" && !uykuUyanik) { uykuUyanik = Date.now(); sahneCiz(true); setTimeout(() => { uykuUyanik = 0; sahneCiz(true); }, 20000); konus("Hm? Uyanıyorum… günaydın… yani iyi geceler."); return; }
    const t = dokunTepkisi(d, dokunma, { ad });
    kap.classList.remove("zipla", "cekingen"); void kap.offsetWidth;
    if (t.tur === "cekingen") { kap.classList.add("cekingen"); setTimeout(() => kap.classList.remove("cekingen"), 1900); } else { kap.classList.add("zipla"); kalpler(t.tur === "yumurta" ? 0 : 4); setTimeout(() => kap.classList.remove("zipla"), 800); }
    konus(t.soz);
  }
  function rastgeleKonus() {
    const { c, d, saat } = veri(); if (!c || !d.var) return;
    const sr = seriHesapla(c), dun = (() => { const p = c.pet || {}, dk = gunAnahtar(new Date(Date.now() - 864e5)), kim = Object.keys(p.bes || {}).filter(u => (p.bes[u] || []).some(x => x.startsWith(dk))); return kim.length ? (c.uyeAd && c.uyeAd[kim[Math.floor(Math.random() * kim.length)]]) : ""; })();
    konus(sozSec(d, { ad, saat, seri: sr.n, bakici: (dun || "").split(" ")[0], siraBende: d.sira.includes(me.uid) && !benVerdi("m") }));
  }

  /* ---------- panel ---------- */
  const benVerdi = t => { const { c } = veri(), l = (((c && c.pet && c.pet.bes) || {})[me.uid]) || []; return l.includes(gunAnahtar(new Date()) + t); };
  const bar = (n, g, sinif) => { const b = el("div", "pe-bar " + (sinif || "")), i = el("i"); i.style.width = Math.min(100, g ? Math.round(n / g * 100) : 0) + "%"; b.append(i); return b; };

  function seciciCiz(d, degistirMi) {
    const k = el("div", "pe-sec");
    const bas = el("div", "pe-bas"); bas.append(el("h2", "", degistirMi ? "Hayvanı değiştir" : "Sınıfınızın hayvanını seçin"));
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
    const sat = el("div", "pe-seri"); const chip = el("span", "pe-seri-chip" + (sr.n >= 30 ? " b3" : sr.n >= 7 ? " b2" : "")); chip.innerHTML = ik("alev") + "<b>" + sr.n + "</b> günlük seri"; sat.append(chip);
    if (sr.dondurulmus) sat.append(el("span", "pe-donuk", "Bugün donduruldu"));
    else { const dd = dondurulabilir(c, bk); if (dd.ok && sr.n >= 2) { const b = el("button", "pe-dondur", ""); b.type = "button"; b.innerHTML = ik("buz") + " Seriyi dondur <small>(" + d.dondur.kalan + " hak)</small>"; let onay = false; b.onclick = async () => { if (!onay) { onay = true; b.classList.add("emin"); b.innerHTML = ik("buz") + " Emin misin? Tekrar dokun"; setTimeout(() => { if (!b.isConnected) return; onay = false; b.classList.remove("emin"); b.innerHTML = ik("buz") + " Seriyi dondur <small>(" + d.dondur.kalan + " hak)</small>"; }, 3500); return; } try { await seriDondur(getChat(), bk); toast("Bugün donduruldu. Seri güvende!", true); panelCiz(); } catch (er) { toast(er.message || "Dondurulamadı."); } }; sat.append(b); } }
    k.append(sat);
    // bugünkü bakım
    if (d.evre > 0) {
      const g = el("div", "pe-gun"); g.append(el("h3", "", "Bugünkü bakım"), el("p", "pe-alt", "Sınıfın yarısı (" + d.gerek + " kişi) mama ve su verirse " + d.ad + " mutlu olur."));
      [["mama", "Mama", d.bugun.mama], ["su", "Su", d.bugun.su]].forEach(([t2, y, n]) => { const sat2 = el("div", "pe-sat"), ye = el("span", "pe-et", ""); ye.innerHTML = ik(t2) + y; sat2.append(ye, bar(n, d.gerek, t2 + (n >= d.gerek ? " tam" : "")), el("b", "", n + "/" + d.gerek)); g.append(sat2); });
      // bakıcılar
      const p = c.pet || {}, kim = Object.keys(p.bes || {}).filter(u => (p.bes[u] || []).some(x => x.startsWith(bk)));
      if (kim.length || d.sira.includes(me.uid)) { const b = el("div", "pe-bakici"); b.append(el("small", "", kim.length ? "Bugün ilgilenenler" : "Henüz kimse ilgilenmedi")); const av = el("div", "pe-av"); kim.slice(0, 10).forEach(u => { const a = el("span", "pe-a", ilk((c.uyeAd || {})[u])); a.style.background = renkOf(u); a.title = (c.uyeAd || {})[u] || ""; av.append(a); }); if (kim.length > 10) av.append(el("span", "pe-a daha", "+" + (kim.length - 10))); b.append(av); g.append(b); }
      if (d.sira.includes(me.uid) && !(benVerdi("m") && benVerdi("s"))) g.append(el("div", "pe-sira", "Bugün sıra sende! Bir mama ve bir su vermen yeter."));
      k.append(g);
      // çamur
      if (d.camur.var && !d.camur.temiz) { const cm = el("div", "pe-camur"), kisi = (c.uyeAd || {})[d.camur.atanan], ben = d.camur.atanan === me.uid; cm.innerHTML = "<b>Çamur günü!</b> " + (ben ? "Temizleme sırası sende." : kisi ? "Temizleme sırası " + kisi.split(" ")[0] + "’de, ama sen de yardım edebilirsin." : "Biri temizlesin!"); k.append(cm); }
      // düğmeler
      const eylem = el("div", "pe-eylem");
      const mk = (t2, y, kalan, gonder, verdi) => { const b = el("button", "pe-btn " + t2 + (verdi ? " tamam" : ""), ""); b.type = "button"; b.innerHTML = ik(t2) + "<span>" + (verdi ? y + " verdin" : y + " ver") + "</span><small>" + (verdi ? "✓" : kalan + " var") + "</small>"; b.disabled = verdi; b.onclick = gonder; return b; };
      const yem = async t2 => { if (islemde) return; islemde = true; try { const r = await besle(getChat(), t2, me.uid); if (r.zatenVar) toast("Bugün zaten verdin."); else { yemAnim(t2); } } catch (er) { toast(er.message || "Olmadı."); } finally { islemde = false; panelCiz(); } };
      eylem.append(mk("mama", "Mama", e.mama, () => yem("m"), benVerdi("m")), mk("su", "Su", e.su, () => yem("s"), benVerdi("s")));
      if (d.camur.var && !d.camur.temiz) { const b = el("button", "pe-btn sunger", ""); b.type = "button"; b.innerHTML = ik("sunger") + "<span>Temizle</span><small>+" + SABIT.TEMIZLE_ODUL_MAMA + " mama</small>"; b.onclick = async () => { if (islemde) return; islemde = true; try { await temizle(getChat(), me.uid); anahtar = ""; sahneCiz(true); konus(eylemSozu("temiz", { ad })); kalpler(6); konfeti(14); toast("Tertemiz oldu!", true); } catch (er) { toast(er.message || "Olmadı."); } finally { islemde = false; panelCiz(); } }; eylem.append(b); }
      k.append(eylem);
      k.append(el("p", "pe-canta", "Çantan: " + e.mama + " mama · " + e.su + " su. Günün ilk sınıf mesajı 1 su, çamuru temizlemek 1 mama kazandırır."));
    }
    if (d.degistirilebilir && d.evre >= 0) { const l = el("button", "pe-link", "Hayvanı değiştir (bir kez, " + SABIT.DEGISTIR_MAMA + " mama)"); l.type = "button"; l.onclick = () => { mod = "degistir"; secim = null; yazilan = ""; panelCiz(); }; k.append(l); }
    return k;
  }
  function yemAnim(t2) {
    const f = el("span", "pe-yem " + (t2 === "m" ? "mama" : "su")); f.innerHTML = ik(t2 === "m" ? "mama" : "su"); hayvanKutu.append(f); setTimeout(() => f.remove(), 1100);
    const kap = hayvanKutu.querySelector(".pe-oyun"); setTimeout(() => { if (kap) { kap.classList.remove("yiyor"); void kap.offsetWidth; kap.classList.add("yiyor"); setTimeout(() => kap.classList.remove("yiyor"), 1400); } kalpler(5); konus(eylemSozu(t2 === "m" ? "yem" : "su", { ad })); }, 700);
  }
  function ustCiz(d, c) {
    ust.replaceChildren(); if (!d.var) return; const sr = seriHesapla(c);
    if (d.mod !== "secim") { const s = el("span", "pe-ust-seri"); s.innerHTML = ik("alev") + "<b>" + sr.n + "</b>"; ust.append(s); }
    const sinif = (c.ad || "").replace(/ Sınıfı$/, ""); ust.append(el("span", "pe-ust-ad", d.mod === "secim" ? sinif + " sınıfı" : (d.ad ? d.ad + " · " + sinif : sinif)));
  }
  function panelCiz() {
    const { c, d } = veri(); panel.replaceChildren(); if (!c || !d.var) { panel.append(el("p", "pe-alt", "Hayvan hazırlanıyor… birazdan burada olacak.")); return; }
    ustCiz(d, c);
    if (mod === "degistir") panel.append(seciciCiz(d, true));
    else if (d.mod === "secim") panel.append(seciciCiz(d, false));
    else if (d.mod === "yildiz") panel.append(yildizCiz(d, c));
    else panel.append(bakimCiz(d, c));
  }

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
  function yenile() { if (kapali) return; sahneCiz(); if (!islemde) panelCiz(); evreKontrol(); }
  function kapat() {
    if (kapali) return; kapali = true; clearInterval(zaman); clearTimeout(konusTimer); clearTimeout(balonTimer); window.removeEventListener("salvea-sohbetler", yenile); document.removeEventListener("keydown", tus);
    ov.classList.remove("ac"); ov.classList.add("kapan"); setTimeout(() => { ov.remove(); document.body.classList.remove("pe-kilit"); if (onKapat) onKapat(); }, 320);
  }
  const tus = e => { if (e.key === "Escape") kapat(); };
  kapatB.onclick = kapat; ov.addEventListener("click", e => { if (e.target === ov) kapat(); }); document.addEventListener("keydown", tus); window.addEventListener("salvea-sohbetler", yenile);
  const zaman = setInterval(() => { if (!document.hidden) { sahneCiz(); } }, 60000);
  const donguKonus = () => { konusTimer = setTimeout(() => { rastgeleKonus(); donguKonus(); }, 13000 + Math.random() * 9000); };
  evreKontrol(); sahneCiz(true); panelCiz(); setTimeout(rastgeleKonus, 900); donguKonus(); setTimeout(() => kapatB.focus(), 400);
  return { kapat, yenile, konus, oyna };
}
