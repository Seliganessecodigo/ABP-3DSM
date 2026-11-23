# Visi dan cakupan

GreenER membantu memantau aplikasi dan memahami estimasi konsumsi energi serta emisi setara karbon dioksida (CO₂e). Indikator, lokasi dan riwayat mendukung analisis dampak lingkungan layanan digital.

## Untuk siapa {#readers}

| Pengguna | Kebutuhan |
| --- | --- |
| Pengelolaan infrastruktur | Mengenali aplikasi dan mengikuti perubahan lingkungan. |
| Analisis lingkungan dan operasi | Menyelidiki konsumsi, emisi dan kualitas data suatu periode. |
| Pengembangan dan evaluasi | Memeriksa perilaku produk dan mereproduksi hasil. |

## Fitur tersedia {#features}

| Fitur | Referensi |
| --- | --- |
| Katalog dan pencarian | [Temukan aplikasi](../guide/monitoring#catalog) |
| Pemantauan otomatis | [Pahami data](../guide/monitoring#data) |
| Dashboard lingkungan | [Baca dashboard](../guide/monitoring#dashboard) |
| Detail aplikasi | [Selidiki detail](../guide/monitoring#detail) |
| Riwayat dan komposisi | [Jelajahi riwayat](../guide/monitoring#history) |
| Pratinjau lama (di luar cakupan) | [Bandingkan dengan pratinjau hitung ulang](../guide/monitoring#preview) |
| Preferensi pribadi | [Personalisasi analisis](../guide/monitoring#preferences) |
| Masuk dan faktor kedua | [Masuk](../guide/monitoring#access) |
| Peringkat lingkungan | [Peringkat lingkungan](../guide/monitoring#other) |
| Perbandingan aplikasi | [Perbandingan aplikasi](../guide/monitoring#other) |
| Simulasi regional | [Simulasi regional](../guide/monitoring#other) |
| Akun dan pemulihan kata sandi | [Akun dan pemulihan kata sandi](../guide/monitoring#other) |

## Alur analisis {#journey}

Mulai dari ringkasan lingkungan, cari aplikasi yang perlu perhatian dan buka detailnya. Gunakan riwayat untuk menelusuri periode dan metodologi untuk memahami estimasi. Pertimbangkan cakupan sebelum membandingkan hasil.

## Batas penggunaan {#limits}

Model sederhana mengestimasi energi dari CPU, memori, disk dan jaringan selama interval observasi. Daya estimasi menjadi energi sesuai durasi. Emisi adalah energi dikalikan intensitas karbon wilayah. Koefisien milik model akademik, bukan pengukuran listrik langsung atau faktor wilayah resmi. Hasil mempertahankan metodologi dan faktor asalnya.

Cakupan adalah proporsi periode yang didukung observasi valid. Energi dan emisi memiliki cakupan terpisah: energi dapat diestimasi tanpa faktor untuk menghitung emisi. Bandingkan periode, satuan dan cakupan yang kompatibel. Cakupan rendah berarti analisis parsial, bukan bukti konsumsi berkurang.

## Status saat ini dan dependensi {#planned}

Perbandingan, simulasi regional, peringkat, pengelolaan pengguna dan peran, pemulihan kata sandi serta kendali pemantauan telah diimplementasikan. Administrasi memerlukan izin; SSO dan pengiriman email bergantung pada konfigurasi lingkungan. Ekspor CSV serta kebijakan retensi, pencadangan dan pemulihan masih memerlukan keputusan produk.

## Bacaan terkait {#related}

[Panduan penggunaan](../guide/monitoring) · [Metodologi dan data](../product/methodology) · [Backlog produk](../roadmap)
