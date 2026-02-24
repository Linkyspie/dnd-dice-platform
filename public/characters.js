// Модуль управления персонажами с формулами
const CharacterManager = (function() {
    // Хранение данных
    let characters = [];
    let partyNotes = '';
    let currentCharacterId = null;
    
    // ==================== ФУНКЦИЯ УВЕДОМЛЕНИЙ ====================
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.warn('Контейнер уведомлений не найден:', message);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">${message}</div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Закрытие по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Константы для расчета
    const STAT_INCREASE_PER_LEVEL = {
        // Какие характеристики увеличиваются при повышении уровня
        1: { strength: 3, durability: 2 },    // Уровень 1 -> 2
        2: { agility: 1, intellect: 4 },      // Уровень 2 -> 3
        3: { strength: 2, durability: 3 },    // И так далее...
        4: { agility: 3, intellect: 2 },
        5: { strength: 4, durability: 1 },
        6: { agility: 2, intellect: 3 },
        7: { strength: 3, durability: 2 },
        8: { agility: 4, intellect: 1 },
        9: { strength: 2, durability: 3 },
        10: { agility: 3, intellect: 2 },
        11: { strength: 1, durability: 4 },
        12: { agility: 2, intellect: 3 },
        13: { strength: 3, durability: 2 },
        14: { agility: 4, intellect: 1 },
        15: { strength: 2, durability: 3 },
        16: { agility: 3, intellect: 2 },
        17: { strength: 4, durability: 1 },
        18: { agility: 2, intellect: 3 },
        19: { strength: 3, durability: 2 },
        20: { agility: 4, intellect: 1 }
    };

    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

    // Функция для расчета характеристик по формулам
    function calculateStats(character) {
        const stats = character.stats;
        const level = character.level;
        const modifiers = character.modifiers || { armorClass: 0, toHit: 0, spellSlots: 0 };

        // ХП = (Уровень * 2) + (Живучесть * 3)
        const hp = (level * 2) + (stats.durability * 3);

        // КБ = INT(10 + SQRT(Ловкость) + Модификатор КБ)
        const armorClass = Math.floor(10 + Math.sqrt(stats.agility) + (modifiers.armorClass || 0));

        // Физ. урон = INT((Сила/2) + (Ловкость/4))
        const physicalDamage = Math.floor((stats.strength / 2) + (stats.agility / 4));

        // To hit = INT(SQRT(Ловкость) + SQRT(Сила) + Модификатор to hit)
        const toHit = Math.floor(Math.sqrt(stats.agility) + Math.sqrt(stats.strength) + (modifiers.toHit || 0));

        // Маг. урон = INT(Интеллект/2)
        const magicDamage = Math.floor(stats.intellect / 2);

        // Ячейки заклинаний = INT(SQRT(Интеллект * Уровень)) + (Уровень >= 20 ? 2 : (Уровень >= 16 ? 1 : 0)) + модификатор ячеек
        const baseSpellSlots = Math.floor(Math.sqrt(stats.intellect * level));
        let bonusSlots = 0;
        if (level >= 20) {
            bonusSlots = 2;
        } else if (level >= 16) {
            bonusSlots = 1;
        }
        const spellSlots = baseSpellSlots + bonusSlots + (modifiers.spellSlots || 0);

        return {
            hp,
            armorClass,
            physicalDamage,
            toHit,
            magicDamage,
            spellSlots
        };
    }

    // Форматирование формулы для отображения
    function formatFormula(character) {
        const stats = character.stats;
        const level = character.level;
        const modifiers = character.modifiers || { armorClass: 0, toHit: 0, spellSlots: 0 };

        return `
            <div class="formula-display">
                <strong>Формулы:</strong><br>
                • ХП = (${level} × 2) + (${stats.durability} × 3) = <strong>${(level * 2) + (stats.durability * 3)}</strong><br>
                • КБ = floor(10 + √${stats.agility} + ${modifiers.armorClass}) = <strong>${Math.floor(10 + Math.sqrt(stats.agility) + (modifiers.armorClass || 0))}</strong><br>
                • Физ. урон = floor(${stats.strength}/2 + ${stats.agility}/4) = <strong>${Math.floor((stats.strength / 2) + (stats.agility / 4))}</strong><br>
                • To hit = floor(√${stats.agility} + √${stats.strength} + ${modifiers.toHit}) = <strong>${Math.floor(Math.sqrt(stats.agility) + Math.sqrt(stats.strength) + (modifiers.toHit || 0))}</strong><br>
                • Маг. урон = floor(${stats.intellect}/2) = <strong>${Math.floor(stats.intellect / 2)}</strong><br>
                • Ячейки = floor(√(${stats.intellect} × ${level})) + ${level >= 20 ? '2' : level >= 16 ? '1' : '0'} + ${modifiers.spellSlots} = <strong>${calculateStats(character).spellSlots}</strong>
            </div>
        `;
    }

    // Получение прироста характеристик для следующего уровня
    function getStatIncreaseForLevel(currentLevel) {
        // Простая логика: каждый уровень увеличиваем случайную характеристику
        // Можно настроить под конкретные классы
        const increases = STAT_INCREASE_PER_LEVEL[currentLevel] || { strength: 1, durability: 1 };
        return increases;
    }

    // ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

    // Инициализация
    function init() {
        console.log('🎮 Инициализация Character Manager с формулами...');

        try {
            // Загрузка данных
            loadData();

            // Инициализация UI
            initUI();

            // Рендеринг персонажей
            renderCharacters();

            // Обновление информации о данных
            updateDataInfo();

            console.log('✅ Панель персонажей успешно загружена');

            // Проверяем, есть ли контейнер для уведомлений
            if (document.getElementById('notification-container')) {
                showNotification('Панель персонажей с формулами загружена', 'info');
            } else {
                console.log('Контейнер уведомлений не найден, уведомление не показано');
            }
        } catch (error) {
            console.error('❌ Ошибка при инициализации:', error);
        }
    }

    // Загрузка данных
    function loadData() {
        try {
            // Загрузка персонажей
            const savedCharacters = localStorage.getItem('dnd-characters');
            if (savedCharacters) {
                const parsed = JSON.parse(savedCharacters);
                characters = parsed.map(char => {
                    // Добавляем модификаторы, если их нет
                    if (!char.modifiers) {
                        char.modifiers = { armorClass: 0, toHit: 0, spellSlots: 0 };
                    }
                    // Пересчитываем производные характеристики
                    const calculated = calculateStats(char);
                    char.calculated = calculated;
                    char.hp = { current: calculated.hp, max: calculated.hp, temp: 0 };
                    return char;
                });
                console.log(`📂 Загружено ${characters.length} персонажей`);
            } else {
                // Создание начальных персонажей из ваших данных
                createInitialCharacters();
            }

            // Загрузка заметок
            const savedNotes = localStorage.getItem('dnd-party-notes');
            if (savedNotes) {
                partyNotes = savedNotes;
                const notesTextarea = document.getElementById('party-notes-text');
                if (notesTextarea) notesTextarea.value = partyNotes;
            }

            // Загрузка информации о бэкапе
            const lastBackup = localStorage.getItem('dnd-last-backup');
            if (lastBackup) {
                const backupElement = document.getElementById('last-backup');
                if (backupElement) {
                    backupElement.textContent = new Date(lastBackup).toLocaleString();
                }
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            createInitialCharacters();
        }
    }

    // Создание начальных персонажей
    function createInitialCharacters() {
        characters = [
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

        // Рассчитываем начальные характеристики
        characters.forEach(character => {
            const calculated = calculateStats(character);
            character.calculated = calculated;
            character.hp = { current: calculated.hp, max: calculated.hp, temp: 0 };
        });

        saveCharacters();
        console.log('✅ Созданы начальные персонажи с формулами');
    }

    // Сохранение данных
    function saveCharacters() {
        localStorage.setItem('dnd-characters', JSON.stringify(characters));
        updateDataInfo();
    }

    function savePartyNotes() {
        localStorage.setItem('dnd-party-notes', partyNotes);
    }

    // Инициализация UI
    function initUI() {
        // Кнопка открытия/закрытия панели
        const toggleBtn = document.getElementById('toggle-characters');
        const closeBtn = document.getElementById('close-characters');
        const panel = document.getElementById('characters-panel');

        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', () => {
                panel.classList.add('open');
                updateDataInfo();
            });
        }

        if (closeBtn && panel) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('open');
            });
        }

        // Переключение вкладок
        initTabs();

        // Сохранение заметок
        const saveNotesBtn = document.getElementById('save-party-notes');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', saveNotes);
        }

        // Бэкап
        const exportBtn = document.getElementById('export-data');
        const importBtn = document.getElementById('import-data');
        const autoBackupBtn = document.getElementById('auto-backup');
        const importFile = document.getElementById('import-file');

        if (exportBtn) exportBtn.addEventListener('click', exportData);
        if (importBtn) importBtn.addEventListener('click', () => importFile.click());
        if (autoBackupBtn) autoBackupBtn.addEventListener('click', autoBackup);

        if (importFile) {
            importFile.addEventListener('change', importData);
        }

        // Закрытие панели
        document.addEventListener('click', (e) => {
            if (panel && !panel.contains(e.target) &&
                e.target !== toggleBtn &&
                !toggleBtn.contains(e.target)) {
                panel.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('open')) {
                panel.classList.remove('open');
            }
        });
    }

    // Инициализация вкладок
    function initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');

                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(tabId).classList.add('active');

                if (tabId === 'backup') {
                    updateDataInfo();
                }
            });
        });
    }

    // Рендеринг списка персонажей
    function renderCharacters() {
        const grid = document.getElementById('characters-grid');
        if (!grid) return;

        grid.innerHTML = '';

        characters.forEach(character => {
            const card = createCharacterCard(character);
            grid.appendChild(card);
        });

        if (characters.length === 0) {
            grid.innerHTML = `
                <div class="no-characters">
                    <i class="fas fa-users-slash fa-3x"></i>
                    <h3>Персонажей нет</h3>
                    <p>Данные будут загружены автоматически</p>
                </div>
            `;
        }
    }

    // Создание карточки персонажа
    function createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.id = character.id;

        const calculated = character.calculated || calculateStats(character);

        card.innerHTML = `
            <div class="character-header">
                <h3 class="character-name">${character.name}</h3>
                <span class="character-level">Ур. ${character.level}</span>
            </div>
            <div class="character-info">
                <div>${character.race} • ${character.class}</div>
                <div>HP: ${calculated.hp} • КБ: ${calculated.armorClass}</div>
            </div>
            <div class="character-stats">
                <div class="stat-item">
                    <span class="stat-label">СИЛ</span>
                    <span class="stat-value">${character.stats.strength}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">ЛОВ</span>
                    <span class="stat-value">${character.stats.agility}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">ТЕЛ</span>
                    <span class="stat-value">${character.stats.durability}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">ИНТ</span>
                    <span class="stat-value">${character.stats.intellect}</span>
                </div>
            </div>
            <div class="calculated-mini">
                <div class="mini-stat">
                    <span class="mini-label">Урон</span>
                    <span class="mini-value">${calculated.physicalDamage}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-label">To hit</span>
                    <span class="mini-value">${calculated.toHit}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-label">Заклинания</span>
                    <span class="mini-value">${calculated.spellSlots}</span>
                </div>
            </div>
            <div class="character-actions">
                <button class="edit-btn" onclick="CharacterManager.openCharacterModal(${character.id})">
                    <i class="fas fa-edit"></i> Изменить
                </button>
                <button class="delete-btn" onclick="CharacterManager.deleteCharacter(${character.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;

        return card;
    }

    // Открытие модального окна персонажа
    function openCharacterModal(characterId) {
        const character = characters.find(c => c.id === characterId);
        if (!character) return;

        currentCharacterId = characterId;
        const calculated = character.calculated || calculateStats(character);

        const modal = document.getElementById('character-modal');
        const modalContent = modal.querySelector('.modal-content');

        // Получаем прирост для следующего уровня
        const statIncrease = getStatIncreaseForLevel(character.level);

        modalContent.innerHTML = `
            <h3><i class="fas fa-user-edit"></i> ${character.name}</h3>
            <p>${character.race} • ${character.class} • Уровень: ${character.level}</p>
            
            <!-- Формулы -->
            ${formatFormula(character)}
            
            <!-- Расчетные характеристики -->
            <div class="calculated-stats">
                <h4><i class="fas fa-calculator"></i> Расчетные характеристики</h4>
                <div class="calculated-grid">
                    <div class="calculated-stat">
                        <div class="calc-label">ХП</div>
                        <div class="calc-value">${calculated.hp}</div>
                        <div class="calc-formula">Ур×2 + Тел×3</div>
                    </div>
                    <div class="calculated-stat">
                        <div class="calc-label">КБ</div>
                        <div class="calc-value">${calculated.armorClass}</div>
                        <div class="calc-formula">10 + √Лов + мод</div>
                    </div>
                    <div class="calculated-stat">
                        <div class="calc-label">Физ. урон</div>
                        <div class="calc-value">${calculated.physicalDamage}</div>
                        <div class="calc-formula">Сил/2 + Лов/4</div>
                    </div>
                    <div class="calculated-stat">
                        <div class="calc-label">To hit</div>
                        <div class="calc-value">${calculated.toHit}</div>
                        <div class="calc-formula">√Лов + √Сил + мод</div>
                    </div>
                    <div class="calculated-stat">
                        <div class="calc-label">Маг. урон</div>
                        <div class="calc-value">${calculated.magicDamage}</div>
                        <div class="calc-formula">Инт/2</div>
                    </div>
                    <div class="calculated-stat">
                        <div class="calc-label">Ячейки</div>
                        <div class="calc-value">${calculated.spellSlots}</div>
                        <div class="calc-formula">√(Инт×Ур) + бонус</div>
                    </div>
                </div>
            </div>
            
            <!-- Модификаторы -->
            <div class="modifiers-grid">
                <div class="modifier-card">
                    <div class="modifier-label">Мод. КБ</div>
                    <input type="number" id="mod-armor-class" value="${character.modifiers.armorClass || 0}" 
                           class="modifier-input" min="-10" max="10" 
                           onchange="CharacterManager.updateModifier('armorClass', this.value)">
                </div>
                <div class="modifier-card">
                    <div class="modifier-label">Мод. To hit</div>
                    <input type="number" id="mod-to-hit" value="${character.modifiers.toHit || 0}" 
                           class="modifier-input" min="-10" max="10"
                           onchange="CharacterManager.updateModifier('toHit', this.value)">
                </div>
                <div class="modifier-card">
                    <div class="modifier-label">Мод. Ячеек</div>
                    <input type="number" id="mod-spell-slots" value="${character.modifiers.spellSlots || 0}" 
                           class="modifier-input" min="-10" max="10"
                           onchange="CharacterManager.updateModifier('spellSlots', this.value)">
                </div>
            </div>
            
            <!-- Уровень и характеристики -->
            <div class="level-up-section">
                <h4><i class="fas fa-arrow-up"></i> Уровень и характеристики</h4>
                
                <div class="level-controls">
                    <button class="level-btn" onclick="CharacterManager.changeLevel(-1)" ${character.level <= 1 ? 'disabled' : ''}>-</button>
                    <span class="level-display">${character.level}</span>
                    <button class="level-btn" onclick="CharacterManager.changeLevel(1)" ${character.level >= 20 ? 'disabled' : ''}>+</button>
                </div>
                
                ${character.level < 20 ? `
                    <div class="stat-increase">
                        <div class="increase-info">
                            <span class="increase-label">Прирост на след. уровне:</span>
                            <span class="increase-value">
                                ${Object.entries(statIncrease).map(([stat, value]) =>
            `${getStatName(stat)} +${value}`
        ).join(', ')}
                            </span>
                        </div>
                    </div>
                ` : ''}
                
                <div class="stat-edit-grid">
                    ${Object.entries(character.stats).map(([stat, value]) => `
                        <div class="stat-edit-card">
                            <div class="stat-edit-label">${getStatName(stat)}</div>
                            <div class="stat-edit-value">${value}</div>
                            <div class="stat-edit-controls">
                                <button class="stat-edit-btn" onclick="CharacterManager.changeStat('${stat}', -1)">-</button>
                                <input type="number" class="stat-edit-input" id="stat-${stat}" 
                                       value="${value}" min="1" max="30"
                                       onchange="CharacterManager.setStat('${stat}', this.value)">
                                <button class="stat-edit-btn" onclick="CharacterManager.changeStat('${stat}', 1)">+</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Таблица прогрессии -->
            <div class="progression-table">
                <h4><i class="fas fa-chart-line"></i> Прогресс уровней</h4>
                <table class="level-progression">
                    <thead>
                        <tr>
                            <th>Уровень</th>
                            <th>ХП</th>
                            <th>Физ. урон</th>
                            <th>To hit</th>
                            <th>Ячеек</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[1, 5, 10, 15, 20].map(lvl => {
            const fakeChar = JSON.parse(JSON.stringify(character));
            fakeChar.level = lvl;
            const calc = calculateStats(fakeChar);
            return `
                                <tr ${lvl === character.level ? 'style="background: rgba(114, 9, 183, 0.2);"' : ''}>
                                    <td>${lvl}</td>
                                    <td>${calc.hp}</td>
                                    <td>${calc.physicalDamage}</td>
                                    <td>${calc.toHit}</td>
                                    <td>${calc.spellSlots}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Золото -->
            <div class="gold-section">
                <h4><i class="fas fa-coins"></i> Золото</h4>
                <input type="number" id="character-gold" value="${character.gold || 0}" 
                       min="0" style="width: 100%; padding: 10px; font-size: 1.2rem;"
                       onchange="CharacterManager.updateGold(this.value)">
            </div>
            
            <div class="modal-buttons">
                <button class="secondary-btn" onclick="CharacterManager.closeCharacterModal()">
                    <i class="fas fa-times"></i> Закрыть
                </button>
                <button class="primary-btn" onclick="CharacterManager.saveCharacter()">
                    <i class="fas fa-save"></i> Сохранить
                </button>
            </div>
        `;

        modal.style.display = 'flex';
    }

    // Получение имени характеристики
    function getStatName(stat) {
        const names = {
            strength: 'Сила',
            durability: 'Живучесть',
            agility: 'Ловкость',
            intellect: 'Интеллект'
        };
        return names[stat] || stat;
    }

    // Изменение уровня
    function changeLevel(delta) {
        const character = characters.find(c => c.id === currentCharacterId);
        if (!character) return;

        const newLevel = character.level + delta;
        if (newLevel < 1 || newLevel > 20) return;

        // Если повышаем уровень, увеличиваем характеристики
        if (delta > 0) {
            const statIncrease = getStatIncreaseForLevel(character.level);
            Object.entries(statIncrease).forEach(([stat, value]) => {
                character.stats[stat] = Math.min(30, character.stats[stat] + value);
            });

            showNotification(`Уровень повышен! Характеристики увеличены.`, 'success');
        }

        character.level = newLevel;

        // Пересчитываем все характеристики
        recalculateCharacter(character);

        // Обновляем отображение
        openCharacterModal(currentCharacterId);
        renderCharacters();

        // Анимация
        const levelDisplay = document.querySelector('.level-display');
        if (levelDisplay) {
            levelDisplay.classList.add('level-up-animation');
            setTimeout(() => levelDisplay.classList.remove('level-up-animation'), 500);
        }
    }

    // Изменение характеристики
    function changeStat(stat, delta) {
        const character = characters.find(c => c.id === currentCharacterId);
        if (!character || !character.stats[stat]) return;

        const newValue = Math.max(1, Math.min(30, character.stats[stat] + delta));
        character.stats[stat] = newValue;

        // Обновляем поле ввода
        const input = document.getElementById(`stat-${stat}`);
        if (input) input.value = newValue;

        recalculateCharacter(character);

        // Анимация
        const statElement = document.querySelector(`[id="stat-${stat}"]`).closest('.stat-edit-card');
        if (statElement) {
            statElement.classList.add('stat-updated');
            setTimeout(() => statElement.classList.remove('stat-updated'), 1000);
        }
    }

    // Установка характеристики
    function setStat(stat, value) {
        const character = characters.find(c => c.id === currentCharacterId);
        if (!character || !character.stats[stat]) return;

        const numValue = Math.max(1, Math.min(30, parseInt(value) || 1));
        character.stats[stat] = numValue;

        recalculateCharacter(character);
    }

    // Обновление модификатора
    function updateModifier(type, value) {
        const character = characters.find(c => c.id === currentCharacterId);
        if (!character) return;

        const numValue = parseInt(value) || 0;
        character.modifiers[type] = numValue;

        recalculateCharacter(character);
    }

    // Обновление золота
    function updateGold(value) {
        const character = characters.find(c => c.id === currentCharacterId);
        if (!character) return;

        character.gold = parseInt(value) || 0;
    }

    // Пересчет характеристик персонажа
    function recalculateCharacter(character) {
        const calculated = calculateStats(character);
        character.calculated = calculated;

        // Обновляем ХП
        if (!character.hp) character.hp = { current: 0, max: 0, temp: 0 };
        character.hp.max = calculated.hp;
        if (character.hp.current > character.hp.max) {
            character.hp.current = character.hp.max;
        }

        character.lastUpdated = new Date().toISOString();
    }

    // Сохранение персонажа
    function saveCharacter() {
        saveCharacters();
        renderCharacters();
        showNotification('Изменения сохранены', 'success');
        closeCharacterModal();
    }

    // Закрытие модального окна
    function closeCharacterModal() {
        const modal = document.getElementById('character-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        saveCharacters();
    }

    // Удаление персонажа
    function deleteCharacter(characterId) {
        if (!confirm('Удалить этого персонажа?')) return;

        const index = characters.findIndex(c => c.id === characterId);
        if (index !== -1) {
            characters.splice(index, 1);
            saveCharacters();
            renderCharacters();
            showNotification('Персонаж удален', 'success');

            if (currentCharacterId === characterId) {
                closeCharacterModal();
            }
        }
    }

    // Сохранение заметок
    function saveNotes() {
        const notesTextarea = document.getElementById('party-notes-text');
        if (notesTextarea) {
            partyNotes = notesTextarea.value;
            savePartyNotes();
            showNotification('Заметки партии сохранены', 'success');
        }
    }

    // ==================== БЭКАП И ЭКСПОРТ ====================

    // Экспорт данных
    function exportData() {
        const data = {
            characters: characters,
            partyNotes: partyNotes,
            exportDate: new Date().toISOString(),
            version: '1.1',
            formulas: {
                hp: 'Уровень * 2 + Живучесть * 3',
                armorClass: '10 + sqrt(Ловкость) + модификатор',
                physicalDamage: 'floor(Сила/2 + Ловкость/4)',
                toHit: 'floor(sqrt(Ловкость) + sqrt(Сила) + модификатор)',
                magicDamage: 'floor(Интеллект/2)',
                spellSlots: 'floor(sqrt(Интеллект * Уровень)) + (Уровень>=20?2:Уровень>=16?1:0) + модификатор'
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dnd-characters-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Сохраняем дату бэкапа
        localStorage.setItem('dnd-last-backup', new Date().toISOString());
        updateDataInfo();

        showNotification('Данные экспортированы', 'success');
    }

    // Импорт данных
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.characters || !Array.isArray(data.characters)) {
                    throw new Error('Неверный формат файла');
                }

                if (confirm(`Импортировать ${data.characters.length} персонажей? Текущие данные будут заменены.`)) {
                    // Обновляем персонажей
                    characters = data.characters.map(char => {
                        // Пересчитываем характеристики для каждого персонажа
                        recalculateCharacter(char);
                        return char;
                    });

                    // Обновляем заметки
                    if (data.partyNotes) {
                        partyNotes = data.partyNotes;
                        const notesTextarea = document.getElementById('party-notes-text');
                        if (notesTextarea) notesTextarea.value = partyNotes;
                    }

                    // Сохраняем
                    saveCharacters();
                    savePartyNotes();
                    renderCharacters();

                    // Сбрасываем input
                    event.target.value = '';

                    showNotification(`Успешно импортировано ${characters.length} персонажей`, 'success');
                    updateDataInfo();
                }
            } catch (error) {
                console.error('Ошибка импорта:', error);
                showNotification('Ошибка импорта данных. Проверьте формат файла.', 'error');
                event.target.value = '';
            }
        };

        reader.readAsText(file);
    }

    // Автоматический бэкап
    function autoBackup() {
        localStorage.setItem('dnd-last-backup', new Date().toISOString());
        updateDataInfo();
        showNotification('Автобэкап выполнен', 'success');
    }

    // Обновление информации о данных
    function updateDataInfo() {
        const countElement = document.getElementById('data-count');
        const lastModifiedElement = document.getElementById('last-modified');
        const dataSizeElement = document.getElementById('data-size');
        const lastBackupElement = document.getElementById('last-backup');
        const storageUsageElement = document.getElementById('storage-usage');

        if (countElement) countElement.textContent = characters.length;

        if (lastModifiedElement) {
            if (characters.length > 0) {
                const lastUpdate = characters.reduce((latest, char) => {
                    const date = new Date(char.lastUpdated);
                    return date > latest ? date : latest;
                }, new Date(0));
                lastModifiedElement.textContent = lastUpdate.toLocaleString();
            } else {
                lastModifiedElement.textContent = '-';
            }
        }

        if (dataSizeElement) {
            const dataStr = JSON.stringify(characters);
            const size = new Blob([dataStr]).size;
            dataSizeElement.textContent = `${(size / 1024).toFixed(2)} KB`;
        }

        if (lastBackupElement) {
            const lastBackup = localStorage.getItem('dnd-last-backup');
            lastBackupElement.textContent = lastBackup ?
                new Date(lastBackup).toLocaleString() : 'никогда';
        }

        if (storageUsageElement) {
            // Примерная оценка использования localStorage
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length * 2; // UTF-16
                }
            }
            const percentage = Math.min(100, (totalSize / (5 * 1024 * 1024)) * 100); // 5MB max
            storageUsageElement.textContent = `${percentage.toFixed(1)}%`;
        }
    }

    // Публичный API
    return {
        init: init,
        openCharacterModal: openCharacterModal,
        closeCharacterModal: closeCharacterModal,
        changeLevel: changeLevel,
        changeStat: changeStat,
        setStat: setStat,
        updateModifier: updateModifier,
        updateGold: updateGold,
        saveCharacter: saveCharacter,
        deleteCharacter: deleteCharacter,
        saveNotes: saveNotes,
        exportData: exportData,
        importData: importData,
        autoBackup: autoBackup
    };
})();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        CharacterManager.init();
    }, 1000);

    
});