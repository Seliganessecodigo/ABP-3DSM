# Metodologi dan data

Model sederhana mengestimasi energi dari CPU, memori, disk dan jaringan selama interval observasi. Daya estimasi menjadi energi sesuai durasi. Emisi adalah energi dikalikan intensitas karbon wilayah. Koefisien milik model akademik, bukan pengukuran listrik langsung atau faktor wilayah resmi. Hasil mempertahankan metodologi dan faktor asalnya.

## Pahami data {#vocabulary}

| Konsep | Makna |
| --- | --- |
| Aplikasi | Layanan dengan identitas stabil dalam katalog. |
| Observasi | Sekumpulan metrik terkait interval. |
| Energi | Jumlah estimasi periode, dalam kWh. |
| Intensitas karbon | Faktor wilayah, dalam gCO₂e/kWh. |
| Emisi | Jumlah setara CO₂ dengan satuan disebutkan. |
| Cakupan | Bagian periode yang didukung bukti valid. |

## Model estimasi {#model}

| Parameter | Nilai |
| --- | --- |
| CPU (100%) | 100 W |
| Memori | 0.375 W/GB |
| Disk | 0.01 W/GB |
| Jaringan | 0.02 W/GB |

```text
P [W] = P_CPU + P_RAM + P_disk + P_network
E [kWh] = P [W] × Δt [h] / 1000
CO₂e [g] = E [kWh] × I [gCO₂e/kWh]
```

## Pahami cakupan {#coverage}

Cakupan adalah proporsi periode yang didukung observasi valid. Energi dan emisi memiliki cakupan terpisah: energi dapat diestimasi tanpa faktor untuk menghitung emisi. Bandingkan periode, satuan dan cakupan yang kompatibel. Cakupan rendah berarti analisis parsial, bukan bukti konsumsi berkurang.

Nol berarti observasi valid mendukung nilai itu. Celah berarti data yang dapat dipakai tidak tersedia, bukan konsumsi nol. Bila pembaruan gagal, pembacaan valid terakhir dapat dipertahankan bersama waktu aslinya. Periksa pembaruan dan cakupan sebelum memutuskan. Layar meminta data 60 detik setelah setiap percobaan; pengukuran baru tidak dijamin setiap pembaruan.

## Periode dan riwayat {#history}

| Aturan | Makna |
| --- | --- |
| Riwayat terjaga | Preferensi dan pratinjau tidak mengganti hasil asli. |
| Ketiadaan eksplisit | Kegagalan, metrik hilang dan data lama dibedakan dari nol. |
| Kueri publik | Membaca indikator tidak perlu masuk; menyimpan preferensi dan mengelola akun memerlukan izin. |

Di pratinjau hitung ulang pilih aplikasi dan tanggal untuk membandingkan hasil asli dengan model saat ini dan faktor karbon saat ini dari wilayah yang diamati. Hari terakhir dihitung penuh dalam UTC. Maksimum 30 hari dan 10.000 observasi. Pratinjau tidak disimpan dan tidak mengubah riwayat. Selisih persentase muncul jika satuan/cakupan sama dan nilai asli positif.

## Bacaan terkait {#related}

[Panduan penggunaan](../guide/monitoring) · [Referensi API](../reference/api)
