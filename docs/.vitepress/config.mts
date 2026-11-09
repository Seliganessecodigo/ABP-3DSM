import { defineConfig } from 'vitepress'

const github = 'https://github.com/Seliganessecodigo/ABP-3DSM'

const labels = {
  ptBR: { language: 'Português (Brasil)', product: 'Visão geral', architecture: 'Arquitetura', start: 'Primeiros passos', roadmap: 'Épicos', backlog: 'Backlog por épico', epicNames: ['Fundações e qualidade', 'Catálogo de aplicações', 'Monitoramento', 'Cálculo ambiental', 'Dashboard ambiental', 'Análise e simulação', 'Configuração e administração'], guide: 'Comece aqui', productSection: 'Produto', technical: 'Projeto', contributing: 'Contribuição', updated: 'Atualizado em', footer: 'Projeto acadêmico · Fatec Jacareí' },
  enUS: { language: 'English', product: 'Overview', architecture: 'Architecture', start: 'Getting started', roadmap: 'Epics', backlog: 'Backlog by epic', epicNames: ['Foundations and quality', 'Application catalog', 'Monitoring', 'Environmental calculation', 'Environmental dashboard', 'Analysis and simulation', 'Configuration and administration'], guide: 'Start here', productSection: 'Product', technical: 'Project', contributing: 'Contributing', updated: 'Last updated', footer: 'Academic project · Fatec Jacareí' },
  esES: { language: 'Español', product: 'Resumen', architecture: 'Arquitectura', start: 'Primeros pasos', roadmap: 'Épicas', backlog: 'Backlog por épica', epicNames: ['Fundamentos y calidad', 'Catálogo de aplicaciones', 'Monitorización', 'Cálculo ambiental', 'Dashboard ambiental', 'Análisis y simulación', 'Configuración y administración'], guide: 'Empieza aquí', productSection: 'Producto', technical: 'Proyecto', contributing: 'Contribuir', updated: 'Actualizado el', footer: 'Proyecto académico · Fatec Jacareí' },
  frFR: { language: 'Français', product: 'Présentation', architecture: 'Architecture', start: 'Démarrage', roadmap: 'Épopées', backlog: 'Backlog par épopée', epicNames: ['Fondations et qualité', 'Catalogue des applications', 'Surveillance', 'Calcul environnemental', 'Tableau de bord', 'Analyse et simulation', 'Configuration et administration'], guide: 'Pour commencer', productSection: 'Produit', technical: 'Projet', contributing: 'Contribuer', updated: 'Mis à jour le', footer: 'Projet académique · Fatec Jacareí' },
  deDE: { language: 'Deutsch', product: 'Übersicht', architecture: 'Architektur', start: 'Erste Schritte', roadmap: 'Epics', backlog: 'Backlog nach Epic', epicNames: ['Grundlagen und Qualität', 'Anwendungskatalog', 'Überwachung', 'Umweltberechnung', 'Umweltdashboard', 'Analyse und Simulation', 'Konfiguration und Administration'], guide: 'Erste Schritte', productSection: 'Produkt', technical: 'Projekt', contributing: 'Mitwirken', updated: 'Aktualisiert am', footer: 'Akademisches Projekt · Fatec Jacareí' },
  itIT: { language: 'Italiano', product: 'Panoramica', architecture: 'Architettura', start: 'Per iniziare', roadmap: 'Epic', backlog: 'Backlog per epic', epicNames: ['Fondamenti e qualità', 'Catalogo applicazioni', 'Monitoraggio', 'Calcolo ambientale', 'Dashboard ambientale', 'Analisi e simulazione', 'Configurazione e amministrazione'], guide: 'Per iniziare', productSection: 'Prodotto', technical: 'Progetto', contributing: 'Contribuire', updated: 'Aggiornato il', footer: 'Progetto accademico · Fatec Jacareí' },
  jaJP: { language: '日本語', product: '概要', architecture: 'アーキテクチャ', start: 'はじめに', roadmap: 'エピック', backlog: 'エピック別バックログ', epicNames: ['基盤と品質', 'アプリケーション一覧', '監視', '環境影響の算出', '環境ダッシュボード', '分析とシミュレーション', '設定と管理'], guide: 'はじめに', productSection: 'プロダクト', technical: 'プロジェクト', contributing: 'コントリビューション', updated: '更新日', footer: '学術プロジェクト · Fatec Jacareí' },
  zhCN: { language: '简体中文', product: '概览', architecture: '架构', start: '开始使用', roadmap: '史诗任务', backlog: '按史诗查看待办', epicNames: ['基础与质量', '应用目录', '应用监控', '环境影响计算', '环境仪表板', '分析与模拟', '配置与管理'], guide: '快速开始', productSection: '产品', technical: '项目', contributing: '参与贡献', updated: '更新于', footer: '学术项目 · Fatec Jacareí' },
  koKR: { language: '한국어', product: '프로젝트 소개', architecture: '아키텍처', start: '시작하기', roadmap: '에픽', backlog: '에픽별 백로그', epicNames: ['기반과 품질', '애플리케이션 카탈로그', '모니터링', '환경 영향 계산', '환경 대시보드', '분석과 시뮬레이션', '설정과 관리'], guide: '시작하기', productSection: '제품', technical: '프로젝트', contributing: '기여 안내', updated: '업데이트', footer: '학술 프로젝트 · Fatec Jacareí' },
  ruRU: { language: 'Русский', product: 'О проекте', architecture: 'Архитектура', start: 'Начало работы', roadmap: 'Эпики', backlog: 'Бэклог по эпикам', epicNames: ['Основа и качество', 'Каталог приложений', 'Мониторинг', 'Расчёт воздействия', 'Экологическая панель', 'Анализ и симуляция', 'Настройка и администрирование'], guide: 'Начните здесь', productSection: 'Продукт', technical: 'Проект', contributing: 'Участие в разработке', updated: 'Обновлено', footer: 'Учебный проект · Fatec Jacareí' },
  hiIN: { language: 'हिन्दी', product: 'परियोजना के बारे में', architecture: 'आर्किटेक्चर', start: 'शुरुआत करें', roadmap: 'एपिक', backlog: 'एपिक के अनुसार बैकलॉग', epicNames: ['आधार और गुणवत्ता', 'अनुप्रयोग कैटलॉग', 'निगरानी', 'पर्यावरण गणना', 'पर्यावरण डैशबोर्ड', 'विश्लेषण और सिमुलेशन', 'सेटिंग और प्रशासन'], guide: 'यहाँ शुरू करें', productSection: 'उत्पाद', technical: 'परियोजना', contributing: 'योगदान', updated: 'अपडेट', footer: 'शैक्षणिक परियोजना · Fatec Jacareí' },
  idID: { language: 'Bahasa Indonesia', product: 'Tentang proyek', architecture: 'Arsitektur', start: 'Memulai', roadmap: 'Epik', backlog: 'Backlog per epik', epicNames: ['Fondasi dan kualitas', 'Katalog aplikasi', 'Pemantauan', 'Perhitungan lingkungan', 'Dashboard lingkungan', 'Analisis dan simulasi', 'Konfigurasi dan administrasi'], guide: 'Mulai di sini', productSection: 'Produk', technical: 'Proyek', contributing: 'Kontribusi', updated: 'Diperbarui', footer: 'Proyek akademik · Fatec Jacareí' },
}

const documentationLabels = {
  'pt-BR': { vision: 'Visão e escopo', usage: 'Guia de uso', methodology: 'Metodologia e dados', quality: 'Qualidade e aceite', decisions: 'Decisões e dependências', api: 'Referência da API', operations: 'Operação e diagnóstico' },
  'en-US': { vision: 'Vision and scope', usage: 'User guide', methodology: 'Methodology and data', quality: 'Quality and acceptance', decisions: 'Decisions and dependencies', api: 'API reference', operations: 'Operations and diagnosis' },
  'es-ES': { vision: 'Visión y alcance', usage: 'Guía de uso', methodology: 'Metodología y datos', quality: 'Calidad y aceptación', decisions: 'Decisiones y dependencias', api: 'Referencia de la API', operations: 'Operación y diagnóstico' },
  'fr-FR': { vision: 'Vision et périmètre', usage: 'Guide d’utilisation', methodology: 'Méthodologie et données', quality: 'Qualité et acceptation', decisions: 'Décisions et dépendances', api: 'Référence de l’API', operations: 'Exploitation et diagnostic' },
  'de-DE': { vision: 'Vision und Umfang', usage: 'Benutzerhandbuch', methodology: 'Methodik und Daten', quality: 'Qualität und Abnahme', decisions: 'Entscheidungen und Abhängigkeiten', api: 'API-Referenz', operations: 'Betrieb und Diagnose' },
  'it-IT': { vision: 'Visione e ambito', usage: 'Guida all’uso', methodology: 'Metodologia e dati', quality: 'Qualità e accettazione', decisions: 'Decisioni e dipendenze', api: 'Riferimento API', operations: 'Operazione e diagnosi' },
  'ja-JP': { vision: 'ビジョンと範囲', usage: '利用ガイド', methodology: '方法論とデータ', quality: '品質と受け入れ', decisions: '決定と依存事項', api: 'APIリファレンス', operations: '運用と診断' },
  'zh-CN': { vision: '愿景与范围', usage: '使用指南', methodology: '方法与数据', quality: '质量与验收', decisions: '决策与依赖', api: 'API参考', operations: '运维与诊断' },
  'ko-KR': { vision: '비전과 범위', usage: '사용 안내', methodology: '방법론과 데이터', quality: '품질과 인수 기준', decisions: '결정과 의존성', api: 'API 참조', operations: '운영과 진단' },
  'ru-RU': { vision: 'Видение и границы', usage: 'Руководство пользователя', methodology: 'Методология и данные', quality: 'Качество и приёмка', decisions: 'Решения и зависимости', api: 'Справочник API', operations: 'Эксплуатация и диагностика' },
  'hi-IN': { vision: 'दृष्टि और दायरा', usage: 'उपयोग मार्गदर्शिका', methodology: 'पद्धति और डेटा', quality: 'गुणवत्ता और स्वीकृति', decisions: 'निर्णय और निर्भरताएँ', api: 'API संदर्भ', operations: 'संचालन और निदान' },
  'id-ID': { vision: 'Visi dan cakupan', usage: 'Panduan penggunaan', methodology: 'Metodologi dan data', quality: 'Kualitas dan penerimaan', decisions: 'Keputusan dan dependensi', api: 'Referensi API', operations: 'Operasi dan diagnosis' },
}

function localeConfig(text: (typeof labels)[keyof typeof labels], lang: keyof typeof documentationLabels) {
  const content = documentationLabels[lang]
  const link = (path: string) => lang === 'pt-BR' ? path : `/${lang}${path}`
  return {
    label: text.language,
    lang,
    themeConfig: {
      nav: [
        { text: text.start, link: link('/getting-started') },
        { text: text.productSection, link: link('/product/vision') },
        { text: text.roadmap, link: link('/roadmap') },
        { text: text.contributing, link: link('/contributing') },
      ],
      sidebar: [
        {
          text: text.guide,
          items: [
            { text: text.product, link: link('/') },
            { text: text.start, link: link('/getting-started') },
            { text: content.usage, link: link('/guide/monitoring') },
          ],
        },
        {
          text: text.productSection,
          items: [
            { text: content.vision, link: link('/product/vision') },
            { text: content.methodology, link: link('/product/methodology') },
            { text: content.quality, link: link('/product/quality') },
            { text: content.decisions, link: link('/product/decisions') },
            { text: text.roadmap, link: link('/roadmap') },
            {
              text: text.backlog,
              collapsed: true,
              items: text.epicNames.map((name, index) => ({
                text: `EP${String(index).padStart(2, '0')} · ${name}`,
                link: link(`/backlog/ep${String(index).padStart(2, '0')}`),
              })),
            },
          ],
        },
        {
          text: text.technical,
          items: [
            { text: text.architecture, link: link('/architecture') },
            { text: content.api, link: link('/reference/api') },
            { text: content.operations, link: link('/operations') },
            { text: text.contributing, link: link('/contributing') },
          ],
        },
      ],
      lastUpdated: { text: text.updated },
      footer: { message: text.footer, copyright: `© ${new Date().getFullYear()} GreenER` },
    },
  }
}

export default defineConfig({
  base: process.env.DOCS_BASE ?? '/',
  title: 'GreenER',
  description: 'Acompanhe aplicações e entenda estimativas de energia e CO₂e.',
  srcExclude: ['**/README.md', 'frontend-i18n.md', 'evidence/**'],
  lastUpdated: true,
  locales: {
    'ko-KR': localeConfig(labels.koKR, 'ko-KR'),
    'ru-RU': localeConfig(labels.ruRU, 'ru-RU'),
    'hi-IN': localeConfig(labels.hiIN, 'hi-IN'),
    'id-ID': localeConfig(labels.idID, 'id-ID'),
    root: localeConfig(labels.ptBR, 'pt-BR'),
    'en-US': localeConfig(labels.enUS, 'en-US'),
    'es-ES': localeConfig(labels.esES, 'es-ES'),
    'fr-FR': localeConfig(labels.frFR, 'fr-FR'),
    'de-DE': localeConfig(labels.deDE, 'de-DE'),
    'it-IT': localeConfig(labels.itIT, 'it-IT'),
    'ja-JP': localeConfig(labels.jaJP, 'ja-JP'),
    'zh-CN': localeConfig(labels.zhCN, 'zh-CN'),
  },
  themeConfig: {
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: github }],
  },
})
