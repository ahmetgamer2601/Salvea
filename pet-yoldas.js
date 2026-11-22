// Sınıf hayvanı yoldaşı: ana sayfa ve diğer sayfalarda seni takip eder. Bazen köşeden göz atıp kaçar, arada laf atar, hapşırır, uyur.
// Yavruyken çekingendir (yaklaşınca kaçar, saklanır); büyüdükçe merak eder ve dokunduğun yere doğru gelir.
// Veri ek okuma doğurmaz: nav.js'in zaten dinlediği sohbet listesinden gelir. Ayarlardan kapatılabilir.
import { petSvg } from "./pet-cizim.js";
import { petDurum, seriHesapla, gunAnahtar } from "./petmantik.js";
import { sozSec } from "./pet-soz.js";
import { petEkraniAc } from "./pet-ekran.js";

const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
const rastgele = (a, b) => a + Math.random() * (b - a);
const GENIS = 84, SAYFA_SOZ = { "": "Ana sayfaya geldik!", gorev: "Görevlerine mi bakıyorsun? Kolay gelsin!", kesfet: "Yeni şeyler keşfetmek güzel!", ayarlar: "Ayarlarla işin bitince beni de ziyaret et!", duyuru: "Bir duyuru mu var? Merak ettim!" };

export function yoldasBaslat(me) {
  if (window.__yoldas) return window.__yoldas;
  const kok = el("div", "py"), hayvan = el("div", "py-hayvan"), balon = el("div", "py-balon"); kok.hidden = true; balon.setAttribute("role", "status"); balon.setAttribute("aria-live", "polite"); hayvan.setAttribute("role", "button"); hayvan.tabIndex = -1; kok.append(balon, hayvan); document.body.append(kok);
  let sohbetler = {}, chat = null, dur = null, anahtar = "", mod = "gizli", x = -200, jeton = 0, uyan = null, dokunma = 0, sonSoz = 0, balonT = 0, bakis = 1, ilkKez = true, zorla = false, sonImlec = null;
  const acik = () => { try { return localStorage.getItem("salvea_yoldas") !== "0"; } catch (_) { return true; } };
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const min = () => innerWidth >= 900 ? 112 : 10, max = () => Math.max(min() + 20, innerWidth - GENIS - 10);
  const klavye = () => { const v = window.visualViewport; return !!v && v.height < innerHeight * 0.78; };
  const rota = () => (location.hash.replace(/^#\/?/, "").split("?")[0] || "");
  const uygun = () => acik() && !!dur && dur.var && dur.mod === "yasiyor" && dur.evre >= 1 && !/^sohbet/.test(rota()) && !document.hidden && !klavye() && !document.querySelector(".pe-ov,.hr-ov,.hr-gezi,.rh");
  const saat = () => new Date().getHours(), gece = () => saat() >= 21 || saat() < 6;
  const bekle = (ms, j) => new Promise(r => { const t = setTimeout(r, ms); uyan = () => { clearTimeout(t); r(); }; }).then(() => j === jeton);

  /* ---------- veri ---------- */
  function kaynak() {
    const s = window.__salveaSohbetler; sohbetler = {}; if (s) s.forEach(d => { sohbetler[d.id] = { id: d.id, ...d.data({ serverTimestamps: "estimate" }) }; });
    const l = Object.values(sohbetler).filter(c => c.tur === "sinif" && c.pet && c.pet.tur && !c.pet.olum).sort((a, b) => a.id < b.id ? -1 : 1); chat = l[0] || null; dur = chat ? petDurum(chat) : null;
    if (!chat) { if (!kok.hidden) gizleHemen(); return; } ciz();
  }
  function ciz() {
    if (!dur || !dur.var || dur.mod !== "yasiyor") return; const kirli = !!(dur.camur && dur.camur.var && !dur.camur.adimA), uyku = gece(), k = [chat.id, dur.tur.id, dur.evre, dur.ruh, uyku ? 1 : 0, kirli ? 1 : 0].join("|");
    if (k === anahtar) return; anahtar = k; hayvan.innerHTML = petSvg({ tur: dur.tur.id, evre: Math.max(1, dur.evre), ruh: dur.ruh, uyku, kirli, kimlik: "py" }); hayvan.setAttribute("aria-label", (dur.ad || "Sınıf hayvanı") + " ile oyna");
  }

  /* ---------- hareket ---------- */
  function git(hx, ms, sinif) {
    return new Promise(r => {
      hx = Math.round(hx); if (hx !== x) { bakis = hx > x ? 1 : -1; hayvan.style.setProperty("--bakis", bakis); }
      kok.style.transition = reduce() || !ms ? "none" : "transform " + ms + "ms " + (sinif === "kac" ? "cubic-bezier(.3,.9,.3,1)" : "linear"); kok.classList.toggle("yurur", !!ms && sinif !== "kac" && !reduce()); kok.classList.toggle("korku", sinif === "kac");
      void kok.offsetWidth; x = hx; kok.style.transform = "translate3d(" + x + "px,0,0)"; setTimeout(() => { kok.classList.remove("yurur"); r(); }, ms || 0);
    });
  }
  const disarda = sag => sag ? innerWidth + 10 : -GENIS - 10;
  function gizleHemen() { jeton++; uyan && uyan(); mod = "gizli"; kok.hidden = true; kok.style.transition = "none"; x = -GENIS - 10; kok.style.transform = "translate3d(" + x + "px,0,0)"; balon.classList.remove("goster"); yasam(jeton); }
  async function ortaya(j) {
    const sag = Math.random() < 0.5, g = ilkKez; ilkKez = false; kok.hidden = false; await git(disarda(sag), 0); if (j !== jeton) return;
    const bebek = dur.evre <= 2, goz = sag ? innerWidth - GENIS * 0.5 : -GENIS * 0.5;   // yarım görünür: "göz atma"
    await git(goz, reduce() ? 0 : 1100, "yurur"); if (!await bekle(rastgele(1100, 2000), j)) return;
    if (bebek && Math.random() < 0.5 && !g) { await git(disarda(sag), 600, "kac"); if (j !== jeton) return; mod = "gizli"; kok.hidden = true; return; }   // çekingen yavru: göz atıp kaçar
    mod = "durur"; await git(rastgele(min(), max()), 1800, "yurur"); if (j === jeton) tanis();
  }
  async function cik(j) { const sag = x > innerWidth / 2; await git(disarda(sag), 1700, "yurur"); if (j !== jeton) return; mod = "gizli"; kok.hidden = true; balon.classList.remove("goster"); }
  async function gez(j) {
    const yakin = dur.evre >= 3 && sonImlec && Math.random() < (dur.evre === 4 ? 0.6 : 0.4), hx = yakin ? Math.max(min(), Math.min(max(), sonImlec - GENIS / 2)) : rastgele(min(), max());
    sonImlec = null; await git(hx, Math.max(900, Math.abs(hx - x) * 22), "yurur"); return j === jeton;
  }
  async function yasam(j) {
    while (j === jeton) {
      if (!uygun() && !zorla) { if (mod !== "gizli") await cik(j); if (!await bekle(2500, j)) return; continue; }
      if (mod === "gizli") { if (!await bekle(rastgele(ilkKez ? 3500 : 22000, ilkKez ? 11000 : 65000), j)) return; if (!(uygun() || zorla)) continue; await ortaya(j); continue; }
      const bit = Date.now() + rastgele(24000, 60000);
      while (Date.now() < bit && j === jeton && (uygun() || zorla)) { if (!await bekle(rastgele(3500, 8500), j)) return; if (!reduce() && !gece()) { if (!await gez(j)) return; } rastgeleOlay(); }
      if (j === jeton && !zorla) await cik(j);
    }
  }

  /* ---------- konuşma ve sürprizler ---------- */
  const gunSoz = () => { try { const k = "salvea_ysoz_" + gunAnahtar(new Date()); return +localStorage.getItem(k) || 0; } catch (_) { return 0; } };
  const gunSozArtir = () => { try { const k = "salvea_ysoz_" + gunAnahtar(new Date()); localStorage.setItem(k, String(gunSoz() + 1)); } catch (_) {} };
  function konus(m, zorunlu) {
    if (!m || kok.hidden) return; if (!zorunlu && (Date.now() - sonSoz < 40000 || gunSoz() >= 6)) return; sonSoz = Date.now(); if (!zorunlu) gunSozArtir();
    balon.textContent = m; balon.classList.remove("goster"); balon.style.setProperty("--sh", "0px"); void balon.offsetWidth; balon.classList.add("goster");
    const r = balon.getBoundingClientRect(), tas = r.left < 8 ? 8 - r.left : r.right > innerWidth - 8 ? innerWidth - 8 - r.right : 0; balon.style.setProperty("--sh", Math.round(tas) + "px");
    clearTimeout(balonT); balonT = setTimeout(() => balon.classList.remove("goster"), 5200);
  }
  function tanis() {   // ortaya çıkınca ilk söz: çekingen yavru kısık, büyüklerde cana yakın
    if (!chat) return; konus(dur.evre <= 2 ? ["Ş-şey… merhaba…", "Seni görmeye geldim… biraz utanıyorum."][Math.floor(Math.random() * 2)] : "Merhaba " + String(me.takmaAd || me.ad || "").split(" ")[0] + "! Seninle gezmeye geldim.");
  }
  function rastgeleOlay() {
    if (!chat || mod !== "durur") return; const r = Math.random();
    if (dur.camur && dur.camur.var && !dur.camur.adimA && r < 0.35) { hayvan.classList.remove("hapsir"); void hayvan.offsetWidth; hayvan.classList.add("hapsir"); konus("Hapşuu!", true); return; }
    if (r < 0.5) { const sr = seriHesapla(chat), l = chat.pet && chat.pet.bes && chat.pet.bes[me.uid] || [], bk = gunAnahtar(new Date());
      konus(sozSec(dur, { ad: String(me.takmaAd || me.ad || "").split(" ")[0], saat: saat(), seri: sr.n, siraBende: dur.sira.includes(me.uid) && !(l.includes(bk + "m") && l.includes(bk + "s")) })); }
  }
  function sayfaDegisti() {
    if (!chat || !acik()) return; const r = rota().split("/")[0];
    if (mod === "durur" && uygun()) { hayvan.classList.remove("zipla"); void hayvan.offsetWidth; hayvan.classList.add("zipla"); setTimeout(() => konus(SAYFA_SOZ[r] != null ? SAYFA_SOZ[r] : "", false), 700); }
    else if (mod === "gizli" && uygun() && Math.random() < 0.45) uyan && uyan();   // sayfa değişince bazen hemen göz atar
    else if (!uygun() && mod !== "gizli") { jeton++; uyan && uyan(); yasam(jeton); }
  }

  /* ---------- etkileşim ---------- */
  function acPencere() { if (!chat) return; petEkraniAc({ chatId: chat.id, me: { uid: me.uid, ad: String(me.takmaAd || me.ad || "").split(" ")[0] }, getChat: () => sohbetler[chat.id] }); }
  function kac() {
    if (mod !== "durur") return; const sag = x < innerWidth / 2, hx = sag ? max() : min();   // en uzak köşeye
    hayvan.classList.add("saklan"); git(hx, 520, "kac").then(() => { hayvan.classList.remove("saklan"); });
  }
  hayvan.addEventListener("pointerdown", e => {
    e.stopPropagation(); dokunma++;
    if (dur && dur.evre <= 2 && dokunma < (dur.evre === 1 ? 4 : 2) && Math.random() < 0.85) { kac(); konus(["Ş-şey… yavaş…", "Utanıyorum…", "(Gözlerini kapattı.)"][Math.floor(Math.random() * 3)], true); return; }
    kok.classList.remove("zipla"); acPencere();
  });
  hayvan.addEventListener("keydown", e => { if (e.key === "Enter") acPencere(); });
  document.addEventListener("pointerdown", e => { sonImlec = e.clientX; }, { passive: true });
  document.addEventListener("pointermove", e => {   // çekingen yavru yaklaşan parmaktan/imleçten kaçar
    if (mod !== "durur" || !dur || dur.evre > 2 || e.pointerType === "touch") return; const cx = x + GENIS / 2, esik = dur.evre === 1 ? 130 : 90, kutu = kok.getBoundingClientRect();
    if (Math.abs(e.clientX - cx) < esik && Math.abs(e.clientY - (kutu.top + GENIS / 2)) < esik) kac();
  }, { passive: true });
  window.addEventListener("hashchange", sayfaDegisti); window.addEventListener("salvea-sohbetler", kaynak);
  window.addEventListener("salvea-yoldas", () => { jeton++; uyan && uyan(); if (!acik()) gizleHemen(); else yasam(jeton); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { jeton++; uyan && uyan(); yasam(jeton); } });
  window.addEventListener("resize", () => { if (mod === "durur") git(Math.max(min(), Math.min(max(), x)), 0); });
  kaynak(); yasam(jeton);
  const api = {
    // test ve elle çağırma: hemen göster
    goster: async (px) => { zorla = true; jeton++; uyan && uyan(); mod = "durur"; kok.hidden = false; await git(px == null ? min() + 40 : px, 0); return true; },
    gizle: () => { zorla = false; gizleHemen(); }, durum: () => ({ mod, x, gorunur: !kok.hidden, uygun: uygun(), tur: dur && dur.tur && dur.tur.id, evre: dur && dur.evre }), konus, kac,
  };
  window.__yoldas = api; return api;
}
