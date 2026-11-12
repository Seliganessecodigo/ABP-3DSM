# Kontribusi

Bagian ini untuk pengembangan dan operasi: lingkungan lokal, kontrak dan pemeriksaan. Untuk penggunaan produk, baca panduan penggunaan.

## Kriteria validasi {#workflow}

Perubahan cakupan/aturan mencatat masalah, hasil yang diharapkan dan kriteria penerimaan pada cerita terkait. Review produk dan evaluasi kegunaan mencatat kesulitan, masukan dan perbaikan. Retensi, backup/pemulihan, target operasi dan kuota eksternal masih memerlukan keputusan.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Pemeriksaan {#quality}

CI memeriksa build dokumentasi, lint/test/build frontend, lint/typecheck/test PostgreSQL/cakupan/build/migration backend dan alur browser terintegrasi nyata. `TEST_DATABASE_URL` harus PostgreSQL terisolasi; tanpa variabel, Jest melewati suite database dan browser integrasi gagal. SonarQube wajib untuk PR ke `develop`: cakupan baru ≥80%, duplikasi ≤3%, rating A, seluruh hotspot ditinjau. Otomatisasi tidak mengganti evaluasi kegunaan/penerimaan produk.

```sh
npm ci --prefix docs
npm run docs:build
npm ci --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend -- --runInBand
npm run test:cov --prefix backend -- --runInBand
npm run build --prefix backend
npm run test:integration --prefix frontend
```

## Dokumentasi teknis {#documentation}

Produk harus memungkinkan menemukan aplikasi, membedakan nol dari ketiadaan dan melacak indikator ke periode, satuan, cakupan dan metode. Kueri mempertahankan konteks navigasi dan menjelaskan pemuatan, kosong, kegagalan dan data lama. Evaluasi mencakup keyboard, fokus terlihat, teks selain warna, seluler dan 12 bahasa.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Bacaan terkait {#related}

[Kualitas dan penerimaan](./product/quality) · [Backlog produk](./roadmap)
