# Kualitas dan penerimaan

Produk harus memungkinkan menemukan aplikasi, membedakan nol dari ketiadaan dan melacak indikator ke periode, satuan, cakupan dan metode. Kueri mempertahankan konteks navigasi dan menjelaskan pemuatan, kosong, kegagalan dan data lama. Evaluasi mencakup keyboard, fokus terlihat, teks selain warna, seluler dan 12 bahasa.

## Kriteria penerimaan {#acceptance}

| Aturan | Makna |
| --- | --- |
| Riwayat terjaga | Preferensi dan pratinjau tidak mengganti hasil asli. |
| Ketiadaan eksplisit | Kegagalan, metrik hilang dan data lama dibedakan dari nol. |
| Kueri publik | Membaca indikator tidak perlu masuk; menyimpan preferensi dan mengelola akun memerlukan izin. |

## Pahami data {#integrity}

Nol berarti observasi valid mendukung nilai itu. Celah berarti data yang dapat dipakai tidak tersedia, bukan konsumsi nol. Bila pembaruan gagal, pembacaan valid terakhir dapat dipertahankan bersama waktu aslinya. Periksa pembaruan dan cakupan sebelum memutuskan. Layar meminta data 60 detik setelah setiap percobaan; pengukuran baru tidak dijamin setiap pembaruan.

Cakupan adalah proporsi periode yang didukung observasi valid. Energi dan emisi memiliki cakupan terpisah: energi dapat diestimasi tanpa faktor untuk menghitung emisi. Bandingkan periode, satuan dan cakupan yang kompatibel. Cakupan rendah berarti analisis parsial, bukan bukti konsumsi berkurang.

## Kriteria validasi {#assessment}

Perubahan cakupan/aturan mencatat masalah, hasil yang diharapkan dan kriteria penerimaan pada cerita terkait. Review produk dan evaluasi kegunaan mencatat kesulitan, masukan dan perbaikan. Retensi, backup/pemulihan, target operasi dan kuota eksternal masih memerlukan keputusan.

## Pemeriksaan {#engineering}

[Kontribusi](../contributing)

## Bacaan terkait {#related}

[Keputusan dan dependensi](../product/decisions) · [Kontribusi](../contributing)
