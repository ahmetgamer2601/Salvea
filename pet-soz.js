// Hayvanın söyledikleri: duruma, saate, evreye ve sınıfa göre. Saf mantık (node'da test edilir).
// İlke: kısa, sıcak, baskı yapmayan; yalnızlığı ve teşekkürü öne çıkarır (sosyal beceri + aidiyet).
const sec = (liste, r) => liste[Math.floor(r() * liste.length) % liste.length];
const doldur = (m, v) => m.replace(/\{(\w+)\}/g, (_, k) => v[k] != null ? v[k] : "");

const SOZ = {
  yumurta: ["…", "Tık tık. Biri orada mı?", "Burası sıcacık. Çok sürmez, çıkacağım."],
  yildiz: ["Gökyüzünden sizi izliyorum. Birbirinize iyi bakın.", "Her gece parlayacağım. Beni unutmayın.", "Yeni bir yumurta gelince ona nazik olun, olur mu?"],
  aksam: ["İyi akşamlar {ad}. Bugün nasıldı?", "Akşam oldu, biraz yorgunum ama mutluyum.", "Bugün sınıfta kimi güldürdün {ad}?"],
  gece: ["Zzz… yarın görüşürüz {ad}.", "Hmm… beş dakika daha uyuyayım…", "Zzz… rüyamda hepiniz oradaydınız…"],
  gunaydin: ["Günaydın {ad}! Seni görmek çok güzel.", "Günaydın sınıf! Bugün güzel bir gün olacak.", "Uyandım! Kahvaltı ne zaman?"],
  gun: ["Merhaba {ad}!", "Selam {ad}! Bugün sınıfta kim yalnız kalmış olabilir? Bir selam yeter.", "Sen buradayken hep daha eğlenceli."],
  cokac: ["Çok yorgunum… Lütfen beni unutmayın.", "Karnım çok boş… Yardım edin lütfen.", "Biraz mama ve su ile çok daha iyi olurum…"],
  ac: ["Karnım guruldadı… Bugün mama var mı?", "Biraz susadım. Sınıfın yarısı yardım ederse harika olur.", "Hepimiz birlikte bakarsak çok kolay olur {ad}."],
  mamaEksik: ["Mamam tamam, ama su içebilir miyim?", "Su kâsem boş kalmış…"],
  suEksik: ["Suyum tamam, ama biraz mama?", "Karnım hâlâ boş, biraz mama olur mu?"],
  doymus: ["Karnım tok, kalbim dolu! Teşekkürler sınıf!", "Bugün herkes çok iyiydi. Hepinizi seviyorum.", "Birlikte yaptığınız şeyleri çok seviyorum."],
  kirli: ["Hapşuu! Çamura girdim… Biri beni temizler mi?", "Üstüm başım çamur oldu, hihi.", "Hapşuu! Pardon… çamurlu bir gün."],
  sira: ["{ad}, bugün sıra sende! Küçük bir mama ve su olur mu?", "Bugün bana bakma sırası sende {ad}. Sana güveniyorum."],
  dun: ["Dün beni {bakici} besledi, teşekkürler!", "{bakici} dün çok iyiydi bana. Ona teşekkür etmeyi unutmayın."],
  seri: ["{n} gündür birlikteyiz!", "{n} günlük seri! Devam edelim, olur mu?", "Her gün konuşunca seri büyüyor, ben de büyüyorum."],
  evre: ["Bak, büyüyorum! Hepinize teşekkürler.", "Bir önceki gün olduğumdan daha büyüğüm, fark ettin mi?"],
  genel: ["Biri yalnız görünüyorsa ona selam ver, olur mu?", "Bir arkadaşına teşekkür et. Hayvanlar bunu çok sever.", "Birlikte daha güçlüyüz.", "Bugün kime yardım ettin?", "Sınıfımız dünyanın en iyisi. Gerçekten.", "Güzel bir söz söylemek hiçbir şeye mal olmaz.", "Kimseyi dışarıda bırakmayalım, değil mi?"],
  // yavru ve çocuk evrelerinde çekingen
  cekingen: ["Ş-şey… merhaba…", "Biraz utanıyorum. Yavaş ol lütfen.", "Sen iyi birisin, değil mi?", "Çok yaklaşma… ama gitme de."],
  cekingenTepki: ["Ş-şey… merhaba…", "Biraz utanıyorum. Yavaş ol lütfen.", "Sen iyi birisin, değil mi?", "(Gözlerini kapatıp saklanıyor.)", "Çok yaklaşma… ama gitme de."],   // yalnızca dokunma tepkisinde; sahne yönergesi içerir
  guven: ["Seni sevmeye başladım.", "Artık senden korkmuyorum. Biraz.", "Sen geldiğinde kuyruğum kendiliğinden sallanıyor."],
  okşa: ["Hihi, gıdıklanıyorum!", "Bir daha!", "Çok güzel hissettiriyor.", "Mırr… yani, cik cik… yani, hihi."],
  yem: ["Nam nam nam!", "Çok güzel! Teşekkürler {ad}!", "Tam da ihtiyacım olan buydu."],
  su: ["Glu glu… ah, ne iyi geldi!", "Serinledim! Teşekkürler {ad}."],
  temizSira: ["{ad}, bugün temizlik ikilisindesin! {es} ile konuşup birlikte halledin.", "Köpük köpük! {es} ile iş bölümü yapın, olur mu?", "Bugün beni sen ve {es} temizleyeceksiniz. Önce bir selam verin birbirinize."],
  kopuk: ["Köpüklüyüm! Şimdi durulanma zamanı.", "Gıdıklanıyorum… köpük köpük!"],
  giysiDar: ["Üstümdeki {giysi} bana dar geldi, çünkü büyüdüm!", "Eski {giysi} sıkıyor artık. Büyümek güzel ama giysi dar kaldı!", "{giysi} küçüldü mü ne? Yok yok, ben büyüdüm!"],
  giysiYeni: ["Bak, yeni kıyafetim: {giysi}! Nasıl olmuş?", "{giysi} çok hoşuma gitti, teşekkürler!", "Yeni kıyafetimle kendimi daha büyük hissediyorum."],
  giysiDolap: ["Bu {giysi}, küçükken çok severdim.", "Eski {giysi} anılarımda hâlâ duruyor."],
  temiz: ["Ahh, tertemiz oldum! Sağ ol {ad}.", "Pırıl pırıl! Çok teşekkürler."],
};
export const SOZ_KATEGORILERI = Object.keys(SOZ);

// d: petDurum çıktısı; x: { ad, saat, bakici, seri, sinif }
export function sozSec(d, x = {}, r = Math.random) {
  const v = { ad: x.ad || "", n: x.seri || 0, bakici: x.bakici || "", sinif: x.sinif || "", es: x.es || "arkadaşın", giysi: x.giysi || "kıyafet" }, saat = x.saat == null ? 12 : x.saat;
  const al = k => doldur(sec(SOZ[k], r), v);
  if (!d || !d.var) return "";
  if (d.mod === "yildiz") return al("yildiz");
  if (d.mod === "secim" || d.evre === 0) return al("yumurta");
  if (saat >= 21 || saat < 6) return al("gece");
  const k = [];
  if (d.ruh === "cokac") k.push("cokac", "cokac", "cokac");
  else if (d.ruh === "ac") k.push("ac", "ac", d.bugun.mama < d.gerek && d.bugun.su >= d.gerek ? "mamaEksik" : d.bugun.su < d.gerek && d.bugun.mama >= d.gerek ? "suEksik" : "ac");
  if (d.ruh === "kirli" || (d.camur && d.camur.var && !d.camur.temiz)) k.push("kirli", "kirli");
  if (x.giysi && r() < 0.3) k.push("giysiYeni");
  if (x.temizSirasi) k.push("temizSira", "temizSira", "temizSira");
  if (x.siraBende) k.push("sira", "sira");
  if (d.doymus) k.push("doymus", "doymus");
  if (x.bakici) k.push("dun");
  if (x.seri >= 2) k.push("seri");
  if (d.evre <= 2) k.push("cekingen", "cekingen"); else k.push("guven");
  if (saat >= 17) k.push("aksam"); else if (saat < 9) k.push("gunaydin"); else k.push("gun");
  k.push("genel", "genel");
  return al(k[Math.floor(r() * k.length) % k.length]);
}
// Dokunma tepkisi: yavruyken çekingen, büyüdükçe cana yakın. dokunma: bu oturumdaki dokunma sayısı
export function dokunTepkisi(d, dokunma, x = {}, r = Math.random) {
  const v = { ad: x.ad || "" }, evre = d ? d.evre : 2;
  if (d && d.mod === "secim") return { tur: "yumurta", soz: doldur(sec(SOZ.yumurta, r), v) };
  const cekingen = evre <= 2 && dokunma < (evre === 1 ? 4 : 2) && r() < (evre === 1 ? 0.85 : 0.5);
  if (cekingen) return { tur: "cekingen", soz: doldur(sec(SOZ.cekingenTepki, r), v) };
  return { tur: "oksa", soz: doldur(sec(dokunma >= 4 ? SOZ.okşa : SOZ.okşa.concat(SOZ.guven), r), v) };
}
export const eylemSozu = (tur, x = {}, r = Math.random) => doldur(sec(SOZ[tur] || SOZ.genel, r), { ad: x.ad || "", es: x.es || "arkadaşın", giysi: x.giysi || "kıyafet" });
