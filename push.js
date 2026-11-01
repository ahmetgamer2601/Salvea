// Telefon bildirimleri (Web Push). Bildirimi bu dosya değil, Cloudflare'deki küçük sunucu gönderir (worker/).
import { auth, db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { PUSH } from "./config.js";

export const hazir = () => !!(PUSH.sunucu && PUSH.vapid);
export const destek = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const iosKurulmamis = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator.standalone || matchMedia("(display-mode: standalone)").matches);
const u8 = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const r = atob(s), u = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) u[i] = r.charCodeAt(i); return u; };
const kisa = async s => { const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))); return btoa(String.fromCharCode(...h.slice(0, 12))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
export const VARSAYILAN_TUR = { sohbet: true, program: true, gorev: true, randevu: true, yardim: true };

async function mevcut() {
  if (!destek()) return null;
  const reg = await navigator.serviceWorker.ready, s = await reg.pushManager.getSubscription(); if (!s) return null;
  return { reg, s, id: null };
}
// Bu cihazın durumu: { abone, doc } — doc: abonelikler/{id}
export async function durum(me) {
  const o = { hazir: hazir(), destek: destek(), ios: iosKurulmamis(), izin: destek() ? Notification.permission : "denied", abone: false, ayar: null };
  if (!o.hazir || !o.destek) return o;
  try {
    const m = await mevcut(); if (!m) return o;
    const id = me.uid + "_" + await kisa(m.s.endpoint), d = await getDoc(doc(db, "abonelikler", id));
    if (d.exists()) { o.abone = true; o.ayar = d.data(); o.id = id; }
  } catch (_) {}
  return o;
}
export async function ac(me, tercih = {}) {
  if (!hazir()) throw new Error("Bildirim sunucusu kurulmamış.");
  if (!destek()) throw new Error("Bu tarayıcı bildirimleri desteklemiyor.");
  const izin = await Notification.requestPermission();   // kullanıcı dokunuşuyla çağrılmalı (iPhone zorunlu kılar)
  if (izin !== "granted") throw new Error("Bildirim izni verilmedi.");
  const reg = await navigator.serviceWorker.ready;
  const s = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(PUSH.vapid) });
  const j = s.toJSON(), id = me.uid + "_" + await kisa(j.endpoint);
  await setDoc(doc(db, "abonelikler", id), { uid: me.uid, okulId: me.okulId || null, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, onizleme: tercih.onizleme === true, turler: { ...VARSAYILAN_TUR, ...(tercih.turler || {}) }, ua: navigator.userAgent.slice(0, 150), ts: serverTimestamp() });
  return id;
}
export async function kapat(me) {
  const m = await mevcut(); if (!m) return;
  const id = me.uid + "_" + await kisa(m.s.endpoint);
  try { await deleteDoc(doc(db, "abonelikler", id)); } catch (_) {}
  await m.s.unsubscribe();
}
export async function guncelle(id, yama) { await updateDoc(doc(db, "abonelikler", id), yama); }

// Sunucuya "şu olay oldu" der; alıcıları ve metni sunucu kendisi belirler. Hata olursa kullanıcıyı rahatsız etmez.
export async function bildir(tur, veri = {}) {
  if (!hazir()) return null;
  try {
    const t = await auth.currentUser.getIdToken();
    const r = await fetch(PUSH.sunucu, { method: "POST", headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify({ tur, ...veri }), keepalive: true });
    return await r.json();
  } catch (_) { return null; }
}
