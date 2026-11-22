// Sınıf evcil hayvanı ve sohbet serisi: SAF mantık. Hiçbir dış bağımlılığı yok (tarayıcıda da node'da da çalışır, test edilebilir).
// Durum, sınıf sohbet belgesindeki `pet` alanında durur; zaten dinlenen belge olduğu için ek okuma doğurmaz.

export const SABIT = { GOREV_MAMA: 2, YAN_GOREV_SAYI: 3, SECIM_GUN: 3, ACLIK_OLUM: 3, DEGISTIR_MAMA: 5, DONDUR_AYLIK: 2, GUNLUK_ODUL_SU: 1, TEMIZLE_ODUL_MAMA: 1 };

export const HAYVANLAR = [
  { id: "civciv", ad: "Civciv", renk: "#f5c542", ozellik: "Meraklı ve pofuduk", isimler: ["Pofuduk", "Limon", "Mısır", "Cıvıl", "Sarı"] },
  { id: "samur", ad: "Su samuru", renk: "#9b6b4a", ozellik: "Oyuncu ve neşeli", isimler: ["Çıtır", "Dalga", "Fındık", "Nehir", "Çağıl"] },
  { id: "penguen", ad: "Penguen", renk: "#3c4b5c", ozellik: "Sakin ve sevimli", isimler: ["Buz", "Frak", "Kar", "Pıtır", "Kutup"] },
  { id: "timsah", ad: "Yavru timsah", renk: "#6aa84f", ozellik: "Cesur ve yumuşak huylu", isimler: ["Yeşil", "Zıpzıp", "Kaya", "Nilüfer", "Bataklık"] },
  { id: "tavsan", ad: "Tavşan", renk: "#e7c9d4", ozellik: "Çevik ve utangaç", isimler: ["Pamuk", "Havuç", "Tüy", "Zıpır", "Bulut"] },
  { id: "kedi", ad: "Kedi yavrusu", renk: "#d99a5b", ozellik: "Şımarık ve sevecen", isimler: ["Mırnav", "Tarçın", "Boncuk", "Pati", "Gölge"] },
];
// gelisim = bakım yapılan okul günü sayısı
export const EVRELER = [
  { id: "yumurta", ad: "Yumurta", min: 0 },
  { id: "yavru", ad: "Yavru", min: 1 },
  { id: "cocuk", ad: "Çocuk", min: 5 },
  { id: "genc", ad: "Genç", min: 12 },
  { id: "yetiskin", ad: "Yetişkin", min: 24 },
];

export function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---------- iyilik görevleri (yan görevler): iletişim, empati, yardım, takım. Dürüstlük esaslı; sınıfça konuşmayı ve yardımlaşmayı artırır ---------- */
export const YAN_GOREVLER = [
  { id: "i1", kat: "iletişim", tur: "mama", metin: "Bugün sınıftan birine teşekkür et." }, { id: "i2", kat: "iletişim", tur: "su", metin: "Bir arkadaşına güzel bir söz söyle." },
  { id: "i3", kat: "iletişim", tur: "mama", metin: "Pek konuşmadığın bir arkadaşına bir soru sor." }, { id: "i4", kat: "iletişim", tur: "su", metin: "Bir arkadaşınla adını söyleyerek selamlaş." },
  { id: "i5", kat: "iletişim", tur: "mama", metin: "Bugün yeni biriyle birkaç cümle sohbet et." }, { id: "i6", kat: "iletişim", tur: "su", metin: "Birini sözünü kesmeden sonuna kadar dinle." },
  { id: "e1", kat: "empati", tur: "mama", metin: "Yalnız görünen birine gülümse ya da yanına otur." }, { id: "e2", kat: "empati", tur: "su", metin: "Bir arkadaşına “nasılsın?” diye gerçekten sor." },
  { id: "e3", kat: "empati", tur: "mama", metin: "Birinin üzgün olduğunu fark edersen yanına git." }, { id: "e4", kat: "empati", tur: "su", metin: "Bir arkadaşına onun güzel bir yanını söyle." },
  { id: "e5", kat: "empati", tur: "mama", metin: "Farklı düşünen birini önce dinle, sonra konuş." }, { id: "e6", kat: "empati", tur: "su", metin: "Bir tartışmada karşındakinin yerine kendini koy." },
  { id: "y1", kat: "yardım", tur: "mama", metin: "Bir arkadaşına ders ya da ödevde yardım teklif et." }, { id: "y2", kat: "yardım", tur: "su", metin: "Sınıfta toplanması gereken bir şeye yardım et." },
  { id: "y3", kat: "yardım", tur: "mama", metin: "Birine ihtiyacı olan bir şeyi ödünç ver." }, { id: "y4", kat: "yardım", tur: "su", metin: "Yeni ya da çekingen birine okulu tanıt." },
  { id: "y5", kat: "yardım", tur: "mama", metin: "Bir arkadaşına moral ver." }, { id: "y6", kat: "yardım", tur: "su", metin: "Öğretmenine küçük bir iyilik yap ya da teşekkür et." },
  { id: "t1", kat: "takım", tur: "mama", metin: "Takım arkadaşına görevde nasıl yardım edebileceğini sor." }, { id: "t2", kat: "takım", tur: "su", metin: "Gruba katılmayan birini çalışmaya ya da oyuna davet et." },
  { id: "t3", kat: "takım", tur: "mama", metin: "Sınıfta birinin iyi bir fikrini destekle." }, { id: "t4", kat: "takım", tur: "su", metin: "Bir hata yaptıysan özür dile." },
  { id: "t5", kat: "takım", tur: "mama", metin: "Pek konuşmadığın biriyle ortak bir ilgi alanı bul." }, { id: "t6", kat: "takım", tur: "su", metin: "Bir arkadaşına “iyi ki varsın” de." },
];
// Her öğrenciye her gün 3 farklı kategoriden 3 görev; kişiye ve güne göre sabit (ek okuma/yazma yok)
export function bugunGorevler(uid, gun) {
  const kats = ["iletişim", "empati", "yardım", "takım"].map(k => [hash(uid + ":" + gun + ":k:" + k), k]).sort((a, b) => a[0] - b[0]).slice(0, SABIT.YAN_GOREV_SAYI).map(x => x[1]);
  return kats.map(k => { const l = YAN_GOREVLER.filter(g => g.kat === k); return l[hash(uid + ":" + gun + ":" + k) % l.length]; });
}
// Sınıf hedefleri: kimseyi sıralamadan ortak ilerleme
export function hedefler(c, simdi = new Date()) {
  const sr = seriHesapla(c, simdi), h = [], sonraki = [3, 7, 14, 30, 60, 100].find(x => x > sr.n) || sr.n + 50;
  h.push({ id: "seri", ad: sonraki + " günlük seri", n: sr.n, hedef: sonraki });
  const d = c.pet && c.pet.tur && !c.pet.olum ? petDurum(c, simdi) : null;
  if (d && d.sonrakiEvre) { const e0 = EVRELER[d.evre].min, e1 = EVRELER[d.evre + 1].min; h.push({ id: "evre", ad: d.sonrakiEvre.ad + " olmak", n: d.gelisim - e0, hedef: e1 - e0 }); }
  return h;
}

/* ---------- tarih yardımcıları (yerel saat; Türkiye tek saat dilimi) ---------- */
export const gunAnahtar = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export const tarih = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); };
export const gunEkle = (k, n) => { const d = tarih(k); d.setDate(d.getDate() + n); return gunAnahtar(d); };
export const haftaSonu = d => d.getDay() === 0 || d.getDay() === 6;
export const ayAnahtar = k => k.slice(0, 7);

/* ---------- üyeler ---------- */
export const uyeListe = c => (c.uyeler || []).filter(u => u !== "salvea");
// Öğrenciler: öğretmenler (sunucunun yazdığı `ogrt` listesi) çıkarılır. Liste henüz yoksa herkes sayılır.
export const ogrenciListe = c => { const o = c.ogrt || []; return uyeListe(c).filter(u => !o.includes(u)); };
// Bir günde mama ve su için gereken kişi sayısı: sınıfın yarısı (yukarı yuvarlanır)
export const gerekSayisi = n => Math.max(1, Math.ceil((n || 0) / 2));

/* ---------- sohbet serisi (dondurma destekli) ---------- */
// Her gün yazışmaya devam edince seri büyür. Birebir: iki kişi de; takım: yarısı; sınıf: %25'i (en az 3).
// Hafta sonu ve dondurulmuş günler seriyi ne artırır ne bozar.
export function seriHesapla(c, simdi = new Date()) {
  const uyeler = uyeListe(c), g = c.gunler || {}, sayim = {}; uyeler.forEach(u => (g[u] || []).forEach(d => sayim[d] = (sayim[d] || 0) + 1));
  const don = new Set((c.pet && c.pet.dondur) || []);
  const esik = c.tur === "dm" ? 2 : c.tur === "sinif" ? Math.max(3, Math.ceil(uyeler.length * 0.25)) : Math.max(2, Math.ceil(uyeler.length / 2));
  const tamam = k => (sayim[k] || 0) >= esik, bugun = simdi, bk = gunAnahtar(bugun), atla = d => haftaSonu(d) || don.has(gunAnahtar(d));
  let d = new Date(bugun), n = 0, say = 0; if (!tamam(bk) && !atla(d)) d.setDate(d.getDate() - 1);
  while (say++ < 400) { if (atla(d)) { d.setDate(d.getDate() - 1); continue; } if (!tamam(gunAnahtar(d))) break; n++; d.setDate(d.getDate() - 1); }
  return { n, bugunSayi: sayim[bk] || 0, esik, tehlike: n > 0 && !tamam(bk) && !atla(bugun) && bugun.getHours() >= 16, dondurulmus: don.has(bk) };
}
// Seri dondurma: ayda 2 hak. Yalnızca bugün ya da dünkü iş günü, tamamlanmamışsa ve daha önce dondurulmamışsa.
export function dondurHakki(c, simdi = new Date()) {
  const am = ayAnahtar(gunAnahtar(simdi)), kullanilan = ((c.pet && c.pet.dondur) || []).filter(k => ayAnahtar(k) === am).length;
  return { kullanilan, kalan: Math.max(0, SABIT.DONDUR_AYLIK - kullanilan) };
}
export function dondurulabilir(c, gun, simdi = new Date()) {
  const bk = gunAnahtar(simdi), dun = gunEkle(bk, -1);
  if (gun !== bk && gun !== dun) return { ok: false, neden: "Yalnızca bugünü ya da dünü dondurabilirsin." };
  if (haftaSonu(tarih(gun))) return { ok: false, neden: "Hafta sonu zaten seriyi bozmaz." };
  if (((c.pet && c.pet.dondur) || []).includes(gun)) return { ok: false, neden: "Bu gün zaten dondurulmuş." };
  if (dondurHakki(c, simdi).kalan < 1) return { ok: false, neden: "Bu ay " + SABIT.DONDUR_AYLIK + " dondurma hakkını da kullandınız." };
  const g = c.gunler || {}, esik = seriHesapla(c, simdi).esik; let say = 0; uyeListe(c).forEach(u => { if ((g[u] || []).includes(gun)) say++; });
  if (say >= esik) return { ok: false, neden: "O gün seri zaten tamam." };
  return { ok: true };
}

/* ---------- hayvan durumu ---------- */
export const yeniPet = (now, seriNo = 1) => ({ seriNo, dogum: now, secimSon: now + SABIT.SECIM_GUN * 864e5, degisti: false, gelisim: 0, ac: 0, bes: {}, cam: {}, dondur: [], sonGun: gunAnahtar(new Date(now)) });
export const evreOf = g => { let i = 0; EVRELER.forEach((e, k) => { if ((g || 0) >= e.min) i = k; }); return i; };
export function otoSecim(c) {
  const p = c.pet || {}, h = hash(c.id + ":" + (p.seriNo || 1)), tur = HAYVANLAR[h % HAYVANLAR.length];
  return { tur: tur.id, ad: tur.isimler[(h >>> 8) % tur.isimler.length] };
}
// o gün kaç kişi mama / su verdi
export function besSayim(c, gun) {
  let mama = 0, su = 0; const b = (c.pet && c.pet.bes) || {};
  Object.keys(b).forEach(u => { const l = b[u] || []; if (l.includes(gun + "m")) mama++; if (l.includes(gun + "s")) su++; });
  return { mama, su };
}
// Bugün sırası gelen kişiler (herkes besleyebilir; sıra, görev gibi öne çıkarılır). Gün ve sınıfa göre sabit, adil dağılım.
export function siraListesi(c, gun) {
  const u = ogrenciListe(c), gerek = gerekSayisi(u.length);
  return u.map(x => [hash(c.id + ":" + gun + ":" + x), x]).sort((a, b) => a[0] - b[0]).slice(0, gerek).map(x => x[1]);
}
// Okul günü sırası (Pazartesi 2020-01-06'dan beri; hafta sonları sayılmaz). Adil dönüşüm için kullanılır.
export const okulGunNo = gun => { const fark = Math.round((tarih(gun) - tarih("2020-01-06")) / 864e5); return Math.floor(fark / 7) * 5 + Math.min(((fark % 7) + 7) % 7, 4); };
// Her sınıfta o gün çamur ikilisi: iki öğrenci. Dönüşüm sırayla ilerler (N öğrenci => her ~N/2 günde herkese sıra gelir), her turda sıralama yeniden karışır.
export function ikiliSec(c, gun) {
  const u = ogrenciListe(c); if (!u.length) return [];
  if (u.length === 1) return [u[0]];
  const idx = okulGunNo(gun) * 2, tur = Math.floor(idx / u.length), sirali = u.map(x => [hash(c.id + ":ikili:" + tur + ":" + x), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return [sirali[idx % u.length], sirali[(idx + 1) % u.length]];
}
// Çamur günü: her okul günü (hayvan yumurtadan çıktıysa). Temizlik iki kişilik bir iş: 1. kişi köpükler (a), 2. kişi durular (b).
// 2. adım ancak 1. adımdan sonra yapılır: ikili birbirine yazmak zorunda kalır. Öğleden sonra (>=14) sınıfın herhangi biri yardım edebilir.
export function camurDurumu(c, gun, saat = 12) {
  const p = c.pet; if (!p || !p.tur || p.olum || haftaSonu(tarih(gun)) || evreOf(p.gelisim) < 1) return { var: false };
  const ik = ikiliSec(c, gun); if (!ik.length) return { var: false };
  const cam = p.cam || {}, yapti = (u, ad) => ((cam[u] || []).includes(gun + ad)), kimlerA = Object.keys(cam).filter(u => yapti(u, "a")), kimlerB = Object.keys(cam).filter(u => yapti(u, "b"));
  const adimA = kimlerA.length > 0, adimB = kimlerB.length > 0;
  return { var: true, ikili: ik, a: ik[0], b: ik[1] || ik[0], tek: ik.length < 2, adimA, adimB, yapanA: kimlerA[0] || null, yapanB: kimlerB[0] || null, temiz: adimA && adimB, yardim: saat >= 14 };
}
// bir kişi şu an hangi adımı yapabilir? ("a" | "b" | null)
export function camurAdimim(cm, uid) {
  if (!cm.var || cm.temiz) return null;
  const ben = (cm.a === uid ? "a" : "") + (cm.b === uid ? "b" : "");
  if (!cm.adimA) return (ben.includes("a") || cm.yardim) ? "a" : null;
  if (!cm.adimB) return (ben.includes("b") || cm.yardim) ? "b" : null;
  return null;
}
/* ---------- ilk seçim: hepsi oy verir, "önce davranan" değil ---------- */
// oy değeri "tur|isim". Üç gün boyunca herkes istediği kadar değiştirebilir (ücretsiz). Süre bitince en çok oy alan kazanır.
export const oyAyir = s => { s = String(s || ""); const i = s.indexOf("|"); return i < 0 ? { tur: s, ad: "" } : { tur: s.slice(0, i), ad: s.slice(i + 1) }; };
export const isimTemizle = a => String(a || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
export function oySayim(c) {
  const oy = (c.pet && c.pet.oy) || {}, uyeler = new Set(uyeListe(c)), dag = {}, oylar = {};
  Object.keys(oy).forEach(u => { if (!uyeler.has(u)) return; const { tur, ad } = oyAyir(oy[u]); if (!HAYVANLAR.some(h => h.id === tur)) return; dag[tur] = (dag[tur] || 0) + 1; (oylar[tur] = oylar[tur] || []).push({ uid: u, ad: isimTemizle(ad) }); });
  return { dag, oylar, toplam: Object.values(dag).reduce((a, b) => a + b, 0), kisi: uyeler.size };
}
// Karar: en çok oy; beraberlikte kimin önce oy verdiğine değil sabit bir sıralamaya bakılır. İsim: kazanan hayvana verilen en çok önerilen isim.
export function oyKarari(c) {
  const s = oySayim(c), seriNo = (c.pet && c.pet.seriNo) || 1;
  if (!s.toplam) return { ...otoSecim(c), oyVar: false, oy: 0 };
  const enCok = Math.max(...Object.values(s.dag)), tur = Object.keys(s.dag).filter(t => s.dag[t] === enCok).sort((a, b) => hash(c.id + ":" + seriNo + ":" + a) - hash(c.id + ":" + seriNo + ":" + b))[0];
  const isimler = {}; (s.oylar[tur] || []).forEach(o => { if (!o.ad) return; const k = o.ad.toLocaleLowerCase("tr"); (isimler[k] = isimler[k] || { ad: o.ad, n: 0 }).n++; });
  const liste = Object.values(isimler).sort((a, b) => b.n - a.n || hash(c.id + a.ad) - hash(c.id + b.ad)), h = HAYVANLAR.find(x => x.id === tur);
  return { tur, ad: liste.length ? liste[0].ad : h.isimler[hash(c.id + ":ad:" + seriNo) % h.isimler.length], oyVar: true, oy: enCok };
}
// Bakım ekibi: kim ne yaptı, kimin sırası. Sıralama katkıya göre DEĞİL (kimse "geride" gösterilmez): görevi olanlar önce, sonra ada göre.
export function bakimEkibi(c, simdi = new Date()) {
  const p = c.pet || {}, bes = p.bes || {}, bk = gunAnahtar(simdi), son7 = new Set(Array.from({ length: 7 }, (_, i) => gunAnahtar(new Date(simdi.getTime() - i * 864e5))));
  const sira = new Set(siraListesi(c, bk)), cm = camurDurumu(c, bk, simdi.getHours()), oy = p.oy || {};
  return ogrenciListe(c).map(u => {
    const l = bes[u] || [], adim = cm.var ? (cm.a === u ? "a" : cm.b === u ? "b" : null) : null;
    return { uid: u, ad: (c.uyeAd || {})[u] || "Öğrenci", mama: l.includes(bk + "m"), su: l.includes(bk + "s"), hafta: l.filter(x => son7.has(x.slice(0, 10))).length, sira: sira.has(u), temiz: adim, temizYapti: !!(adim === "a" ? cm.adimA : adim === "b" ? cm.adimB : false), oy: oy[u] ? oyAyir(oy[u]).tur : null };
  }).sort((x, y) => ((y.sira || y.temiz) ? 1 : 0) - ((x.sira || x.temiz) ? 1 : 0) || x.ad.localeCompare(y.ad, "tr"));
}
// Gün kapanışı: geçmiş okul günlerini değerlendirir. Yeterince beslendiyse gelişir, değilse acıkır; 3 okul günü aç kalırsa yıldıza döner.
// Hafta sonu bakım gerekmez (ne gelişir ne acıkır). Döndürülen `yama`, updateDoc için noktalı alan yollarıdır.
export function gunuKapat(pet, bugun, gerek, c, now = Date.now()) {
  if (!pet || !pet.tur || pet.olum) return null;
  const son = pet.sonGun || bugun, dun = gunEkle(bugun, -1); if (son >= dun) return null;
  let gel = pet.gelisim || 0, ac = pet.ac || 0, olum = null, d = gunEkle(son, 1), say = 0;
  while (d <= dun && say++ < 14) {
    if (!haftaSonu(tarih(d))) {
      const s = besSayim(c, d);
      if (s.mama >= gerek && s.su >= gerek) { gel++; ac = 0; } else { ac++; if (ac >= SABIT.ACLIK_OLUM) { olum = now; break; } }
    }
    d = gunEkle(d, 1);
  }
  const yama = { "pet.sonGun": dun };
  if (gel !== (pet.gelisim || 0)) yama["pet.gelisim"] = gel;
  if (ac !== (pet.ac || 0)) yama["pet.ac"] = ac;
  if (olum) yama["pet.olum"] = olum;
  return { yama, gelisim: gel, ac, olum };
}
// Arayüzün tek kaynağı: her şeyi hesaplanmış verir
export function petDurum(c, simdi = new Date()) {
  const p = c && c.pet; if (!p) return { var: false };
  const ms = simdi.getTime(), bk = gunAnahtar(simdi), u = uyeListe(c), gerek = gerekSayisi(ogrenciListe(c).length), bugun = besSayim(c, bk), h = HAYVANLAR.find(x => x.id === p.tur) || null;
  const ev = evreOf(p.gelisim), sonraki = EVRELER[ev + 1] || null, cam = camurDurumu(c, bk, simdi.getHours());
  const hs = haftaSonu(simdi), doymus = bugun.mama >= gerek && bugun.su >= gerek;
  const mod = p.olum ? "yildiz" : !p.tur ? "secim" : "yasiyor";
  let ruh = "mutlu";
  if (mod === "yildiz") ruh = "yildiz"; else if (mod === "secim") ruh = "yumurta";
  else if ((p.ac || 0) >= 2) ruh = "cokac"; else if ((p.ac || 0) >= 1 && !doymus && !hs) ruh = "ac"; else if (cam.var && !cam.temiz) ruh = "kirli";
  return {
    var: true, mod, ruh, p, tur: h, ad: p.ad || null, evre: ev, evreAd: EVRELER[ev].ad, gelisim: p.gelisim || 0,
    sonrakiEvre: sonraki ? { ad: sonraki.ad, kalan: sonraki.min - (p.gelisim || 0) } : null,
    ac: p.ac || 0, olmeyeKalan: Math.max(0, SABIT.ACLIK_OLUM - (p.ac || 0)),
    secimKalanMs: !p.tur && !p.olum ? Math.max(0, (p.secimSon || 0) - ms) : 0, secimBitti: !p.tur && !p.olum && ms > (p.secimSon || 0),
    degistirilebilir: !!p.tur && !p.olum && !p.degisti, oyDurumu: mod === "secim" ? oySayim(c) : null,
    gerek, bugun, doymus, hs, sira: siraListesi(c, bk), camur: cam, dondur: dondurHakki(c, simdi),
  };
}
