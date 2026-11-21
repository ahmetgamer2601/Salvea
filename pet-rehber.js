// Maskot rehberi: rastgele bir hayvan kendini tanıtır, düğmelerin üstüne zıplar (düğme inip kalkar) ve nasıl kullanılacağını anlatır.
// Kullanım: maskotTur({ adimlar: [{ hedef: () => Element|null, metin: "..." }], maskot: maskotSec(), onBitir }).
import { petSvg } from "./pet-cizim.js";
import { HAYVANLAR } from "./petmantik.js";

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
export function maskotSec(r = Math.random) { const h = HAYVANLAR[Math.floor(r() * HAYVANLAR.length)]; return { tur: h.id, ad: h.isimler[Math.floor(r() * h.isimler.length)], tanim: h.ad.toLocaleLowerCase("tr"), ozellik: h.ozellik }; }
export const maskotSvg = (mk, evre = 3, kimlik = "mk") => petSvg({ tur: mk.tur, evre, ruh: "mutlu", kimlik });
const azalt = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

let acik = null;
export function maskotTur({ adimlar, maskot, onBitir, yerlesim }) {
  if (acik) acik.kapat();
  const mk = maskot || maskotSec(), kok = el("div", "hr-ov"), halka = el("div", "hr-halka"), kisi = el("div", "hr-maskot"), balon = el("div", "hr-balon"), yazi = el("p", "hr-yazi"), alt = el("div", "hr-alt"), atla = el("button", "hr-atla", "Geç"), ileri = el("button", "hr-ileri", "Devam"), nokta = el("span", "hr-nokta");
  kok.setAttribute("role", "dialog"); kok.setAttribute("aria-label", mk.ad + " seni gezdiriyor"); balon.setAttribute("aria-live", "polite"); atla.type = ileri.type = "button";
  kisi.innerHTML = maskotSvg(mk, 3, "hr"); alt.append(nokta, atla, ileri); balon.append(el("b", "hr-ad", mk.ad), yazi, alt); kok.append(halka, kisi, balon); document.body.append(kok);
  let i = -1, adim = null, hedefEl = null, son = null, bitti = false, zaman = 0;
  const gecerli = () => adimlar.map((a, k) => [a, k]).filter(([a]) => { try { return !!a.hedef(); } catch (_) { return false; } }).map(([a]) => a);

  function tutun(x, y) { kisi.style.left = x + "px"; kisi.style.top = y + "px"; }
  function balonYerlestir(x, y, alta) {
    const w = Math.min(300, innerWidth - 24); balon.style.width = w + "px";
    const sol = Math.max(12, Math.min(innerWidth - w - 12, x - w / 2)); balon.style.left = sol + "px";
    if (alta) { balon.style.top = Math.min(innerHeight - 190, y + 14) + "px"; balon.style.bottom = "auto"; balon.classList.add("alta"); }
    else { balon.style.bottom = Math.max(12, innerHeight - (y - 92)) + "px"; balon.style.top = "auto"; balon.classList.remove("alta"); }
    balon.style.setProperty("--ok", Math.max(18, Math.min(w - 18, x - sol)) + "px");
  }
  function sagla(h) {   // iniş: düğme hafifçe çöker, geri yaylanır
    h.classList.remove("hr-bas"); void h.offsetWidth; h.classList.add("hr-bas"); setTimeout(() => h.classList.remove("hr-bas"), 950);
  }
  function git(k) {
    const liste = gecerli(); if (k >= liste.length) return bitir(); i = k; adim = liste[k]; hedefEl = adim.hedef();
    nokta.textContent = (k + 1) + "/" + liste.length; ileri.textContent = k === liste.length - 1 ? "Bitti" : "Devam"; atla.hidden = k === liste.length - 1;
    if (hedefEl.scrollIntoView) hedefEl.scrollIntoView({ block: "center", behavior: azalt() ? "auto" : "smooth" });
    clearTimeout(zaman); zaman = setTimeout(() => yerles(true), azalt() ? 20 : 420);
  }
  function yerles(zipla) {
    if (bitti || !hedefEl || !hedefEl.isConnected) return; const r = hedefEl.getBoundingClientRect(), ustte = r.top > 150;
    const x = Math.max(46, Math.min(innerWidth - 46, r.left + r.width / 2)), y = ustte ? r.top + 2 : Math.min(innerHeight - 20, r.bottom + 74);
    halka.style.cssText = "left:" + (r.left - 6) + "px;top:" + (r.top - 6) + "px;width:" + (r.width + 12) + "px;height:" + (r.height + 12) + "px;border-radius:" + Math.min(26, Math.max(12, r.height / 2 + 6)) + "px";
    halka.classList.add("on"); const onceki = son; son = { x, y };
    const yazdir = () => { yazi.textContent = typeof adim.metin === "function" ? adim.metin(mk) : adim.metin; balonYerlestir(x, y, !ustte); balon.classList.remove("goster"); void balon.offsetWidth; balon.classList.add("goster"); };
    tutun(x, y);
    if (!zipla || azalt() || !onceki) { kisi.classList.add("goster"); yazdir(); if (ustte) sagla(hedefEl); return; }
    kisi.classList.add("goster"); balon.classList.remove("goster");
    const dx = onceki.x - x, dy = onceki.y - y, yuk = Math.min(150, 70 + Math.abs(dy) * 0.25 + Math.abs(dx) * 0.12);
    const a = kisi.animate([
      { transform: "translate(" + dx + "px," + dy + "px) scale(1.14,.84)", offset: 0 },
      { transform: "translate(" + dx * 0.55 + "px," + (dy * 0.55 - yuk) + "px) scale(.92,1.1)", offset: 0.3 },
      { transform: "translate(" + dx * 0.12 + "px," + (dy * 0.12 - yuk * 0.5) + "px) scale(.95,1.06)", offset: 0.6 },
      { transform: "translate(0,0) scale(1.16,.82)", offset: 0.8 },
      { transform: "translate(0,-9px) scale(.96,1.07)", offset: 0.9 },
      { transform: "translate(0,0) scale(1,1)", offset: 1 },
    ], { duration: 900, easing: "cubic-bezier(.35,.1,.3,1)" });
    setTimeout(() => { if (!bitti && ustte) sagla(hedefEl); }, 720);   // indiği an düğme çöker
    a.onfinish = yazdir;
  }
  function bitir() { if (bitti) return; bitti = true; clearTimeout(zaman); removeEventListener("resize", yeniden); document.removeEventListener("keydown", tus, true); kok.classList.add("kapan"); setTimeout(() => kok.remove(), 260); acik = null; if (onBitir) onBitir(); }
  const yeniden = () => yerles(false), tus = e => { if (e.key === "Escape") { e.stopPropagation(); bitir(); } else if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); git(i + 1); } };
  ileri.onclick = () => git(i + 1); atla.onclick = bitir; addEventListener("resize", yeniden); document.addEventListener("keydown", tus, true);
  kok.addEventListener("click", e => { if (e.target === kok) git(i + 1); });
  requestAnimationFrame(() => { kok.classList.add("ac"); git(0); setTimeout(() => ileri.focus(), 500); });
  acik = { kapat: bitir, mk };
  return acik;
}
