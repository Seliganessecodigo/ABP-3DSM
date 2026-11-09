<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, useRouter, withBase } from 'vitepress'

const { site } = useData()
const route = useRoute()
const router = useRouter()
const localePrefix = /^\/(en-US|es-ES|fr-FR|de-DE|it-IT|ja-JP|zh-CN|ko-KR|ru-RU|hi-IN|id-ID)(?=\/|$)/
const pathWithoutBase = computed(() => {
  const basePrefix = site.value.base.replace(/\/$/, '')
  return basePrefix && (route.path === basePrefix || route.path.startsWith(`${basePrefix}/`))
    ? route.path.slice(basePrefix.length) || '/'
    : route.path
})
const pagePath = computed(() => pathWithoutBase.value.replace(localePrefix, '') || '/')
const currentLocale = computed(() => pathWithoutBase.value.match(localePrefix)?.[1] ?? 'pt-BR')
const switcherLabel = computed(() => ({
  'pt-BR': 'Selecionar idioma',
  'en-US': 'Select language',
  'es-ES': 'Seleccionar idioma',
  'fr-FR': 'Choisir la langue',
  'de-DE': 'Sprache auswählen',
  'it-IT': 'Seleziona la lingua',
  'ja-JP': '言語を選択',
  'zh-CN': '选择语言',
  'ko-KR': '언어 선택',
  'ru-RU': 'Выбрать язык',
  'hi-IN': 'भाषा चुनें',
  'id-ID': 'Pilih bahasa',
}[currentLocale.value] ?? 'Select language'))

const languages = [
  { code: 'pt-BR', prefix: '', label: 'Português (Brasil)' },
  { code: 'en-US', prefix: '/en-US', label: 'English' },
  { code: 'es-ES', prefix: '/es-ES', label: 'Español' },
  { code: 'fr-FR', prefix: '/fr-FR', label: 'Français' },
  { code: 'de-DE', prefix: '/de-DE', label: 'Deutsch' },
  { code: 'it-IT', prefix: '/it-IT', label: 'Italiano' },
  { code: 'ja-JP', prefix: '/ja-JP', label: '日本語' },
  { code: 'zh-CN', prefix: '/zh-CN', label: '简体中文' },
  { code: 'ko-KR', prefix: '/ko-KR', label: '한국어' },
  { code: 'ru-RU', prefix: '/ru-RU', label: 'Русский' },
  { code: 'hi-IN', prefix: '/hi-IN', label: 'हिन्दी' },
  { code: 'id-ID', prefix: '/id-ID', label: 'Bahasa Indonesia' },
]

function href(prefix: string) {
  const path = pagePath.value === '/' ? `${prefix}/` : `${prefix}${pagePath.value}`
  return withBase(path)
}

</script>

<template>
  <nav class="doc-language-switcher" :aria-label="switcherLabel">
    <select :aria-label="switcherLabel" :value="currentLocale"
      @change="router.go(href(languages.find(language => language.code === ($event.target as HTMLSelectElement).value)?.prefix ?? ''))">
      <option v-for="language in languages" :key="language.code" :value="language.code">{{ language.label }}</option>
    </select>
  </nav>
</template>
