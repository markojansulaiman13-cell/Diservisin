import { icon } from './icons.js';
import { renderQRSvg } from './qrcode.js';
import {
  api,
  loadDB,
  getSession,
  saveSession,
  getActiveUser,
  evaluateOilReminder,
  formatRupiah,
  formatNumber,
  formatDateID,
  formatDateTimeID,
  isOffline
} from './api.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getActiveVehicle(vehicles) {
  if (!vehicles.length) return null;
  const sess = getSession();
  return vehicles.find((v) => v.id === sess?.active_vehicle_id) || vehicles[0];
}

// ============================================================================
// SCREEN 1: /login
// ============================================================================
export function renderLoginView(state, ctx) {
  const mode = state.loginMode || 'login'; // login | register
  const selectedRole = state.loginRole || 'customer';
  const otpSent = Boolean(state.otpSent);

  return `
    <div class="login-page">
      <div class="login-container">
        <div class="login-hero">
          <div class="stack">
            <div class="login-hero-logo">
              <img src="./assets/logo.png" alt="Logo Diservisin" />
              <div>
                <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:24px;line-height:1.1;">Diservisin</div>
                <div style="font-size:12.5px;color:#CBD5E1;font-weight:600;">Servis Transparan · Garansi Digital</div>
              </div>
            </div>
            <div style="margin-top:8px;">
              <h1 style="color:#fff;font-size:24px;line-height:1.25;margin-bottom:10px;">Servis Motor Tanpa Waswas, Nota &amp; Garansi Anti-Hilang.</h1>
              <p style="color:#CBD5E1;font-size:14px;margin:0;">Cek spek &amp; estimasi harga oli/sparepart sebelum ke bengkel, simpan garansi digital terukur, dan kumpulkan stempel gratis ganti oli otomatis.</p>
            </div>
            <ul class="login-feature-list">
              <li>${icon('checkCircle', 18)} <span><strong>Transparansi Harga &amp; Kualitas:</strong> Bandingkan Original (OEM) vs Aftermarket lengkap dengan estimasi jasa pasang.</span></li>
              <li>${icon('shieldCheck', 18)} <span><strong>Kartu Garansi Digital:</strong> Pantau sisa hari &amp; kilometer garansi langsung dari HP, klaim cukup tunjukkan QR.</span></li>
              <li>${icon('award', 18)} <span><strong>Loyalitas &amp; Kasir Bengkel:</strong> 5x ganti oli gratis 1x oli + merch, tercatat otomatis dari layar POS bengkel.</span></li>
            </ul>
          </div>
          <div style="font-size:12px;color:#94A3B8;display:flex;align-items:center;gap:8px;position:relative;z-index:1;">
            ${icon('lock', 14)} Privasi terjaga (UU PDP) · Zero-Cost Local Demo Mode
          </div>
        </div>

        <div class="login-form-pane">
          <div class="tabs" style="margin-bottom:18px;">
            <button type="button" class="tab-btn ${mode === 'login' ? 'active' : ''}" data-action="login-mode" data-mode="login">Masuk Akun</button>
            <button type="button" class="tab-btn ${mode === 'register' ? 'active' : ''}" data-action="login-mode" data-mode="register">Daftar Baru</button>
          </div>

          <div class="form-label" style="margin-bottom:8px;">Pilih Peran Akun</div>
          <div class="role-toggle-grid">
            <button type="button" class="role-card-btn ${selectedRole === 'customer' ? 'selected' : ''}" data-action="login-role" data-role="customer">
              <div class="row" style="color:var(--primary);font-weight:800;font-size:14px;">${icon('bike', 18)} Pemilik Motor</div>
              <div class="text-xs muted">Cek katalog, garansi digital &amp; stempel loyalitas</div>
            </button>
            <button type="button" class="role-card-btn ${selectedRole === 'bengkel_admin' ? 'selected-accent' : ''}" data-action="login-role" data-role="bengkel_admin">
              <div class="row" style="color:var(--accent-hover);font-weight:800;font-size:14px;">${icon('store', 18)} Mitra Bengkel</div>
              <div class="text-xs muted">Kasir POS, terbitkan nota/garansi &amp; stok</div>
            </button>
          </div>

          ${mode === 'login' ? `
            <form id="login-form" class="stack-sm">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="login-identifier">Nomor WhatsApp atau Email</label>
                <input id="login-identifier" name="identifier" class="form-input" placeholder="${selectedRole === 'customer' ? '081234567890' : '081311223344'}" value="${esc(state.loginIdentifier || (selectedRole === 'customer' ? '081234567890' : '081311223344'))}" required />
              </div>

              ${otpSent ? `
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" for="login-otp">Kode Verifikasi OTP (Simulasi: 123456)</label>
                  <input id="login-otp" name="otp" class="form-input num" value="123456" maxlength="6" required />
                  <div class="text-xs" style="color:var(--success-dark);font-weight:600;">Kode OTP simulasi telah dikirim (tanpa biaya SMS).</div>
                </div>
                <button type="submit" class="btn btn-primary btn-lg btn-block">${icon('checkCircle', 18)} Verifikasi &amp; Masuk</button>
              ` : `
                <button type="button" class="btn btn-primary btn-lg btn-block" data-action="send-otp">${icon('messageCircle', 18)} Kirim OTP Simulasi</button>
              `}
            </form>
          ` : `
            <form id="register-form" class="stack-sm">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Nama Lengkap / Nama Pemilik</label>
                <input name="name" class="form-input" placeholder="Contoh: Dimas Saputra" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Nomor WhatsApp</label>
                <input name="phone_number" class="form-input num" placeholder="0812xxxxxxxx" required />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Email (Opsional)</label>
                <input name="email" type="email" class="form-input" placeholder="nama@email.id" />
              </div>
              <button type="submit" class="btn btn-primary btn-lg btn-block">${icon('sparkles', 18)} Daftar &amp; Masuk Sekarang</button>
            </form>
          `}

          <div class="divider" style="margin:20px 0 14px;"></div>
          <div class="text-xs muted" style="text-align:center;margin-bottom:10px;font-weight:600;">Uji Cepat 1-Klik (Pre-loaded Seed Data)</div>
          <div class="grid-2" style="gap:8px;">
            <button type="button" class="btn btn-outline btn-sm" data-action="quick-demo" data-role="customer">
              ${icon('user', 16)} Demo Customer (Raka)
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-action="quick-demo" data-role="bengkel_admin">
              ${icon('store', 16)} Demo Kasir Bengkel
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// SCREEN 2: /home (Planet Ban-Inspired Full-Bleed Diservisin Storefront)
// ============================================================================

const ARROW_WATERMARK_SVG = `
  <svg class="pb-section-watermark" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M55 155L135 75M135 75H78M135 75V132" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M125 185L205 105M205 105H148M205 105V162" stroke="currentColor" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity="0.65"/>
    <path d="M12 108L76 44M76 44H32M76 44V88" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  </svg>
`;

function filterShowcaseItems(items, filterKey) {
  const list = [...items];
  if (filterKey === 'diskon') {
    const discounted = list.filter((p) => p.original_price && p.original_price > p.price);
    return discounted.length ? discounted : list;
  }
  if (filterKey === 'terbaru') {
    return list.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
  }
  if (filterKey === 'ori') {
    const ori = list.filter((p) => p.grade === 'original');
    return ori.length ? ori : list;
  }
  // default: paling laku (sold_count desc)
  return list.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
}

function renderStoreProductCard(p, qty) {
  const hasDiscount = p.original_price && p.original_price > p.price;
  return `
    <div class="pb-product-card" data-action="open-product-detail" data-id="${p.id}">
      ${hasDiscount
        ? '<span class="pb-ribbon">Diskon Harga</span>'
        : p.grade === 'original'
          ? '<span class="pb-ribbon is-ori">Original OEM</span>'
          : ''}
      <div class="pb-product-img-wrap">
        <img src="${esc(p.image || './assets/logo.png')}" alt="${esc(p.name)}" loading="lazy" />
      </div>
      <div class="pb-product-body">
        <div class="pb-product-name">${esc(p.name)}</div>
        ${p.rating ? `
          <div class="pb-rating">
            <span class="star-ico">${icon('star', 13)}</span>
            <span class="num">${Number(p.rating).toFixed(1)}</span>
            <span class="rating-cnt num">(${p.rating_count || 12})</span>
          </div>
        ` : ''}
        <div class="pb-price-block">
          <div class="pb-price-row">
            <div>
              <div class="pb-price-main">${formatRupiah(p.price)}</div>
              ${hasDiscount ? `<div class="pb-price-strike">${formatRupiah(p.original_price)}</div>` : `<div class="text-xs muted" style="font-size:11px;">Grs ${p.warranty_days}hr</div>`}
            </div>
            <button type="button" class="pb-quick-add ${qty > 0 ? 'in-cart' : ''}" data-action="est-qty" data-id="${p.id}" data-delta="1" title="Tambah ke Estimasi" aria-label="Tambah ${esc(p.name)} ke estimasi">
              ${qty > 0 ? `<span class="num" style="font-size:12px;font-weight:800;">${qty}</span>` : icon('plus', 16)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCircleDock({ activeWarrantiesCount, pendingRewardsCount, workshop, user, activeVeh }) {
  const waMsg = `Halo ${workshop.workshop_name}, saya ${user.name} ingin konsultasi servis untuk motor ${activeVeh ? `${activeVeh.brand} ${activeVeh.model} (${activeVeh.license_plate})` : ''} via Diservisin.`;
  return `
    <div class="pb-circle-dock">
      <button type="button" class="pb-circle-item" data-nav="/garage">
        <span class="pb-circle-btn">${icon('mapPin', 24)}</span>
        <span class="pb-circle-label">Garasi &amp; KM</span>
      </button>
      <button type="button" class="pb-circle-item" data-nav="/history">
        <span class="pb-circle-btn">
          ${icon('shieldCheck', 24)}
          ${activeWarrantiesCount ? `<span class="pb-circle-badge num">${activeWarrantiesCount}</span>` : ''}
        </span>
        <span class="pb-circle-label">Garansi</span>
      </button>
      <button type="button" class="pb-circle-item" data-nav="/loyalty">
        <span class="pb-circle-btn">
          ${icon('percent', 24)}
          ${pendingRewardsCount ? `<span class="pb-circle-badge num">${pendingRewardsCount}</span>` : ''}
        </span>
        <span class="pb-circle-label">Promo &amp; Poin</span>
      </button>
      <a class="pb-circle-item" target="_blank" rel="noopener" href="https://wa.me/${esc(workshop.phone)}?text=${encodeURIComponent(waMsg)}">
        <span class="pb-circle-btn">${icon('messageCircle', 24)}</span>
        <span class="pb-circle-label">Hubungi CS</span>
      </a>
    </div>
  `;
}

export function renderHomeView(state, ctx) {
  const user = getActiveUser();
  const vehicles = api.getVehicles(user.id);
  const activeVeh = getActiveVehicle(vehicles);
  const loyalty = api.getLoyaltySummary(user.id);
  const warranties = api.getWarranties();
  const activeWarranties = warranties.filter((w) => w.effectiveStatus === 'active');
  const workshops = api.getWorkshops();
  const primaryWorkshop = workshops[0];
  const reminder = activeVeh ? evaluateOilReminder(activeVeh) : null;
  const pendingRewards = loyalty.rewards.filter((r) => r.status === 'pending');

  const { items: allItems } = api.getCatalog({ workshopId: 'ws-1' });
  const estMap = state.estimateCart || {};

  const banItems = filterShowcaseItems(allItems.filter((p) => p.part_type === 'ban'), state.homeFilterBan || 'laku');
  const oliItems = filterShowcaseItems(allItems.filter((p) => p.category === 'oli'), state.homeFilterOli || 'laku');
  const partItems = filterShowcaseItems(allItems.filter((p) => p.category === 'sparepart' && p.part_type !== 'ban'), state.homeFilterPart || 'laku');
  const servisItems = filterShowcaseItems(allItems.filter((p) => p.category === 'jasa'), state.homeFilterServis || 'laku');

  const slide = Number(state.heroSlide || 0) % 3;
  const dockHtml = renderCircleDock({
    activeWarrantiesCount: activeWarranties.length,
    pendingRewardsCount: pendingRewards.length,
    workshop: primaryWorkshop,
    user,
    activeVeh
  });

  const heroSlideContent =
    slide === 0
      ? `
        <div class="pb-hero-kicker">Cek Estimasi Sekarang</div>
        <h1 class="pb-hero-3d">
          Ekstra<br/>Diskon
          <span class="accent-yellow">10%</span>
        </h1>
        <div class="pb-hero-visual">
          <img src="./assets/hero/hero-basket.jpg" alt="Paket Sparepart, Ban & Oli Motor Diservisin" />
        </div>
        <div class="pb-hero-footnote">
          <span class="pb-hero-note-badge">${icon('gift', 13)}</span>
          <span>*Hemat hingga <strong>Rp65.000</strong> via Voucher Loyalitas</span>
        </div>
        <div class="pb-hero-subnote">*Tunjukkan estimasi &amp; kode QR di kasir ${esc(primaryWorkshop.workshop_name)}, ya!</div>
      `
      : slide === 1
        ? `
          <div class="pb-hero-kicker">Nota Kertas Gampang Hilang?</div>
          <h1 class="pb-hero-3d">
            Garansi
            <span class="accent-yellow">100%</span>
            Digital
          </h1>
          <div class="pb-hero-card-graphic">
            <div class="row-between" style="margin-bottom:10px;">
              <span class="badge" style="background:#FFE100;color:#0D172B;">${icon('shieldCheck', 14)} ${activeWarranties.length} Garansi Aktif</span>
              <span class="text-xs" style="color:#BFDBFE;">Single-use QR Verified</span>
            </div>
            <div style="font-size:15px;font-weight:700;margin-bottom:6px;">Terukur Hari &amp; Kilometer di HP</div>
            <p class="text-xs" style="color:#E2E8F0;margin:0 0 12px;">Cek sisa masa berlaku suku cadang &amp; oli kapan saja. Klaim di bengkel tinggal tunjukkan QR.</p>
            <button type="button" class="btn btn-accent btn-sm btn-block" data-nav="/history">${icon('qrCode', 16)} Buka Kartu Garansi Digital</button>
          </div>
          <div class="pb-hero-subnote">*Syarat &amp; batas kilometer tercantum transparan sejak nota diterbitkan</div>
        `
        : `
          <div class="pb-hero-kicker">Khusus Pelanggan Setia</div>
          <h1 class="pb-hero-3d">
            5× Ganti
            <span class="accent-yellow">GRATIS</span>
            1× Oli
          </h1>
          <div class="pb-hero-card-graphic">
            <div class="row-between" style="margin-bottom:8px;">
              <span style="font-weight:800;font-size:15px;">Progres Stempel Kamu</span>
              <span class="badge" style="background:#FF6800;color:#fff;">${loyalty.currentProgress} / ${loyalty.target} Stempel</span>
            </div>
            <div class="progress-track" style="background:rgba(255,255,255,0.2);margin-bottom:10px;">
              <div class="progress-fill success" style="width:${Math.min(100, (loyalty.currentProgress / loyalty.target) * 100)}%;"></div>
            </div>
            <div class="text-xs" style="color:#E2E8F0;margin-bottom:12px;">${esc(primaryWorkshop.loyalty_reward_title)}</div>
            <button type="button" class="btn btn-accent btn-sm btn-block" data-nav="/loyalty">${icon('award', 16)} Lihat Kartu &amp; Tukar Voucher</button>
          </div>
          <div class="pb-hero-subnote">*Stempel bertambah otomatis setiap transaksi valid di kasir bengkel</div>
        `;

  return `
    <!-- Floating Left-Edge Orange Tab (Planet Ban signature Feedback/Motor shortcut) -->
    <button type="button" class="pb-floating-tab" data-action="open-quick-bike" title="Cek Kondisi Motor & Pengingat Oli">
      ${icon('smile', 14)} <span>Cek Motor</span>
    </button>

    <!-- HERO PROMO SECTION (Royal Blue #004FE0) -->
    <section class="pb-hero" id="sec-hero" data-pb-theme="theme-blue">
      <div class="pb-hero-dots" aria-label="Navigasi slide promo">
        ${[0, 1, 2].map((i) => `<button type="button" class="pb-hero-dot ${slide === i ? 'active' : ''}" data-action="hero-slide" data-idx="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}
      </div>

      <div class="pb-hero-inner">
        ${heroSlideContent}

        <div class="pb-hero-arrows">
          <button type="button" class="pb-arrow-circle" data-action="hero-slide" data-idx="${(slide + 2) % 3}" aria-label="Promo sebelumnya">${icon('chevronLeft', 20)}</button>
          <button type="button" class="pb-arrow-circle" data-action="hero-slide" data-idx="${(slide + 1) % 3}" aria-label="Promo berikutnya">${icon('chevronRight', 20)}</button>
        </div>

        <!-- Compact Active Motorcycle & Oil Reminder Bar -->
        ${activeVeh ? `
          <div class="pb-bike-strip">
            <div class="row" style="gap:10px;min-width:0;">
              <div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ${icon('bike', 21)}
              </div>
              <div style="min-width:0;">
                <div class="row" style="gap:6px;flex-wrap:wrap;">
                  <strong style="font-size:14px;">${esc(activeVeh.brand)} ${esc(activeVeh.model)}</strong>
                  <span class="plate-badge" style="font-size:11px;padding:2px 7px;">${esc(activeVeh.license_plate)}</span>
                </div>
                <div class="text-xs" style="color:#CBD5E1;margin-top:2px;">
                  Odo <strong class="num" style="color:#fff;">${formatNumber(activeVeh.last_odometer)} km</strong>
                  ${reminder ? ` · Oli: <strong style="color:${reminder.urgency === 'overdue' ? '#FCA5A5' : reminder.urgency === 'soon' ? '#FFE100' : '#86EFAC'};">${reminder.urgency === 'overdue' ? 'Jatuh Tempo!' : `sisa ${formatNumber(Math.max(0, reminder.kmRemaining))} km`}</strong>` : ''}
                </div>
              </div>
            </div>
            <div class="row" style="gap:6px;">
              ${vehicles.length > 1 ? `
                <select class="form-select" data-action="switch-vehicle" style="width:auto;min-height:36px;padding:4px 10px;font-size:12px;font-weight:700;border-radius:9px;background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.28);">
                  ${vehicles.map((v) => `<option value="${v.id}" ${v.id === activeVeh.id ? 'selected' : ''} style="color:#0D172B;">${esc(v.model)}</option>`).join('')}
                </select>
              ` : ''}
              <button type="button" class="btn btn-sm" style="min-height:36px;background:#FFE100;color:#0D172B;font-weight:800;border-radius:9px;" data-nav="/garage">Update KM</button>
            </div>
          </div>
        ` : ''}
      </div>
    </section>

    <!-- SECTION 1: BAN MOTOR (Royal Blue #004FE0 — Matches Planet Ban Screenshot 2) -->
    <section class="pb-section theme-blue" id="sec-ban" data-pb-theme="theme-blue">
      ${ARROW_WATERMARK_SVG}
      <div class="pb-section-inner">
        <h2 class="pb-section-heading">Pilihan Ban Motor Berkualitas dan Tahan Lama</h2>
        <div class="pb-filter-pills">
          <button type="button" class="pb-pill ${(state.homeFilterBan || 'laku') === 'laku' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterBan" data-val="laku">
            <span class="flame-ico">${icon('flame', 15)}</span> Paling Laku
          </button>
          <button type="button" class="pb-pill ${state.homeFilterBan === 'diskon' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterBan" data-val="diskon">
            ${icon('percent', 14)} Lagi Diskon
          </button>
          <button type="button" class="pb-pill ${state.homeFilterBan === 'terbaru' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterBan" data-val="terbaru">
            ${icon('flag', 14)} Terbaru
          </button>
        </div>

        <div class="pb-card-rail">
          ${banItems.map((p) => renderStoreProductCard(p, estMap[p.id] || 0)).join('')}
        </div>

        <button type="button" class="pb-see-all-btn" data-action="open-catalog-cat" data-cat="ban">
          Lihat Semua ${icon('arrowRight', 17)}
        </button>

        ${dockHtml}
      </div>
    </section>

    <!-- SECTION 2: OLI MOTOR (Deep Racing Red #9C110B — Matches Planet Ban Screenshot 3) -->
    <section class="pb-section theme-red" id="sec-oli" data-pb-theme="theme-red">
      ${ARROW_WATERMARK_SVG}
      <div class="pb-section-inner">
        <h2 class="pb-section-heading">Menjaga Suhu Mesin Tetap Stabil,<br/>Tahan Lama hingga 5000 KM</h2>
        <div class="pb-filter-pills">
          <button type="button" class="pb-pill ${(state.homeFilterOli || 'laku') === 'laku' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterOli" data-val="laku">
            <span class="flame-ico">${icon('flame', 15)}</span> Paling Laku
          </button>
          <button type="button" class="pb-pill ${state.homeFilterOli === 'diskon' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterOli" data-val="diskon">
            ${icon('percent', 14)} Lagi Diskon
          </button>
          <button type="button" class="pb-pill ${state.homeFilterOli === 'ori' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterOli" data-val="ori">
            ${icon('flag', 14)} Original OEM
          </button>
        </div>

        <div class="pb-card-rail">
          ${oliItems.map((p) => renderStoreProductCard(p, estMap[p.id] || 0)).join('')}
        </div>

        <button type="button" class="pb-see-all-btn" data-action="open-catalog-cat" data-cat="oli">
          Lihat Semua ${icon('arrowRight', 17)}
        </button>

        ${dockHtml}
      </div>
    </section>

    <!-- SECTION 3: SPAREPART (Carbon Slate #0D172B) -->
    <section class="pb-section theme-slate" id="sec-sparepart" data-pb-theme="theme-slate">
      ${ARROW_WATERMARK_SVG}
      <div class="pb-section-inner">
        <h2 class="pb-section-heading">Suku Cadang Original &amp; Aftermarket Harga Transparan</h2>
        <div class="pb-filter-pills">
          <button type="button" class="pb-pill ${(state.homeFilterPart || 'laku') === 'laku' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterPart" data-val="laku">
            <span class="flame-ico">${icon('flame', 15)}</span> Paling Laku
          </button>
          <button type="button" class="pb-pill ${state.homeFilterPart === 'diskon' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterPart" data-val="diskon">
            ${icon('percent', 14)} Lagi Diskon
          </button>
          <button type="button" class="pb-pill ${state.homeFilterPart === 'ori' ? 'active' : ''}" data-action="home-filter" data-sec="homeFilterPart" data-val="ori">
            ${icon('flag', 14)} Original OEM
          </button>
        </div>

        <div class="pb-card-rail">
          ${partItems.map((p) => renderStoreProductCard(p, estMap[p.id] || 0)).join('')}
        </div>

        <button type="button" class="pb-see-all-btn" data-action="open-catalog-cat" data-cat="sparepart">
          Bandingkan Ori vs Aftermarket ${icon('arrowRight', 17)}
        </button>
      </div>
    </section>

    <!-- SECTION 4: SERVIS & BENGKEL MITRA (Deep Cobalt #003CB0) -->
    <section class="pb-section theme-cobalt" id="sec-servis" data-pb-theme="theme-cobalt" style="padding-bottom:108px;">
      ${ARROW_WATERMARK_SVG}
      <div class="pb-section-inner">
        <h2 class="pb-section-heading">Servis Berkala Bergaransi Digital Anti-Hilang</h2>

        <div class="pb-card-rail">
          ${servisItems.map((p) => renderStoreProductCard(p, estMap[p.id] || 0)).join('')}
          <div class="pb-product-card" style="background:linear-gradient(155deg,#0D172B,#1E3A8A);color:#fff;padding:18px;" data-nav="/loyalty">
            <span class="badge badge-orange" style="align-self:flex-start;">${icon('award', 13)} Loyalitas</span>
            <div style="margin:14px 0;">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:18px;line-height:1.25;">${loyalty.currentProgress}/${loyalty.target} Stempel Ganti Oli</div>
              <p class="text-xs" style="color:#CBD5E1;margin:6px 0 0;">${esc(primaryWorkshop.loyalty_reward_title)}</p>
            </div>
            <span class="btn btn-accent btn-sm btn-block">Buka Loyalitas →</span>
          </div>
        </div>

        <div style="margin-top:18px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div class="text-xs" style="color:#FFE100;font-weight:700;">BENGKEL MITRA TERDEKAT · BUKA ${esc(primaryWorkshop.operating_hours.weekdays)}</div>
            <div style="font-weight:800;font-size:15.5px;margin-top:2px;">${esc(primaryWorkshop.workshop_name)}</div>
            <div class="text-xs" style="color:#CBD5E1;">${esc(primaryWorkshop.address)}</div>
          </div>
          <button type="button" class="pb-see-all-btn" style="margin-top:0;" data-action="open-catalog-cat" data-cat="all">
            Kalkulator Estimasi ${icon('arrowRight', 16)}
          </button>
        </div>

        ${dockHtml}
      </div>
    </section>
  `;
}

// ============================================================================
// SCREEN 3: /garage (Manage Motorcycles & Odometer)
// ============================================================================
export function renderGarageView(state, ctx) {
  const user = getActiveUser();
  const vehicles = api.getVehicles(user.id);
  const activeVeh = getActiveVehicle(vehicles);

  return `
    <div class="stack">
      <div class="row-between">
        <div>
          <h1 style="font-size:22px;">Garasi Motor Saya</h1>
          <p class="text-sm muted" style="margin:2px 0 0;">Daftarkan lebih dari 1 motor dan perbarui odometer agar pengingat oli &amp; sisa garansi selalu akurat.</p>
        </div>
        <button type="button" class="btn btn-primary" data-action="open-vehicle-modal">${icon('plus', 18)} Tambah Motor</button>
      </div>

      ${vehicles.length === 0 ? `
        <div class="card card-white" style="text-align:center;padding:36px 20px;">
          <div style="color:var(--steel-light);margin-bottom:10px;">${icon('bike', 44)}</div>
          <h3>Garasi Masih Kosong</h3>
          <p class="text-sm muted">Tambahkan motor pertamamu untuk mulai cek kecocokan sparepart &amp; jadwal oli.</p>
          <button type="button" class="btn btn-primary" data-action="open-vehicle-modal">${icon('plus', 18)} Tambah Motor</button>
        </div>
      ` : `
        <div class="grid-2">
          ${vehicles.map((v) => {
            const isActive = activeVeh && activeVeh.id === v.id;
            const rem = evaluateOilReminder(v);
            return `
              <div class="card card-white" style="border:2px solid ${isActive ? 'var(--primary)' : 'var(--border)'};">
                <div class="row-between" style="margin-bottom:10px;">
                  <div class="row" style="gap:8px;">
                    <span class="plate-badge">${esc(v.license_plate)}</span>
                    ${isActive ? '<span class="badge badge-blue">Motor Aktif</span>' : ''}
                  </div>
                  <div class="row" style="gap:4px;">
                    <button type="button" class="btn btn-ghost btn-sm" title="Edit Motor" data-action="edit-vehicle" data-id="${v.id}">${icon('edit', 16)}</button>
                    ${vehicles.length > 1 ? `<button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger-dark);" title="Hapus Motor" data-action="delete-vehicle" data-id="${v.id}">${icon('trash', 16)}</button>` : ''}
                  </div>
                </div>

                <h3 style="font-size:18px;">${esc(v.brand)} ${esc(v.model)} <span class="muted" style="font-weight:600;font-size:14px;">(${v.year})</span></h3>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0;padding:12px;border-radius:12px;background:var(--bg);">
                  <div>
                    <div class="text-xs muted">Odometer Terakhir</div>
                    <div class="num font-bold" style="font-size:18px;">${formatNumber(v.last_odometer)} km</div>
                  </div>
                  <div>
                    <div class="text-xs muted">Target Ganti Oli</div>
                    <div class="num font-bold" style="font-size:18px;color:${rem.urgency === 'overdue' ? 'var(--danger-dark)' : rem.urgency === 'soon' ? 'var(--warning-dark)' : 'var(--success-dark)'};">
                      ${formatNumber(rem.nextOilOdo)} km
                    </div>
                  </div>
                </div>

                <form class="row" data-form="update-odo" data-id="${v.id}" style="gap:8px;margin-bottom:12px;">
                  <input type="number" name="last_odometer" class="form-input num" min="${v.last_odometer}" value="${v.last_odometer}" style="flex:1;" aria-label="Update odometer ${esc(v.model)}" />
                  <button type="submit" class="btn btn-outline btn-sm" style="min-height:44px;white-space:nowrap;">${icon('gauge', 16)} Update KM</button>
                </form>

                <div class="row-between">
                  <span class="badge ${rem.urgency === 'overdue' ? 'badge-red' : rem.urgency === 'soon' ? 'badge-amber' : 'badge-green'}">
                    ${rem.urgency === 'overdue' ? 'Waktunya Ganti Oli!' : rem.urgency === 'soon' ? `Sisa ${formatNumber(Math.max(0, rem.kmRemaining))} km lagi` : `Aman · Sisa ${formatNumber(rem.kmRemaining)} km`}
                  </span>
                  ${!isActive ? `
                    <button type="button" class="btn btn-primary btn-sm" data-action="set-active-vehicle" data-id="${v.id}">Pilih Aktif</button>
                  ` : `
                    <button type="button" class="btn btn-outline btn-sm" data-nav="/catalog">Cek Sparepart ${icon('chevronRight', 15)}</button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

// ============================================================================
// SCREEN 4: /catalog (Transparent Catalog, Ori vs Aftermarket & Cost Estimator)
// ============================================================================
export function renderCatalogView(state, ctx) {
  const user = getActiveUser();
  const vehicles = api.getVehicles(user.id);
  const activeVeh = getActiveVehicle(vehicles);

  const filterModel = state.catModel !== undefined ? state.catModel : (activeVeh ? activeVeh.model : 'all');
  const filterCat = state.catCategory || 'all';
  const filterGrade = state.catGrade || 'all';
  const search = state.catSearch || '';
  const compareOpen = Boolean(state.catCompare);

  const { items: rawItems, fromCache, cachedAt } = api.getCatalog({
    workshopId: 'ws-1',
    category: filterCat === 'ban' ? 'sparepart' : filterCat,
    grade: filterGrade,
    model: filterModel,
    search
  });
  const items =
    filterCat === 'ban'
      ? rawItems.filter((p) => p.part_type === 'ban')
      : filterCat === 'sparepart'
        ? rawItems.filter((p) => p.part_type !== 'ban')
        : rawItems;

  const estMap = state.estimateCart || {};
  const allCatalog = api.getCatalog({ workshopId: 'ws-1' }).items;
  const estItems = Object.entries(estMap)
    .map(([id, qty]) => {
      const prod = allCatalog.find((p) => p.id === id);
      return prod && qty > 0 ? { ...prod, quantity: qty } : null;
    })
    .filter(Boolean);

  const estPartsTotal = estItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const estFeeTotal = estItems.reduce((s, i) => s + (i.install_fee || 0) * i.quantity, 0);
  const estGrandTotal = estPartsTotal + estFeeTotal;

  const savedEstimates = api.getSavedEstimates(user.id);

  // Build Ori vs Aftermarket comparison pairs
  const oriItems = items.filter((p) => p.grade === 'original');
  const afterItems = items.filter((p) => p.grade === 'aftermarket');

  return `
    <div class="stack">
      <div class="row-between">
        <div>
          <h1 style="font-size:22px;">Katalog Sparepart &amp; Pelumas</h1>
          <p class="text-sm muted" style="margin:2px 0 0;">Transparansi harga barang + estimasi jasa pasang + masa garansi sebelum motor dibongkar.</p>
        </div>
        <button type="button" class="btn ${compareOpen ? 'btn-primary' : 'btn-outline'} btn-sm" data-action="toggle-compare">
          ${icon('compare', 16)} ${compareOpen ? 'Tutup Perbandingan' : 'Bandingkan Ori vs Aftermarket'}
        </button>
      </div>

      <!-- Edge Case 1: Offline Cached Data Banner + Reload Button -->
      ${fromCache ? `
        <div class="banner banner-warning">
          ${icon('wifiOff', 20)}
          <div style="flex:1;">
            <strong>Mode Offline — Menampilkan Data Katalog dari Cache Lokal</strong>
            <div class="text-xs" style="margin-top:2px;">Data terakhir disimpan pada ${formatDateTimeID(cachedAt)}. Kamu tetap bisa cek harga &amp; buat estimasi.</div>
          </div>
          <button type="button" class="btn btn-sm btn-outline" data-action="reload-catalog">${icon('refresh', 15)} Muat Ulang</button>
        </div>
      ` : ''}

      <!-- Filters Card -->
      <div class="card card-white stack-sm">
        <div class="form-row form-row-3">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Filter Tipe Motor</label>
            <select class="form-select" data-filter="catModel">
              <option value="all" ${filterModel === 'all' ? 'selected' : ''}>Semua Tipe Motor</option>
              ${[...new Set([...vehicles.map((v) => v.model), 'Vario 150', 'NMAX 155', 'Beat Street'])].map((m) => `
                <option value="${esc(m)}" ${filterModel === m ? 'selected' : ''}>${esc(m)}${activeVeh && activeVeh.model === m ? ' (Motor Aktif)' : ''}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Cari Komponen / Merek</label>
            <input type="search" class="form-input" placeholder="Cari oli, kampas rem, v-belt..." value="${esc(search)}" data-filter-input="catSearch" />
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Tingkat Kualitas</label>
            <select class="form-select" data-filter="catGrade">
              <option value="all" ${filterGrade === 'all' ? 'selected' : ''}>Semua Kualitas</option>
              <option value="original" ${filterGrade === 'original' ? 'selected' : ''}>Original / OEM Pabrikan</option>
              <option value="aftermarket" ${filterGrade === 'aftermarket' ? 'selected' : ''}>Aftermarket Berkualitas</option>
              <option value="jasa" ${filterGrade === 'jasa' ? 'selected' : ''}>Jasa Servis</option>
            </select>
          </div>
        </div>

        <div class="chip-row" style="margin-top:4px;">
          ${[
            { k: 'all', label: 'Semua Kategori', ic: 'package' },
            { k: 'ban', label: 'Ban Motor', ic: 'bike' },
            { k: 'oli', label: 'Oli Motor', ic: 'droplet' },
            { k: 'sparepart', label: 'Sparepart', ic: 'wrench' },
            { k: 'jasa', label: 'Servis', ic: 'sparkles' }
          ].map((c) => `
            <button type="button" class="chip ${filterCat === c.k ? 'active' : ''}" data-action="cat-category" data-val="${c.k}">
              ${icon(c.ic, 15)} ${c.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Ori vs Aftermarket Comparison Panel -->
      ${compareOpen ? `
        <div class="card card-white" style="border:2px solid var(--primary-border);">
          <div class="row-between" style="margin-bottom:12px;">
            <div>
              <h3 style="font-size:16px;">Perbandingan Transparan: Original (OEM) vs Aftermarket</h3>
              <div class="text-xs muted">Pilih sesuai kebutuhan jarak tempuh dan bujet perawatanmu.</div>
            </div>
            <span class="badge badge-blue">${oriItems.length} Ori · ${afterItems.length} Aftermarket</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="compare-table">
              <thead>
                <tr>
                  <th>Produk &amp; Merek</th>
                  <th>Kualitas</th>
                  <th>Spesifikasi Teknis</th>
                  <th>Garansi</th>
                  <th>Total + Pasang</th>
                </tr>
              </thead>
              <tbody>
                ${[...oriItems, ...afterItems].slice(0, 6).map((p) => `
                  <tr>
                    <td><strong>${esc(p.name)}</strong><div class="text-xs muted">${esc(p.brand)}</div></td>
                    <td><span class="badge ${p.grade === 'original' ? 'badge-blue' : 'badge-orange'}">${p.grade === 'original' ? 'Original OEM' : 'Aftermarket'}</span></td>
                    <td class="text-xs">${esc(p.specs)}</td>
                    <td class="text-xs num font-bold">${p.warranty_days} hr / ${formatNumber(p.warranty_km)} km</td>
                    <td class="num font-bold" style="color:var(--primary);white-space:nowrap;">${formatRupiah(p.price + (p.install_fee || 0))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Catalog Grid -->
      ${items.length === 0 ? `
        <div class="card card-white" style="text-align:center;padding:32px;">
          <h3>Produk Tidak Ditemukan</h3>
          <p class="text-sm muted">Coba ubah filter tipe motor atau kata kunci pencarian.</p>
          <button type="button" class="btn btn-outline btn-sm" data-action="reset-cat-filters">Reset Filter</button>
        </div>
      ` : `
        <div class="grid-3">
          ${items.map((p) => {
            const qty = estMap[p.id] || 0;
            const totalItem = p.price + (p.install_fee || 0);
            const lowStock = p.category !== 'jasa' && p.stock <= p.min_stock;
            const hasDiscount = p.original_price && p.original_price > p.price;
            return `
              <div class="product-card ${qty > 0 ? 'in-estimate' : ''}">
                <div class="stack-sm" style="gap:8px;">
                  ${p.image ? `
                    <div class="catalog-thumb-wrap" data-action="open-product-detail" data-id="${p.id}" style="cursor:pointer;">
                      ${hasDiscount ? '<span class="pb-ribbon" style="border-radius:11px 0 12px 0;">Diskon Harga</span>' : ''}
                      <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />
                    </div>
                  ` : ''}

                  <div class="row-between">
                    <span class="badge ${p.grade === 'original' ? 'badge-blue' : p.grade === 'aftermarket' ? 'badge-orange' : 'badge-slate'}">
                      ${p.grade === 'original' ? 'Original OEM' : p.grade === 'aftermarket' ? 'Aftermarket' : 'Jasa Bengkel'}
                    </span>
                    ${p.rating ? `
                      <span class="pb-rating"><span class="star-ico">${icon('star', 13)}</span> <span class="num">${Number(p.rating).toFixed(1)}</span> <span class="rating-cnt num">(${p.rating_count || 10})</span></span>
                    ` : ''}
                  </div>

                  <div>
                    <div class="row-between">
                      <span class="text-xs muted font-bold">${esc(p.brand)}</span>
                      ${p.category !== 'jasa' ? `
                        <span class="text-xs font-bold" style="color:${lowStock ? 'var(--warning-dark)' : 'var(--success-dark)'};">
                          ${lowStock ? `Stok Terbatas (${p.stock})` : `Tersedia (${p.stock})`}
                        </span>
                      ` : '<span class="text-xs font-bold" style="color:var(--success-dark);">Siap Dikerjakan</span>'}
                    </div>
                    <h3 style="font-size:15.5px;margin-top:2px;">${esc(p.name)}</h3>
                  </div>

                  <p class="text-xs muted" style="margin:0;line-height:1.45;">${esc(p.specs)}</p>

                  <div class="row" style="flex-wrap:wrap;gap:6px;">
                    <span class="badge badge-green" style="font-size:11px;">
                      ${icon('shieldCheck', 12)} Garansi ${p.warranty_days} hari / ${formatNumber(p.warranty_km)} km
                    </span>
                  </div>
                </div>

                <div>
                  <div class="divider" style="margin:10px 0;"></div>
                  <div class="row-between" style="margin-bottom:10px;">
                    <div>
                      <div class="text-xs muted">Harga ${p.category === 'jasa' ? 'Jasa' : 'Produk'}</div>
                      <div class="row" style="gap:6px;align-items:baseline;">
                        <span class="num font-bold" style="font-size:16px;color:var(--slate);">${formatRupiah(p.price)}</span>
                        ${hasDiscount ? `<span class="pb-price-strike">${formatRupiah(p.original_price)}</span>` : ''}
                      </div>
                    </div>
                    <div style="text-align:right;">
                      <div class="text-xs muted">Est. Jasa Pasang</div>
                      <div class="num font-bold text-sm" style="color:${p.install_fee ? 'var(--steel)' : 'var(--success-dark)'};">
                        ${p.install_fee ? `+ ${formatRupiah(p.install_fee)}` : 'Termasuk'}
                      </div>
                    </div>
                  </div>

                  ${qty > 0 ? `
                    <div class="row-between" style="background:var(--primary-soft);padding:6px 10px;border-radius:10px;">
                      <span class="text-xs font-bold" style="color:var(--primary);">Est: <span class="num">${formatRupiah(totalItem * qty)}</span></span>
                      <div class="qty-control">
                        <button type="button" class="qty-btn" data-action="est-qty" data-id="${p.id}" data-delta="-1">${icon('minus', 14)}</button>
                        <span class="num font-bold" style="min-width:20px;text-align:center;">${qty}</span>
                        <button type="button" class="qty-btn" data-action="est-qty" data-id="${p.id}" data-delta="1">${icon('plus', 14)}</button>
                      </div>
                    </div>
                  ` : `
                    <button type="button" class="btn btn-outline btn-block btn-sm" style="min-height:44px;" data-action="est-qty" data-id="${p.id}" data-delta="1">
                      ${icon('plus', 16)} Tambah ke Estimasi (<span class="num">${formatRupiah(totalItem)}</span>)
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Saved Estimates List -->
      ${savedEstimates.length ? `
        <div class="card card-white">
          <h3 style="font-size:16px;margin-bottom:10px;">${icon('bookmark', 18)} Estimasi Tersimpan (Referensi ke Bengkel)</h3>
          <div class="stack-sm">
            ${savedEstimates.map((est) => `
              <div class="row-between" style="padding:12px;border-radius:12px;background:var(--bg);border:1px solid var(--border);">
                <div>
                  <div class="font-bold text-sm">${est.items.map((i) => `${esc(i.name)} (${i.quantity}x)`).join(' + ')}</div>
                  <div class="text-xs muted">Disimpan ${formatDateTimeID(est.created_at)} · Tunjukkan ke kasir Bengkel Maju Jaya Motor</div>
                </div>
                <div class="row">
                  <span class="num font-bold" style="color:var(--primary);">${formatRupiah(est.total_amount)}</span>
                  <button type="button" class="btn btn-ghost btn-sm" data-action="delete-estimate" data-id="${est.id}" title="Hapus Estimasi">${icon('trash', 15)}</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Sticky Cost Estimator Bar -->
      ${estItems.length > 0 ? `
        <div class="estimate-bar">
          <div>
            <div class="text-xs" style="color:#94A3B8;">Estimasi Total (${estItems.reduce((s, i) => s + i.quantity, 0)} item · Barang ${formatRupiah(estPartsTotal)} + Jasa ${formatRupiah(estFeeTotal)})</div>
            <div class="num" style="font-size:21px;font-weight:800;color:#fff;">${formatRupiah(estGrandTotal)}</div>
          </div>
          <div class="row" style="gap:8px;">
            <button type="button" class="btn btn-ghost btn-sm" style="color:#CBD5E1;" data-action="clear-estimate">Reset</button>
            <button type="button" class="btn btn-accent" data-action="save-estimate">
              ${icon('bookmark', 17)} Simpan Estimasi
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// SCREEN 5: /history (Digital Receipts & Anti-Lost Digital Warranty Cards)
// ============================================================================
export function renderHistoryView(state, ctx) {
  const tab = state.historyTab || 'warranties'; // warranties | receipts
  const warranties = api.getWarranties();
  const transactions = api.getTransactionHistory();

  return `
    <div class="stack">
      <div>
        <h1 style="font-size:22px;">Riwayat Servis &amp; Garansi Digital</h1>
        <p class="text-sm muted" style="margin:2px 0 0;">Pengganti nota kertas yang gampang hilang — pantau sisa hari &amp; kilometer garansi secara transparan.</p>
      </div>

      <div class="tabs">
        <button type="button" class="tab-btn ${tab === 'warranties' ? 'active' : ''}" data-action="history-tab" data-tab="warranties">
          ${icon('shieldCheck', 16)} Kartu Garansi (${warranties.filter((w) => w.effectiveStatus === 'active').length} Aktif)
        </button>
        <button type="button" class="tab-btn ${tab === 'receipts' ? 'active' : ''}" data-action="history-tab" data-tab="receipts">
          ${icon('receipt', 16)} Nota Digital (${transactions.length})
        </button>
      </div>

      ${tab === 'warranties' ? `
        <div class="grid-2">
          ${warranties.map((w) => {
            const totalDays = Math.max(1, Math.ceil((new Date(w.end_date) - new Date(w.start_date)) / 86400000));
            const totalKm = Math.max(1, Number(w.end_odometer) - Number(w.start_odometer));
            const dayPct = Math.min(100, Math.max(0, (w.daysLeft / totalDays) * 100));
            const kmPct = Math.min(100, Math.max(0, (w.kmLeft / totalKm) * 100));
            const isExpired = w.effectiveStatus === 'expired';
            const isClaimed = w.effectiveStatus === 'claimed';

            return `
              <div class="warranty-card ${isExpired ? 'is-expired' : isClaimed ? 'is-claimed' : ''}">
                <div class="warranty-header">
                  <div class="row" style="gap:8px;">
                    <img src="./assets/logo.png" alt="" style="width:26px;height:26px;border-radius:6px;" />
                    <div>
                      <div class="text-xs font-bold" style="color:var(--primary);">${esc(w.workshop?.workshop_name || 'Bengkel Mitra')}</div>
                      <div class="num text-xs muted">${esc(w.claim_code)}</div>
                    </div>
                  </div>
                  <span class="badge ${isClaimed ? 'badge-green' : isExpired ? 'badge-red' : 'badge-blue'}">
                    ${isClaimed ? 'Sudah Diklaim' : isExpired ? 'Kedaluwarsa' : 'Garansi Aktif'}
                  </span>
                </div>

                <div class="warranty-body">
                  <div>
                    <h3 style="font-size:16px;">${esc(w.item_name)}</h3>
                    <div class="text-xs muted" style="margin-top:2px;">
                      Motor: <strong>${w.vehicle ? `${esc(w.vehicle.brand)} ${esc(w.vehicle.model)} (${esc(w.vehicle.license_plate)})` : '-'}</strong>
                    </div>
                  </div>

                  <div class="stack-sm" style="gap:8px;">
                    <div>
                      <div class="row-between text-xs" style="margin-bottom:4px;">
                        <span class="muted">Batas Waktu (${formatDateID(w.end_date)})</span>
                        <strong class="num">${isExpired ? '0 hari tersisa' : `Sisa ${w.daysLeft} hari`}</strong>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill ${isExpired ? 'danger' : dayPct < 30 ? 'warn' : ''}" style="width:${isClaimed ? 100 : dayPct}%;"></div>
                      </div>
                    </div>

                    <div>
                      <div class="row-between text-xs" style="margin-bottom:4px;">
                        <span class="muted">Batas Jarak (${formatNumber(w.start_odometer)} → ${formatNumber(w.end_odometer)} km)</span>
                        <strong class="num">${isExpired ? '0 km tersisa' : `Sisa ${formatNumber(w.kmLeft)} km`}</strong>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill ${isExpired ? 'danger' : kmPct < 30 ? 'warn' : 'success'}" style="width:${isClaimed ? 100 : kmPct}%;"></div>
                      </div>
                    </div>
                  </div>

                  <div style="padding:10px 12px;border-radius:10px;background:var(--bg);font-size:12px;color:var(--steel);line-height:1.45;">
                    <strong>Syarat Garansi:</strong> ${esc(w.terms)}
                  </div>

                  ${isExpired ? `
                    <!-- Edge Case 3: Locked button + transparent expiration reason -->
                    <div class="banner banner-danger" style="padding:10px 12px;font-size:12.5px;">
                      ${icon('lock', 16)}
                      <div><strong>Klaim Terkunci:</strong> ${esc(w.expiredReason)}</div>
                    </div>
                    <button type="button" class="btn btn-outline btn-block" disabled>
                      ${icon('lock', 16)} Garansi Kedaluwarsa
                    </button>
                  ` : isClaimed ? `
                    <div class="banner banner-success" style="padding:10px 12px;font-size:12.5px;">
                      ${icon('checkCircle', 16)}
                      <div>Berhasil diklaim pada ${formatDateTimeID(w.claimed_at)} (single-use terverifikasi).</div>
                    </div>
                  ` : `
                    <button type="button" class="btn btn-primary btn-block" data-action="show-qr" data-type="warranty" data-code="${esc(w.claim_code)}" data-title="${esc(w.item_name)}" data-sub="Tunjukkan ke kasir ${esc(w.workshop?.workshop_name || 'Bengkel')} untuk validasi garansi (berlaku s/d ${formatDateID(w.end_date)} atau ${formatNumber(w.end_odometer)} km).">
                      ${icon('qrCode', 18)} Gunakan / Klaim di Bengkel
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="stack-sm">
          ${transactions.map((t) => `
            <div class="card card-white">
              <div class="row-between" style="margin-bottom:8px;">
                <div>
                  <div class="num font-bold" style="color:var(--primary);font-size:13.5px;">${esc(t.transaction_number)}</div>
                  <div class="text-xs muted">${formatDateTimeID(t.created_at)} · ${esc(t.workshop?.workshop_name || 'Bengkel Mitra')}</div>
                </div>
                <span class="badge badge-green">${icon('checkCircle', 13)} Lunas (${esc(t.payment_method)})</span>
              </div>

              <div class="text-sm" style="margin-bottom:10px;">
                ${t.vehicle ? `<span class="plate-badge" style="margin-right:6px;">${esc(t.vehicle.license_plate)}</span> <strong>${esc(t.vehicle.brand)} ${esc(t.vehicle.model)}</strong> · Odometer <span class="num">${formatNumber(t.odometer_at_service)} km</span>` : ''}
              </div>

              <div style="background:var(--bg);padding:10px 12px;border-radius:10px;margin-bottom:12px;">
                ${t.items.map((it) => `
                  <div class="row-between text-sm" style="padding:3px 0;">
                    <span>${esc(it.name_snapshot)} <span class="muted">×${it.quantity}</span></span>
                    <span class="num font-bold">${formatRupiah(it.subtotal)}</span>
                  </div>
                `).join('')}
                ${t.discount_amount > 0 ? `
                  <div class="row-between text-sm" style="padding:3px 0;color:var(--success-dark);">
                    <span>Potongan Voucher Loyalitas (${esc(t.reward_code_used)})</span>
                    <span class="num font-bold">- ${formatRupiah(t.discount_amount)}</span>
                  </div>
                ` : ''}
              </div>

              <div class="row-between">
                <div>
                  <div class="text-xs muted">Total Dibayar</div>
                  <div class="num font-bold" style="font-size:18px;color:var(--slate);">${formatRupiah(t.total_amount)}</div>
                </div>
                <button type="button" class="btn btn-outline btn-sm" data-action="view-receipt" data-id="${t.id}">
                  ${icon('fileText', 16)} Lihat Nota Lengkap
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// ============================================================================
// SCREEN 6: /loyalty (Stamp Card, Rewards Catalog & Single-Use Claim QR)
// ============================================================================
export function renderLoyaltyView(state, ctx) {
  const user = getActiveUser();
  const loyalty = api.getLoyaltySummary(user.id);
  const { workshop, target, currentProgress, canGenerateVoucher, rewards } = loyalty;

  const slots = [];
  for (let i = 1; i <= target; i++) {
    const filled = i <= currentProgress;
    slots.push(`
      <div class="stamp-slot ${filled ? 'filled' : ''}">
        ${filled ? icon('checkCircle', 24) : icon('droplet', 20)}
        <span>#${i}</span>
      </div>
    `);
  }

  return `
    <div class="stack">
      <div>
        <h1 style="font-size:22px;">Loyalitas &amp; Klaim Hadiah</h1>
        <p class="text-sm muted" style="margin:2px 0 0;">Stempel bertambah otomatis setiap kali transaksi valid dicatat di kasir bengkel mitra.</p>
      </div>

      <!-- Digital Stamp Card -->
      <div class="stamp-board">
        <div class="row-between">
          <div>
            <div class="text-xs" style="color:#93C5FD;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Kartu Stempel Digital</div>
            <h2 style="color:#fff;font-size:20px;margin-top:2px;">${esc(workshop.workshop_name)}</h2>
          </div>
          <span class="badge" style="background:rgba(255,255,255,0.16);color:#fff;font-size:14px;padding:6px 14px;">
            <span class="num">${currentProgress} / ${target}</span> Stempel
          </span>
        </div>

        <div class="stamp-slots">${slots.join('')}</div>

        <div class="row-between" style="padding-top:14px;border-top:1px solid rgba(255,255,255,0.16);">
          <div>
            <div class="text-xs" style="color:#CBD5E1;">Hadiah saat ${target} stempel penuh:</div>
            <div class="font-bold" style="font-size:15px;color:#fff;">${esc(workshop.loyalty_reward_title)}</div>
          </div>
          ${canGenerateVoucher ? `
            <button type="button" class="btn btn-accent" data-action="redeem-stamps">
              ${icon('gift', 18)} Tukar Jadi Voucher QR
            </button>
          ` : `
            <span class="badge" style="background:rgba(255,104,0,0.22);color:#FFD4B8;">
              Kurang ${target - currentProgress}x ganti oli lagi
            </span>
          `}
        </div>
      </div>

      <!-- Active & Redeemed Reward Vouchers -->
      <div class="card card-white">
        <div class="row-between" style="margin-bottom:12px;">
          <h3 style="font-size:17px;">${icon('gift', 19)} Voucher Hadiah Milikmu</h3>
          <span class="text-xs muted">Single-use · Validasi QR di Kasir</span>
        </div>

        ${rewards.length === 0 ? `
          <p class="text-sm muted">Belum ada voucher hadiah. Kumpulkan ${target} stempel untuk mendapatkan voucher pertamamu.</p>
        ` : `
          <div class="grid-2">
            ${rewards.map((r) => {
              const isRedeemed = r.status === 'redeemed';
              return `
                <div class="card" style="background:${isRedeemed ? '#F8FAFC' : 'var(--accent-soft)'};border-color:${isRedeemed ? 'var(--border)' : 'var(--accent-border)'};">
                  <div class="row-between" style="margin-bottom:8px;">
                    <span class="badge ${isRedeemed ? 'badge-slate' : 'badge-orange'}">
                      ${isRedeemed ? 'Sudah Diklaim' : 'Siap Digunakan'}
                    </span>
                    <span class="num font-bold text-xs" style="color:var(--slate);">${esc(r.reward_code)}</span>
                  </div>
                  <h4 style="font-size:15.5px;margin-bottom:4px;">${esc(r.reward_title)}</h4>
                  <div class="text-xs muted" style="margin-bottom:12px;">
                    Nilai potongan: <strong class="num">${formatRupiah(r.discount_value)}</strong> · Diterbitkan ${formatDateID(r.claimed_at)}
                  </div>
                  ${isRedeemed ? `
                    <div class="text-xs" style="color:var(--success-dark);font-weight:700;">
                      ${icon('checkCircle', 14)} Telah ditukarkan pada ${formatDateTimeID(r.redeemed_at)}
                    </div>
                  ` : `
                    <button type="button" class="btn btn-accent btn-block" data-action="show-qr" data-type="reward" data-code="${esc(r.reward_code)}" data-title="${esc(r.reward_title)}" data-sub="Tunjukkan kode QR ini ke kasir ${esc(workshop.workshop_name)} untuk memotong tagihan sebesar ${formatRupiah(r.discount_value)}.">
                      ${icon('qrCode', 18)} Generate QR Klaim di Bengkel
                    </button>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Reward Catalog Info -->
      <div class="card card-white">
        <h3 style="font-size:16px;margin-bottom:10px;">Katalog Reward &amp; Benefit Bengkel Mitra</h3>
        <div class="grid-3">
          <div class="card" style="padding:14px;">
            <span class="badge badge-blue" style="margin-bottom:8px;">${target} Stempel</span>
            <h4 style="font-size:14.5px;">${esc(workshop.loyalty_reward_title)}</h4>
            <p class="text-xs muted" style="margin:6px 0 0;">${esc(workshop.loyalty_reward_desc)}</p>
          </div>
          <div class="card" style="padding:14px;">
            <span class="badge badge-green" style="margin-bottom:8px;">Setiap Transaksi</span>
            <h4 style="font-size:14.5px;">Kartu Garansi Digital Otomatis</h4>
            <p class="text-xs muted" style="margin:6px 0 0;">Berlaku terukur berdasarkan hari &amp; kilometer tanpa takut nota kertas hilang.</p>
          </div>
          <div class="card" style="padding:14px;">
            <span class="badge badge-orange" style="margin-bottom:8px;">Bonus Pelanggan Setia</span>
            <h4 style="font-size:14.5px;">Cek Angin Ban &amp; Rem Gratis</h4>
            <p class="text-xs muted" style="margin:6px 0 0;">Cukup tunjukkan aplikasi Diservisin saat mampir ke ${esc(workshop.workshop_name)}.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MODALS (QR Claim Modal, Digital Receipt Modal, Add/Edit Vehicle Modal)
// ============================================================================
export function renderQRModal({ type, code, title, sub }) {
  const payload = `DISERVISIN|${code}`;
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal-card">
        <div class="row-between" style="margin-bottom:14px;">
          <div class="row">
            <img src="./assets/logo.png" alt="" style="width:28px;height:28px;border-radius:7px;" />
            <h3 style="font-size:17px;">${type === 'warranty' ? 'QR Klaim Garansi Digital' : 'QR Klaim Reward Loyalitas'}</h3>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 18)}</button>
        </div>

        <div class="qr-box">
          <div style="background:#fff;padding:12px;border-radius:16px;box-shadow:var(--shadow-sm);">
            ${renderQRSvg(payload, 196)}
          </div>
          <div class="code-pill">
            <span>${esc(code)}</span>
            <button type="button" class="btn btn-ghost btn-sm" style="color:#93C5FD;min-height:28px;padding:2px 6px;" data-action="copy-code" data-code="${esc(code)}" title="Salin Kode">${icon('copy', 15)}</button>
          </div>
          <div>
            <div class="font-bold" style="font-size:15px;">${esc(title)}</div>
            <p class="text-xs muted" style="margin:4px 0 0;">${esc(sub)}</p>
          </div>
        </div>

        <div class="banner banner-info" style="margin-top:14px;font-size:12.5px;">
          ${icon('sparkles', 16)}
          <div><strong>Tips Demo:</strong> Salin kode <strong>${esc(code)}</strong>, lalu klik tombol <em>Ganti Peran → Kasir Bengkel</em> di pojok atas dan tempel di panel <strong>Verifikasi Kode QR Klaim</strong> pada layar POS!</div>
        </div>

        <button type="button" class="btn btn-primary btn-block" style="margin-top:14px;" data-close-modal>Tutup</button>
      </div>
    </div>
  `;
}

export function renderReceiptModal(trx) {
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal-card">
        <div class="row-between" style="margin-bottom:12px;">
          <h3 style="font-size:17px;">Nota Digital Resmi</h3>
          <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 18)}</button>
        </div>

        <div class="receipt-paper">
          <div class="row-between" style="margin-bottom:12px;">
            <div class="row">
              <img src="./assets/logo.png" alt="Diservisin" style="width:36px;height:36px;border-radius:9px;" />
              <div>
                <div class="font-bold" style="font-size:15px;">${esc(trx.workshop?.workshop_name || 'Bengkel Mitra')}</div>
                <div class="text-xs muted">${esc(trx.workshop?.address || '')}</div>
              </div>
            </div>
            <span class="badge badge-green">LUNAS</span>
          </div>

          <div class="divider"></div>
          <div class="stack-sm text-xs" style="gap:4px;">
            <div class="row-between"><span class="muted">No. Nota</span><strong class="num">${esc(trx.transaction_number)}</strong></div>
            <div class="row-between"><span class="muted">Tanggal</span><strong>${formatDateTimeID(trx.created_at)}</strong></div>
            <div class="row-between"><span class="muted">Pelanggan</span><strong>${esc(trx.customer?.name || 'Pelanggan Umum')}</strong></div>
            <div class="row-between"><span class="muted">Kendaraan</span><strong>${trx.vehicle ? `${esc(trx.vehicle.brand)} ${esc(trx.vehicle.model)} (${esc(trx.vehicle.license_plate)})` : '-'}</strong></div>
            <div class="row-between"><span class="muted">Odometer</span><strong class="num">${formatNumber(trx.odometer_at_service)} km</strong></div>
            <div class="row-between"><span class="muted">Metode Bayar</span><strong>${esc(trx.payment_method)}</strong></div>
          </div>

          <div class="divider"></div>
          <div class="stack-sm" style="gap:6px;">
            ${trx.items.map((it) => `
              <div class="row-between text-sm">
                <div>
                  <div class="font-bold">${esc(it.name_snapshot)}</div>
                  <div class="text-xs muted num">${it.quantity} × ${formatRupiah(it.price_at_transaction)}</div>
                </div>
                <div class="num font-bold">${formatRupiah(it.subtotal)}</div>
              </div>
            `).join('')}
          </div>

          <div class="divider"></div>
          ${trx.discount_amount > 0 ? `
            <div class="row-between text-sm" style="color:var(--success-dark);margin-bottom:4px;">
              <span>Diskon Voucher (${esc(trx.reward_code_used)})</span>
              <strong class="num">- ${formatRupiah(trx.discount_amount)}</strong>
            </div>
          ` : ''}
          <div class="row-between" style="font-size:17px;">
            <strong>Total Pembayaran</strong>
            <strong class="num" style="color:var(--primary);">${formatRupiah(trx.total_amount)}</strong>
          </div>

          ${trx.notes ? `<div class="text-xs muted" style="margin-top:10px;padding:8px 10px;background:var(--bg);border-radius:8px;"><strong>Catatan Mekanik:</strong> ${esc(trx.notes)}</div>` : ''}

          ${trx.warranties && trx.warranties.length ? `
            <div style="margin-top:12px;padding:10px;border-radius:10px;background:var(--primary-soft);font-size:12px;color:var(--primary);">
              ${icon('shieldCheck', 15)} <strong>${trx.warranties.length} Kartu Garansi Digital</strong> aktif terhubung ke nota ini.
            </div>
          ` : ''}
        </div>

        <div class="row" style="margin-top:14px;gap:8px;">
          <button type="button" class="btn btn-outline" style="flex:1;" onclick="window.print()">Cetak / Simpan PDF</button>
          <button type="button" class="btn btn-primary" style="flex:1;" data-close-modal>Selesai</button>
        </div>
      </div>
    </div>
  `;
}

export function renderVehicleModal(existing = null) {
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal-card">
        <div class="row-between" style="margin-bottom:14px;">
          <h3 style="font-size:18px;">${existing ? 'Edit Data Motor' : 'Tambah Motor ke Garasi'}</h3>
          <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 18)}</button>
        </div>
        <form id="vehicle-form" data-id="${existing ? existing.id : ''}">
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Merek</label>
              <select name="brand" class="form-select" required>
                ${['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa'].map((b) => `<option value="${b}" ${existing?.brand === b ? 'selected' : ''}>${b}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tipe / Model</label>
              <input name="model" class="form-input" placeholder="Contoh: Vario 160, PCX, Beat" value="${esc(existing?.model || '')}" required />
            </div>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Tahun</label>
              <input name="year" type="number" class="form-input num" min="2000" max="2027" value="${existing?.year || 2023}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nomor Pelat</label>
              <input name="license_plate" class="form-input" placeholder="B 1234 XYZ" value="${esc(existing?.license_plate || '')}" style="text-transform:uppercase;" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Odometer Terakhir (km)</label>
            <input name="last_odometer" type="number" class="form-input num" min="0" placeholder="15000" value="${existing?.last_odometer ?? 10000}" required />
          </div>
          <div class="row" style="gap:8px;margin-top:8px;">
            <button type="button" class="btn btn-outline" style="flex:1;" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary" style="flex:1;">${existing ? 'Simpan Perubahan' : 'Tambahkan Motor'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}


export function renderProductDetailModal(p, currentQty = 0) {
  const hasDiscount = p.original_price && p.original_price > p.price;
  const totalUnit = p.price + (p.install_fee || 0);
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal-card">
        <div class="row-between" style="margin-bottom:10px;">
          <span class="badge ${p.grade === 'original' ? 'badge-blue' : p.grade === 'aftermarket' ? 'badge-orange' : 'badge-slate'}">
            ${p.grade === 'original' ? 'Original OEM' : p.grade === 'aftermarket' ? 'Aftermarket Berkualitas' : 'Jasa Bengkel'}
          </span>
          <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 18)}</button>
        </div>

        <div style="position:relative;background:#fff;border:1px solid var(--border);border-radius:16px;padding:18px;display:flex;align-items:center;justify-content:center;height:210px;margin-bottom:14px;">
          ${hasDiscount ? '<span class="pb-ribbon">Diskon Harga</span>' : ''}
          <img src="${esc(p.image || './assets/logo.png')}" alt="${esc(p.name)}" style="max-width:100%;max-height:100%;object-fit:contain;" />
        </div>

        <div class="text-xs muted font-bold">${esc(p.brand)}</div>
        <h3 style="font-size:19px;margin:2px 0 6px;">${esc(p.name)}</h3>

        ${p.rating ? `
          <div class="row" style="gap:10px;margin-bottom:10px;">
            <span class="pb-rating"><span class="star-ico">${icon('star', 14)}</span> <span class="num">${Number(p.rating).toFixed(1)}</span> <span class="rating-cnt num">(${p.rating_count || 15} ulasan)</span></span>
            <span class="text-xs muted">· ${formatNumber(p.sold_count || 50)}+ terjual</span>
          </div>
        ` : ''}

        <p class="text-sm muted" style="margin:0 0 12px;">${esc(p.specs)}</p>

        <div class="banner banner-success" style="padding:10px 12px;font-size:12.5px;margin-bottom:12px;">
          ${icon('shieldCheck', 18)}
          <div><strong>Garansi Digital ${p.warranty_days} Hari / ${formatNumber(p.warranty_km)} KM</strong> — aktif otomatis di HP begitu transaksi dicatat di kasir bengkel.</div>
        </div>

        <div style="background:var(--bg);border-radius:12px;padding:12px 14px;margin-bottom:14px;">
          <div class="row-between text-sm">
            <span class="muted">Harga Produk</span>
            <span class="num font-bold">${formatRupiah(p.price)} ${hasDiscount ? `<span class="pb-price-strike" style="margin-left:4px;">${formatRupiah(p.original_price)}</span>` : ''}</span>
          </div>
          <div class="row-between text-sm" style="margin-top:4px;">
            <span class="muted">Estimasi Jasa Pasang</span>
            <span class="num font-bold">${p.install_fee ? formatRupiah(p.install_fee) : 'Gratis / Termasuk'}</span>
          </div>
          <div class="divider" style="margin:8px 0;"></div>
          <div class="row-between">
            <strong>Estimasi Total</strong>
            <strong class="num" style="font-size:18px;color:var(--primary);">${formatRupiah(totalUnit)}</strong>
          </div>
        </div>

        <div class="row" style="gap:8px;">
          <button type="button" class="btn btn-outline" style="flex:1;" data-close-modal>Tutup</button>
          <button type="button" class="btn btn-primary" style="flex:2;" data-action="est-qty-modal" data-id="${p.id}">
            ${icon('cart', 17)} ${currentQty > 0 ? `Tambah Lagi (${currentQty} di Estimasi)` : 'Tambah ke Estimasi'}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderQuickBikeModal() {
  const user = getActiveUser();
  const vehicles = api.getVehicles(user.id);
  const activeVeh = getActiveVehicle(vehicles);
  const reminder = activeVeh ? evaluateOilReminder(activeVeh) : null;
  const warranties = api.getWarranties().filter((w) => w.effectiveStatus === 'active');

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal-card">
        <div class="row-between" style="margin-bottom:12px;">
          <div class="row">
            <img src="./assets/logo.png" alt="" style="width:28px;height:28px;border-radius:7px;" />
            <h3 style="font-size:17px;">Status Motor &amp; Pengingat Servis</h3>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 18)}</button>
        </div>

        ${activeVeh ? `
          <div class="card card-hero" style="padding:16px;margin-bottom:12px;">
            <div class="row-between">
              <div>
                <div class="row" style="gap:8px;">
                  <strong style="font-size:17px;">${esc(activeVeh.brand)} ${esc(activeVeh.model)}</strong>
                  <span class="plate-badge">${esc(activeVeh.license_plate)}</span>
                </div>
                <div class="text-xs" style="color:#CBD5E1;margin-top:4px;">Tahun ${activeVeh.year} · ${warranties.length} Garansi Aktif</div>
              </div>
              <div style="text-align:right;">
                <div class="text-xs" style="color:#CBD5E1;">Odometer</div>
                <div class="num font-bold" style="font-size:18px;">${formatNumber(activeVeh.last_odometer)} km</div>
              </div>
            </div>
          </div>

          ${reminder ? `
            <div class="banner ${reminder.urgency === 'overdue' ? 'banner-danger' : reminder.urgency === 'soon' ? 'banner-warning' : 'banner-info'}" style="margin-bottom:14px;">
              ${icon('bell', 18)}
              <div>
                <strong>${reminder.urgency === 'overdue' ? 'Waktunya Ganti Oli!' : reminder.urgency === 'soon' ? 'Jadwal Ganti Oli Sudah Dekat' : 'Jadwal Ganti Oli Masih Aman'}</strong>
                <div class="text-xs" style="margin-top:2px;">Target: <strong>${formatNumber(reminder.nextOilOdo)} km</strong> atau <strong>${formatDateID(reminder.nextDate)}</strong>.</div>
              </div>
            </div>
          ` : ''}
        ` : ''}

        <div class="grid-2" style="gap:8px;">
          <button type="button" class="btn btn-primary btn-sm" data-close-modal data-nav="/garage">${icon('gauge', 15)} Update Odometer</button>
          <button type="button" class="btn btn-accent btn-sm" data-close-modal data-nav="/history">${icon('shieldCheck', 15)} Kartu Garansi (${warranties.length})</button>
        </div>
      </div>
    </div>
  `;
}
