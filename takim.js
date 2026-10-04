import { ISIMLER } from "./veri.js";
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pairKey = (a, b) => a < b ? a + "|" + b : b + "|" + a;
export function historyOf(teamLists) {
  const h = {};
  for (const t of teamLists) for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const k = pairKey(t[i], t[j]); h[k] = (h[k] || 0) + 1; }
  return h;
}
const shared = (a, b) => { const s = new Set(a || []); return (b || []).filter(x => s.has(x)).length; };
export const takimAdlari = (n, kullanilan = []) => {
  const free = shuffle(ISIMLER.filter(x => !kullanilan.includes(x))), out = [];
  for (let i = 0; i < n; i++) out.push(free[i] || "Takım " + (i + 1));
  return out;
};

function formGroup(list, o) {
  const fix = (a, b) => (o.history[pairKey(a.uid, b.uid)] || 0) * 3 - (o.useInterest ? shared(o.interests[a.uid], o.interests[b.uid]) : 0);
  const cost = (t, k) => t.reduce((s, m) => s + fix(m, k) + Math.random() * 0.6, 0);
  const take = (t, pool) => { const b = pool.map(k => [cost(t, k), k]).sort((x, y) => x[0] - y[0])[0][1]; pool.splice(pool.indexOf(b), 1); t.push(b); };
  const D = shuffle(list.filter(s => o.labels[s.uid] === "destek"));
  const K = shuffle(list.filter(s => o.labels[s.uid] === "kopru"));
  const N = shuffle(list.filter(s => !o.labels[s.uid]));
  const teams = D.map(d => [d]);
  for (let r = 1; r < o.size; r++) for (const t of teams) if (t.length < o.size && K.length) take(t, K);   // köprüler destek takımlarına eşit dağılır
  for (const t of teams) while (t.length < o.size && N.length) take(t, N);
  const pool = shuffle([...K, ...N]);
  while (pool.length >= o.size) { const t = [pool.shift()]; while (t.length < o.size) take(t, pool); teams.push(t); }
  if (pool.length) {
    if (pool.length >= 2 || !teams.length) teams.push([...pool]);
    else (teams.filter(t => !t.some(m => o.labels[m.uid] === "destek"))[0] || teams[teams.length - 1]).push(pool[0]);
  }
  return teams;
}

export function generate(o) {
  const score = ts => ts.reduce((s, t) => { for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) s += (o.history[pairKey(t[i].uid, t[j].uid)] || 0) * 3 - (o.useInterest ? shared(o.interests[t[i].uid], o.interests[t[j].uid]) : 0); return s; }, 0);
  let best = null;
  for (let it = 0; it < 150; it++) {
    const groups = o.byClass ? Object.values(o.students.reduce((g, s) => ((g[s.sinif] = g[s.sinif] || []).push(s), g), {})) : [o.students];
    const teams = groups.flatMap(g => g.length ? formGroup(g, o) : []);
    const sc = score(teams);
    if (!best || sc < best.sc) best = { sc, teams };
  }
  return best.teams.map(t => t.map(s => s.uid));
}