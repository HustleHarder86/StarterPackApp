// i18n/translations.js
const translations = {
  en: {
    welcome: "Welcome to InvestorProps",
    analyzeProperty: "Analyze Property",
    // ...
  },
  es: {
    welcome: "Bienvenido a InvestorProps",
    analyzeProperty: "Analizar Propiedad",
    // ...
  },
  fr: {
    welcome: "Bienvenue à InvestorProps",
    analyzeProperty: "Analyser la Propriété",
    // ...
  }
};

// utils/i18n.js
class I18n {
  constructor() {
    this.locale = localStorage.getItem('locale') || 'en';
  }
  
  t(key) {
    return translations[this.locale]?.[key] || translations.en[key] || key;
  }
}
