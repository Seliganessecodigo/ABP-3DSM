# Rencana pengiriman dan bukti

Hasil GreenER menggabungkan keluasan fungsi, rekayasa perangkat lunak dan ketertelusuran lingkungan. Dokumen ini menyajikan kemampuan yang diterapkan, bukti untuk 27 kriteria rubrik dan kontribusi lima anggota dalam tiga sprint, dengan tautan ke kode, pengujian dan dokumentasi.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Produk terintegrasi dan rekayasa {#engineering}

React 19 dan TypeScript mendukung antarmuka; NestJS mengatur API dalam modul dan lapisan dengan injeksi dependensi; TypeORM dan PostgreSQL mempertahankan data melalui migrasi berversi. Integrasi tervalidasi, audit transaksional dan snapshot perhitungan mendukung konsistensi indikator.

Pada basis yang didokumentasikan, CI meluluskan 542 pengujian frontend, 705 backend dan tiga alur terintegrasi, beserta lint, pemeriksaan tipe, build, migrasi dan gate SonarQube Cloud. Situs menyediakan 12 bahasa dengan pemeriksaan otomatis kesetaraan konten, kontrak dan tautan.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Kriteria dan verifikasi {#criteria}

| Kode | Poin | Hasil | Verifikasi | Bukti yang disajikan |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Backlog | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Backlog terstruktur |
| GA02 | 5 | Perencanaan dan kapasitas | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Iterasi dan penanggung jawab Project |
| GA03 | 5 | Kriteria penerimaan | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Kriteria dalam issue |
| GA04 | 4 | Pelacakan | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | PR dan commit tertaut |
| GA05 | 3 | Peningkatan bertahap | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| GA06 | 4 | Review dan adaptasi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Tinjauan teknis tercatat |
| GA07 | 3 | Definisi selesai | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | DoD terdokumentasi |
| GA08 | 3 | Dokumentasi dan eksekusi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Dokumentasi berversi |
| GA09 | 8 | Partisipasi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| DW01 | 3 | Teknologi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| DW02 | 5 | Integrasi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| DW03 | 4 | API dan backend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| DW04 | 4 | Persistensi ORM | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| DW05 | 3 | Frontend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| DW06 | 3 | Autentikasi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| DW07 | 3 | Kontainer | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| TP01 | 4 | Tanggung jawab | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| TP02 | 4 | Injeksi dependensi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| TP03 | 4 | Tipe dan keterbacaan | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| TP04 | 4 | Uji unit | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| TP05 | 4 | Validasi dan kegagalan | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| IHC01 | 3 | Pengguna dan tugas | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| IHC02 | 3 | Alur dan prototipe | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Prototipe dan alur terdokumentasi |
| IHC03 | 3 | Indikator dan status | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| IHC04 | 2 | Responsivitas dan masukan | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Diimplementasikan/diverifikasi |
| IHC05 | 2 | Evaluasi pengguna | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Protokol evaluasi |
| IHC06 | 2 | Perbaikan dan uji ulang | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Umpan balik antarmuka tercatat |

## Sprint dan referensi {#sprints}

| Sprint | Periode | Kemampuan terintegrasi |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Fondasi, katalog dan pengumpulan |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Indikator, antarmuka dan autentikasi |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | Riwayat, analisis dan pengembangan operasi |

## Definisi selesai {#done}

Kriteria penerimaan, integritas data, pengujian, CI, dokumentasi, aksesibilitas dan tinjauan membentuk Definition of Done. Setiap hasil menghubungkan versinya dengan bukti verifikasi.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Partisipasi dan sumber {#sources}

Kelima anggota memiliki kontribusi terintegrasi dalam ketiga sprint. Tabel menghubungkan penulis Git dengan commit terverifikasi dan menampilkan tugas serta penanggung jawab di Project, sehingga partisipasi dalam pembangunan produk dapat ditelusuri.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Bukti kualitas {#quality-evidence}

Kode, pengujian otomatis, kontrak dan dokumentasi membentuk jejak verifikasi hasil. Matriks rinci, protokol evaluasi kegunaan dan catatan teknis mendukung pemeriksaan alur, kriteria kualitas serta bukti setiap dimensi proyek.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
