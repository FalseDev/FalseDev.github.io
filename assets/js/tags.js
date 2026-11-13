/* Tag filter and ordering for the reading pages. Vanilla, no dependencies.
 *
 * Configured by the <script> tag itself (see _includes/head-custom.html):
 *   data-meta="assets/blogs.json"   comma-separated payloads keyed by URL or channel id
 *   data-order="chrono,site"        ordering buttons to offer; first one is the default
 *   data-group="site"               when ordering by site, group under site headings
 *
 * Payload shape: { "<url or channel id>": { t: [tags], s: site, dt: date, d: note, v: video } }
 * A hover card is only built for entries that carry a note (d), so blog posts stay a plain list. */
(function () {
  var main = document.getElementById("main_content");
  var self = document.currentScript;
  if (!main || !self || !self.dataset.meta) return;

  var metas = self.dataset.meta.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var orders = (self.dataset.order || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var groupBy = self.dataset.group || "";

  var state = { tags: [], mode: "any", q: "", order: orders[0] || "" };
  try {
    decodeURIComponent(location.hash.replace(/^#/, "")).split("&").forEach(function (p) {
      var kv = p.split("=");
      if (kv[0] === "tags" && kv[1]) state.tags = kv[1].split(",").filter(Boolean);
      if (kv[0] === "mode" && kv[1]) state.mode = kv[1];
      if (kv[0] === "order" && kv[1]) state.order = kv[1];
    });
  } catch (e) {}

  var STORE = {};
  var all = [].slice.call(main.querySelectorAll("a"));
  all.forEach(function (a) {
    var m = a.href.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
    a.dataset.cid = m ? m[1] : a.href;
  });

  Promise.all(metas.map(function (src) {
    return fetch(src).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
  })).then(function (parts) {
    parts.forEach(function (p) { Object.keys(p).forEach(function (k) { STORE[k] = p[k]; }); });
    boot();
  });

  function key(a) {
    if (STORE[a.dataset.cid] !== undefined) return a.dataset.cid;
    return a.dataset.cid.replace(/\/$/, "");
  }

  function boot() {
    var links = all.filter(function (a) {
      a.dataset.cid = key(a);
      if (STORE[a.dataset.cid] === undefined) return false;
      a.dataset.cid = STORE[a.dataset.cid] !== undefined ? a.dataset.cid : "";
      return !!a.dataset.cid;
    });
    if (!links.length) return;

    links.forEach(function (a) {
      var rec = STORE[a.dataset.cid];
      a.classList.add("meta-linked");
      var li = a.closest("li") || a;
      if (rec.dt) li.dataset.date = rec.dt;
      if (rec.s) li.dataset.site = rec.s;
      if (rec.t) li.dataset.tags = rec.t.join(",");
    });
    var items = [];
    var seen = new Set();
    links.forEach(function (a) {
      var li = a.closest("li") || a;
      if (!seen.has(li)) { seen.add(li); items.push({ li: li, a: a, rec: STORE[a.dataset.cid] }); }
    });

    var counts = {};
    items.forEach(function (it) { (it.rec.t || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var tags = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x] || x.localeCompare(y); });

    // ---- filter and ordering bar
    var bar = document.createElement("div");
    bar.className = "tagbar";
    bar.innerHTML =
      '<div class="tagbar-head"><strong>Filter by tag</strong>' +
      '<input class="tagsearch" type="search" placeholder="search titles…" value="">' +
      (orders.length ? '<span class="tagsort" role="group"></span>' : "") +
      '<label class="tagmode"><input type="checkbox"> require every selected tag</label>' +
      '<button class="tagclear" type="button">clear</button>' +
      '<span class="tagcount"></span></div><div class="tagcloud"></div>';
    main.insertBefore(bar, main.firstChild);

    var cloud = bar.querySelector(".tagcloud");
    var more = document.createElement("details");
    more.className = "tagmore";
    var head = tags.slice(0, 14), tail = tags.slice(14);
    if (tail.length) {
      var sum = document.createElement("summary");
      sum.textContent = "+" + tail.length + " more tags";
      more.appendChild(sum);
    }
    function chipFor(t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = "#" + t + " " + counts[t];
      b.dataset.tag = t;
      return b;
    }
    head.forEach(function (t) { cloud.appendChild(chipFor(t)); });
    tail.forEach(function (t) { more.appendChild(chipFor(t)); });
    if (tail.length) cloud.appendChild(more);

    var search = bar.querySelector(".tagsearch");
    search.value = state.q;
    search.addEventListener("input", function () { state.q = search.value.trim().toLowerCase(); apply(); });
    var modeBox = bar.querySelector(".tagmode input");
    modeBox.checked = state.mode === "all";
    modeBox.addEventListener("change", function () { state.mode = modeBox.checked ? "all" : "any"; apply(); });
    bar.querySelector(".tagclear").addEventListener("click", function () {
      state.tags = []; state.q = ""; search.value = ""; apply();
    });
    cloud.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      var t = b.dataset.tag, i = state.tags.indexOf(t);
      if (i < 0) state.tags.push(t); else state.tags.splice(i, 1);
      apply();
    });

    var sortBox = bar.querySelector(".tagsort");
    if (sortBox) {
      orders.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sortbtn";
        b.dataset.order = o;
        b.textContent = o === "site" ? "by site" : "newest first";
        sortBox.appendChild(b);
      });
      sortBox.addEventListener("click", function (e) {
        var b = e.target.closest(".sortbtn");
        if (!b) return;
        state.order = b.dataset.order;
        apply();
      });
    }

    // ---- hover card, only for entries that carry a description
    var card = document.createElement("div");
    card.className = "hovercard";
    card.hidden = true;
    document.body.appendChild(card);
    var timer = null;
    var hoverable = !!(window.matchMedia && window.matchMedia("(hover: hover)").matches);

    function fill(a) {
      var rec = STORE[a.dataset.cid];
      if (!rec || !rec.d) return false;
      var html = "";
      if (rec.v) html += '<img src="https://i.ytimg.com/vi/' + rec.v + '/mqdefault.jpg" alt="" width="320" height="180" ' +
        'onerror="this.style.display=\'none\'">';
      html += "<h3>" + a.textContent + "</h3><p>" + rec.d + "</p>";
      if (rec.k) html += '<p class="hoverlatest">' + rec.k + (rec.dt ? " · " + rec.dt : "") + "</p>";
      if (rec.t) html += '<p class="hovertags">' + rec.t.map(function (t) { return "#" + t; }).join(" ") + "</p>";
      card.innerHTML = html;
      return true;
    }
    function place(a) {
      var r = a.getBoundingClientRect();
      card.style.left = card.style.top = "0px";
      card.hidden = false;
      var left = Math.min(Math.max(8, r.left), window.innerWidth - card.offsetWidth - 8);
      var top = r.bottom + 8;
      if (top + card.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - card.offsetHeight - 8);
      card.style.left = left + "px";
      card.style.top = top + "px";
    }
    function show(a) { clearTimeout(timer); timer = setTimeout(function () { if (fill(a)) place(a); }, hoverable ? 120 : 0); }
    function hide() { clearTimeout(timer); card.hidden = true; }
    links.forEach(function (a) {
      if (hoverable) {
        a.addEventListener("mouseenter", function () { show(a); });
        a.addEventListener("mouseleave", hide);
      }
      a.addEventListener("focus", function () { if (fill(a)) place(a); });
      a.addEventListener("blur", hide);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
    window.addEventListener("scroll", hide, { passive: true });

    // ---- apply: filter, then order, then collapse empty sections
    function matches(it) {
      var t = it.rec.t || [];
      if (state.q && it.a.textContent.trim().toLowerCase().indexOf(state.q) < 0) return false;
      if (!state.tags.length) return true;
      if (state.mode === "all") return state.tags.every(function (x) { return t.indexOf(x) >= 0; });
      return state.tags.some(function (x) { return t.indexOf(x) >= 0; });
    }

    function sortItems(list) {
      if (!state.order) return list.slice();
      return list.slice().sort(function (x, y) {
        if (state.order === "site") {
          var s = (x.rec.s || "").toLowerCase(), u = (y.rec.s || "").toLowerCase();
          if (s !== u) return s < u ? -1 : 1;
          return (y.rec.dt || "").localeCompare(x.rec.dt || "");
        }
        return (y.rec.dt || "").localeCompare(x.rec.dt || "");
      });
    }

    function apply() {
      var shown = 0;
      items.forEach(function (it) {
        var ok = matches(it);
        it.li.classList.toggle("hidden", !ok);
        it.sitehead = ok ? (it.rec.s || "") : null;
        if (ok) shown++;
      });

      var grouping = groupBy === "site" && state.order === "site";
      document.body.classList.toggle("by-site", grouping);
      [].slice.call(main.querySelectorAll("li.sitehead")).forEach(function (n) { n.remove(); });

      if (state.order) {
        var lists = [];
        var index = new Map();
        items.forEach(function (it) {
          var ul = it.li.parentElement;
          if (!ul) return;
          if (!index.has(ul)) { index.set(ul, { ul: ul, items: [] }); lists.push(index.get(ul)); }
          index.get(ul).items.push(it);
        });
        lists.forEach(function (box) {
          var ordered = sortItems(box.items);
          ordered.forEach(function (it) { box.ul.appendChild(it.li); });
          if (!grouping) return;
          var last = null, headLi = null, n = 0;
          ordered.forEach(function (it) {
            var s = it.rec.s || "";
            if (s !== last) {
              if (headLi) headLi.appendChild(countSpan(n));
              headLi = document.createElement("li");
              headLi.className = "sitehead";
              headLi.appendChild(document.createTextNode(s));
              box.ul.appendChild(headLi);
              last = s;
              n = 0;
            }
            n++;
            box.ul.appendChild(it.li);
          });
          if (headLi) headLi.appendChild(countSpan(n));
          [].slice.call(box.ul.querySelectorAll("li.sitehead")).forEach(function (h) {
            var next = h.nextElementSibling, empty = true;
            while (next && !next.classList.contains("sitehead")) {
              if (!next.classList.contains("hidden")) { empty = false; break; }
              next = next.nextElementSibling;
            }
            if (empty) h.classList.add("hidden");
          });
        });
      }

      // collapse empty sections: h1 first, then h2, so a sub-heading's own empty
      // state is the last word on its blocks
      function collapse(level) {
        [].slice.call(main.querySelectorAll(level)).forEach(function (h) {
          var n = h.nextElementSibling, hits = 0, blocks = [];
          while (n && n.tagName !== "H1" && !(level === "h2" && n.tagName === "H2")) {
            if (n.tagName === "UL") hits += n.querySelectorAll("li:not(.hidden):not(.sitehead)").length;
            blocks.push(n); n = n.nextElementSibling;
          }
          var empty = (state.tags.length || state.q) ? hits === 0 : false;
          h.classList.toggle("hidden", empty);
          blocks.forEach(function (b) { b.classList.toggle("hidden", empty); });
        });
      }
      collapse("h1");
      collapse("h2");

      var none = bar.querySelector(".tagnone");
      if (!shown && (state.tags.length || state.q)) {
        if (!none) {
          none = document.createElement("p");
          none.className = "tagnone";
          none.innerHTML = 'Nothing under those tags. <button type="button" class="tagclear">clear</button>';
          bar.appendChild(none);
          none.querySelector(".tagclear").addEventListener("click", function () {
            state.tags = []; state.q = ""; search.value = ""; apply();
          });
        }
      } else if (none) none.remove();

      [].slice.call(cloud.querySelectorAll(".chip")).forEach(function (b) {
        b.classList.toggle("on", state.tags.indexOf(b.dataset.tag) >= 0);
      });
      if (sortBox) [].slice.call(sortBox.children).forEach(function (b) { b.classList.toggle("on", b.dataset.order === state.order); });
      if (tail.length) {
        var active = state.tags.filter(function (t) { return tail.indexOf(t) >= 0; });
        more.querySelector("summary").textContent = active.length ? active.map(function (t) { return "#" + t; }).join(" ") : "+" + tail.length + " more tags";
        if (active.length) more.open = true;
      }
      bar.querySelector(".tagcount").textContent = shown + " of " + items.length + (state.tags.length || state.q ? " shown" : "");

      var hash = "#";
      if (state.tags.length) hash += "tags=" + state.tags.join(",");
      if (state.mode === "all") hash += (state.tags.length ? "&" : "") + "mode=all";
      if (state.order && state.order !== orders[0]) hash += (hash.length > 1 ? "&" : "") + "order=" + state.order;
      try {
        if (hash !== "#") history.replaceState(null, "", hash);
        else if (location.hash) history.replaceState(null, "", location.pathname);
      } catch (e) {}
    }

    function countSpan(n) {
      var s = document.createElement("span");
      s.className = "sitecount";
      s.textContent = n;
      return s;
    }

    apply();
  }
})();
