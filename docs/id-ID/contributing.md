# Kontribusi

Acuan: `origin/develop`, commit `c343698`, diperiksa 08-11-2026. Lingkungan dapat memakai revisi berbeda; merge tidak membuktikan deployment.

Issue: penerimaan/dependensi; Projects: prioritas/Sprint; Figma: maksud visual; kode/OpenAPI: kontrak nyata. Keputusan jangka panjang dicatat sebagai ADR. PR terbuka tidak menutup issue; pastikan merge/cakupan. ADR historis dipertahankan.

`develop` → `tipo/numero-descricao` / `tipo/descricao` → PR `develop`. Conventional Commits: `tipo(escopo): descrição`; `Refs #N`.

GreenER memantau aplikasi dan memperkirakan energi serta CO₂e. Katalog, dashboard, detail, riwayat, pratinjau hitung ulang, metodologi dan login tersedia. Antarmuka dan dokumentasi mendukung 12 bahasa: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`. Fallback frontend adalah bahasa Inggris.

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
# Isolated PostgreSQL: TEST_DATABASE_URL
npm run test:integration --prefix frontend
```

[Visi dan cakupan](./product/vision) · [Panduan penggunaan](./guide/monitoring) · [Metodologi dan data](./product/methodology) · [Kualitas dan penerimaan](./product/quality) · [Keputusan dan dependensi](./product/decisions) · [Referensi API](./reference/api) · [Operasi dan diagnosis](./operations) · [Memulai](./getting-started) · [Arsitektur](./architecture) · [Kontribusi](./contributing) · [Backlog produk](./roadmap)
