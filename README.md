# Diservisin — Servis Motor Transparan & Garansi Digital

Aplikasi web responsif (*Mobile-First PWA + Tablet/Desktop POS Workspace*) yang dibangun mengacu pada [diservisin-prd.md](./diservisin-prd.md) v1.0.

## Fitur Utama yang Sudah Terimplementasi

### Mode Pemilik Motor (Customer)
- **Beranda (`/home`)**: Ringkasan motor aktif, pengingat otomatis jadwal ganti oli (km & hari), progres stempel loyalitas, pintasan cepat, dan info bengkel mitra.
- **Garasi Saya (`/garage`)**: Multi-motor (tambah/edit/hapus), nomor pelat, dan input **Update Odometer** yang otomatis menghitung ulang pengingat oli & sisa km garansi.
- **Katalog Sparepart & Pelumas (`/catalog`)**: Filter tipe motor, kategori, kualitas (**Original OEM vs Aftermarket**), tabel perbandingan, **Kalkulator Estimasi Biaya** (harga barang + estimasi jasa pasang), simpan estimasi untuk ditarik kasir, serta dukungan **cache lokal saat offline** lengkap dengan tombol muat ulang.
- **Riwayat & Garansi Digital (`/history`)**: Nota digital anti-hilang (bisa dicetak/simpan PDF), kartu garansi digital dengan indikator sisa waktu & kilometer, generator **QR Code lokal** (100% offline), serta kunci otomatis + alasan transparan untuk garansi kedaluwarsa.
- **Program Loyalitas (`/loyalty`)**: Kartu stempel digital otomatis (5x ganti oli → gratis oli + merch), penukaran stempel menjadi voucher QR *single-use*.

### Mode Mitra Bengkel (Kasir / Admin)
- **Kasir POS (`/pos`)**: Layout dua kolom responsif (desktop/tablet) dan kartu vertikal (HP), ringkasan KPI harian, pencarian pelanggan via pelat/HP, fitur **Tarik Estimasi Tersimpan**, pemotongan stok otomatis, **Verifikasi / Scan Kode QR Klaim** (garansi `WRN-...` & reward `RWD-...`, *single-use*), penerbitan nota + garansi + stempel otomatis, **Antrean Offline (Offline Queue)** dengan auto-sync, serta tombol **Pengingat Servis Rutin via WhatsApp (`wa.me`)**.
- **Pengaturan Bengkel (`/workshop/settings`)**: CRUD katalog & stok (dengan peringatan stok minimum), profil bengkel, aturan garansi & loyalitas, rekap omzet terisolasi per bengkel, **Export / Import JSON Backup**, dan **Reset Data Dummy** 1-klik.
- **Login & RBAC (`/login`)**: Pemisahan peran Customer vs Mitra Bengkel, verifikasi OTP simulasi, serta tombol **Ganti Peran 1-Klik** di pojok kanan atas untuk demo cepat.

## Cara Menjalankan Lokal
Karena aplikasi ini menggunakan arsitektur statis *Zero-Cost* (`localStorage` + PWA Service Worker), tidak perlu instalasi Node.js atau server database:

```bash
# Menggunakan Ruby bawaan macOS:
ruby serve.rb 8091
# Lalu buka http://127.0.0.1:8091
```

## Cara Deploy Gratis
- **Vercel (Hobby Plan)**: Hubungkan repository ini ke Vercel — `vercel.json` sudah siap untuk clean URLs tanpa langkah build.
- **GitHub Pages**: Aktifkan GitHub Pages dari branch `main` (root folder) — langsung aktif sebagai PWA.
