/* ==========================================================
   LVL — site script
   Product data, garment mockups, cart + cart drawer, mega menu,
   and page logic. The cart lives in localStorage so it carries
   across pages.
   ========================================================== */
(function () {
  'use strict';

  var LOGO = 'assets/lvl-logo.png';

  /* ---------------- data (from js/catalog.js) ---------------- */
  var CATALOG = window.LVL_CATALOG;
  var C = CATALOG.C, FAMILIES = CATALOG.FAMILIES, PRODUCTS = CATALOG.PRODUCTS, MYSTERY = CATALOG.MYSTERY,
      COLLECTIONS = CATALOG.COLLECTIONS, CATS = CATALOG.CATS, SIZES = CATALOG.SIZES, SHIPPING = CATALOG.SHIPPING;
  var ALL = PRODUCTS.concat([MYSTERY]);

  function byId(id) { return ALL.find(function (p) { return p.id === id; }); }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2).replace('.00', ''); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function qs(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function isSoldOut(p) { return !!p.soldOut; }

  /* ---------------- garment mockups ----------------
     Each garment is drawn in a 300×300 box: base shape, soft
     shading, seams and trims, then the LVL logo print. */
  var uid = 0;
  function light(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
  }
  function line(d, color, w, op) {
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (op ? ' opacity="' + op + '"' : '') + '/>';
  }

  var SHAPES = {
    tee: {
      body: 'M104 44 L66 58 L22 100 L52 136 L80 118 L80 266 L220 266 L220 118 L248 136 L278 100 L234 58 L196 44 Q150 80 104 44 Z',
      bodyBack: 'M104 44 L66 58 L22 100 L52 136 L80 118 L80 266 L220 266 L220 118 L248 136 L278 100 L234 58 L196 44 Q150 58 104 44 Z',
      trims: function (d, back) {
        return line(back ? 'M104 44 Q150 58 196 44' : 'M104 44 Q150 80 196 44', d, 7) +
          line('M24 102 L52 134', d, 3) + line('M276 102 L248 134', d, 3) +
          line('M80 257 L220 257', d, 1.5, 0.6) +
          line('M98 150 Q105 205 96 252', d, 1.5, 0.35) + line('M204 158 Q197 210 205 250', d, 1.5, 0.35);
      },
      prints: { chest: [164, 94, 44, 23], center: [96, 102, 108, 56], tonal: [90, 108, 120, 62], back: [74, 86, 152, 79], mystery: [100, 96, 100, 120] }
    },
    hoodie: {
      body: 'M100 64 L60 76 L26 206 L56 214 L82 146 L82 272 L218 272 L218 146 L244 214 L274 206 L240 76 L200 64 Z',
      under: 'M100 66 Q100 8 150 8 Q200 8 200 66 Q176 92 150 94 Q124 92 100 66 Z',
      trims: function (d, back) {
        if (back) return line('M100 66 Q150 104 200 66', d, 2, 0.5) + line('M28 207 L56 214', d, 4) + line('M272 207 L244 214', d, 4) + line('M82 262 L218 262', d, 4);
        return '<path d="M116 64 Q150 24 184 64 Q150 88 116 64 Z" fill="rgba(0,0,0,.42)"/>' +
          line('M104 196 L196 196 L210 250 L90 250 Z', d, 2, 0.7) +
          line('M28 207 L56 214', d, 4) + line('M272 207 L244 214', d, 4) + line('M82 262 L218 262', d, 4) +
          '<path d="M138 86 L134 140 M162 86 L166 140" stroke="#D5D8DD" stroke-width="3" stroke-linecap="round" fill="none"/>' +
          '<rect x="131" y="138" width="6" height="12" fill="#9DA1A9"/><rect x="163" y="138" width="6" height="12" fill="#9DA1A9"/>';
      },
      prints: { chest: [162, 106, 38, 20], center: [102, 136, 96, 50], tonal: [96, 132, 108, 56], back: [84, 98, 132, 68] }
    },
    crew: {
      body: 'M108 50 L62 64 L26 206 L56 214 L82 146 L82 272 L218 272 L218 146 L244 214 L274 206 L238 64 L192 50 Q150 84 108 50 Z',
      bodyBack: 'M108 50 L62 64 L26 206 L56 214 L82 146 L82 272 L218 272 L218 146 L244 214 L274 206 L238 64 L192 50 Q150 62 108 50 Z',
      trims: function (d, back) {
        return line(back ? 'M108 50 Q150 62 192 50' : 'M108 50 Q150 84 192 50', d, 9) +
          line('M28 207 L56 214', d, 5) + line('M272 207 L244 214', d, 5) + line('M82 261 L218 261', d, 6) +
          line('M100 150 Q106 200 98 250', d, 1.5, 0.3);
      },
      prints: { chest: [160, 100, 38, 20], center: [100, 108, 100, 52], tonal: [92, 108, 116, 60], back: [84, 94, 132, 68] }
    },
    jacket: {
      body: 'M112 46 L62 62 L26 206 L56 214 L82 146 L82 272 L218 272 L218 146 L244 214 L274 206 L238 62 L188 46 L150 70 Z',
      bodyBack: 'M112 46 L62 62 L26 206 L56 214 L82 146 L82 272 L218 272 L218 146 L244 214 L274 206 L238 62 L188 46 Q150 56 112 46 Z',
      trims: function (d, back, col) {
        var flap = light(col) ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.08)';
        if (back) return line('M112 46 Q150 56 188 46', d, 8) + line('M82 258 L218 258', d, 2) + line('M28 207 L56 214', d, 5) + line('M272 207 L244 214', d, 5) + line('M82 140 L218 140', d, 1.5, 0.5);
        return '<path d="M112 46 L132 98 L150 70 Z M188 46 L168 98 L150 70 Z" fill="' + flap + '" stroke="' + d + '" stroke-width="1.5"/>' +
          line('M150 70 L150 272', d, 2) +
          [110, 150, 190, 230].map(function (y) { return '<circle cx="150" cy="' + y + '" r="3.6" fill="#C9CCD1" stroke="rgba(0,0,0,.4)"/>'; }).join('') +
          line('M98 118 L136 118 L136 150 L98 150 Z M164 118 L202 118 L202 150 L164 150 Z', d, 1.5) +
          line('M98 126 L136 126 M164 126 L202 126', d, 1.5) +
          line('M82 258 L218 258', d, 2) + line('M28 207 L56 214', d, 5) + line('M272 207 L244 214', d, 5);
      },
      prints: { chest: [102, 94, 30, 16], back: [74, 150, 152, 79] }
    },
    pants: {
      body: 'M88 26 L212 26 L224 276 L166 276 L150 116 L134 276 L76 276 Z',
      trims: function (d) {
        return '<path d="M88 26 L212 26 L212 42 L88 42 Z" fill="rgba(0,0,0,.18)"/>' +
          line('M150 42 L150 104', d, 2) +
          line('M80 150 L122 150 L122 206 L82 206 Z M178 150 L220 150 L218 206 L178 206 Z', d, 1.5) +
          line('M80 162 L122 162 M178 162 L220 162', d, 1.5) +
          line('M104 26 L104 44 M196 26 L196 44 M150 26 L150 42', d, 3) +
          line('M78 266 L134 266 M166 266 L222 266', d, 1.5, 0.6);
      },
      prints: { thigh: [180, 214, 34, 18] }
    },
    shorts: {
      body: 'M80 64 L220 64 L234 206 L164 214 L150 136 L136 214 L66 206 Z',
      trims: function (d) {
        return '<path d="M80 64 L220 64 L221 82 L79 82 Z" fill="rgba(0,0,0,.18)"/>' +
          '<path d="M146 82 Q140 102 136 114 M154 82 Q160 102 164 114" stroke="#D5D8DD" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
          line('M84 100 Q92 124 74 140 M216 100 Q208 124 226 140', d, 1.5) +
          line('M68 198 L136 205 M164 205 L232 198', d, 1.5, 0.6);
      },
      prints: { thigh: [176, 160, 34, 18] }
    },
    cap: {
      body: 'M64 178 Q64 82 150 82 Q236 82 236 178 Z',
      trims: function (d, back, col) {
        var brim = light(col) ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)';
        return '<path d="M64 178 L236 178 Q278 184 288 202 Q252 214 212 202 L64 194 Z" fill="' + col + '" stroke="' + d + '" stroke-width="2"/>' +
          '<path d="M64 178 L236 178 Q278 184 288 202 Q252 214 212 202 L64 194 Z" fill="' + brim + '"/>' +
          line('M150 84 L150 178 M106 92 Q98 140 102 178 M194 92 Q202 140 198 178', d, 1.5, 0.55) +
          '<circle cx="150" cy="84" r="6" fill="' + col + '" stroke="' + d + '" stroke-width="2"/>' +
          '<circle cx="120" cy="110" r="2.5" fill="' + d + '"/><circle cx="180" cy="110" r="2.5" fill="' + d + '"/>';
      },
      prints: { front: [114, 116, 72, 38], tonal: [112, 114, 76, 40] }
    }
  };

  /* view: 'front' | 'back' | 'detail' */
  function garment(p, color, view, label) {
    view = view || 'front';
    var s = SHAPES[p.shape];
    var id = 'g' + (++uid);
    var isLight = light(color);
    var detail = isLight ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.16)';
    var outline = isLight ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.14)';
    var back = view === 'back';
    var body = (back && s.bodyBack) || s.body;

    var printKey = back ? (p.back ? 'back' : null) : p.print;
    var pr = printKey && s.prints[printKey];
    var vb = '0 0 300 300';
    if (view === 'detail') {
      var dp = s.prints[p.print] || [100, 100, 100, 100];
      var pad = Math.max(dp[2], dp[3]) * 0.9;
      var cx = dp[0] + dp[2] / 2, cy = dp[1] + dp[3] / 2, size = Math.max(dp[2], dp[3]) + pad * 2;
      vb = (cx - size / 2) + ' ' + (cy - size / 2) + ' ' + size + ' ' + size;
    }

    var print = '';
    if (pr && printKey === 'mystery') {
      print = '<text x="150" y="196" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="900" font-size="118" fill="url(#' + id + 'c)" stroke="rgba(0,0,0,.35)" stroke-width="1.5">?</text>';
    } else if (pr && printKey === 'tonal') {
      // embroidered tone-on-tone: the logo, desaturated, barely lifted off the fabric
      print = '<image href="' + LOGO + '" x="' + pr[0] + '" y="' + pr[1] + '" width="' + pr[2] + '" height="' + pr[3] + '" preserveAspectRatio="xMidYMid meet" opacity="' + (isLight ? 0.32 : 0.26) + '" style="filter:grayscale(1)' + (isLight ? ' brightness(.7)' : ' brightness(1.6)') + '"/>';
    } else if (pr) {
      print = '<image href="' + LOGO + '" x="' + pr[0] + '" y="' + pr[1] + '" width="' + pr[2] + '" height="' + pr[3] + '" preserveAspectRatio="xMidYMid meet"/>';
    }

    return '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" ' + (label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"') + '>' +
      '<defs>' +
      '<linearGradient id="' + id + 's" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>' +
      '<linearGradient id="' + id + 'v" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>' +
      '<linearGradient id="' + id + 'c" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#C9CDD3"/><stop offset=".55" stop-color="#6E737B"/><stop offset=".7" stop-color="#F2F3F5"/><stop offset="1" stop-color="#9DA1A9"/></linearGradient>' +
      '<filter id="' + id + 'd" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".18"/></filter>' +
      '</defs>' +
      '<g filter="url(#' + id + 'd)">' +
      (s.under ? '<path d="' + s.under + '" fill="' + color + '" stroke="' + outline + '" stroke-width="1.5"/>' : '') +
      '<path d="' + body + '" fill="' + color + '" stroke="' + outline + '" stroke-width="1.5" stroke-linejoin="round"/>' +
      '</g>' +
      (s.under ? '<path d="' + s.under + '" fill="url(#' + id + 's)"/>' : '') +
      '<path d="' + body + '" fill="url(#' + id + 's)"/>' +
      '<path d="' + body + '" fill="url(#' + id + 'v)"/>' +
      s.trims(detail, back, color) +
      print +
      '</svg>';
  }

  /* ---------------- cart store ---------------- */
  var KEY = 'lvl-cart';
  var mem = [];
  function getCart() { try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : mem; } catch (e) { return mem; } }
  function setCart(c) { mem = c; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} updateCount(true); renderDrawer(); }
  function cartCount() { return getCart().reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartTotals(cart, express) {
    var sub = cart.reduce(function (a, l) { return a + l.qty * l.price; }, 0);
    var ship = express ? SHIPPING.express : (sub === 0 || sub >= SHIPPING.freeOver ? 0 : SHIPPING.standard);
    return { sub: sub, ship: ship, total: sub + ship };
  }
  function addToCart(p, colorIdx, size) {
    var col = p.colors[colorIdx];
    var key = p.id + '|' + col.n + '|' + size;
    var cart = getCart().slice();
    var l = cart.find(function (x) { return x.key === key; });
    if (l) l.qty += 1;
    else cart.push({ key: key, id: p.id, name: p.name, color: col.n, hex: col.h, size: size, price: p.price, qty: 1 });
    setCart(cart);
    openDrawer();
  }

  /* ---------------- header, menus, drawer, footer ---------------- */
  function shopLink(params) {
    var q = Object.keys(params || {}).filter(function (k) { return params[k]; })
      .map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    return 'shop.html' + (q ? '?' + q : '');
  }

  function megaShop() {
    var groups = ['Tops', 'Bottoms', 'Accessories', 'Outerwear'].map(function (c) {
      var types = [];
      PRODUCTS.forEach(function (p) { if (p.cat === c && types.indexOf(p.type) < 0) types.push(p.type); });
      return '<div><h4 class="label"><a href="' + shopLink({ cat: c }) + '">' + c + '</a></h4>' +
        types.map(function (t) { return '<a href="' + shopLink({ cat: c, type: t }) + '">' + t + '</a>'; }).join('') + '</div>';
    }).join('');
    var colors = '<div><h4 class="label">Shop by color</h4><div class="mega__colors">' + FAMILIES.map(function (f) {
      return '<a href="' + shopLink({ color: f.n }) + '"><span class="dot" style="background:' + f.h + '"></span>' + f.n + '</a>';
    }).join('') + '</div></div>';
    var feat = byId('chrome-club-tee');
    var promo = '<a class="mega__promo" href="' + shopLink({ collection: 'Chrome Club' }) + '"><div class="mega__promo-img">' + garment(feat, feat.colors[0].h) + '</div><span class="label">New: Chrome Club</span></a>';
    return '<div class="mega" role="region" aria-label="Shop menu"><div class="wrap mega__in">' + groups + colors + promo + '</div></div>';
  }
  function megaCollections() {
    return '<div class="mega" role="region" aria-label="Collections menu"><div class="wrap mega__tiles">' + COLLECTIONS.map(function (c) {
      var p = byId(c.show);
      return '<a class="mega__tile" href="' + shopLink({ collection: c.n }) + '" style="background:' + c.bg + ';color:' + (c.light ? '#fff' : '#0B0B0B') + '">' +
        '<div class="mega__tile-img">' + garment(p, p.colors[c.color].h) + '</div><span class="label">' + c.n + '</span></a>';
    }).join('') + '</div></div>';
  }

  function header(active) {
    return '<a class="announce label" href="index.html#mystery">Mystery Box 01 is live now — shop it →</a>' +
      '<header class="header"><div class="wrap header__in">' +
      '<button class="menu-btn" aria-label="Open menu" aria-expanded="false" data-menu-open><span></span><span></span></button>' +
      '<a class="header__logo" href="index.html" aria-label="LVL home"><img src="' + LOGO + '" alt="LVL"></a>' +
      '<nav class="nav" aria-label="Main">' +
      '<a href="' + shopLink({ sort: 'new' }) + '"' + (active === 'new' ? ' aria-current="page"' : '') + '>New in</a>' +
      '<a href="all.html"' + (active === 'all' ? ' aria-current="page"' : '') + '>All clothing</a>' +
      '<div class="nav-item"><button class="nav-btn" aria-expanded="false">Shop</button>' + megaShop() + '</div>' +
      '<div class="nav-item"><button class="nav-btn" aria-expanded="false">Collections</button>' + megaCollections() + '</div>' +
      '<a href="index.html#mystery">Mystery box</a>' +
      '</nav>' +
      '<div class="header__tools">' +
      '<a class="cart-btn" href="cart.html" data-open-drawer aria-label="Shopping bag">Bag (<span data-count>0</span>)</a>' +
      '</div></div></header>' +
      mobileMenu() + drawerShell();
  }

  function mobileMenu() {
    return '<div class="mmenu" data-mmenu aria-hidden="true"><div class="mmenu__panel" role="dialog" aria-label="Menu">' +
      '<div class="mmenu__top"><img src="' + LOGO + '" alt="LVL"><button class="drawer__close" data-menu-close aria-label="Close menu">×</button></div>' +
      '<a class="mmenu__big" href="' + shopLink({ sort: 'new' }) + '">New in</a>' +
      '<a class="mmenu__big" href="all.html">All clothing</a>' +
      CATS.slice(1).map(function (c) { return '<a class="mmenu__big" href="' + shopLink({ cat: c }) + '">' + c + '</a>'; }).join('') +
      '<a class="mmenu__big" href="index.html#mystery">Mystery box</a>' +
      '<h4 class="label muted">Collections</h4>' +
      COLLECTIONS.map(function (c) { return '<a href="' + shopLink({ collection: c.n }) + '">' + c.n + '</a>'; }).join('') +
      '<h4 class="label muted">Shop by color</h4><div class="mega__colors">' +
      FAMILIES.map(function (f) { return '<a href="' + shopLink({ color: f.n }) + '"><span class="dot" style="background:' + f.h + '"></span>' + f.n + '</a>'; }).join('') +
      '</div></div></div>';
  }

  function drawerShell() {
    return '<div class="drawer" data-drawer aria-hidden="true"><div class="drawer__panel" role="dialog" aria-label="Your bag">' +
      '<div class="drawer__head"><h2 class="display" style="font-size:24px">Your bag</h2><button class="drawer__close" data-drawer-close aria-label="Close bag">×</button></div>' +
      '<div class="drawer__body" data-drawer-body></div>' +
      '<div class="drawer__foot" data-drawer-foot></div>' +
      '</div></div>';
  }

  function renderDrawer() {
    var body = $('[data-drawer-body]'), foot = $('[data-drawer-foot]');
    if (!body) return;
    var c = getCart();
    if (!c.length) {
      body.innerHTML = '<div class="empty" style="padding:48px 0"><p class="label">Your bag is empty!</p><a class="btn" href="shop.html">Shop the drop</a></div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = c.map(function (l, i) {
      var p = byId(l.id) || PRODUCTS[0];
      return '<div class="mini"><div class="mini__img">' + garment(p, l.hex) + '</div>' +
        '<div><b>' + esc(l.name) + '</b><div class="muted">' + esc(l.color) + ' · ' + esc(l.size) + ' · Qty ' + l.qty + '</div>' +
        '<button class="line__remove" data-drawer-remove="' + i + '">Remove</button></div><span>' + money(l.qty * l.price) + '</span></div>';
    }).join('');
    var t = cartTotals(c);
    var left = Math.max(0, 100 - t.sub);
    foot.innerHTML = '<p class="label muted" style="margin:0 0 8px">' + (left > 0 ? money(left) + ' away from free shipping' : 'You unlocked free shipping') + '</p>' +
      '<div class="meter" style="margin-bottom:14px"><i style="width:' + Math.min(100, t.sub) + '%"></i></div>' +
      '<div class="summary__total" style="margin-bottom:14px"><span>Estimated total</span><span>' + money(t.sub) + '</span></div>' +
      '<a class="btn btn--block" href="checkout.html">Checkout</a>' +
      '<a class="btn btn--ghost btn--block" href="cart.html" style="margin-top:8px">View bag</a>';
  }

  var lastFocus = null;
  function openDrawer() {
    var d = $('[data-drawer]'); if (!d) return;
    lastFocus = document.activeElement;
    renderDrawer(); d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');
    setTimeout(function () { var x = $('[data-drawer-close]'); if (x) x.focus(); }, 50);
  }
  function closeDrawer() {
    var d = $('[data-drawer]'); if (!d || !d.classList.contains('open')) return;
    d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); document.body.classList.remove('locked');
    if (lastFocus) lastFocus.focus();
  }
  function openMenu(open) {
    var m = $('[data-mmenu]'); if (!m) return;
    m.classList.toggle('open', open); m.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('locked', open);
    $('[data-menu-open]').setAttribute('aria-expanded', open);
  }

  /* ---------------- effects: Pro-Glide page changes + silver confetti ---------------- */
  var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Pro-Glide: clicking a page link lifts the content out (220ms), then the
  // next page glides in (560ms, smooth expo-out curve). Runs the same way every time, in every browser,
  // even when the site is opened from your computer. The header never moves.
  var FADE_MS = 220;   // leave time (match glideOut in css)
  var GLIDE_IN_MS = 560;   // arrive time (match glideIn in css)
  var fetched = {};
  function prefetch(href) {
    if (fetched[href] || location.protocol === 'file:') return;
    fetched[href] = 1;
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href; l.as = 'document';
    document.head.appendChild(l);
  }
  function pageLink(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return null;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return null; }
    if (url.origin !== location.origin) return null;                        // Stripe, socials
    if (!/\.html$/.test(url.pathname) && !/\/$/.test(url.pathname)) return null;
    if (url.pathname === location.pathname && url.search === location.search) return null;  // same page / #anchor
    return url;
  }
  function refresh(el) {            // replay the fade on content that re-draws in place
    if (REDUCE || !el) return;
    el.classList.remove('refresh'); void el.offsetWidth; el.classList.add('refresh');
  }
  function wireLeap() {
    function intent(e) {
      var url = pageLink(e.target.closest && e.target.closest('a[href]'));
      if (url) prefetch(url.pathname + url.search);
    }
    document.addEventListener('pointerover', intent, { passive: true });
    document.addEventListener('touchstart', intent, { passive: true });
    document.addEventListener('focusin', intent);

    // fade out, then go
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var url = pageLink(e.target.closest('a[href]'));
      if (!url) return;
      e.preventDefault();
      if (REDUCE) { location.href = url.href; return; }
      try { sessionStorage.setItem('lvl-fade', '1'); } catch (err) {}
      document.documentElement.classList.add('leaving');
      setTimeout(function () { location.href = url.href; }, FADE_MS);
    });

    // arrived from a fade: let the fade-in finish, then tidy up
    try { sessionStorage.removeItem('lvl-fade'); } catch (err) {}
    if (document.documentElement.classList.contains('arriving')) {
      setTimeout(function () { document.documentElement.classList.remove('arriving'); }, GLIDE_IN_MS + 50);
    }
    // browser back button: never come back to a faded-out page
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) document.documentElement.classList.remove('leaving', 'arriving');
    });
  }

  // Silver confetti burst from an element (buttons: Add to bag, Buy, Pay)
  var SILVER = ['linear-gradient(135deg,#FFFFFF,#9DA1A9)', 'linear-gradient(135deg,#E6E8EB,#5E636B)',
                'linear-gradient(135deg,#F6F7F8,#7C818A 55%,#FFFFFF)', 'linear-gradient(135deg,#C9CDD2,#4A4D53)',
                '#AEB2B9', 'linear-gradient(135deg,#FFFFFF,#BFC3C9)'];
  function confetti(el) {
    if (REDUCE || !el || !el.getBoundingClientRect || !document.body.animate) return;
    var r = el.getBoundingClientRect();
    var x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
    var n = 44;
    for (var i = 0; i < n; i++) {
      var bit = document.createElement('span');
      bit.className = 'confetti-bit';
      var shape = i % 3;                                   // 0 square, 1 strip, 2 dot
      var w = shape === 1 ? 3 + Math.random() * 2 : 5 + Math.random() * 4;
      var h = shape === 1 ? 9 + Math.random() * 5 : w;
      bit.style.cssText = 'left:' + (x0 + (Math.random() - 0.5) * r.width * 0.6) + 'px;top:' + y0 + 'px;width:' + w + 'px;height:' + h + 'px;' +
        'background:' + SILVER[i % SILVER.length] + ';border-radius:' + (shape === 2 ? '50%' : '1px');
      document.body.appendChild(bit);
      var ang = (-90 + (Math.random() - 0.5) * 150) * Math.PI / 180;   // upward fan
      var v = 260 + Math.random() * 320;                                // px/s
      var vx = Math.cos(ang) * v, vy = Math.sin(ang) * v, g = 900;
      var dur = 900 + Math.random() * 500, spin = (Math.random() - 0.5) * 1080, frames = [];
      for (var k = 0; k <= 6; k++) {
        var t = (k / 6) * dur / 1000;
        frames.push({
          transform: 'translate(' + (vx * t) + 'px,' + (vy * t + 0.5 * g * t * t) + 'px) rotate(' + (spin * k / 6) + 'deg) rotateX(' + (k * 120) + 'deg)',
          opacity: k < 4 ? 1 : 1 - (k - 3) / 3
        });
      }
      var anim = bit.animate(frames, { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      anim.onfinish = (function (b) { return function () { b.remove(); }; })(bit);
    }
  }

  function wireChrome(page) {
    // cart drawer
    $$('[data-open-drawer]').forEach(function (a) {
      a.addEventListener('click', function (e) { if (page === 'cart' || page === 'checkout') return; e.preventDefault(); openDrawer(); });
    });
    var d = $('[data-drawer]');
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-drawer-close]')) closeDrawer();
      var r = e.target.closest('[data-drawer-remove]');
      if (r) { var c = getCart().slice(); c.splice(+r.dataset.drawerRemove, 1); setCart(c); }
    });
    // mobile menu
    $('[data-menu-open]').addEventListener('click', function () { openMenu(true); });
    var m = $('[data-mmenu]');
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-menu-close]') || e.target.closest('a')) openMenu(false);
    });
    // mega menus: hover on desktop (CSS), click/keyboard everywhere
    $$('.nav-item').forEach(function (it) {
      var b = $('.nav-btn', it);
      b.addEventListener('click', function () {
        var open = !it.classList.contains('open');
        $$('.nav-item').forEach(function (x) { x.classList.remove('open'); $('.nav-btn', x).setAttribute('aria-expanded', 'false'); });
        it.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav-item')) $$('.nav-item').forEach(function (x) { x.classList.remove('open'); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeDrawer(); openMenu(false);
      $$('.nav-item').forEach(function (x) { x.classList.remove('open'); });
    });
  }

  function footer() {
    var popular = [
      ['Chrome tee', shopLink({ collection: 'Chrome Club' })], ['Black hoodie', shopLink({ cat: 'Outerwear', color: 'Blacks' })],
      ['Cargo pants', shopLink({ cat: 'Bottoms', type: 'Cargos' })], ['Mystery box', 'index.html#mystery'],
      ['Caps', shopLink({ cat: 'Accessories' })], ['Olive', shopLink({ color: 'Greens' })],
      ['Night Shift', shopLink({ collection: 'Night Shift' })], ['Sale', shopLink({ sort: 'sale' })], ['All clothing', 'all.html']
    ];
    return '<footer class="footer"><div class="wrap">' +
      '<div class="footer__top">' +
      '<div class="footer__brand"><img class="footer__logo" src="' + LOGO + '" alt="LVL"><p class="muted">Heavyweight basics and outerwear, built in small runs.</p></div>' +
      '<div class="footer__cols">' +
      '<div><h4 class="label">Connect with us</h4><a href="#">Instagram</a><a href="#">TikTok</a><a href="#">YouTube</a><a href="#">WhatsApp</a><a href="#">Email us</a></div>' +
      '<div><h4 class="label">Order support</h4><a href="#">Track your order</a><a href="#">Shipping</a><a href="#">Returns &amp; exchanges</a><a href="#">Size guide</a><a href="#">FAQs</a></div>' +
      '<div><h4 class="label">We are LVL</h4><a href="#">Our story</a><a href="#">Collaborations</a><a href="#">Careers</a><a href="#">Press</a></div>' +
      '</div></div>' +
      '<div class="footer__popular"><h4 class="label">Popular searches</h4><div class="chips">' +
      popular.map(function (t) { return '<a class="chip" href="' + t[1] + '">' + t[0] + '</a>'; }).join('') + '</div></div>' +
      '<div class="footer__bottom label"><span>© 2026 LVL</span><span>Seattle, WA</span></div>' +
      '</div></footer>';
  }
  function updateCount(bump) {
    var n = cartCount();
    $$('[data-count]').forEach(function (el) { el.textContent = n; });
    if (bump) $$('.cart-btn').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }

  /* ---------------- shared bits ---------------- */
  function priceHtml(p) {
    return p.was ? '<span class="sale">' + money(p.price) + '</span> <s class="was">' + money(p.was) + '</s>' : money(p.price);
  }
  function card(p, opts) {
    opts = opts || {};
    var ci = opts.colorIdx || 0;
    var tag = isSoldOut(p) ? '<span class="tag tag--out">Sold out</span>' : (p.was ? '<span class="tag tag--sale">-' + Math.round((1 - p.price / p.was) * 100) + '%</span>' : (p.tag ? '<span class="tag">' + esc(p.tag) + '</span>' : ''));
    var title = opts.colorName ? p.name + ' — ' + p.colors[ci].n : p.name;
    return '<a class="card' + (isSoldOut(p) ? ' is-out' : '') + '" href="product.html?id=' + p.id + (ci ? '&c=' + ci : '') + '">' +
      '<div class="card__img">' + tag +
      (opts.num ? '<span class="lineup__num">' + opts.num + '</span>' : '') +
      '<div class="card__front">' + garment(p, p.colors[ci].h, 'front') + '</div>' +
      '<div class="card__back">' + garment(p, p.colors[ci].h, 'back') + '</div>' +
      '<span class="card__strip" aria-hidden="true"><i></i><i></i></span>' +
      '</div>' +
      '<div class="card__body"><div class="card__name">' + esc(title) + '</div>' +
      '<div class="card__price">' + priceHtml(p) + '</div>' +
      '<div class="card__dots">' + p.colors.map(function (c) { return '<span class="dot" style="background:' + c.h + '" title="' + c.n + '"></span>'; }).join('') + '</div>' +
      '</div></a>';
  }

  function reveals() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  function progress(el) {
    var r = el.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  }

  /* ==========================================================
     PAGES
     ========================================================== */

  function home() {
    // story-style circles
    var stories = [
      { t: 'New in', href: shopLink({ sort: 'new' }), p: 'chrome-club-tee', c: 0, ring: true },
      { t: 'Chrome Club', href: shopLink({ collection: 'Chrome Club' }), p: 'split-tee', c: 0, ring: true },
      { t: 'Hoodies', href: shopLink({ cat: 'Outerwear', type: 'Hoodies' }), p: 'elevation-hoodie', c: 0 },
      { t: 'Cargos', href: shopLink({ cat: 'Bottoms', type: 'Cargos' }), p: 'ground-cargo', c: 0 },
      { t: 'Jackets', href: shopLink({ cat: 'Outerwear', type: 'Jackets' }), p: 'top-floor-jacket', c: 1 },
      { t: 'Caps', href: shopLink({ cat: 'Accessories' }), p: 'contour-cap', c: 1 },
      { t: 'Mystery box', href: '#mystery', p: 'mystery-box', c: 0, ring: true },
      { t: 'Sale', href: shopLink({ sort: 'sale' }), p: 'stairwell-short', c: 0 }
    ];
    $('[data-stories]').innerHTML = stories.map(function (s) {
      var p = byId(s.p);
      return '<a class="story-dot' + (s.ring ? ' ring' : '') + '" href="' + s.href + '"><span class="story-dot__img">' + garment(p, p.colors[s.c].h) + '</span><span class="label">' + s.t + '</span></a>';
    }).join('');

    $('[data-lineup]').innerHTML = PRODUCTS.map(function (p, i) { return card(p, { num: (i < 9 ? '0' : '') + (i + 1) }); }).join('');

    // collections: silver tiles like the shop cards, a few pieces from each collection fanned out
    $('[data-collections]').innerHTML = COLLECTIONS.map(function (c, i) {
      var items = PRODUCTS.filter(function (p) { return p.col === c.n; });
      var lead = byId(c.show);
      var rest = items.filter(function (p) { return p !== lead && (i === 0 || p.shape !== 'cap'); });
      var shown = [lead].concat(rest.slice(0, i === 0 ? 2 : 1));
      var slots = shown.length === 3 ? ['main', 'b1', 'b2'] : ['main', 'b2'];
      var art = shown.map(function (p, k) {
        var ci = k === 0 ? c.color : 0;
        return '<span class="coll__g coll__g--' + slots[k] + '">' + garment(p, p.colors[ci].h, 'front') + '</span>';
      }).join('');
      var from = Math.min.apply(null, items.map(function (p) { return p.price; }));
      var seen = {}, dots = [];
      items.forEach(function (p) { p.colors.forEach(function (col) { if (!seen[col.h] && dots.length < 5) { seen[col.h] = 1; dots.push(col); } }); });
      return '<a class="coll reveal" style="--d:' + (i * 0.08) + 's" href="' + shopLink({ collection: c.n }) + '">' +
        '<div class="coll__top"><span class="label">0' + (i + 1) + ' / 0' + COLLECTIONS.length + '</span>' +
        '<span class="label muted">' + items.length + ' pieces · from ' + money(from) + '</span></div>' +
        '<div class="coll__art" aria-hidden="true">' + art + '</div>' +
        '<div class="coll__copy"><span class="label muted">' + c.blurb + '</span>' +
        '<h3 class="display coll__name">' + c.n + '</h3>' +
        '<div class="coll__foot"><span class="coll__dots">' + dots.map(function (d) { return '<i style="background:' + d.h + '" title="' + d.n + '"></i>'; }).join('') + '</span>' +
        '<span class="label coll__cta">Shop collection <b aria-hidden="true">→</b></span></div></div></a>';
    }).join('');

    // mystery box: goes straight to its Stripe payment link (set in js/catalog.js)
    var mbuy = $('[data-mystery-buy]');
    mbuy.textContent = 'Buy Mystery Box — ' + money(MYSTERY.price);
    if (CATALOG.MYSTERY_LINK) mbuy.href = CATALOG.MYSTERY_LINK;
    mbuy.addEventListener('click', function (e) {
      if (!CATALOG.MYSTERY_LINK || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      confetti(mbuy);
      setTimeout(function () { location.href = CATALOG.MYSTERY_LINK; }, REDUCE ? 0 : 550);   // let the confetti pop first
    });

    var form = $('[data-news]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.outerHTML = '<p class="label" role="status">You\'re in. Watch your inbox for Drop 02.</p>';
    });

    /* scroll-driven scenes */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hero = $('.hero'), head = $('.hero__head'), panel = $('.hero__panel'), art = $('.hero__art'), heroLogo = $('.hero__logo'),
        shade = $('.hero__shade'), outro = $('.hero__outro'), cue = $('.hero__cue');
    var lineup = $('.lineup'), track = $('.lineup__track'), bar = $('.lineup__bar i');

    function sizeLineup() {
      var extra = Math.max(0, track.scrollWidth - window.innerWidth);
      lineup.style.height = (window.innerHeight + extra) + 'px';
    }

    function frame() {
      // hero: panel grows from a card to full screen; the rings slowly turn and settle, the logo grows
      var p = progress(hero);
      var e = ease(clamp(p / 0.75));
      var o = clamp((p - 0.6) / 0.3);
      head.style.opacity = 1 - clamp(p * 2.4);
      head.style.transform = 'translateY(' + (-p * 160) + 'px) scale(' + (1 - p * 0.2) + ')';
      var w0 = window.innerWidth < 700 ? 78 : 38;
      panel.style.setProperty('--w', (w0 + (100 - w0) * e) + '%');
      panel.style.setProperty('--h', (50 + 50 * e) + '%');
      panel.style.setProperty('--t', (66 - 16 * e) + '%');
      art.style.transform = 'scale(' + (1.25 - 0.25 * e) + ') rotate(' + (-6 + 6 * e) + 'deg)';
      heroLogo.style.transform = 'translate(-50%, -50%) translateY(' + (-o * 14) + '%) scale(' + (0.8 + 0.25 * e) + ')';
      shade.style.opacity = o;
      outro.style.opacity = o;
      outro.style.transform = 'translateY(' + ((1 - o) * 32) + 'px)';
      outro.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      cue.style.opacity = 1 - clamp(p * 6);

      // latest drop: slide sideways
      var lp = progress(lineup);
      var shift = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.transform = 'translateX(' + (-lp * shift) + 'px)';
      bar.style.width = (lp * 100) + '%';
    }

    if (reduce) {
      panel.style.setProperty('--w', '100%'); panel.style.setProperty('--h', '100%'); panel.style.setProperty('--t', '50%');
      head.style.opacity = 0; outro.style.opacity = 1; outro.style.transform = 'none'; outro.style.pointerEvents = 'auto';
      return;
    }
    var ticking = false;
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; frame(); }); } }
    sizeLineup(); frame();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { sizeLineup(); frame(); });
    window.addEventListener('load', function () { sizeLineup(); frame(); });
  }

  function shop() {
    var f = { cat: qs('cat'), type: qs('type'), color: qs('color'), collection: qs('collection') };
    if (CATS.indexOf(f.cat) < 0) f.cat = 'All';
    var sort = qs('sort') || 'featured';
    var grid = $('[data-grid]'), title = $('[data-title]'), count = $('[data-count-label]');
    var rendered = false;

    function sync() {
      var params = { cat: f.cat === 'All' ? '' : f.cat, type: f.type, color: f.color, collection: f.collection, sort: sort === 'featured' ? '' : sort };
      try { history.replaceState(null, '', shopLink(params)); } catch (e) {}
    }
    function render() {
      var list = PRODUCTS.filter(function (p) {
        return (f.cat === 'All' || p.cat === f.cat) && (!f.type || p.type === f.type) &&
          (!f.collection || p.col === f.collection) &&
          (!f.color || p.colors.some(function (c) { return c.g === f.color; }));
      });
      if (sort === 'sale') list = list.filter(function (p) { return p.was; });
      if (sort === 'new') list = list.slice().sort(function (a, b) { return (b.tag === 'New') - (a.tag === 'New'); });
      if (sort === 'low') list = list.slice().sort(function (a, b) { return a.price - b.price; });
      if (sort === 'high') list = list.slice().sort(function (a, b) { return b.price - a.price; });
      // sold-out pieces sink to the end
      list = list.slice().sort(function (a, b) { return isSoldOut(a) - isSoldOut(b); });

      var t = f.collection || f.type || (sort === 'new' ? 'New in' : sort === 'sale' ? 'Sale' : (f.cat === 'All' ? 'Shop all' : f.cat));
      title.textContent = t;
      document.title = t + ' — LVL';
      count.textContent = list.length + (list.length === 1 ? ' item' : ' items');
      if (rendered) refresh(grid);
      rendered = true;
      grid.innerHTML = list.length ? list.map(function (p) {
        var ci = f.color ? Math.max(0, p.colors.findIndex(function (c) { return c.g === f.color; })) : 0;
        return card(p, { colorIdx: ci });
      }).join('') : '<p class="empty muted" style="grid-column:1/-1">Nothing matches those filters. <a class="link" href="shop.html">Clear filters</a></p>';

      $$('[data-cat]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cat === f.cat && !f.type); });
      $$('[data-sort]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.sort === sort); });
      $$('[data-color]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.color === f.color); });
      var active = [];
      if (f.collection) active.push(['collection', f.collection]);
      if (f.type) active.push(['type', f.type]);
      if (f.color) active.push(['color', f.color]);
      $('[data-active]').innerHTML = active.map(function (a) { return '<button class="chip chip--x" data-clear="' + a[0] + '">' + esc(a[1]) + ' ×</button>'; }).join('');
      $$('[data-clear]').forEach(function (b) { b.addEventListener('click', function () { f[b.dataset.clear] = null; sync(); render(); }); });
    }

    $('[data-cats-filter]').innerHTML = CATS.map(function (c) { return '<button class="pill" data-cat="' + c + '">' + c + '</button>'; }).join('');
    $('[data-colors-filter]').innerHTML = FAMILIES.map(function (c) { return '<button class="pill pill--color" data-color="' + c.n + '"><span class="dot" style="background:' + c.h + '"></span>' + c.n + '</button>'; }).join('');
    $$('[data-cat]').forEach(function (b) { b.addEventListener('click', function () { f.cat = b.dataset.cat; f.type = null; sync(); render(); }); });
    $$('[data-color]').forEach(function (b) { b.addEventListener('click', function () { f.color = f.color === b.dataset.color ? null : b.dataset.color; sync(); render(); }); });
    $$('[data-sort]').forEach(function (b) { b.addEventListener('click', function () { sort = b.dataset.sort; sync(); render(); }); });
    $$('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () {
        grid.classList.toggle('dense', b.dataset.view === 'dense');
        $$('[data-view]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      });
    });
    render();
  }

  /* All clothing: every piece (and every colourway) grouped by category */
  function allClothing() {
    var every = $('[data-every-color]'), hideOut = $('[data-hide-out]');
    var groups = CATS.slice(1);
    $('[data-jump]').innerHTML = groups.map(function (c) {
      return '<a class="pill" href="#' + c.toLowerCase() + '">' + c + ' <span class="muted">' + PRODUCTS.filter(function (p) { return p.cat === c; }).length + '</span></a>';
    }).join('');

    var allDrawn = false;
    function render() {
      var total = 0;
      if (allDrawn) refresh($('[data-all]'));
      allDrawn = true;
      $('[data-all]').innerHTML = groups.map(function (c) {
        var items = PRODUCTS.filter(function (p) { return p.cat === c && !(hideOut.checked && isSoldOut(p)); });
        var cards = [];
        items.forEach(function (p) {
          if (every.checked) p.colors.forEach(function (col, i) { cards.push(card(p, { colorIdx: i, colorName: true })); });
          else cards.push(card(p));
        });
        total += cards.length;
        return '<section class="all-sec" id="' + c.toLowerCase() + '" aria-label="' + c + '">' +
          '<div class="wrap section__head"><h2 class="display h2">' + c + '</h2>' +
          '<a class="label link" href="' + shopLink({ cat: c }) + '">Filter ' + c.toLowerCase() + ' →</a></div>' +
          '<div class="grid dense-ish">' + cards.join('') + '</div></section>';
      }).join('');
      $('[data-all-count]').textContent = total + (every.checked ? ' colorways' : ' pieces');
    }
    every.addEventListener('change', render);
    hideOut.addEventListener('change', render);
    render();
  }

  function product() {
    var p = byId(qs('id')) || PRODUCTS[0];
    var colorIdx = Math.min(p.colors.length - 1, Math.max(0, parseInt(qs('c'), 10) || 0)), size = p.shape === 'cap' ? 'One size' : null;
    var out = isSoldOut(p);
    document.title = p.name + ' — LVL';

    $('[data-crumb-cat]').textContent = p.col || p.cat;
    $('[data-crumb-cat]').href = p.col ? shopLink({ collection: p.col }) : shopLink({ cat: p.cat });
    $('[data-crumb-name]').textContent = p.name;
    $('[data-name]').textContent = p.name;
    $('[data-price]').innerHTML = priceHtml(p) + (p.was ? ' <span class="tag tag--sale" style="position:static">-' + Math.round((1 - p.price / p.was) * 100) + '%</span>' : '');
    $('[data-desc]').textContent = p.desc;
    $('[data-fit]').textContent = p.fit;
    var tag = $('[data-tag]');
    if (out) tag.textContent = 'Sold out'; else if (p.tag) tag.textContent = p.tag; else tag.remove();

    function renderGallery() {
      var col = p.colors[colorIdx];
      var shots = [['front', '', 'Front'], ['back', '', 'Back'], ['detail', '', 'Logo detail'], ['front', ' shot--dark', 'On dark']];
      $('[data-gallery]').innerHTML = shots.map(function (s) {
        return '<div class="shot' + s[1] + '">' + garment(p, col.h, s[0], p.name + ' in ' + col.n + ', ' + s[2].toLowerCase()) + '<span class="shot__cap">' + s[2] + '</span></div>';
      }).join('');
      $('[data-color-name]').textContent = col.n;
    }

    var sw = $('[data-swatches]');
    sw.innerHTML = p.colors.map(function (c, i) { return '<button class="swatch" style="background:' + c.h + '" aria-label="' + c.n + '" data-i="' + i + '"></button>'; }).join('');
    function markSwatches() { $$('.swatch', sw).forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.i === colorIdx); }); }
    $$('.swatch', sw).forEach(function (b) {
      b.addEventListener('click', function () { colorIdx = +b.dataset.i; markSwatches(); renderGallery(); });
    });

    var sz = $('[data-sizes]');
    var sizes = p.shape === 'cap' ? ['One size'] : SIZES;
    sz.innerHTML = sizes.map(function (s) {
      var gone = out || (p.soldSizes || []).indexOf(s) >= 0;
      return '<button class="size" data-s="' + s + '"' + (gone ? ' disabled aria-label="' + s + ', sold out"' : '') + '>' + s + '</button>';
    }).join('');
    function markSizes() { $$('.size', sz).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.s === size); }); }
    $$('.size', sz).forEach(function (b) {
      b.addEventListener('click', function () { size = b.dataset.s; markSizes(); $('[data-error]').hidden = true; });
    });

    var add = $('[data-add]');
    if (out) {
      add.textContent = 'Sold out'; add.disabled = true;
      var nf = $('[data-notify]');
      nf.hidden = false;
      nf.addEventListener('submit', function (e) { e.preventDefault(); nf.outerHTML = '<p class="label" role="status">We\'ll email you if it comes back.</p>'; });
    } else {
      add.textContent = 'Add to bag — ' + money(p.price);
      add.addEventListener('click', function () {
        if (!size) { $('[data-error]').hidden = false; return; }
        confetti(add);
        addToCart(p, colorIdx, size);
      });
    }
    $('[data-size-guide]').addEventListener('click', function () {
      var d = $('[data-guide]'); d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('[data-related]').innerHTML = PRODUCTS.filter(function (x) { return x.id !== p.id && !isSoldOut(x); })
      .sort(function (a, b) { return (b.col === p.col) - (a.col === p.col); }).slice(0, 4)
      .map(function (x) { return card(x); }).join('');

    markSwatches(); markSizes(); renderGallery();
  }

  function cart() {
    var root = $('[data-cart]');
    function render() {
      var c = getCart();
      var n = c.reduce(function (a, l) { return a + l.qty; }, 0);
      $('[data-items]').textContent = n + (n === 1 ? ' item' : ' items');
      if (!n) {
        root.innerHTML = '<div class="empty"><p class="display h2">Your bag is empty</p><p class="muted">Pick something from the drop and it will show up here.</p><a class="btn" href="shop.html">Start shopping</a></div>';
        return;
      }
      var t = cartTotals(c);
      var left = Math.max(0, 100 - t.sub);
      root.innerHTML = '<div class="two-col"><div class="lines">' + c.map(function (l, i) {
        var p = byId(l.id) || PRODUCTS[0];
        return '<div class="line">' +
          '<a class="line__img" href="' + (l.id === 'mystery-box' ? 'index.html#mystery' : 'product.html?id=' + l.id) + '">' + garment(p, l.hex, 'front') + '</a>' +
          '<div><div class="line__name">' + esc(l.name) + '</div><div class="line__meta">' + esc(l.color) + ' · ' + esc(l.size) + ' · ' + money(l.price) + '</div>' +
          (l.id === 'mystery-box' ? '<div class="line__meta">Final sale</div>' : '') +
          '<button class="line__remove" data-remove="' + i + '">Remove</button></div>' +
          '<div class="qty"><button aria-label="Decrease quantity" data-dec="' + i + '">−</button><span aria-live="polite">' + l.qty + '</span><button aria-label="Increase quantity" data-inc="' + i + '">+</button></div>' +
          '<div class="line__total">' + money(l.qty * l.price) + '</div></div>';
      }).join('') + '</div>' +
      '<aside class="summary"><h2 class="display" style="font-size:26px">Summary</h2>' +
      '<div><p class="label muted" style="margin:0 0 8px">' + (left > 0 ? money(left) + ' away from free shipping' : 'You unlocked free shipping') + '</p><div class="meter"><i style="width:' + Math.min(100, t.sub) + '%"></i></div></div>' +
      '<div class="summary__row"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' +
      '<div class="summary__row"><span>Shipping</span><span>' + (t.ship ? money(t.ship) : 'Free') + '</span></div>' +
      '<div class="summary__total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '<a class="btn btn--block" href="checkout.html">Checkout</a>' +
      '<a class="btn btn--ghost btn--block" href="shop.html">Keep shopping</a></aside></div>';
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var c = getCart().slice();
      if (b.dataset.inc) c[+b.dataset.inc].qty++;
      else if (b.dataset.dec) { var i = +b.dataset.dec; if (c[i].qty > 1) c[i].qty--; else c.splice(i, 1); }
      else if (b.dataset.remove) c.splice(+b.dataset.remove, 1);
      else return;
      setCart(c); render();
    });
    render();
  }

  /* Checkout: review the bag, then hand off to Stripe's secure page.
     The payment function (netlify/functions/create-checkout.js)
     re-prices everything from js/catalog.js on the server. */
  var CHECKOUT_URL = '/api/checkout';
  var ORDER_URL = '/api/order';

  function checkout() {
    var btn = $('[data-pay]'), err = $('[data-pay-error]');
    var S = SHIPPING;
    $('[data-exp-label]').textContent = money(S.express);

    function showError(msg) { err.innerHTML = msg; err.hidden = false; }
    function render() {
      var c = getCart();
      var t = cartTotals(c, false);
      var left = Math.max(0, S.freeOver - t.sub);
      $('[data-std-label]').textContent = t.ship ? money(S.standard) + ' (free over ' + money(S.freeOver) + ')' : 'free on this order';
      $('[data-order]').innerHTML = c.length ? c.map(function (l) {
        var p = byId(l.id) || PRODUCTS[0];
        return '<div class="line line--review"><div class="line__img">' + garment(p, l.hex, 'front') + '</div>' +
          '<div><div class="line__name">' + esc(l.name) + '</div><div class="line__meta">' + esc(l.color) + ' · ' + esc(l.size) + ' · Qty ' + l.qty + '</div></div>' +
          '<div class="line__total">' + money(l.qty * l.price) + '</div></div>';
      }).join('') : '<div class="empty" style="padding:32px 0"><p>Your bag is empty.</p><a class="btn" href="shop.html">Shop the drop</a></div>';
      $('[data-free-msg]').textContent = left > 0 ? money(left) + ' away from free shipping' : 'You unlocked free shipping';
      $('[data-meter]').style.width = Math.min(100, t.sub / S.freeOver * 100) + '%';
      $('[data-sub]').textContent = money(t.sub);
      $('[data-ship]').textContent = t.ship ? money(t.ship) : 'Free';
      $('[data-total]').textContent = money(t.total);
      btn.textContent = 'Pay securely — ' + money(t.total);
      btn.disabled = !c.length;
    }

    btn.addEventListener('click', function () {
      var c = getCart();
      if (!c.length) return;
      err.hidden = true;
      if (location.protocol === 'file:') {
        showError('Payments only work once the site is online. Put it on Netlify (see README.md), or run <b>netlify dev</b> to test on your computer.');
        return;
      }
      confetti(btn);
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'Opening secure checkout…';
      fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: c.map(function (l) { return { id: l.id, color: l.color, size: l.size, qty: l.qty }; }) })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) { return { status: r.status, data: data }; });
      }).then(function (res) {
        if (res.status === 200 && res.data.url) { location.href = res.data.url; return; }
        if (res.status === 404) throw new Error('The payment function isn’t running here. It works once the site is deployed on Netlify.');
        throw new Error(res.data.error || 'Could not start checkout. Please try again.');
      }).catch(function (e) {
        showError(esc(e.message && e.message !== 'Failed to fetch' ? e.message : 'Could not reach the payment server. Check your connection and try again.'));
        btn.disabled = false; btn.textContent = label;
      });
    });

    // coming back from Stripe with the back button: re-enable the button
    window.addEventListener('pageshow', function () { render(); });
    render();
  }

  function success() {
    var id = qs('session_id');
    if (!id) return;                 // opened directly: just show the thank-you
    setCart([]);                      // the order went through, empty the bag
    fetch(ORDER_URL + '?session_id=' + encodeURIComponent(id))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (o) {
        if (!o) return;
        $('[data-ref]').textContent = 'Order ' + o.reference;
        if (o.email) $('[data-msg]').innerHTML = 'Thanks for your order. A receipt is on its way to <b>' + esc(o.email) + '</b>.';
        var box = $('[data-items]');
        box.innerHTML = o.items.map(function (i) {
          return '<div class="summary__row"><span>' + esc(i.name) + ' × ' + i.qty + '</span><span>' + money(i.amount) + '</span></div>';
        }).join('') +
          '<div class="summary__row"><span>Shipping</span><span>' + (o.shipping ? money(o.shipping) : 'Free') + '</span></div>' +
          '<div class="summary__total"><span>Total paid</span><span>' + money(o.total) + '</span></div>';
        box.hidden = false;
      })
      .catch(function () {});
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.dataset.page;
    var h = $('#site-header'), f = $('#site-footer');
    if (h) h.outerHTML = header(page === 'all' ? 'all' : (page === 'shop' && qs('sort') === 'new' ? 'new' : null));
    if (f) f.outerHTML = footer();
    wireLeap();
    wireChrome(page);
    updateCount(false);
    renderDrawer();
    window.addEventListener('storage', function () { updateCount(false); renderDrawer(); });

    ({ home: home, all: allClothing, shop: shop, product: product, cart: cart, checkout: checkout, success: success }[page] || function () {})();
    reveals();
  });
})();
