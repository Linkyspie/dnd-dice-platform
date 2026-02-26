// Навигация по вкладкам с открытием в новой вкладке
document.addEventListener('DOMContentLoaded', function () {
    const navTabs = document.querySelectorAll('.nav-tab');

    // Функция для открытия страницы в новой вкладке
    function openInNewTab(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Добавляем обработчики на кнопки
    navTabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();

            const tabId = this.getAttribute('data-tab');

            // Определяем URL для каждой вкладки
            let url = '#';

            switch (tabId) {
                case 'spells':
                    url = 'docs/spells.html';  // Страница с заклинаниями
                    break;
                case 'talents':
                    url = 'docs/skillwheel.html';  // Страница с талантами
                    break;
                case 'tarot':
                    url = 'docs/tarot.html';  // Страница с таро
                    break;
                case 'characters':
                    url = 'https://docs.google.com/spreadsheets/d/1mDbBa7rYnx8Qve_hQHEO9RhcPoo3-oNd9SJgguY8CQ4/edit?gid=0#gid=0';  // Страница с персонажами
                    break;
                case 'lore':
                    url = 'https://dndstuffas.vercel.app/';
                    break;
                default:
                    url = '#';
            }

            // Открываем в новой вкладке
            if (url !== '#') {
                openInNewTab(url);
            } else {
                // Если URL не определен, показываем уведомление
                showNotification('Страница в разработке', 'info');
            }
        });
    });

    // Добавляем обработчик для открытия в новой вкладке по клику с Ctrl/Cmd
    navTabs.forEach(tab => {
        tab.addEventListener('mousedown', function (e) {
            // Если зажат Ctrl или Cmd, разрешаем стандартное поведение
            if (e.ctrlKey || e.metaKey) {
                return;
            }
            // В остальных случаях предотвращаем стандартное поведение
            e.preventDefault();
        });
    });

    // Функция для показа уведомления
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Автоматически удаляем через 3 секунды
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Добавляем подсказку для пользователей
    const style = document.createElement('style');
    style.textContent = `
        .nav-tab {
            position: relative;
        }
        
        .nav-tab:hover::after {
            content: 'Откроется в новой вкладке';
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .nav-tab:active {
            opacity: 0.8;
        }
        
        .notification.info {
            background: rgba(67, 97, 238, 0.9);
            border-left-color: #ffd700;
        }
        
        .notification.fade-out {
            animation: slideOutRight 0.3s ease forwards;
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});