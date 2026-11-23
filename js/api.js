// Client-Side State & Mock API Service matching PRD Section 6 API Contract (/api/v1/*)
// Zero-Cost Dummy Architecture using localStorage with offline queue & catalog cache resilience.

import { createSeedData } from './seed.js';

// v2: storefront seed (product photos, tires, ratings). Bumping the key reseeds existing browsers cleanly.
const DB_KEY = 'diservisin_db_v2';
const SESSION_KEY = 'diservisin_session_v1';
const QUEUE_KEY = 'diservisin_offline_queue_v2';
const CACHE_KEY = 'diservisin_catalog_cache_v2';

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function randomDigits(len = 4) {
  return String(Math.floor(Math.pow(10, len - 1) + Math.random() * 9 * Math.pow(10, len - 1)));
}

export function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = createSeedData();
      saveDB(seeded);
      return seeded;
    }
    return JSON.parse(raw);
  } catch {
    const seeded = createSeedData();
    saveDB(seeded);
    return seeded;
  }
}

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDummyData() {
  const seeded = createSeedData();
  saveDB(seeded);
  localStorage.removeItem(QUEUE_KEY);
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    cached_at: new Date().toISOString(),
    items: seeded.parts_catalog
  }));
  return seeded;
}

export function exportDBJson() {
  return JSON.stringify(loadDB(), null, 2);
}

export function importDBJson(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.parts_catalog)) {
    throw new Error('Format JSON backup Diservisin tidak valid.');
  }
  saveDB(parsed);
  return parsed;
}

// Offline Simulation + Real Network Status
let simulatedOffline = false;
export function isOffline() {
  return simulatedOffline || (typeof navigator !== 'undefined' && navigator.onLine === false);
}
export function setSimulatedOffline(val) {
  simulatedOffline = Boolean(val);
}
export function getSimulatedOffline() {
  return simulatedOffline;
}

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Session & Mock JWT Auth
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getActiveUser() {
  const session = getSession();
  if (!session) return null;
  const db = loadDB();
  return db.users.find((u) => u.id === session.user_id) || null;
}

export function getActiveWorkshop(user) {
  const db = loadDB();
  if (!user) return db.workshop_profiles[0];
  if (user.role === 'bengkel_admin') {
    return db.workshop_profiles.find((w) => w.user_id === user.id) || db.workshop_profiles[0];
  }
  return db.workshop_profiles[0];
}

// Compute transparent warranty live status & expiration reason
export function evaluateWarrantyStatus(warranty, vehicle) {
  if (warranty.status === 'claimed') {
    return {
      effectiveStatus: 'claimed',
      daysLeft: 0,
      kmLeft: 0,
      expiredReason: 'Kartu garansi ini sudah pernah diklaim (single-use).'
    };
  }
  const now = new Date();
  const endDate = new Date(warranty.end_date);
  const msLeft = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const currentOdo = vehicle ? Number(vehicle.last_odometer) : Number(warranty.start_odometer);
  const kmLeft = Number(warranty.end_odometer) - currentOdo;

  if (warranty.status === 'expired' || daysLeft <= 0 || kmLeft <= 0) {
    const reasons = [];
    if (daysLeft <= 0) {
      reasons.push(`Masa berlaku berakhir pada ${formatDateID(warranty.end_date)}`);
    }
    if (kmLeft <= 0) {
      reasons.push(`Batas jarak tempuh ${formatNumber(warranty.end_odometer)} km telah terlampaui (odometer saat ini ${formatNumber(currentOdo)} km)`);
    }
    return {
      effectiveStatus: 'expired',
      daysLeft: Math.max(0, daysLeft),
      kmLeft: Math.max(0, kmLeft),
      expiredReason: reasons.join(' dan ') || 'Masa garansi telah habis.'
    };
  }

  return {
    effectiveStatus: 'active',
    daysLeft,
    kmLeft,
    expiredReason: null
  };
}

// Oil-change reminder computation
export function evaluateOilReminder(vehicle) {
  const intervalKm = vehicle.oil_interval_km || 2000;
  const intervalDays = vehicle.oil_interval_days || 60;
  const lastOilOdo = vehicle.last_oil_odometer ?? Math.max(0, vehicle.last_odometer - 1500);
  const nextOilOdo = lastOilOdo + intervalKm;
  const kmRemaining = nextOilOdo - vehicle.last_odometer;

  const lastDate = vehicle.last_service_date ? new Date(vehicle.last_service_date) : new Date();
  const nextDate = new Date(lastDate.getTime() + intervalDays * 86400000);
  const daysRemaining = Math.ceil((nextDate.getTime() - Date.now()) / 86400000);

  let urgency = 'ok'; // ok | soon | overdue
  if (kmRemaining <= 0 || daysRemaining <= 0) {
    urgency = 'overdue';
  } else if (kmRemaining <= 350 || daysRemaining <= 10) {
    urgency = 'soon';
  }

  return {
    nextOilOdo,
    kmRemaining,
    nextDate: nextDate.toISOString(),
    daysRemaining,
    urgency
  };
}

// Formatting helpers
export function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function formatNumber(val) {
  return (Number(val) || 0).toLocaleString('id-ID');
}

export function formatDateID(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTimeID(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================================
// MOCK API SERVICE — PRD Section 6 Contract (/api/v1/*)
// ============================================================

export const api = {
  // POST /api/v1/auth/register
  register({ name, phone_number, email, role }) {
    const db = loadDB();
    const cleanPhone = (phone_number || '').replace(/\D/g, '');
    if (!name || !cleanPhone) {
      throw new Error('Nama dan nomor WhatsApp wajib diisi.');
    }
    const exists = db.users.find((u) => u.phone_number === cleanPhone);
    if (exists) {
      throw new Error('Nomor HP sudah terdaftar. Silakan langsung masuk.');
    }
    const newUser = {
      id: uid('usr'),
      name: name.trim(),
      phone_number: cleanPhone,
      email: (email || '').trim() || `${cleanPhone}@diservisin.id`,
      role: role === 'bengkel_admin' ? 'bengkel_admin' : 'customer',
      password_hash: 'mock_otp_verified',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);

    if (newUser.role === 'bengkel_admin') {
      db.workshop_profiles.push({
        id: uid('ws'),
        user_id: newUser.id,
        workshop_name: `Bengkel ${newUser.name}`,
        address: 'Alamat belum diatur — lengkapi di Pengaturan Bengkel',
        phone: cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone,
        operating_hours: { weekdays: '08:00 - 18:00', saturday: '08:00 - 17:00', sunday: 'Tutup' },
        is_active: true,
        rating: 5.0,
        distance_km: 0.5,
        loyalty_target_stamps: 5,
        loyalty_reward_title: 'Gratis 1x Ganti Oli + Merch Diservisin',
        loyalty_reward_desc: 'Berlaku untuk penggantian oli standar matic.',
        loyalty_reward_value: 65000,
        default_warranty_days: 30,
        default_warranty_km: 2000
      });
    }
    saveDB(db);
    return this.createSessionForUser(newUser);
  },

  // POST /api/v1/auth/login
  login({ identifier, role }) {
    const db = loadDB();
    const q = (identifier || '').trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    let user = db.users.find(
      (u) =>
        (qDigits && u.phone_number === qDigits) ||
        (q && u.email.toLowerCase() === q)
    );
    if (!user) {
      // Quick demo fallback by chosen role
      user = db.users.find((u) => u.role === (role || 'customer')) || db.users[0];
    }
    return this.createSessionForUser(user);
  },

  // 1-Click Demo Role Switcher
  switchRole(targetRole) {
    const db = loadDB();
    const user =
      targetRole === 'bengkel_admin'
        ? db.users.find((u) => u.id === 'usr-bengkel-1') || db.users.find((u) => u.role === 'bengkel_admin')
        : db.users.find((u) => u.id === 'usr-cust-1') || db.users.find((u) => u.role === 'customer');
    return this.createSessionForUser(user);
  },

  createSessionForUser(user) {
    const session = {
      token: `jwt_mock_${user.id}_${Date.now()}`,
      user_id: user.id,
      role: user.role,
      active_vehicle_id: null
    };
    if (user.role === 'customer') {
      const db = loadDB();
      const firstVeh = db.user_vehicles.find((v) => v.user_id === user.id);
      session.active_vehicle_id = firstVeh ? firstVeh.id : null;
    }
    saveSession(session);
    return { token: session.token, user };
  },

  logout() {
    saveSession(null);
  },

  // GET /api/v1/vehicles
  getVehicles(userId) {
    const db = loadDB();
    const targetId = userId || getSession()?.user_id;
    return db.user_vehicles.filter((v) => v.user_id === targetId);
  },

  // POST /api/v1/vehicles
  addVehicle({ brand, model, year, license_plate, last_odometer }) {
    const user = getActiveUser();
    if (!user) throw new Error('Sesi tidak ditemukan.');
    const db = loadDB();
    const odo = Number(last_odometer) || 0;
    const vehicle = {
      id: uid('veh'),
      user_id: user.id,
      brand: brand.trim(),
      model: model.trim(),
      year: Number(year) || new Date().getFullYear(),
      license_plate: license_plate.trim().toUpperCase(),
      last_odometer: odo,
      last_oil_odometer: odo,
      last_service_date: new Date().toISOString(),
      oil_interval_km: 2000,
      oil_interval_days: 60,
      created_at: new Date().toISOString()
    };
    db.user_vehicles.push(vehicle);
    saveDB(db);
    const sess = getSession();
    if (sess && !sess.active_vehicle_id) {
      sess.active_vehicle_id = vehicle.id;
      saveSession(sess);
    }
    return vehicle;
  },

  updateVehicle(vehicleId, patch) {
    const db = loadDB();
    const idx = db.user_vehicles.findIndex((v) => v.id === vehicleId);
    if (idx === -1) throw new Error('Motor tidak ditemukan.');
    db.user_vehicles[idx] = {
      ...db.user_vehicles[idx],
      ...patch,
      license_plate: patch.license_plate ? patch.license_plate.trim().toUpperCase() : db.user_vehicles[idx].license_plate,
      last_odometer: patch.last_odometer !== undefined ? Number(patch.last_odometer) : db.user_vehicles[idx].last_odometer
    };
    saveDB(db);
    return db.user_vehicles[idx];
  },

  deleteVehicle(vehicleId) {
    const db = loadDB();
    db.user_vehicles = db.user_vehicles.filter((v) => v.id !== vehicleId);
    saveDB(db);
  },

  // GET /api/v1/workshops
  getWorkshops() {
    const db = loadDB();
    return db.workshop_profiles.filter((w) => w.is_active);
  },

  // GET /api/v1/catalog (with offline cache fallback!)
  getCatalog({ workshopId = 'ws-1', category = 'all', grade = 'all', model = '', search = '' } = {}) {
    let sourceItems = [];
    let fromCache = false;
    let cachedAt = null;

    if (isOffline()) {
      fromCache = true;
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Array.isArray(cached.items)) {
          sourceItems = cached.items;
          cachedAt = cached.cached_at;
        }
      } catch {
        // fallback to local db
      }
      if (!sourceItems.length) {
        sourceItems = loadDB().parts_catalog;
        cachedAt = new Date().toISOString();
      }
    } else {
      const db = loadDB();
      sourceItems = db.parts_catalog;
      cachedAt = new Date().toISOString();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ cached_at: cachedAt, items: sourceItems }));
    }

    let items = sourceItems.filter((p) => !workshopId || p.workshop_id === workshopId);
    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category);
    }
    if (grade && grade !== 'all') {
      items = items.filter((p) => p.grade === grade);
    }
    if (model && model !== 'all') {
      const m = model.toLowerCase();
      items = items.filter(
        (p) =>
          !p.compatible_models ||
          p.compatible_models.length === 0 ||
          p.compatible_models.some((cm) => cm.toLowerCase().includes(m) || cm.toLowerCase().includes('semua'))
      );
    }
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.brand.toLowerCase().includes(s) ||
          p.specs.toLowerCase().includes(s)
      );
    }

    return { items, fromCache, cachedAt };
  },

  // Save Customer Estimate (Flow 1 -> Flow 2 bridge)
  saveEstimate({ vehicle_id, workshop_id = 'ws-1', items }) {
    const user = getActiveUser();
    if (!user) throw new Error('Silakan masuk terlebih dahulu.');
    if (!items || !items.length) throw new Error('Pilih minimal 1 produk untuk disimpan.');
    const db = loadDB();
    const total = items.reduce((acc, it) => acc + (Number(it.price) + Number(it.install_fee || 0)) * Number(it.quantity || 1), 0);
    const est = {
      id: uid('est'),
      user_id: user.id,
      vehicle_id,
      workshop_id,
      items,
      total_amount: total,
      status: 'saved',
      created_at: new Date().toISOString()
    };
    db.saved_estimates.unshift(est);
    saveDB(db);
    return est;
  },

  getSavedEstimates(userId) {
    const db = loadDB();
    return db.saved_estimates.filter((e) => (!userId || e.user_id === userId) && e.status === 'saved');
  },

  deleteSavedEstimate(estId) {
    const db = loadDB();
    db.saved_estimates = db.saved_estimates.filter((e) => e.id !== estId);
    saveDB(db);
  },

  // POST /api/v1/transactions (Admin RBAC + Offline Queue Support)
  createTransaction(payload) {
    const actor = getActiveUser();
    if (!actor || actor.role !== 'bengkel_admin') {
      throw new Error('Akses ditolak (RBAC): Hanya Admin Bengkel yang dapat menerbitkan transaksi.');
    }

    // Offline resilience: store into offline queue if offline
    if (isOffline()) {
      const queue = getOfflineQueue();
      const queuedItem = {
        queue_id: uid('q'),
        queued_at: new Date().toISOString(),
        payload
      };
      queue.push(queuedItem);
      saveOfflineQueue(queue);
      return { queued: true, queue_item: queuedItem };
    }

    return this._commitTransaction(payload, actor);
  },

  syncOfflineQueue() {
    if (isOffline()) return { syncedCount: 0 };
    const queue = getOfflineQueue();
    if (!queue.length) return { syncedCount: 0 };
    const actor = getActiveUser();
    let syncedCount = 0;
    for (const entry of queue) {
      this._commitTransaction(entry.payload, actor);
      syncedCount++;
    }
    saveOfflineQueue([]);
    return { syncedCount };
  },

  _commitTransaction(payload, actor) {
    const db = loadDB();
    const workshop = getActiveWorkshop(actor);
    const {
      customer_user_id,
      vehicle_id,
      odometer_at_service,
      items,
      payment_method = 'Tunai',
      notes = '',
      reward_code = null,
      applied_estimate_id = null
    } = payload;

    if (!items || !items.length) {
      throw new Error('Tambahkan minimal 1 item sparepart, oli, atau jasa.');
    }

    let subtotalAll = 0;
    const trxId = uid('trx');
    const nowIso = new Date().toISOString();
    const trxNum = `DSV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomDigits(4)}`;

    const createdItems = [];
    const createdWarranties = [];
    let hasOilOrService = false;

    for (const line of items) {
      const cat = db.parts_catalog.find((p) => p.id === line.catalog_id);
      const qty = Math.max(1, Number(line.quantity) || 1);
      const unitPrice = Number(line.unit_price ?? (cat ? cat.price + (cat.install_fee || 0) : 0));
      const lineSub = unitPrice * qty;
      subtotalAll += lineSub;

      const tiId = uid('ti');
      const ti = {
        id: tiId,
        transaction_id: trxId,
        catalog_id: line.catalog_id || null,
        name_snapshot: line.name || (cat ? cat.name : 'Item Servis'),
        category_snapshot: cat ? cat.category : line.category || 'jasa',
        grade_snapshot: cat ? cat.grade : line.grade || 'jasa',
        quantity: qty,
        price_at_transaction: unitPrice,
        subtotal: lineSub
      };
      createdItems.push(ti);

      if (ti.category_snapshot === 'oli' || ti.category_snapshot === 'jasa') {
        hasOilOrService = true;
      }

      // Auto-deduct stock for physical items (P1 Stock Management)
      if (cat && cat.category !== 'jasa' && cat.stock > 0) {
        cat.stock = Math.max(0, cat.stock - qty);
      }

      // Auto-generate Digital Warranty Card with explicit terms, date, and km
      const wDays = cat ? Number(cat.warranty_days || 0) : Number(workshop.default_warranty_days || 0);
      const wKm = cat ? Number(cat.warranty_km || 0) : Number(workshop.default_warranty_km || 0);
      if (wDays > 0 && customer_user_id) {
        const startOdo = Number(odometer_at_service) || 0;
        const endDate = new Date(Date.now() + wDays * 86400000).toISOString();
        createdWarranties.push({
          id: uid('wrn'),
          transaction_id: trxId,
          item_id: tiId,
          user_id: customer_user_id,
          workshop_id: workshop.id,
          vehicle_id: vehicle_id || null,
          item_name: ti.name_snapshot,
          claim_code: `WRN-${new Date().getFullYear()}-${randomDigits(4)}`,
          start_date: nowIso,
          end_date: endDate,
          start_odometer: startOdo,
          end_odometer: startOdo + wKm,
          status: 'active',
          claimed_at: null,
          terms: `Garansi resmi ${workshop.workshop_name}: berlaku ${wDays} hari atau ${formatNumber(wKm)} km sejak transaksi (${trxNum}), mana yang tercapai lebih dulu. Klaim 1x (single-use) dengan menunjukkan QR.`
        });
      }
    }

    // Apply & single-use redeem loyalty reward if attached
    let discountAmount = 0;
    let rewardCodeUsed = null;
    if (reward_code) {
      const rwd = db.claimed_rewards.find(
        (r) => r.reward_code.toUpperCase() === reward_code.trim().toUpperCase() && r.workshop_id === workshop.id
      );
      if (!rwd) {
        throw new Error('Kode voucher reward tidak ditemukan untuk bengkel ini.');
      }
      if (rwd.status === 'redeemed') {
        throw new Error('Voucher reward ini sudah pernah digunakan (single-use).');
      }
      discountAmount = Math.min(subtotalAll, Number(rwd.discount_value || workshop.loyalty_reward_value || 65000));
      rewardCodeUsed = rwd.reward_code;
      rwd.status = 'redeemed';
      rwd.redeemed_at = nowIso;
      rwd.redeemed_transaction_id = trxId;
    }

    const totalAmount = Math.max(0, subtotalAll - discountAmount);

    const trx = {
      id: trxId,
      workshop_id: workshop.id,
      customer_user_id: customer_user_id || null,
      vehicle_id: vehicle_id || null,
      transaction_number: trxNum,
      odometer_at_service: Number(odometer_at_service) || 0,
      discount_amount: discountAmount,
      reward_code_used: rewardCodeUsed,
      total_amount: totalAmount,
      payment_method,
      payment_status: 'paid',
      notes: notes.trim(),
      created_at: nowIso,
      synced: true
    };

    db.transactions.unshift(trx);
    db.transaction_items.push(...createdItems);
    db.digital_warranties.unshift(...createdWarranties);

    // Update customer vehicle odometer & oil service date
    if (vehicle_id) {
      const veh = db.user_vehicles.find((v) => v.id === vehicle_id);
      if (veh) {
        const newOdo = Math.max(Number(veh.last_odometer) || 0, Number(odometer_at_service) || 0);
        veh.last_odometer = newOdo;
        veh.last_service_date = nowIso;
        if (createdItems.some((ci) => ci.category_snapshot === 'oli')) {
          veh.last_oil_odometer = newOdo;
        }
      }
    }

    // Mark saved estimate as applied
    if (applied_estimate_id) {
      const est = db.saved_estimates.find((e) => e.id === applied_estimate_id);
      if (est) est.status = 'applied';
    }

    // Add 1 Loyalty Stamp automatically for valid customer transaction
    let stampAdded = false;
    if (customer_user_id && (hasOilOrService || totalAmount >= 40000)) {
      db.stamps.push({
        id: uid('stp'),
        user_id: customer_user_id,
        workshop_id: workshop.id,
        transaction_id: trxId,
        activity_type: createdItems.some((i) => i.category_snapshot === 'oli') ? 'ganti_oli' : 'servis_berkala',
        count_added: 1,
        created_at: nowIso
      });
      stampAdded = true;
    }

    saveDB(db);
    return {
      queued: false,
      transaction: trx,
      items: createdItems,
      warranties: createdWarranties,
      stampAdded
    };
  },

  // GET /api/v1/transactions/history (Workshop isolation + Customer scoping)
  getTransactionHistory() {
    const user = getActiveUser();
    if (!user) return [];
    const db = loadDB();
    let list = [];
    if (user.role === 'bengkel_admin') {
      const ws = getActiveWorkshop(user);
      list = db.transactions.filter((t) => t.workshop_id === ws.id);
    } else {
      list = db.transactions.filter((t) => t.customer_user_id === user.id);
    }
    return list.map((t) => ({
      ...t,
      workshop: db.workshop_profiles.find((w) => w.id === t.workshop_id) || null,
      customer: db.users.find((u) => u.id === t.customer_user_id) || null,
      vehicle: db.user_vehicles.find((v) => v.id === t.vehicle_id) || null,
      items: db.transaction_items.filter((i) => i.transaction_id === t.id),
      warranties: db.digital_warranties.filter((w) => w.transaction_id === t.id)
    }));
  },

  // GET /api/v1/warranties
  getWarranties() {
    const user = getActiveUser();
    if (!user) return [];
    const db = loadDB();
    const list =
      user.role === 'bengkel_admin'
        ? db.digital_warranties.filter((w) => w.workshop_id === getActiveWorkshop(user).id)
        : db.digital_warranties.filter((w) => w.user_id === user.id);

    return list.map((w) => {
      const vehicle = db.user_vehicles.find((v) => v.id === w.vehicle_id) || null;
      const workshop = db.workshop_profiles.find((ws) => ws.id === w.workshop_id) || null;
      const trx = db.transactions.find((t) => t.id === w.transaction_id) || null;
      const evalRes = evaluateWarrantyStatus(w, vehicle);
      return { ...w, vehicle, workshop, transaction: trx, ...evalRes };
    });
  },

  // Inspect a QR/Unique code in POS before claiming (supports WRN-... and RWD-...)
  verifyClaimCode(rawCode) {
    const actor = getActiveUser();
    if (!actor || actor.role !== 'bengkel_admin') {
      throw new Error('Hanya Admin Bengkel yang dapat memverifikasi kode klaim.');
    }
    const ws = getActiveWorkshop(actor);
    const cleaned = (rawCode || '').trim().replace(/^DISERVISIN\|/i, '').toUpperCase();
    if (!cleaned) throw new Error('Masukkan kode klaim QR terlebih dahulu.');

    const db = loadDB();
    // Check Warranty Code
    const wrn = db.digital_warranties.find((w) => w.claim_code.toUpperCase() === cleaned);
    if (wrn) {
      if (wrn.workshop_id !== ws.id) {
        return { valid: false, type: 'warranty', reason: 'Kartu garansi ini diterbitkan oleh bengkel mitra lain.' };
      }
      const vehicle = db.user_vehicles.find((v) => v.id === wrn.vehicle_id) || null;
      const customer = db.users.find((u) => u.id === wrn.user_id) || null;
      const evalRes = evaluateWarrantyStatus(wrn, vehicle);
      return {
        valid: evalRes.effectiveStatus === 'active',
        type: 'warranty',
        warranty: wrn,
        vehicle,
        customer,
        evalRes,
        reason: evalRes.expiredReason
      };
    }

    // Check Reward Code
    const rwd = db.claimed_rewards.find((r) => r.reward_code.toUpperCase() === cleaned);
    if (rwd) {
      if (rwd.workshop_id !== ws.id) {
        return { valid: false, type: 'reward', reason: 'Voucher reward ini milik bengkel mitra lain.' };
      }
      const customer = db.users.find((u) => u.id === rwd.user_id) || null;
      if (rwd.status === 'redeemed') {
        return {
          valid: false,
          type: 'reward',
          reward: rwd,
          customer,
          reason: `Voucher ini sudah pernah ditukarkan pada ${formatDateTimeID(rwd.redeemed_at)} (single-use).`
        };
      }
      return {
        valid: true,
        type: 'reward',
        reward: rwd,
        customer,
        reason: null
      };
    }

    return { valid: false, type: 'unknown', reason: `Kode "${cleaned}" tidak ditemukan di sistem.` };
  },

  // POST /api/v1/warranties/:id/claim (Admin RBAC, Single-use validation)
  claimWarranty(warrantyId) {
    const actor = getActiveUser();
    if (!actor || actor.role !== 'bengkel_admin') {
      throw new Error('Akses ditolak: hanya kasir bengkel yang dapat menyetujui klaim garansi.');
    }
    const db = loadDB();
    const wrn = db.digital_warranties.find((w) => w.id === warrantyId);
    if (!wrn) throw new Error('Kartu garansi tidak ditemukan.');
    const vehicle = db.user_vehicles.find((v) => v.id === wrn.vehicle_id) || null;
    const evalRes = evaluateWarrantyStatus(wrn, vehicle);
    if (evalRes.effectiveStatus !== 'active') {
      throw new Error(evalRes.expiredReason || 'Kartu garansi tidak aktif.');
    }
    wrn.status = 'claimed';
    wrn.claimed_at = new Date().toISOString();
    saveDB(db);
    return wrn;
  },

  // GET /api/v1/loyalty/stamps
  getLoyaltySummary(userId) {
    const db = loadDB();
    const uidTarget = userId || getSession()?.user_id;
    const workshop = db.workshop_profiles[0];
    const target = workshop.loyalty_target_stamps || 5;
    const userStamps = db.stamps.filter((s) => s.user_id === uidTarget && s.workshop_id === workshop.id);
    const totalStamps = userStamps.reduce((sum, s) => sum + (Number(s.count_added) || 1), 0);
    const rewards = db.claimed_rewards.filter((r) => r.user_id === uidTarget && r.workshop_id === workshop.id);
    // Calculate unspent stamps after redemptions created from stamps (excluding seeded bonus reward rwd-1)
    const convertedRewardsCount = rewards.filter((r) => r.id !== 'rwd-1').length;
    const availableStamps = Math.max(0, totalStamps - convertedRewardsCount * target);
    const currentProgress = availableStamps >= target ? target : availableStamps;

    return {
      workshop,
      target,
      totalStamps,
      availableStamps,
      currentProgress,
      canGenerateVoucher: availableStamps >= target,
      stamps: userStamps,
      rewards
    };
  },

  // POST /api/v1/loyalty/rewards/redeem (Customer converts full stamps -> single-use QR voucher)
  redeemLoyaltyReward() {
    const user = getActiveUser();
    if (!user) throw new Error('Silakan masuk terlebih dahulu.');
    const summary = this.getLoyaltySummary(user.id);
    if (!summary.canGenerateVoucher) {
      throw new Error(`Stempel belum penuh (${summary.currentProgress}/${summary.target}). Kumpulkan ${summary.target - summary.currentProgress} stempel lagi.`);
    }
    const db = loadDB();
    const ws = summary.workshop;
    const newReward = {
      id: uid('rwd'),
      user_id: user.id,
      workshop_id: ws.id,
      reward_type: 'loyalty_stamp_reward',
      reward_title: ws.loyalty_reward_title,
      reward_code: `RWD-${new Date().getFullYear()}-${randomDigits(4)}`,
      discount_value: Number(ws.loyalty_reward_value) || 65000,
      claimed_at: new Date().toISOString(),
      status: 'pending',
      redeemed_at: null,
      redeemed_transaction_id: null
    };
    db.claimed_rewards.unshift(newReward);
    saveDB(db);
    return newReward;
  },

  // Workshop Settings CRUD (Admin RBAC)
  updateWorkshopProfile(patch) {
    const actor = getActiveUser();
    if (!actor || actor.role !== 'bengkel_admin') throw new Error('Akses ditolak.');
    const db = loadDB();
    const ws = db.workshop_profiles.find((w) => w.user_id === actor.id);
    if (!ws) throw new Error('Profil bengkel tidak ditemukan.');
    Object.assign(ws, patch);
    saveDB(db);
    return ws;
  },

  upsertCatalogItem(itemData) {
    const actor = getActiveUser();
    if (!actor || actor.role !== 'bengkel_admin') throw new Error('Akses ditolak.');
    const db = loadDB();
    const ws = getActiveWorkshop(actor);
    if (itemData.id) {
      const idx = db.parts_catalog.findIndex((p) => p.id === itemData.id && p.workshop_id === ws.id);
      if (idx === -1) throw new Error('Produk tidak ditemukan.');
      db.parts_catalog[idx] = { ...db.parts_catalog[idx], ...itemData };
      saveDB(db);
      return db.parts_catalog[idx];
    } else {
      const created = {
        id: uid('cat'),
        workshop_id: ws.id,
        name: itemData.name,
        category: itemData.category || 'sparepart',
        brand: itemData.brand || ws.workshop_name,
        specs: itemData.specs || '-',
        grade: itemData.grade || 'original',
        compatible_models: itemData.compatible_models || ['Semua Motor Matic'],
        price: Number(itemData.price) || 0,
        install_fee: Number(itemData.install_fee) || 0,
        stock: Number(itemData.stock) || 0,
        min_stock: Number(itemData.min_stock) || 4,
        warranty_days: Number(itemData.warranty_days) || 0,
        warranty_km: Number(itemData.warranty_km) || 0
      };
      db.parts_catalog.unshift(created);
      saveDB(db);
      return created;
    }
  },

  deleteCatalogItem(itemId) {
    const actor = getActiveUser();
    if (!actor || actor.role !== 'bengkel_admin') throw new Error('Akses ditolak.');
    const db = loadDB();
    const ws = getActiveWorkshop(actor);
    db.parts_catalog = db.parts_catalog.filter((p) => !(p.id === itemId && p.workshop_id === ws.id));
    saveDB(db);
  }
};
