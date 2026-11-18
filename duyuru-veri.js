// Duyuruların ortak veri yardımcıları
import { db } from "./firebase.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
export const STILLER = {
  duyuru: { ad: "Duyuru", renk: ["#2c5545", "#1d3a2f"], ikon: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>' },
  hatirlatma: { ad: "Hatırlatma", renk: ["#3f6a86", "#2d4f66"], ikon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  kutlama: { ad: "Kutlama", renk: ["#a85a26", "#8a3f3f"], ikon: '<path d="M12 2l2.4 5 5.6.8-4 3.9.9 5.6L12 14.7 7.1 17.3 8 11.7 4 7.8 9.6 7z"/>' },
  onemli: { ad: "Önemli", renk: ["#9b3b30", "#6e2820"], ikon: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>' },
  etkinlik: { ad: "Etkinlik", renk: ["#5a3f7a", "#40295c"], ikon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' }
};
export const EMOJILER = ["📢", "🎉", "⭐", "📅", "🏆", "💡", "❤️", "🎬", "📚", "⚽", "🎨", "🌟"];
const ms = t => (t && t.toMillis ? t.toMillis() : +t || 0), GORULDU = uid => "salvea_duyuru_goruldu_" + uid;
// Bana ulaşan ve benim gönderdiğim duyurular, yeniden eskiye
export async function gelenDuyurular(me) {
  const k = collection(db, "duyurular"), q = [query(k, where("kapsam", "==", "herkes")), query(k, where("alicilar", "array-contains", me.uid)), query(k, where("olusturan", "==", me.uid))];
  if (me.okulId) {
    q.push(query(k, where("okulId", "==", me.okulId), where("kapsam", "==", "okul")));
    if (me.role === "student" && me.sinif && me.sube) q.push(query(k, where("okulId", "==", me.okulId), where("kapsam", "==", "sinif:" + me.sinif + "-" + me.sube)));
    if (me.role === "teacher") q.push(query(k, where("okulId", "==", me.okulId), where("kapsam", "==", "okulOgretmen")));
  }
  if (me.role === "teacher") q.push(query(k, where("kapsam", "==", "ogretmenler")));
  const h = new Map(); (await Promise.all(q.map(x => getDocs(x).then(s => s.docs).catch(() => [])))).flat().forEach(d => h.set(d.id, { id: d.id, ...d.data(), ms: ms(d.data().ts) }));
  return [...h.values()].sort((a, b) => b.ms - a.ms);
}
export const okunmamis = (me, liste) => { let son = 0; try { son = +localStorage.getItem(GORULDU(me.uid)) || 0; } catch (_) {} return liste.filter(d => d.olusturan !== me.uid && d.ms > son).length; };
export function goruldu(me) { try { localStorage.setItem(GORULDU(me.uid), String(Date.now())); } catch (_) {} window.dispatchEvent(new Event("salvea-duyuru")); }
export const tarihYaz = v => { const d = new Date(v), s = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); return d.toDateString() === new Date().toDateString() ? "Bugün " + s : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) + " " + s; };

