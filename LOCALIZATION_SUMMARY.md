# Реализация локализации / Localization Implementation

## ✅ Что сделано / What's Done

### 1. Установлены пакеты / Packages Installed

- `i18next` - основная библиотека локализации
- `react-i18next` - React-интеграция для i18next
- `i18next-browser-languagedetector` - автоопределение языка браузера

### 2. Созданы файлы конфигурации / Configuration Files Created

#### `/src/i18n/config.ts`

Основная конфигурация i18next с настройками:

- Fallback язык: русский
- Автоматическое определение языка из localStorage и браузера
- Поддержка интерполяции

#### `/src/i18n/locales/ru.json`

Русский перевод со следующими разделами:

- `app` - название приложения
- `header` - навигация и меню
- `auth` - формы входа и регистрации
- `test` - страницы и функции тестирования
- `admin` - панель администратора
- `common` - общие элементы UI

#### `/src/i18n/locales/ko.json`

Корейский перевод (идентичная структура)

### 3. Обновлены компоненты / Updated Components

#### ✅ `Header.tsx`

- Добавлен импорт `useTranslation`
- Все текстовые элементы меню переведены
- Добавлен компонент `LanguageSwitcher`

#### ✅ `Login.tsx`

- Переведены заголовок, поля ввода, кнопки
- Переведены сообщения об ошибках

#### ✅ `Register.tsx`

- Переведены все элементы формы регистрации
- Переведены сообщения об ошибках

#### ✅ `TestList.tsx`

- Переведен заголовок страницы
- Переведены элементы карточек тестов

### 4. Создан компонент переключения языка / Language Switcher Component

#### `/src/components/LanguageSwitcher.tsx`

Кнопка переключения языка с выпадающим меню:

- 🇷🇺 Русский
- 🇰🇷 한국어
- Отображает текущий выбранный язык
- Сохраняет выбор в localStorage

### 5. Настроен TypeScript

- Добавлен `resolveJsonModule: true` в `tsconfig.app.json`
- Поддержка импорта JSON файлов

## 🔄 Что нужно доработать / TODO

### Компоненты требующие перевода:

- `TestRunner.tsx` и связанные компоненты
- `AdminCreateTest.tsx`
- `AdminEditTest.tsx`
- `AdminTestList.tsx`
- `AdminDashboard.tsx`
- `AdminResults.tsx`
- `MyHistory/index.tsx`
- `QuestionForm.tsx`

### Дополнительные улучшения:

1. Добавить переводы для всех сообщений валидации
2. Перевести сообщения об успехе/ошибке с сервера
3. Добавить переводы для дат и времени (форматирование)
4. Добавить переводы для элементов диалоговых окон

## 📖 Как использовать / How to Use

### В любом компоненте:

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t, i18n } = useTranslation();

  // Использовать перевод
  return <h1>{t("header.home")}</h1>;

  // Сменить язык программно
  i18n.changeLanguage("ko");

  // Получить текущий язык
  console.log(i18n.language);
}
```

### Переключатель языка уже встроен в Header

Пользователи могут менять язык через иконку глобуса в правом верхнем углу (когда залогинены).

## 🚀 Запуск / Running

```bash
cd client
npm run dev
```

Приложение запустится с поддержкой локализации. Язык автоматически определяется из:

1. Сохраненного выбора в localStorage
2. Языка браузера (если не сохранен)
3. Русского языка по умолчанию (fallback)

## 📝 Структура ключей переводов / Translation Keys Structure

```
app.title
header.home, header.history, header.admin, header.results, header.login, header.register, header.administrator, header.user
auth.email, auth.password, auth.login, auth.register, auth.loginTitle, auth.registerTitle
test.availableTests, test.start, test.question, test.noTests, test.loading, etc.
admin.dashboard, admin.createTest, admin.testName, admin.save, etc.
common.yes, common.no, common.ok, common.cancel, common.save, common.error, common.success
```
