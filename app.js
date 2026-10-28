// Salvea uygulama kabuğu: giriş bir kez doğrulanır, gezinme çubuğu hep yerinde kalır, sayfalar kabuğun içinde değişir.
import { guard } from "./guard.js";
import { mountNav, setActive } from "./nav.js";
import { onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const $g = id => document.getElementById(id);
const view = $g("view"), shell = $g("shell"), bar = $g("topbar");
const ROTA = {
  home: { key: "home", mod: me => me.role === "teacher" ? import("./views/teacher.js") : import("./views/student.js") },
  akis: { key: "akis", baslik: "Keşfet", mod: () => import("./views/akis.js") },
  kisi: { key: "kisi", baslik: "Kişiler", mod: () => import("./views/kisi.js") },
  gorev: { key: "gorev", baslik: "Görevler", mod: () => import("./views/gorev.js") },
  program: { key: "program", baslik: "Program", mod: () => import("./views/program.js") },
  kultur: { key: "kultur", baslik: "Bilgi kartları", mod: () => import("./views/kultur.js") },
  sohbet: { key: "sohbet", baslik: "Sohbet", mod: () => import("./views/sohbet.js") },
  randevu: { key: "randevu", baslik: "Randevu", mod: () => import("./views/randevu.js") }
};
// Eski .html bağlantıları (sayfa içi kartlar, geri düğmeleri) kabuk içinde açılır
const ESKI = { akis: "akis", profil: "kisi", gorevler: "gorev", program: "program", kultur: "kultur", sohbet: "sohbet", randevu: "randevu", student: "home", teacher: "home" };

const me = await guard();
let tok = 0, temizlik = [];
const durdur = () => { temizlik.splice(0).forEach(f => { try { f(); } catch (_) {} }); };
const ayril = (t, f) => t === tok ? temizlik.push(f) : f();   // sayfa terk edildiyse geç kayıtlar hemen temizlenir
const varsayilan = me.role === "teacher" ? "home" : "akis";
const ayir = () => { const [r, qs = ""] = location.hash.replace(/^#\/?/, "").split("?"); return { rota: r, query: new URLSearchParams(qs) }; };
export function go(rota, qs = "") { const h = "#/" + rota + (qs ? "?" + qs : ""); if (location.hash === h) render(); else location.hash = h; }

const baglam = (root, query, t) => ({
  me, root, query, go,
  $: id => root.querySelector("#" + CSS.escape(id)),
  on: (hedef, tur, fn, o) => { hedef.addEventListener(tur, fn, o); ayril(t, () => hedef.removeEventListener(tur, fn, o)); },
  every: (fn, ms) => { const id = setInterval(fn, ms); ayril(t, () => clearInterval(id)); return id; },
  snap: (...a) => { const un = onSnapshot(...a); ayril(t, un); return un; },
  leave: fn => ayril(t, fn),
  alive: () => t === tok
});

function hata(e) {
  const d = document.createElement("div"); d.className = "empty";
  d.append("Sayfa yüklenemedi. Bağlantını kontrol edip yeniden dene. (" + (e.code || e.message) + ") ");
  const b = document.createElement("button"); b.className = "btn sm"; b.type = "button"; b.textContent = "Yeniden dene"; b.onclick = render; d.append(b);
  view.replaceChildren(d);
}

async function render() {
  let { rota, query } = ayir();
  if (!ROTA[rota]) { rota = varsayilan; history.replaceState(null, "", "#/" + rota); }
  const r = ROTA[rota], t = ++tok;
  durdur(); bar.hidden = false;
  const m = $g("msg"); m.className = "msg"; m.textContent = "";
  let mod;
  try { mod = await r.mod(me); } catch (e) { if (t === tok) { bar.hidden = true; hata(e); } return; }
  if (t !== tok) return;
  const root = document.createElement("div"); root.className = "view v-" + rota; root.innerHTML = mod.html;
  view.replaceChildren(root);
  shell.style.maxWidth = mod.max || "";
  document.body.classList.toggle("chatmode", rota === "sohbet");
  document.title = "Salvea · " + (r.baslik || (me.role === "teacher" ? "Panel" : "Ana sayfa"));
  window.__route = rota; setActive(r.key); window.scrollTo(0, 0);
  try { await mod.default(baglam(root, query, t)); }
  catch (e) { console.error(e); if (t === tok) S.show("Sayfa tam yüklenemedi: " + (e.code || e.message)); }
  if (t === tok) bar.hidden = true;
  $g("splash")?.remove();
}

document.addEventListener("click", e => {
  if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest("a[href]"); if (!a || a.target) return;
  const m = /^([a-z]+)\.html(\?.*)?$/.exec(a.getAttribute("href"));
  if (!m || !ESKI[m[1]]) return;
  e.preventDefault(); go(ESKI[m[1]], m[2] ? m[2].slice(1) : "");
});
window.addEventListener("hashchange", render);
mountNav(me, (ROTA[ayir().rota] || ROTA[varsayilan]).key);
render();
