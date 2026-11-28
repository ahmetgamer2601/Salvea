// "Salvea nedir?": giriş ve kayıt ekranında, kayıt olmadan önce göz atmak isteyenler için kısa tanıtım turu.
// Oturum ya da veritabanı gerekmez (hiç okuma yok). Rastgele bir hayvan maskotu kendini tanıtır.
import { maskotSec, maskotSvg } from "./pet-rehber.js";

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const IK = {
  ortak: '<svg viewBox="0 0 120 90" aria-hidden="true"><circle cx="30" cy="38" r="14" fill="#7d9b84"/><circle cx="60" cy="30" r="16" fill="#1d3a2f"/><circle cx="90" cy="38" r="14" fill="#c9a23c"/><path d="M12 76c2-14 12-20 18-20s16 6 18 20zM42 76c2-16 12-24 18-24s16 8 18 24zM72 76c2-14 12-20 18-20s16 6 18 20z" fill="#e9e3d0" stroke="#1d3a2f" stroke-width="2" stroke-linejoin="round"/></svg>',
  takim: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="10" y="22" width="44" height="30" rx="10" fill="#7d9b84"/><rect x="66" y="22" width="44" height="30" rx="10" fill="#c9a23c"/><rect x="38" y="52" width="44" height="30" rx="10" fill="#1d3a2f"/><path d="M54 37h12M60 52v-6" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="37" r="4" fill="#fff"/><circle cx="88" cy="37" r="4" fill="#fff"/><circle cx="60" cy="67" r="4" fill="#fff"/></svg>',
  sohbet: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M14 16h62a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H44l-14 12V58H14a8 8 0 0 1-8-8V24a8 8 0 0 1 8-8z" fill="#e9e3d0" stroke="#1d3a2f" stroke-width="2.4" stroke-linejoin="round"/><path d="M54 40h50a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-8v12L84 78H54a8 8 0 0 1-8-8V48a8 8 0 0 1 8-8z" fill="#7d9b84" stroke="#1d3a2f" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 32h40M18 42h26" stroke="#1d3a2f" stroke-width="3" stroke-linecap="round"/><path d="M62 54h40M62 64h24" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
  guven: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M60 8l38 12v24c0 22-16 36-38 44C38 80 22 66 22 44V20z" fill="#e9e3d0" stroke="#1d3a2f" stroke-width="2.6" stroke-linejoin="round"/><path d="M42 46l12 12 24-26" fill="none" stroke="#2f7a4a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const SLAYT = [
  { b: "Salvea nedir?", m: "Okulda kimsenin dışarıda kalmaması için yapılmış bir arkadaşlık ve dayanışma uygulaması.", l: ["Her hafta farklı arkadaşlarla karma takımlar", "Birlikte yapılan küçük görevler", "Sınıf sohbeti ve ortak bir sınıf hayvanı"], sanat: "ortak" },
  { b: "Haftalık karma takımlar", m: "Takımlarını öğretmenin kurar; böylece her hafta yeni arkadaşlarla tanışır, hiç konuşmadığın biriyle bile bir şey üretirsin.", l: ["Takım görevleri tanışmayı kolaylaştırır", "Fotoğraf ya da kısa bir kanıtla görevini gösterirsin", "Öğretmenin ve rehber öğretmenin her zaman yanında"], sanat: "takim" },
  { b: "Sohbet ve seriler", m: "Sınıfınla, takımınla ve öğretmenlerinle güvenli bir ortamda yazışırsın. Her gün konuştukça sınıf serisi büyür.", l: ["Sınıf, takım ve özel sohbetler", "Hafta sonu seriyi bozmaz", "İstemediğin birine yazmayı engelleyebilirsin"], sanat: "sohbet" },
  { b: "Sınıfın hayvanı", m: mk => "Merhaba, ben " + mk.ad + "! Sınıfınız birlikte oy verip bir hayvan seçer; yumurtadan çıkar ve sizinle birlikte büyür.", l: ["Mama ve suyu takım görevleri yaparak kazanırsınız", "Çamuru iki kişi birlikte temizler", "Hayvana iyi bakmak sınıfı birbirine yaklaştırır"], sanat: "maskot" },
  { b: "Güvenlik ve gizlilik", m: "Mesajlarını yalnızca sınıf arkadaşların ve öğretmenin görür. Rahatsız edici bir şey olursa bildirebilir, kişiyi engelleyebilirsin.", l: ["Hesap okulun ve veli e-postanla açılır", "Rahatsız edici mesajı öğretmene bildirirsin", "Kimse listede geride bırakılmaz"], sanat: "guven", son: true },
];

export function tanitimAc() {
  if (document.querySelector(".tn-ov")) return;
  const mk = maskotSec(), kok = el("div", "tn-ov"), kart = el("div", "tn-kart"), ust = el("div", "tn-ust"), nokta = el("div", "tn-nokta"), kapat = el("button", "tn-kapat", "Kapat"), sahne = el("div", "tn-sahne"), alt = el("div", "tn-alt"), geri = el("button", "tn-geri", "Geri"), ileri = el("button", "tn-ileri", "İleri");
  kok.setAttribute("role", "dialog"); kok.setAttribute("aria-modal", "true"); kok.setAttribute("aria-label", "Salvea nedir?"); kapat.type = geri.type = ileri.type = "button";
  ust.append(nokta, kapat); alt.append(geri, ileri); kart.append(ust, sahne, alt); kok.append(kart); document.body.append(kok); document.body.style.overflow = "hidden";
  let i = 0; const noktalar = SLAYT.map(() => nokta.appendChild(el("i")));
  function ciz(yon) {
    const s = SLAYT[i], k = el("div", "tn-slayt" + (yon ? (yon > 0 ? " sag" : " sol") : "")), sanat = el("div", "tn-sanat");
    if (s.sanat === "maskot") { sanat.innerHTML = '<div class="tn-mk">' + maskotSvg(mk, 3, "tn") + '</div>'; sanat.classList.add("mk"); } else sanat.innerHTML = IK[s.sanat];
    k.append(sanat, el("h2", "", s.b), el("p", "tn-m", typeof s.m === "function" ? s.m(mk) : s.m));
    const ul = el("ul"); s.l.forEach(x => ul.append(el("li", "", x))); k.append(ul);
    if (s.son) { const bag = el("div", "tn-bag"), kayit = el("a", "tn-kayit", "Hemen kayıt ol"), giris = el("a", "tn-giris", "Zaten hesabım var"); kayit.href = "register.html"; giris.href = "index.html"; if (/register\.html/.test(location.pathname)) kayit.addEventListener("click", e => { e.preventDefault(); kapa(); }); if (/index\.html|\/$/.test(location.pathname) || location.pathname === "") giris.addEventListener("click", e => { e.preventDefault(); kapa(); }); bag.append(kayit, giris); k.append(bag); }
    sahne.replaceChildren(k); noktalar.forEach((n, j) => n.classList.toggle("on", j === i)); geri.style.visibility = i ? "visible" : "hidden"; ileri.textContent = i === SLAYT.length - 1 ? "Bitti" : "İleri"; ileri.hidden = false;
  }
  function git(d) { const y = i + d; if (y < 0) return; if (y >= SLAYT.length) return kapa(); i = y; ciz(d); }
  function kapa() { kok.classList.add("kapan"); document.removeEventListener("keydown", tus); document.body.style.overflow = ""; setTimeout(() => kok.remove(), 260); }
  const tus = e => { if (e.key === "Escape") kapa(); else if (e.key === "ArrowRight") git(1); else if (e.key === "ArrowLeft") git(-1); };
  geri.onclick = () => git(-1); ileri.onclick = () => git(1); kapat.onclick = kapa; kok.addEventListener("click", e => { if (e.target === kok) kapa(); }); document.addEventListener("keydown", tus);
  { let x0 = null; sahne.addEventListener("pointerdown", e => { x0 = e.clientX; }); sahne.addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) git(dx < 0 ? 1 : -1); }); }
  ciz(0); requestAnimationFrame(() => { kok.classList.add("ac"); ileri.focus(); });
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-tanitim]"); if (b) { e.preventDefault(); tanitimAc(); } });
window.tanitimAc = tanitimAc;
