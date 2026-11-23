# Kualitas dan penerimaan

Antarmuka menghubungkan indikator dengan periode, satuan, cakupan dan metodologi sambil mempertahankan filter serta konteks navigasi. Status pemuatan, kosong, kegagalan dan data usang ditangani secara eksplisit. Keyboard, fokus terlihat, teks selain warna, perangkat seluler, tema dan 12 bahasa merupakan bagian dari pengalaman pengguna.

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

Epic, cerita dan tugas mengatur produk dengan kriteria terverifikasi dan referensi kode. Issue, pull request dan commit menghubungkan persyaratan, implementasi dan pengujian; dokumentasi berversi menghimpun arsitektur, kontrak, operasi dan bukti.

## Pemeriksaan {#engineering}

Pada basis yang didokumentasikan, CI meluluskan 542 pengujian frontend, 705 backend dan tiga alur terintegrasi, beserta lint, pemeriksaan tipe, build, migrasi dan gate SonarQube Cloud. Situs menyediakan 12 bahasa dengan pemeriksaan otomatis kesetaraan konten, kontrak dan tautan.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

[Kontribusi](../contributing)

## Bacaan terkait {#related}

[Prinsip rekayasa](../product/decisions) · [Kontribusi](../contributing)
