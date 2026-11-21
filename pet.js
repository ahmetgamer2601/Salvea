// Sınıf evcil hayvanı: Firestore işlemleri. Mantık petmantik.js içinde; çizim ve sahne ayrı dosyada (4c).
// Okuma maliyeti: hiçbir yeni dinleyici yok. Durum zaten dinlenen sınıf sohbet belgesinde (`pet`) durur.
import { db } from "./firebase.js";
import { doc, runTransaction, updateDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { env, envYama } from "./ayar.js";
import { SABIT, HAYVANLAR, gunAnahtar, gunEkle, gerekSayisi, uyeListe, yeniPet, gunuKapat, otoSecim, dondurulabilir } from "./petmantik.js";

const ref = id => doc(db, "sohbetler", id);
const bugun = () => gunAnahtar(new Date());

// Tek belgede okuyup-yaz (aynı anda iki öğrenci kapanış yapmasın diye işlem içinde)
async function islem(id, fn) {
  return runTransaction(db, async tx => {
    const s = await tx.get(ref(id)); if (!s.exists()) return null;
    const yama = fn({ id, ...s.data() }); if (yama) tx.update(ref(id), yama); return yama || null;
  });
}

// Sınıf sohbeti açılınca çağrılır. Yerel kontrollerle başlar: gerek yoksa hiçbir okuma/yazma yapılmaz.
export async function petBakim(c) {
  if (!c || c.tur !== "sinif" || c.kapali) return null;
  const p = c.pet, now = Date.now();
  if (!p) return petKur(c.id);
  if (!p.tur && !p.olum && p.secimSon && now > p.secimSon) return petOtoSec(c.id);
  if (p.tur && !p.olum && (p.sonGun || "") < gunEkle(bugun(), -1)) return gunuKapatIsle(c.id);
  return null;
}
export const petKur = id => islem(id, c => c.tur !== "sinif" || c.pet ? null : { pet: yeniPet(Date.now(), 1) });
export const petOtoSec = id => islem(id, c => { const p = c.pet; if (!p || p.tur || p.olum || Date.now() <= (p.secimSon || 0)) return null; const s = otoSecim(c); return { "pet.tur": s.tur, "pet.ad": s.ad, "pet.secildi": Date.now(), "pet.sonGun": bugun() }; });
export const gunuKapatIsle = id => islem(id, c => { const p = c.pet; if (!p) return null; const r = gunuKapat(p, bugun(), gerekSayisi(uyeListe(c).length), c, Date.now()); return r ? r.yama : null; });
// Hayvan yıldıza dönünce sınıf yeni bir yumurta alır (yeni seri, yeni hayvan)
export const yeniYumurta = id => islem(id, c => c.pet && c.pet.olum ? { pet: yeniPet(Date.now(), (c.pet.seriNo || 1) + 1) } : null);

// İlk seçim (3 gün içinde) ve tek seferlik değiştirme (mama ister)
export async function petSec(id, tur, ad, uid, degistir = false) {
  if (!HAYVANLAR.some(h => h.id === tur)) throw new Error("Bilinmeyen hayvan.");
  ad = String(ad || "").trim().slice(0, 20); if (!ad) throw new Error("Hayvanına bir isim ver.");
  if (degistir && env().mama < SABIT.DEGISTIR_MAMA) throw new Error("Hayvanı değiştirmek için " + SABIT.DEGISTIR_MAMA + " mama gerekir.");
  const s = await islem(id, c => {
    const p = c.pet; if (!p || p.olum) throw new Error("Şu an hayvan yok.");
    if (degistir) { if (!p.tur) throw new Error("Önce hayvanı seç."); if (p.degisti) throw new Error("Hayvan zaten bir kez değiştirildi."); return { "pet.tur": tur, "pet.ad": ad, "pet.degisti": true }; }
    if (p.tur) throw new Error("Sınıfın hayvanını zaten seçti.");
    return { "pet.tur": tur, "pet.ad": ad, "pet.secildi": Date.now(), "pet.sonGun": bugun() };
  });
  if (degistir && s) await envYama(uid, { mama: -SABIT.DEGISTIR_MAMA });
  return s;
}

// Besleme / su / temizlik: yalnızca kendi anahtarına yazılır (kurallar da böyle ister). Liste en fazla 14 kayıt.
async function kendiListeye(c, alan, kayit, uid) {
  const l = ((c.pet && c.pet[alan]) || {})[uid] || []; if (l.includes(kayit)) return false;
  await updateDoc(ref(c.id), { ["pet." + alan + "." + uid]: [...l.slice(-13), kayit] }); return true;
}
export async function besle(c, tur, uid) {   // tur: "m" (mama) | "s" (su)
  const p = c.pet; if (!p || !p.tur || p.olum) throw new Error("Hayvan şu an beslenemez.");
  const k = tur === "m" ? "mama" : "su"; if (env()[k] < 1) throw new Error("Önce " + k + " kazanmalısın. Görevleri tamamlayınca kazanırsın.");
  const yazildi = await kendiListeye(c, "bes", bugun() + tur, uid);
  if (!yazildi) return { zatenVar: true };
  await envYama(uid, { [k]: -1 }); return { ok: true };
}
export async function temizle(c, uid) {
  const cm = c.pet && c.pet.tur && !c.pet.olum; if (!cm) throw new Error("Temizlenecek bir şey yok.");
  const yazildi = await kendiListeye(c, "cam", bugun(), uid);
  if (!yazildi) return { zatenVar: true };
  await envYama(uid, { mama: SABIT.TEMIZLE_ODUL_MAMA }); return { ok: true };
}
export async function seriDondur(c, gun) {
  const k = dondurulabilir(c, gun); if (!k.ok) throw new Error(k.neden);
  await updateDoc(ref(c.id), { "pet.dondur": [...((c.pet && c.pet.dondur) || []).slice(-11), gun] }); return { ok: true };
}
// Günün ilk sınıf mesajı: 1 su kazandırır
export async function gunlukOdul(uid) {
  const bk = bugun(); if (env().odul === bk) return false;
  await envYama(uid, { su: SABIT.GUNLUK_ODUL_SU }, { odul: bk }); return true;
}
