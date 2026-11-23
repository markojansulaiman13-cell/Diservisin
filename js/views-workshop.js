import { icon } from './icons.js';
import {
  api,
  loadDB,
  getActiveUser,
  getActiveWorkshop,
  getOfflineQueue,
  isOffline,
  evaluateOilReminder,
  formatRupiah,
  formatNumber,
  formatDateID,
  formatDateTimeID
} from './api.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSameLocalDay(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ============================================================================
// SCREEN 7: /pos (Workshop Cashier POS Workspace)
// ============================================================================
export function renderPosView(state, ctx) {
  const user = getActiveUser();
  const workshop = getActiveWorkshop(user);
  const db = loadDB();
  const transactions = api.getTransactionHistory();
  const warranties = api.getWarranties();
  const { items: catalogItems } = api.getCatalog({ workshopId: workshop.id });
  const offlineQueue = getOfflineQueue();

  const todayTrx = transactions.filter((t) => isSameLocalDay(t.created_at));
  const todayRevenue = todayTrx.reduce((s, t) => s + Number(t.total_amount || 0), 0);
  const activeWarrantiesCount = warranties.filter((w) => w.effectiveStatus === 'active').length;
  const lowStockItems = catalogItems.filter((p) => p.category !== 'jasa' && p.stock <= p.min_stock);

  // Customer & Vehicle lookup
  const plateQuery = (state.posCustomerQuery || '').trim().toLowerCase();
  const customers = db.users.filter((u) => u.role === 'customer');
  const allVehicles = db.user_vehicles.map((v) => ({
    ...v,
    owner: customers.find((c) => c.id === v.user_id) || null
  })).filter((v) => v.owner);

  const matchedVehicles = plateQuery
    ? allVehicles.filter(
        (v) =>
          v.license_plate.toLowerCase().includes(plateQuery) ||
          v.owner.phone_number.includes(plateQuery.replace(/\D/g, '') || '__') ||
          v.owner.name.toLowerCase().includes(plateQuery) ||
          v.model.toLowerCase().includes(plateQuery)
      )
    : allVehicles;

  const selectedVehicle = allVehicles.find((v) => v.id === state.posVehicleId) || null;
  const selectedCustomer = selectedVehicle ? selectedVehicle.owner : null;

  // Check if selected customer has a saved estimate from /catalog!
  const customerEstimates = selectedCustomer
    ? db.saved_estimates.filter((e) => e.user_id === selectedCustomer.id && e.workshop_id === workshop.id && e.status === 'saved')
    : [];

  // Filter catalog items for POS picker
  const posCatFilter = state.posCatFilter || 'all';
  const posItemSearch = (state.posItemSearch || '').trim().toLowerCase();
  const visibleCatalog = catalogItems.filter((p) => {
    if (posCatFilter !== 'all' && p.category !== posCatFilter) return false;
    if (posItemSearch && !p.name.toLowerCase().includes(posItemSearch) && !p.brand.toLowerCase().includes(posItemSearch)) return false;
    return true;
  });

  // Cart totals
  const cart = state.posCart || [];
  const subtotal = cart.reduce((s, c) => s + Number(c.unit_price) * Number(c.quantity), 0);
  const appliedReward = state.posAppliedReward || null;
  const discount = appliedReward ? Math.min(subtotal, Number(appliedReward.discount_value || workshop.loyalty_reward_value || 65000)) : 0;
  const grandTotal = Math.max(0, subtotal - discount);

  // Customers needing routine oil-change reminder (WhatsApp Click-to-Chat)
  const reminderList = allVehicles
    .map((v) => ({ ...v, reminder: evaluateOilReminder(v) }))
    .sort((a, b) => a.reminder.kmRemaining - b.reminder.kmRemaining);

  const verifyResult = state.posVerifyResult || null;

  return `
    <div class="stack">
      <!-- Header & Daily KPI Strip -->
      <div class="row-between">
        <div>
          <h1 style="font-size:22px;">Kasir POS — ${esc(workshop.workshop_name)}</h1>
          <p class="text-sm muted" style="margin:2px 0 0;">Catat transaksi, terbitkan nota &amp; garansi digital otomatis, dan verifikasi klaim QR pelanggan.</p>
        </div>
        <button type="button" class="btn btn-outline btn-sm" data-nav="/workshop/settings">
          ${icon('settings', 16)} Pengaturan &amp; Stok
        </button>
      </div>

      <div class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-label">Omzet Hari Ini</div>
          <div class="kpi-value" style="color:var(--primary);">${formatRupiah(todayRevenue)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Transaksi Hari Ini</div>
          <div class="kpi-value">${todayTrx.length} <span class="text-xs muted" style="font-weight:600;">nota</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Garansi Digital Aktif</div>
          <div class="kpi-value" style="color:var(--success-dark);">${activeWarrantiesCount}</div>
        </div>
        <div class="kpi-card" style="cursor:pointer;border-color:${lowStockItems.length ? 'var(--warning)' : 'var(--border)'};background:${lowStockItems.length ? 'var(--warning-soft)' : 'var(--white)'};" data-nav="/workshop/settings">
          <div class="kpi-label" style="color:${lowStockItems.length ? 'var(--warning-dark)' : 'var(--steel)'};">Stok Menipis</div>
          <div class="kpi-value" style="color:${lowStockItems.length ? 'var(--warning-dark)' : 'var(--slate)'};">${lowStockItems.length} <span class="text-xs" style="font-weight:600;">item</span></div>
        </div>
      </div>

      <!-- Edge Case 2: Offline Queue Banner -->
      ${offlineQueue.length > 0 || isOffline() ? `
        <div class="banner banner-warning">
          ${icon('wifiOff', 20)}
          <div style="flex:1;">
            <strong>${isOffline() ? 'Mode Offline Aktif — Antrean Lokal Siap' : `${offlineQueue.length} Transaksi Tertunda di Antrean Offline`}</strong>
            <div class="text-xs" style="margin-top:2px;">
              ${isOffline()
                ? `Transaksi yang dicatat saat ini akan disimpan aman di perangkat (${offlineQueue.length} antrean) dan otomatis tersinkronisasi begitu jaringan kembali normal.`
                : 'Jaringan sudah kembali online. Klik sinkronkan untuk menerbitkan nota & garansi ke akun pelanggan.'}
            </div>
          </div>
          ${!isOffline() && offlineQueue.length > 0 ? `
            <button type="button" class="btn btn-primary btn-sm" data-action="sync-offline-queue">
              ${icon('refresh', 15)} Sinkronkan (${offlineQueue.length})
            </button>
          ` : ''}
        </div>
      ` : ''}

      <!-- Two-Column POS Workspace -->
      <div class="pos-workspace">
        <!-- LEFT COLUMN: Customer Lookup + Item Picker + QR Verification -->
        <div class="stack">
          <!-- Step 1: Cari Pelanggan / Pelat Nomor -->
          <div class="card card-white">
            <div class="row-between" style="margin-bottom:10px;">
              <h3 style="font-size:16px;">1. Pilih Pelanggan &amp; Kendaraan</h3>
              ${selectedVehicle ? `<button type="button" class="btn btn-ghost btn-sm" data-action="pos-clear-customer">Ganti Pelanggan</button>` : '<span class="badge badge-blue">Wajib utk Garansi &amp; Stamp</span>'}
            </div>

            ${selectedVehicle ? `
              <div style="padding:12px 14px;border-radius:12px;background:var(--primary-soft);border:1.5px solid var(--primary-border);">
                <div class="row-between">
                  <div>
                    <div class="row" style="gap:8px;flex-wrap:wrap;">
                      <span class="plate-badge">${esc(selectedVehicle.license_plate)}</span>
                      <strong>${esc(selectedVehicle.brand)} ${esc(selectedVehicle.model)} (${selectedVehicle.year})</strong>
                    </div>
                    <div class="text-xs muted" style="margin-top:4px;">
                      Pemilik: <strong>${esc(selectedCustomer.name)}</strong> · WA: <span class="num">${esc(selectedCustomer.phone_number)}</span> · Odo terakhir: <strong class="num">${formatNumber(selectedVehicle.last_odometer)} km</strong>
                    </div>
                  </div>
                </div>

                ${customerEstimates.length > 0 ? `
                  <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--primary-border);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                    <div class="text-xs" style="color:var(--primary);">
                      ${icon('bookmark', 14)} Pelanggan ini punya <strong>Estimasi Tersimpan</strong> (${formatRupiah(customerEstimates[0].total_amount)})!
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" data-action="pos-load-estimate" data-est-id="${customerEstimates[0].id}">
                      Tarik Estimasi ke Kasir
                    </button>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div class="form-group" style="margin-bottom:10px;">
                <input type="search" class="form-input" placeholder="Cari nomor pelat (misal: B 4512 KTR), nama, atau nomor HP..." value="${esc(state.posCustomerQuery || '')}" data-pos-input="posCustomerQuery" />
              </div>
              <div class="stack-sm" style="gap:8px;">
                ${matchedVehicles.map((v) => `
                  <button type="button" class="pos-item-btn" data-action="pos-select-vehicle" data-id="${v.id}">
                    <div>
                      <div class="row" style="gap:8px;">
                        <span class="plate-badge">${esc(v.license_plate)}</span>
                        <strong class="text-sm">${esc(v.brand)} ${esc(v.model)}</strong>
                      </div>
                      <div class="text-xs muted" style="margin-top:3px;">${esc(v.owner.name)} · ${esc(v.owner.phone_number)}</div>
                    </div>
                    <span class="badge badge-blue">Pilih</span>
                  </button>
                `).join('')}
                ${matchedVehicles.length === 0 ? '<div class="text-sm muted">Pelanggan tidak ditemukan. Transaksi tetap bisa diproses sebagai Pelanggan Umum (walk-in).</div>' : ''}
              </div>
            `}
          </div>

          <!-- Step 2: Scan / Verifikasi Kode QR Klaim (Garansi & Reward) -->
          <div class="card card-white">
            <div class="row-between" style="margin-bottom:8px;">
              <h3 style="font-size:16px;">${icon('scanLine', 18)} Verifikasi / Scan Kode QR Klaim</h3>
              <span class="text-xs muted">Single-use validation</span>
            </div>
            <p class="text-xs muted" style="margin:0 0 10px;">Masukkan kode QR dari HP pelanggan — mendukung <strong>Voucher Reward (RWD-...)</strong> untuk potongan tagihan maupun <strong>Kartu Garansi (WRN-...)</strong>.</p>

            <form id="pos-verify-form" class="row" style="gap:8px;">
              <input name="claim_code" class="form-input num" style="flex:1;text-transform:uppercase;" placeholder="Contoh: RWD-2026-5001 atau WRN-2026-8841" value="${esc(state.posClaimInput || '')}" />
              <button type="submit" class="btn btn-primary" style="white-space:nowrap;">${icon('qrCode', 17)} Cek Kode</button>
            </form>

            <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap;">
              <span class="text-xs muted">Coba cepat:</span>
              <button type="button" class="btn btn-ghost btn-sm" style="min-height:28px;padding:2px 8px;font-size:11.5px;border:1px solid var(--border);" data-action="pos-fill-code" data-code="RWD-2026-5001">RWD-2026-5001 (Reward)</button>
              <button type="button" class="btn btn-ghost btn-sm" style="min-height:28px;padding:2px 8px;font-size:11.5px;border:1px solid var(--border);" data-action="pos-fill-code" data-code="WRN-2026-8841">WRN-2026-8841 (Aktif)</button>
              <button type="button" class="btn btn-ghost btn-sm" style="min-height:28px;padding:2px 8px;font-size:11.5px;border:1px solid var(--border);" data-action="pos-fill-code" data-code="WRN-2026-7102">WRN-2026-7102 (Expired)</button>
            </div>

            ${verifyResult ? `
              <div class="banner ${verifyResult.valid ? 'banner-success' : 'banner-danger'}" style="margin-top:12px;">
                ${icon(verifyResult.valid ? 'checkCircle' : 'shieldAlert', 20)}
                <div style="flex:1;">
                  ${verifyResult.valid && verifyResult.type === 'reward' ? `
                    <div class="font-bold">Voucher Reward Valid! (${esc(verifyResult.reward.reward_code)})</div>
                    <div class="text-xs" style="margin-top:2px;">${esc(verifyResult.reward.reward_title)} · Potongan <strong class="num">${formatRupiah(verifyResult.reward.discount_value)}</strong> · Pemilik: ${esc(verifyResult.customer?.name || '-')}</div>
                    <button type="button" class="btn btn-success btn-sm" style="margin-top:8px;" data-action="pos-apply-reward" data-code="${esc(verifyResult.reward.reward_code)}">
                      ${icon('check', 15)} Terapkan Potongan ke Tagihan
                    </button>
                  ` : verifyResult.valid && verifyResult.type === 'warranty' ? `
                    <div class="font-bold">Kartu Garansi Valid &amp; Aktif! (${esc(verifyResult.warranty.claim_code)})</div>
                    <div class="text-xs" style="margin-top:2px;">Item: <strong>${esc(verifyResult.warranty.item_name)}</strong> · Sisa ${verifyResult.evalRes.daysLeft} hari / ${formatNumber(verifyResult.evalRes.kmLeft)} km · Pemilik: ${esc(verifyResult.customer?.name || '-')}</div>
                    <button type="button" class="btn btn-success btn-sm" style="margin-top:8px;" data-action="pos-approve-warranty" data-id="${verifyResult.warranty.id}">
                      ${icon('shieldCheck', 15)} Setujui &amp; Tandai Sudah Diklaim (Rp 0)
                    </button>
                  ` : `
                    <div class="font-bold">Kode Tidak Valid / Ditolak</div>
                    <div class="text-xs" style="margin-top:2px;">${esc(verifyResult.reason)}</div>
                  `}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Step 3: Pilih Item Sparepart, Oli & Jasa -->
          <div class="card card-white">
            <div class="row-between" style="margin-bottom:10px;">
              <h3 style="font-size:16px;">2. Pilih Sparepart, Pelumas &amp; Jasa</h3>
              <span class="text-xs muted">Klik untuk tambah ke tagihan</span>
            </div>

            <div class="form-row form-row-2" style="margin-bottom:10px;">
              <input type="search" class="form-input" placeholder="Cari item katalog..." value="${esc(state.posItemSearch || '')}" data-pos-input="posItemSearch" />
              <div class="chip-row" style="align-items:center;">
                ${[
                  { k: 'all', l: 'Semua' },
                  { k: 'oli', l: 'Oli' },
                  { k: 'sparepart', l: 'Sparepart' },
                  { k: 'jasa', l: 'Jasa' }
                ].map((c) => `<button type="button" class="chip ${posCatFilter === c.k ? 'active' : ''}" data-action="pos-cat-filter" data-val="${c.k}">${c.l}</button>`).join('')}
              </div>
            </div>

            <div class="grid-2" style="gap:8px;">
              ${visibleCatalog.map((p) => {
                const totalUnit = p.price + (p.install_fee || 0);
                const lowStock = p.category !== 'jasa' && p.stock <= p.min_stock;
                const outOfStock = p.category !== 'jasa' && p.stock <= 0;
                return `
                  <button type="button" class="pos-item-btn" data-action="pos-add-item" data-id="${p.id}" ${outOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                    <div style="min-width:0;">
                      <div class="font-bold text-sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.name)}</div>
                      <div class="text-xs muted" style="margin-top:2px;">
                        ${p.grade === 'original' ? 'Ori' : p.grade === 'aftermarket' ? 'Aftermarket' : 'Jasa'}
                        ${p.category !== 'jasa' ? ` · <span style="color:${lowStock ? 'var(--danger-dark)' : 'var(--steel)'};font-weight:${lowStock ? 700 : 500};">Stok: ${p.stock}</span>` : ''}
                        ${p.warranty_days ? ` · Grs ${p.warranty_days}hr` : ''}
                      </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                      <div class="num font-bold text-sm" style="color:var(--primary);">${formatRupiah(totalUnit)}</div>
                      <div class="text-xs muted">${p.install_fee ? 'incl. pasang' : ''}</div>
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Sticky Checkout / Ringkasan Tagihan -->
        <div class="card card-white pos-sticky-col" style="border:2px solid var(--primary-border);">
          <div class="row-between" style="margin-bottom:12px;">
            <h3 style="font-size:17px;">${icon('receipt', 19)} Ringkasan Tagihan</h3>
            ${cart.length ? `<button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger-dark);" data-action="pos-clear-cart">Kosongkan</button>` : ''}
          </div>

          ${cart.length === 0 ? `
            <div style="text-align:center;padding:28px 14px;border-radius:12px;background:var(--bg);border:1.5px dashed var(--border-strong);margin-bottom:14px;">
              <div style="color:var(--steel-light);margin-bottom:6px;">${icon('shoppingBag', 30)}</div>
              <div class="font-bold text-sm">Belum ada item dipilih</div>
              <div class="text-xs muted">Pilih sparepart/oli di sebelah kiri atau tarik estimasi tersimpan milik pelanggan.</div>
            </div>
          ` : `
            <div class="stack-sm" style="margin-bottom:14px;max-height:260px;overflow-y:auto;">
              ${cart.map((item, idx) => `
                <div class="row-between" style="padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--border);">
                  <div style="min-width:0;flex:1;">
                    <div class="font-bold text-sm">${esc(item.name)}</div>
                    <div class="text-xs muted num">${formatRupiah(item.unit_price)} × ${item.quantity}</div>
                  </div>
                  <div class="row" style="gap:8px;">
                    <div class="qty-control">
                      <button type="button" class="qty-btn" data-action="pos-qty" data-idx="${idx}" data-delta="-1">${icon('minus', 14)}</button>
                      <span class="num font-bold" style="min-width:18px;text-align:center;">${item.quantity}</span>
                      <button type="button" class="qty-btn" data-action="pos-qty" data-idx="${idx}" data-delta="1">${icon('plus', 14)}</button>
                    </div>
                    <div class="num font-bold text-sm" style="min-width:78px;text-align:right;">${formatRupiah(item.unit_price * item.quantity)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}

          <form id="pos-checkout-form" class="stack-sm">
            <div class="form-row form-row-2">
              <div class="form-group" style="margin:0;">
                <label class="form-label">Odometer Saat Servis (km)</label>
                <input name="odometer_at_service" type="number" class="form-input num" min="0" value="${selectedVehicle ? selectedVehicle.last_odometer : 0}" required />
              </div>
              <div class="form-group" style="margin:0;">
                <label class="form-label">Pembayaran di Tempat</label>
                <select name="payment_method" class="form-select">
                  <option value="Tunai">Tunai (Cash)</option>
                  <option value="QRIS Bengkel">QRIS Bengkel</option>
                  <option value="Transfer">Transfer Bank</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin:0;">
              <label class="form-label">Catatan Mekanik (Opsional)</label>
              <input name="notes" class="form-input" placeholder="Contoh: Tekanan ban ok, kampas belakang 50%" />
            </div>

            ${appliedReward ? `
              <div class="banner banner-success" style="padding:10px 12px;">
                ${icon('gift', 18)}
                <div style="flex:1;">
                  <div class="font-bold text-xs">Voucher Aktif: ${esc(appliedReward.reward_code)}</div>
                  <div class="text-xs">Potongan <strong class="num">${formatRupiah(discount)}</strong></div>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" data-action="pos-remove-reward">${icon('x', 15)}</button>
              </div>
            ` : ''}

            <div class="divider"></div>

            <div class="stack-sm" style="gap:6px;">
              <div class="row-between text-sm">
                <span class="muted">Subtotal</span>
                <span class="num font-bold">${formatRupiah(subtotal)}</span>
              </div>
              ${discount > 0 ? `
                <div class="row-between text-sm" style="color:var(--success-dark);">
                  <span>Diskon Reward Loyalitas</span>
                  <span class="num font-bold">- ${formatRupiah(discount)}</span>
                </div>
              ` : ''}
              <div class="row-between" style="font-size:20px;margin-top:4px;">
                <strong>Total Tagihan</strong>
                <strong class="num" style="color:var(--primary);">${formatRupiah(grandTotal)}</strong>
              </div>
            </div>

            <div class="text-xs muted" style="padding:8px 10px;border-radius:8px;background:var(--bg);">
              ${icon('checkCircle', 13)} Pelunasan dilakukan langsung di bengkel (non-payment gateway). Menekan tombol di bawah otomatis menerbitkan <strong>Nota Digital</strong>, <strong>Kartu Garansi</strong>, dan <strong>+1 Stempel Loyalitas</strong>.
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" ${cart.length === 0 ? 'disabled' : ''}>
              ${icon('shieldCheck', 20)} ${isOffline() ? 'Simpan ke Antrean Offline' : 'Terbitkan Nota & Garansi'}
            </button>
          </form>
        </div>
      </div>

      <!-- P1 Feature: Pengingat Jadwal Servis Rutin (WhatsApp Click-to-Chat) -->
      <div class="card card-white">
        <div class="row-between" style="margin-bottom:12px;">
          <div>
            <h3 style="font-size:17px;">${icon('bell', 18)} Pengingat Servis Rutin Pelanggan (WhatsApp)</h3>
            <p class="text-xs muted" style="margin:2px 0 0;">Follow-up pelanggan yang mendekati jadwal ganti oli dengan 1 klik — gratis via WhatsApp Click-to-Chat (wa.me).</p>
          </div>
          <span class="badge badge-green">Retensi Pelanggan</span>
        </div>

        <div class="grid-3">
          ${reminderList.map((v) => {
            const waPhone = v.owner.phone_number.startsWith('0') ? '62' + v.owner.phone_number.slice(1) : v.owner.phone_number;
            const waText = `Halo Kak ${v.owner.name}, salam dari ${workshop.workshop_name}! Pengingat ramah: motor ${v.brand} ${v.model} (${v.license_plate}) sudah mendekati jadwal ganti oli rutin (${formatNumber(v.reminder.nextOilOdo)} km). Yuk mampir biar mesin tetap awet & tambah stempel gratis oli di aplikasi Diservisin!`;
            return `
              <div class="card" style="padding:14px;">
                <div class="row-between" style="margin-bottom:6px;">
                  <span class="plate-badge">${esc(v.license_plate)}</span>
                  <span class="badge ${v.reminder.urgency === 'overdue' ? 'badge-red' : v.reminder.urgency === 'soon' ? 'badge-amber' : 'badge-green'}">
                    ${v.reminder.urgency === 'overdue' ? 'Jatuh Tempo' : v.reminder.urgency === 'soon' ? 'Segera Servis' : 'Terjadwal'}
                  </span>
                </div>
                <div class="font-bold text-sm">${esc(v.owner.name)}</div>
                <div class="text-xs muted">${esc(v.brand)} ${esc(v.model)} · Odo <span class="num">${formatNumber(v.last_odometer)} km</span></div>
                <div class="text-xs" style="margin:6px 0 10px;color:var(--slate);">
                  Target oli: <strong class="num">${formatNumber(v.reminder.nextOilOdo)} km</strong> (${v.reminder.daysRemaining <= 0 ? `lewat ${Math.abs(v.reminder.daysRemaining)} hr` : `${v.reminder.daysRemaining} hr lagi`})
                </div>
                <a class="btn btn-whatsapp btn-sm btn-block" target="_blank" rel="noopener" href="https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}">
                  ${icon('messageCircle', 15)} Kirim Pengingat WA
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// SCREEN 8: /workshop/settings (Catalog, Stock, Warranty/Loyalty Rules & Data)
// ============================================================================
export function renderWorkshopSettingsView(state, ctx) {
  const user = getActiveUser();
  const workshop = getActiveWorkshop(user);
  const tab = state.wsTab || 'catalog'; // catalog | rules | history | data
  const { items: catalogItems } = api.getCatalog({ workshopId: workshop.id });
  const transactions = api.getTransactionHistory();
  const lowStockCount = catalogItems.filter((p) => p.category !== 'jasa' && p.stock <= p.min_stock).length;
  const totalRevenue = transactions.reduce((s, t) => s + Number(t.total_amount || 0), 0);

  return `
    <div class="stack">
      <div class="row-between">
        <div>
          <h1 style="font-size:22px;">Pengaturan Bengkel &amp; Katalog</h1>
          <p class="text-sm muted" style="margin:2px 0 0;">Kelola harga transparan, stok minimum, aturan garansi/loyalitas, dan backup data dummy.</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" data-nav="/pos">
          ${icon('receipt', 16)} Kembali ke Kasir POS
        </button>
      </div>

      <div class="tabs">
        <button type="button" class="tab-btn ${tab === 'catalog' ? 'active' : ''}" data-action="ws-tab" data-tab="catalog">
          Katalog &amp; Stok ${lowStockCount ? `(${lowStockCount} Menipis)` : ''}
        </button>
        <button type="button" class="tab-btn ${tab === 'rules' ? 'active' : ''}" data-action="ws-tab" data-tab="rules">
          Profil, Garansi &amp; Loyalitas
        </button>
        <button type="button" class="tab-btn ${tab === 'history' ? 'active' : ''}" data-action="ws-tab" data-tab="history">
          Rekap Omzet (${transactions.length})
        </button>
        <button type="button" class="tab-btn ${tab === 'data' ? 'active' : ''}" data-action="ws-tab" data-tab="data">
          Backup &amp; Reset Dummy
        </button>
      </div>

      ${tab === 'catalog' ? `
        <div class="card card-white stack-sm">
          <div class="row-between">
            <div>
              <h3 style="font-size:17px;">Daftar Produk, Harga &amp; Stok (${catalogItems.length} item)</h3>
              <div class="text-xs muted">Stok otomatis berkurang saat transaksi dicatat di kasir POS.</div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" data-action="open-catalog-modal">${icon('plus', 16)} Tambah Produk</button>
          </div>

          ${lowStockCount > 0 ? `
            <div class="banner banner-warning" style="padding:10px 14px;">
              ${icon('alertTriangle', 18)}
              <div><strong>Peringatan Stok Minimum:</strong> Ada <strong>${lowStockCount} item</strong> dengan sisa stok di bawah batas minimum. Segera restok agar transaksi tidak terhambat.</div>
            </div>
          ` : ''}

          <div style="overflow-x:auto;">
            <table class="compare-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Grade</th>
                  <th>Harga + Pasang</th>
                  <th>Stok</th>
                  <th>Garansi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${catalogItems.map((p) => {
                  const low = p.category !== 'jasa' && p.stock <= p.min_stock;
                  return `
                    <tr>
                      <td>
                        <div class="font-bold">${esc(p.name)}</div>
                        <div class="text-xs muted">${esc(p.brand)} · ${esc(p.category.toUpperCase())}</div>
                      </td>
                      <td>
                        <span class="badge ${p.grade === 'original' ? 'badge-blue' : p.grade === 'aftermarket' ? 'badge-orange' : 'badge-slate'}">${esc(p.grade)}</span>
                      </td>
                      <td class="num" style="white-space:nowrap;">
                        <strong>${formatRupiah(p.price)}</strong>
                        ${p.install_fee ? `<div class="text-xs muted">+ jasa ${formatRupiah(p.install_fee)}</div>` : ''}
                      </td>
                      <td class="num">
                        ${p.category === 'jasa' ? '<span class="muted">∞</span>' : `
                          <span class="badge ${low ? 'badge-red' : 'badge-green'}">${p.stock} / min ${p.min_stock}</span>
                        `}
                      </td>
                      <td class="num text-xs">${p.warranty_days} hr / ${formatNumber(p.warranty_km)} km</td>
                      <td>
                        <div class="row" style="gap:4px;">
                          <button type="button" class="btn btn-outline btn-sm" data-action="edit-catalog-item" data-id="${p.id}">${icon('edit', 14)}</button>
                          <button type="button" class="btn btn-danger-outline btn-sm" data-action="delete-catalog-item" data-id="${p.id}">${icon('trash', 14)}</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : tab === 'rules' ? `
        <form id="workshop-settings-form" class="grid-2">
          <div class="card card-white">
            <h3 style="font-size:17px;margin-bottom:14px;">Profil Operasional Bengkel</h3>
            <div class="form-group">
              <label class="form-label">Nama Bengkel</label>
              <input name="workshop_name" class="form-input" value="${esc(workshop.workshop_name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Lengkap</label>
              <textarea name="address" class="form-textarea" rows="2" required>${esc(workshop.address)}</textarea>
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Nomor WhatsApp (628...)</label>
                <input name="phone" class="form-input num" value="${esc(workshop.phone)}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Jam Operasional (Senin–Jumat)</label>
                <input name="weekdays" class="form-input" value="${esc(workshop.operating_hours?.weekdays || '08:00 - 18:00')}" required />
              </div>
            </div>
          </div>

          <div class="card card-white">
            <h3 style="font-size:17px;margin-bottom:14px;">Aturan Garansi &amp; Program Loyalitas</h3>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Default Garansi (Hari)</label>
                <input name="default_warranty_days" type="number" class="form-input num" min="1" value="${workshop.default_warranty_days || 30}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Default Garansi (KM)</label>
                <input name="default_warranty_km" type="number" class="form-input num" min="100" value="${workshop.default_warranty_km || 2000}" required />
              </div>
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Target Stempel Hadiah</label>
                <input name="loyalty_target_stamps" type="number" class="form-input num" min="2" max="15" value="${workshop.loyalty_target_stamps || 5}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Nilai Potongan Hadiah (Rp)</label>
                <input name="loyalty_reward_value" type="number" class="form-input num" min="0" value="${workshop.loyalty_reward_value || 65000}" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Hadiah Loyalitas</label>
              <input name="loyalty_reward_title" class="form-input" value="${esc(workshop.loyalty_reward_title)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Deskripsi Hadiah</label>
              <input name="loyalty_reward_desc" class="form-input" value="${esc(workshop.loyalty_reward_desc)}" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">${icon('checkCircle', 18)} Simpan Pengaturan Bengkel</button>
          </div>
        </form>
      ` : tab === 'history' ? `
        <div class="card card-white stack-sm">
          <div class="row-between">
            <div>
              <h3 style="font-size:17px;">Rekap Transaksi &amp; Omzet — ${esc(workshop.workshop_name)}</h3>
              <div class="text-xs muted">Data terisolasi khusus bengkel ini (tidak dapat diakses bengkel mitra lain).</div>
            </div>
            <div style="text-align:right;">
              <div class="text-xs muted">Total Omzet Tercatat</div>
              <div class="num font-bold" style="font-size:20px;color:var(--primary);">${formatRupiah(totalRevenue)}</div>
            </div>
          </div>

          <div class="stack-sm">
            ${transactions.map((t) => `
              <div class="row-between" style="padding:12px 14px;border-radius:12px;background:var(--bg);border:1px solid var(--border);">
                <div>
                  <div class="row" style="gap:8px;">
                    <strong class="num text-sm" style="color:var(--primary);">${esc(t.transaction_number)}</strong>
                    <span class="badge badge-green">${esc(t.payment_method)}</span>
                    ${t.reward_code_used ? `<span class="badge badge-orange">Voucher ${esc(t.reward_code_used)}</span>` : ''}
                  </div>
                  <div class="text-xs muted" style="margin-top:3px;">
                    ${formatDateTimeID(t.created_at)} · ${esc(t.customer?.name || 'Walk-in')} ${t.vehicle ? `(${esc(t.vehicle.license_plate)})` : ''}
                  </div>
                  <div class="text-xs" style="margin-top:3px;">${t.items.map((i) => `${esc(i.name_snapshot)} ×${i.quantity}`).join(', ')}</div>
                </div>
                <div class="row" style="gap:10px;">
                  <strong class="num" style="font-size:16px;">${formatRupiah(t.total_amount)}</strong>
                  <button type="button" class="btn btn-outline btn-sm" data-action="view-receipt" data-id="${t.id}">Nota</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="grid-2">
          <div class="card card-white stack-sm">
            <h3 style="font-size:17px;">${icon('download', 18)} Backup &amp; Ekspor Data JSON</h3>
            <p class="text-sm muted" style="margin:0;">Skema JSON di localStorage sudah kompatibel untuk migrasi ke PostgreSQL / Supabase. Unduh backup agar data uji coba aman saat cache browser dibersihkan.</p>
            <div class="row" style="gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn btn-primary" data-action="export-json">${icon('download', 16)} Ekspor Backup JSON</button>
              <label class="btn btn-outline" style="cursor:pointer;">
                ${icon('upload', 16)} Impor JSON
                <input type="file" accept="application/json" id="import-json-input" style="display:none;" />
              </label>
            </div>
          </div>

          <div class="card card-white stack-sm" style="border-color:#FECACA;">
            <h3 style="font-size:17px;color:var(--danger-dark);">${icon('refresh', 18)} Reset Data Dummy</h3>
            <p class="text-sm muted" style="margin:0;">Kembalikan seluruh data katalog, transaksi, kartu garansi, stok, dan stempel loyalitas ke kondisi awal (Pre-loaded Seed Data) dalam satu klik.</p>
            <button type="button" class="btn btn-danger-outline" data-action="reset-dummy-data">
              ${icon('refresh', 16)} Reset Semua Data Dummy ke Awal
            </button>
          </div>
        </div>
      `}
    </div>
  `;
}

// Catalog Add/Edit Modal
export function renderCatalogItemModal(item = null) {
  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal-card">
        <div class="row-between" style="margin-bottom:14px;">
          <h3 style="font-size:18px;">${item ? 'Edit Produk / Jasa' : 'Tambah Produk Katalog'}</h3>
          <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 18)}</button>
        </div>
        <form id="catalog-item-form" data-id="${item ? item.id : ''}">
          <div class="form-group">
            <label class="form-label">Nama Produk / Jasa</label>
            <input name="name" class="form-input" value="${esc(item?.name || '')}" placeholder="Contoh: Oli Shell Advance AX7 0.8L" required />
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select name="category" class="form-select">
                <option value="oli" ${item?.category === 'oli' ? 'selected' : ''}>Pelumas / Oli</option>
                <option value="sparepart" ${item?.category === 'sparepart' ? 'selected' : ''}>Sparepart</option>
                <option value="jasa" ${item?.category === 'jasa' ? 'selected' : ''}>Jasa Servis</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tingkat Kualitas (Grade)</label>
              <select name="grade" class="form-select">
                <option value="original" ${item?.grade === 'original' ? 'selected' : ''}>Original (OEM)</option>
                <option value="aftermarket" ${item?.grade === 'aftermarket' ? 'selected' : ''}>Aftermarket</option>
                <option value="jasa" ${item?.grade === 'jasa' ? 'selected' : ''}>Jasa</option>
              </select>
            </div>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Merek</label>
              <input name="brand" class="form-input" value="${esc(item?.brand || '')}" placeholder="AHM / Shell / Daytona" required />
            </div>
            <div class="form-group">
              <label class="form-label">Kecocokan Motor (pisahkan koma)</label>
              <input name="compatible_models" class="form-input" value="${esc((item?.compatible_models || ['Vario 150', 'NMAX 155', 'Beat Street']).join(', '))}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Spesifikasi Teknis</label>
            <textarea name="specs" class="form-textarea" rows="2" required>${esc(item?.specs || '')}</textarea>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Harga Barang (Rp)</label>
              <input name="price" type="number" class="form-input num" min="0" value="${item?.price ?? 50000}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Estimasi Jasa Pasang (Rp)</label>
              <input name="install_fee" type="number" class="form-input num" min="0" value="${item?.install_fee ?? 10000}" required />
            </div>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Sisa Stok</label>
              <input name="stock" type="number" class="form-input num" min="0" value="${item?.stock ?? 10}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Batas Stok Minimum</label>
              <input name="min_stock" type="number" class="form-input num" min="0" value="${item?.min_stock ?? 4}" required />
            </div>
          </div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Garansi (Hari)</label>
              <input name="warranty_days" type="number" class="form-input num" min="0" value="${item?.warranty_days ?? 30}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Garansi (Kilometer)</label>
              <input name="warranty_km" type="number" class="form-input num" min="0" value="${item?.warranty_km ?? 2000}" required />
            </div>
          </div>
          <div class="row" style="gap:8px;margin-top:8px;">
            <button type="button" class="btn btn-outline" style="flex:1;" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary" style="flex:1;">Simpan Produk</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
