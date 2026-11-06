/* 14 天学会 DeepSeek Harness · 站点脚本（无依赖） */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;

  /* ---------------- 主题 ---------------- */
  var THEME_KEY = "dsh-site-theme";
  function preferredTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", theme === "dark" ? "切换到浅色主题" : "切换到深色主题");
      btn.title = btn.getAttribute("aria-label");
    }
  }
  applyTheme(preferredTheme());
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}
    });
  }

  /* ---------------- 移动端侧栏 ---------------- */
  var menuBtn = document.getElementById("menuToggle");
  var overlay = document.getElementById("overlay");
  function closeSidebar() {
    body.classList.remove("sidebar-open");
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      body.classList.toggle("sidebar-open");
    });
  }
  if (overlay) overlay.addEventListener("click", closeSidebar);
  document.addEventListener("click", function (e) {
    if (!body.classList.contains("sidebar-open")) return;
    var sidebar = document.getElementById("sidebar");
    if (sidebar && !sidebar.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
      closeSidebar();
    }
  });

  /* ---------------- 阅读进度 ---------------- */
  var progressBar = document.getElementById("progressBar");
  function updateProgress() {
    if (!progressBar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;
    progressBar.style.width = pct.toFixed(2) + "%";
  }

  /* ---------------- 回到顶部 ---------------- */
  var toTop = document.getElementById("toTop");
  function updateToTop() {
    if (!toTop) return;
    if (window.scrollY > 700) toTop.classList.add("show");
    else toTop.classList.remove("show");
  }
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  var ticking = false;
  var topbar = document.querySelector(".topbar");
  function updateTopbar() {
    if (!topbar) return;
    topbar.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        updateProgress();
        updateToTop();
        updateTopbar();
        ticking = false;
      });
    },
    { passive: true }
  );
  updateProgress();
  updateToTop();
  updateTopbar();

  /* ---------------- 目录高亮 ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".side-nav .nav-item[href^='#']"));
  var sections = Array.prototype.slice.call(document.querySelectorAll(".doc-section[id]"));
  if (sections.length && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      (byId[id] = byId[id] || []).push(a);
    });
    var activeId = null;
    function setActive(id) {
      if (id === activeId) return;
      activeId = id;
      navLinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    }
    function currentSection() {
      var best = null;
      var probe = window.scrollY + (parseInt(getComputedStyle(root).getPropertyValue("--topbar-h"), 10) || 60) + 80;
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        if (s.offsetTop <= probe) best = s;
        else break;
      }
      if (best) setActive(best.id);
    }
    var spyTicking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (spyTicking) return;
        spyTicking = true;
        window.requestAnimationFrame(function () {
          currentSection();
          spyTicking = false;
        });
      },
      { passive: true }
    );
    currentSection();
  }

  /* ---------------- 复制按钮 ---------------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-copy-btn]") : null;
    if (!btn) return;
    var block = btn.closest(".code-block");
    var code = block ? block.querySelector("pre code") : null;
    if (!code) return;
    copyText(code.innerText)
      .then(function () {
        var old = btn.textContent;
        btn.textContent = "已复制 ✓";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = old;
          btn.classList.remove("copied");
        }, 1400);
      })
      .catch(function () {
        btn.textContent = "复制失败";
      });
  });

  /* ---------------- 站内搜索 ---------------- */
  var searchInput = document.getElementById("searchInput");
  var searchResults = document.getElementById("searchResults");
  var INDEX = window.DSH_SEARCH || [];
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function escapeReg(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function snippet(text, pos, len, q) {
    var start = Math.max(0, pos - 46);
    var end = Math.min(text.length, pos + len + 64);
    var raw = text.slice(start, end).replace(/\s+/g, " ");
    var safe = escapeHtml(raw);
    var re = new RegExp(escapeReg(escapeHtml(q)), "gi");
    return safe.replace(re, function (m) {
      return "<b>" + m + "</b>";
    });
  }
  function runSearch(q) {
    if (!searchResults) return;
    q = q.trim();
    if (q.length < 1) {
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }
    var lower = q.toLowerCase();
    var hits = [];
    INDEX.forEach(function (item) {
      var title = item.title || "";
      var text = item.text || "";
      var inTitle = title.toLowerCase().indexOf(lower) !== -1;
      var pos = text.toLowerCase().indexOf(lower);
      if (!inTitle && pos === -1) return;
      hits.push({ item: item, score: inTitle ? 0 : 1, pos: pos, inTitle: inTitle });
    });
    hits.sort(function (a, b) {
      return a.score - b.score;
    });
    hits = hits.slice(0, 8);
    if (!hits.length) {
      searchResults.innerHTML = '<div class="search-empty">没有找到「' + escapeHtml(q) + '」</div>';
      searchResults.hidden = false;
      return;
    }
    var html = hits
      .map(function (h) {
        var t = escapeHtml(h.item.title);
        var re = new RegExp("(" + escapeReg(escapeHtml(q)) + ")", "gi");
        if (h.inTitle) t = t.replace(re, "<b>$1</b>");
        var snip = h.pos >= 0 ? snippet(h.item.text, h.pos, q.length, q) : "";
        return (
          '<a class="search-hit" href="#' +
          h.item.id +
          '"><span class="hit-eyebrow">' +
          escapeHtml(h.item.eyebrow || "") +
          "</span>" +
          t +
          (snip ? '<span class="hit-snippet">…' + snip + "…</span>" : "") +
          "</a>"
        );
      })
      .join("");
    searchResults.innerHTML = html;
    searchResults.hidden = false;
  }
  if (searchInput && searchResults) {
    var timer = null;
    searchInput.addEventListener("input", function () {
      clearTimeout(timer);
      var v = searchInput.value;
      timer = setTimeout(function () {
        runSearch(v);
      }, 90);
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchResults.hidden = true;
        searchInput.blur();
      }
      if (e.key === "Enter") {
        var first = searchResults.querySelector(".search-hit");
        if (first) {
          window.location.hash = first.getAttribute("href");
          searchResults.hidden = true;
          closeSidebar();
        }
      }
    });
    document.addEventListener("click", function (e) {
      if (!searchResults.hidden && !e.target.closest(".search-wrap")) {
        searchResults.hidden = true;
      }
    });
    searchResults.addEventListener("click", function (e) {
      if (e.target.closest(".search-hit")) {
        searchResults.hidden = true;
        closeSidebar();
      }
    });
    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchInput.focus();
        searchInput.scrollIntoView({ block: "nearest" });
      }
    });
  }

  /* ---------------- 首页进入动画 ---------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("in");
      });
    }
  }
})();
