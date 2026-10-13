<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'

const route = useRoute()
const localePrefix = /^\/(en-US|es-ES|fr-FR|de-DE|it-IT|ja-JP|zh-CN)(?=\/|$)/
const pagePath = computed(() => route.path.replace(localePrefix, '') || '/')

const languages = [
  { code: 'pt-BR', prefix: '', flag: '🇧🇷', label: 'Português (Brasil)' },
  { code: 'en-US', prefix: '/en-US', flag: '🇺🇸', label: 'English' },
  { code: 'es-ES', prefix: '/es-ES', flag: '🇪🇸', label: 'Español' },
  { code: 'fr-FR', prefix: '/fr-FR', flag: '🇫🇷', label: 'Français' },
  { code: 'de-DE', prefix: '/de-DE', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'it-IT', prefix: '/it-IT', flag: '🇮🇹', label: 'Italiano' },
  { code: 'ja-JP', prefix: '/ja-JP', flag: '🇯🇵', label: '日本語' },
  { code: 'zh-CN', prefix: '/zh-CN', flag: '🇨🇳', label: '简体中文' },
]

function href(prefix: string) {
  const path = pagePath.value === '/' ? `${prefix}/` : `${prefix}${pagePath.value}`
  return withBase(path)
}

function isActive(code: string) {
  return code === 'pt-BR' ? !localePrefix.test(route.path) : route.path.startsWith(`/${code}/`)
}
</script>

<template>
  <nav class="doc-language-switcher" :aria-label="'Choose language'">
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
      <span aria-hidden="true">{{ language.flag }}</span>
      <span>{{ language.code.slice(0, 2).toUpperCase() }}</span>
    </a>
  </nav>
</template>
