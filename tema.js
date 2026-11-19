// Uygulama teması: açık / koyu / sistem. Sayfa çizilmeden önce çalışır (açılışta parlama olmasın).
// Tercih yalnızca bu cihazda saklanır. Geçişte tıklanan noktadan yayılan bir daire animasyonu oynar.
(function () {
  var K = "salvea_tema", H = document.documentElement;
  var mq = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  var azalt = function () { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; };
  var bellek = null;   // localStorage kapalıysa (gizli sekme vb.) tercih en azından bu oturumda hatırlansın
  function oku() { if (bellek) return bellek; try { var v = localStorage.getItem(K); return v === "koyu" || v === "sistem" ? v : "acik"; } catch (e) { return "acik"; } }
  function etkin(m) { return m === "koyu" || (m === "sistem" && mq && mq.matches) ? "koyu" : "acik"; }
  function uygula(m) {
    var t = etkin(m); H.dataset.tema = t;
    var c = document.querySelector('meta[name="theme-color"]'); if (c) c.content = t === "koyu" ? "#141c19" : "#1d3a2f";
  }
  function ayarla(m, x, y) {
    if (m === oku()) return;
    bellek = m; try { localStorage.setItem(K, m); } catch (e) {}
    if (azalt()) return uygula(m);
    if (document.startViewTransition) {
      if (x == null) { x = innerWidth / 2; y = innerHeight / 2; }
      var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var vt = document.startViewTransition(function () { uygula(m); });
      vt.ready.then(function () {
        H.animate({ clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
          { duration: 650, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" });
      }).catch(function () {});
    } else {
      H.classList.add("tema-gecis"); uygula(m); setTimeout(function () { H.classList.remove("tema-gecis"); }, 500);
    }
  }
  window.Tema = { mod: oku, etkin: function () { return etkin(oku()); }, ayarla: ayarla };
  uygula(oku());
  // ortak.js theme-color etiketini sonradan ekler; sayfa yüklenince bir kez daha uygula
  document.addEventListener("DOMContentLoaded", function () { uygula(oku()); });
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (oku() === "sistem") uygula("sistem"); });
})();
