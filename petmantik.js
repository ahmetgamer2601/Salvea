// Sınıf evcil hayvanı ve sohbet serisi: SAF mantık. Hiçbir dış bağımlılığı yok (tarayıcıda da node'da da çalışır, test edilebilir).
// Durum, sınıf sohbet belgesindeki `pet` alanında durur; zaten dinlenen belge olduğu için ek okuma doğurmaz.

export const SABIT = { SECIM_GUN: 3, ACLIK_OLUM: 3, DEGISTIR_MAMA: 5, DONDUR_AYLIK: 2, GUNLUK_ODUL_SU: 1, TEMIZLE_ODUL_MAMA: 1 };

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

/* ---------- tarih yardımcıları (yerel saat; Türkiye tek saat dilimi) ---------- */
export const gunAnahtar = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export const tarih = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); };
export const gunEkle = (k, n) => { const d = tarih(k); d.setDate(d.getDate() + n); return gunAnahtar(d); };
export const haftaSonu = d => d.getDay() === 0 || d.getDay() === 6;
export const ayAnahtar = k => k.slice(0, 7);

/* ---------- üyeler ---------- */
export const uyeListe = c => (c.uyeler || []).filter(u => u !== "salvea");
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
  const u = uyeListe(c), gerek = gerekSayisi(u.length);
  return u.map(x => [hash(c.id + ":" + gun + ":" + x), x]).sort((a, b) => a[0] - b[0]).slice(0, gerek).map(x => x[1]);
}
// Çamur günü: üç günden birinde, hafta içi. Temizleme görevi bir kişiye düşer.
export function camurDurumu(c, gun) {
  const p = c.pet; if (!p || !p.tur || p.olum || haftaSonu(tarih(gun)) || hash(c.id + ":camur:" + gun) % 3 !== 0) return { var: false };
  const u = uyeListe(c); if (!u.length) return { var: false };
  const atanan = u.map(x => [hash(c.id + ":c:" + gun + ":" + x), x]).sort((a, b) => a[0] - b[0])[0][1];
  const temiz = Object.values(p.cam || {}).some(l => (l || []).includes(gun));
  return { var: true, atanan, temiz };
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
  const ms = simdi.getTime(), bk = gunAnahtar(simdi), u = uyeListe(c), gerek = gerekSayisi(u.length), bugun = besSayim(c, bk), h = HAYVANLAR.find(x => x.id === p.tur) || null;
  const ev = evreOf(p.gelisim), sonraki = EVRELER[ev + 1] || null, cam = camurDurumu(c, bk);
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
    degistirilebilir: !!p.tur && !p.olum && !p.degisti,
    gerek, bugun, doymus, hs, sira: siraListesi(c, bk), camur: cam, dondur: dondurHakki(c, simdi),
  };
}
