---
title: "Diservisin"
platform: "Mobile App"
status: "Draft"
version: "v1.0"
author: "Markojan13"
target_launch: "Q4 2026"
language: "id"
generated_with: "Get PRD by Markojan13"
updated_at: "2026-11-21"
---

> **Konteks AI Coding:** Gunakan dokumen PRD ini sebagai acuan utama implementasi. Prioritaskan seluruh fitur `P0` (MVP), ikuti Tech Stack, Model Data, serta kontrak API yang tertera, dan patuhi batasan Out of Scope.

# 📱 Diservisin

> Aplikasi pemesanan kopi tanpa antre (pick-up & delivery) lengkap dengan sistem poin loyalitas otomatis untuk kedai kopi lokal.

| Properti | Nilai |
| --- | --- |
| **Platform** | Mobile App |
| **Status** | `Draft` |
| **Versi** | `v1.0` |
| **Author / PM** | Markojan13 |
| **Target Rilis** | Q4 2026 |

## 1. Ringkasan Eksekutif & Tujuan

### Masalah Utama (Problem Statement)
> Banyak pemilik motor masih awam soal jenis, kualitas, dan harga wajar suku cadang maupun pelumas, yang bikin mereka sering waswas kena harga kemahalan atau dapat barang nggak sesuai spek, ditambah lagi bukti nota fisik yang gampang hilang bikin riwayat servis dan klaim garansi jadi ribet. Di sisi lain, kebanyakan bengkel juga masih mengandalkan pencatatan manual pakai buku tulis atau nota kertas yang datanya rawan berantakan, bikin mereka kesusahan melacak riwayat kunjungan buat menjalankan program loyalitas secara akurat maupun menjaga retensi pelanggan lewat pengingat servis rutin.

### Visi & Solusi Produk
Menjadikan Diservisin sebagai ekosistem digital terpercaya yang menjembatani pemilik motor dan bengkel lewat transparansi pilihan, spesifikasi, kualitas, serta harga wajar suku cadang maupun pelumas biar pelanggan bebas dari rasa waswas sebelum motor dikerjakan, sekaligus menggantikan nota kertas yang gampang hilang dengan kartu garansi digital berbasis waktu atau jarak tempuh yang terukur, serta membantu bengkel beralih dari pencatatan manual ke sistem terpusat yang otomatis melacak riwayat servis, mengirim pengingat perawatan rutin, dan menghitung progres klaim hadiah loyalitas secara akurat demi hubungan jangka panjang yang menguntungkan kedua belah pihak.

### Metrik Keberhasilan (KPI)
| Metrik | Target | Cara Pengukuran |
| --- | --- | --- |
| Adopsi Katalog & Cek Harga | **≥ 70%** | Jumlah pelanggan yang membuka detail spesifikasi atau estimasi harga produk sebelum servis dibagi total pelanggan yang bertransaksi, dikali 100%. |
| Digitalisasi Transaksi & Garansi | **≥ 85%** | Jumlah transaksi bengkel yang tercatat di sistem dan menerbitkan kartu garansi digital dibagi total transaksi harian bengkel mitra, dikali 100%. |
| Akurasi & Kelancaran Klaim Garansi | **≥ 95%** | Jumlah pengajuan klaim garansi digital yang berhasil diverifikasi dan disetujui tanpa sengketa data dibagi total pengajuan klaim, dikali 100%. |
| Retensi Pelanggan Servis Berkala | **≥ 60%** | Jumlah pelanggan yang kembali melakukan servis atau ganti oli di bengkel yang sama dalam 3 bulan dibagi total pelanggan baru pada periode sebelumnya, dikali 100%. |
| Konversi Pengingat Servis Rutin | **≥ 40%** | Jumlah pelanggan yang melakukan transaksi maksimal 14 hari setelah menerima pengingat jadwal servis dibagi total notifikasi pengingat yang terkirim, dikali 100%. |
| Tingkat Klaim Reward Loyalitas | **≥ 75%** | Jumlah hadiah atau layanan gratis yang berhasil diklaim pelanggan dibagi total pelanggan yang sudah mencapai syarat kunjungan atau poin loyalitas, dikali 100%. |
| Keaktifan Bengkel Mitra | **≥ 80%** | Jumlah bengkel yang rutin mencatat transaksi minimal 4 hari dalam seminggu dibagi total bengkel mitra yang terdaftar di sistem, dikali 100%. |

## 2. Target Pengguna & Persona

### 1. Pengguna Motor Harian / Awam Teknis
- **Role / Profil:** Karyawan kantoran atau mahasiswa usia 22–35 tahun yang pakai motor matic tiap hari buat mobilitas kerja atau kuliah. Nggak terlalu paham soal istilah teknis mesin, jenis-jenis oli, atau perbedaan suku cadang ori dan KW.
- **Pain Points:** - Sering ragu dan waswas tiap ke bengkel karena takut dikasih harga kemahalan atau disuruh ganti komponen yang sebenarnya masih aman.
- Bingung milih merek pelumas atau suku cadang yang pas sama spek motor dan bujetnya.
- Nota servis kertas sering hilang atau kebuang, jadi susah nginget kapan terakhir ganti oli dan nggak punya bukti kalau mau komplain hasil servis.
- **Kebutuhan & Tujuan:** - Pengen tahu estimasi harga, spesifikasi, dan perbandingan kualitas suku cadang secara transparan sebelum motor mulai dibongkar.
- Butuh catatan riwayat servis dan kartu garansi digital yang otomatis tersimpan di HP biar aman dan gampang diklaim kalau ada kendala.

### 2. Pengguna Motor Intensitas Tinggi / Value Seeker
- **Role / Profil:** Pengemudi ojek online, kurir logistik, atau pekerja lapangan usia 25–45 tahun yang jarak tempuh motornya tinggi banget tiap minggu. Rutin ganti oli sebulan sekali dan cukup sering ganti komponen fast-moving kayak kampas rem atau v-belt.
- **Pain Points:** - Pengeluaran perawatan motor cukup besar tiap bulan, tapi jarang dapat apresiasi atau keuntungan lebih meski sudah langganan di satu bengkel.
- Pernah dapat suku cadang yang kualitasnya kurang awet karena nggak ada informasi jelas soal pilihan grade produk sebelum beli.
- Sering lupa jadwal servis rutin karena saking sibuknya di jalan, yang ujung-ujungnya bikin komponen lain ikut rusak.
- **Kebutuhan & Tujuan:** - Pengen sistem poin atau reward loyalitas yang jelas dan pasti tercatat (misalnya gratis ganti oli tiap 5 kali transaksi) buat nekan biaya operasional bulanan.
- Butuh pengingat otomatis jadwal ganti oli atau servis berkala sekaligus jaminan garansi produk yang terukur.

### 3. Pemilik / Kepala Mekanik Bengkel Mandiri
- **Role / Profil:** Pemilik bengkel motor umum independen skala kecil hingga menengah (punya 2–5 mekanik) usia 30–50 tahun. Mengelola operasional harian, stok suku cadang, sekaligus transaksi kasir secara langsung.
- **Pain Points:** - Masih mengandalkan buku tulis dan nota kertas buat nyatet transaksi dan stok, yang bikin data gampang nyelip, susah direkap, dan rawan selisih.
- Pengen bikin program promo pelanggan setia (kayak kartu stempel ganti oli), tapi sering ribet ngitungnya dan rawan diakalin kalau cuma pakai kartu fisik.
- Susah bikin pelanggan baru balik lagi karena nggak punya database kontak dan jadwal pengingat servis buat nge-follow up mereka.
- **Kebutuhan & Tujuan:** - Butuh sistem pencatatan transaksi digital yang simpel, cepat dipakai mekanik atau kasir, dan otomatis nyambung ke akun pelanggan.
- Pengen tingkat retensi pelanggan naik lewat sistem loyalitas otomatis dan pengingat servis, sekaligus ngebangun kepercayaan pelanggan lewat katalog harga dan garansi digital yang profesional.

## 3. Ruang Lingkup & Fitur Utama (MVP)

### Daftar Fitur & Acceptance Criteria
| Fitur | Deskripsi & Acceptance Criteria | Prioritas | Fase |
| --- | --- | --- | --- |
| **Manajemen Akun & Profil Motor** | Pendaftaran akun untuk pemilik motor dan mitra bengkel.<br>AC: Customer bisa mendaftarkan lebih dari 1 motor (merek, tipe, tahun, pelat nomor, odometer terakhir); bengkel bisa mengatur profil, alamat, dan jam operasional.<br> | `P0` | MVP |
| **Katalog Sparepart, Pelumas & Estimasi Biaya** | Daftar suku cadang dan pelumas lengkap dengan spesifikasi, tingkat kualitas, dan harga.<br>AC: Customer bisa memfilter produk sesuai tipe motornya, melihat perbandingan kualitas (ori/aftermarket) beserta estimasi biaya jasa pasang sebelum datang ke bengkel. | `P0` | MVP |
| **Program Loyalitas & Klaim Reward** | Pelacakan otomatis jumlah kunjungan atau ganti oli untuk ditukar hadiah.<br>AC: Bengkel bisa mengatur aturan reward (misal: 5x ganti oli gratis 1x oli + merch); progres stamp customer bertambah otomatis tiap transaksi valid dan bisa diklaim di bengkel saat penuh. | `P0` | MVP |
| **Pengingat Jadwal Servis Rutin** | Notifikasi otomatis berdasarkan tanggal servis terakhir atau estimasi kilometer.<br>AC: Sistem mengirim pengingat via notifikasi aplikasi atau tombol pengingat WhatsApp dari dashboard bengkel saat mendekati jadwal ganti oli berikutnya.<br> | `P1` | MVP |
| **Manajemen Stok Dasar Bengkel** | Pemantauan sisa stok sparepart dan pelumas yang terdaftar di katalog bengkel.<br>AC: Stok otomatis berkurang saat transaksi dicatat di kasir digital dan muncul tanda peringatan jika stok di bawah batas minimum. | `P1` | Phase 2 |

### Out of Scope (Di Luar Lingkup MVP)
- [ ] Integrasi Payment Gateway: Pembayaran transaksi belum diproses di dalam aplikasi; pelunasan tetap dilakukan langsung di bengkel (tunai, transfer, atau QRIS milik bengkel) lalu dicatat status lunasnya oleh kasir.
- [ ] Sistem Booking Slot & Antrean Real-Time: Belum mencakup penjadwalan jam kedatangan per mekanik atau per stall servis.
- [ ] Akuntansi & Laporan Keuangan Kompleks: Fitur bengkel dibatasi pada rekap omzet harian dan riwayat transaksi, belum mencakup perhitungan pajak, neraca laba rugi, maupun penggajian komisi mekanik.

## 4. Alur Pengguna & Daftar Layar

### Alur Pengguna Utama
#### Cek Katalog Sparepart & Estimasi Biaya (Customer)
Buka halaman Beranda dan pilih profil motor yang mau dicek (misal: Honda Vario 150).
Masuk ke menu Katalog lalu pilih kategori komponen (pelumas, kampas rem, v-belt, dll).
Filter dan bandingkan pilihan produk berdasarkan tingkat kualitas (ori atau aftermarket), spesifikasi teknis, serta harga transparan.
Pilih komponen yang diinginkan untuk melihat rincian estimasi total biaya (harga barang + estimasi jasa pasang).
Simpan rincian estimasi sebagai referensi saat datang ke bengkel mitra.

- **Edge Cases:** Tampilkan data katalog terakhir yang tersimpan di cache aplikasi beserta tombol muat ulang.

#### Pencatatan Servis, Penerbitan Garansi & Update Loyalitas (Admin Bengkel)
Admin bengkel buka halaman Kasir (POS) setelah pengerjaan motor selesai.
Cari data customer menggunakan nomor pelat kendaraan atau nomor HP terdaftar.
Input item sparepart, pelumas, dan biaya jasa yang digunakan (atau tarik dari daftar estimasi yang sudah disimpan customer).
Konfirmasi pelunasan pembayaran di tempat dan klik tombol Terbitkan Nota & Garansi.
Sistem otomatis mengirimkan nota digital, mengaktifkan kartu garansi item terkait, dan menambahkan 1 progres stempel loyalitas ke akun customer.

- **Edge Cases:** Data disimpan sementara di penyimpanan lokal perangkat (offline queue) dan otomatis tersinkronisasi begitu jaringan kembali normal.

#### Klaim Reward Loyalitas & Garansi Digital (Customer & Bengkel)
Customer buka halaman Garansi & Loyalitas, lalu pilih kartu garansi aktif atau voucher reward yang progresnya sudah penuh (misal: 5/5 ganti oli).
Klik tombol Gunakan / Klaim di Bengkel untuk memunculkan kode QR dan kode unik transaksi.
Tunjukkan kode tersebut ke kasir bengkel mitra saat transaksi berlangsung.
Admin bengkel memindai kode QR atau memasukkan kode unik di dashboard kasir untuk memvalidasi masa berlaku garansi/syarat klaim.
Setelah terverifikasi valid, kasir memotong tagihan (gratis oli/jasa garansi) dan status voucher/garansi berubah menjadi Sudah Diklaim.

- **Edge Cases:** tombol klaim otomatis terkunci dan menampilkan alasan kedaluwarsa secara transparan.

### Daftar Halaman / Layar
| Route / Screen | Tujuan | Komponen Utama |
| --- | --- | --- |
| `/login` | Autentikasi dan pemisahan peran akun antara pemilik motor dan mitra bengkel. | Form input nomor HP/email, verifikasi OTP, tombol pilih peran (Customer / Mitra Bengkel). |
| `/home` | Pusat informasi cepat untuk customer memantau kondisi motor dan promo bengkel. | Kartu ringkasan motor aktif, pengingat jadwal ganti oli berikutnya, pintasan katalog, banner progres loyalitas. |
| `/garage` | Mengelola daftar motor milik customer beserta data odometer terakhir. | Daftar kartu motor, form tambah/edit kendaraan (merek, tipe, tahun, pelat nomor), input update kilometer. |
| `/catalog` | Memberikan transparansi spesifikasi, kualitas, dan harga sparepart sebelum servis. | Filter tipe motor & kategori part, kartu perbandingan produk (Ori vs Aftermarket), kalkulator estimasi biaya. |
| `/history` | Menyimpan seluruh bukti transaksi digital dan kartu garansi anti-hilang. | Daftar riwayat servis kronologis, rincian nota digital, kartu garansi aktif dengan indikator sisa waktu/km. |
| `/loyalty` | Memantau progres pengumpulan stempel kunjungan dan menukar hadiah dari bengkel. | Kartu stempel digital (misal: 3/5 ganti oli), daftar katalog hadiah/merch, tombol generate QR klaim. |
| `/pos` | Layar kasir utama bengkel untuk mencatat transaksi dengan cepat dan akurat. | Pencarian pelat nomor customer, pemilih item sparepart & jasa, ringkasan tagihan, tombol terbitkan nota & scan klaim QR. |
| `/workshop/settings` | Mengatur operasional bengkel, daftar harga barang, serta aturan garansi dan loyalitas. | Form manajemen katalog & harga bengkel, pengaturan syarat garansi (hari/km), pengaturan target stempel hadiah loyalitas. |

## 5. Spesifikasi Desain & UI/UX

### Palet Warna
| Token | Hex |
| --- | --- |
| Primary Blue | `#004FE0` |
| Accent Orange | `#FF6800` |
| Carbon Slate | `#0D172B` |
| Steel Gray | `#60758D` |
| Background | `#F8FAFC` |
| Surface Card | `#F9FDFF` |
| Success | `#00BC7C` |
| Warning | `#FF9900` |
| Danger | `#FF2B3A` |

- **Gaya Visual:** Plus Jakarta Sans (Heading, Nama Bengkel & Judul Fitur) + Inter (Deskripsi Teknis, Syarat Garansi & Angka Harga dengan tabular numerals agar jajaran nominal biaya selalu sejajar rapi).
- **Tipografi:** Plus Jakarta Sans + Inter
- **Responsivitas:** Pendekatan Mobile-first (360px–480px) yang ringkas dan nyaman dioperasikan satu tangan untuk aplikasi Customer, dipadukan dengan tampilan Tablet & Desktop Workspace (768px–1440px) berformat dua kolom agar layar kasir POS dan rekap data bengkel lebih luas serta cepat dioperasikan.

## 6. Model Data & API Endpoints

### Model Data / Entitas
| Entitas | Fields | Relasi |
| --- | --- | --- |
| `users` | `id (PK), name, phone_number, email, role (customer/bengkel_admin), password_hash, created_at` | 1:N user_vehicles, 1:N stamps, 1:N claimed_rewards |
| `workshop_profiles` | `id (PK), user_id (FK to users), workshop_name, address, phone, operating_hours (JSON), is_active` | 1:1 users, 1:N parts_catalog, 1:N transactions |
| `user_vehicles` | `id (PK), user_id (FK to users), brand, model, year, license_plate, last_odometer, created_at` | N:1 users, 1:N transactions |
| `parts_catalog` | `id (PK), workshop_id (FK), name, category (oli/sparepart/jasa), brand, specs, grade (original/aftermarket), price, stock, warranty_days, warranty_km` | N:1 workshop_profiles, 1:N transaction_items |
| `transactions` | `id (PK), workshop_id (FK), customer_user_id (FK, nullable), vehicle_id (FK, nullable), transaction_number, total_amount, payment_status (unpaid/paid), created_at` | N:1 workshop_profiles, N:1 users, N:1 user_vehicles, 1:N transaction_items, 1:N digital_warranties, 1:N stamps |
| `transaction_items` | `id (PK), transaction_id (FK), catalog_id (FK), quantity, price_at_transaction, subtotal` | N:1 transactions, N:1 parts_catalog |
| `digital_warranties` | `id (PK), transaction_id (FK), item_id (FK to transaction_items), start_date, end_date, start_odometer, end_odometer, status (active/expired/claimed), terms` | N:1 transactions, N:1 transaction_items |
| `stamps` | `id (PK), user_id (FK), transaction_id (FK), activity_type (e.g., ganti_oli), count_added, created_at` | N:1 users, N:1 transactions |
| `claimed_rewards` | `id (PK), user_id (FK), reward_type, claimed_at, status (pending/redeemed), redeemed_at` | N:1 users |

### API Endpoints
| Method | Endpoint | Deskripsi | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Mendaftarkan pengguna baru (customer atau admin bengkel). | None |
| `POST` | `/api/v1/auth/login` | Autentikasi pengguna untuk mendapatkan token JWT. | None |
| `GET` | `/api/v1/vehicles` | Mendapatkan daftar motor yang terdaftar milik pengguna/customer saat ini. | Bearer Token |
| `POST` | `/api/v1/vehicles` | Menambahkan data motor baru ke garasi virtual milik customer. | Bearer Token |
| `GET` | `/api/v1/workshops` | Mendapatkan daftar atau pencarian bengkel mitra terdekat beserta katalognya. | Bearer Token |
| `GET` | `/api/v1/catalog` | Memfilter dan melihat daftar sparepart/pelumas berdasarkan tipe motor/kategori. | Bearer Token |
| `POST` | `/api/v1/transactions` | Membuat dan mencatat transaksi servis baru (digunakan oleh admin bengkel). | Bearer Token (Admin) |
| `GET` | `/api/v1/transactions/history` | Mendapatkan riwayat servis/transaksi (customer melihat milik sendiri, bengkel melihat seluruh transaksinya). | Bearer Token |
| `GET` | `/api/v1/warranties` | Melihat daftar kartu garansi digital yang aktif milik customer saat ini. | Bearer Token |
| `POST` | `/api/v1/warranties/:id/claim` | Mengajukan atau memverifikasi klaim garansi digital tertentu di bengkel. | Bearer Token (Admin) |
| `GET` | `/api/v1/loyalty/stamps` | Mengecek jumlah stamp atau progres program loyalitas customer. | Bearer Token |
| `POST` | `/api/v1/loyalty/rewards/redeem` | Menukarkan stamp yang sudah penuh dengan reward/hadiah yang tersedia. | Bearer Token |

## 7. Arsitektur Teknis & Tech Stack

| Layer | Pilihan Teknologi |
| --- | --- |
| **Frontend** | Next.js (React) + Tailwind CSS + Lucide Icons (PWA Mobile-First) |
| **Backend** | Client-Side State & Mock API Service (Tanpa server terpisah) |
| **Database** | Browser localStorage (Fase Dummy Lokal) + Opsi Supabase Free Tier (Jika butuh sinkronisasi antar-HP) |
| **Auth** | Mock Role-Switcher (Simulasi sekali klik antara akun Customer & Kasir Bengkel tanpa biaya SMS OTP) |
| **Infra / Hosting** | Vercel (Hobby Plan - Gratis) + GitHub Repository |
| **Integrations** | WhatsApp Click-to-Chat (wa.me link gratis untuk pengingat servis) & Library QR Code lokal (qrcode.react) |

**Catatan Arsitektur:** Zero-Cost Dummy Architecture: Seluruh data transaksi, katalog sparepart, kartu garansi, dan progres stempel loyalitas disimpan di localStorage browser dengan skema JSON yang sudah siap dipindahkan ke database PostgreSQL/Supabase kapan saja.
Pre-loaded Seed Data: Aplikasi langsung terisi data dummy realistis saat pertama kali dibuka (contoh: profil Honda Vario 150, katalog oli & kampas rem lengkap dengan harga, serta riwayat servis) biar alur aplikasi bisa langsung diuji tanpa input manual dari nol.
Fitur Demo Cepat: Tambahkan tombol Ganti Peran (Customer / Bengkel) di pojok layar dan tombol Reset Data Dummy di pengaturan agar pengujian alur dari kasir bengkel ke aplikasi customer bisa dilakukan dalam satu browser dengan biaya Rp 0.

## 8. Persyaratan Non-Fungsional (NFR)

- [ ] Performa & Kecepatan Akses: Halaman katalog sparepart dan layar kasir (POS) harus terbuka dalam waktu < 1,5 detik bahkan pada koneksi seluler 4G yang tidak stabil di area bengkel.
- [ ] Ketersediaan Offline (Offline-First Resilience): Transaksi kasir dan pengecekan kartu garansi tetap dapat diakses tanpa koneksi internet menggunakan penyimpanan lokal (localStorage / service worker), lalu tersinkronisasi otomatis saat kembali online.
- [ ] Integritas Data Garansi & Loyalitas: Kode unik transaksi dan QR klaim reward hanya dapat digunakan satu kali (single-use validation) untuk mencegah duplikasi klaim hadiah atau pemalsuan masa berlaku garansi.
- [ ] Kontrol Akses Berbasis Peran (RBAC): Pemisahan hak akses yang tegas antara akun Customer (hanya baca katalog, riwayat, dan klaim) dengan Admin Bengkel (kelola harga, catat transaksi, dan verifikasi klaim).
- [ ] Usability & Keterbacaan di Lapangan: Ukuran tombol aksi utama minimal 44x44px agar mudah ditekan oleh mekanik/kasir dengan satu tangan, serta rasio kontras warna minimal 4.5:1 agar tetap jelas terbaca di bawah pencahayaan luar ruangan.
- [ ] Kompatibilitas Perangkat: Berjalan lancar sebagai aplikasi web responsif (PWA) di peramban seluler standar (Chrome Android & Safari iOS) maupun tablet/laptop kasir tanpa perlu instalasi berat.

**Catatan:** Privasi & Minimasi Data Pelanggan: Aplikasi hanya mengumpulkan data yang relevan untuk keperluan servis (nama, nomor WhatsApp, dan data kendaraan/pelat nomor) sesuai prinsip perlindungan data pribadi (UU PDP), tanpa meminta data sensitif seperti NIK atau akses lokasi real-time terus-menerus.
Isolasi Data Antar-Bengkel: Setiap mitra bengkel hanya dapat melihat riwayat transaksi, data pelanggan, dan laporan omzet milik bengkelnya sendiri tanpa bisa mengakses data operasional bengkel mitra lain.
Backup & Ekspor Data Mandiri: Pada fase dummy (localStorage), disediakan fitur Export / Import JSON agar data uji coba tidak hilang saat cache peramban dibersihkan; saat beralih ke database cloud (Supabase), diaktifkan pencadangan otomatis harian.
Kepatuhan Transparansi Garansi: Setiap kartu garansi digital wajib mencantumkan syarat, batas tanggal, dan batas kilometer secara eksplisit sejak nota diterbitkan agar tidak terjadi sengketa konsumen di kemudian hari.

## 9. Timeline, Milestones & Risiko

### Milestones
| Fase | Deliverables | Durasi | Owner |
| --- | --- | --- | --- |
| **Fase 1 — Setup & UI Shell** | Setup struktur proyek Next.js / HTML single-file, penerapan palet warna (#1D4ED8 & #F97316), font Plus Jakarta Sans + Inter, navigasi responsif, dan tombol Role-Switcher (Customer vs Bengkel). | 1,5 Jam | Product Builder + AI Coding |
| **Fase 2 — Fitur Customer (Katalog & Garasi)** | Halaman profil motor, katalog sparepart & pelumas dengan filter kualitas (Ori/Aftermarket) + estimasi biaya, serta penyimpanan state localStorage dengan data dummy awal (seed data). | 2 Jam | Product Builder + AI Coding |
| **Fase 3 — Kasir POS, Garansi & Loyalitas** | Layar kasir bengkel untuk menerbitkan nota digital, pembuatan kartu garansi otomatis (hari/km), sistem stamp loyalitas (misal 3/5 ganti oli), dan simulasi QR/kode klaim reward. | 2,5 Jam | Product Builder + AI Coding |
| **Fase 4 — QA Testing & Deploy Gratis** | Uji coba alur end-to-end (transaksi di kasir langsung masuk ke riwayat, garansi, dan poin customer), tambah tombol Reset Data Dummy, lalu deploy gratis ke Vercel / GitHub Pages. | 1 Jam | Product Builder |

### Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Halusinasi AI / Kode Rusak saat Iterasi Cepat | `High` | Pecah prompt per fitur kecil (jangan minta semua halaman sekaligus) dan lakukan commit / simpan versi setiap kali satu fitur berhasil jalan normal. |
| Scope Creep (Menambah Fitur di Luar MVP) | `Medium` | Kunci ketat batasan Out of Scope: jangan sentuh integrasi payment gateway, OTP SMS, atau database cloud hari ini; fokus 100% di localStorage dulu. |
| Data Dummy Hilang / State Nyangkut saat Tes | `Low` | Wajib buat tombol Reset Data Dummy di menu pengaturan agar skema JSON awal bisa dipulihkan dalam satu klik jika terjadi bug pengujian. |
| Tampilan Kasir Terpotong di Layar HP | `Medium` | Terapkan desain mobile-first dari awal dengan layout kartu vertikal sehingga nyaman dibuka di HP maupun tablet tanpa perlu penyesuaian ulang yang lama. |

---
_Generated with **Get PRD by Markojan13**_