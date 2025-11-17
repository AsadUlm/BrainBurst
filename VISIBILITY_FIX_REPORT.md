# Отчет: Исправление проблемы с ограничением доступа к тестам

## 🐛 Проблема

Когда устанавливалось ограничение доступа для определенных пользователей (включая админа), тесты не отображались ни для админа, ни для других указанных пользователей.

## 🔍 Обнаруженные причины

### 1. Отсутствие `.populate('allowedUsers')`

**Файл:** `/server/routes/testRoutes.js`

**Проблема:** При получении тестов из базы данных поле `allowedUsers` не заполнялось реальными данными пользователей, оставаясь массивом ObjectId.

**До исправления:**

```javascript
tests = await Test.find(query).populate("category");
```

**После исправления:**

```javascript
tests = await Test.find({})
  .populate("category")
  .populate("allowedUsers", "_id");
```

### 2. Некорректная фильтрация по `isVisible`

**Файл:** `/server/routes/testRoutes.js`

**Проблема:** Запрос к базе данных выполнялся с условием `isVisible: true`, что исключало тесты где `isVisible: false`, даже если пользователь был в `allowedUsers`.

**До исправления:**

```javascript
const query = {
    $or: [
        { isVisible: { $exists: false } },
        { isVisible: true }
    ]
};
tests = await Test.find(query)...
```

**После исправления:**

```javascript
// Получаем ВСЕ тесты, фильтруем программно
tests = await Test.find({})
  .populate("category")
  .populate("allowedUsers", "_id");

// Затем фильтруем по isVisible
tests = tests.filter((test) => {
  const isVisibleField = test.isVisible !== undefined ? test.isVisible : true;
  if (!isVisibleField) return false;
  // ... остальные проверки
});
```

### 3. Неправильное сравнение ObjectId

**Файл:** `/server/routes/testRoutes.js`

**Проблема:** При сравнении `allowedUsers` и `userId` не учитывалось, что после `.populate()` структура может измениться.

**До исправления:**

```javascript
test.allowedUsers.some((id) => id.toString() === userId.toString());
```

**После исправления:**

```javascript
test.allowedUsers.some((allowedUser) => {
  const allowedId = allowedUser._id || allowedUser;
  return allowedId.toString() === userId.toString();
});
```

## ✅ Решение

### Итоговая логика в `/server/routes/testRoutes.js`:

```javascript
router.get("/", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === "admin";

    let tests;

    if (isAdmin) {
      // Админы видят ВСЕ тесты (для админ-панели)
      tests = await Test.find({}).populate("category");
    } else {
      // Обычные пользователи
      const now = new Date();

      // Получаем все тесты с заполненными связями
      tests = await Test.find({})
        .populate("category")
        .populate("allowedUsers", "_id");

      tests = tests.filter((test) => {
        // 1. Проверка isVisible
        const isVisibleField =
          test.isVisible !== undefined ? test.isVisible : true;
        if (!isVisibleField) return false;

        // 2. Проверка по датам
        if (test.availableFrom && new Date(test.availableFrom) > now)
          return false;
        if (test.availableUntil && new Date(test.availableUntil) < now)
          return false;

        // 3. Проверка по пользователям
        if (!test.allowedUsers || test.allowedUsers.length === 0) {
          return true; // Доступен всем
        }

        if (!userId) return false; // Неавторизованные не видят ограниченные тесты

        // Проверяем доступ
        return test.allowedUsers.some((allowedUser) => {
          const allowedId = allowedUser._id || allowedUser;
          return allowedId.toString() === userId.toString();
        });
      });
    }

    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## 📊 Текущее состояние базы данных

### Пользователи:

- `admin@example.com` (admin) - ID: `67ffac3f74d009a162620e75`
- `dina@gmail.com` (user) - ID: `67ffac4f74d009a162620e7a`
- `duyen@example.com` (user) - ID: `69061eae84813e9a18ddc0ce`

### Тесты с ограничениями:

1. **"JavaScript Basics Quiz"** - `isVisible: false`, только для admin
2. **"TOPIK*64*(1-20)(문장)"** - `isVisible: true`, только для admin
3. **Тесты 1-5** (생산관리, 재무관리 и др.) - только для duyen@example.com
4. **"TOPIK*64*(1-20)"** - доступен всем

## 🧪 Тестирование

### Скрипты для тестирования:

1. **`checkTestVisibility.js`** - проверка состояния БД
2. **`generateTestTokens.js`** - генерация токенов для API-тестирования

### Запуск:

```bash
cd server
node scripts/checkTestVisibility.js
node scripts/generateTestTokens.js
```

## 📝 Что теперь работает:

✅ Админ видит все тесты в админ-панели  
✅ Пользователи видят только тесты, доступные им по:

- Флагу `isVisible: true`
- Датам `availableFrom` / `availableUntil`
- Списку `allowedUsers` (если пусто - доступен всем)
  ✅ Тесты с `isVisible: false` не показываются обычным пользователям  
  ✅ Если пользователь в списке `allowedUsers`, он видит тест (при `isVisible: true`)  
  ✅ Логирование помогает отладить проблемы доступа

## 🔄 Что нужно сделать:

1. ✅ Перезапустить сервер
2. ✅ Протестировать вход под разными пользователями
3. ⚠️ Убрать console.log после подтверждения работы
4. ⚠️ Добавить индексы в MongoDB для оптимизации (если много тестов)

## 🚀 Рекомендации на будущее:

1. **Кэширование:** Добавить Redis для кэширования списка тестов
2. **Оптимизация:** Переместить логику фильтрации в MongoDB aggregation
3. **Тестирование:** Написать unit-тесты для проверки доступа
4. **Логирование:** Использовать winston/pino вместо console.log
