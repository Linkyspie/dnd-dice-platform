// Основной модуль приложения
document.addEventListener('DOMContentLoaded', function () {
    console.log('D&D Dice Platform загружается...');

    // Инициализация всех модулей
    DiceApp.init();
    setTimeout(() => {
        if (typeof CharacterManager !== 'undefined') {
            CharacterManager.init();
            console.log('🎮 Модуль персонажей инициализирован');
        }
    }, 2000);
});

// Основное приложение
const DiceApp = (function () {
    // Состояние приложения
    const state = {
        socket: null,
        currentUser: null,
        connected: false,
        users: new Map(),
        rolls: [],
        currentFilter: 'all',
        autoScroll: true,
        notificationId: 0
    };

    // Инициализация приложения
    function init() {
        console.log('Инициализация DiceApp...');

        // Инициализация WebSocket
        initSocket();

        // Инициализация UI компонентов
        initDiceControls();
        initCustomRoll();
        initQuickActions();
        initUsernameModal();
        initChatButtons();
        initLogFilters();
        initLogControls();
        initAbilityChecks();

        // Настройка горячих клавиш
        initHotkeys();

        // Показать уведомление
        showNotification('Приложение загружено. Подключение к серверу...', 'info');
    }

    // ==================== WEB SOCKET ====================
    function initSocket() {
        // Определяем URL сервера
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
        const serverUrl = isLocalhost
            ? 'http://localhost:3000'
            : window.location.origin;

        // Показываем URL сервера
        document.getElementById('server-url').textContent = serverUrl.replace('http', 'ws');

        // Подключаемся к серверу
        console.log('Подключение к серверу:', serverUrl);
        state.socket = io(serverUrl);

        // Обработчики событий
        state.socket.on('connect', onConnect);
        state.socket.on('disconnect', onDisconnect);
        state.socket.on('welcome', onWelcome);
        state.socket.on('rollHistory', onRollHistory);
        state.socket.on('usersOnline', onUsersOnline);
        state.socket.on('newRoll', onNewRoll);
        state.socket.on('userJoined', onUserJoined);
        state.socket.on('userLeft', onUserLeft);
        state.socket.on('userUpdated', onUserUpdated);
        state.socket.on('usernameChanged', onUsernameChanged);
        state.socket.on('pong', onPong);

        // Пинг каждые 30 секунд для поддержания соединения
        setInterval(() => {
            if (state.connected && state.socket) {
                state.socket.emit('ping');
            }
        }, 30000);
    }

    function onConnect() {
        console.log('✅ Подключено к серверу WebSocket');
        state.connected = true;
        updateConnectionStatus(true);
        showNotification('Подключено к серверу', 'success');
    }

    function onDisconnect() {
        console.log('❌ Отключено от сервера');
        state.connected = false;
        updateConnectionStatus(false);
        showNotification('Соединение потеряно. Попытка переподключения...', 'warning');
    }

    function onWelcome(data) {
        console.log('Приветственное сообщение:', data);
        state.currentUser = data.user;
        updateUserDisplay();
        updateStats(data.stats);
        showNotification(`Добро пожаловать, ${data.user.username}!`, 'success');

        // Сохраняем ID подключения
        document.getElementById('connection-id').textContent = state.socket.id.substring(0, 8);
    }

    function onRollHistory(data) {
        console.log('Получена история бросков:', data.total);
        document.getElementById('log-count').textContent = data.total;

        // Отображаем историю
        if (data.rolls && data.rolls.length > 0) {
            data.rolls.forEach(roll => {
                addRollToGlobalLog(roll);
            });
        }
    }

    function onUsersOnline(data) {
        console.log('Пользователи онлайн:', data.count);
        updateUsersList(data.users);
        document.getElementById('users-count').textContent = data.count;
        updateLastUpdateTime();
    }

    function onNewRoll(data) {
        console.log('Новый бросок:', data.roll);
        addRollToGlobalLog(data.roll);
        updateStats(data.stats);

        // Если это наш бросок, показываем анимацию
        if (data.roll.userId === state.socket.id) {
            displayDiceAnimation(data.roll);
        }

        // Обновляем время последнего обновления
        updateLastUpdateTime();
    }

    function onUserJoined(data) {
        console.log('Пользователь присоединился:', data.user.username);
        addUserToList(data.user);
        updateOnlineCount(data.onlineCount);

        if (data.message) {
            showNotification(data.message, 'info');
        }
    }

    function onUserLeft(data) {
        console.log('Пользователь вышел:', data.user.username);
        removeUserFromList(data.user.id);
        updateOnlineCount(data.onlineCount);

        if (data.message) {
            showNotification(data.message, 'info');
        }
    }

    function onUserUpdated(data) {
        console.log('Пользователь обновлён:', data.user);
        updateUserInList(data.user);

        if (data.message) {
            showNotification(data.message, 'info');
        }
    }

    function onUsernameChanged(data) {
        console.log('Имя пользователя изменено:', data);
        if (data.success) {
            state.currentUser.username = data.newUsername;
            updateUserDisplay();
            showNotification('Имя успешно изменено!', 'success');
        }
    }

    function onPong(data) {
        console.log('Pong от сервера:', data.time);
    }

    // ==================== UI ОБНОВЛЕНИЯ ====================
    function updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connection-status');
        if (connected) {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> Подключено';
            statusEl.className = 'status-online';
        } else {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> Отключено';
            statusEl.className = 'status-offline';
        }
    }

    function updateUserDisplay() {
        const usernameEl = document.getElementById('username');
        const avatarEl = document.getElementById('user-avatar');

        if (state.currentUser) {
            usernameEl.textContent = state.currentUser.username;
            avatarEl.textContent = state.currentUser.username.charAt(0).toUpperCase();
            avatarEl.style.background = state.currentUser.color;
        }
    }

    function updateStats(stats) {
        document.getElementById('total-rolls').textContent = stats.totalRolls;
        document.getElementById('online-count').textContent = stats.onlineUsers;
    }

    function updateOnlineCount(count) {
        document.getElementById('online-count').textContent = count;
        document.getElementById('users-count').textContent = count;
    }

    function updateLastUpdateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('last-update').textContent = timeStr;
    }

    // ==================== УПРАВЛЕНИЕ БРОСКАМИ ====================
    function initDiceControls() {
        const diceButtons = document.querySelectorAll('.dice-btn');
        diceButtons.forEach(button => {
            button.addEventListener('click', function () {
                const sides = parseInt(this.getAttribute('data-sides'));
                const modifier = parseInt(document.getElementById('modifier').value) || 0;
                rollDiceLocal(sides, 1, modifier);
            });
        });
    }

    function initCustomRoll() {
        const customRollBtn = document.getElementById('custom-roll-btn');
        const modifierControls = document.querySelectorAll('.mod-btn');

        customRollBtn.addEventListener('click', () => {
            const diceCount = parseInt(document.getElementById('dice-count').value) || 1;
            const diceSides = parseInt(document.getElementById('dice-sides').value) || 6;
            const modifier = parseInt(document.getElementById('modifier').value) || 0;

            if (validateRollInput(diceCount, diceSides)) {
                rollDiceLocal(diceSides, diceCount, modifier);
            }
        });

        modifierControls.forEach(button => {
            button.addEventListener('click', function () {
                const change = parseInt(this.getAttribute('data-change'));
                const modifierInput = document.getElementById('modifier');
                const currentValue = parseInt(modifierInput.value) || 0;
                const newValue = currentValue + change;

                // Ограничиваем диапазон
                if (newValue >= -100 && newValue <= 100) {
                    modifierInput.value = newValue;
                }
            });
        });
    }

    function initQuickActions() {
        document.getElementById('roll-advantage').addEventListener('click', () => {
            rollAdvantageDisadvantage('advantage');
        });

        document.getElementById('roll-disadvantage').addEventListener('click', () => {
            rollAdvantageDisadvantage('disadvantage');
        });

        document.getElementById('roll-initiative').addEventListener('click', () => {
            const modifier = parseInt(document.getElementById('modifier').value) || 0;
            rollDiceLocal(20, 1, modifier);
            showNotification('Бросок инициативы выполнен!', 'info');
        });

        document.getElementById('clear-local').addEventListener('click', () => {
            if (confirm('Очистить локальный лог бросков?')) {
                clearLocalLog();
            }
        });
    }

    function validateRollInput(count, sides) {
        if (count < 1 || count > 10) {
            showNotification('Количество кубиков должно быть от 1 до 10', 'error');
            return false;
        }
        if (sides < 2 || sides > 100) {
            showNotification('Количество граней должно быть от 2 до 100', 'error');
            return false;
        }
        return true;
    }

    function rollDiceLocal(sides, count = 1, modifier = 0) {
        // Генерируем результаты
        const results = [];
        let total = 0;

        for (let i = 0; i < count; i++) {
            const result = Math.floor(Math.random() * sides) + 1;
            results.push(result);
            total += result;
        }

        total += modifier;

        // Создаём объект броска
        const rollData = {
            type: 'standard',
            dice: results.map(r => ({ sides, result: r })),
            count,
            sides,
            modifier,
            results,
            total,
            timestamp: new Date().toISOString()
        };

        // Отправляем на сервер
        sendRollToServer(rollData);

        // Показываем анимацию локально
        displayDiceAnimationLocal(results, sides, modifier, total);

        return { results, total };
    }

    function sendRollToServer(rollData) {
        if (!state.connected || !state.socket) {
            showNotification('Нет подключения к серверу. Бросок сохранён локально.', 'warning');
            addRollToLocalLog(rollData);
            return false;
        }

        state.socket.emit('rollDice', rollData);
        return true;
    }

    function rollAdvantageDisadvantage(type) {
        const modifier = parseInt(document.getElementById('modifier').value) || 0;

        // Бросаем 2d20
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;

        // Определяем результат
        let result, selectedRoll;
        if (type === 'advantage') {
            result = Math.max(roll1, roll2);
            selectedRoll = result === roll1 ? 1 : 2;
        } else {
            result = Math.min(roll1, roll2);
            selectedRoll = result === roll1 ? 1 : 2;
        }

        const total = result + modifier;

        // Создаём объект броска
        const rollData = {
            type: type,
            dice: [
                { sides: 20, result: roll1 },
                { sides: 20, result: roll2 }
            ],
            count: 2,
            sides: 20,
            modifier,
            results: [roll1, roll2],
            total,
            selectedRoll,
            timestamp: new Date().toISOString()
        };

        // Отправляем на сервер
        sendRollToServer(rollData);

        // Показываем анимацию
        displayAdvantageAnimation(roll1, roll2, selectedRoll, type, total);
    }

    // ==================== АНИМАЦИИ ====================
    function displayDiceAnimationLocal(results, sides, modifier, total) {
        const container = document.getElementById('dice-container');
        const currentRoller = document.getElementById('current-roller');
        const currentTotal = document.getElementById('current-total');
        const resultDetails = document.getElementById('result-details');

        // Очищаем контейнер
        container.innerHTML = '';

        // Создаём кубики
        results.forEach((result, index) => {
            const dice = document.createElement('div');
            dice.className = 'dice';
            dice.textContent = result;

            // Добавляем классы для критических бросков
            if (sides === 20) {
                if (result === 20) {
                    dice.classList.add('critical');
                } else if (result === 1) {
                    dice.classList.add('critical-fail');
                }
            }

            dice.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(dice);
        });

        // Обновляем информацию о результате
        currentRoller.textContent = state.currentUser ? `Вы бросили` : 'Локальный бросок';
        currentTotal.textContent = total;

        // Формируем детали
        let details = `<div>Бросок: ${results.length}d${sides}`;
        if (modifier !== 0) {
            details += ` ${modifier > 0 ? '+' : ''}${modifier}`;
        }
        details += `</div>`;

        details += `<div>Результаты: ${results.join(', ')}`;
        if (modifier !== 0) {
            details += ` ${modifier > 0 ? '+' : ''}${modifier}`;
        }
        details += ` = ${total}</div>`;

        // Проверяем критические броски
        if (sides === 20 && results.length === 1) {
            if (results[0] === 20) {
                details += `<div style="color: var(--critical-color); font-weight: bold;">🎉 КРИТИЧЕСКИЙ УСПЕХ!</div>`;
            } else if (results[0] === 1) {
                details += `<div style="color: var(--critical-fail-color); font-weight: bold;">💥 КРИТИЧЕСКАЯ НЕУДАЧА!</div>`;
            }
        }

        resultDetails.innerHTML = details;
    }

    function displayDiceAnimation(roll) {
        const container = document.getElementById('dice-container');
        const currentRoller = document.getElementById('current-roller');
        const currentTotal = document.getElementById('current-total');
        const resultDetails = document.getElementById('result-details');

        // Очищаем контейнер
        container.innerHTML = '';

        // Создаём кубики
        roll.results.forEach((result, index) => {
            const dice = document.createElement('div');
            dice.className = 'dice';
            dice.textContent = result;

            // Добавляем классы для критических бросков
            if (roll.sides === 20) {
                if (result === 20) {
                    dice.classList.add('critical');
                } else if (result === 1) {
                    dice.classList.add('critical-fail');
                }
            }

            dice.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(dice);
        });

        // Обновляем информацию
        currentRoller.innerHTML = `<span style="color: ${roll.user.color}">${roll.user.username}</span> бросил`;
        currentTotal.textContent = roll.total;

        // Формируем детали
        let details = `<div>Бросок: ${roll.count}d${roll.sides}`;
        if (roll.modifier !== 0) {
            details += ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
        }
        details += `</div>`;

        details += `<div>Результаты: ${roll.results.join(', ')}`;
        if (roll.modifier !== 0) {
            details += ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
        }
        details += ` = ${roll.total}</div>`;

        // Проверяем критические броски
        if (roll.sides === 20 && roll.count === 1) {
            if (roll.results[0] === 20) {
                details += `<div style="color: var(--critical-color); font-weight: bold;">🎉 КРИТИЧЕСКИЙ УСПЕХ!</div>`;
            } else if (roll.results[0] === 1) {
                details += `<div style="color: var(--critical-fail-color); font-weight: bold;">💥 КРИТИЧЕСКАЯ НЕУДАЧА!</div>`;
            }
        }

        resultDetails.innerHTML = details;
    }

    function displayAdvantageAnimation(roll1, roll2, selectedRoll, type, total) {
        const container = document.getElementById('dice-container');
        const currentRoller = document.getElementById('current-roller');
        const currentTotal = document.getElementById('current-total');
        const resultDetails = document.getElementById('result-details');

        container.innerHTML = '';

        // Создаём два кубика
        const dice1 = document.createElement('div');
        dice1.className = 'dice';
        dice1.textContent = roll1;
        if (selectedRoll === 1) {
            dice1.classList.add(type === 'advantage' ? 'critical' : 'critical-fail');
        }
        container.appendChild(dice1);

        const dice2 = document.createElement('div');
        dice2.className = 'dice';
        dice2.textContent = roll2;
        dice2.style.animationDelay = '0.1s';
        if (selectedRoll === 2) {
            dice2.classList.add(type === 'advantage' ? 'critical' : 'critical-fail');
        }
        container.appendChild(dice2);

        // Обновляем информацию
        currentRoller.textContent = state.currentUser ? `Вы бросили (${type})` : `${type}`;
        currentTotal.textContent = total;

        // Формируем детали
        const modifier = parseInt(document.getElementById('modifier').value) || 0;
        let details = `<div>${type === 'advantage' ? 'Преимущество' : 'Помеха'} (2d20)</div>`;
        details += `<div>Результаты: ${roll1}, ${roll2}</div>`;
        details += `<div>Выбран ${selectedRoll === 1 ? 'первый' : 'второй'} кубик: ${selectedRoll === 1 ? roll1 : roll2}`;
        if (modifier !== 0) {
            details += ` ${modifier > 0 ? '+' : ''}${modifier}`;
        }
        details += ` = ${total}</div>`;

        resultDetails.innerHTML = details;
    }

    // ==================== СПИСОК ПОЛЬЗОВАТЕЛЕЙ ====================
    function updateUsersList(users) {
        const container = document.getElementById('users-container');

        // Убираем placeholder
        if (container.querySelector('.user-placeholder')) {
            container.innerHTML = '';
        }

        // Очищаем и добавляем пользователей
        state.users.clear();
        users.forEach(user => {
            state.users.set(user.id, user);
            addUserToList(user);
        });
    }

    function addUserToList(user) {
        const container = document.getElementById('users-container');
        const existingUser = document.getElementById(`user-${user.id}`);

        if (existingUser) {
            existingUser.remove();
        }

        const userElement = document.createElement('div');
        userElement.className = 'user-entry';
        userElement.id = `user-${user.id}`;

        // Если это текущий пользователь, добавляем класс
        if (state.currentUser && user.id === state.currentUser.id) {
            userElement.classList.add('current-user');
        }

        userElement.style.borderLeftColor = user.color;
        userElement.innerHTML = `
            <span class="user-status"></span>
            <span class="user-avatar-small" style="background: ${user.color}">
                ${user.username.charAt(0).toUpperCase()}
            </span>
            <span class="user-name">${user.username}</span>
        `;

        container.appendChild(userElement);
    }

    function removeUserFromList(userId) {
        const element = document.getElementById(`user-${userId}`);
        if (element) {
            element.remove();
        }
        state.users.delete(userId);
    }

    function updateUserInList(user) {
        const element = document.getElementById(`user-${user.id}`);
        if (element) {
            const nameSpan = element.querySelector('.user-name');
            const avatarSpan = element.querySelector('.user-avatar-small');

            if (nameSpan) {
                nameSpan.textContent = user.username;
            }

            if (avatarSpan) {
                avatarSpan.textContent = user.username.charAt(0).toUpperCase();
                avatarSpan.style.background = user.color;
            }
        }

        // Обновляем в state
        state.users.set(user.id, user);
    }

    // ==================== ГЛОБАЛЬНЫЙ ЛОГ ====================
    function addRollToGlobalLog(roll) {
        const container = document.getElementById('global-log-container');

        // Убираем приветственное сообщение
        if (container.querySelector('.log-welcome')) {
            container.innerHTML = '';
        }

        // Создаём элемент
        const rollElement = createRollElement(roll);

        // Добавляем в начало
        container.insertBefore(rollElement, container.firstChild);

        // Автопрокрутка
        if (state.autoScroll) {
            container.scrollTop = 0;
        }

        // Ограничиваем количество записей
        const maxEntries = 200;
        while (container.children.length > maxEntries) {
            container.removeChild(container.lastChild);
        }

        // Обновляем счётчик
        document.getElementById('log-count').textContent = container.children.length;

        // Добавляем в массив
        state.rolls.unshift(roll);
        if (state.rolls.length > maxEntries) {
            state.rolls.pop();
        }
    }

    function createRollElement(roll) {
        const element = document.createElement('div');
        element.className = 'global-log-entry';
        element.dataset.rollId = roll.id;

        // Определяем тип броска
        let isCritical = false;
        let isCriticalFail = false;

        if (roll.sides === 20 && roll.count === 1) {
            if (roll.results[0] === 20) {
                element.classList.add('critical');
                isCritical = true;
            } else if (roll.results[0] === 1) {
                element.classList.add('critical-fail');
                isCriticalFail = true;
            }
        }

        // Форматируем время
        const time = new Date(roll.timestamp);
        const timeString = time.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Форматируем описание броска
        let diceDesc = `${roll.count}d${roll.sides}`;
        if (roll.modifier !== 0) {
            diceDesc += ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
        }

        // Форматируем результаты
        let resultsText = roll.results.join(', ');
        if (roll.modifier !== 0) {
            resultsText += ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
        }

        element.innerHTML = `
            <div class="user" style="color: ${roll.user.color}">
                <span class="user-icon">🎲</span>
                ${roll.user.username}
            </div>
            <div class="roll">
                ${diceDesc}: ${resultsText} = <strong>${roll.total}</strong>
                ${isCritical ? ' 🎉' : ''}
                ${isCriticalFail ? ' 💥' : ''}
            </div>
            <div class="time">${timeString}</div>
        `;

        // Добавляем обработчик клика
        element.addEventListener('click', () => {
            displayDiceAnimation(roll);
        });

        return element;
    }

    function addRollToLocalLog(rollData) {
        const roll = {
            id: 'local_' + Date.now(),
            userId: 'local',
            user: {
                id: 'local',
                username: 'Локальный бросок',
                color: '#666666'
            },
            ...rollData
        };

        addRollToGlobalLog(roll);
    }

    function clearLocalLog() {
        const container = document.getElementById('global-log-container');

        // Удаляем только локальные броски
        const localRolls = container.querySelectorAll('.global-log-entry .user:contains("Локальный бросок")');
        localRolls.forEach(roll => {
            roll.closest('.global-log-entry').remove();
        });

        // Обновляем счётчик
        document.getElementById('log-count').textContent = container.children.length;

        showNotification('Локальный лог очищен', 'info');
    }

    function initLogFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const logContainer = document.getElementById('global-log-container');

        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Обновляем активную кнопку
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // Устанавливаем фильтр
                state.currentFilter = this.dataset.filter;

                // Применяем фильтр
                applyLogFilter();
            });
        });
    }

    function applyLogFilter() {
        const entries = document.querySelectorAll('.global-log-entry');

        entries.forEach(entry => {
            let show = true;

            switch (state.currentFilter) {
                case 'd20':
                    const rollText = entry.querySelector('.roll').textContent;
                    show = rollText.includes('d20');
                    break;

                case 'critical':
                    show = entry.classList.contains('critical') ||
                        entry.classList.contains('critical-fail');
                    break;

                default:
                    show = true;
            }

            entry.style.display = show ? 'block' : 'none';
        });
    }

    function initLogControls() {
        const autoScrollCheckbox = document.getElementById('auto-scroll');
        const refreshBtn = document.getElementById('refresh-logs');
        const exportBtn = document.getElementById('export-logs');

        autoScrollCheckbox.addEventListener('change', function () {
            state.autoScroll = this.checked;
        });

        refreshBtn.addEventListener('click', () => {
            // Здесь можно добавить загрузку свежих логов с сервера
            showNotification('Лог обновлён', 'info');
        });

        exportBtn.addEventListener('click', () => {
            exportLogsToFile();
        });
    }

    function exportLogsToFile() {
        if (state.rolls.length === 0) {
            showNotification('Нет данных для экспорта', 'warning');
            return;
        }

        let logText = 'D&D Dice Platform - История бросков\n';
        logText += '===============================\n\n';

        state.rolls.forEach(roll => {
            const time = new Date(roll.timestamp).toLocaleString('ru-RU');
            logText += `[${time}] ${roll.user.username}: `;

            let diceDesc = `${roll.count}d${roll.sides}`;
            if (roll.modifier !== 0) {
                diceDesc += ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
            }

            let resultsText = roll.results.join(', ');
            if (roll.modifier !== 0) {
                resultsText += ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
            }

            logText += `${diceDesc}: ${resultsText} = ${roll.total}\n`;
        });

        // Создаём файл
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dnd_dice_log_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Лог экспортирован в файл', 'success');
    }

    // ==================== МОДАЛЬНОЕ ОКНО ИМЕНИ ====================
    function initUsernameModal() {
        const modal = document.getElementById('username-modal');
        const changeBtn = document.getElementById('change-name-btn');
        const saveBtn = document.getElementById('save-username');
        const cancelBtn = document.getElementById('cancel-username');
        const input = document.getElementById('new-username');

        changeBtn.addEventListener('click', () => {
            if (!state.connected) {
                showNotification('Сначала подключитесь к серверу', 'warning');
                return;
            }

            input.value = state.currentUser ? state.currentUser.username : '';
            modal.style.display = 'flex';
            input.focus();
            input.select();
        });

        saveBtn.addEventListener('click', () => {
            const newName = input.value.trim();

            if (!newName) {
                showNotification('Имя не может быть пустым', 'error');
                return;
            }

            if (newName.length > 20) {
                showNotification('Имя должно быть не длиннее 20 символов', 'error');
                return;
            }

            if (state.currentUser && newName !== state.currentUser.username) {
                state.socket.emit('changeUsername', newName);
            }

            modal.style.display = 'none';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });

        // Enter для сохранения
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
    }

    // ==================== БЫСТРЫЕ СООБЩЕНИЯ ====================
    function initChatButtons() {
        const chatButtons = document.querySelectorAll('.chat-btn');

        chatButtons.forEach(button => {
            button.addEventListener('click', function () {
                const message = this.getAttribute('data-msg');

                // Здесь можно добавить отправку сообщений через WebSocket
                // Пока просто показываем уведомление
                showNotification(`Сообщение: ${message}`, 'info');
            });
        });
    }

    // ==================== УВЕДОМЛЕНИЯ ====================
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notificationId = ++state.notificationId;

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.dataset.id = notificationId;

        // Иконка в зависимости от типа
        let icon = 'ℹ️';
        switch (type) {
            case 'success': icon = '✅'; break;
            case 'error': icon = '❌'; break;
            case 'warning': icon = '⚠️'; break;
            case 'info':
            default:
                icon = 'ℹ️';
        }

        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-text">${message}</span>
        `;

        container.appendChild(notification);

        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            const notif = document.querySelector(`[data-id="${notificationId}"]`);
            if (notif) {
                notif.classList.add('fade-out');
                setTimeout(() => {
                    if (notif.parentNode) {
                        notif.parentNode.removeChild(notif);
                    }
                }, 300);
            }
        }, 1000);
    }

    // ==================== ГОРЯЧИЕ КЛАВИШИ ====================
    function initHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Пропускаем, если пользователь вводит текст
            if (e.target.matches('input, textarea')) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    // Бросаем d20 при нажатии пробела
                    const modifier = parseInt(document.getElementById('modifier').value) || 0;
                    rollDiceLocal(20, 1, modifier);
                    break;

                case 'Digit1':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        document.querySelector('.dice-btn[data-sides="4"]').click();
                    }
                    break;

                case 'Digit2':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        document.querySelector('.dice-btn[data-sides="6"]').click();
                    }
                    break;

                case 'Digit3':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        document.querySelector('.dice-btn[data-sides="20"]').click();
                    }
                    break;

                case 'KeyR':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        document.getElementById('custom-roll-btn').click();
                    }
                    break;
            }
        });
    }

    // В модуле DiceApp, после других определений
    function initAbilityChecks() {
        const characterData = document.getElementById('character-data');
        if (!characterData) return;

        characterData.addEventListener('click', (e) => {
            // 1. Проверка stat-block (характеристики)
            const statBlock = e.target.closest('.stat-block');
            if (statBlock) {
                // Модификатор
                const badge = statBlock.querySelector('.stat-modifier-badge');
                if (!badge) return;
                const modifierText = badge.textContent.trim();
                const modifier = parseInt(modifierText.replace(/[^\d-]/g, '')) || 0;

                // Название характеристики
                const label = statBlock.querySelector('.stat-label');
                const abilityName = label ? label.textContent.trim() : 'Характеристика';

                rollDiceLocal(20, 1, modifier);
                showNotification(`Проверка ${abilityName}: d20${modifier >= 0 ? '+' + modifier : modifier}`, 'info');
                return;
            }

            // 2. Проверка combat-stat to-hit (атака)
            const combatStat = e.target.closest('.combat-stat.to-hit');
            if (combatStat) {
                const statMain = combatStat.querySelector('.stat-main');
                if (!statMain) return;
                const modifierText = statMain.textContent.trim();
                const modifier = parseInt(modifierText.replace(/[^\d-]/g, '')) || 0;

                rollDiceLocal(20, 1, modifier);
                showNotification(`Бросок атаки: d20${modifier >= 0 ? '+' + modifier : modifier}`, 'info');
            }
        });
    }

    // Публичный API
    return {
        init: init,
        rollDice: rollDiceLocal,
        showNotification: showNotification,
        getState: () => ({ ...state })
    };

})();