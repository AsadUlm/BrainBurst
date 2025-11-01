// Type definitions for i18next
import 'react-i18next';
import ru from './locales/ru.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof ru;
    };
  }
}
