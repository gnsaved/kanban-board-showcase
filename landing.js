"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const openAllBtn = document.getElementById("openAllBtn");

  openAllBtn?.addEventListener("click", () => {
    const links = [
      "design-1-jira-style/index.html",
      "design-2-alass/index.html",
      "design-3-itask-glass/index.html",
      "design-4-pro-kanban/index.html",
    ];

    // Open sequentially so browsers are less likely to block
    let i = 0;
    const t = setInterval(() => {
      window.open(links[i], "_blank", "noopener,noreferrer");
      i++;
      if (i >= links.length) clearInterval(t);
    }, 220);
  });
});
