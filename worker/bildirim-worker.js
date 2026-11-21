// Salvea sunucusu (Cloudflare Workers, ücretsiz plan): telefon bildirimi + sınıf sohbeti zamanlayıcısı.
// Gerekli değişkenler: PROJE_ID, FIREBASE_SA, VAPID_PRIVATE, VAPID_PUBLIC, VAPID_SUB, IZIN_KOKEN. Cron: */5 * * * *
const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = { enc: b => { let s = ""; for (const x of new Uint8Array(b)) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  dec: s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const r = atob(s), u = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) u[i] = r.charCodeAt(i); return u; } };
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
// İstemciden gelen kimlikler Firestore yoluna girmeden doğrulanır (yol enjeksiyonunu önler)
const kimlikOk = s => typeof s === "string" && /^[A-Za-z0-9_-]{1,120}$/.test(s);
const gerekli = (...a) => { for (const x of a) if (!kimlikOk(x)) throw new Error("geçersiz kimlik"); };

/* Web Push şifreleme (RFC 8291 / 8188, aes128gcm) */
async function hkdf(salt, ikm, info, len) { const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]); return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8)); }
export async function sifrele(metin, p256dh, auth, test = {}) {
  const uaPub = b64u.dec(p256dh), authSecret = b64u.dec(auth);
  const asKeys = test.asKeys || await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeys.privateKey, 256));
  const ikm = await hkdf(authSecret, ecdh, cat(enc.encode("WebPush: info\0"), uaPub, asPub), 32), salt = test.salt || crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16), nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const veri = cat(typeof metin === "string" ? enc.encode(metin) : metin, new Uint8Array([2])), k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  return cat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPub.length]), asPub, new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, veri)));
}
/* VAPID (RFC 8292) ve push uç noktası denetimi: yalnızca bilinen push servislerine istek atılır */
const PUSH_HOSTLAR = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.push\.apple\.com$/, /\.notify\.windows\.com$/];
export const pushUrlOk = u => { try { const x = new URL(u); return x.protocol === "https:" && !x.username && PUSH_HOSTLAR.some(r => r.test(x.hostname)); } catch (_) { return false; } };
const vapidCache = new Map();
async function vapidBaslik(env, endpoint) {
  const aud = new URL(endpoint).origin, now = Math.floor(Date.now() / 1000), c = vapidCache.get(aud); if (c && c.exp - now > 3600) return c.h;
  const key = await crypto.subtle.importKey("jwk", JSON.parse(env.VAPID_PRIVATE), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const g = enc.encode(b64u.enc(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" }))) + "." + b64u.enc(enc.encode(JSON.stringify({ aud, exp: now + 12 * 3600, sub: env.VAPID_SUB || "mailto:admin@example.com" }))));
  const h = "vapid t=" + dec.decode(g) + "." + b64u.enc(new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, g))) + ", k=" + env.VAPID_PUBLIC;
  vapidCache.set(aud, { h, exp: now + 12 * 3600 }); return h;
}
async function pushGonder(env, abone, yuk) {
  if (!pushUrlOk(abone.endpoint)) return 410;
  const r = await fetch(abone.endpoint, { method: "POST", headers: { Authorization: await vapidBaslik(env, abone.endpoint), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "normal" }, body: await sifrele(JSON.stringify(yuk), abone.p256dh, abone.auth) });
  return r.status;
}
/* Firebase kimlik doğrulama */
let jwks = null, jwksTs = 0;
async function kimlik(env, istek) {
  const [h64, p64, s64] = (istek.headers.get("Authorization") || "").replace(/^Bearer /, "").split("."); if (!s64) throw new Error("kimlik yok");
  const h = JSON.parse(dec.decode(b64u.dec(h64))), p = JSON.parse(dec.decode(b64u.dec(p64)));
  if (!jwks || Date.now() - jwksTs > 3600e3) { jwks = (await (await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")).json()).keys; jwksTs = Date.now(); }
  const jwk = jwks.find(k => k.kid === h.kid); if (!jwk || h.alg !== "RS256") throw new Error("anahtar yok");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u.dec(s64), enc.encode(h64 + "." + p64))) throw new Error("imza geçersiz");
  if (p.aud !== env.PROJE_ID || p.iss !== "https://securetoken.google.com/" + env.PROJE_ID || p.exp < Date.now() / 1000 || !p.sub) throw new Error("jeton geçersiz");
  return p.sub;
}
/* Firestore (REST, servis hesabıyla) */
let erisim = null;
async function jeton(env) {
  if (erisim && erisim.exp > Date.now() + 60e3) return erisim.t;
  const sa = JSON.parse(env.FIREBASE_SA), now = Math.floor(Date.now() / 1000);
  const g = b64u.enc(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))) + "." + b64u.enc(enc.encode(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const key = await crypto.subtle.importKey("pkcs8", b64u.dec(sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "").replace(/\+/g, "-").replace(/\//g, "_")), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const r = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + g + "." + b64u.enc(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(g))) })).json();
  if (!r.access_token) throw new Error("erişim jetonu alınamadı"); erisim = { t: r.access_token, exp: Date.now() + (r.expires_in || 3600) * 1000 }; return erisim.t;
}
const deger = v => v == null ? null : "stringValue" in v ? v.stringValue : "integerValue" in v ? +v.integerValue : "doubleValue" in v ? v.doubleValue : "booleanValue" in v ? v.booleanValue : "timestampValue" in v ? Date.parse(v.timestampValue) : "arrayValue" in v ? (v.arrayValue.values || []).map(deger) : "mapValue" in v ? alan(v.mapValue.fields || {}) : null;
const alan = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, deger(v)]));
const tv = v => v == null ? { nullValue: null } : typeof v === "boolean" ? { booleanValue: v } : typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === "string" ? { stringValue: v } : v instanceof Date ? { timestampValue: v.toISOString() } : Array.isArray(v) ? { arrayValue: { values: v.map(tv) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tv(x)])) } };
const kok = env => "https://firestore.googleapis.com/v1/projects/" + env.PROJE_ID + "/databases/(default)/documents";
const baslik = async (env, ek = {}) => ({ Authorization: "Bearer " + await jeton(env), ...ek });
async function oku(env, yol) { const r = await fetch(kok(env) + "/" + yol, { headers: await baslik(env) }); if (r.status === 404) return null; if (!r.ok) throw new Error("firestore " + r.status); return { id: yol.split("/").pop(), ...alan((await r.json()).fields) }; }
async function sorgu(env, koleksiyon, filtreler, limit = 300, sadeceId = false) {
  const f = filtreler.map(([yol, op, v]) => ({ fieldFilter: { field: { fieldPath: yol }, op, value: Array.isArray(v) ? { arrayValue: { values: v.map(x => ({ stringValue: x })) } } : typeof v === "boolean" ? { booleanValue: v } : { stringValue: v } } }));
  const parca = koleksiyon.split("/"), ad = parca.pop(), ust = parca.join("/");
  const r = await fetch(kok(env) + (ust ? "/" + ust : "") + ":runQuery", { method: "POST", headers: await baslik(env, { "Content-Type": "application/json" }), body: JSON.stringify({ structuredQuery: { select: sadeceId ? { fields: [{ fieldPath: "__name__" }] } : undefined, from: [{ collectionId: ad }], where: f.length > 1 ? { compositeFilter: { op: "AND", filters: f } } : f[0], limit } }) });
  if (!r.ok) throw new Error("sorgu " + r.status); return (await r.json()).filter(x => x.document).map(x => ({ id: x.document.name.split("/").pop(), ...alan(x.document.fields) }));
}
const govdeAlanlari = a => JSON.stringify({ fields: Object.fromEntries(Object.entries(a).map(([k, v]) => [k, tv(v)])) });
async function yaz(env, yol, alanlar, maske) { const r = await fetch(kok(env) + "/" + yol + (maske ? "?" + maske.map(m => "updateMask.fieldPaths=" + encodeURIComponent(m)).join("&") : ""), { method: "PATCH", headers: await baslik(env, { "Content-Type": "application/json" }), body: govdeAlanlari(alanlar) }); if (!r.ok) throw new Error("yazma " + r.status); }
async function ekle(env, kol, alanlar) { const r = await fetch(kok(env) + "/" + kol, { method: "POST", headers: await baslik(env, { "Content-Type": "application/json" }), body: govdeAlanlari(alanlar) }); if (!r.ok) throw new Error("ekleme " + r.status); return (await r.json()).name.split("/").pop(); }
async function sil(env, yol) { await fetch(kok(env) + "/" + yol, { method: "DELETE", headers: await baslik(env) }); }

/* Yardımcılar */
const adOf = u => u ? (u.role === "teacher" ? u.ad + " " + u.soyad : u.takmaAd || u.ad) : "Birisi";
const kes = (s, n) => (s || "").length > n ? s.slice(0, n - 1) + "…" : s || "";
const sonDakika = (ts, dk) => ts && Date.now() - ts < dk * 60e3 && ts - Date.now() < 60e3;
const ogrenciler = async (env, okulId, ek = [], id = false) => (await sorgu(env, "users", [["role", "EQUAL", "student"], ["okulId", "EQUAL", okulId], ...ek], 1000, id)).map(u => u.id);
const ogretmenler = async (env, okulId) => (await sorgu(env, "users", [["role", "EQUAL", "teacher"], ["okulId", "EQUAL", okulId], ["onayli", "EQUAL", true]], 100, true)).map(u => u.id);
const sinifOgr = (env, okulId, kapsam, id = true) => { const [s, sb] = kapsam.split("-"); return ogrenciler(env, okulId, [["sinif", "EQUAL", s], ["sube", "EQUAL", sb]], id); };
const DILIM = 10;   // bir istekte en fazla bu kadar kişi (ücretsiz plan: istek başına ~50 alt istek)
async function gonderDilim(env, alicilar, o) {
  const abonelikler = alicilar.length ? await sorgu(env, "abonelikler", [["uid", "IN", alicilar]], 200) : []; let gonderilen = 0, silinen = 0; const ulasilan = new Set();
  await Promise.all(abonelikler.map(async a => {
    if (a.turler && a.turler[o.tur] === false) return;
    const yuk = { baslik: o.baslik, metin: !o.herkeseAcik && !a.onizleme ? o.metin : o.metinOnizleme || o.metin, url: o.url, tag: o.tag };
    try { const d = await pushGonder(env, a, yuk); if (d >= 200 && d < 300) { gonderilen++; ulasilan.add(a.uid); } else if (d === 404 || d === 410) { silinen++; await sil(env, "abonelikler/" + a.id); } } catch (_) {}
  }));
  return { gonderilen, silinen, ulasilan };
}
async function etkinlikAlicilar(env, e) { if (e.kapsam === "okul") return ogrenciler(env, e.okulId, [], true); const ids = []; for (const k of (e.siniflar || []).slice(0, 8)) ids.push(...await sinifOgr(env, e.okulId, String(k))); return ids; }

/* Olay → alıcılar + metin */
async function olay(env, uid, g) {
  const me = await oku(env, "users/" + uid); if (!me) throw new Error("kullanıcı yok");
  const tur = g.tur, ogrt = me.role === "teacher" && me.onayli === true, yonetici = me.admin === true;
  if (tur === "test") return { alicilar: [uid], tur: "test", baslik: "Salvea", metin: "Bildirimler çalışıyor.", url: "#/ayarlar", tag: "test" };
  if (tur === "sohbet") {
    gerekli(g.sohbet, g.mesaj); const c = await oku(env, "sohbetler/" + g.sohbet), m = await oku(env, "sohbetler/" + g.sohbet + "/mesajlar/" + g.mesaj);
    if (!c || !m || !c.uyeler.includes(uid) || m.uid !== uid || m.silindi || !sonDakika(m.ts, 5)) throw new Error("mesaj doğrulanamadı");
    const grup = c.tur !== "dm";
    return { alicilar: c.uyeler.filter(x => x !== uid), tur: "sohbet", baslik: grup ? c.ad : adOf(me), metinOnizleme: (grup ? adOf(me).split(" ")[0] + ": " : "") + (m.metin ? kes(m.metin.replace(/^💡 /, ""), 100) : "Fotoğraf"), metin: "Yeni mesaj", url: "#/sohbet?c=" + g.sohbet, tag: "sohbet-" + g.sohbet };
  }
  if (tur === "program") {
    gerekli(g.id); const p = await oku(env, "programlar/" + g.id); if (!p || p.olusturan !== uid || !ogrt) throw new Error("program doğrulanamadı");
    const a = p.kapsam === "okul" ? await ogrenciler(env, p.okulId, [], true) : p.kapsam === "kisi" ? (p.ogrenciler || []).filter(kimlikOk).slice(0, 300) : String(p.kapsam).startsWith("sinif:") ? await sinifOgr(env, p.okulId, p.kapsam.slice(6)) : [];
    return { alicilar: a.sort(), tur: "program", baslik: "Yeni program", metinOnizleme: kes(p.ad || "Programın güncellendi", 100), metin: "Programında bir güncelleme var.", url: "#/program", tag: "program-" + g.id };
  }
  if (tur === "gorev") {
    gerekli(g.id); const a = await oku(env, "atananGorevler/" + g.id); if (!a || a.olusturan !== uid || !ogrt) throw new Error("görev doğrulanamadı");
    const t = await sorgu(env, "takimlar", [["donemId", "EQUAL", a.donemId], ["aktif", "EQUAL", true]], 100);
    return { alicilar: [...new Set(t.flatMap(x => x.uyeler || []))].sort(), tur: "gorev", baslik: "Yeni görev", metinOnizleme: kes(a.baslik, 100), metin: "Takımına yeni bir görev verildi.", url: "#/gorev", tag: "gorev-" + g.id };
  }
  if (tur === "kanit") {
    gerekli(g.id); const k = await oku(env, "gorevKanitlari/" + g.id); if (!k || !ogrt || me.okulId !== k.okulId || !["onaylandi", "tekrar"].includes(k.durum)) throw new Error("kanıt doğrulanamadı"); const on = k.durum === "onaylandi";
    return { alicilar: k.uyeler || [], tur: "gorev", baslik: on ? "Görevin onaylandı" : "Görev için tekrar istendi", metinOnizleme: on ? "Takımın " + (k.puan || 0) + " puan kazandı." : kes(k.yorum || "Öğretmenin bir not bıraktı.", 100), metin: on ? "Takımın puan kazandı." : "Öğretmenin bir not bıraktı.", url: "#/gorev", tag: "kanit-" + g.id };
  }
  if (tur === "kanitGonder") {
    gerekli(g.id); const k = await oku(env, "gorevKanitlari/" + g.id); if (!k || !(k.uyeler || []).includes(uid) || k.durum !== "bekliyor") throw new Error("kanıt doğrulanamadı");
    return { alicilar: await ogretmenler(env, k.okulId), tur: "gorev", baslik: "Onay bekleyen kanıt", metinOnizleme: kes((k.takimAd || "Bir takım") + " bir görev kanıtı gönderdi.", 100), metin: "Bir takım görev kanıtı gönderdi.", url: "#/gorev", tag: "kanitg-" + g.id };
  }
  if (tur === "randevu") {
    gerekli(g.id); const r = await oku(env, "randevular/" + g.id); if (!r || r.tur !== "randevu") throw new Error("randevu doğrulanamadı");
    if (r.ogrenci === uid && r.durum === "bekliyor") return { alicilar: [r.ogretmen], tur: "randevu", baslik: "Yeni randevu talebi", metinOnizleme: kes(adOf(me) + " randevu istiyor: " + r.tarih + " " + r.saat, 100), metin: "Yeni bir randevu talebin var.", url: "#/randevu", tag: "randevu-" + g.id };
    if (r.ogretmen === uid && ["onaylandi", "reddedildi"].includes(r.durum)) { const on = r.durum === "onaylandi"; return { alicilar: [r.ogrenci], tur: "randevu", baslik: on ? "Randevun onaylandı" : "Randevu talebin yanıtlandı", metinOnizleme: kes(r.tarih + " " + r.saat + (r.yanit ? " · " + r.yanit : ""), 100), metin: on ? "Randevun onaylandı." : "Randevu talebine yanıt geldi.", url: "#/randevu", tag: "randevu-" + g.id }; }
    throw new Error("randevu durumu uygun değil");
  }
  if (tur === "yardim") {
    gerekli(g.id); const y = await oku(env, "yardim/" + g.id); if (!y || y.uid !== uid) throw new Error("istek doğrulanamadı");
    return { alicilar: await ogretmenler(env, y.okulId), tur: "yardim", baslik: "Bir öğrenci seninle konuşmak istiyor", metinOnizleme: "Yardım isteklerini panelden görebilirsin.", metin: "Yardım isteklerini panelden görebilirsin.", url: "#/home", tag: "yardim-" + g.id };
  }
  if (tur === "rapor") {
    gerekli(g.id); const r = await oku(env, "raporlar/" + g.id); if (!r || r.bildiren !== uid || !sonDakika(r.ts, 10)) throw new Error("bildirim doğrulanamadı");
    const c = await oku(env, "sohbetler/" + r.sohbetId); if (!c || !c.uyeler.includes(uid)) throw new Error("sohbet doğrulanamadı");
    const okul = new Set(await ogretmenler(env, r.okulId)); let a = c.uyeler.filter(x => okul.has(x)); if (!a.length) a = [...okul];
    return { alicilar: a, tur: "yardim", baslik: "Bir mesaj bildirildi", metinOnizleme: "Sohbet: " + kes(c.ad || "Birebir sohbet", 60) + ". İncelemek için aç.", metin: "Bir mesaj bildirildi. İncelemek için aç.", url: "#/sinif", tag: "rapor-" + g.id };
  }
  if (tur === "duyuru") {
    gerekli(g.id); const d = await oku(env, "duyurular/" + g.id); if (!d || d.olusturan !== uid || !sonDakika(d.ts, 10)) throw new Error("duyuru doğrulanamadı");
    if (!yonetici && !ogrt) throw new Error("yetkin yok"); const k = d.kapsam; let a = [];
    if (!yonetici && (!me.okulId || d.okulId !== me.okulId || !(k === "okul" || k === "kisi" || String(k).startsWith("sinif:")))) throw new Error("bu hedefe duyuru yollayamazsın");
    if (k === "herkes") { if (!yonetici) throw new Error("yetkin yok"); a = (await sorgu(env, "users", [], 3000, true)).map(u => u.id); }
    else if (k === "ogretmenler") { if (!yonetici) throw new Error("yetkin yok"); a = (await sorgu(env, "users", [["role", "EQUAL", "teacher"], ["onayli", "EQUAL", true]], 1000, true)).map(u => u.id); }
    else if (k === "okulOgretmen") { if (!yonetici) throw new Error("yetkin yok"); gerekli(d.okulId); a = await ogretmenler(env, d.okulId); }
    else if (k === "okul") { gerekli(d.okulId); a = yonetici ? (await sorgu(env, "users", [["okulId", "EQUAL", d.okulId]], 2000, true)).map(u => u.id) : await ogrenciler(env, d.okulId, [], true); }
    else if (String(k).startsWith("sinif:")) { gerekli(d.okulId); a = await sinifOgr(env, d.okulId, k.slice(6)); }
    else if (k === "kisi") { a = (d.alicilar || []).filter(kimlikOk).slice(0, 300); if (!yonetici) { const okul = new Set(await ogrenciler(env, me.okulId, [], true)); a = a.filter(x => okul.has(x)); } }
    else throw new Error("bilinmeyen hedef");
    return { alicilar: a.sort(), tur: "duyuru", baslik: (d.emoji ? d.emoji + " " : "") + kes(d.baslik, 80), metinOnizleme: kes(d.metin, 200), metin: kes(d.metin, 200), herkeseAcik: true, url: d.etkinlikId && kimlikOk(d.etkinlikId) ? "#/etkinlik?id=" + d.etkinlikId : "#/duyuru", tag: "duyuru-" + g.id };
  }
  if (tur === "etkinlik") {
    gerekli(g.id); const e = await oku(env, "etkinlikler/" + g.id); if (!e || e.olusturan !== uid || e.durum !== "canli" || !sonDakika(e.canliTs, 15)) throw new Error("etkinlik doğrulanamadı");
    return { alicilar: (await etkinlikAlicilar(env, e)).sort(), tur: "duyuru", baslik: "Etkinlik başladı: " + kes(e.baslik, 60), metinOnizleme: "Hemen katıl!", metin: "Hemen katıl!", herkeseAcik: true, url: "#/etkinlik?id=" + g.id, tag: "etkinlik-" + g.id };
  }
  throw new Error("bilinmeyen tür");
}
async function kapsama(env, uid, g) {
  const me = await oku(env, "users/" + uid); if (!me) throw new Error("kullanıcı yok"); const yonetici = me.admin === true;
  if (!yonetici && !(me.role === "teacher" && me.onayli === true)) throw new Error("yetkin yok"); if (g.okulId != null) gerekli(g.okulId);
  const okul = yonetici ? g.okulId || null : me.okulId; if (!yonetici && !okul) throw new Error("okulun yok");
  const kisiler = (await sorgu(env, "users", okul ? [["role", "EQUAL", "student"], ["okulId", "EQUAL", okul]] : [["role", "EQUAL", "student"]], 3000, true)).map(u => u.id);
  const abone = new Set((await sorgu(env, "abonelikler", okul ? [["okulId", "EQUAL", okul]] : [], 5000)).map(a => a.uid)), kapali = kisiler.filter(x => !abone.has(x));
  return { toplam: kisiler.length, acik: kisiler.length - kapali.length, kapali: kapali.slice(0, 400) };
}

/* Sınıf sohbeti ve otomatik sorular */
const BOT = { uid: "salvea", ad: "Salvea" }, SIKLIK = { gunluk: 22, haftada3: 44, haftada1: 160 };
const trt = () => { const d = new Date(Date.now() + 3 * 3600e3); return { saat: d.getUTCHours(), gun: d.getUTCDay() }; };
async function sohbetSenkronla(env, s) {
  const ogr = await sorgu(env, "users", [["role", "EQUAL", "student"], ["okulId", "EQUAL", s.okulId], ["sinif", "EQUAL", s.sinif], ["sube", "EQUAL", s.sube], ["sinifOnay", "EQUAL", true]], 200), uyeAd = {}, uyeler = [];
  for (const u of ogr) { uyeler.push(u.id); uyeAd[u.id] = adOf(u); }
  const ogrt = [];
  for (const id of [...new Set([...(s.sinifOgretmenleri || []), ...(s.rehberOgretmenleri || [])].filter(kimlikOk))].slice(0, 8)) { const u = await oku(env, "users/" + id); if (u && u.role === "teacher") { uyeler.push(id); uyeAd[id] = adOf(u); ogrt.push(id); } }
  uyeler.sort(); const chatId = "sinif_" + s.id;
  if (!await oku(env, "sohbetler/" + chatId)) await yaz(env, "sohbetler/" + chatId, { tur: "sinif", okulId: s.okulId, ad: s.sinif + "-" + s.sube + " Sınıfı", sinifId: s.id, uyeler, uyeAd, ogrt, kapali: false, olusturma: new Date(), son: null, sonTs: new Date(), okundu: {}, yaziyor: {}, aktif: {} });
  else await yaz(env, "sohbetler/" + chatId, { uyeler, uyeAd, ogrt }, ["uyeler", "uyeAd", "ogrt"]);
  await yaz(env, "siniflar/" + s.id, { sohbetId: chatId, sohbetGuncelTs: new Date() }, ["sohbetId", "sohbetGuncelTs"]); return { sohbetId: chatId, uye: uyeler.length };
}
function havuzdanSec(s, gun) {
  const kul = new Set(s.kullanilan || []), ozel = ["pazartesi", "cuma"], hepsi = HAVUZ.map((_, i) => i), gunluk = gun === 1 ? "pazartesi" : gun === 5 ? "cuma" : null;
  let aday = hepsi.filter(i => !kul.has(i) && !ozel.includes(HAVUZ[i].k)); if (gunluk && Math.random() < 0.6) { const o = hepsi.filter(i => !kul.has(i) && HAVUZ[i].k === gunluk); if (o.length) aday = o; }
  let sifirla = false; if (!aday.length) { aday = hepsi.filter(i => !ozel.includes(HAVUZ[i].k)); sifirla = true; }
  return { i: aday[Math.floor(Math.random() * aday.length)], sifirla };
}
export function mesajYap(x) {
  const H = ["A", "B", "C", "D"];
  if (x.k === "soru") return { etiket: "Günün sorusu", metin: x.m };
  if (x.k === "bumu") return { etiket: "Bu mu, şu mu?", metin: "A) " + x.a + "\nB) " + x.b + "\nHangisini seçersin? Nedenini de yaz." };
  if (x.k === "etkinlik") return { etiket: "Mini etkinlik", metin: x.m };
  if (x.k === "bilgi") return { etiket: "Biliyor muydun?", metin: x.m + "\nSen daha önce biliyor muydun? Başka ilginç bir bilgi paylaş." };
  if (x.k === "quiz") return { etiket: "Mini quiz", metin: x.m + "\n" + x.o.map((t, i) => H[i] + ") " + t).join("\n") + "\nCevabını yaz. Doğru cevap birkaç saat sonra burada!", cevap: "Doğru cevap: " + H[x.d] + ") " + x.o[x.d] + ". " + x.a };
  return { etiket: x.k === "pazartesi" ? "Hafta başı" : "Hafta sonuna doğru", metin: x.m };
}
async function botMesaj(env, s, etiket, metin) {
  if (!s.sohbetId) throw new Error("sınıf sohbeti yok"); const sohbet = await oku(env, "sohbetler/" + s.sohbetId); if (!sohbet || sohbet.kapali) throw new Error("sohbet yok ya da kapalı");
  const mid = await ekle(env, "sohbetler/" + s.sohbetId + "/mesajlar", { uid: BOT.uid, ad: BOT.ad, bot: true, etiket, metin, foto: null, silindi: false, ts: new Date() });
  await yaz(env, "sohbetler/" + s.sohbetId, { son: { id: mid, uid: BOT.uid, ad: BOT.ad, metin: kes(metin, 80), foto: false }, sonTs: new Date() }, ["son", "sonTs"]);
  await ekle(env, "pushKuyruk", { alicilar: (sohbet.uyeler || []).slice().sort(), parti: 0, tur: "sohbet", baslik: sohbet.ad, metin: "Sınıf sohbetinde yeni bir mesaj var.", metinOnizleme: kes(etiket + ": " + metin.split("\n")[0], 100), url: "#/sohbet?c=" + s.sohbetId, tag: "sohbet-" + s.sohbetId, olusturma: new Date() });
}
async function soruGonder(env, s) {
  const { i, sifirla } = havuzdanSec(s, trt().gun), m = mesajYap(HAVUZ[i]); await botMesaj(env, s, m.etiket, m.metin);
  const a = { sonSoruTs: new Date(), kullanilan: sifirla ? [i] : [...(s.kullanilan || []), i] }, mk = ["sonSoruTs", "kullanilan"]; if (m.cevap) { a.cevapBekleyen = { metin: m.cevap, zaman: Date.now() + 2 * 3600e3 }; mk.push("cevapBekleyen"); }
  await yaz(env, "siniflar/" + s.id, a, mk); return { id: i, etiket: m.etiket };
}
async function kuyrukIsle(env, q, n) {
  let parti = q.parti || 0;
  for (let k = 0; k < n; k++) { const dilim = (q.alicilar || []).slice(parti * DILIM, (parti + 1) * DILIM); if (!dilim.length) { await sil(env, "pushKuyruk/" + q.id); return; } await gonderDilim(env, dilim, q); parti++; }
  if (parti * DILIM >= (q.alicilar || []).length) await sil(env, "pushKuyruk/" + q.id); else await yaz(env, "pushKuyruk/" + q.id, { parti }, ["parti"]);
}
export async function zamanla(env) {
  const { saat, gun } = trt(), kuyruk = await sorgu(env, "pushKuyruk", [], 3);
  if (kuyruk.length) { await kuyrukIsle(env, kuyruk[0], 2); return { is: "kuyruk" }; }   // her çalışmada tek tür iş (alt istek sınırı)
  const siniflar = await sorgu(env, "siniflar", [], 200), simdi = Date.now();
  const cv = siniflar.find(s => s.cevapBekleyen && s.cevapBekleyen.zaman <= simdi && s.sohbetId);
  if (cv) { await botMesaj(env, cv, "Quiz cevabı", cv.cevapBekleyen.metin); await yaz(env, "siniflar/" + cv.id, {}, ["cevapBekleyen"]); return { is: "cevap" }; }
  const yakin = (await sorgu(env, "etkinlikler", [["durum", "EQUAL", "planli"]], 50)).find(e => !e.hatirlatildi && e.baslangic - simdi > 5 * 60e3 && e.baslangic - simdi <= 15 * 60e3);
  if (yakin) { await ekle(env, "pushKuyruk", { alicilar: (await etkinlikAlicilar(env, yakin)).sort(), parti: 0, tur: "duyuru", herkeseAcik: true, baslik: "Etkinlik yakında: " + kes(yakin.baslik, 60), metin: "Birkaç dakika sonra başlıyor. Hazır ol!", url: "#/etkinlik?id=" + yakin.id, tag: "etkinlik-" + yakin.id, olusturma: new Date() }); await yaz(env, "etkinlikler/" + yakin.id, { hatirlatildi: true }, ["hatirlatildi"]); return { is: "hatirlatma" }; }
  const eski = siniflar.find(s => s.sorular !== false && (!s.sohbetGuncelTs || simdi - s.sohbetGuncelTs > 24 * 3600e3));
  if (eski) { await sohbetSenkronla(env, eski); return { is: "senkron", sinif: eski.id }; }
  if (gun >= 1 && gun <= 5 && saat >= 15 && saat < 19) {
    const vakit = s => simdi - (s.sonSoruTs || 0) >= (s.cevapsiz >= 2 ? SIKLIK.haftada1 : SIKLIK[s.siklik] || SIKLIK.haftada3) * 3600e3;
    const aday = siniflar.filter(s => s.sorular !== false && s.sohbetId && vakit(s)).sort((a, b) => (a.sonSoruTs || 0) - (b.sonSoruTs || 0))[0];
    if (aday) {
      let cevapsiz = aday.cevapsiz || 0;   // sessizlik koruması: son bot mesajından beri kimse yazmadıysa sayaç artar
      if (aday.sonSoruTs) { const c = await oku(env, "sohbetler/" + aday.sohbetId); cevapsiz = c && c.son && c.son.uid !== BOT.uid && c.sonTs > aday.sonSoruTs ? 0 : cevapsiz + 1; }
      await yaz(env, "siniflar/" + aday.id, { cevapsiz }, ["cevapsiz"]); aday.cevapsiz = cevapsiz;
      if (cevapsiz < 2 || vakit(aday)) return { is: "soru", sinif: aday.id, ...await soruGonder(env, aday) };
    }
  }
  return { is: "yok" };
}
/* İstek yöneticisi */
const LIMIT = { sohbet: [90, 60e3], duyuru: [250, 60e3], program: [40, 60e3], gorev: [60, 60e3], kanit: [80, 60e3], kanitGonder: [30, 60e3], randevu: [20, 60e3], yardim: [4, 3600e3], rapor: [10, 3600e3], etkinlik: [60, 60e3], kapsama: [20, 60e3], soruGonder: [6, 3600e3], sinifSohbet: [10, 3600e3], test: [10, 60e3] };
const sayac = new Map(), yinelen = new Map();
export const __sifirla = () => { sayac.clear(); yinelen.clear(); };   // yalnızca testler için
function sinir(uid, tur) { const [lim, pen] = LIMIT[tur] || [30, 60e3], n = Date.now(), k = uid + "|" + tur, a = (sayac.get(k) || []).filter(t => n - t < pen); if (a.length >= lim) return false; a.push(n); sayac.set(k, a); return true; }
const cevap = (env, govde, durum = 200) => new Response(JSON.stringify(govde), { status: durum, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": env.IZIN_KOKEN || "*", "Access-Control-Allow-Headers": "Authorization, Content-Type", Vary: "Origin" } });
async function sinifYetkisi(env, uid, g) {
  gerekli(g.sinif); const me = await oku(env, "users/" + uid), s = await oku(env, "siniflar/" + g.sinif); if (!me || !s) throw new Error("sınıf yok");
  if (!(me.admin === true || (me.role === "teacher" && me.onayli === true && me.okulId === s.okulId && [...(s.sinifOgretmenleri || []), ...(s.rehberOgretmenleri || [])].includes(uid)))) throw new Error("yetkin yok"); return s;
}
export default {
  async fetch(istek, env) {
    if (istek.method === "OPTIONS") return cevap(env, {}, 204); if (istek.method !== "POST") return cevap(env, { hata: "yalnızca POST" }, 405);
    let uid; try { uid = await kimlik(env, istek); } catch (_) { return cevap(env, { hata: "kimlik doğrulanamadı" }, 401); }
    try {
      const g = await istek.json(); if (typeof g.tur !== "string") throw new Error("tür yok"); if (!sinir(uid, g.tur)) return cevap(env, { hata: "çok fazla istek" }, 429);
      if (g.tur === "kapsama") return cevap(env, await kapsama(env, uid, g));
      if (g.tur === "sinifSohbet") return cevap(env, await sohbetSenkronla(env, await sinifYetkisi(env, uid, g)));
      if (g.tur === "soruGonder") { const s = await sinifYetkisi(env, uid, g); if (!s.sohbetId) { await sohbetSenkronla(env, s); s.sohbetId = "sinif_" + s.id; } return cevap(env, await soruGonder(env, s)); }
      const parti = Math.max(0, Math.min(500, +g.parti || 0)), yk = uid + "|" + g.tur + "|" + (g.id || g.sohbet || "") + "|" + (g.mesaj || "") + "|" + parti;
      if (g.tur !== "test" && yinelen.has(yk) && Date.now() - yinelen.get(yk) < 600e3) return cevap(env, { gonderilen: 0, silinen: 0, parti, toplamParti: 1, alici: 0, ulasilan: 0, ulasamayan: [], tekrar: true });
      const o = await olay(env, uid, g), tum = [...new Set(o.alicilar)].filter(x => kimlikOk(x) && (x !== uid || o.tur === "test")), alicilar = tum.slice(parti * DILIM, (parti + 1) * DILIM), r = await gonderDilim(env, alicilar, o);
      yinelen.set(yk, Date.now()); if (yinelen.size > 500) for (const [k, t] of yinelen) if (Date.now() - t > 600e3) yinelen.delete(k);
      return cevap(env, { gonderilen: r.gonderilen, silinen: r.silinen, parti, toplamParti: Math.max(1, Math.ceil(tum.length / DILIM)), alici: alicilar.length, ulasilan: r.ulasilan.size, ulasamayan: alicilar.filter(x => !r.ulasilan.has(x)) });
    } catch (e) { return cevap(env, { hata: String(e.message || e).slice(0, 120) }, 400); }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(zamanla(env).catch(() => {})); }
};

// Soru ve etkinlik havuzu. DİKKAT: sıra değişmemeli; yeni öğeleri yalnızca SONA ekle.
const HAVUZ = [{"k": "soru", "m": "Bu hafta seni en çok güldüren şey neydi?"}, {"k": "soru", "m": "Bir gün istediğin her yere gidebilsen nereye giderdin?"}, {"k": "soru", "m": "En sevdiğin yemek ne ve neden?"}, {"k": "soru", "m": "Bir süper gücün olsa ne olmasını isterdin?"}, {"k": "soru", "m": "En son izlediğin ya da okuduğun güzel şey neydi?"}, {"k": "soru", "m": "Hafta sonu en çok ne yapmaktan keyif alırsın?"}, {"k": "soru", "m": "Çocukken en sevdiğin oyun hangisiydi?"}, {"k": "soru", "m": "Bir hayvan olsan hangisi olurdun?"}, {"k": "soru", "m": "Seni rahatlatan bir şarkı var mı?"}, {"k": "soru", "m": "Yeni öğrenmek istediğin bir şey ne?"}, {"k": "soru", "m": "Takımımızın adı için bir fikrin var mı?"}, {"k": "soru", "m": "Bu görevde hangi işi üstlenmek isterdin?"}, {"k": "soru", "m": "Bu hafta kendini en çok neyle gurur duydun?"}, {"k": "soru", "m": "Hiç gitmediğin ama görmek istediğin bir yer var mı?"}, {"k": "soru", "m": "Sınıfta en çok hangi dersi seviyorsun?"}, {"k": "soru", "m": "Bir gün bir şeyi hemen öğrenebilsen ne olurdu?"}, {"k": "soru", "m": "En sevdiğin mevsim hangisi ve neden?"}, {"k": "soru", "m": "Okulda seni mutlu eden küçük bir şey ne?"}, {"k": "soru", "m": "Son zamanlarda güldüğün komik bir an var mı?"}, {"k": "soru", "m": "Takımımıza bir slogan önerir misin?"}, {"k": "soru", "m": "Bir günlüğüne herhangi bir hayvan olabilsen hangisi olurdun, neden?"}, {"k": "soru", "m": "Okulda seni en çok gülümseten şey ne?"}, {"k": "soru", "m": "Çocukluğundan bir oyunu geri getirebilsen hangisi olurdu?"}, {"k": "soru", "m": "Bir süper gücün olsa ve yalnızca okulda kullanabilsen ne olurdu?"}, {"k": "soru", "m": "Sınıfa yeni biri gelse ona hangi üç şeyi söylerdin?"}, {"k": "soru", "m": "Son izlediğin dizi ya da film hangisi? Tavsiye eder misin?"}, {"k": "soru", "m": "Sence iyi bir arkadaş nasıl olur? Üç özellik yaz."}, {"k": "soru", "m": "Okul bahçesine ne eklense harika olurdu?"}, {"k": "soru", "m": "Bir şarkıyı sınıfın marşı yapsan hangisi olurdu?"}, {"k": "soru", "m": "Bu sınıfın en güzel anısı sence ne?"}, {"k": "soru", "m": "Sınıfa bir ödül alınacak olsa ne olmasını isterdin?"}, {"k": "soru", "m": "Bu yıl denemek istediğin yeni bir hobi var mı?"}, {"k": "soru", "m": "Sınıfta herkesin öğrenmesini istediğin bir beceri ne olurdu?"}, {"k": "soru", "m": "10 yıl sonra bu sınıfa mektup yazsan ilk cümlen ne olurdu?"}, {"k": "soru", "m": "Kendi okul kuralını koysan ne olurdu?"}, {"k": "soru", "m": "Sana ilham veren biri var mı? Neden?"}, {"k": "soru", "m": "Sınıfın maskotu bir hayvan olsa hangisi olmalı?"}, {"k": "soru", "m": "Bugün biri için ne yapsan onu mutlu ederdin?"}, {"k": "soru", "m": "Sınıfta herkesin birbirini daha iyi tanıması için ne yapılabilir?"}, {"k": "soru", "m": "Gelecekte hangi mesleği denemek isterdin?"}, {"k": "soru", "m": "Hayalindeki sınıf nasıl görünürdü?"}, {"k": "soru", "m": "En sevdiğin teneffüs etkinliği nedir?"}, {"k": "soru", "m": "Bu hafta seni şaşırtan bir şey oldu mu?"}, {"k": "soru", "m": "Tavsiye etmek istediğin bir kitap ya da film var mı?"}, {"k": "soru", "m": "Bugün seni ne dinlendirir?"}, {"k": "bumu", "a": "Deniz kenarı", "b": "Dağ evi"}, {"k": "bumu", "a": "Kitap", "b": "Film"}, {"k": "bumu", "a": "Sabah insanı", "b": "Gece insanı"}, {"k": "bumu", "a": "Pizza", "b": "Makarna"}, {"k": "bumu", "a": "Yaz", "b": "Kış"}, {"k": "bumu", "a": "Tek başına çalışmak", "b": "Grupla çalışmak"}, {"k": "bumu", "a": "Köpek", "b": "Kedi"}, {"k": "bumu", "a": "Müzik dinlemek", "b": "Müzik yapmak"}, {"k": "bumu", "a": "Uzaya gitmek", "b": "Okyanusun dibine inmek"}, {"k": "bumu", "a": "Geçmişe yolculuk", "b": "Geleceğe yolculuk"}, {"k": "bumu", "a": "Uçabilmek", "b": "Görünmez olmak"}, {"k": "bumu", "a": "Resim yapmak", "b": "Şiir yazmak"}, {"k": "bumu", "a": "Futbol", "b": "Basketbol"}, {"k": "bumu", "a": "Çay", "b": "Sıcak çikolata"}, {"k": "bumu", "a": "Sinema salonu", "b": "Evde film"}, {"k": "bumu", "a": "Satranç", "b": "Kutu oyunu"}, {"k": "bumu", "a": "Yürüyüş", "b": "Bisiklet"}, {"k": "bumu", "a": "Konser", "b": "Tiyatro"}, {"k": "bumu", "a": "Sürpriz parti", "b": "Sakin kutlama"}, {"k": "bumu", "a": "Büyük bir arkadaş grubu", "b": "Birkaç yakın arkadaş"}, {"k": "bumu", "a": "Sabah dersi", "b": "Öğleden sonra dersi"}, {"k": "bumu", "a": "Sınav", "b": "Ödev"}, {"k": "bumu", "a": "Müzikli ders", "b": "Sessiz ders"}, {"k": "bumu", "a": "Açık hava dersi", "b": "Sınıf içi ders"}, {"k": "bumu", "a": "Takım projesi", "b": "Bireysel proje"}, {"k": "bumu", "a": "Sürpriz test", "b": "Sürpriz oyun"}, {"k": "bumu", "a": "Okul gezisi", "b": "Okulda festival"}, {"k": "bumu", "a": "Pazartesi", "b": "Cuma"}, {"k": "etkinlik", "m": "Mini meydan okuma: Teneffüste sınıfta henüz fazla konuşmadığın biriyle iki dakika sohbet et. Yaptıysan buraya 'yaptım' yaz, isim vermen gerekmez."}, {"k": "etkinlik", "m": "Üç şey bul: Sınıftaki herkesin ortak olduğu üç şeyi bulun ve buraya yazın."}, {"k": "etkinlik", "m": "Teşekkür turu: Bugün birine içtenlikle teşekkür et ve buraya 'teşekkür ettim' yaz."}, {"k": "etkinlik", "m": "Tek cümlelik hikâye: Ben başlıyorum, siz devam edin: 'Bir sabah sınıfa girdiğimizde masanın üstünde gizemli bir kutu vardı...'"}, {"k": "etkinlik", "m": "Bugün gördüğün en güzel şeyi yalnızca üç kelimeyle anlat."}, {"k": "etkinlik", "m": "Sınıf marşı: Herkes bir satır yazsın, birlikte komik bir sınıf marşı yazalım."}, {"k": "etkinlik", "m": "İki doğru bir yalan: Kendin hakkında iki doğru bir yalan yaz, arkadaşların yalanı bulsun."}, {"k": "etkinlik", "m": "Kelime zinciri: Önceki kelimenin son harfiyle yeni bir kelime yaz. Ben başlıyorum: 'kitap'."}, {"k": "etkinlik", "m": "Gizli iyilik: Bugün sessizce birine iyilik yap, sonra buraya 'yaptım' yaz."}, {"k": "etkinlik", "m": "Ortak ilgi avı: Yan sıradaki kişiyle ortak bir ilgi alanı bul ve buraya yaz."}, {"k": "etkinlik", "m": "Hobi kulübü: Hobini tek cümleyle yaz, aynı hobiyi yapanları bulalım."}, {"k": "etkinlik", "m": "Ders arkadaşlığı: Hangi derste yardım edebilirsin, hangisinde yardıma ihtiyacın var? Yazın, eşleşin."}, {"k": "etkinlik", "m": "Komik an: Bu hafta güldüğün bir anı paylaş (kimseyi üzmeyen)."}, {"k": "etkinlik", "m": "Sözün gücü: Sınıfa iyi gelecek tek bir cümle yaz."}, {"k": "etkinlik", "m": "Dilek ağacı: Bu dönem için tek bir hedef yaz."}, {"k": "etkinlik", "m": "Çiz ve tahmin ettir: Kâğıda basit bir şey çiz, fotoğrafını çek ve paylaş. Arkadaşların tahmin etsin."}, {"k": "etkinlik", "m": "Şarkı önerisi: Bugünkü ruh halini anlatan bir şarkı öner."}, {"k": "etkinlik", "m": "Merak kutusu: Sınıfta merak ettiğin bir şeyi nazikçe sor."}, {"k": "etkinlik", "m": "Tebrik zamanı: Bu hafta güzel bir şey yapan birini gördün mü? Onu burada tebrik et."}, {"k": "etkinlik", "m": "Haftanın kelimesi: Bu hafta kelimemiz 'merak'. Herkes bu kelimeyle bir cümle kursun."}, {"k": "bilgi", "m": "Deniz su samurları uyurken akıntıyla birbirinden ayrılmamak için el ele tutuşur."}, {"k": "bilgi", "m": "Venüs'te bir gün, bir yıldan uzundur: kendi etrafında dönmesi Güneş çevresindeki turundan uzun sürer."}, {"k": "bilgi", "m": "Ahtapotun kanı mavidir ve üç kalbi vardır."}, {"k": "bilgi", "m": "Satrançta ilk hamle için tam 20 farklı seçenek vardır."}, {"k": "bilgi", "m": "Güneş'in ışığı Dünya'ya yaklaşık 8 dakikada ulaşır. Yani Güneş'i geçmişte bir anıyla görürüz."}, {"k": "bilgi", "m": "Zürafanın boynu upuzundur ama boyun omurları insanınki gibi yedi tanedir."}, {"k": "bilgi", "m": "Kutup sumrusu her yıl kutuptan kutba göç eder. Gidiş dönüş yolculuğu on binlerce kilometreyi bulur."}, {"k": "bilgi", "m": "Karıncalar yiyecek bulunca yolda bıraktıkları kokuyla arkadaşlarına yol gösterir."}, {"k": "bilgi", "m": "Dünya yüzeyinin yaklaşık yüzde 71'i sularla kaplıdır."}, {"k": "bilgi", "m": "Muz botanikte “dut” sınıfındadır; çilek ise botanik olarak dut sayılmaz."}, {"k": "bilgi", "m": "Fil sürüleri tehlike anında yavruları ortaya alıp çevresini sarar."}, {"k": "bilgi", "m": "Türkçe sondan eklemeli bir dildir: tek bir kelimeye eklenen eklerle koca bir cümle kurulabilir."}, {"k": "bilgi", "m": "Bir bal arısı ömrü boyunca bir çay kaşığının yalnızca on ikide biri kadar bal üretir."}, {"k": "bilgi", "m": "Beynin gün boyunca yaklaşık 20 watt'lık bir ampulün harcadığı kadar enerji kullanır."}, {"k": "bilgi", "m": "Işık Ay'dan Dünya'ya yaklaşık 1,3 saniyede ulaşır."}, {"k": "bilgi", "m": "Bal arıları, çiçeklerin yerini birbirine “dans ederek” anlatır."}, {"k": "bilgi", "m": "Kelebekler tadı ayaklarıyla alır."}, {"k": "bilgi", "m": "Kar tanelerinin çoğu altı köşeli kristal yapıdadır."}, {"k": "bilgi", "m": "Dünyanın en küçük kuşlarından arı kuşu yalnızca iki gram kadardır."}, {"k": "bilgi", "m": "Kalbin bir günde yaklaşık 100.000 kez atar."}, {"k": "bilgi", "m": "İnsan gözünün yaklaşık on milyon rengi ayırt edebildiği tahmin ediliyor."}, {"k": "bilgi", "m": "Mısır piramitleri yapıldığında, Wrangel Adası'ndaki son mamut topluluğu hâlâ yaşıyordu."}, {"k": "bilgi", "m": "Kediler günün yaklaşık üçte ikisini uyuyarak geçirir."}, {"k": "bilgi", "m": "Yunuslar uyurken beyinlerinin yarısı uyanık kalır; böylece nefes almayı sürdürürler."}, {"k": "bilgi", "m": "Antarktika'daki buzullar, dünyadaki tatlı suyun yaklaşık yüzde 70'ini tutar."}, {"k": "bilgi", "m": "Bazı bambu türleri bir günde yarım metreden fazla uzayabilir."}, {"k": "bilgi", "m": "Normal bir kâğıdı en fazla yedi sekiz kez ikiye katlayabilirsin."}, {"k": "bilgi", "m": "Venüs, Güneş'e daha uzak olmasına rağmen Merkür'den bile sıcaktır."}, {"k": "bilgi", "m": "Satürn'ün yoğunluğu sudan azdır. Yeterince büyük bir havuz olsaydı yüzerdi."}, {"k": "bilgi", "m": "Mars'ın kırmızı rengi, yüzeyindeki demir oksitten gelir."}, {"k": "bilgi", "m": "Yıldırım bir an için Güneş'in yüzeyinden birkaç kat daha sıcak bir hava kanalı oluşturur."}, {"k": "bilgi", "m": "Türkiye iki kıtada toprağı olan ülkelerden biridir: Anadolu Asya'da, Trakya Avrupa'dadır."}, {"k": "bilgi", "m": "Göbeklitepe, Efes ve Ani gibi birçok yer Türkiye'den UNESCO Dünya Mirası Listesi'ne girmiştir."}, {"k": "bilgi", "m": "Kâğıdı ilk icat edenler Çinlilerdir."}, {"k": "quiz", "m": "Güneş Sistemi'nin en küçük gezegeni hangisidir?", "o": ["Mars", "Merkür", "Venüs"], "d": 1, "a": "Merkür, Güneş'e en yakın ve en küçük gezegendir."}, {"k": "quiz", "m": "Hangisi bir memeli değildir?", "o": ["Yarasa", "Yunus", "Penguen"], "d": 2, "a": "Penguen bir kuştur; yunus ve yarasa memelidir."}, {"k": "quiz", "m": "Türkiye'nin en kalabalık şehri hangisidir?", "o": ["Ankara", "İstanbul", "İzmir"], "d": 1, "a": "İstanbul'un nüfusu 15 milyonu aşıyor."}, {"k": "quiz", "m": "Mimar Sinan hangi dönemde yaşadı?", "o": ["Selçuklu", "Osmanlı", "Cumhuriyet"], "d": 1, "a": "Mimar Sinan, 16. yüzyılda Osmanlı'da yaşadı."}, {"k": "quiz", "m": "Işık mı ses mi daha hızlıdır?", "o": ["Işık", "Ses", "İkisi aynı"], "d": 0, "a": "Işık saniyede yaklaşık 300.000 km gider; ses çok daha yavaştır. Bu yüzden önce şimşeği, sonra gök gürültüsünü duyarız."}, {"k": "quiz", "m": "Bir üçgenin iç açıları toplamı kaçtır?", "o": ["90°", "180°", "360°"], "d": 1, "a": "Her üçgenin iç açıları toplamı 180°'dir."}, {"k": "quiz", "m": "Halkalarıyla ünlü gezegen hangisidir?", "o": ["Satürn", "Mars", "Merkür"], "d": 0, "a": "Satürn'ün halkaları buz ve kaya parçalarından oluşur."}, {"k": "quiz", "m": "Su deniz seviyesinde kaç derecede donar?", "o": ["10°C", "0°C", "-10°C"], "d": 1, "a": "Saf su 0°C'de donar."}, {"k": "quiz", "m": "Piri Reis ne ile ünlüdür?", "o": ["Haritalarıyla", "Mimarisiyle", "Müziğiyle"], "d": 0, "a": "Piri Reis, 1513'te çizdiği dünya haritasıyla tanınır."}, {"k": "quiz", "m": "Bitkiler fotosentezde hangi gazı kullanır?", "o": ["Oksijen", "Karbondioksit", "Azot"], "d": 1, "a": "Karbondioksit alır, oksijen verirler."}, {"k": "quiz", "m": "Dünyanın en büyük hayvanı hangisidir?", "o": ["Afrika fili", "Mavi balina", "Zürafa"], "d": 1, "a": "Mavi balina, yaşamış en büyük hayvanlardan biridir."}, {"k": "quiz", "m": "Bir yılda kaç ay en az 28 gün çeker?", "o": ["Sadece şubat", "Hepsi", "Hiçbiri"], "d": 1, "a": "Her ay en az 28 gün çeker. Şubat sadece en kısa olanıdır."}, {"k": "quiz", "m": "Gökkuşağında geleneksel olarak kaç renk sayılır?", "o": ["5", "7", "9"], "d": 1, "a": "Kırmızı, turuncu, sarı, yeşil, mavi, lacivert, mor."}, {"k": "quiz", "m": "Hangisi yenilenebilir bir enerji kaynağıdır?", "o": ["Kömür", "Rüzgâr", "Doğalgaz"], "d": 1, "a": "Rüzgâr, güneş ve su yenilenebilir kaynaklardır."}, {"k": "quiz", "m": "Hangisi Türkiye'nin komşusu değildir?", "o": ["Gürcistan", "Suriye", "Mısır"], "d": 2, "a": "Mısır'ın Türkiye ile kara sınırı yoktur."}, {"k": "quiz", "m": "Mevsimler neden oluşur?", "o": ["Dünya'nın eğik ekseni yüzünden", "Güneş'e olan uzaklık yüzünden", "Ay yüzünden"], "d": 0, "a": "Dünya'nın ekseni eğik olduğu için Güneş ışınları yıl boyunca farklı açıyla gelir."}, {"k": "quiz", "m": "Ses hangi ortamda yayılamaz?", "o": ["Su", "Hava", "Boşluk"], "d": 2, "a": "Ses yayılmak için bir maddeye ihtiyaç duyar; boşlukta yayılamaz."}, {"k": "quiz", "m": "Türkiye Cumhuriyeti'nin ilk cumhurbaşkanı kimdir?", "o": ["Mustafa Kemal Atatürk", "İsmet İnönü", "Celal Bayar"], "d": 0, "a": "Atatürk, 29 Ekim 1923'te cumhurbaşkanı seçildi."}, {"k": "quiz", "m": "DNA'nın şekli neye benzer?", "o": ["Çift sarmal", "Tek çubuk", "Küp"], "d": 0, "a": "DNA, birbirine sarılı iki zincirden oluşan çift sarmal yapıdadır."}, {"k": "quiz", "m": "Hangi kıtada en çok insan yaşar?", "o": ["Avrupa", "Asya", "Afrika"], "d": 1, "a": "Dünya nüfusunun yarısından fazlası Asya'da yaşar."}, {"k": "quiz", "m": "Hangisi bir element değildir?", "o": ["Oksijen", "Su", "Demir"], "d": 1, "a": "Su, hidrojen ve oksijenden oluşan bir bileşiktir."}, {"k": "quiz", "m": "Bilgisayarın “beyni” sayılan parça hangisidir?", "o": ["Fare", "İşlemci", "Ekran"], "d": 1, "a": "İşlemci (CPU) komutları çalıştırır."}, {"k": "quiz", "m": "Ses şiddeti hangi birimle ölçülür?", "o": ["Desibel", "Kilogram", "Litre"], "d": 0, "a": "Desibel (dB) sesin şiddetini ölçer."}, {"k": "quiz", "m": "Hangisi yumurtlayan bir memelidir?", "o": ["Kanguru", "Ornitorenk", "Yarasa"], "d": 1, "a": "Ornitorenk ve dikenli karıncayiyen yumurtlayan memelilerdir."}, {"k": "quiz", "m": "Antik Troya hangi ülkenin topraklarındadır?", "o": ["Yunanistan", "Türkiye", "İtalya"], "d": 1, "a": "Troya, Çanakkale yakınlarındadır."}, {"k": "quiz", "m": "Mevlânâ hangi şehirle anılır?", "o": ["Bursa", "Konya", "Edirne"], "d": 1, "a": "Mevlânâ'nın türbesi Konya'dadır."}, {"k": "quiz", "m": "Pi sayısı yaklaşık kaçtır?", "o": ["2,71", "3,14", "1,62"], "d": 1, "a": "Bir çemberin çevresinin çapına oranı yaklaşık 3,14'tür."}, {"k": "quiz", "m": "Hangi gezegende bir gün bir yıldan uzundur?", "o": ["Venüs", "Mars", "Jüpiter"], "d": 0, "a": "Venüs kendi etrafında çok yavaş döner."}, {"k": "quiz", "m": "Kelebekler hangi evrelerden geçer?", "o": ["Yumurta, tırtıl, pupa, kelebek", "Yumurta, kelebek", "Tırtıl, yumurta, kelebek"], "d": 0, "a": "Bu dönüşüme tam başkalaşım denir."}, {"k": "pazartesi", "m": "Yeni haftaya başlarken: Bu hafta seni en çok heyecanlandıran şey ne?"}, {"k": "pazartesi", "m": "Pazartesi enerjisi: Bu haftayı güzel geçirmek için tek bir hedefin ne?"}, {"k": "pazartesi", "m": "Bu hafta bir arkadaşına yapabileceğin küçük bir iyilik ne olabilir?"}, {"k": "pazartesi", "m": "Haftaya başlarken bir şarkı öner!"}, {"k": "cuma", "m": "Haftanın en güzel anı neydi?"}, {"k": "cuma", "m": "Bu hafta kime teşekkür etmek istersin? İsim vermek zorunda değilsin."}, {"k": "cuma", "m": "Bu hafta gurur duyduğun bir şey var mı?"}, {"k": "cuma", "m": "Cuma keyfi: Haftayı tek kelimeyle özetle."}];
