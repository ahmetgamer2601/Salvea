// Sınıf hayvanı çizimleri: emoji değil, el yapımı vektör (SVG). 6 hayvan x 5 evre (yumurta, yavru, çocuk, genç, yetişkin).
// Animasyonlar pet.css içindeki sınıflarla gelir (nefes, göz kırpma, kuyruk, kulak, kanat). Dış bağımlılık yok.

const A = { // renk paletleri
  civciv: { ana: "#f7cf4a", acik: "#fff0a8", koyu: "#e2a92b", gaga: "#f08a2c", yanak: "#f6a3a0" },
  samur: { ana: "#8a5a3b", acik: "#d9b48a", koyu: "#5f3b24", burun: "#2b1b14", yanak: "#eba58f" },
  penguen: { ana: "#344256", acik: "#f6f8fa", koyu: "#222c3a", gaga: "#f4a63c", yanak: "#f4a6a6" },
  timsah: { ana: "#74b95b", acik: "#c9e8a0", koyu: "#4e8f3c", yanak: "#f4a98a" },
  tavsan: { ana: "#f4efee", acik: "#ffffff", koyu: "#dcd3d3", ic: "#f6b7c6", burun: "#ef8fa5", yanak: "#f6b0b8" },
  kedi: { ana: "#e6a35d", acik: "#fbe3bd", koyu: "#b9772f", ic: "#f2b2a8", burun: "#e98d96", yanak: "#f5a89a" },
};
// s: boy, hm: kafa, bm: gövde, d: detay (0 yavru .. 3 yetişkin)
const S = [null, { s: 0.62, hm: 1.16, bm: 0.8, d: 0 }, { s: 0.78, hm: 1.07, bm: 0.92, d: 1 }, { s: 0.9, hm: 1.0, bm: 1.0, d: 2 }, { s: 1, hm: 0.96, bm: 1.08, d: 3 }];

let ANC = null;   // son çizilen hayvanın baş/boyun/göz konumları (kıyafetler buna göre yerleşir)
const dk = (n) => Math.round(n * 10) / 10;
const goz = (x, y, r, kapali, ruh) => {
  if (kapali) return `<path d="M${dk(x - r)} ${y} Q${x} ${dk(y + r * 0.95)} ${dk(x + r)} ${y}" stroke="#2a2420" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return `<g class="pt-goz"><circle cx="${x}" cy="${y}" r="${r}" fill="#26211e"/><circle cx="${dk(x + r * 0.34)}" cy="${dk(y - r * 0.36)}" r="${dk(r * 0.4)}" fill="#fff"/><circle cx="${dk(x - r * 0.4)}" cy="${dk(y + r * 0.42)}" r="${dk(r * 0.18)}" fill="#fff" opacity=".85"/></g>`;
};
const kas = (x, y, yon, ruh) => (ruh === "ac" || ruh === "cokac") ? `<path d="M${x - 7 * yon} ${y - 10} L${x + 6 * yon} ${y - 14 - (ruh === "cokac" ? 2 : 0)}" stroke="#3a2f29" stroke-width="2.6" stroke-linecap="round" fill="none"/>` : "";
const agiz = (x, y, ruh, w = 9) => ruh === "cokac" || ruh === "ac" ? `<path d="M${x - w} ${y + 3} Q${x} ${y - 4} ${x + w} ${y + 3}" stroke="#4a342c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
  : `<path d="M${x - w} ${y} Q${x} ${y + 9} ${x + w} ${y}" stroke="#4a342c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
const yanak = (x, y, r, c) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${dk(r * 0.72)}" fill="${c}" opacity=".55"/>`;
const gr = (k, a, b) => `<linearGradient id="${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

/* ---------- hayvanlar: hepsi 200x200, zemin y=182, merkez x=100 ---------- */
function civciv(p, ruh, uyku, k) {
  const c = A.civciv, hm = p.hm, bw = 46 * p.bm + 2, bh = 44 * p.bm + 8, ry = dk(bh * 0.84 + 6), cy = dk(181 - ry), topY = dk(cy - ry), gy = dk(topY + ry * 0.66);
  const dallar = p.d >= 2 ? `` : "";
  const ayak = `<ellipse cx="86" cy="181" rx="11" ry="4.5" fill="${c.gaga}"/><ellipse cx="114" cy="181" rx="11" ry="4.5" fill="${c.gaga}"/>`;
  const tepe = `<g class="pt-tepe" style="transform-origin:100px ${topY}px"><path d="M100 ${topY + 3} q-5 -14 -12 -10 q4 4 3 12" fill="${c.koyu}"/><path d="M100 ${topY + 3} q2 -17 11 -14 q-5 5 -4 14" fill="${c.koyu}"/>${p.d >= 3 ? `<path d="M100 ${topY + 3} q-14 -9 -20 0 q8 0 12 6" fill="${c.koyu}"/>` : ""}</g>`;
  const kuyruk = p.d >= 2 ? `<g class="pt-kuyruk" style="transform-origin:140px ${cy + 6}px"><path d="M${100 + bw - 6} ${cy + 2} q${14 + p.d * 2} -8 ${20 + p.d * 3} -2 q-8 2 -10 8 q-4 -2 -${6 + p.d} 4z" fill="${c.koyu}"/></g>` : "";
  ANC = { gy, ust: dk(gy - topY), hw: dk(bw * hm * 0.96 + 8), dx: 20, boyun: dk(gy + 22) };
  return `<defs>${gr(k + "b", c.acik, c.ana)}</defs>${p.d >= 2 ? dallar : ""}${ayak}${kuyruk}
  <ellipse cx="100" cy="${cy}" rx="${dk(bw * hm * 0.96 + 8)}" ry="${ry}" fill="url(#${k}b)" stroke="${c.koyu}" stroke-opacity=".25" stroke-width="1.5"/>
  <g class="pt-kanat pt-kl" style="transform-origin:${dk(100 - bw * hm - 2)}px ${cy}px"><ellipse cx="${dk(100 - bw * hm * 0.92)}" cy="${cy + 6}" rx="11" ry="${15 + p.d}" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".3" stroke-width="1.4" transform="rotate(14 ${dk(100 - bw * hm * 0.92)} ${cy + 6})"/></g>
  <g class="pt-kanat pt-kr" style="transform-origin:${dk(100 + bw * hm + 2)}px ${cy}px"><ellipse cx="${dk(100 + bw * hm * 0.92)}" cy="${cy + 6}" rx="11" ry="${15 + p.d}" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".3" stroke-width="1.4" transform="rotate(-14 ${dk(100 + bw * hm * 0.92)} ${cy + 6})"/></g>
  ${tepe}${goz(80, gy, 6.2 + (p.d === 0 ? 1.2 : 0), uyku, ruh)}${goz(120, gy, 6.2 + (p.d === 0 ? 1.2 : 0), uyku, ruh)}${uyku ? "" : kas(80, gy, 1, ruh) + kas(120, gy, -1, ruh)}
  ${yanak(70, gy + 14, 8, c.yanak)}${yanak(130, gy + 14, 8, c.yanak)}
  <path d="M93 ${gy + 8} L100 ${gy + 18} L107 ${gy + 8} Q100 ${gy + 4} 93 ${gy + 8}z" fill="${c.gaga}" stroke="#d9711c" stroke-width="1.2" stroke-linejoin="round"/>`;
}
function samur(p, ruh, uyku, k) {
  const c = A.samur, hm = p.hm, bm = p.bm, hy = 100, by = 150;
  const kuyruk = `<g class="pt-kuyruk" style="transform-origin:128px 160px"><path d="M126 160 q${20 + p.d * 4} 4 ${28 + p.d * 5} -${12 + p.d * 2} q-6 -2 -12 6 q-8 4 -16 0z" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".35" stroke-width="1.4"/></g>`;
  const bacak = `<ellipse cx="80" cy="177" rx="13" ry="7" fill="${c.koyu}"/><ellipse cx="120" cy="177" rx="13" ry="7" fill="${c.koyu}"/>`;
  const bigik = p.d >= 1 ? `<g stroke="#3b2a20" stroke-width="1.5" stroke-linecap="round" opacity=".75"><path d="M82 ${hy + 16} l-17 -3"/><path d="M82 ${hy + 21} l-17 4"/><path d="M118 ${hy + 16} l17 -3"/><path d="M118 ${hy + 21} l17 4"/></g>` : "";
  ANC = { gy: hy - 4, ust: dk(40 * hm - 4), hw: dk(40 * hm), dx: 18, boyun: dk(hy + 36 * hm) };
  return `<defs>${gr(k + "b", c.ana, c.koyu)}${gr(k + "k", "#a06b46", c.ana)}</defs>${kuyruk}${bacak}
  <ellipse cx="100" cy="${by}" rx="${dk(38 * bm + 4)}" ry="${dk(33 * bm + 4)}" fill="url(#${k}b)"/>
  <ellipse cx="100" cy="${by + 4}" rx="${dk(24 * bm + 2)}" ry="${dk(24 * bm)}" fill="${c.acik}"/>
  <g class="pt-kulak"><circle cx="${dk(100 - 33 * hm)}" cy="${hy - 28 * hm}" r="9" fill="${c.ana}"/><circle cx="${dk(100 - 33 * hm)}" cy="${hy - 28 * hm}" r="4.5" fill="${c.yanak}" opacity=".7"/><circle cx="${dk(100 + 33 * hm)}" cy="${hy - 28 * hm}" r="9" fill="${c.ana}"/><circle cx="${dk(100 + 33 * hm)}" cy="${hy - 28 * hm}" r="4.5" fill="${c.yanak}" opacity=".7"/></g>
  <circle cx="100" cy="${hy}" r="${dk(40 * hm)}" fill="url(#${k}k)"/>
  <ellipse cx="100" cy="${hy + 14 * hm}" rx="${dk(24 * hm)}" ry="${dk(19 * hm)}" fill="${c.acik}"/>
  ${goz(82, hy - 4, 6 + (p.d === 0 ? 1.3 : 0), uyku, ruh)}${goz(118, hy - 4, 6 + (p.d === 0 ? 1.3 : 0), uyku, ruh)}${uyku ? "" : kas(82, hy - 4, 1, ruh) + kas(118, hy - 4, -1, ruh)}
  ${yanak(70, hy + 11, 8, c.yanak)}${yanak(130, hy + 11, 8, c.yanak)}
  <ellipse cx="100" cy="${hy + 9}" rx="6.5" ry="4.8" fill="${c.burun}"/><ellipse cx="98" cy="${hy + 7.6}" rx="2" ry="1.2" fill="#fff" opacity=".55"/>
  ${agiz(100, hy + 16, ruh, 8)}${bigik}
  <g class="pt-kanat pt-kl" style="transform-origin:66px 144px"><ellipse cx="64" cy="156" rx="9" ry="14" fill="${c.ana}" transform="rotate(16 64 156)"/></g><g class="pt-kanat pt-kr" style="transform-origin:134px 144px"><ellipse cx="136" cy="156" rx="9" ry="14" fill="${c.ana}" transform="rotate(-16 136 156)"/></g>`;
}
function penguen(p, ruh, uyku, k) {
  const c = A.penguen, hm = p.hm, bm = p.bm, bw = 40 * bm + 6, bh = 52 * bm + 6, cy = 182 - bh + 4;
  const ayak = `<ellipse cx="84" cy="181" rx="12" ry="5" fill="${c.gaga}"/><ellipse cx="116" cy="181" rx="12" ry="5" fill="${c.gaga}"/>`;
  const boyun = p.d >= 3 ? `<path d="M${dk(100 - 20 * hm)} ${cy + 10} q${dk(20 * hm)} 16 ${dk(40 * hm)} 0 q-4 10 -${dk(20 * hm)} 12 q-${dk(16 * hm)} -2 -${dk(20 * hm)} -12z" fill="#f5c65a" opacity=".9"/>` : "";
  { const g0 = dk(cy - bh * 0.5 + 12 * hm); ANC = { gy: g0, ust: dk(g0 - (cy - bh * 0.98)), hw: dk(bw * 0.8), dx: 16, boyun: dk(g0 + 22) }; }
  return `<defs>${gr(k + "b", "#4a5a72", c.ana)}</defs>${ayak}
  <g class="pt-kanat pt-kl" style="transform-origin:${dk(100 - bw + 4)}px ${cy + 12}px"><path d="M${dk(100 - bw + 8)} ${cy + 8} q-${14 + p.d * 2} ${14 + p.d * 3} -${4} ${28 + p.d * 5} q8 -6 12 -22z" fill="${c.koyu}"/></g>
  <g class="pt-kanat pt-kr" style="transform-origin:${dk(100 + bw - 4)}px ${cy + 12}px"><path d="M${dk(100 + bw - 8)} ${cy + 8} q${14 + p.d * 2} ${14 + p.d * 3} 4 ${28 + p.d * 5} q-8 -6 -12 -22z" fill="${c.koyu}"/></g>
  <path d="M100 ${dk(cy - bh * 0.98)} C${dk(100 + bw * 1.02)} ${dk(cy - bh * 0.98)} ${dk(100 + bw * 1.12)} ${dk(cy - 4)} ${dk(100 + bw)} ${dk(cy + bh * 0.58)} C${dk(100 + bw * 0.88)} ${dk(cy + bh * 0.98)} ${dk(100 - bw * 0.88)} ${dk(cy + bh * 0.98)} ${dk(100 - bw)} ${dk(cy + bh * 0.58)} C${dk(100 - bw * 1.12)} ${dk(cy - 4)} ${dk(100 - bw * 1.02)} ${dk(cy - bh * 0.98)} 100 ${dk(cy - bh * 0.98)}z" fill="url(#${k}b)"/>
  <ellipse cx="100" cy="${dk(cy + bh * 0.3)}" rx="${dk(bw * 0.68)}" ry="${dk(bh * 0.62)}" fill="${c.acik}"/>${boyun}
  <path d="M${dk(100 - 30 * hm)} ${dk(cy - bh * 0.5)} q${dk(30 * hm)} ${dk(-8)} ${dk(60 * hm)} 0 q-2 ${dk(24 * hm)} -${dk(30 * hm)} ${dk(26 * hm)} q-${dk(28 * hm)} -2 -${dk(30 * hm)} -${dk(26 * hm)}z" fill="${c.acik}" opacity=".96"/>
  ${(() => { const gy = dk(cy - bh * 0.5 + 12 * hm); return `${goz(84, gy, 5.8 + (p.d === 0 ? 1.4 : 0), uyku, ruh)}${goz(116, gy, 5.8 + (p.d === 0 ? 1.4 : 0), uyku, ruh)}${uyku ? "" : kas(84, gy, 1, ruh) + kas(116, gy, -1, ruh)}${yanak(72, gy + 12, 7, c.yanak)}${yanak(128, gy + 12, 7, c.yanak)}<path d="M92 ${gy + 8} Q100 ${gy + 3} 108 ${gy + 8} L100 ${gy + 19}z" fill="${c.gaga}" stroke="#dd8a1f" stroke-width="1.2" stroke-linejoin="round"/>`; })()}`;
}
function timsah(p, ruh, uyku, k) {
  const c = A.timsah, hm = p.hm, bm = p.bm, hy = 104, by = 152;
  const kuyruk = `<g class="pt-kuyruk" style="transform-origin:128px 168px"><path d="M126 166 q${24 + p.d * 5} 2 ${34 + p.d * 6} -${14 + p.d * 2} q-14 4 -22 8 q-6 4 -12 -4z" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".4" stroke-width="1.4"/></g>`;
  const dikenler = Array.from({ length: 3 + p.d }, (_, i) => `<path d="M${dk(100 - 16 + i * (28 / (2 + p.d)) )} ${hy - 38 * hm + 4 + i * 2} l5 -9 l5 9z" fill="${c.koyu}"/>`).join("");
  ANC = { gy: dk(hy - 31 * hm), ust: 25, hw: dk(41 * hm), dx: dk(20 * hm), boyun: dk(hy + 32 * hm) };
  return `<defs>${gr(k + "b", c.ana, c.koyu)}${gr(k + "k", "#8ccd6f", c.ana)}</defs>${kuyruk}
  <ellipse cx="82" cy="178" rx="13" ry="6.5" fill="${c.koyu}"/><ellipse cx="118" cy="178" rx="13" ry="6.5" fill="${c.koyu}"/>
  <ellipse cx="100" cy="${by}" rx="${dk(40 * bm + 4)}" ry="${dk(32 * bm + 4)}" fill="url(#${k}b)"/><ellipse cx="100" cy="${by + 5}" rx="${dk(26 * bm + 2)}" ry="${dk(23 * bm)}" fill="${c.acik}"/>
  ${p.d >= 1 ? `<g opacity=".9">${dikenler}</g>` : ""}
  <g class="pt-kanat pt-kl" style="transform-origin:64px 146px"><ellipse cx="62" cy="158" rx="8.5" ry="13" fill="${c.ana}" transform="rotate(16 62 158)"/></g><g class="pt-kanat pt-kr" style="transform-origin:136px 146px"><ellipse cx="138" cy="158" rx="8.5" ry="13" fill="${c.ana}" transform="rotate(-16 138 158)"/></g>
  <ellipse cx="100" cy="${hy}" rx="${dk(41 * hm)}" ry="${dk(36 * hm)}" fill="url(#${k}k)"/>
  <ellipse cx="100" cy="${hy + 15 * hm}" rx="${dk(31 * hm)}" ry="${dk(18 * hm)}" fill="#a9d97f" stroke="${c.koyu}" stroke-opacity=".35" stroke-width="1.4"/>
  <circle cx="${dk(100 - 20 * hm)}" cy="${hy - 30 * hm}" r="11" fill="${c.ana}"/><circle cx="${dk(100 + 20 * hm)}" cy="${hy - 30 * hm}" r="11" fill="${c.ana}"/>
  ${goz(dk(100 - 20 * hm), hy - 31 * hm, 6.2 + (p.d === 0 ? 1.2 : 0), uyku, ruh)}${goz(dk(100 + 20 * hm), hy - 31 * hm, 6.2 + (p.d === 0 ? 1.2 : 0), uyku, ruh)}${uyku ? "" : kas(dk(100 - 20 * hm), hy - 31 * hm, 1, ruh) + kas(dk(100 + 20 * hm), hy - 31 * hm, -1, ruh)}
  <ellipse cx="88" cy="${hy + 6}" rx="3" ry="2.1" fill="#3d6b2c"/><ellipse cx="112" cy="${hy + 6}" rx="3" ry="2.1" fill="#3d6b2c"/>
  ${agiz(100, hy + 17, ruh, 20)}${p.d >= 1 ? `<path d="M${dk(100 - 15)} ${hy + 20} l2.4 4 l2.4 -4M${dk(100 + 8)} ${hy + 20} l2.4 4 l2.4 -4M${dk(100 - 4)} ${hy + 21} l2.4 4 l2.4 -4" stroke="#fff" stroke-width="1.6" fill="#fff" stroke-linejoin="round"/>` : ""}
  ${yanak(66, hy + 8, 8, c.yanak)}${yanak(134, hy + 8, 8, c.yanak)}`;
}
function tavsan(p, ruh, uyku, k) {
  const c = A.tavsan, hm = p.hm, bm = p.bm, hy = 108, by = 155, kb = 27 + p.d * 4.5;
  const kulak = (x, yon) => `<g class="pt-kulak pt-k${yon < 0 ? "l" : "r"}" style="transform-origin:${x}px ${hy - 28 * hm}px"><ellipse cx="${x}" cy="${dk(hy - 28 * hm - kb * 0.7)}" rx="${dk(11.5 * hm)}" ry="${dk(kb)}" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".55" stroke-width="1.4" transform="rotate(${yon * -6} ${x} ${hy - 28 * hm})"/><ellipse cx="${x}" cy="${dk(hy - 28 * hm - kb * 0.7)}" rx="${dk(5.4 * hm)}" ry="${dk(kb * 0.78)}" fill="${c.ic}" transform="rotate(${yon * -6} ${x} ${hy - 28 * hm})"/></g>`;
  ANC = { gy: hy - 3, ust: dk(35 * hm), hw: dk(38 * hm), dx: 18, boyun: dk(hy + 35 * hm) };
  return `<defs>${gr(k + "b", c.acik, c.ana)}</defs>
  <g class="pt-kuyruk" style="transform-origin:130px 170px"><circle cx="131" cy="168" r="11" fill="#fff" stroke="${c.koyu}" stroke-width="1.4"/></g>
  <ellipse cx="82" cy="178" rx="13" ry="6.5" fill="${c.ana}" stroke="${c.koyu}" stroke-width="1.3"/><ellipse cx="118" cy="178" rx="13" ry="6.5" fill="${c.ana}" stroke="${c.koyu}" stroke-width="1.3"/>
  <ellipse cx="100" cy="${by}" rx="${dk(37 * bm + 4)}" ry="${dk(30 * bm + 4)}" fill="url(#${k}b)" stroke="${c.koyu}" stroke-width="1.4"/><ellipse cx="100" cy="${by + 5}" rx="${dk(22 * bm + 2)}" ry="${dk(20 * bm)}" fill="#fff"/>
  ${kulak(dk(100 - 20 * hm), -1)}${kulak(dk(100 + 20 * hm), 1)}
  <circle cx="100" cy="${hy}" r="${dk(38 * hm)}" fill="url(#${k}b)" stroke="${c.koyu}" stroke-width="1.4"/>
  ${goz(82, hy - 3, 6 + (p.d === 0 ? 1.3 : 0), uyku, ruh)}${goz(118, hy - 3, 6 + (p.d === 0 ? 1.3 : 0), uyku, ruh)}${uyku ? "" : kas(82, hy - 3, 1, ruh) + kas(118, hy - 3, -1, ruh)}
  ${yanak(70, hy + 12, 8.5, c.yanak)}${yanak(130, hy + 12, 8.5, c.yanak)}
  <path d="M95 ${hy + 7} Q100 ${hy + 2} 105 ${hy + 7} Q100 ${hy + 13} 95 ${hy + 7}z" fill="${c.burun}"/><path d="M100 ${hy + 11} v5" stroke="#4a342c" stroke-width="2" stroke-linecap="round"/>${agiz(100, hy + 16, ruh, 7)}
  ${p.d >= 2 ? `<path d="M96 ${hy + 16} l-1.5 7h6l-1.5-7z" fill="#fff" stroke="#c9bdbd" stroke-width=".8" opacity=".95"/>` : ""}
  <g class="pt-kanat pt-kl" style="transform-origin:66px 146px"><ellipse cx="64" cy="158" rx="9" ry="14" fill="${c.ana}" stroke="${c.koyu}" stroke-width="1.3" transform="rotate(16 64 158)"/></g><g class="pt-kanat pt-kr" style="transform-origin:134px 146px"><ellipse cx="136" cy="158" rx="9" ry="14" fill="${c.ana}" stroke="${c.koyu}" stroke-width="1.3" transform="rotate(-16 136 158)"/></g>`;
}
function kedi(p, ruh, uyku, k) {
  const c = A.kedi, hm = p.hm, bm = p.bm, hy = 102, by = 152;
  const kuyruk = `<g class="pt-kuyruk" style="transform-origin:130px 166px"><path d="M128 168 q${22 + p.d * 5} 2 ${22 + p.d * 5} -${22 + p.d * 5} q-2 -${6 + p.d} -8 -2 q4 ${12 + p.d * 2} -${8 + p.d * 2} ${22 + p.d * 3}z" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".4" stroke-width="1.4"/><path d="M${150 + p.d * 5} ${150 - p.d * 2} l-6 6" stroke="${c.koyu}" stroke-width="3" stroke-linecap="round"/></g>`;
  const cizgi = (x, y, yon) => `<path d="M${x} ${y} l${6 * yon} 7M${x + 5 * yon} ${y - 2} l${6 * yon} 7" stroke="${c.koyu}" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`;
  ANC = { gy: hy - 2, ust: dk(37 * hm), hw: dk(39 * hm), dx: 18, boyun: dk(hy + 37 * hm) };
  return `<defs>${gr(k + "b", "#f1b979", c.ana)}</defs>${kuyruk}
  <ellipse cx="82" cy="178" rx="12" ry="6.5" fill="${c.acik}" stroke="${c.koyu}" stroke-opacity=".4" stroke-width="1.2"/><ellipse cx="118" cy="178" rx="12" ry="6.5" fill="${c.acik}" stroke="${c.koyu}" stroke-opacity=".4" stroke-width="1.2"/>
  <ellipse cx="100" cy="${by}" rx="${dk(36 * bm + 4)}" ry="${dk(30 * bm + 4)}" fill="url(#${k}b)"/><ellipse cx="100" cy="${by + 5}" rx="${dk(21 * bm + 2)}" ry="${dk(20 * bm)}" fill="${c.acik}"/>
  ${cizgi(dk(100 - 30 * bm), by - 12 * bm, 1)}${cizgi(dk(100 + 30 * bm), by - 12 * bm, -1)}
  <g class="pt-kulak"><path d="M${dk(100 - 36 * hm)} ${dk(hy - 14 * hm)} L${dk(100 - 31 * hm)} ${dk(hy - 50 * hm)} L${dk(100 - 8 * hm)} ${dk(hy - 33 * hm)}z" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".4" stroke-width="1.4" stroke-linejoin="round"/><path d="M${dk(100 - 31 * hm)} ${dk(hy - 24 * hm)} L${dk(100 - 29 * hm)} ${dk(hy - 41 * hm)} L${dk(100 - 16 * hm)} ${dk(hy - 32 * hm)}z" fill="${c.ic}"/>
  <path d="M${dk(100 + 36 * hm)} ${dk(hy - 14 * hm)} L${dk(100 + 31 * hm)} ${dk(hy - 50 * hm)} L${dk(100 + 8 * hm)} ${dk(hy - 33 * hm)}z" fill="${c.ana}" stroke="${c.koyu}" stroke-opacity=".4" stroke-width="1.4" stroke-linejoin="round"/><path d="M${dk(100 + 31 * hm)} ${dk(hy - 24 * hm)} L${dk(100 + 29 * hm)} ${dk(hy - 41 * hm)} L${dk(100 + 16 * hm)} ${dk(hy - 32 * hm)}z" fill="${c.ic}"/></g>
  <circle cx="100" cy="${hy}" r="${dk(39 * hm)}" fill="url(#${k}b)"/>
  <path d="M100 ${dk(hy - 38 * hm)} v10M90 ${dk(hy - 37 * hm)} l2 8M110 ${dk(hy - 37 * hm)} l-2 8" stroke="${c.koyu}" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
  <ellipse cx="100" cy="${hy + 12 * hm}" rx="${dk(19 * hm)}" ry="${dk(14 * hm)}" fill="${c.acik}"/>
  ${goz(82, hy - 2, 6.1 + (p.d === 0 ? 1.3 : 0), uyku, ruh)}${goz(118, hy - 2, 6.1 + (p.d === 0 ? 1.3 : 0), uyku, ruh)}${uyku ? "" : kas(82, hy - 2, 1, ruh) + kas(118, hy - 2, -1, ruh)}
  ${yanak(70, hy + 12, 8, c.yanak)}${yanak(130, hy + 12, 8, c.yanak)}
  <path d="M95.5 ${hy + 8} h9 l-4.5 5z" fill="${c.burun}"/>${agiz(100, hy + 14, ruh, 7)}
  ${p.d >= 1 ? `<g stroke="#5a463c" stroke-width="1.4" stroke-linecap="round" opacity=".6"><path d="M80 ${hy + 12} l-18 -4"/><path d="M80 ${hy + 16} l-18 3"/><path d="M120 ${hy + 12} l18 -4"/><path d="M120 ${hy + 16} l18 3"/></g>` : ""}
  <g class="pt-kanat pt-kl" style="transform-origin:66px 146px"><ellipse cx="64" cy="158" rx="8.5" ry="14" fill="${c.ana}" transform="rotate(16 64 158)"/></g><g class="pt-kanat pt-kr" style="transform-origin:134px 146px"><ellipse cx="136" cy="158" rx="8.5" ry="14" fill="${c.ana}" transform="rotate(-16 136 158)"/></g>`;
}
const CIZ = { civciv, samur, penguen, timsah, tavsan, kedi };


/* ---------- kıyafetler: her evrede farklı; hayvanın çapa noktalarına göre yerleşir ---------- */
const GIY = {
  bere: a => { const t = a.gy - a.ust, w = a.hw * 0.86; return { on: `<g class="pt-giy"><path d="M${dk(100 - w)} ${dk(t + 17)} Q${dk(100 - w * 0.9)} ${dk(t - 20)} 100 ${dk(t - 21)} Q${dk(100 + w * 0.9)} ${dk(t - 20)} ${dk(100 + w)} ${dk(t + 17)}Z" fill="#e8553f"/><rect x="${dk(100 - w - 2)}" y="${dk(t + 10)}" width="${dk(w * 2 + 4)}" height="11" rx="5.5" fill="#f7efe1"/><circle cx="100" cy="${dk(t - 22)}" r="6.5" fill="#f7efe1"/></g>` }; },
  onluk: a => { const b = a.boyun; return { on: `<g class="pt-giy"><path d="M80 ${b} Q100 ${b + 9} 120 ${b} L115 ${b + 30} Q100 ${b + 38} 85 ${b + 30}Z" fill="#7cc4f0" stroke="#4aa3d8" stroke-width="1.5"/><path d="M100 ${b + 12} c-5 -6 -11 0 -5 6 l5 5 l5 -5 c6 -6 0 -12 -5 -6z" fill="#fff"/></g>` }; },
  fiyonk: a => { const t = a.gy - a.ust, x = dk(100 - a.hw * 0.62), y = dk(t + 12); return { on: `<g class="pt-giy"><path d="M${x} ${y} l-17 -9 v18z M${x} ${y} l17 -9 v18z" fill="#f48fb1" stroke="#d96b93" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="4.5" fill="#d96b93"/></g>` }; },
  atki: a => { const b = a.boyun, w = dk(a.hw * 0.74); return { on: `<g class="pt-giy"><path d="M${100 - w} ${b - 3} Q100 ${b + 13} ${100 + w} ${b - 3} l-1 11 Q100 ${b + 25} ${101 - w} ${b + 8}Z" fill="#e74c3c"/><path d="M${dk(100 - w * 0.55)} ${b + 4} q6 5 12 3 M${dk(100 + w * 0.1)} ${b + 7} q6 3 12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/><path d="M${dk(100 + w * 0.5)} ${b + 6} l9 22 l-10 2 l-6 -18z" fill="#c0392b"/></g>` }; },
  kasket: a => { const t = a.gy - a.ust, w = a.hw * 0.84; return { on: `<g class="pt-giy"><path d="M${dk(100 - w)} ${dk(t + 15)} Q${dk(100 - w * 0.8)} ${dk(t - 13)} 100 ${dk(t - 14)} Q${dk(100 + w * 0.8)} ${dk(t - 13)} ${dk(100 + w)} ${dk(t + 15)}Z" fill="#3b82f6"/><path d="M${dk(100 - w * 0.15)} ${dk(t + 13)} h${dk(w * 1.05)} q2 8 -${dk(w * 0.2)} 8 h-${dk(w * 0.8)}z" fill="#2d63c8"/><circle cx="100" cy="${dk(t - 14)}" r="3.4" fill="#2d63c8"/></g>` }; },
  gozluk: a => { const r = dk(a.dx * 0.72); return { on: `<g class="pt-giy" fill="rgba(255,255,255,.2)" stroke="#2f3b4a" stroke-width="2.6"><circle cx="${100 - a.dx}" cy="${a.gy}" r="${r}"/><circle cx="${100 + a.dx}" cy="${a.gy}" r="${r}"/><path d="M${dk(100 - a.dx + r)} ${a.gy} Q100 ${a.gy - 5} ${dk(100 + a.dx - r)} ${a.gy}" fill="none"/><path d="M${dk(100 - a.dx - r)} ${a.gy} l-9 -3M${dk(100 + a.dx + r)} ${a.gy} l9 -3" fill="none"/></g>` }; },
  pelerin: a => { const b = a.boyun, w = a.hw, yb = Math.min(b + 50, 179), ym = dk((b + yb) / 2); return { arka: `<g class="pt-giy"><path d="M${dk(100 - w * 0.5)} ${b - 2} Q${dk(100 - w * 1.32)} ${ym} ${dk(100 - w * 1.1)} ${yb} Q100 ${yb + 9} ${dk(100 + w * 1.1)} ${yb} Q${dk(100 + w * 1.32)} ${ym} ${dk(100 + w * 0.5)} ${b - 2}Z" fill="#d83a3a"/></g>`, on: `<g class="pt-giy"><path d="M${dk(100 - w * 0.5)} ${b - 1} Q100 ${b + 9} ${dk(100 + w * 0.5)} ${b - 1}" fill="none" stroke="#b52a2a" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="${b + 4}" r="5" fill="#f4c542" stroke="#c99a1e" stroke-width="1.4"/></g>` }; },
  gunes: a => { const w = dk(a.dx * 0.66), h = dk(a.dx * 0.62); return { on: `<g class="pt-giy"><rect x="${dk(100 - a.dx - w)}" y="${dk(a.gy - h / 2)}" width="${dk(w * 2)}" height="${h}" rx="${dk(h * 0.45)}" fill="#1f2630"/><rect x="${dk(100 + a.dx - w)}" y="${dk(a.gy - h / 2)}" width="${dk(w * 2)}" height="${h}" rx="${dk(h * 0.45)}" fill="#1f2630"/><path d="M${dk(100 - a.dx + w)} ${dk(a.gy - h * 0.1)} H${dk(100 + a.dx - w)}" stroke="#1f2630" stroke-width="3"/><path d="M${dk(100 - a.dx - w * 0.6)} ${dk(a.gy - h * 0.15)} l${dk(w * 0.5)} -${dk(h * 0.2)} M${dk(100 + a.dx - w * 0.6)} ${dk(a.gy - h * 0.15)} l${dk(w * 0.5)} -${dk(h * 0.2)}" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/></g>` }; },
  kulaklik: a => { const t = a.gy - a.ust, w = a.hw; return { on: `<g class="pt-giy"><path d="M${dk(100 - w * 0.98)} ${a.gy + 4} Q${dk(100 - w * 1.0)} ${dk(t - 8)} 100 ${dk(t - 8)} Q${dk(100 + w * 1.0)} ${dk(t - 8)} ${dk(100 + w * 0.98)} ${a.gy + 4}" fill="none" stroke="#2f3b4a" stroke-width="5" stroke-linecap="round"/><rect x="${dk(100 - w * 1.1)}" y="${a.gy - 8}" width="13" height="22" rx="6" fill="#e8553f"/><rect x="${dk(100 + w * 1.1 - 13)}" y="${a.gy - 8}" width="13" height="22" rx="6" fill="#e8553f"/></g>` }; },
  tac: a => { const t = a.gy - a.ust, w = dk(a.hw * 0.62), x0 = 100 - w, x1 = 100 + w; return { on: `<g class="pt-giy"><path d="M${x0} ${dk(t + 12)} L${x0} ${dk(t - 14)} L${dk(100 - w * 0.5)} ${dk(t)} L100 ${dk(t - 18)} L${dk(100 + w * 0.5)} ${dk(t)} L${x1} ${dk(t - 14)} L${x1} ${dk(t + 12)}Z" fill="#f4c542" stroke="#c99a1e" stroke-width="1.6" stroke-linejoin="round"/><circle cx="100" cy="${dk(t - 4)}" r="3.2" fill="#e74c3c"/><circle cx="${dk(100 - w * 0.62)}" cy="${dk(t + 3)}" r="2.4" fill="#3b82f6"/><circle cx="${dk(100 + w * 0.62)}" cy="${dk(t + 3)}" r="2.4" fill="#3b82f6"/></g>` }; },
  papyon: a => { const b = a.boyun + 3; return { on: `<g class="pt-giy"><path d="M100 ${b} l-17 -9 v18z M100 ${b} l17 -9 v18z" fill="#c0392b" stroke="#962d22" stroke-width="1.2" stroke-linejoin="round"/><rect x="95.5" y="${b - 4.5}" width="9" height="9" rx="3" fill="#962d22"/></g>` }; },
  madalya: a => { const b = a.boyun; return { on: `<g class="pt-giy"><path d="M88 ${b - 1} L100 ${b + 16} L112 ${b - 1} L106 ${b - 3} L100 ${b + 7} L94 ${b - 3}Z" fill="#3b82f6"/><circle cx="100" cy="${b + 21}" r="8" fill="#f4c542" stroke="#c99a1e" stroke-width="1.6"/><path d="M100 ${b + 16.5} l1.9 3.8 l4.2 .6 l-3 3 l.7 4.2 l-3.8 -2 l-3.8 2 l.7 -4.2 l-3 -3 l4.2 -.6z" fill="#fff4c6"/></g>` }; },
};
export const GIYSI_KIMLIKLERI = Object.keys(GIY);

// çamur lekeleri (kirli hâl)
const camur = `<g class="pt-camur"><path d="M62 150 q6 -9 14 -3 q8 -2 6 7 q-6 7 -14 3 q-8 0 -6 -7z" fill="#7a5532"/><path d="M118 132 q7 -8 14 -2 q7 1 4 8 q-6 5 -13 1 q-7 -2 -5 -7z" fill="#7a5532"/><path d="M96 166 q5 -6 11 -1 q6 0 4 6 q-5 4 -11 1 q-6 -1 -4 -6z" fill="#8b6540"/><circle cx="78" cy="94" r="4.5" fill="#7a5532"/><circle cx="126" cy="112" r="3.4" fill="#8b6540"/></g>`;
// köpük (temizliğin 1. adımından sonra): yüzen kabarcıklar
const kopuk = `<g class="pt-kopuk" fill="#fff" stroke="#9fd3f2" stroke-width="1.6"><circle cx="70" cy="112" r="9"/><circle cx="132" cy="104" r="7"/><circle cx="100" cy="82" r="6"/><circle cx="82" cy="152" r="8"/><circle cx="124" cy="150" r="10"/><circle cx="100" cy="132" r="5"/><circle cx="60" cy="86" r="4"/><circle cx="142" cy="130" r="5"/></g>`;
const zzz = `<g class="pt-zzz" fill="#7c8cc4" font-family="Georgia,serif" font-weight="700"><text x="138" y="62" font-size="20">z</text><text x="150" y="44" font-size="15">z</text><text x="159" y="30" font-size="11">z</text></g>`;

export function petSvg({ tur, evre = 2, ruh = "mutlu", uyku = false, kirli = false, kopuklu = false, giysi = null, kimlik = "p" } = {}) {
  const f = CIZ[tur]; if (!f) return yumurtaSvg(null, { kimlik });
  if (evre <= 0) return yumurtaSvg(tur, { kimlik });
  const p = S[Math.min(4, Math.max(1, evre))], k = kimlik + tur + evre;
  const govde = f(p, ruh, uyku || ruh === "cokac", k), gy = giysi && GIY[giysi] ? GIY[giysi](ANC) : null;
  return `<svg class="pet-svg ruh-${ruh}${uyku ? " uyku" : ""}" viewBox="0 0 200 200" role="img" aria-label="${A[tur] ? tur : "hayvan"}" xmlns="http://www.w3.org/2000/svg">
  <ellipse class="pt-golge" cx="100" cy="183" rx="${dk(46 * p.s + 8)}" ry="${dk(7 * p.s + 2)}" fill="rgba(0,0,0,.15)"/>
  <g transform="translate(100 182) scale(${p.s}) translate(-100 -182)"><g class="pt-nef">${gy && gy.arka ? gy.arka : ""}${govde}${kirli ? camur : ""}${kopuklu ? kopuk : ""}${gy ? gy.on : ""}</g></g>${uyku ? zzz : ""}</svg>`;
}
// yumurta: hayvana özel benekli desen; tur yoksa nötr
export function yumurtaSvg(tur, { kimlik = "e", catlak = 0 } = {}) {
  const c = A[tur] || { ana: "#f3e8d2", acik: "#fffaf0", koyu: "#cdbd9e" }, k = kimlik + "y" + (tur || "n");
  const benek = tur ? `<g fill="${c.koyu}" opacity=".5"><circle cx="84" cy="124" r="5"/><circle cx="116" cy="108" r="4"/><circle cx="102" cy="140" r="6"/><circle cx="120" cy="136" r="3.4"/><circle cx="88" cy="100" r="3.2"/></g>` : `<g fill="${c.koyu}" opacity=".35"><circle cx="86" cy="126" r="3.6"/><circle cx="116" cy="112" r="3"/><circle cx="104" cy="140" r="4"/></g>`;
  return `<svg class="pet-svg yumurta" viewBox="0 0 200 200" role="img" aria-label="yumurta" xmlns="http://www.w3.org/2000/svg"><defs>${gr(k, c.acik, c.ana)}</defs>
  <ellipse class="pt-golge" cx="100" cy="183" rx="40" ry="7" fill="rgba(0,0,0,.15)"/>
  <g class="pt-yum"><path d="M100 54 C132 54 150 104 150 138 C150 164 128 182 100 182 C72 182 50 164 50 138 C50 104 68 54 100 54z" fill="url(#${k})" stroke="${c.koyu}" stroke-opacity=".5" stroke-width="2"/>${benek}
  <path d="M78 76 q8 -12 22 -14" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>${catlak ? `<path d="M96 96 l8 12 l-9 8 l10 12" stroke="${c.koyu}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}</g></svg>`;
}
export const yildizSvg = () => `<svg class="pet-svg yildiz" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-label="yıldız"><defs><radialGradient id="ygl"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#ffd86a" stop-opacity="0"/></radialGradient></defs><circle class="pt-hale" cx="100" cy="100" r="78" fill="url(#ygl)"/><path class="pt-yild" d="M100 36l17 38 41 4-31 27 9 41-36-21-36 21 9-41-31-27 41-4z" fill="#ffd25a" stroke="#f2b233" stroke-width="3" stroke-linejoin="round"/></svg>`;
// başlık/çip için sadece kafa (viewBox kırpılır)
export function miniKafa(tur, evre = 2, kimlik = "m", yildiz = false) {
  const s = yildiz ? yildizSvg() : evre <= 0 || !tur ? yumurtaSvg(tur, { kimlik }) : petSvg({ tur, evre, kimlik }), v = yildiz ? "30 30 140 140" : evre <= 0 || !tur ? "44 46 112 140" : "46 " + Math.round(182 - 62 * S[Math.min(4, Math.max(1, evre))].s - 52) + " 108 104";
  return s.replace('viewBox="0 0 200 200"', `viewBox="${v}"`).replace('class="pet-svg', 'class="pet-svg mini');
}

// Seri ateşi: üç katmanlı, titreyen alev ve yükselen kıvılcımlar. 1-6 gün turuncu, 7-29 gün kızıl, 30+ gün mavi.
export function alevSvg(n = 1) {
  const sev = n >= 30 ? 3 : n >= 7 ? 2 : 1, c = sev === 3 ? ["#2f7de1", "#7cc4ff", "#eaf7ff"] : sev === 2 ? ["#e8451f", "#ff9a2e", "#ffe27a"] : ["#f07a1c", "#ffb23d", "#fff1b0"];
  return `<svg class="alev-svg s${sev}" viewBox="0 0 24 28" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g class="al-dis"><path d="M12 1c1.4 5 7.2 7.2 7.2 14a7.2 7.2 0 0 1-14.4 0c0-3 1.4-4.7 3-6.4.2 2 1.2 3 2.4 3.3C9.4 8 10.6 4.4 12 1z" fill="${c[0]}"/></g><g class="al-orta"><path d="M12 9c.8 3 4.4 4.2 4.4 8.4a4.4 4.4 0 0 1-8.8 0c0-1.9.9-3 1.9-4 .2 1.2.7 1.8 1.5 2C10.4 13 11.2 11 12 9z" fill="${c[1]}"/></g><g class="al-ic"><path d="M12 15c.5 1.7 2.4 2.4 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1 .5-1.7 1.1-2.3.2.7.5 1 .9 1.1C11.5 17.2 11.8 16.2 12 15z" fill="${c[2]}"/></g><g class="al-kiv" fill="${c[1]}"><circle cx="5.5" cy="12" r="1"/><circle cx="18.5" cy="13" r=".9"/><circle cx="14.5" cy="6" r=".8"/></g></svg>`;
}
