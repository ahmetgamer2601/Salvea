// Görünüm: duyurular (gelen kutusu + öğretmen/yönetici için yazma)
import { db } from "../firebase.js";
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { gelenDuyurular, goruldu, STILLER, tarihYaz } from "../duyuru-veri.js";
import { yazimKur } from "../duyuru-yaz.js";
export const html = `<header class="top"><div class="tile"><img src="logo.png" alt="Salvea"></div><div><b>Duyurular</b><span id="sc"></span></div></header>
<details class="dy-yeni" id="yeniKutu" hidden><summary>Yeni duyuru yaz</summary><div id="yazim"></div></details><div id="liste" class="dy-liste2"></div>`;
export const max = "680px";
export default async function mount(ctx) {
  const me = ctx.me, $ = ctx.$, el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  $("sc").textContent = me.okul || "";
  if (me.role === "teacher" || me.admin === true) { $("yeniKutu").hidden = false; await yazimKur($("yazim"), { me, onGonderildi: () => yukle() }); }
  const ikon = y => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + y + "</svg>";
  async function yukle() {
    const onceki = +(localStorage.getItem("salvea_duyuru_goruldu_" + me.uid) || 0); let liste = [];
    try { liste = await gelenDuyurular(me); } catch (e) { return $("liste").replaceChildren(el("div", "empty", "Duyurular okunamadı: " + (e.code || e.message))); }
    if (!liste.length) $("liste").replaceChildren(el("div", "empty", "Henüz duyuru yok. Yeni duyurular burada ve telefonuna bildirim olarak görünür."));
    else $("liste").replaceChildren(...liste.map(d => {
      const s = STILLER[d.stil] || STILLER.duyuru, k = el("article", "dy-gelen"), yeni = d.olusturan !== me.uid && d.ms > onceki, ust = el("div", "dy-kart-ust"); k.style.background = "linear-gradient(150deg," + s.renk[0] + "," + s.renk[1] + ")"; if (yeni) k.classList.add("yeni");
      ust.innerHTML = ikon(s.ikon); ust.append(s.ad); if (yeni) ust.append(el("span", "dy-yeni-etiket", "Yeni"));
      k.append(ust, el("h3", "", (d.emoji ? d.emoji + " " : "") + d.baslik), el("p", "", d.metin), el("small", "", (d.olusturan === me.uid ? "Sen gönderdin" : d.olusturanAd || "Öğretmenin") + " · " + tarihYaz(d.ms)));
      if (d.etkinlikId) { const a = el("a", "btn sm fcta", "Etkinliğe git"); a.href = "#/etkinlik?id=" + encodeURIComponent(d.etkinlikId); a.style.textDecoration = "none"; k.append(a); }
      if (d.olusturan === me.uid || me.admin === true) { const b = el("button", "dy-sil", "Sil"); b.type = "button"; b.onclick = async () => { if (!confirm("Bu duyuru herkes için silinsin mi?")) return; try { await deleteDoc(doc(db, "duyurular", d.id)); yukle(); } catch (e) { S.show("Silinemedi: " + (e.code || e.message)); } }; k.append(b); }
      return k; }));
    goruldu(me);
  }
  await yukle();
}
