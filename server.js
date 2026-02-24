const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Добавить после: const io = socketIo(server, { ... });
// Увеличиваем лимиты для WebSocket
io.engine.maxHttpBufferSize = 1e6; // 1MB
io.engine.pingTimeout = 60000;
io.engine.pingInterval = 25000;

// Для Express - увеличиваем лимит JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// Добавьте в начало server.js после других импортов
const charactersData = [
  // Ваши данные персонажей
  {
    id: 1,
    name: 'Кхааса',
    race: 'Ящеролюд',
    class: 'Варвар',
    level: 1,
    experience: 0,
    stats: {
      strength: 17,
      durability: 12,
      agility: 5,
      intellect: 5
    },
    modifiers: {
      armorClass: 0,
      toHit: 0,
      spellSlots: 0
    },
    gold: 0,
    weapons: [
      { name: 'Большой топор', damage: '1d12+3', type: 'Рубящее' }
    ],
    equipment: [
      { name: 'Кожаный доспех', type: 'Броня' }
    ],
    inventory: [
      { name: 'Веревка', quantity: 1 },
      { name: 'Факелы', quantity: 5 }
    ],
    spells: [],
    quests: ['Найти древний артефакт'],
    notes: 'Сильный и выносливый воин',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Мексиагнун',
    race: 'Полуэльф',
    class: 'Маг/Таролог',
    level: 1,
    experience: 0,
    stats: {
      strength: 5,
      durability: 9,
      agility: 8,
      intellect: 17
    },
    modifiers: {
      armorClass: 0,
      toHit: 0,
      spellSlots: 0
    },
    gold: 0,
    weapons: [
      { name: 'Посох', damage: '1d6', type: 'Дробящее' }
    ],
    equipment: [
      { name: 'Роба мага', type: 'Одежда' }
    ],
    inventory: [
      { name: 'Книга заклинаний', quantity: 1 }
    ],
    spells: [
      { name: 'Предвидение', level: 1, slots: 1 }
    ],
    quests: ['Изучить древние пророчества'],
    notes: 'Мудрый маг, специализирующийся на предсказаниях',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Груэль',
    race: 'Бастанец',
    class: 'Вор-шептун',
    level: 1,
    experience: 0,
    stats: {
      strength: 7,
      durability: 9,
      agility: 17,
      intellect: 6
    },
    modifiers: {
      armorClass: 0,
      toHit: 0,
      spellSlots: 0
    },
    gold: 0,
    weapons: [
      { name: 'Короткий меч', damage: '1d6+3', type: 'Колющее' }
    ],
    equipment: [
      { name: 'Кожанка', type: 'Броня' }
    ],
    inventory: [
      { name: 'Отмычки', quantity: 1 }
    ],
    spells: [],
    quests: ['Узнать секреты гильдии воров'],
    notes: 'Тихий и незаметный вор',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Ульфост',
    race: 'Кхааса/Ульфен',
    class: 'Воин',
    level: 1,
    experience: 0,
    stats: {
      strength: 16,
      durability: 12,
      agility: 7,
      intellect: 4
    },
    modifiers: {
      armorClass: 0,
      toHit: 0,
      spellSlots: 0
    },
    gold: 0,
    weapons: [
      { name: 'Длинный меч', damage: '1d8+3', type: 'Рубящее' }
    ],
    equipment: [
      { name: 'Кольчуга', type: 'Броня' }
    ],
    inventory: [
      { name: 'Аптечка', quantity: 1 }
    ],
    spells: [],
    quests: ['Защищать границы королевства'],
    notes: 'Дисциплинированный воин',
    lastUpdated: new Date().toISOString()
  }
];

// Настройка статических файлов
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Хранение данных (в реальном приложении используйте БД)
const rollHistory = [];
const connectedUsers = new Map();

// Статистика сервера
const serverStats = {
  totalRolls: 0,
  totalUsers: 0,
  onlineUsers: 0,
  serverStarted: new Date().toISOString()
};

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для получения истории бросков
app.get('/api/rolls', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const diceType = req.query.diceType; // фильтр по типу кубика

  let filteredRolls = rollHistory;

  if (diceType) {
    filteredRolls = rollHistory.filter(roll =>
      roll.diceType === diceType || roll.sides === parseInt(diceType)
    );
  }

  res.json({
    rolls: filteredRolls.slice(offset, offset + limit),
    stats: serverStats,
    total: filteredRolls.length,
    filteredTotal: rollHistory.length
  });
});

// API для получения статистики
app.get('/api/stats', (req, res) => {
  // Аналитика по типам кубиков
  const diceStats = {};
  rollHistory.forEach(roll => {
    const key = `d${roll.sides}`;
    diceStats[key] = (diceStats[key] || 0) + 1;
  });

  res.json({
    ...serverStats,
    uptime: Date.now() - new Date(serverStats.serverStarted).getTime(),
    rollHistoryCount: rollHistory.length,
    diceStats: diceStats,
    mostActiveUser: getMostActiveUser(),
    recentActivity: rollHistory.slice(0, 10).map(r => ({
      user: r.user.username,
      roll: `${r.count}d${r.sides}`,
      total: r.total,
      time: r.timestamp
    }))
  });
});

// API для получения онлайн пользователей
app.get('/api/users/online', (req, res) => {
  const users = Array.from(connectedUsers.values()).map(user => ({
    ...user,
    isRolling: false // можно добавить флаг, что пользователь бросает кубики
  }));

  res.json({
    online: users,
    count: users.length
  });
});

app.get('/api/characters', (req, res) => {
  res.json({
    characters: charactersData,
    count: charactersData.length
  });
});

// API для сброса статистики (только для разработки)
app.delete('/api/reset', (req, res) => {
  // В продакшене это должно быть защищено авторизацией
  if (process.env.NODE_ENV === 'development') {
    const oldStats = { ...serverStats };

    rollHistory.length = 0;
    serverStats.totalRolls = 0;
    serverStats.totalUsers = 0;

    console.log('Статистика сброшена администратором');

    res.json({
      success: true,
      message: 'Статистика сброшена',
      oldStats: oldStats,
      newStats: serverStats
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Функция доступна только в режиме разработки'
    });
  }
});

// WebSocket соединения
io.on('connection', (socket) => {
  console.log('Новый пользователь подключился:', socket.id);

  // Создаем пользователя
  const user = {
    id: socket.id,
    username: `Игрок_${Math.floor(Math.random() * 1000)}`,
    color: getRandomColor(),
    avatar: getRandomAvatar(),
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    rollsCount: 0,
    sessionId: uuidv4()
  };

  connectedUsers.set(socket.id, user);
  serverStats.onlineUsers = connectedUsers.size;
  serverStats.totalUsers++;

  // Приветственное сообщение
  socket.emit('welcome', {
    message: 'Добро пожаловать на платформу бросков кубиков D&D!',
    user: user,
    stats: serverStats,
    serverInfo: {
      version: '2.0.0',
      features: ['3d-dice', 'real-time', 'multiplayer', 'chat'],
      uptime: Date.now() - new Date(serverStats.serverStarted).getTime()
    }
  });

  // Отправляем историю бросков
  socket.emit('rollHistory', {
    rolls: rollHistory.slice(0, 20),
    total: rollHistory.length,
    diceTypes: getDiceTypesStats()
  });

  // Отправляем список онлайн пользователей
  socket.emit('usersOnline', {
    users: Array.from(connectedUsers.values()),
    count: connectedUsers.size
  });

  // Уведомляем всех о новом пользователе
  socket.broadcast.emit('userJoined', {
    user: user,
    onlineCount: connectedUsers.size,
    message: `${user.username} присоединился к игре`,
    timestamp: new Date().toISOString()
  });

  // Обработка броска кубика
  socket.on('rollDice', (rollData) => {
    user.rollsCount++;
    user.lastSeen = new Date().toISOString();

    const roll = {
      id: uuidv4(),
      userId: socket.id,
      user: { ...user },
      ...rollData,
      timestamp: new Date().toISOString(),
      serverTime: new Date().toLocaleTimeString('ru-RU'),
      diceType: `d${rollData.sides}`
    };

    // Проверяем критические броски
    if (rollData.sides === 20 && rollData.results) {
      roll.isCritical = rollData.results.includes(20);
      roll.isCriticalFail = rollData.results.includes(1);
    }

    // Добавляем в историю
    rollHistory.unshift(roll);
    if (rollHistory.length > 1000) rollHistory.pop();

    // Обновляем статистику
    serverStats.totalRolls++;

    console.log(`Бросок от ${user.username}:`, {
      roll: `${rollData.count}d${rollData.sides}`,
      result: rollData.total,
      critical: roll.isCritical ? 'CRIT!' : roll.isCriticalFail ? 'FAIL!' : ''
    });

    // Уведомляем о начале анимации (для 3D)
    socket.broadcast.emit('userRolling', {
      userId: socket.id,
      username: user.username,
      dice: `${rollData.count}d${rollData.sides}`
    });

    // Отправляем результат всем пользователям
    io.emit('newRoll', {
      roll: roll,
      stats: serverStats,
      timestamp: new Date().toISOString()
    });

    // Отправляем подтверждение отправителю
    socket.emit('rollConfirmed', {
      rollId: roll.id,
      timestamp: roll.timestamp
    });
  });

  // Смена имени пользователя
  socket.on('changeUsername', (newUsername) => {
    const oldUsername = user.username;
    const sanitizedName = newUsername.substring(0, 20).trim() || oldUsername;

    // Проверяем уникальность имени
    const usernameExists = Array.from(connectedUsers.values())
      .some(u => u.id !== socket.id && u.username.toLowerCase() === sanitizedName.toLowerCase());

    if (usernameExists) {
      socket.emit('usernameChanged', {
        success: false,
        error: 'Это имя уже занято',
        oldUsername: oldUsername
      });
      return;
    }

    user.username = sanitizedName;
    user.lastSeen = new Date().toISOString();

    socket.emit('usernameChanged', {
      success: true,
      newUsername: user.username,
      oldUsername: oldUsername
    });

    // Обновляем у всех пользователей
    io.emit('userUpdated', {
      user: { ...user },
      message: `${oldUsername} сменил имя на ${user.username}`,
      timestamp: new Date().toISOString()
    });
  });

  // Быстрые сообщения (реакции)
  socket.on('quickMessage', (messageData) => {
    io.emit('newQuickMessage', {
      userId: socket.id,
      username: user.username,
      message: messageData.message,
      type: messageData.type || 'chat',
      timestamp: new Date().toISOString()
    });
  });

  // Обновление статуса (например, "бросает кубики")
  socket.on('updateStatus', (status) => {
    user.status = status;
    user.lastSeen = new Date().toISOString();

    socket.broadcast.emit('userStatusUpdated', {
      userId: socket.id,
      username: user.username,
      status: status,
      timestamp: new Date().toISOString()
    });
  });

  // Пинг для проверки подключения
  socket.on('ping', () => {
    socket.emit('pong', {
      time: new Date().toISOString(),
      serverTime: Date.now(),
      uptime: Date.now() - new Date(serverStats.serverStarted).getTime()
    });
  });

  // Отключение пользователя
  socket.on('disconnect', (reason) => {
    console.log(`Пользователь отключился: ${user.username} (${reason})`);

    connectedUsers.delete(socket.id);
    serverStats.onlineUsers = connectedUsers.size;

    // Уведомляем всех об отключении
    socket.broadcast.emit('userLeft', {
      user: { ...user },
      onlineCount: connectedUsers.size,
      message: `${user.username} покинул игру`,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('updateCharacter', (characterData) => {
    // Обработка обновления персонажа
    socket.broadcast.emit('characterUpdated', {
      character: characterData,
      updatedBy: socket.id
    });
  });

  // Обработка ошибок
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Вспомогательные функции
function getRandomColor() {
  const colors = [
    '#4361ee', '#3a56d4', '#06d6a0', '#ef476f', '#ffd166',
    '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#4cc9f0'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomAvatar() {
  const avatars = ['🎲', '⚔️', '🛡️', '🧙', '🐉', '🧝', '🧌', '🏹', '📜', '🔮'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

function getMostActiveUser() {
  const usersArray = Array.from(connectedUsers.values());
  if (usersArray.length === 0) return null;

  return usersArray.reduce((mostActive, user) => {
    return user.rollsCount > mostActive.rollsCount ? user : mostActive;
  }, usersArray[0]);
}

function getDiceTypesStats() {
  const stats = {};
  rollHistory.forEach(roll => {
    const key = `d${roll.sides}`;
    stats[key] = (stats[key] || 0) + 1;
  });
  return stats;
}

// Периодическая очистка старых данных (каждые 24 часа)
setInterval(() => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oldRollsCount = rollHistory.length;

  // Оставляем только броски за последние 24 часа
  const newRollHistory = rollHistory.filter(roll =>
    new Date(roll.timestamp) > oneDayAgo
  );

  if (newRollHistory.length < oldRollsCount) {
    rollHistory.length = 0;
    rollHistory.push(...newRollHistory);
    console.log(`Очищено ${oldRollsCount - newRollHistory.length} старых бросков`);
  }
}, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Добавьте эту строку!

server.listen(PORT, HOST, () => { // Добавьте HOST здесь
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Локальный доступ: http://localhost:${PORT}`);

  // Получаем все IP-адреса компьютера
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();

  console.log('\n🌐 Сетевые адреса для подключения:');
  Object.keys(networkInterfaces).forEach((iface) => {
    networkInterfaces[iface].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        console.log(`   http://${details.address}:${PORT}`);
        console.log(`   WebSocket: ws://${details.address}:${PORT}`);
      }
    });
  });

  console.log(`\n🎮 Версия: 2.0.0`);
  console.log(`📊 Статистика: http://localhost:${PORT}/api/stats`);
});