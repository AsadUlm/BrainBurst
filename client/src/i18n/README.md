# Локализация / Localization

Проект использует i18next для поддержки нескольких языков.
This project uses i18next for multi-language support.

## Поддерживаемые языки / Supported Languages

- 🇷🇺 Русский (ru) - по умолчанию / default
- 🇰🇷 한국어 (ko)

## Как использовать / How to use

### В компонентах / In components

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("header.home")}</h1>
      <p>{t("test.availableTests")}</p>
    </div>
  );
}
```

### Смена языка / Change language

Используйте компонент `LanguageSwitcher` в хедере или программно:
Use the `LanguageSwitcher` component in the header or programmatically:

```tsx
import { useTranslation } from "react-i18next";

const { i18n } = useTranslation();
i18n.changeLanguage("ko"); // Переключить на корейский / Switch to Korean
i18n.changeLanguage("ru"); // Переключить на русский / Switch to Russian
```

## Структура файлов переводов / Translation file structure

```
src/i18n/
  ├── config.ts           # Конфигурация i18next
  └── locales/
      ├── ru.json        # Русские переводы
      └── ko.json        # Корейские переводы
```

## Добавление новых переводов / Adding new translations

1. Откройте файлы `src/i18n/locales/ru.json` и `ko.json`
2. Добавьте новый ключ и его переводы в оба файла
3. Используйте ключ в компоненте с помощью функции `t()`

Example:

```json
{
  "mySection": {
    "myKey": "Мой текст"
  }
}
```

```tsx
{
  t("mySection.myKey");
}
```

## Интерполяция / Interpolation

Вы можете использовать переменные в переводах:
You can use variables in translations:

```json
{
  "welcome": "Добро пожаловать, {{name}}!"
}
```

```tsx
{
  t("welcome", { name: "Иван" });
}
```

## Текущая реализация / Current Implementation

### Переведенные компоненты / Translated Components:

- ✅ Header (меню, навигация)
- ✅ Login (форма входа)
- 🔄 Register (требует перевода)
- 🔄 TestList (требует перевода)
- 🔄 TestRunner (требует перевода)
- 🔄 Admin pages (требует перевода)

### Следующие шаги / Next Steps:

1. Добавить переводы во все оставшиеся страницы
2. Перевести сообщения об ошибках
3. Перевести уведомления
4. Добавить переводы для валидации форм
