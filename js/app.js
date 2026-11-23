import { icon } from './icons.js';
import {
  api,
  loadDB,
  getSession,
  saveSession,
  getActiveUser,
  getActiveWorkshop,
  getOfflineQueue,
  isOffline,
  setSimulatedOffline,
  getSimulatedOffline,
  resetDummyData,
  exportDBJson,
  importDBJson,
  formatRupiah
} from './api.js';
import {
  renderLoginView,
  renderHomeView,
  renderGarageView,
  renderCatalogView,
  renderHistoryView,
  renderLoyaltyView,
  renderQRModal,
  renderReceiptModal,
  renderVehicleModal,
  renderProductDetailModal,
  renderQuickBikeModal
} from './views-customer.js';
import {
  renderPosView,
  renderWorkshopSettingsView,
  renderCatalogItemModal
} from './views-workshop.js';

const appEl = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

const state = {
  route: '/home',
  // Login state
  loginMode: 'login',
  loginRole: 'customer',
  loginIdentifier: '',
  otpSent: false,
  // Catalog state
  catModel: undefined,
  catCategory: 'all',
  catGrade: 'all',
  catSearch: '',
  catCompare: false,
  estimateCart: {},
  // Planet Ban Storefront state
  heroSlide: 0,
  activeStoreTab: '',
  headerTheme: 'theme-blue',
  drawerOpen: false,
  homeFilterBan: 'laku',
  homeFilterOli: 'laku',
  homeFilterPart: 'laku',
  homeFilterServis: 'laku',
  // History state
  historyTab: 'warranties',
  // POS state
  posCustomerQuery: '',
  posVehicleId: 'veh-1',
  posCatFilter: 'all',
  posItemSearch: '',
  posCart: [],
  posAppliedEstimateId: null,
  posClaimInput: '',
  posVerifyResult: null,
  posAppliedReward: null,
  // Workshop Settings state
  wsTab: 'catalog'
};

// ============================================================================
// TOAST & MODAL HELPERS
// ============================================================================
function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const ic = type === 'success' ? 'checkCircle' : type === 'warning' ? 'alertTriangle' : type === 'danger' ? 'shieldAlert' : 'sparkles';
  el.innerHTML = `${icon(ic, 18)} <span>${message}</span>`;
  toastRoot.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, 3400);
}

function openModal(html) {
  modalRoot.innerHTML = html;
}

function closeModal() {
  modalRoot.innerHTML = '';
}

// ============================================================================
// ROUTER & RBAC GUARD
// ============================================================================
const CUSTOMER_ROUTES = ['/home', '/garage', '/catalog', '/history', '/loyalty'];
const WORKSHOP_ROUTES = ['/pos', '/workshop/settings'];

function getHashRoute() {
  const h = window.location.hash.replace(/^#/, '');
  if (h && h.startsWith('/')) return h;
  const p = window.location.pathname;
  if ([...CUSTOMER_ROUTES, ...WORKSHOP_ROUTES, '/login'].includes(p)) return p;
  return null;
}

function navigate(route) {
  state.route = route;
  if (window.location.hash !== `#${route}`) {
    window.location.hash = `#${route}`;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function resolveRouteWithRBAC() {
  const user = getActiveUser();
  if (state.route === '/login') return '/login';
  if (!user) return '/login';

  if (user.role === 'customer' && WORKSHOP_ROUTES.includes(state.route)) {
    toast('Akses dibatasi (RBAC): Alihkan peran ke Mitra Bengkel untuk membuka layar Kasir.', 'warning');
    return '/home';
  }
  if (user.role === 'bengkel_admin' && CUSTOMER_ROUTES.includes(state.route)) {
    return '/pos';
  }
  if (![...CUSTOMER_ROUTES, ...WORKSHOP_ROUTES, '/login'].includes(state.route)) {
    return user.role === 'bengkel_admin' ? '/pos' : '/home';
  }
  return state.route;
}

// ============================================================================
// NAVIGATION SHELL RENDERER
// ============================================================================
function getNavItems(user) {
  if (user.role === 'bengkel_admin') {
    const { items } = api.getCatalog({ workshopId: getActiveWorkshop(user).id });
    const lowStock = items.filter((p) => p.category !== 'jasa' && p.stock <= p.min_stock).length;
    return [
      { route: '/pos', label: 'Kasir POS', ic: 'receipt', badge: getOfflineQueue().length || null },
      { route: '/workshop/settings', label: 'Pengaturan & Stok', ic: 'settings', badge: lowStock || null }
    ];
  }
  const loyalty = api.getLoyaltySummary(user.id);
  const readyVouchers = loyalty.rewards.filter((r) => r.status === 'pending').length;
  return [
    { route: '/home', label: 'Beranda', ic: 'home' },
    { route: '/catalog', label: 'Katalog', ic: 'package' },
    { route: '/history', label: 'Garansi', ic: 'shieldCheck' },
    { route: '/loyalty', label: 'Loyalitas', ic: 'award', badge: readyVouchers || null },
    { route: '/garage', label: 'Garasi', ic: 'bike' }
  ];
}

const ROUTE_TITLES = {
  '/home': 'Beranda Customer',
  '/garage': 'Garasi Motor',
  '/catalog': 'Katalog Sparepart & Pelumas',
  '/history': 'Riwayat & Garansi Digital',
  '/loyalty': 'Program Loyalitas',
  '/pos': 'Kasir POS Bengkel',
  '/workshop/settings': 'Pengaturan Bengkel'
};

function renderCustomerDrawer(route, user) {
  if (!state.drawerOpen) return '';
  const offlineNow = isOffline();
  const loyalty = api.getLoyaltySummary(user.id);
  const readyVouchers = loyalty.rewards.filter((r) => r.status === 'pending').length;
  const warrantiesCount = api.getWarranties().filter((w) => w.effectiveStatus === 'active').length;
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return `
    <div class="pb-drawer-backdrop" data-drawer-backdrop>
      <aside class="pb-drawer" aria-label="Menu Diservisin">
        <div class="row-between" style="margin-bottom:16px;">
          <div class="row">
            <img src="./assets/logo.png" alt="Diservisin" style="width:34px;height:34px;border-radius:9px;" />
            <div>
              <div class="brand-name" style="font-size:17px;">Diservisin</div>
              <span class="brand-sub">Menu Pelanggan</span>
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="close-drawer">${icon('x', 20)}</button>
        </div>

        <div style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:14px;background:var(--bg);margin-bottom:14px;">
          <div class="avatar">${initials}</div>
          <div style="min-width:0;flex:1;">
            <div class="font-bold text-sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.name}</div>
            <div class="text-xs muted">${user.phone_number}</div>
          </div>
        </div>

        <nav class="stack-sm" style="gap:4px;flex:1;">
          <button type="button" class="pb-drawer-link ${route === '/home' ? 'active' : ''}" data-drawer-nav="/home">${icon('home', 19)} Beranda Storefront</button>
          <button type="button" class="pb-drawer-link ${route === '/catalog' ? 'active' : ''}" data-drawer-nav="/catalog">${icon('package', 19)} Katalog &amp; Estimasi Harga</button>
          <button type="button" class="pb-drawer-link ${route === '/history' ? 'active' : ''}" data-drawer-nav="/history">
            ${icon('shieldCheck', 19)} <span>Garansi &amp; Nota Digital</span>
            ${warrantiesCount ? `<span class="badge badge-blue" style="margin-left:auto;">${warrantiesCount}</span>` : ''}
          </button>
          <button type="button" class="pb-drawer-link ${route === '/loyalty' ? 'active' : ''}" data-drawer-nav="/loyalty">
            ${icon('award', 19)} <span>Stempel &amp; Loyalitas</span>
            ${readyVouchers ? `<span class="badge badge-orange" style="margin-left:auto;">${readyVouchers}</span>` : ''}
          </button>
          <button type="button" class="pb-drawer-link ${route === '/garage' ? 'active' : ''}" data-drawer-nav="/garage">${icon('bike', 19)} Garasi Motor Saya</button>
        </nav>

        <div class="divider"></div>

        <div class="stack-sm" style="gap:8px;">
          <button type="button" class="btn btn-accent btn-block" data-action="switch-role">
            ${icon('switchRole', 17)} Ganti ke Mode Kasir Bengkel
          </button>
          <button type="button" class="btn btn-outline btn-sm btn-block" data-action="toggle-offline">
            ${icon(offlineNow ? 'wifiOff' : 'wifi', 16)} Status: ${offlineNow ? 'Mode Offline (Simulasi)' : 'Online (Klik uji Offline)'}
          </button>
          <button type="button" class="btn btn-danger-outline btn-sm btn-block" data-action="go-login">
            ${icon('logout', 16)} Halaman Login / Ganti Akun
          </button>
        </div>
      </aside>
    </div>
  `;
}

function renderCustomerShell(route, bodyHtml) {
  const user = getActiveUser();
  const estCount = Object.values(state.estimateCart || {}).reduce((s, q) => s + Number(q || 0), 0);
  const { items: allCat } = api.getCatalog({ workshopId: 'ws-1' });
  const estItems = Object.entries(state.estimateCart || {})
    .map(([id, qty]) => {
      const p = allCat.find((x) => x.id === id);
      return p && qty > 0 ? { ...p, quantity: qty } : null;
    })
    .filter(Boolean);
  const estGrandTotal = estItems.reduce((s, i) => s + (i.price + (i.install_fee || 0)) * i.quantity, 0);

  const activeTab =
    route === '/catalog'
      ? state.catCategory === 'jasa'
        ? 'servis'
        : state.catCategory === 'ban'
          ? 'ban'
          : state.catCategory === 'oli'
            ? 'oli'
            : state.catCategory === 'sparepart'
              ? 'sparepart'
              : ''
      : state.activeStoreTab || '';

  const themeClass = route === '/home' ? (state.headerTheme || 'theme-blue') : activeTab === 'oli' ? 'theme-red' : activeTab === 'sparepart' ? 'theme-slate' : 'theme-blue';

  const topTabs = [
    { key: 'servis', label: 'Servis', sec: 'sec-servis', theme: 'theme-cobalt', cat: 'jasa' },
    { key: 'ban', label: 'Ban Motor', sec: 'sec-ban', theme: 'theme-blue', cat: 'ban' },
    { key: 'oli', label: 'Oli Motor', sec: 'sec-oli', theme: 'theme-red', cat: 'oli' },
    { key: 'sparepart', label: 'Sparepart', sec: 'sec-sparepart', theme: 'theme-slate', cat: 'sparepart' }
  ];

  const navItems = getNavItems(user);

  return `
    <div class="pb-shell">
      <header class="pb-header ${themeClass}" id="pb-header">
        <div class="pb-header-top">
          <div class="pb-header-left">
            <button type="button" class="pb-role-chip" data-action="switch-role" title="Ganti peran ke Kasir Bengkel POS">
              ${icon('switchRole', 14)}
              <span><span class="pb-hide-xs">Ke </span>Bengkel</span>
            </button>
          </div>

          <div class="pb-brand-lockup" data-nav="/home" title="Beranda Diservisin">
            <img src="./assets/logo.png" alt="Logo Diservisin" />
            <div class="pb-brand-wordmark">
              <span class="pb-brand-title">DISERVISIN</span>
              <span class="pb-brand-tag">Servis &amp; Garansi Motor</span>
            </div>
          </div>

          <div class="pb-header-right">
            <button type="button" class="pb-icon-btn" data-nav="/catalog" title="Keranjang Estimasi Biaya" aria-label="Estimasi Biaya">
              ${icon('cart', 22)}
              ${estCount > 0 ? `<span class="pb-cart-badge num">${estCount}</span>` : ''}
            </button>
            <button type="button" class="pb-icon-btn" data-action="open-drawer" title="Menu Navigasi" aria-label="Buka Menu">
              ${icon('menuTwo', 24)}
            </button>
          </div>
        </div>

        <nav class="pb-cat-tabs" aria-label="Kategori Utama">
          ${topTabs.map((t) => `
            <button type="button" class="pb-cat-tab ${activeTab === t.key ? 'active' : ''}" data-action="pb-top-tab" data-key="${t.key}" data-sec="${t.sec}" data-theme="${t.theme}" data-cat="${t.cat}">
              ${t.label}
            </button>
          `).join('')}
        </nav>
      </header>

      ${route === '/home'
        ? `<main style="flex:1;">${bodyHtml}</main>`
        : `<main class="pb-subpage-main">${bodyHtml}</main>`}

      ${route === '/home' && estItems.length > 0 ? `
        <div class="estimate-bar" style="left:14px;right:14px;bottom:calc(var(--bottomnav-h) + 10px);">
          <div>
            <div class="text-xs" style="color:#94A3B8;">Estimasi Terpilih (${estCount} item incl. pasang)</div>
            <div class="num" style="font-size:19px;font-weight:800;color:#fff;">${formatRupiah(estGrandTotal)}</div>
          </div>
          <div class="row" style="gap:8px;">
            <button type="button" class="btn btn-ghost btn-sm" style="color:#CBD5E1;" data-nav="/catalog">Rincian</button>
            <button type="button" class="btn btn-accent btn-sm" data-action="save-estimate">${icon('bookmark', 16)} Simpan Estimasi</button>
          </div>
        </div>
      ` : ''}

      <!-- Compact Mobile Bottom Nav for fast 1-thumb access to all 5 PRD Customer tabs -->
      <nav class="bottom-nav" aria-label="Navigasi Bawah">
        ${navItems.map((n) => `
          <button type="button" class="bottom-nav-item ${route === n.route ? 'active' : ''}" data-nav="${n.route}">
            ${icon(n.ic, 21)}
            <span>${n.label}</span>
            ${n.badge ? `<span class="nav-badge num">${n.badge}</span>` : ''}
          </button>
        `).join('')}
      </nav>

      ${renderCustomerDrawer(route, user)}
    </div>
  `;
}

function renderShell(route, bodyHtml) {
  const user = getActiveUser();
  if (user.role === 'customer') {
    return renderCustomerShell(route, bodyHtml);
  }
  const navItems = getNavItems(user);
  const isWorkshop = user.role === 'bengkel_admin';
  const offlineNow = isOffline();
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return `
    <div class="app-shell with-nav">
      <!-- Desktop Sidebar -->
      <aside class="sidebar" aria-label="Navigasi Utama">
        <div class="sidebar-logo">
          <img src="./assets/logo.png" alt="Logo Diservisin" />
          <div>
            <div class="brand-name">Diservisin</div>
            <span class="brand-sub">${isWorkshop ? 'Portal Mitra Bengkel' : 'Aplikasi Pemilik Motor'}</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          ${navItems.map((n) => `
            <button type="button" class="sidebar-link ${route === n.route ? 'active' : ''}" data-nav="${n.route}">
              ${icon(n.ic, 20)}
              <span>${n.label}</span>
              ${n.badge ? `<span class="pill-count num">${n.badge}</span>` : ''}
            </button>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="avatar">${initials}</div>
            <div style="min-width:0;flex:1;">
              <div style="font-size:13.5px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.name}</div>
              <div style="font-size:11.5px;color:#94A3B8;">${isWorkshop ? 'Admin / Kasir Bengkel' : 'Pemilik Motor'}</div>
            </div>
          </div>
          <button type="button" class="sidebar-link" style="min-height:40px;color:#FCA5A5;" data-action="go-login">
            ${icon('logout', 18)} <span>Halaman Login / Keluar</span>
          </button>
        </div>
      </aside>

      <div class="content-wrapper">
        <!-- Sticky Topbar -->
        <header class="topbar">
          <div class="topbar-brand" data-nav="${isWorkshop ? '/pos' : '/home'}">
            <img src="./assets/logo.png" alt="Logo Diservisin" />
            <div>
              <div class="brand-name">Diservisin</div>
              <span class="brand-sub">${isWorkshop ? 'Kasir Bengkel' : 'Servis Transparan'}</span>
            </div>
          </div>

          <div class="topbar-page-title">
            <h2 style="font-size:18px;">${ROUTE_TITLES[route] || 'Diservisin'}</h2>
            <span class="badge ${isWorkshop ? 'badge-orange' : 'badge-blue'}">${isWorkshop ? 'Mode Bengkel' : 'Mode Customer'}</span>
          </div>

          <div class="topbar-actions">
            <button type="button" class="net-pill ${offlineNow ? 'offline' : ''}" data-action="toggle-offline" title="Simulasikan koneksi Offline/Online untuk menguji ketahanan cache & antrean POS">
              ${icon(offlineNow ? 'wifiOff' : 'wifi', 15)}
              <span class="net-label">${offlineNow ? 'Offline' : 'Online'}</span>
            </button>

            <button type="button" class="role-switcher ${isWorkshop ? 'is-workshop' : ''}" data-action="switch-role" title="Uji alur Customer ↔ Kasir Bengkel sekali klik">
              ${icon('switchRole', 15)}
              <span>${isWorkshop ? 'Ke Customer' : 'Ke Bengkel'}</span>
            </button>

            <button type="button" class="btn btn-ghost btn-sm" style="padding:6px 8px;min-height:40px;" data-action="go-login" title="Halaman Login">
              ${icon('user', 18)}
            </button>
          </div>
        </header>

        <main class="main-area">${bodyHtml}</main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <nav class="bottom-nav" aria-label="Navigasi Bawah">
        ${navItems.map((n) => `
          <button type="button" class="bottom-nav-item ${route === n.route ? 'active' : ''}" data-nav="${n.route}">
            ${icon(n.ic, 21)}
            <span>${n.label}</span>
            ${n.badge ? `<span class="nav-badge num">${n.badge}</span>` : ''}
          </button>
        `).join('')}
      </nav>
    </div>
  `;
}

// ============================================================================
// MAIN RENDER LOOP
// ============================================================================
function render() {
  const effectiveRoute = resolveRouteWithRBAC();
  state.route = effectiveRoute;

  if (effectiveRoute === '/login') {
    appEl.innerHTML = renderLoginView(state);
    return;
  }

  let bodyHtml = '';
  switch (effectiveRoute) {
    case '/home':
      bodyHtml = renderHomeView(state);
      break;
    case '/garage':
      bodyHtml = renderGarageView(state);
      break;
    case '/catalog':
      bodyHtml = renderCatalogView(state);
      break;
    case '/history':
      bodyHtml = renderHistoryView(state);
      break;
    case '/loyalty':
      bodyHtml = renderLoyaltyView(state);
      break;
    case '/pos':
      bodyHtml = renderPosView(state);
      break;
    case '/workshop/settings':
      bodyHtml = renderWorkshopSettingsView(state);
      break;
    default:
      bodyHtml = renderHomeView(state);
  }

  appEl.innerHTML = renderShell(effectiveRoute, bodyHtml);
  setupStorefrontScrollTheme(effectiveRoute);
}

let themeObserver = null;
function setupStorefrontScrollTheme(route) {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
  if (route !== '/home') return;
  const headerEl = document.getElementById('pb-header');
  if (!headerEl || typeof IntersectionObserver === 'undefined') return;
  const sections = document.querySelectorAll('[data-pb-theme]');
  if (!sections.length) return;

  const sectionToTab = {
    'sec-hero': '',
    'sec-ban': 'ban',
    'sec-oli': 'oli',
    'sec-sparepart': 'sparepart',
    'sec-servis': 'servis'
  };

  themeObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const theme = visible.target.getAttribute('data-pb-theme') || 'theme-blue';
      const tabKey = sectionToTab[visible.target.id] ?? '';
      state.headerTheme = theme;
      state.activeStoreTab = tabKey;
      headerEl.className = `pb-header ${theme}`;
      document.querySelectorAll('.pb-cat-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.key === tabKey);
      });
    },
    { rootMargin: '-120px 0px -55% 0px', threshold: [0.1, 0.3, 0.5] }
  );

  sections.forEach((sec) => themeObserver.observe(sec));
}

// ============================================================================
// EVENT DELEGATION (Clicks, Inputs, Forms)
// ============================================================================
document.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-drawer-backdrop')) {
    state.drawerOpen = false;
    render();
    return;
  }

  if (e.target.hasAttribute('data-modal-backdrop') || e.target.closest('[data-close-modal]')) {
    const alsoNav = e.target.closest('[data-nav]');
    closeModal();
    if (alsoNav) navigate(alsoNav.getAttribute('data-nav'));
    return;
  }

  const drawerNav = e.target.closest('[data-drawer-nav]');
  if (drawerNav) {
    state.drawerOpen = false;
    navigate(drawerNav.getAttribute('data-drawer-nav'));
    return;
  }

  // Check action before data-nav so quick-add buttons inside cards don't trigger card click
  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    const action = actionEl.getAttribute('data-action');
    try {
      handleAction(action, actionEl);
    } catch (err) {
      toast(err.message || 'Terjadi kesalahan.', 'danger');
    }
    return;
  }

  const navBtn = e.target.closest('[data-nav]');
  if (navBtn) {
    navigate(navBtn.getAttribute('data-nav'));
    return;
  }
});

function handleAction(action, el) {
  switch (action) {
    // --- PLANET BAN STOREFRONT INTERACTIONS ---
    case 'open-drawer':
      state.drawerOpen = true;
      render();
      break;

    case 'close-drawer':
      state.drawerOpen = false;
      render();
      break;

    case 'hero-slide':
      state.heroSlide = Number(el.dataset.idx) || 0;
      render();
      break;

    case 'home-filter':
      state[el.dataset.sec] = el.dataset.val;
      render();
      break;

    case 'pb-top-tab': {
      const key = el.dataset.key;
      const secId = el.dataset.sec;
      const theme = el.dataset.theme || 'theme-blue';
      const cat = el.dataset.cat || 'all';
      state.activeStoreTab = key;
      state.headerTheme = theme;
      if (state.route === '/home') {
        const target = document.getElementById(secId);
        if (target) {
          const headerEl = document.getElementById('pb-header');
          if (headerEl) headerEl.className = `pb-header ${theme}`;
          document.querySelectorAll('.pb-cat-tab').forEach((b) => b.classList.toggle('active', b.dataset.key === key));
          const top = target.getBoundingClientRect().top + window.scrollY - 108;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      } else {
        state.catCategory = cat;
        state.catModel = 'all';
        navigate('/catalog');
      }
      break;
    }

    case 'open-catalog-cat':
      state.catCategory = el.dataset.cat || 'all';
      state.catModel = 'all';
      navigate('/catalog');
      break;

    case 'open-product-detail': {
      const { items } = api.getCatalog({ workshopId: 'ws-1' });
      const prod = items.find((p) => p.id === el.dataset.id);
      if (prod) {
        openModal(renderProductDetailModal(prod, state.estimateCart[prod.id] || 0));
      }
      break;
    }

    case 'est-qty-modal': {
      const id = el.dataset.id;
      state.estimateCart[id] = (state.estimateCart[id] || 0) + 1;
      closeModal();
      toast('Produk ditambahkan ke Estimasi Biaya!', 'success');
      render();
      break;
    }

    case 'open-quick-bike':
      openModal(renderQuickBikeModal());
      break;

    // --- AUTH & ROLE SWITCHER ---
    case 'login-mode':
      state.loginMode = el.dataset.mode;
      state.otpSent = false;
      render();
      break;

    case 'login-role':
      state.loginRole = el.dataset.role;
      state.loginIdentifier = el.dataset.role === 'customer' ? '081234567890' : '081311223344';
      state.otpSent = false;
      render();
      break;

    case 'send-otp': {
      const idInput = document.getElementById('login-identifier');
      state.loginIdentifier = idInput ? idInput.value : '';
      state.otpSent = true;
      toast('Kode OTP simulasi (123456) berhasil dikirim!', 'success');
      render();
      break;
    }

    case 'quick-demo': {
      const targetRole = el.dataset.role;
      const { user } = api.switchRole(targetRole);
      toast(`Masuk sebagai ${user.name} (${targetRole === 'bengkel_admin' ? 'Mitra Bengkel' : 'Pemilik Motor'})`, 'success');
      navigate(targetRole === 'bengkel_admin' ? '/pos' : '/home');
      break;
    }

    case 'switch-role': {
      state.drawerOpen = false;
      const current = getActiveUser();
      const target = current && current.role === 'bengkel_admin' ? 'customer' : 'bengkel_admin';
      const { user } = api.switchRole(target);
      state.catModel = undefined;
      state.posVerifyResult = null;
      toast(`Berpindah ke mode ${target === 'bengkel_admin' ? 'Kasir Bengkel' : 'Customer'} (${user.name})`, 'info');
      navigate(target === 'bengkel_admin' ? '/pos' : '/home');
      break;
    }

    case 'go-login':
      state.drawerOpen = false;
      state.otpSent = false;
      navigate('/login');
      break;

    case 'toggle-offline': {
      const next = !getSimulatedOffline();
      setSimulatedOffline(next);
      if (next) {
        toast('Simulasi Offline Aktif — Katalog pakai cache lokal & POS masuk antrean offline.', 'warning');
      } else {
        const res = api.syncOfflineQueue();
        if (res.syncedCount > 0) {
          toast(`Kembali Online! ${res.syncedCount} transaksi offline berhasil disinkronkan otomatis.`, 'success');
        } else {
          toast('Koneksi kembali Online.', 'success');
        }
      }
      render();
      break;
    }

    // --- GARAGE ---
    case 'open-vehicle-modal':
      openModal(renderVehicleModal(null));
      break;

    case 'edit-vehicle': {
      const veh = api.getVehicles().find((v) => v.id === el.dataset.id);
      if (veh) openModal(renderVehicleModal(veh));
      break;
    }

    case 'delete-vehicle':
      if (confirm('Hapus motor ini dari garasimu?')) {
        api.deleteVehicle(el.dataset.id);
        toast('Data motor dihapus.', 'info');
        render();
      }
      break;

    case 'set-active-vehicle': {
      const sess = getSession();
      if (sess) {
        sess.active_vehicle_id = el.dataset.id;
        saveSession(sess);
        state.catModel = undefined;
        toast('Motor aktif berhasil diganti.', 'success');
        render();
      }
      break;
    }

    // --- CATALOG & ESTIMATE ---
    case 'cat-category':
      state.catCategory = el.dataset.val;
      render();
      break;

    case 'toggle-compare':
      state.catCompare = !state.catCompare;
      render();
      break;

    case 'reset-cat-filters':
      state.catModel = 'all';
      state.catCategory = 'all';
      state.catGrade = 'all';
      state.catSearch = '';
      render();
      break;

    case 'reload-catalog':
      if (isOffline()) {
        toast('Masih offline — menampilkan data katalog terakhir dari cache lokal.', 'warning');
      } else {
        toast('Katalog terbaru berhasil dimuat ulang.', 'success');
      }
      render();
      break;

    case 'est-qty': {
      const id = el.dataset.id;
      const delta = Number(el.dataset.delta);
      const cur = state.estimateCart[id] || 0;
      const next = cur + delta;
      if (next <= 0) delete state.estimateCart[id];
      else state.estimateCart[id] = next;
      render();
      break;
    }

    case 'clear-estimate':
      state.estimateCart = {};
      render();
      break;

    case 'save-estimate': {
      const user = getActiveUser();
      const vehicles = api.getVehicles(user.id);
      const sess = getSession();
      const activeVeh = vehicles.find((v) => v.id === sess?.active_vehicle_id) || vehicles[0];
      const { items: allCat } = api.getCatalog({ workshopId: 'ws-1' });
      const chosen = Object.entries(state.estimateCart)
        .map(([id, qty]) => {
          const p = allCat.find((x) => x.id === id);
          return p && qty > 0 ? { catalog_id: p.id, name: p.name, quantity: qty, price: p.price, install_fee: p.install_fee || 0 } : null;
        })
        .filter(Boolean);
      api.saveEstimate({ vehicle_id: activeVeh?.id || null, workshop_id: 'ws-1', items: chosen });
      state.estimateCart = {};
      toast('Estimasi tersimpan! Kasir Bengkel Maju Jaya Motor bisa langsung menarik daftar ini di layar POS.', 'success');
      render();
      break;
    }

    case 'delete-estimate':
      api.deleteSavedEstimate(el.dataset.id);
      toast('Estimasi tersimpan dihapus.', 'info');
      render();
      break;

    // --- HISTORY, WARRANTY & LOYALTY ---
    case 'history-tab':
      state.historyTab = el.dataset.tab;
      render();
      break;

    case 'show-qr':
      openModal(renderQRModal({
        type: el.dataset.type,
        code: el.dataset.code,
        title: el.dataset.title,
        sub: el.dataset.sub
      }));
      break;

    case 'copy-code':
      if (navigator.clipboard) {
        navigator.clipboard.writeText(el.dataset.code).catch(() => {});
      }
      toast(`Kode ${el.dataset.code} berhasil disalin!`, 'success');
      break;

    case 'view-receipt': {
      const trx = api.getTransactionHistory().find((t) => t.id === el.dataset.id);
      if (trx) openModal(renderReceiptModal(trx));
      break;
    }

    case 'redeem-stamps': {
      const rwd = api.redeemLoyaltyReward();
      toast(`Selamat! Voucher ${rwd.reward_code} berhasil dibuat.`, 'success');
      render();
      openModal(renderQRModal({
        type: 'reward',
        code: rwd.reward_code,
        title: rwd.reward_title,
        sub: `Tunjukkan QR ini ke kasir untuk potongan ${formatRupiah(rwd.discount_value)}.`
      }));
      break;
    }

    // --- POS ACTIONS ---
    case 'pos-select-vehicle':
      state.posVehicleId = el.dataset.id;
      state.posCustomerQuery = '';
      render();
      break;

    case 'pos-clear-customer':
      state.posVehicleId = null;
      state.posAppliedEstimateId = null;
      render();
      break;

    case 'pos-load-estimate': {
      const db = loadDB();
      const est = db.saved_estimates.find((x) => x.id === el.dataset.estId);
      if (est) {
        state.posCart = est.items.map((it) => ({
          catalog_id: it.catalog_id,
          name: it.name,
          unit_price: Number(it.price) + Number(it.install_fee || 0),
          quantity: Number(it.quantity) || 1
        }));
        state.posAppliedEstimateId = est.id;
        toast('Daftar estimasi pelanggan berhasil ditarik ke tagihan kasir!', 'success');
        render();
      }
      break;
    }

    case 'pos-cat-filter':
      state.posCatFilter = el.dataset.val;
      render();
      break;

    case 'pos-add-item': {
      const ws = getActiveWorkshop(getActiveUser());
      const { items } = api.getCatalog({ workshopId: ws.id });
      const prod = items.find((p) => p.id === el.dataset.id);
      if (!prod) break;
      const existing = state.posCart.find((c) => c.catalog_id === prod.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.posCart.push({
          catalog_id: prod.id,
          name: prod.name,
          unit_price: Number(prod.price) + Number(prod.install_fee || 0),
          quantity: 1
        });
      }
      render();
      break;
    }

    case 'pos-qty': {
      const idx = Number(el.dataset.idx);
      const delta = Number(el.dataset.delta);
      if (!state.posCart[idx]) break;
      state.posCart[idx].quantity += delta;
      if (state.posCart[idx].quantity <= 0) state.posCart.splice(idx, 1);
      render();
      break;
    }

    case 'pos-clear-cart':
      state.posCart = [];
      state.posAppliedReward = null;
      state.posAppliedEstimateId = null;
      render();
      break;

    case 'pos-fill-code':
      state.posClaimInput = el.dataset.code;
      state.posVerifyResult = api.verifyClaimCode(el.dataset.code);
      render();
      break;

    case 'pos-apply-reward': {
      const res = api.verifyClaimCode(el.dataset.code);
      if (res.valid && res.type === 'reward') {
        state.posAppliedReward = res.reward;
        if (res.customer) {
          const veh = loadDB().user_vehicles.find((v) => v.user_id === res.customer.id);
          if (veh) state.posVehicleId = veh.id;
        }
        toast(`Potongan voucher ${res.reward.reward_code} diterapkan ke tagihan!`, 'success');
        render();
      }
      break;
    }

    case 'pos-remove-reward':
      state.posAppliedReward = null;
      render();
      break;

    case 'pos-approve-warranty': {
      const claimed = api.claimWarranty(el.dataset.id);
      state.posVerifyResult = null;
      state.posClaimInput = '';
      toast(`Klaim garansi ${claimed.claim_code} (${claimed.item_name}) DISETUJUI! Status berubah menjadi Sudah Diklaim (single-use).`, 'success');
      render();
      break;
    }

    case 'sync-offline-queue': {
      const res = api.syncOfflineQueue();
      toast(`${res.syncedCount} transaksi offline berhasil disinkronkan ke server lokal!`, 'success');
      render();
      break;
    }

    // --- WORKSHOP SETTINGS ---
    case 'ws-tab':
      state.wsTab = el.dataset.tab;
      render();
      break;

    case 'open-catalog-modal':
      openModal(renderCatalogItemModal(null));
      break;

    case 'edit-catalog-item': {
      const ws = getActiveWorkshop(getActiveUser());
      const { items } = api.getCatalog({ workshopId: ws.id });
      const item = items.find((p) => p.id === el.dataset.id);
      if (item) openModal(renderCatalogItemModal(item));
      break;
    }

    case 'delete-catalog-item':
      if (confirm('Hapus item ini dari katalog bengkel?')) {
        api.deleteCatalogItem(el.dataset.id);
        toast('Produk dihapus dari katalog.', 'info');
        render();
      }
      break;

    case 'export-json': {
      const jsonStr = exportDBJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diservisin-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Backup JSON Diservisin berhasil diunduh.', 'success');
      break;
    }

    case 'reset-dummy-data':
      if (confirm('Reset seluruh data transaksi, garansi, stok & stempel ke data dummy awal?')) {
        resetDummyData();
        state.posCart = [];
        state.posAppliedReward = null;
        state.posVerifyResult = null;
        state.estimateCart = {};
        toast('Seluruh data dummy berhasil dikembalikan ke kondisi awal!', 'success');
        render();
      }
      break;
  }
}

// Change events (select filters, file import)
document.addEventListener('change', (e) => {
  const target = e.target;

  if (target.matches('[data-action="switch-vehicle"]')) {
    const sess = getSession();
    if (sess) {
      sess.active_vehicle_id = target.value;
      saveSession(sess);
      state.catModel = undefined;
      render();
    }
    return;
  }

  if (target.matches('[data-filter]')) {
    state[target.getAttribute('data-filter')] = target.value;
    render();
    return;
  }

  if (target.id === 'import-json-input' && target.files && target.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importDBJson(String(reader.result));
        toast('Data backup JSON berhasil diimpor!', 'success');
        render();
      } catch (err) {
        toast(err.message || 'Gagal mengimpor file JSON.', 'danger');
      }
    };
    reader.readAsText(target.files[0]);
  }
});

// Live search inputs (preserve cursor focus cleanly)
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('[data-filter-input]')) {
    const key = t.getAttribute('data-filter-input');
    state[key] = t.value;
    const pos = t.selectionStart;
    render();
    const reEl = document.querySelector(`[data-filter-input="${key}"]`);
    if (reEl) {
      reEl.focus();
      reEl.setSelectionRange(pos, pos);
    }
  } else if (t.matches('[data-pos-input]')) {
    const key = t.getAttribute('data-pos-input');
    state[key] = t.value;
    const pos = t.selectionStart;
    render();
    const reEl = document.querySelector(`[data-pos-input="${key}"]`);
    if (reEl) {
      reEl.focus();
      reEl.setSelectionRange(pos, pos);
    }
  }
});

// Form submissions
document.addEventListener('submit', (e) => {
  const form = e.target;
  e.preventDefault();
  const fd = new FormData(form);

  try {
    if (form.id === 'login-form') {
      const { user } = api.login({
        identifier: fd.get('identifier'),
        role: state.loginRole
      });
      toast(`Selamat datang, ${user.name}!`, 'success');
      navigate(user.role === 'bengkel_admin' ? '/pos' : '/home');
      return;
    }

    if (form.id === 'register-form') {
      const { user } = api.register({
        name: fd.get('name'),
        phone_number: fd.get('phone_number'),
        email: fd.get('email'),
        role: state.loginRole
      });
      toast(`Akun ${user.name} berhasil didaftarkan!`, 'success');
      navigate(user.role === 'bengkel_admin' ? '/pos' : '/home');
      return;
    }

    if (form.id === 'vehicle-form') {
      const id = form.dataset.id;
      const data = {
        brand: fd.get('brand'),
        model: fd.get('model'),
        year: Number(fd.get('year')),
        license_plate: fd.get('license_plate'),
        last_odometer: Number(fd.get('last_odometer'))
      };
      if (id) {
        api.updateVehicle(id, data);
        toast('Data motor berhasil diperbarui.', 'success');
      } else {
        api.addVehicle(data);
        toast('Motor baru berhasil ditambahkan ke garasi!', 'success');
      }
      closeModal();
      render();
      return;
    }

    if (form.matches('[data-form="update-odo"]')) {
      const id = form.dataset.id;
      const newOdo = Number(fd.get('last_odometer'));
      api.updateVehicle(id, { last_odometer: newOdo });
      toast(`Odometer diperbarui ke ${newOdo.toLocaleString('id-ID')} km. Pengingat oli & batas garansi otomatis disesuaikan.`, 'success');
      render();
      return;
    }

    if (form.id === 'pos-verify-form') {
      const code = String(fd.get('claim_code') || '').trim();
      state.posClaimInput = code;
      state.posVerifyResult = api.verifyClaimCode(code);
      render();
      return;
    }

    if (form.id === 'pos-checkout-form') {
      const db = loadDB();
      const veh = db.user_vehicles.find((v) => v.id === state.posVehicleId) || null;
      const res = api.createTransaction({
        customer_user_id: veh ? veh.user_id : null,
        vehicle_id: veh ? veh.id : null,
        odometer_at_service: Number(fd.get('odometer_at_service')) || 0,
        items: state.posCart,
        payment_method: fd.get('payment_method'),
        notes: String(fd.get('notes') || ''),
        reward_code: state.posAppliedReward ? state.posAppliedReward.reward_code : null,
        applied_estimate_id: state.posAppliedEstimateId
      });

      state.posCart = [];
      state.posAppliedReward = null;
      state.posAppliedEstimateId = null;
      state.posVerifyResult = null;
      state.posClaimInput = '';

      if (res.queued) {
        toast('Offline: Transaksi disimpan aman di Antrean Lokal. Akan tersinkron otomatis saat Online!', 'warning');
        render();
      } else {
        toast(
          `Nota ${res.transaction.transaction_number} terbit! ${res.warranties.length} Garansi aktif${res.stampAdded ? ' + 1 Stempel Loyalitas ditambahkan!' : '.'}`,
          'success'
        );
        render();
        const fullTrx = api.getTransactionHistory().find((t) => t.id === res.transaction.id);
        if (fullTrx) openModal(renderReceiptModal(fullTrx));
      }
      return;
    }

    if (form.id === 'workshop-settings-form') {
      api.updateWorkshopProfile({
        workshop_name: String(fd.get('workshop_name')).trim(),
        address: String(fd.get('address')).trim(),
        phone: String(fd.get('phone')).trim(),
        operating_hours: {
          weekdays: String(fd.get('weekdays')).trim(),
          saturday: '08:00 - 17:00',
          sunday: '09:00 - 15:00'
        },
        default_warranty_days: Number(fd.get('default_warranty_days')) || 30,
        default_warranty_km: Number(fd.get('default_warranty_km')) || 2000,
        loyalty_target_stamps: Number(fd.get('loyalty_target_stamps')) || 5,
        loyalty_reward_value: Number(fd.get('loyalty_reward_value')) || 65000,
        loyalty_reward_title: String(fd.get('loyalty_reward_title')).trim(),
        loyalty_reward_desc: String(fd.get('loyalty_reward_desc')).trim()
      });
      toast('Pengaturan profil bengkel, garansi & loyalitas tersimpan!', 'success');
      render();
      return;
    }

    if (form.id === 'catalog-item-form') {
      const modelsRaw = String(fd.get('compatible_models') || '');
      api.upsertCatalogItem({
        id: form.dataset.id || undefined,
        name: String(fd.get('name')).trim(),
        category: fd.get('category'),
        grade: fd.get('grade'),
        brand: String(fd.get('brand')).trim(),
        specs: String(fd.get('specs')).trim(),
        compatible_models: modelsRaw.split(',').map((s) => s.trim()).filter(Boolean),
        price: Number(fd.get('price')) || 0,
        install_fee: Number(fd.get('install_fee')) || 0,
        stock: Number(fd.get('stock')) || 0,
        min_stock: Number(fd.get('min_stock')) || 4,
        warranty_days: Number(fd.get('warranty_days')) || 0,
        warranty_km: Number(fd.get('warranty_km')) || 0
      });
      closeModal();
      toast('Katalog produk berhasil disimpan!', 'success');
      render();
      return;
    }
  } catch (err) {
    toast(err.message || 'Gagal memproses permintaan.', 'danger');
  }
});

// Listen to Escape key for modal & drawer dismissal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalRoot.innerHTML) {
      closeModal();
    } else if (state.drawerOpen) {
      state.drawerOpen = false;
      render();
    }
  }
});

// Listen to browser hashchange & online/offline network events
window.addEventListener('hashchange', () => {
  const r = getHashRoute();
  if (r && r !== state.route) {
    state.route = r;
    render();
  }
});

window.addEventListener('online', () => {
  if (!getSimulatedOffline()) {
    const res = api.syncOfflineQueue();
    if (res.syncedCount > 0) {
      toast(`Jaringan kembali online! ${res.syncedCount} transaksi POS tersinkron otomatis.`, 'success');
    }
    render();
  }
});

window.addEventListener('offline', () => {
  toast('Koneksi terputus — beralih ke mode Offline-First.', 'warning');
  render();
});

// ============================================================================
// BOOTSTRAP APP (Pre-loaded Seed Data + Auto-Demo Session on first load)
// ============================================================================
(function bootstrap() {
  loadDB(); // Ensures seed data is immediately present in localStorage
  if (!getSession()) {
    // Auto-start in pre-loaded Customer demo session so user sees live Honda Vario 150 immediately
    api.switchRole('customer');
  }
  const initialHash = getHashRoute();
  const user = getActiveUser();
  state.route = initialHash || (user?.role === 'bengkel_admin' ? '/pos' : '/home');
  render();
})();
