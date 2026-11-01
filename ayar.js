// Kişisel ayarlar: sohbet görünümü ve okundu bilgisi. Hesapta (ayarlar/{uid}) ve bu cihazda saklanır.
import { db } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export const TEMALAR = [
  { id: "krem", ad: "Krem", bg: "#ebe6d6", dot: "rgba(29,58,47,.07)", them: "#ffffff", themFg: "#18261f", sep: "rgba(255,255,255,.78)", sepFg: "#5b6b61", meta: "#6d7a72" },
  { id: "nane", ad: "Nane", bg: "#dde8de", dot: "rgba(29,58,47,.07)", them: "#ffffff", themFg: "#18261f", sep: "rgba(255,255,255,.78)", sepFg: "#4d6355", meta: "#66776b" },
  { id: "gok", ad: "Gök", bg: "#dbe6ee", dot: "rgba(40,70,100,.07)", them: "#ffffff", themFg: "#18261f", sep: "rgba(255,255,255,.78)", sepFg: "#4f6275", meta: "#697b8a" },
  { id: "gul", ad: "Gül", bg: "#efdfe2", dot: "rgba(120,50,70,.06)", them: "#ffffff", themFg: "#18261f", sep: "rgba(255,255,255,.78)", sepFg: "#7a5560", meta: "#8a6e76" },
  { id: "lavanta", ad: "Lavanta", bg: "#e3deee", dot: "rgba(70,50,120,.06)", them: "#ffffff", themFg: "#18261f", sep: "rgba(255,255,255,.78)", sepFg: "#5f5878", meta: "#766f8c" },
  { id: "gece", ad: "Gece", bg: "#1f2b27", dot: "rgba(255,255,255,.05)", them: "#2f3f39", themFg: "#eef2ee", sep: "rgba(255,255,255,.12)", sepFg: "#b9c8bb", meta: "#9fb0a5" }
];
export const BALONLAR = [
  { id: "yesil", ad: "Yeşil", bg: "#d7e9d3" }, { id: "mavi", ad: "Mavi", bg: "#d3e4f3" }, { id: "pembe", ad: "Pembe", bg: "#f3d9e2" },
  { id: "sari", ad: "Sarı", bg: "#f5e8bf" }, { id: "mor", ad: "Mor", bg: "#e1daf1" }, { id: "orman", ad: "Orman", bg: "#2c5545" }, { id: "okyanus", ad: "Okyanus", bg: "#3f6a86" }
];
export const VARSAYILAN = { sohbetTema: "krem", balonRenk: "yesil", okunduGizle: false };
const parlak = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const yaziRengi = bg => parlak(bg) > .4 ? "#18261f" : "#ffffff";

let onbellek = null, kim = null;
export const ayar = () => onbellek || VARSAYILAN;
export async function ayarYukle(uid) {
  if (onbellek && kim === uid) return onbellek;
  kim = uid; let a = {};
  try { a = JSON.parse(localStorage.getItem("salvea_ayar_" + uid) || "{}"); } catch (_) {}
  onbellek = { ...VARSAYILAN, ...a };
  try { const s = await getDoc(doc(db, "ayarlar", uid)); if (s.exists()) { const d = s.data(); onbellek = { ...VARSAYILAN, sohbetTema: d.sohbetTema, balonRenk: d.balonRenk, okunduGizle: d.okunduGizle === true }; localStorage.setItem("salvea_ayar_" + uid, JSON.stringify(onbellek)); } } catch (_) {}
  return onbellek;
}
export async function ayarKaydet(uid, yama) {
  onbellek = { ...ayar(), ...yama };
  try { localStorage.setItem("salvea_ayar_" + uid, JSON.stringify(onbellek)); } catch (_) {}
  await setDoc(doc(db, "ayarlar", uid), { sohbetTema: onbellek.sohbetTema, balonRenk: onbellek.balonRenk, okunduGizle: onbellek.okunduGizle === true, guncelleme: serverTimestamp() });
}
// Seçili temayı bir kapsayıcıya CSS değişkeni olarak uygular
export function temaUygula(kok, a = ayar()) {
  const t = TEMALAR.find(x => x.id === a.sohbetTema) || TEMALAR[0], b = BALONLAR.find(x => x.id === a.balonRenk) || BALONLAR[0], s = kok.style;
  kok.dataset.tema = t.id; s.setProperty("--cbg", t.bg); s.setProperty("--cdot", t.dot); s.setProperty("--them", t.them); s.setProperty("--them-fg", t.themFg);
  s.setProperty("--sep", t.sep); s.setProperty("--sep-fg", t.sepFg); s.setProperty("--meta", t.meta);
  s.setProperty("--me", b.bg); s.setProperty("--me-fg", yaziRengi(b.bg)); s.setProperty("--me-meta", yaziRengi(b.bg) === "#ffffff" ? "rgba(255,255,255,.75)" : "#5b6b61");
}
// Okundu bilgisi kapalıyken "okudum" işaretini yalnızca bu cihazda tutarız (rozetler doğru kalsın diye)
export const yerelOkundu = (uid, sohbet) => +(localStorage.getItem("salvea_ok_" + uid + "_" + sohbet) || 0);
export function yerelOkunduYaz(uid, sohbet, ms) {
  if (ms <= yerelOkundu(uid, sohbet)) return;
  try { localStorage.setItem("salvea_ok_" + uid + "_" + sohbet, String(ms)); } catch (_) {}
  window.dispatchEvent(new Event("salvea-okundu"));
}
