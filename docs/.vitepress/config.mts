import { defineConfig } from 'vitepress'

const github = 'https://github.com/Seliganessecodigo/ABP-3DSM'

const labels = {
  ptBR: { language: 'Português (Brasil)', product: 'Visão geral', architecture: 'Arquitetura', start: 'Primeiros passos', roadmap: 'Épicos', project: 'Projeto', updated: 'Atualizado em', footer: 'Projeto acadêmico · Fatec Jacareí' },
  enUS: { language: 'English', product: 'Overview', architecture: 'Architecture', start: 'Getting started', roadmap: 'Epics', project: 'Project', updated: 'Last updated', footer: 'Academic project · Fatec Jacareí' },
  esES: { language: 'Español', product: 'Resumen', architecture: 'Arquitectura', start: 'Primeros pasos', roadmap: 'Épicas', project: 'Proyecto', updated: 'Actualizado el', footer: 'Proyecto académico · Fatec Jacareí' },
  frFR: { language: 'Français', product: 'Présentation', architecture: 'Architecture', start: 'Démarrage', roadmap: 'Épopées', project: 'Projet', updated: 'Mis à jour le', footer: 'Projet académique · Fatec Jacareí' },
  deDE: { language: 'Deutsch', product: 'Übersicht', architecture: 'Architektur', start: 'Erste Schritte', roadmap: 'Epics', project: 'Projekt', updated: 'Aktualisiert am', footer: 'Akademisches Projekt · Fatec Jacareí' },
  itIT: { language: 'Italiano', product: 'Panoramica', architecture: 'Architettura', start: 'Per iniziare', roadmap: 'Epic', project: 'Progetto', updated: 'Aggiornato il', footer: 'Progetto accademico · Fatec Jacareí' },
  jaJP: { language: '日本語', product: '概要', architecture: 'アーキテクチャ', start: 'はじめに', roadmap: 'エピック', project: 'プロジェクト', updated: '更新日', footer: '学術プロジェクト · Fatec Jacareí' },
  zhCN: { language: '简体中文', product: '概览', architecture: '架构', start: '开始使用', roadmap: '史诗任务', project: '项目', updated: '更新于', footer: '学术项目 · Fatec Jacareí' },
}

function localeConfig(text: (typeof labels)[keyof typeof labels], lang: string) {
  return {
    label: text.language,
    lang,
    themeConfig: {
      nav: [
        { text: text.product, link: '/' },
        { text: text.architecture, link: '/architecture' },
        { text: text.start, link: '/getting-started' },
        { text: text.roadmap, link: '/roadmap' },
      ],
      sidebar: [
        {
          text: text.project,
          items: [
            { text: text.product, link: '/' },
            { text: text.architecture, link: '/architecture' },
            { text: text.start, link: '/getting-started' },
            { text: text.roadmap, link: '/roadmap' },
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
