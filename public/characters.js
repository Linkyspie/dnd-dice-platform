// characters.js
let charactersData = {}; // будет заполнено с сервера

// Функция для получения модификатора характеристики
function getModifier(value) {
    return Math.floor((value - 10) / 2);
}

// Функция для отображения информации о персонаже (остаётся без изменений)
function displayCharacterInfo(characterId) {
    const character = charactersData[characterId];
    if (!character) return;

    const avatarSrc = `docs/${character.id}.png`; // используем id персонажа

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

// Загрузка данных с сервера
async function loadCharactersFromServer() {
    try {
        const response = await fetch('/api/characters');
        const data = await response.json();
        charactersData = data.characters;
        console.log('✅ Данные персонажей загружены с сервера');

        // Если есть выбранный персонаж, обновляем отображение
        const select = document.getElementById('character-select');
        if (select && select.value && charactersData[select.value]) {
            displayCharacterInfo(select.value);
        } else if (select && select.options.length > 0) {
            // Выбираем первого доступного
            const firstId = Object.keys(charactersData)[0];
            if (firstId) {
                select.value = firstId;
                displayCharacterInfo(firstId);
            }
        }

        // Обновляем выпадающий список (если нужно добавить новые имена)
        // Можно перестроить select из charactersData
        rebuildCharacterSelect();
    } catch (error) {
        console.error('Ошибка загрузки персонажей:', error);
    }
}

// Перестроить выпадающий список на основе загруженных данных
function rebuildCharacterSelect() {
    const select = document.getElementById('character-select');
    if (!select) return;
    select.innerHTML = '';
    for (const [id, char] of Object.entries(charactersData)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${char.name} (${char.race} - ${char.class})`;
        select.appendChild(option);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    loadCharactersFromServer();

    const characterSelect = document.getElementById('character-select');
    if (characterSelect) {
        characterSelect.addEventListener('change', function (e) {
            displayCharacterInfo(e.target.value);
        });
    }
});