// Tüm sayfalarda çalışan, Firebase'e bağlı OLMAYAN ortak davranışlar
document.addEventListener('click', e => {
  const eye = e.target.closest('[data-eye]');
  if (eye) {
    const ids = eye.dataset.eye.split(',');
    const show = document.getElementById(ids[0]).type === 'password';
    ids.forEach(i => document.getElementById(i).type = show ? 'text' : 'password');
    eye.textContent = show ? 'Gizle' : 'Göster';
  }
  const doc = e.target.closest('[data-doc]');
  if (doc) {
    e.preventDefault();
    const d = document.getElementById(doc.dataset.doc);
    d.open = !d.open;
    if (d.open) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
document.addEventListener('input', e => e.target.classList && e.target.classList.remove('bad'));
document.addEventListener('change', e => e.target.classList && e.target.classList.remove('bad'));
if (location.protocol === 'file:') {
  const w = document.createElement('div');
  w.className = 'warn';
  w.innerHTML = 'Bu sayfa dosya olarak açıldı, giriş ve kayıt çalışmaz. Klasörü VS Code\'da <b>Live Server</b> ile aç veya klasörde <code>python -m http.server</code> yazıp tarayıcıda <code>localhost:8000</code> adresine git.';
  document.body.prepend(w);
}
window.S = {
  $: id => document.getElementById(id),
  show(t, ok) { const m = document.getElementById('msg'); m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); },
  bad(id, t) { const el = document.getElementById(id); el.classList.add('bad'); el.focus(); this.show(t); return false; }
};
// Ana ekrana eklenebilir uygulama (PWA)
(() => {
  const m = document.createElement("link"); m.rel = "manifest"; m.href = "manifest.json"; document.head.append(m);
  const t = document.createElement("meta"); t.name = "theme-color"; t.content = "#1d3a2f"; document.head.append(t);
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();