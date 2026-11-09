# Metodologi dan data

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

Model `simplified-energy`, versi `1`: CPU 100% = 100 W, memori 0,375 W/GB, disk 0,01 W/GB, jaringan 0,02 W/GB. Parameter sederhana, bukan pengukuran listrik atau faktor wilayah resmi. Daya dijumlahkan; energi = W × jam / 1000; CO₂e[g] = kWh × gCO₂e/kWh. Snapshot menyimpan metode/faktor; pratinjau faktor saat ini tidak menulis ulang aslinya.

Kueri memerlukan `from`, `to` RFC 3339 dengan zona eksplisit; `[from,to)` dinormalisasi UTC. Granularitas `hour`, `day`, `month`, `year`, maksimum 10.000 titik. Nilai tersimpan dibagi proporsional terhadap irisan tanpa hitung ulang: `collectedAt` terbaru menang, seri memakai ID leksikal naik. Pemenang tidak valid tidak diganti data lama. Cakupan energi/CO₂e terpisah. `null` berarti hilang; nol dapat valid. Metrik sumber tidak memiliki waktu pengukuran: interval berasal dari penerimaan dikurangi `collection_interval_seconds`. Waktu kueri faktor bukan masa berlaku. Energi/faktor/emisi disimpan 8 desimal, cakupan 4.

Di `/administration/calculations`, pilih aplikasi/tanggal untuk membandingkan asli/pratinjau. Tanggal akhir mencakup seluruh hari UTC; API menerima `[from,to)`. Pratinjau publik menggunakan model saat ini dan faktor saat ini untuk wilayah historis, tanpa menyimpan. Batas: 30 hari, 10.000 observasi. Respons: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Kegagalan faktor mempertahankan energi yang dapat dihitung, CO₂e tidak tersedia. Persentase memerlukan satuan/cakupan sama dan acuan positif.

`/methodology` memiliki tab energi, emisi, cakupan dan analisis dengan contoh/preferensi pribadi. Setiap peran terautentikasi hanya menyimpan tab sendiri, dengan revisi optimistis; konflik 409. Ambang tampilan tidak mengubah pengaturan global, hitungan atau notifikasi eksternal. Periode/granularitas tersimpan hanya mengisi parameter detail URL yang kosong. Metodologi historis tetap di `/services/:id/methodology`, dengan `collectionId` terpilih.

[Visi dan cakupan](../product/vision) · [Panduan penggunaan](../guide/monitoring) · [Metodologi dan data](../product/methodology) · [Kualitas dan penerimaan](../product/quality) · [Keputusan dan dependensi](../product/decisions) · [Referensi API](../reference/api) · [Operasi dan diagnosis](../operations) · [Memulai](../getting-started) · [Arsitektur](../architecture) · [Kontribusi](../contributing) · [Backlog produk](../roadmap)
