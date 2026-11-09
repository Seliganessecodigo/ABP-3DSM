<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

const { site } = useData()
const route = useRoute()
const menu = ref<HTMLDetailsElement | null>(null)
const fragment = ref('')
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
  { code: 'pt-BR', prefix: '', flag: 'br', label: 'Português (Brasil)' },
  { code: 'en-US', prefix: '/en-US', flag: 'us', label: 'English' },
  { code: 'es-ES', prefix: '/es-ES', flag: 'es', label: 'Español' },
  { code: 'fr-FR', prefix: '/fr-FR', flag: 'fr', label: 'Français' },
  { code: 'de-DE', prefix: '/de-DE', flag: 'de', label: 'Deutsch' },
  { code: 'it-IT', prefix: '/it-IT', flag: 'it', label: 'Italiano' },
  { code: 'ja-JP', prefix: '/ja-JP', flag: 'jp', label: '日本語' },
  { code: 'zh-CN', prefix: '/zh-CN', flag: 'cn', label: '简体中文' },
  { code: 'ko-KR', prefix: '/ko-KR', flag: 'kr', label: '한국어' },
  { code: 'ru-RU', prefix: '/ru-RU', flag: 'ru', label: 'Русский' },
  { code: 'hi-IN', prefix: '/hi-IN', flag: 'in', label: 'हिन्दी' },
  { code: 'id-ID', prefix: '/id-ID', flag: 'id', label: 'Bahasa Indonesia' },
]
const selectedLanguage = computed(() => languages.find(language => language.code === currentLocale.value) ?? languages[0])

function href(prefix: string) {
  const path = pagePath.value === '/' ? `${prefix}/` : `${prefix}${pagePath.value}`
  return withBase(path) + fragment.value
}

function syncFragment() {
  fragment.value = window.location.hash
}

function closeMenu(event?: Event) {
  if (event?.type === 'click' && menu.value?.contains(event.target as Node)) return
  if (menu.value) menu.value.open = false
}

function dismissMenu() {
  closeMenu()
  menu.value?.querySelector('summary')?.focus()
}

onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))
</script>

<template>
  <nav class="doc-language-switcher" :aria-label="switcherLabel">
    <details ref="menu" @toggle="syncFragment" @keydown.esc.prevent="dismissMenu">
      <summary :aria-label="switcherLabel" @click="syncFragment">
        <img :src="withBase(`/flags/${selectedLanguage.flag}.svg`)" alt="" width="20" height="15">
        <span>{{ selectedLanguage.label }}</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <ul>
        <li v-for="language in languages" :key="language.code">
          <a :href="href(language.prefix)" :lang="language.code"
            :aria-current="language.code === currentLocale ? 'page' : undefined"
            @click="closeMenu()">
            <img :src="withBase(`/flags/${language.flag}.svg`)" alt="" width="20" height="15">
            <span>{{ language.label }}</span>
          </a>
        </li>
      </ul>
    </details>
  </nav>
</template>
