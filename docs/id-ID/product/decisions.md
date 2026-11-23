# Keputusan dan dependensi

Perubahan cakupan/aturan mencatat masalah, hasil yang diharapkan dan kriteria penerimaan pada cerita terkait. Review produk dan evaluasi kegunaan mencatat kesulitan, masukan dan perbaikan. Retensi, backup/pemulihan, target operasi dan kuota eksternal masih memerlukan keputusan.

## Aturan produk {#rules}

| Aturan | Makna |
| --- | --- |
| Riwayat terjaga | Preferensi dan pratinjau tidak mengganti hasil asli. |
| Ketiadaan eksplisit | Kegagalan, metrik hilang dan data lama dibedakan dari nol. |
| Kueri publik | Membaca indikator tidak perlu masuk; menyimpan preferensi dan mengelola akun memerlukan izin. |

## Status saat ini dan dependensi {#planned}

Perbandingan, simulasi regional, peringkat, pengelolaan pengguna dan peran, pemulihan kata sandi serta kendali pemantauan telah diimplementasikan. Administrasi memerlukan izin; SSO dan pengiriman email bergantung pada konfigurasi lingkungan. Ekspor CSV serta kebijakan retensi, pencadangan dan pemulihan masih memerlukan keputusan produk.

## Model estimasi {#method}

Model sederhana mengestimasi energi dari CPU, memori, disk dan jaringan selama interval observasi. Daya estimasi menjadi energi sesuai durasi. Emisi adalah energi dikalikan intensitas karbon wilayah. Koefisien milik model akademik, bukan pengukuran listrik langsung atau faktor wilayah resmi. Hasil mempertahankan metodologi dan faktor asalnya.

## Kriteria penerimaan {#acceptance}

Produk harus memungkinkan menemukan aplikasi, membedakan nol dari ketiadaan dan melacak indikator ke periode, satuan, cakupan dan metode. Kueri mempertahankan konteks navigasi dan menjelaskan pemuatan, kosong, kegagalan dan data lama. Evaluasi mencakup keyboard, fokus terlihat, teks selain warna, seluler dan 12 bahasa.

## Bacaan terkait {#related}

[Backlog produk](../roadmap) · [Metodologi dan data](../product/methodology)
