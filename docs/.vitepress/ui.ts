const messages = {
  'pt-BR': ['Nesta página', 'Menu', 'Voltar ao topo', 'Ir para o conteúdo', 'Aparência', 'Usar tema claro', 'Usar tema escuro', 'Anterior', 'Próximo', 'Navegação principal', 'Mais opções', 'Pesquisar', 'Mostrar detalhes', 'Limpar pesquisa', 'Fechar pesquisa', 'Nenhum resultado para', 'selecionar', 'navegar'],
  'en-US': ['On this page', 'Menu', 'Return to top', 'Skip to content', 'Appearance', 'Switch to light theme', 'Switch to dark theme', 'Previous', 'Next', 'Main navigation', 'More options', 'Search', 'Show details', 'Reset search', 'Close search', 'No results for', 'select', 'navigate'],
  'es-ES': ['En esta página', 'Menú', 'Volver arriba', 'Ir al contenido', 'Apariencia', 'Usar tema claro', 'Usar tema oscuro', 'Anterior', 'Siguiente', 'Navegación principal', 'Más opciones', 'Buscar', 'Mostrar detalles', 'Limpiar búsqueda', 'Cerrar búsqueda', 'Sin resultados para', 'seleccionar', 'navegar'],
  'fr-FR': ['Sur cette page', 'Menu', 'Retour en haut', 'Aller au contenu', 'Apparence', 'Utiliser le thème clair', 'Utiliser le thème sombre', 'Précédent', 'Suivant', 'Navigation principale', 'Plus d’options', 'Rechercher', 'Afficher les détails', 'Effacer la recherche', 'Fermer la recherche', 'Aucun résultat pour', 'sélectionner', 'naviguer'],
  'de-DE': ['Auf dieser Seite', 'Menü', 'Nach oben', 'Zum Inhalt', 'Darstellung', 'Helles Design verwenden', 'Dunkles Design verwenden', 'Zurück', 'Weiter', 'Hauptnavigation', 'Weitere Optionen', 'Suchen', 'Details anzeigen', 'Suche zurücksetzen', 'Suche schließen', 'Keine Ergebnisse für', 'auswählen', 'navigieren'],
  'it-IT': ['In questa pagina', 'Menu', 'Torna in alto', 'Vai al contenuto', 'Aspetto', 'Usa tema chiaro', 'Usa tema scuro', 'Precedente', 'Successivo', 'Navigazione principale', 'Altre opzioni', 'Cerca', 'Mostra dettagli', 'Cancella ricerca', 'Chiudi ricerca', 'Nessun risultato per', 'seleziona', 'naviga'],
  'ja-JP': ['このページ', 'メニュー', '先頭へ戻る', '本文へ移動', '表示', 'ライトテーマに切替', 'ダークテーマに切替', '前へ', '次へ', 'メインナビゲーション', 'その他の操作', '検索', '詳細を表示', '検索をクリア', '検索を閉じる', '検索結果なし', '選択', '移動'],
  'zh-CN': ['本页内容', '菜单', '返回顶部', '跳至内容', '外观', '使用浅色主题', '使用深色主题', '上一页', '下一页', '主导航', '更多选项', '搜索', '显示详情', '清除搜索', '关闭搜索', '没有匹配结果', '选择', '导航'],
  'ko-KR': ['이 페이지', '메뉴', '맨 위로', '본문으로 이동', '외관', '밝은 테마 사용', '어두운 테마 사용', '이전', '다음', '주 탐색', '추가 옵션', '검색', '상세 보기', '검색 지우기', '검색 닫기', '검색 결과 없음', '선택', '이동'],
  'ru-RU': ['На этой странице', 'Меню', 'Наверх', 'К содержимому', 'Оформление', 'Светлая тема', 'Тёмная тема', 'Назад', 'Далее', 'Основная навигация', 'Другие действия', 'Поиск', 'Показать подробности', 'Очистить поиск', 'Закрыть поиск', 'Нет результатов для', 'выбрать', 'перейти'],
  'hi-IN': ['इस पृष्ठ पर', 'मेनू', 'ऊपर लौटें', 'सामग्री पर जाएँ', 'रूप', 'हल्का रूप चुनें', 'गहरा रूप चुनें', 'पिछला', 'अगला', 'मुख्य नेविगेशन', 'अधिक विकल्प', 'खोजें', 'विवरण दिखाएँ', 'खोज साफ़ करें', 'खोज बंद करें', 'कोई परिणाम नहीं', 'चुनें', 'आगे जाएँ'],
  'id-ID': ['Di halaman ini', 'Menu', 'Kembali ke atas', 'Ke konten', 'Tampilan', 'Gunakan tema terang', 'Gunakan tema gelap', 'Sebelumnya', 'Berikutnya', 'Navigasi utama', 'Opsi lainnya', 'Cari', 'Tampilkan detail', 'Hapus pencarian', 'Tutup pencarian', 'Tidak ada hasil untuk', 'pilih', 'navigasi'],
} as const

export function localeUi(locale: keyof typeof messages) {
  const [outline, menu, top, skip, appearance, light, dark, prev, next, navigation, more] = messages[locale]
  return {
    outline: { label: outline },
    sidebarMenuLabel: menu,
    mobileMenuLabel: menu,
    returnToTopLabel: top,
    skipToContentLabel: skip,
    darkModeSwitchLabel: appearance,
    lightModeSwitchTitle: light,
    darkModeSwitchTitle: dark,
    docFooter: { prev, next },
    navMenuLabel: navigation,
    extraMenuLabel: more,
  }
}

export const searchLocales = Object.fromEntries(Object.entries(messages).map(([locale, text]) => {
  const [, , , , , , , , , , , search, details, reset, close, noResults, select, navigate] = text
  return [locale === 'pt-BR' ? 'root' : locale, {
    translations: {
      button: { buttonText: search, buttonAriaLabel: search },
      modal: {
        displayDetails: details,
        resetButtonTitle: reset,
        backButtonTitle: close,
        noResultsText: noResults,
        footer: {
          selectText: select, selectKeyAriaLabel: 'Enter',
          navigateText: navigate, navigateUpKeyAriaLabel: '↑', navigateDownKeyAriaLabel: '↓',
          closeText: close, closeKeyAriaLabel: 'Esc',
        },
      },
    },
  }]
}))

export const localeDescriptions = {
  "pt-BR": "O GreenER ajuda a acompanhar aplicações e compreender seu consumo estimado de energia e suas emissões equivalentes de dióxido de carbono (CO₂e). Reúne indicadores, localização e histórico para apoiar a análise do impacto ambiental de serviços digitais.",
  "en-US": "GreenER helps monitor applications and understand their estimated energy consumption and carbon dioxide equivalent emissions (CO₂e). It brings together indicators, location and history to support assessment of the environmental impact of digital services.",
  "es-ES": "GreenER ayuda a monitorizar aplicaciones y comprender su consumo estimado de energía y sus emisiones equivalentes de dióxido de carbono (CO₂e). Reúne indicadores, ubicación e historial para analizar el impacto ambiental de los servicios digitales.",
  "fr-FR": "GreenER aide à suivre les applications et à comprendre leur consommation d’énergie estimée et leurs émissions équivalentes de dioxyde de carbone (CO₂e). Indicateurs, localisation et historique permettent d’étudier l’impact environnemental des services numériques.",
  "de-DE": "GreenER unterstützt die Überwachung von Anwendungen und das Verständnis ihres geschätzten Energieverbrauchs und ihrer Kohlendioxidäquivalent-Emissionen (CO₂e). Kennzahlen, Standort und Verlauf helfen, die Umweltwirkung digitaler Dienste zu untersuchen.",
  "it-IT": "GreenER aiuta a monitorare applicazioni e comprendere consumi energetici stimati ed emissioni equivalenti di anidride carbonica (CO₂e). Riunisce indicatori, posizione e storico per analizzare l’impatto ambientale dei servizi digitali.",
  "ja-JP": "GreenERはアプリを監視し、推定エネルギー消費と二酸化炭素換算排出量（CO₂e）を理解するための製品です。指標、所在地、履歴をまとめ、デジタルサービスの環境影響を調べる際に役立ちます。",
  "zh-CN": "GreenER帮助监控应用，理解其估算能源消耗及二氧化碳当量排放（CO₂e）。它汇集指标、位置和历史，支持分析数字服务的环境影响。",
  "ko-KR": "GreenER는 애플리케이션을 모니터링하고 추정 에너지 소비와 이산화탄소 환산 배출량(CO₂e)을 이해하도록 돕습니다. 지표, 위치, 이력을 모아 디지털 서비스의 환경 영향을 분석합니다.",
  "ru-RU": "GreenER помогает отслеживать приложения и понимать их оценённое потребление энергии и выбросы в эквиваленте углекислого газа (CO₂e). Показатели, расположение и история помогают анализировать экологическое воздействие цифровых сервисов.",
  "hi-IN": "GreenER अनुप्रयोगों की निगरानी और उनके अनुमानित ऊर्जा उपयोग तथा कार्बन डाइऑक्साइड समतुल्य उत्सर्जन (CO₂e) को समझने में मदद करता है। संकेतक, स्थान और इतिहास मिलकर डिजिटल सेवाओं के पर्यावरण प्रभाव का विश्लेषण करते हैं।",
  "id-ID": "GreenER membantu memantau aplikasi dan memahami estimasi konsumsi energi serta emisi setara karbon dioksida (CO₂e). Indikator, lokasi dan riwayat mendukung analisis dampak lingkungan layanan digital."
} as const
