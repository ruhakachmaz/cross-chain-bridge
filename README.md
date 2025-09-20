
# Cross-Chain Bridge

## Описание архитектуры

Мост реализован по классической схеме Lock-and-Mint:

1. **Token.sol** - ERC20 токен с функциями mint/burn, доступными только для авторизованных мостов
2. **Bridge.sol** - контракт моста, который:
   - Принимает токены от пользователя через `deposit()`
   - Сжигает их, уменьшая общее предложение
   - Создает событие `Transfer` для релеера
   - Минтит новые токены через `mint()` при получении подтверждения от релеера
3. **relay.js** - сервер-релеер, который:
   - Слушает события `Transfer` в исходной сети
   - Вызывает функцию `mint()` в целевой сети
   - Использует nonce для защиты от повторной обработки

### Схема работы:
```
Пользователь -> deposit() -> Bridge A -> burn() -> Event
                                                      ↓
Пользователь <- mint() <- Bridge B <- mint() <- Релеер
```

## Установка и запуск

### Требования:
- Node.js 18+
- npm

### Установка:
```bash
npm install
cd server && npm install && cd ..
```

### Компиляция контрактов:
```bash
npx hardhat compile
```

### Тестирование:
```bash
# Юнит-тесты
npx hardhat test

# Локальный тест полного цикла
npx hardhat run scripts/local-test.js
```

## Локальное тестирование

### 1. Запустите локальную сеть (терминал 1):
```bash
npx hardhat node
```

### 2. Деплой контрактов (терминал 2):
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Запустите релеер (терминал 2):
```bash
cd server
node relay.js
```

### 4. Выполните тестовый перевод (терминал 3):
```bash
npx hardhat run scripts/test-transfer.js --network localhost
```

## Деплой в тестовые сети

### Sepolia:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### BNB Testnet:
```bash
npx hardhat run scripts/deploy.js --network bnb
```

## Адреса контрактов

### Локальная сеть (Hardhat):
- Token: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Bridge A: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- Bridge B: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

### Sepolia (если задеплоено):
- Token: `[адрес после деплоя]`
- Bridge: `[адрес после деплоя]`

### BNB Testnet (если задеплоено):
- Token: `[адрес после деплоя]`
- Bridge: `[адрес после деплоя]`

## Тестовые транзакции

### Локальная сеть:
- Деплоер: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Пользователь: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Сумма перевода: 100 BTK
- Транзакция депозита: `0x1b64d499d7c8eb9da031bbbbdd25adcab349b472749195ce2c31b544e2abd18a`

## Результаты тестирования

✅ **Юнит-тесты**: 2/2 пройдено
- Перевод токенов через мост
- Защита от двойного минтинга

✅ **Локальное тестирование**: Успешно
- Токены сожжены в Bridge A
- Токены созданы в Bridge B
- Баланс пользователя восстановлен

## Безопасность

1. **Защита от повторной обработки**: использование nonce и mapping `processedNonces`
2. **Контроль доступа**: только owner может вызывать `mint()`
3. **Авторизация мостов**: только авторизованные мосты могут минтить токены

## Структура проекта

```
simple-bridge/
├── contracts/
│   ├── Token.sol         # ERC20 токен
│   └── Bridge.sol        # Контракт моста
├── scripts/
│   ├── deploy.js         # Скрипт деплоя
│   └── local-test.js     # Локальное тестирование
├── server/
│   └── relay.js          # Релеер
├── test/
│   └── test.js          # Юнит-тесты
├── deployments/         # Адреса контрактов
├── hardhat.config.js    # Конфигурация Hardhat
└── README.md           # Документация
```