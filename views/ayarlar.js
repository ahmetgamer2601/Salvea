// Görünüm: ayarlar — bildirimler ve sohbet kişiselleştirme
import { durum, ac, kapat, guncelle, bildir } from "../push.js";
import { ayarYukle, ayar, ayarKaydet, temaUygula, TEMALAR, BALONLAR } from "../ayar.js";

export const html = `<header class="top"><div class="tile"><img src="logo.png" alt="Salvea"></div><div><b>Ayarlar</b><span id="sc"></span></div></header>
<section class="setcard"><h2>Bildirimler</h2><p class="hint" id="bd">Yükleniyor…</p><div id="bdBtns" class="setbtns"></div><div id="bdSw"></div></section>
<section class="setcard"><h2>Sohbet görünümü</h2>
<div class="prev" id="prev"><div class="pr them">Merhaba, bugün nasılsın?</div><div class="pr me">İyiyim, teşekkürler!</div></div>
<h3>Sohbet rengi</h3><div class="swg" id="tm"></div>
<h3>Mesaj rengi</h3><div class="swg" id="bl"></div>
<div id="okSw"></div></section>`;
export const max = "640px";

export default async function mount(ctx) {
  const me = ctx.me, $ = ctx.$, teacher = me.role === "teacher";
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const toast = (t, ok) => S.show(t, ok);
  $("sc").textContent = me.okul || "";
  await ayarYukle(me.uid);

  // Açma-kapama anahtarı
  const anahtar = (ad, ipucu, acik, degisti, devre) => {
    const s = el("div", "setrow"), m = el("div"), b = el("button", "swt"); b.type = "button"; b.setAttribute("role", "switch"); b.setAttribute("aria-checked", String(!!acik)); b.setAttribute("aria-label", ad); b.disabled = !!devre;
    m.append(el("b", "", ad)); if (ipucu) m.append(el("small", "", ipucu)); b.append(el("i"));
    b.onclick = async () => { const v = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(v)); try { await degisti(v); } catch (e) { b.setAttribute("aria-checked", String(!v)); toast("Kaydedilemedi: " + (e.code || e.message)); } };
    s.append(m, b); return s;
  };

  /* ---------- Bildirimler ---------- */
  async function bildirimCiz() {
    const d = await durum(me), msg = $("bd"), btns = $("bdBtns"), sw = $("bdSw"); btns.replaceChildren(); sw.replaceChildren();
    const dugme = (t, f, ghost) => { const b = el("button", "btn sm" + (ghost ? " ghost" : ""), t); b.type = "button"; b.onclick = async () => { b.disabled = true; try { await f(); } catch (e) { toast(e.message || "İşlem başarısız."); } b.disabled = false; bildirimCiz(); }; btns.append(b); };
    if (!d.hazir) return void (msg.textContent = "Telefon bildirimleri henüz kurulmadı. Kurulum tamamlanınca burada açabileceksin.");
    if (d.ios) return void (msg.textContent = "iPhone'da bildirim için önce uygulamayı ana ekrana eklemelisin: tarayıcıda Paylaş düğmesi → Ana Ekrana Ekle. Sonra Salvea'yı ana ekrandaki simgeden açıp buraya dön.");
    if (!d.destek) return void (msg.textContent = "Bu tarayıcı telefon bildirimlerini desteklemiyor. Chrome, Edge, Safari (ana ekrana ekli) ya da Firefox dene.");
    if (d.izin === "denied") return void (msg.textContent = "Bildirimler bu cihazda engellenmiş. Telefon ya da tarayıcı ayarlarından Salvea için bildirimlere izin ver, sonra buraya dön.");
    if (!d.abone) { msg.textContent = "Mesaj, görev, program ve randevular için bu cihaza bildirim gönderebiliriz. Uygulama kapalıyken bile gelir."; return dugme("Bu cihazda bildirimleri aç", () => ac(me, { onizleme: false })); }
    msg.textContent = "Bu cihazda bildirimler açık. Hangilerini almak istediğini seç:";
    const t = d.ayar.turler || {};
    const tur = (k, ad, ip) => sw.append(anahtar(ad, ip, t[k] !== false, v => { t[k] = v; return guncelle(d.id, { turler: { ...t } }); }));
    tur("sohbet", "Mesajlar", "Sohbetlere yeni mesaj geldiğinde");
    tur("program", "Program", teacher ? "" : "Öğretmenin program eklediğinde ya da güncellediğinde");
    tur("gorev", "Görevler", teacher ? "Takımlar kanıt gönderdiğinde" : "Yeni görev, onay ya da tekrar isteği geldiğinde");
    tur("randevu", "Randevular", teacher ? "Yeni randevu talebi geldiğinde" : "Randevu talebine yanıt geldiğinde");
    if (teacher) tur("yardim", "Öğrenci yardım istekleri", "Bir öğrenci seninle konuşmak istediğinde");
    sw.append(anahtar("Bildirimde mesaj içeriğini göster", "Kapalıyken bildirimde yalnızca kimden geldiği görünür. Kilit ekranında başkalarının mesajını okumasını önler.", d.ayar.onizleme === true, v => guncelle(d.id, { onizleme: v })));
    dugme("Test bildirimi gönder", async () => { const r = await bildir("test"); toast(r && r.gonderilen ? "Test bildirimi gönderildi. Birkaç saniye içinde gelmeli." : "Gönderilemedi" + (r && r.hata ? ": " + r.hata : ". Bildirim sunucusuna ulaşılamadı."), !!(r && r.gonderilen)); }, true);
    dugme("Bu cihazda kapat", () => kapat(me), true);
  }
  bildirimCiz();

  /* ---------- Sohbet görünümü ---------- */
  const kaydet = (() => { let t; return yama => { temaUygula($("prev"), ayar()); clearTimeout(t); t = setTimeout(() => ayarKaydet(me.uid, yama).catch(e => toast("Kaydedilemedi: " + (e.code || e.message))), 400); }; })();
  const secici = (kutu, liste, alan, renk) => {
    const ciz = () => $(kutu).replaceChildren(...liste.map(x => { const b = el("button", "swb"); b.type = "button"; b.setAttribute("aria-pressed", String(ayar()[alan] === x.id)); b.setAttribute("aria-label", x.ad); b.title = x.ad; const d = el("span", "swc"); d.style.background = renk(x); b.append(d, el("small", "", x.ad)); b.onclick = () => { Object.assign(ayar(), { [alan]: x.id }); ciz(); kaydet({ [alan]: x.id }); }; return b; }));
    ciz();
  };
  secici("tm", TEMALAR, "sohbetTema", x => x.bg); secici("bl", BALONLAR, "balonRenk", x => x.bg);
  temaUygula($("prev"));
  $("okSw").append(anahtar("Okundu bilgisini göster", "Kapatırsan başkaları mesajlarını ne zaman okuduğunu göremez; sen de onların okundu bilgisini göremezsin.", !ayar().okunduGizle, v => { Object.assign(ayar(), { okunduGizle: !v }); return ayarKaydet(me.uid, { okunduGizle: !v }); }));
}
