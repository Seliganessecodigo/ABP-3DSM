# Kontribusi

Bagian ini untuk pengembangan dan operasi: lingkungan lokal, kontrak dan pemeriksaan. Untuk penggunaan produk, baca panduan penggunaan.

## Kriteria validasi {#workflow}

Epic, cerita dan tugas mengatur produk dengan kriteria terverifikasi dan referensi kode. Issue, pull request dan commit menghubungkan persyaratan, implementasi dan pengujian; dokumentasi berversi menghimpun arsitektur, kontrak, operasi dan bukti.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Pemeriksaan {#quality}

CI memeriksa build dokumentasi, lint/test/build frontend, lint/typecheck/test PostgreSQL/cakupan/build/migration backend dan alur browser terintegrasi nyata. `TEST_DATABASE_URL` harus PostgreSQL terisolasi; tanpa variabel, Jest melewati suite database dan browser integrasi gagal. SonarQube wajib untuk PR ke `develop`: cakupan baru ≥80%, duplikasi ≤3%, rating A, seluruh hotspot ditinjau.

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

Antarmuka menghubungkan indikator dengan periode, satuan, cakupan dan metodologi sambil mempertahankan filter serta konteks navigasi. Status pemuatan, kosong, kegagalan dan data usang ditangani secara eksplisit. Keyboard, fokus terlihat, teks selain warna, perangkat seluler, tema dan 12 bahasa merupakan bagian dari pengalaman pengguna.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Bacaan terkait {#related}

[Kualitas dan penerimaan](./product/quality) · [Backlog produk](./roadmap)

[Rencana dan bukti](./plano-de-entregas)
