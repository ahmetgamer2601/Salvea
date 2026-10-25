const MAX_DOSYA = 15 * 1024 * 1024;
function ac(file) {
  return new Promise((res, rej) => {
    if (!file || !(file.type || "").startsWith("image/")) return rej(new Error("Lütfen bir görsel dosyası seç."));
    if (file.size > MAX_DOSYA) return rej(new Error("Dosya çok büyük (en fazla 15 MB)."));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Görsel okunamadı")); };
    img.src = url;
  });
}
// Ortadan kare kırpar (profil fotoğrafı)
export async function resize(file, size = 256) {
  const img = await ac(file), s = Math.min(img.width, img.height), c = document.createElement("canvas"); c.width = c.height = size;
  c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.82);
}
// En uzun kenarı max piksele sığdırır (kanıt / sohbet fotoğrafı). maxChars verilirse sınırı aşmayana dek küçültür.
export async function resizeFit(file, max = 900, q = 0.72, maxChars = 0) {
  const img = await ac(file);
  const dene = (m, k) => { const r = Math.min(1, m / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", k); };
  let out = dene(max, q);
  for (const [m, k] of [[760, 0.6], [640, 0.5], [520, 0.45]]) { if (!maxChars || out.length <= maxChars) break; out = dene(m, k); }
  if (maxChars && out.length > maxChars) throw new Error("Fotoğraf çok ayrıntılı, daha basit bir fotoğraf dene.");
  return out;
}
export function avatar(box, f, name) {
  box.replaceChildren();
  if (f) { const i = document.createElement("img"); i.src = f; i.alt = ""; box.append(i); }
  else box.textContent = (name || "?").trim().charAt(0).toLocaleUpperCase("tr");
}
// Data URL'i cihaza indirir
export function indir(dataUrl, ad) {
  const a = document.createElement("a"); a.href = dataUrl; a.download = (ad || "foto") + ".jpg";
  document.body.append(a); a.click(); a.remove();
}
