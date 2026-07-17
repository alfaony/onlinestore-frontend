# Roadmap UI/UX Order sampai Review

Dokumen ini menjadi acuan implementasi lintas frontend dan backend untuk flow pelanggan dari memilih produk sampai memberikan penilaian.

## Sasaran

- Mengurangi checkout abandonment.
- Membuat status dan tindakan berikutnya selalu jelas.
- Memastikan recovery OTP tidak memutus konteks order.
- Meningkatkan completion rate review, khususnya order multi-produk.
- Menyamakan pengalaman mobile dan desktop tanpa menggandakan business flow.

## Fase 0 — Critical fixes (selesai)

- [x] Perbaiki perilaku `Pilih Semua` pada partial checkout.
- [x] Sembunyikan pemilih partial checkout untuk keranjang satu produk.
- [x] Tambahkan bottom action bar dan responsive fulfillment control di mobile.
- [x] Perbaiki overflow banner cabang pada viewport kecil.
- [x] Ganti recovery tracking dari redirect checkout menjadi OTP langsung.
- [x] Tampilkan CTA review hanya untuk pemilik order yang sudah selesai.
- [x] Ubah review multi-produk menjadi progres berurutan; modal final hanya setelah semua produk selesai.
- [x] Perpanjang sesi review menjadi 20 menit dan pertahankan draft ketika sesi diperbarui.
- [x] Perbesar target sentuh rating dan quantity control.
- [x] Hentikan cart drawer yang selalu terbuka setelah menambah produk.
- [x] Gunakan foto produk pada cart ketika tersedia.
- [x] Tambahkan debounce pencarian katalog.

Kriteria selesai: lint source berubah bersih, TypeScript build bersih, test API review/tracking lulus, dan smoke test viewport 390px serta 1440px lulus.

## Fase 1 — Conversion flow (prioritas berikutnya)

Target: 1 sprint.

1. Ubah urutan checkout menjadi `Penerimaan → Kontak/OTP → Review & bayar`.
2. Izinkan pengguna melihat estimasi ongkir dan total sebelum OTP; OTP tetap wajib saat membuat order.
3. Buat ringkasan mobile dapat dibuka dari bottom bar tanpa meninggalkan posisi form.
4. Satukan `/order` dan `/account/orders` menjadi satu sumber UI dan status mapping.
5. Bedakan hasil Midtrans `success`, `pending`, dan `error`; poll status singkat pada halaman sukses.

Kriteria selesai:

- Pengguna dapat mengetahui total sebelum verifikasi.
- State alamat, kurir, promo, dan cart tidak hilang setelah OTP.
- Tidak ada status yang berbeda antara riwayat dan detail order.
- Halaman sukses tidak menampilkan “menunggu pembayaran” setelah status sudah paid.

## Fase 2 — Tracking dan service recovery

Target: 1 sprint.

1. Desktop tracking dua kolom: status/timeline dan detail transaksi.
2. Prioritaskan satu kalimat “status sekarang + estimasi + tindakan berikutnya”.
3. Tambahkan deep link tracking kurir jika provider menyediakannya.
4. Tambahkan CTA WhatsApp bantuan untuk booking gagal, pembatalan, dan refund terlambat.
5. Tambahkan notifikasi perubahan status yang dapat di-refresh tanpa reload penuh.

Kriteria selesai:

- Pengguna dapat menjawab “pesanan saya sedang apa?” dalam satu layar pertama.
- Resi dapat disalin dan, jika tersedia, dibuka pada provider kurir.
- Semua error state memiliki tindakan pemulihan yang relevan.

## Fase 3 — Review dan retention

Target: 1 sprint.

1. Simpan draft review di local storage untuk recovery tab/browser.
2. Auto-renew session sebelum kedaluwarsa selama outer review link masih valid.
3. Tambahkan opsi “Lewati dulu” dan pengingat untuk item yang belum dinilai.
4. Eksperimenkan overall rating cepat sebelum aspek detail.
5. Tambahkan CTA “Pesan lagi” setelah review selesai.

Kriteria selesai:

- Review completion rate dapat diukur per order dan per jumlah produk.
- Draft tidak hilang setelah refresh atau session renewal.
- Tidak ada modal yang menghalangi penilaian produk berikutnya.

## Pengukuran

Event minimum yang perlu dicatat:

- `product_added`, `cart_opened`, `checkout_started`.
- `fulfillment_selected`, `shipping_rate_selected`, `otp_started`, `otp_verified`.
- `payment_opened`, `payment_success`, `payment_pending`, `checkout_abandoned`.
- `tracking_opened`, `review_started`, `review_item_saved`, `review_completed`.

Dashboard mingguan sebaiknya memantau checkout completion rate, waktu median checkout, OTP completion rate, payment failure/pending rate, tracking recovery rate, dan review completion rate.

## Rollout

- Deploy critical fixes lebih dahulu tanpa feature flag karena memperbaiki perilaku rusak.
- Perubahan urutan checkout menggunakan feature flag dan rollout bertahap.
- Pantau error API, abandonment per step, serta feedback customer service selama 48 jam pertama.
- Sediakan rollback pada level frontend untuk perubahan urutan step; kontrak API order tetap kompatibel.
