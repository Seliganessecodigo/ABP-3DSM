<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

const { site } = useData()
const route = useRoute()
const localePrefix = /^\/(en-US|es-ES|fr-FR|de-DE|it-IT|ja-JP|zh-CN)(?=\/|$)/
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
}[currentLocale.value] ?? 'Select language'))

const languages = [
  { code: 'pt-BR', prefix: '', flag: 'br', label: 'Português (Brasil)' },
  { code: 'en-US', prefix: '/en-US', flag: 'us', label: 'English' },
  { code: 'es-ES', prefix: '/es-ES', flag: 'es', label: 'Español' },
  { code: 'fr-FR', prefix: '/fr-FR', flag: 'fr', label: 'Français' },
  { code: 'de-DE', prefix: '/de-DE', flag: 'de', label: 'Deutsch' },
  { code: 'it-IT', prefix: '/it-IT', flag: 'it', label: 'Italiano' },
  { code: 'ja-JP', prefix: '/ja-JP', flag: 'jp', label: '日本語' },
  { code: 'zh-CN', prefix: '/zh-CN', flag: 'cn', label: '简体中文' },
]

function href(prefix: string) {
  const path = pagePath.value === '/' ? `${prefix}/` : `${prefix}${pagePath.value}`
  return withBase(path)
}

function isActive(code: string) {
  return code === 'pt-BR' ? !localePrefix.test(pathWithoutBase.value) : pathWithoutBase.value.startsWith(`/${code}/`)
}
</script>

<template>
  <nav class="doc-language-switcher" :aria-label="switcherLabel">
    <a
      v-for="language in languages"
      :key="language.code"
      class="doc-language-switcher__item"
      :class="{ 'is-active': isActive(language.code) }"
      :href="href(language.prefix)"
      :aria-label="language.label"
      :aria-current="isActive(language.code) ? 'page' : undefined"
      :title="language.label"
    >
      <img class="doc-language-switcher__flag" :src="withBase(`/flags/${language.flag}.svg`)" alt="" aria-hidden="true" width="18" height="14">
      <span>{{ language.code.slice(0, 2).toUpperCase() }}</span>
    </a>
  </nav>
</template>
