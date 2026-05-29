// To add a new language:
// 1. Copy en.json to <locale>.json (e.g. de.json) and translate all values
// 2. Import it below and add it to the translations map
import en from './en.json'

const translations = {
  en,
}

export const availableLanguages = Object.keys(translations)

export function getTranslations(lang) {
  return translations[lang] ?? translations.en
}
