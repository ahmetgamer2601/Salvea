export function resize(file, size = 256) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(img.width, img.height), c = document.createElement("canvas"); c.width = c.height = size;
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.82)); };
    img.onerror = () => rej(new Error("Görsel okunamadı")); img.src = url;
  });
}
export function avatar(box, f, name) {
  box.replaceChildren();
  if (f) { const i = document.createElement("img"); i.src = f; i.alt = ""; box.append(i); }
  else box.textContent = (name || "?").trim().charAt(0).toLocaleUpperCase("tr");
}
export function resizeFit(file, max = 900, q = 0.72) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const r = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", q)); };
    img.onerror = () => rej(new Error("Görsel okunamadı")); img.src = url;
  });
}