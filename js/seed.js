// Pre-loaded Realistic Seed Data — Exact PRD Section 6 Entity Schema (PostgreSQL / Supabase Ready)

function daysOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// Storefront merchandising metadata (photo, strike-through price, rating, sold count, "new" flag, part type).
// Kept separate from the PRD core schema so `parts_catalog` stays migration-ready for PostgreSQL / Supabase.
const STORE_META = {
  'cat-oli-1': { image: 'oil-red', original_price: 58000, rating: 4.9, rating_count: 214, sold_count: 1240 },
  'cat-oli-2': { image: 'oil-yellow', rating: 4.8, rating_count: 156, sold_count: 860 },
  'cat-oli-3': { image: 'oil-blue', original_price: 62000, rating: 4.9, rating_count: 98, sold_count: 640 },
  'cat-oli-4': { image: 'oil-black', rating: 5.0, rating_count: 41, sold_count: 210, is_new: true },
  'cat-part-1': { image: 'brake-pad', part_type: 'rem', original_price: 72000, rating: 4.8, rating_count: 77, sold_count: 390 },
  'cat-part-2': { image: 'brake-pad', part_type: 'rem', rating: 4.7, rating_count: 52, sold_count: 310 },
  'cat-part-3': { image: 'vbelt', part_type: 'cvt', rating: 4.9, rating_count: 36, sold_count: 120 },
  'cat-part-4': { image: 'vbelt', part_type: 'cvt', original_price: 159000, rating: 4.7, rating_count: 28, sold_count: 95, is_new: true },
  'cat-part-5': { image: 'air-filter', part_type: 'filter', rating: 4.8, rating_count: 44, sold_count: 180 },
  'cat-part-6': { image: 'spark-plug', part_type: 'busi', rating: 5.0, rating_count: 63, sold_count: 240, is_new: true },
  'cat-jasa-1': { image: 'service-cvt', original_price: 65000, rating: 4.9, rating_count: 321, sold_count: 1580 },
  'cat-jasa-2': { image: 'service-oil', rating: 4.9, rating_count: 412, sold_count: 2100 },
  'cat-ws2-1': { image: 'oil-blue', rating: 4.6, rating_count: 22, sold_count: 75 }
};

const TIRE_ITEMS = [
  {
    id: 'cat-ban-1',
    workshop_id: 'ws-1',
    name: 'IRC NR76 Tubeless 90/90-14 (Belakang)',
    category: 'sparepart',
    part_type: 'ban',
    brand: 'IRC',
    specs: 'Ban OEM bawaan pabrik Honda Vario & Beat, compound harian awet, tubeless anti bocor halus',
    grade: 'original',
    compatible_models: ['Vario 150', 'Beat Street'],
    price: 265000,
    original_price: 289000,
    install_fee: 15000,
    stock: 8,
    min_stock: 3,
    warranty_days: 60,
    warranty_km: 5000,
    image: 'tire-touring',
    rating: 4.8,
    rating_count: 132,
    sold_count: 540
  },
  {
    id: 'cat-ban-2',
    workshop_id: 'ws-1',
    name: 'Michelin Pilot Street 2 TL 90/90-14',
    category: 'sparepart',
    part_type: 'ban',
    brand: 'Michelin',
    specs: 'Compound dual-zone, cengkeraman jalan basah & kering, umur pakai hingga 20.000 km',
    grade: 'aftermarket',
    compatible_models: ['Vario 150', 'Beat Street'],
    price: 425000,
    original_price: 455000,
    install_fee: 15000,
    stock: 6,
    min_stock: 2,
    warranty_days: 90,
    warranty_km: 8000,
    image: 'tire-sport',
    rating: 4.9,
    rating_count: 88,
    sold_count: 310
  },
  {
    id: 'cat-ban-3',
    workshop_id: 'ws-1',
    name: 'FDR Sport Zevo TL 110/70-13 (Depan)',
    category: 'sparepart',
    part_type: 'ban',
    brand: 'FDR',
    specs: 'Pola alur sporty untuk NMAX, stabil di tikungan & kecepatan tinggi, tubeless',
    grade: 'aftermarket',
    compatible_models: ['NMAX 155'],
    price: 335000,
    install_fee: 15000,
    stock: 5,
    min_stock: 2,
    warranty_days: 60,
    warranty_km: 6000,
    image: 'tire-scooter',
    rating: 4.7,
    rating_count: 64,
    sold_count: 205,
    is_new: true
  },
  {
    id: 'cat-ban-4',
    workshop_id: 'ws-1',
    name: 'Pirelli Diablo Rosso Scooter 130/70-13',
    category: 'sparepart',
    part_type: 'ban',
    brand: 'Pirelli',
    specs: 'Ban belakang premium NMAX, compound balap untuk grip maksimal, profil lebar stabil',
    grade: 'aftermarket',
    compatible_models: ['NMAX 155'],
    price: 589000,
    original_price: 625000,
    install_fee: 15000,
    stock: 2,
    min_stock: 2,
    warranty_days: 90,
    warranty_km: 8000,
    image: 'tire-sport',
    rating: 5.0,
    rating_count: 29,
    sold_count: 96,
    is_new: true
  }
];

const JPG_ASSETS = new Set(['oil-red', 'tire-sport']);

function productImagePath(name) {
  if (!name) return null;
  const ext = JPG_ASSETS.has(name) ? 'jpg' : 'svg';
  return `./assets/products/${name}.${ext}`;
}

export function createSeedData() {
  const data = baseSeed();
  data.parts_catalog = data.parts_catalog.map((item) => {
    const meta = STORE_META[item.id] || {};
    return { ...item, ...meta, image: productImagePath(meta.image) };
  });
  const tires = TIRE_ITEMS.map((t) => ({ ...t, image: productImagePath(t.image) }));
  // Insert tires right after the oils so the catalog reads naturally.
  const firstPartIdx = data.parts_catalog.findIndex((p) => p.category === 'sparepart');
  data.parts_catalog.splice(firstPartIdx === -1 ? data.parts_catalog.length : firstPartIdx, 0, ...tires);
  return data;
}

function baseSeed() {
  return {
    schema_version: '1.0.0',
    seeded_at: new Date().toISOString(),
    users: [
      {
        id: 'usr-cust-1',
        name: 'Raka Pratama',
        phone_number: '081234567890',
        email: 'raka.pratama@email.id',
        role: 'customer',
        password_hash: 'demo_hash_customer_1',
        created_at: daysOffset(-180)
      },
      {
        id: 'usr-cust-2',
        name: 'Budi Santoso (Ojol)',
        phone_number: '085699887766',
        email: 'budi.ojol@email.id',
        role: 'customer',
        password_hash: 'demo_hash_customer_2',
        created_at: daysOffset(-240)
      },
      {
        id: 'usr-bengkel-1',
        name: 'Hendra Wijaya',
        phone_number: '081311223344',
        email: 'kasir@majujayamotor.id',
        role: 'bengkel_admin',
        password_hash: 'demo_hash_bengkel_1',
        created_at: daysOffset(-365)
      },
      {
        id: 'usr-bengkel-2',
        name: 'Dedi Kurniawan',
        phone_number: '081988776655',
        email: 'admin@bintangmotor.id',
        role: 'bengkel_admin',
        password_hash: 'demo_hash_bengkel_2',
        created_at: daysOffset(-300)
      }
    ],

    workshop_profiles: [
      {
        id: 'ws-1',
        user_id: 'usr-bengkel-1',
        workshop_name: 'Bengkel Maju Jaya Motor',
        address: 'Jl. Raya Kemang Selatan No. 48, Jakarta Selatan',
        phone: '6281311223344',
        operating_hours: {
          weekdays: '08:00 - 18:00',
          saturday: '08:00 - 17:00',
          sunday: '09:00 - 15:00'
        },
        is_active: true,
        rating: 4.9,
        distance_km: 1.4,
        loyalty_target_stamps: 5,
        loyalty_reward_title: 'Gratis 1x Ganti Oli + Merch Diservisin',
        loyalty_reward_desc: 'Potongan hingga Rp 65.000 untuk oli matic + gantungan kunci & stiker eksklusif Diservisin.',
        loyalty_reward_value: 65000,
        default_warranty_days: 30,
        default_warranty_km: 2000
      },
      {
        id: 'ws-2',
        user_id: 'usr-bengkel-2',
        workshop_name: 'Bengkel Bintang Motor Mandiri',
        address: 'Jl. Fatmawati Raya No. 112, Jakarta Selatan',
        phone: '6281988776655',
        operating_hours: {
          weekdays: '08:30 - 18:30',
          saturday: '08:30 - 17:30',
          sunday: 'Tutup'
        },
        is_active: true,
        rating: 4.8,
        distance_km: 3.1,
        loyalty_target_stamps: 5,
        loyalty_reward_title: 'Gratis Servis CVT Ringan',
        loyalty_reward_desc: 'Bebas biaya jasa pembersihan CVT (senilai Rp 45.000).',
        loyalty_reward_value: 45000,
        default_warranty_days: 14,
        default_warranty_km: 1500
      }
    ],

    user_vehicles: [
      {
        id: 'veh-1',
        user_id: 'usr-cust-1',
        brand: 'Honda',
        model: 'Vario 150',
        year: 2021,
        license_plate: 'B 4512 KTR',
        last_odometer: 18450,
        last_oil_odometer: 16600,
        last_service_date: daysOffset(-52),
        oil_interval_km: 2000,
        oil_interval_days: 60,
        created_at: daysOffset(-180)
      },
      {
        id: 'veh-2',
        user_id: 'usr-cust-1',
        brand: 'Yamaha',
        model: 'NMAX 155',
        year: 2022,
        license_plate: 'B 6821 VXA',
        last_odometer: 12100,
        last_oil_odometer: 11200,
        last_service_date: daysOffset(-20),
        oil_interval_km: 2500,
        oil_interval_days: 60,
        created_at: daysOffset(-120)
      },
      {
        id: 'veh-3',
        user_id: 'usr-cust-2',
        brand: 'Honda',
        model: 'Beat Street',
        year: 2020,
        license_plate: 'B 3190 UYT',
        last_odometer: 46800,
        last_oil_odometer: 44600,
        last_service_date: daysOffset(-64),
        oil_interval_km: 2000,
        oil_interval_days: 45,
        created_at: daysOffset(-240)
      }
    ],

    parts_catalog: [
      // OLI MESIN (Original vs Aftermarket comparison pair)
      {
        id: 'cat-oli-1',
        workshop_id: 'ws-1',
        name: 'AHM Oil MPX 2 0.8L',
        category: 'oli',
        brand: 'AHM Official',
        specs: 'SAE 10W-30, JASO MB, API SL — Standar pabrikan untuk matic Honda harian',
        grade: 'original',
        compatible_models: ['Vario 150', 'Beat Street', 'Scoopy', 'PCX 160'],
        price: 54000,
        install_fee: 10000,
        stock: 24,
        min_stock: 6,
        warranty_days: 30,
        warranty_km: 2000
      },
      {
        id: 'cat-oli-2',
        workshop_id: 'ws-1',
        name: 'Shell Advance AX7 Scooter 0.8L',
        category: 'oli',
        brand: 'Shell',
        specs: 'SAE 10W-30 Synthetic Blend, JASO MB — Tarikan lebih halus & tahan panas macet',
        grade: 'aftermarket',
        compatible_models: ['Vario 150', 'NMAX 155', 'Beat Street', 'Aerox 155'],
        price: 62000,
        install_fee: 10000,
        stock: 18,
        min_stock: 6,
        warranty_days: 45,
        warranty_km: 2500
      },
      {
        id: 'cat-oli-3',
        workshop_id: 'ws-1',
        name: 'Yamalube Power Matic 0.8L',
        category: 'oli',
        brand: 'Yamaha Genuine',
        specs: 'SAE 10W-40, JASO MB, Semi-Synthetic — Resmi pabrikan untuk matic Yamaha',
        grade: 'original',
        compatible_models: ['NMAX 155', 'Aerox 155', 'Lexi'],
        price: 58000,
        install_fee: 10000,
        stock: 14,
        min_stock: 5,
        warranty_days: 30,
        warranty_km: 2500
      },
      {
        id: 'cat-oli-4',
        workshop_id: 'ws-1',
        name: 'Motul Scooter LE 10W-30 0.8L',
        category: 'oli',
        brand: 'Motul',
        specs: 'Low Emission HC-Tech, JASO MB — Proteksi ekstra untuk jarak tempuh tinggi / ojol',
        grade: 'aftermarket',
        compatible_models: ['Vario 150', 'NMAX 155', 'Beat Street', 'PCX 160'],
        price: 78000,
        install_fee: 10000,
        stock: 4,
        min_stock: 5,
        warranty_days: 60,
        warranty_km: 3000
      },
      // KAMPAS REM (Original vs Aftermarket comparison pair)
      {
        id: 'cat-part-1',
        workshop_id: 'ws-1',
        name: 'Kampas Rem Depan AHM (06455-KVB)',
        category: 'sparepart',
        brand: 'Honda Genuine Parts',
        specs: 'Non-Asbestos OEM, daya cengkeram presisi, minim bunyi & awet piringan cakram',
        grade: 'original',
        compatible_models: ['Vario 150', 'Beat Street', 'Scoopy'],
        price: 68000,
        install_fee: 15000,
        stock: 11,
        min_stock: 4,
        warranty_days: 30,
        warranty_km: 2000
      },
      {
        id: 'cat-part-2',
        workshop_id: 'ws-1',
        name: 'Kampas Rem Depan Bendix General CT',
        category: 'sparepart',
        brand: 'Bendix',
        specs: 'Ceramic Technology, pakem di kondisi hujan & suhu tinggi, ekonomis untuk harian',
        grade: 'aftermarket',
        compatible_models: ['Vario 150', 'Beat Street', 'NMAX 155'],
        price: 52000,
        install_fee: 15000,
        stock: 15,
        min_stock: 5,
        warranty_days: 21,
        warranty_km: 1500
      },
      // V-BELT (Original vs Aftermarket comparison pair)
      {
        id: 'cat-part-3',
        workshop_id: 'ws-1',
        name: 'V-Belt + Roller Kit AHM Vario 150',
        category: 'sparepart',
        brand: 'Honda Genuine Parts',
        specs: 'Kode Part 23100-K36-BA0, karet EPDM ori tahan retak hingga 24.000 km',
        grade: 'original',
        compatible_models: ['Vario 150'],
        price: 185000,
        install_fee: 35000,
        stock: 3,
        min_stock: 4,
        warranty_days: 60,
        warranty_km: 5000
      },
      {
        id: 'cat-part-4',
        workshop_id: 'ws-1',
        name: 'V-Belt Daytona Ultra Drive',
        category: 'sparepart',
        brand: 'Daytona',
        specs: 'Compound Kevlar Aramid, 20% lebih tahan panas & tarikan bawah lebih responsif',
        grade: 'aftermarket',
        compatible_models: ['Vario 150', 'NMAX 155', 'Beat Street'],
        price: 145000,
        install_fee: 35000,
        stock: 8,
        min_stock: 3,
        warranty_days: 45,
        warranty_km: 4000
      },
      // FILTER UDARA & BUSI
      {
        id: 'cat-part-5',
        workshop_id: 'ws-1',
        name: 'Filter Udara AHM Viscous Element',
        category: 'sparepart',
        brand: 'Honda Genuine Parts',
        specs: 'Kertas saring beroli (viscous) menangkap debu halus, irit BBM',
        grade: 'original',
        compatible_models: ['Vario 150', 'Beat Street'],
        price: 55000,
        install_fee: 10000,
        stock: 9,
        min_stock: 4,
        warranty_days: 14,
        warranty_km: 1000
      },
      {
        id: 'cat-part-6',
        workshop_id: 'ws-1',
        name: 'Busi NGK Iridium IX CPR9EAIX-9',
        category: 'sparepart',
        brand: 'NGK',
        specs: 'Elektroda iridium 0.6mm, pembakaran lebih sempurna & starter mudah saat dingin',
        grade: 'aftermarket',
        compatible_models: ['Vario 150', 'NMAX 155', 'Beat Street'],
        price: 98000,
        install_fee: 10000,
        stock: 2,
        min_stock: 4,
        warranty_days: 30,
        warranty_km: 3000
      },
      // JASA SERVIS
      {
        id: 'cat-jasa-1',
        workshop_id: 'ws-1',
        name: 'Servis Ringan + Pembersihan CVT',
        category: 'jasa',
        brand: 'Bengkel Maju Jaya',
        specs: 'Pembersihan ruang CVT, cek rem depan-belakang, cek tekanan ban, injeksi & greasing',
        grade: 'jasa',
        compatible_models: ['Vario 150', 'NMAX 155', 'Beat Street', 'Semua Motor Matic'],
        price: 55000,
        install_fee: 0,
        stock: 999,
        min_stock: 0,
        warranty_days: 14,
        warranty_km: 1000
      },
      {
        id: 'cat-jasa-2',
        workshop_id: 'ws-1',
        name: 'Jasa Ganti Oli & Cek Ringan',
        category: 'jasa',
        brand: 'Bengkel Maju Jaya',
        specs: 'Kuras oli mesin + semprot filter CVT + cek tekanan angin ban gratis',
        grade: 'jasa',
        compatible_models: ['Vario 150', 'NMAX 155', 'Beat Street', 'Semua Motor Matic'],
        price: 15000,
        install_fee: 0,
        stock: 999,
        min_stock: 0,
        warranty_days: 7,
        warranty_km: 500
      },
      // Catalog for Workshop 2 (isolation proof)
      {
        id: 'cat-ws2-1',
        workshop_id: 'ws-2',
        name: 'Federal Matic 30 10W-30 0.8L',
        category: 'oli',
        brand: 'Federal Oil',
        specs: 'Active Moly formula untuk matic Honda & Yamaha',
        grade: 'aftermarket',
        compatible_models: ['Vario 150', 'Beat Street', 'NMAX 155'],
        price: 52000,
        install_fee: 10000,
        stock: 16,
        min_stock: 5,
        warranty_days: 14,
        warranty_km: 1500
      }
    ],

    saved_estimates: [
      {
        id: 'est-1',
        user_id: 'usr-cust-1',
        vehicle_id: 'veh-1',
        workshop_id: 'ws-1',
        items: [
          { catalog_id: 'cat-oli-2', name: 'Shell Advance AX7 Scooter 0.8L', quantity: 1, price: 62000, install_fee: 10000 },
          { catalog_id: 'cat-part-1', name: 'Kampas Rem Depan AHM (06455-KVB)', quantity: 1, price: 68000, install_fee: 15000 }
        ],
        total_amount: 155000,
        status: 'saved',
        created_at: daysOffset(-1)
      }
    ],

    transactions: [
      {
        id: 'trx-1001',
        workshop_id: 'ws-1',
        customer_user_id: 'usr-cust-1',
        vehicle_id: 'veh-1',
        transaction_number: 'DSV-202611-0041',
        odometer_at_service: 17900,
        discount_amount: 0,
        reward_code_used: null,
        total_amount: 137000,
        payment_method: 'QRIS Bengkel',
        payment_status: 'paid',
        notes: 'Rem depan baru, rem belakang masih tebal 60%.',
        created_at: daysOffset(-10),
        synced: true
      },
      {
        id: 'trx-1002',
        workshop_id: 'ws-1',
        customer_user_id: 'usr-cust-1',
        vehicle_id: 'veh-1',
        transaction_number: 'DSV-202609-0018',
        odometer_at_service: 16600,
        discount_amount: 0,
        reward_code_used: null,
        total_amount: 119000,
        payment_method: 'Tunai',
        payment_status: 'paid',
        notes: 'Ganti oli rutin + servis ringan CVT.',
        created_at: daysOffset(-52),
        synced: true
      },
      {
        id: 'trx-1003',
        workshop_id: 'ws-1',
        customer_user_id: 'usr-cust-2',
        vehicle_id: 'veh-3',
        transaction_number: 'DSV-202611-0055',
        odometer_at_service: 46800,
        discount_amount: 0,
        reward_code_used: null,
        total_amount: 72000,
        payment_method: 'Tunai',
        payment_status: 'paid',
        notes: 'Transaksi hari ini — Ganti oli harian ojol.',
        created_at: daysOffset(0),
        synced: true
      }
    ],

    transaction_items: [
      {
        id: 'ti-1',
        transaction_id: 'trx-1001',
        catalog_id: 'cat-part-1',
        name_snapshot: 'Kampas Rem Depan AHM (06455-KVB)',
        category_snapshot: 'sparepart',
        grade_snapshot: 'original',
        quantity: 1,
        price_at_transaction: 83000,
        subtotal: 83000
      },
      {
        id: 'ti-2',
        transaction_id: 'trx-1001',
        catalog_id: 'cat-oli-1',
        name_snapshot: 'AHM Oil MPX 2 0.8L',
        category_snapshot: 'oli',
        grade_snapshot: 'original',
        quantity: 1,
        price_at_transaction: 54000,
        subtotal: 54000
      },
      {
        id: 'ti-3',
        transaction_id: 'trx-1002',
        catalog_id: 'cat-oli-2',
        name_snapshot: 'Shell Advance AX7 Scooter 0.8L',
        category_snapshot: 'oli',
        grade_snapshot: 'aftermarket',
        quantity: 1,
        price_at_transaction: 64000,
        subtotal: 64000
      },
      {
        id: 'ti-4',
        transaction_id: 'trx-1002',
        catalog_id: 'cat-jasa-1',
        name_snapshot: 'Servis Ringan + Pembersihan CVT',
        category_snapshot: 'jasa',
        grade_snapshot: 'jasa',
        quantity: 1,
        price_at_transaction: 55000,
        subtotal: 55000
      },
      {
        id: 'ti-5',
        transaction_id: 'trx-1003',
        catalog_id: 'cat-oli-2',
        name_snapshot: 'Shell Advance AX7 Scooter 0.8L',
        category_snapshot: 'oli',
        grade_snapshot: 'aftermarket',
        quantity: 1,
        price_at_transaction: 72000,
        subtotal: 72000
      }
    ],

    digital_warranties: [
      {
        id: 'wrn-1',
        transaction_id: 'trx-1001',
        item_id: 'ti-1',
        user_id: 'usr-cust-1',
        workshop_id: 'ws-1',
        vehicle_id: 'veh-1',
        item_name: 'Kampas Rem Depan AHM (06455-KVB)',
        claim_code: 'WRN-2026-8841',
        start_date: daysOffset(-10),
        end_date: daysOffset(20),
        start_odometer: 17900,
        end_odometer: 19900,
        status: 'active',
        claimed_at: null,
        terms: 'Garansi cacat produksi atau bunyi abnormal dari pemasangan. Berlaku selama maksimal 30 hari atau 2.000 km (mana yang tercapai lebih dulu). Klaim 1x di Bengkel Maju Jaya Motor.'
      },
      {
        id: 'wrn-2',
        transaction_id: 'trx-1001',
        item_id: 'ti-2',
        user_id: 'usr-cust-1',
        workshop_id: 'ws-1',
        vehicle_id: 'veh-1',
        item_name: 'AHM Oil MPX 2 0.8L',
        claim_code: 'WRN-2026-8842',
        start_date: daysOffset(-10),
        end_date: daysOffset(20),
        start_odometer: 17900,
        end_odometer: 19900,
        status: 'active',
        claimed_at: null,
        terms: 'Jaminan 100% oli asli resmi distributor + garansi baut pembuangan oli tidak rembes selama 30 hari / 2.000 km.'
      },
      {
        id: 'wrn-3',
        transaction_id: 'trx-1002',
        item_id: 'ti-4',
        user_id: 'usr-cust-1',
        workshop_id: 'ws-1',
        vehicle_id: 'veh-1',
        item_name: 'Servis Ringan + Pembersihan CVT',
        claim_code: 'WRN-2026-7102',
        start_date: daysOffset(-52),
        end_date: daysOffset(-38),
        start_odometer: 16600,
        end_odometer: 17600,
        status: 'expired',
        claimed_at: null,
        terms: 'Garansi penyetelan ulang gratis jika motor brebet atau CVT bergetar dalam 14 hari / 1.000 km setelah servis.'
      }
    ],

    stamps: [
      { id: 'stp-1', user_id: 'usr-cust-1', workshop_id: 'ws-1', transaction_id: 'trx-prev-1', activity_type: 'ganti_oli', count_added: 1, created_at: daysOffset(-140) },
      { id: 'stp-2', user_id: 'usr-cust-1', workshop_id: 'ws-1', transaction_id: 'trx-prev-2', activity_type: 'ganti_oli', count_added: 1, created_at: daysOffset(-98) },
      { id: 'stp-3', user_id: 'usr-cust-1', workshop_id: 'ws-1', transaction_id: 'trx-1002', activity_type: 'ganti_oli', count_added: 1, created_at: daysOffset(-52) },
      { id: 'stp-4', user_id: 'usr-cust-1', workshop_id: 'ws-1', transaction_id: 'trx-1001', activity_type: 'ganti_oli', count_added: 1, created_at: daysOffset(-10) },
      { id: 'stp-5', user_id: 'usr-cust-2', workshop_id: 'ws-1', transaction_id: 'trx-1003', activity_type: 'ganti_oli', count_added: 1, created_at: daysOffset(0) }
    ],

    claimed_rewards: [
      {
        id: 'rwd-1',
        user_id: 'usr-cust-1',
        workshop_id: 'ws-1',
        reward_type: 'gratis_oli_merch',
        reward_title: 'Gratis 1x Ganti Oli + Merch Diservisin',
        reward_code: 'RWD-2026-5001',
        discount_value: 65000,
        claimed_at: daysOffset(-5),
        status: 'pending',
        redeemed_at: null,
        redeemed_transaction_id: null
      }
    ]
  };
}
