export function mountNav(me, active) {
  const home = me.role === "teacher" ? "teacher.html" : "student.html";
  const nav = document.createElement("nav"); nav.className = "nav"; nav.setAttribute("aria-label", "Bölümler");
  [["home", "Ana sayfa", home], ["gorev", "Görevler", "gorevler.html"], ["sohbet", "Sohbet", "sohbet.html"], ["randevu", "Randevu", "randevu.html"]].forEach(([k, t, h]) => {
    const a = document.createElement("a"); a.href = h; a.textContent = t; if (k === active) a.setAttribute("aria-current", "page"); nav.append(a);
  });
  (document.querySelector(".top") || document.body).after(nav);
}