// Okul adı eşleştirme: yazım farkı, Türkçe karakter, kısaltma ve karışık yazımları aynı okula bağlar.
const MAP = { "ı": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c", "â": "a", "î": "i", "û": "u" };
export const normalize = s => (s || "").toLocaleLowerCase("tr").replace(/[ışğüöçâîû]/g, c => MAP[c]).replace(/\./g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const TYPE = { lisesi: "lise", lise: "lise", ortaokulu: "ortaokul", ortaokul: "ortaokul", ilkokulu: "ilkokul", ilkokul: "ilkokul", okulu: "okul", okul: "okul", koleji: "kolej", kolej: "kolej" };
const TYPES = new Set(Object.values(TYPE));
const tokens = s => normalize(s).split(" ").filter(t => t && t !== "ve").map(t => TYPE[t] || t);
const w = t => TYPES.has(t) ? 0.5 : 1;   // "lise/ortaokul" kelimesi yazılmasa da olur, yarım ağırlık
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function sim(a, b) {
  if (a === b) return 1;
  if (a.length >= 3 && b.startsWith(a)) return 0.9;       // "sos" -> "sosyal"
  const r = 1 - lev(a, b) / Math.max(a.length, b.length);  // yazım hatası toleransı
  return r >= 0.8 ? r : 0;
}
function coverage(I, T) {
  const total = T.reduce((a, t) => a + w(t), 0);
  let j = 0, cov = 0, used = 0;
  for (const x of I) {
    let ok = false;
    for (let k = j; k < T.length; k++) if (sim(x, T[k]) >= 0.8) { cov += w(T[k]); j = k + 1; ok = true; break; }
    if (!ok && x.length >= 2 && x.length <= T.length)       // "sbl" -> Sosyal Bilimler Lisesi
      for (let k = j; k + x.length <= T.length; k++)
        if (T.slice(k, k + x.length).map(t => t[0]).join("") === x) { cov += T.slice(k, k + x.length).reduce((a, t) => a + w(t), 0); j = k + x.length; ok = true; break; }
    if (ok) used++;
  }
  return (cov / total) * (used / I.length);
}
export function score(input, okul) {
  const n = normalize(input); if (!n) return 0;
  const compact = n.replace(/ /g, ""), I = tokens(input); let best = 0;
  for (const nm of [okul.ad, okul.kisaltma, ...(okul.alias || [])].filter(Boolean)) {
    const T = tokens(nm); if (!T.length) continue;
    if (normalize(nm).replace(/ /g, "") === compact) return 1;
    best = Math.max(best, coverage(I, T));
  }
  return best;
}
export const bestMatches = (input, okullar) => okullar.map(o => ({ okul: o, score: score(input, o) })).sort((a, b) => b.score - a.score);
export function autoPick(input, okullar) {
  const m = bestMatches(input, okullar);
  if (!m.length || m[0].score < 0.85) return null;
  if (m[1] && m[1].score > m[0].score - 0.15) return null;   // iki okul birbirine yakınsa otomatik seçme
  return m[0].okul;
}