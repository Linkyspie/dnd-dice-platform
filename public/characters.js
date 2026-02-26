// Данные персонажей
const charactersData = {
    khunhau: {
        id: "khunhau",
        name: "Хунхау",
        race: "Кхааса / Ящеролюд",
        class: "Варвар",
        level: 3,
        stats: {
            strength: 23,
            durability: 16,
            agility: 7,
            intelligence: 7
        },
        modifiers: {
            strength: 4,
            durability: 4,
            agility: 2,
            intelligence: 2
        },
        hp: 54,
        armorClass: 12,
        physicalDamage: 13,
        magicDamage: 3,
        toHit: 7,
        spellSlots: 4,
        gold: 0,
        totalPoints: 53,
        growth: "+7 (+3 STR, +2 DUR, +1 INT, +1 AGL)"
    },
    meksiagnun: {
        id: "meksiagnun",
        name: "Мексиагнун",
        race: "Бастанец",
        class: "Маг / Таролог",
        level: 3,
        stats: {
            strength: 7,
            durability: 12,
            agility: 9,
            intelligence: 25
        },
        modifiers: {
            strength: 2,
            durability: 3,
            agility: 3,
            intelligence: 5
        },
        hp: 42,
        armorClass: 13,
        physicalDamage: 5,
        magicDamage: 12,
        toHit: 5,
        spellSlots: 8,
        gold: 101,
        totalPoints: 53,
        growth: "+7 (+1 AGL, +4 INT, +1 STR, +1 DUR)"
    },
    gruel: {
        id: "gruel",
        name: "Груэль",
        race: "Полуэльф",
        class: "Вор-шептун",
        level: 3,
        stats: {
            strength: 9,
            durability: 13,
            agility: 23,
            intelligence: 8
        },
        modifiers: {
            strength: 3,
            durability: 3,
            agility: 4,
            intelligence: 2
        },
        hp: 45,
        armorClass: 14,
        physicalDamage: 10,
        magicDamage: 4,
        toHit: 7,
        spellSlots: 4,
        gold: 200,
        totalPoints: 53,
        growth: "+7 (+2 DUR, +3 AGL, +1 INT, +1 STR)"
    },
    ulfost: {
        id: "ulfost",
        name: "Ульфост",
        race: "Кхааса / Ульфен",
        class: "Воин",
        level: 3,
        stats: {
            strength: 26,
            durability: 14,
            agility: 9,
            intelligence: 6
        },
        modifiers: {
            strength: 5,
            durability: 3,
            agility: 3,
            intelligence: 2
        },
        hp: 48,
        armorClass: 13,
        physicalDamage: 15,
        magicDamage: 3,
        toHit: 8,
        spellSlots: 4,
        gold: 600,
        totalPoints: 55,
        growth: "+8 (+5 STR, +1 DUR, +1 INT, +1 AGL)"
    }
};

// Функция для получения модификатора характеристики
function getModifier(value) {
    return Math.floor((value - 10) / 2);
}

// Функция для отображения информации о персонаже
function displayCharacterInfo(characterId) {
    const character = charactersData[characterId];
    if (!character) return;

    const avatarSrc = `docs/${character.id}.png`; // используем id персонажа (khunhau и т.д.)

    const container = document.getElementById('character-data');

    // Создаем HTML для карточки персонажа
    const html = `
         <div class="character-info-card">
        <div class="character-header">
            <div class="character-avatar">
    <img src="${avatarSrc}" alt="${character.name}" 
         onerror="this.onerror=null; this.src='default.png';">
</div>
            <div class="character-title">
                <h3>${character.name}</h3>
                <div class="character-class">${character.race} • ${character.class}</div>
            </div>
            <div class="character-level-badge">Уровень ${character.level}</div>
        </div>
            
            <div class="character-stats-grid">
                <div class="stat-block">
                    <div class="stat-label">Сила</div>
                    <div class="stat-value">${character.stats.strength}</div>
                    <div class="stat-modifier-badge">+${character.modifiers.strength}</div>
                </div>
                <div class="stat-block">
                    <div class="stat-label">Живучесть</div>
                    <div class="stat-value">${character.stats.durability}</div>
                    <div class="stat-modifier-badge">+${character.modifiers.durability}</div>
                </div>
                <div class="stat-block">
                    <div class="stat-label">Ловкость</div>
                    <div class="stat-value">${character.stats.agility}</div>
                    <div class="stat-modifier-badge">+${character.modifiers.agility}</div>
                </div>
                <div class="stat-block">
                    <div class="stat-label">Интеллект</div>
                    <div class="stat-value">${character.stats.intelligence}</div>
                    <div class="stat-modifier-badge">+${character.modifiers.intelligence}</div>
                </div>
            </div>
            
            <div class="character-attributes">
                <div class="attribute-item">
                    <i class="fas fa-heart"></i>
                    <span class="attribute-label">ХП</span>
                    <span class="attribute-value">${character.hp}</span>
                </div>
                <div class="attribute-item">
                    <i class="fas fa-shield-alt"></i>
                    <span class="attribute-label">КБ</span>
                    <span class="attribute-value">${character.armorClass}</span>
                </div>
                <div class="attribute-item">
                    <i class="fas fa-coins"></i>
                    <span class="attribute-label">Золото</span>
                    <span class="attribute-value">${character.gold}</span>
                </div>
            </div>
            
            <div class="character-combat">
                <div class="combat-stat">
                    <div class="stat-header">
                        <span>Физ. урон</span>
                        <i class="fas fa-sword"></i>
                    </div>
                    <div class="stat-main">${character.physicalDamage}</div>
                </div>
                <div class="combat-stat to-hit">
                    <div class="stat-header">
                        <span>To Hit</span>
                        <i class="fas fa-crosshairs"></i>
                    </div>
                    <div class="stat-main">+${character.toHit}</div>
                </div>
                <div class="combat-stat">
                    <div class="stat-header">
                        <span>Маг. урон</span>
                        <i class="fas fa-magic"></i>
                    </div>
                    <div class="stat-main">${character.magicDamage}</div>
                </div>
                <div class="combat-stat to-hit">
                    <div class="stat-header">
                        <span>Ячейки</span>
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-main">${character.spellSlots}</div>
                </div>
            </div>
            
            <div class="character-details">
                <div class="detail-row">
                    <span class="detail-label">Сумма очков</span>
                    <span class="detail-value">${character.totalPoints}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Прирост очков</span>
                    <span class="detail-value">${character.growth}</span>
                </div>
            </div>
            
            <div class="race-info">
                <i class="fas fa-dragon"></i>
                <span>${character.race}</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    const characterSelect = document.getElementById('character-select');

    if (characterSelect) {
        // Загружаем первого персонажа по умолчанию
        displayCharacterInfo('khunhau');

        // Обработчик изменения выбора
        characterSelect.addEventListener('change', function (e) {
            displayCharacterInfo(e.target.value);
        });
    }
});