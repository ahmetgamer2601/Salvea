// Salvea bildirim sunucusu (Cloudflare Workers, ücretsiz plan).
// Uygulama bir olay olduğunda (mesaj, program, görev, randevu…) buraya "şu belge oluştu" diye haber verir.
// Sunucu: kimliği doğrular, olayın gerçekten olduğunu Firestore'dan kontrol eder, alıcıları belirler ve Web Push gönderir.
// Gerekli gizli değerler (Cloudflare > Worker > Settings > Variables): PROJE_ID, FIREBASE_SA, VAPID_PRIVATE, VAPID_PUBLIC, VAPID_SUB, IZIN_KOKEN

const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = {
  enc: b => { let s = ""; for (const x of new Uint8Array(b)) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  dec: s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const r = atob(s), u = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) u[i] = r.charCodeAt(i); return u; }
};
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };

/* ------------------------------------------------------------------ Web Push şifreleme (RFC 8291 / RFC 8188, aes128gcm) */
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}
export async function sifrele(metin, p256dh, auth, test = {}) {
  const uaPub = b64u.dec(p256dh), authSecret = b64u.dec(auth);
  const asKeys = test.asKeys || await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeys.privateKey, 256));
  const ikm = await hkdf(authSecret, ecdh, cat(enc.encode("WebPush: info\0"), uaPub, asPub), 32);
  const salt = test.salt || crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const veri = cat(typeof metin === "string" ? enc.encode(metin) : metin, new Uint8Array([2]));   // tek kayıt: son kayıt ayırıcısı
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const sifreli = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, veri));
  const rs = new Uint8Array([0, 0, 16, 0]);   // kayıt boyutu 4096
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, sifreli);
}

/* ------------------------------------------------------------------ VAPID (RFC 8292) */
const vapidCache = new Map();
async function vapidBaslik(env, endpoint) {
  const aud = new URL(endpoint).origin, now = Math.floor(Date.now() / 1000), c = vapidCache.get(aud);
  if (c && c.exp - now > 3600) return c.h;
  const exp = now + 12 * 3600;
  const jwk = JSON.parse(env.VAPID_PRIVATE);
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const g = enc.encode(b64u.enc(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" }))) + "." + b64u.enc(enc.encode(JSON.stringify({ aud, exp, sub: env.VAPID_SUB || "mailto:admin@example.com" }))));
  const imza = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, g));
  const h = "vapid t=" + dec.decode(g) + "." + b64u.enc(imza) + ", k=" + env.VAPID_PUBLIC;
  vapidCache.set(aud, { h, exp }); return h;
}
async function pushGonder(env, abone, yuk) {
  const govde = await sifrele(JSON.stringify(yuk), abone.p256dh, abone.auth);
  const r = await fetch(abone.endpoint, { method: "POST", headers: { "Authorization": await vapidBaslik(env, abone.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", "TTL": "86400", "Urgency": "normal" }, body: govde });
  return r.status;
}

/* ------------------------------------------------------------------ Firebase kimlik doğrulama */
let jwks = null, jwksTs = 0;
async function kimlik(env, istek) {
  const tok = (istek.headers.get("Authorization") || "").replace(/^Bearer /, ""); const [h64, p64, s64] = tok.split(".");
  if (!s64) throw new Error("kimlik yok");
  const h = JSON.parse(dec.decode(b64u.dec(h64))), p = JSON.parse(dec.decode(b64u.dec(p64)));
  if (!jwks || Date.now() - jwksTs > 3600e3) { jwks = (await (await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")).json()).keys; jwksTs = Date.now(); }
  const jwk = jwks.find(k => k.kid === h.kid); if (!jwk || h.alg !== "RS256") throw new Error("anahtar yok");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u.dec(s64), enc.encode(h64 + "." + p64))) throw new Error("imza geçersiz");
  const now = Date.now() / 1000;
  if (p.aud !== env.PROJE_ID || p.iss !== "https://securetoken.google.com/" + env.PROJE_ID || p.exp < now || !p.sub) throw new Error("jeton geçersiz");
  return p.sub;
}

/* ------------------------------------------------------------------ Firestore (REST, servis hesabıyla) */
let erisim = null;
async function jeton(env) {
  if (erisim && erisim.exp > Date.now() + 60e3) return erisim.t;
  const sa = JSON.parse(env.FIREBASE_SA), now = Math.floor(Date.now() / 1000);
  const g = b64u.enc(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))) + "." + b64u.enc(enc.encode(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", b64u.dec(pem.replace(/\+/g, "-").replace(/\//g, "_")), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const imza = b64u.enc(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(g)));
  const r = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + g + "." + imza })).json();
  if (!r.access_token) throw new Error("erişim jetonu alınamadı");
  erisim = { t: r.access_token, exp: Date.now() + (r.expires_in || 3600) * 1000 }; return erisim.t;
}
const deger = v => v == null ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? +v.integerValue : "doubleValue" in v ? v.doubleValue : "booleanValue" in v ? v.booleanValue : "timestampValue" in v ? Date.parse(v.timestampValue) : "arrayValue" in v ? (v.arrayValue.values || []).map(deger) : "mapValue" in v ? alan(v.mapValue.fields || {}) : null;
const alan = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, deger(v)]));
const kok = env => "https://firestore.googleapis.com/v1/projects/" + env.PROJE_ID + "/databases/(default)/documents";
async function oku(env, yol) {
  const r = await fetch(kok(env) + "/" + yol, { headers: { Authorization: "Bearer " + await jeton(env) } });
  if (r.status === 404) return null; if (!r.ok) throw new Error("firestore " + r.status);
  const j = await r.json(); return { id: yol.split("/").pop(), ...alan(j.fields) };
}
async function sorgu(env, koleksiyon, filtreler, limit = 300) {
  const f = filtreler.map(([yol, op, v]) => ({ fieldFilter: { field: { fieldPath: yol }, op, value: Array.isArray(v) ? { arrayValue: { values: v.map(x => ({ stringValue: x })) } } : typeof v === "boolean" ? { booleanValue: v } : { stringValue: v } } }));
  const r = await fetch(kok(env) + ":runQuery", { method: "POST", headers: { Authorization: "Bearer " + await jeton(env), "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: koleksiyon }], where: f.length > 1 ? { compositeFilter: { op: "AND", filters: f } } : f[0], limit } }) });
  if (!r.ok) throw new Error("sorgu " + r.status);
  return (await r.json()).filter(x => x.document).map(x => ({ id: x.document.name.split("/").pop(), ...alan(x.document.fields) }));
}
async function sil(env, yol) { await fetch(kok(env) + "/" + yol, { method: "DELETE", headers: { Authorization: "Bearer " + await jeton(env) } }); }

/* ------------------------------------------------------------------ Olay → alıcılar + metin */
const adOf = u => u ? (u.role === "teacher" ? (u.ad + " " + u.soyad) : (u.takmaAd || u.ad)) : "Birisi";
const kes = (s, n) => (s || "").length > n ? s.slice(0, n - 1) + "…" : (s || "");
const sonDakika = (ts, dk) => ts && Date.now() - ts < dk * 60e3 && ts - Date.now() < 60e3;
const ogrenciler = async (env, okulId, ek = []) => (await sorgu(env, "users", [["role", "EQUAL", "student"], ["okulId", "EQUAL", okulId], ...ek], 500)).map(u => u.id);
const ogretmenler = async (env, okulId) => (await sorgu(env, "users", [["role", "EQUAL", "teacher"], ["okulId", "EQUAL", okulId], ["onayli", "EQUAL", true]], 100)).map(u => u.id);

async function olay(env, uid, g) {
  const me = await oku(env, "users/" + uid); if (!me) throw new Error("kullanıcı yok");
  const tur = g.tur;
  if (tur === "test") return { alicilar: [uid], tur: "test", baslik: "Salvea", metin: "Bildirimler çalışıyor.", url: "#/ayarlar", tag: "test" };
  if (tur === "sohbet") {
    const c = await oku(env, "sohbetler/" + g.sohbet), m = await oku(env, "sohbetler/" + g.sohbet + "/mesajlar/" + g.mesaj);
    if (!c || !m || !c.uyeler.includes(uid) || m.uid !== uid || m.silindi || !sonDakika(m.ts, 5)) throw new Error("mesaj doğrulanamadı");
    const grup = c.tur === "takim";
    return { alicilar: c.uyeler.filter(x => x !== uid), tur: "sohbet", baslik: grup ? c.ad : adOf(me), metinOnizleme: (grup ? adOf(me).split(" ")[0] + ": " : "") + (m.metin ? kes(m.metin.replace(/^💡 /, ""), 100) : "Fotoğraf"), metin: "Yeni mesaj", url: "#/sohbet?c=" + g.sohbet, tag: "sohbet-" + g.sohbet };
  }
  if (tur === "program") {
    const p = await oku(env, "programlar/" + g.id); if (!p || p.olusturan !== uid || me.role !== "teacher") throw new Error("program doğrulanamadı");
    let a = [];
    if (p.kapsam === "okul") a = await ogrenciler(env, p.okulId);
    else if (p.kapsam === "kisi") a = (p.ogrenciler || []).slice(0, 300);
    else if (String(p.kapsam).startsWith("sinif:")) { const [s, sb] = p.kapsam.slice(6).split("-"); a = await ogrenciler(env, p.okulId, [["sinif", "EQUAL", s], ["sube", "EQUAL", sb]]); }
    return { alicilar: a, tur: "program", baslik: "Yeni program", metinOnizleme: kes(p.ad || "Programın güncellendi", 100), metin: "Programında bir güncelleme var.", url: "#/program", tag: "program-" + g.id };
  }
  if (tur === "gorev") {
    const a = await oku(env, "atananGorevler/" + g.id); if (!a || a.olusturan !== uid || me.role !== "teacher") throw new Error("görev doğrulanamadı");
    const t = await sorgu(env, "takimlar", [["donemId", "EQUAL", a.donemId], ["aktif", "EQUAL", true]], 100);
    return { alicilar: [...new Set(t.flatMap(x => x.uyeler || []))], tur: "gorev", baslik: "Yeni görev", metinOnizleme: kes(a.baslik, 100), metin: "Takımına yeni bir görev verildi.", url: "#/gorev", tag: "gorev-" + g.id };
  }
  if (tur === "kanit") {   // öğretmen onayladı / tekrar istedi
    const k = await oku(env, "gorevKanitlari/" + g.id); if (!k || me.role !== "teacher" || me.okulId !== k.okulId || !["onaylandi", "tekrar"].includes(k.durum)) throw new Error("kanıt doğrulanamadı");
    const on = k.durum === "onaylandi";
    return { alicilar: k.uyeler || [], tur: "gorev", baslik: on ? "Görevin onaylandı" : "Görev için tekrar istendi", metinOnizleme: on ? "Takımın " + (k.puan || 0) + " puan kazandı." : kes(k.yorum || "Öğretmenin bir not bıraktı.", 100), metin: on ? "Takımın puan kazandı." : "Öğretmenin bir not bıraktı.", url: "#/gorev", tag: "kanit-" + g.id };
  }
  if (tur === "kanitGonder") {   // takım kanıt gönderdi → öğretmenlere
    const k = await oku(env, "gorevKanitlari/" + g.id); if (!k || !(k.uyeler || []).includes(uid) || k.durum !== "bekliyor") throw new Error("kanıt doğrulanamadı");
    return { alicilar: await ogretmenler(env, k.okulId), tur: "gorev", baslik: "Onay bekleyen kanıt", metinOnizleme: kes((k.takimAd || "Bir takım") + " bir görev kanıtı gönderdi.", 100), metin: "Bir takım görev kanıtı gönderdi.", url: "#/gorev", tag: "kanitg-" + g.id };
  }
  if (tur === "randevu") {
    const r = await oku(env, "randevular/" + g.id); if (!r || r.tur !== "randevu") throw new Error("randevu doğrulanamadı");
    if (r.ogrenci === uid && r.durum === "bekliyor") return { alicilar: [r.ogretmen], tur: "randevu", baslik: "Yeni randevu talebi", metinOnizleme: kes(adOf(me) + " randevu istiyor: " + r.tarih + " " + r.saat, 100), metin: "Yeni bir randevu talebin var.", url: "#/randevu", tag: "randevu-" + g.id };
    if (r.ogretmen === uid && ["onaylandi", "reddedildi"].includes(r.durum)) { const on = r.durum === "onaylandi"; return { alicilar: [r.ogrenci], tur: "randevu", baslik: on ? "Randevun onaylandı" : "Randevu talebin yanıtlandı", metinOnizleme: kes(r.tarih + " " + r.saat + (r.yanit ? " · " + r.yanit : ""), 100), metin: on ? "Randevun onaylandı." : "Randevu talebine yanıt geldi.", url: "#/randevu", tag: "randevu-" + g.id }; }
    throw new Error("randevu durumu uygun değil");
  }
  if (tur === "yardim") {
    const y = await oku(env, "yardim/" + g.id); if (!y || y.uid !== uid) throw new Error("istek doğrulanamadı");
    return { alicilar: await ogretmenler(env, y.okulId), tur: "yardim", baslik: "Bir öğrenci seninle konuşmak istiyor", metinOnizleme: "Yardım isteklerini panelden görebilirsin.", metin: "Yardım isteklerini panelden görebilirsin.", url: "#/home", tag: "yardim-" + g.id };
  }
  throw new Error("bilinmeyen tür");
}

/* ------------------------------------------------------------------ İstek yöneticisi */
const sayac = new Map();
function sinir(uid) { const n = Date.now(), a = (sayac.get(uid) || []).filter(t => n - t < 60e3); if (a.length >= 40) return false; a.push(n); sayac.set(uid, a); return true; }
const cevap = (env, istek, govde, durum = 200) => new Response(JSON.stringify(govde), { status: durum, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": env.IZIN_KOKEN || "*", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Vary": "Origin" } });

export default {
  async fetch(istek, env) {
    if (istek.method === "OPTIONS") return cevap(env, istek, {}, 204);
    if (istek.method !== "POST") return cevap(env, istek, { hata: "yalnızca POST" }, 405);
    let uid;
    try { uid = await kimlik(env, istek); } catch (e) { return cevap(env, istek, { hata: "kimlik doğrulanamadı" }, 401); }
    if (!sinir(uid)) return cevap(env, istek, { hata: "çok fazla istek" }, 429);
    try {
      const g = await istek.json(), o = await olay(env, uid, g);
      const alicilar = [...new Set(o.alicilar)].filter(x => x !== uid || o.tur === "test").slice(0, 60);
      let abonelikler = [];
      for (let i = 0; i < alicilar.length; i += 10) abonelikler.push(...await sorgu(env, "abonelikler", [["uid", "IN", alicilar.slice(i, i + 10)]], 200));
      let gonderilen = 0, silinen = 0;
      await Promise.all(abonelikler.map(async a => {
        if (a.turler && a.turler[o.tur] === false) return;
        const yuk = { baslik: o.baslik, metin: a.onizleme && o.metinOnizleme ? o.metinOnizleme : o.metin, url: o.url, tag: o.tag };
        try { const d = await pushGonder(env, a, yuk); if (d >= 200 && d < 300) gonderilen++; else if (d === 404 || d === 410) { silinen++; await sil(env, "abonelikler/" + a.id); } } catch (_) {}
      }));
      return cevap(env, istek, { gonderilen, silinen });
    } catch (e) { return cevap(env, istek, { hata: String(e.message || e).slice(0, 120) }, 400); }
  }
};
