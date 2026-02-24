// dice3D.js - 3D рендерер кубиков D&D с реалистичной физикой и правильными числами
class Dice3DRenderer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.dice = [];
        this.isInitialized = false;
        this.diceMaterials = {};
        this.physicsWorld = null;
        this.rigidBodies = [];
        this.clock = new THREE.Clock();
        
        // Конфигурации для разных типов кубиков с физическими свойствами
        this.diceConfigs = {
            4: { 
                type: 'd4', 
                faces: 4, 
                size: 1.8,
                faceNumbers: [1, 2, 3, 4],
                mass: 0.8,
                inertia: 0.5,
                restitution: 0.6,
                friction: 0.15,
                airResistance: 0.02,
                rollingFriction: 0.05
            },
            6: { 
                type: 'd6', 
                faces: 6, 
                size: 1.5,
                faceNumbers: [1, 2, 3, 4, 5, 6],
                mass: 1.0,
                inertia: 0.4,
                restitution: 0.7,
                friction: 0.1,
                airResistance: 0.015,
                rollingFriction: 0.03
            },
            8: { 
                type: 'd8', 
                faces: 8, 
                size: 1.4,
                faceNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
                mass: 0.9,
                inertia: 0.45,
                restitution: 0.65,
                friction: 0.12,
                airResistance: 0.018,
                rollingFriction: 0.04
            },
            10: { 
                type: 'd10', 
                faces: 10, 
                size: 1.3,
                faceNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                mass: 0.85,
                inertia: 0.42,
                restitution: 0.63,
                friction: 0.13,
                airResistance: 0.017,
                rollingFriction: 0.035
            },
            12: { 
                type: 'd12', 
                faces: 12, 
                size: 1.2,
                faceNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                mass: 0.95,
                inertia: 0.48,
                restitution: 0.68,
                friction: 0.11,
                airResistance: 0.016,
                rollingFriction: 0.038
            },
            20: { 
                type: 'd20', 
                faces: 20, 
                size: 1.1,
                faceNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                mass: 0.75,
                inertia: 0.35,
                restitution: 0.75,
                friction: 0.09,
                airResistance: 0.014,
                rollingFriction: 0.025
            },
            100: { 
                type: 'd100', 
                faces: 100, 
                size: 1.0,
                faceNumbers: Array.from({length: 100}, (_, i) => i + 1),
                mass: 1.2,
                inertia: 0.55,
                restitution: 0.55,
                friction: 0.18,
                airResistance: 0.025,
                rollingFriction: 0.05
            }
        };
        
        // Правильная нумерация граней для каждого типа кубиков (стандартные схемы D&D)
        this.faceNumbering = {
            d4: {
                // Для тетраэдра: числа на 4 гранях
                faces: [
                    { number: 1, position: [0, 0.8, 0], rotation: [0, 0, 0] },
                    { number: 2, position: [0.6, -0.4, 0.6], rotation: [0, 120, 0] },
                    { number: 3, position: [-0.6, -0.4, 0.6], rotation: [0, 240, 0] },
                    { number: 4, position: [0, -0.4, -0.8], rotation: [180, 0, 0] }
                ]
            },
            d6: {
                // Для куба: стандартная противоположная сумма = 7
                faces: [
                    { number: 1, opposite: 6 }, // top
                    { number: 2, opposite: 5 }, // front
                    { number: 3, opposite: 4 }, // right
                    { number: 4, opposite: 3 }, // left
                    { number: 5, opposite: 2 }, // back
                    { number: 6, opposite: 1 }  // bottom
                ]
            },
            d8: {
                // Для октаэдра: противоположные грани сумма = 9
                faces: [
                    { number: 1, opposite: 8 },
                    { number: 2, opposite: 7 },
                    { number: 3, opposite: 6 },
                    { number: 4, opposite: 5 },
                    { number: 5, opposite: 4 },
                    { number: 6, opposite: 3 },
                    { number: 7, opposite: 2 },
                    { number: 8, opposite: 1 }
                ]
            },
            d10: {
                // Для d10: числа 0-9
                faces: [
                    { number: 0, opposite: 9 },
                    { number: 1, opposite: 8 },
                    { number: 2, opposite: 7 },
                    { number: 3, opposite: 6 },
                    { number: 4, opposite: 5 },
                    { number: 5, opposite: 4 },
                    { number: 6, opposite: 3 },
                    { number: 7, opposite: 2 },
                    { number: 8, opposite: 1 },
                    { number: 9, opposite: 0 }
                ]
            },
            d12: {
                // Для додекаэдра: противоположные грани
                faces: Array.from({length: 12}, (_, i) => ({
                    number: i + 1,
                    opposite: 13 - (i + 1)
                }))
            },
            d20: {
                // Для икосаэдра: противоположные грани сумма = 21
                faces: Array.from({length: 20}, (_, i) => ({
                    number: i + 1,
                    opposite: 21 - (i + 1)
                }))
            },
            d100: {
                // Для d100: числа 1-100 на сфере
                faces: Array.from({length: 100}, (_, i) => ({
                    number: i + 1,
                    position: this.getSpherePosition(i, 100),
                    rotation: this.getSphereRotation(i, 100)
                }))
            }
        };
    }

    getSpherePosition(index, total) {
        const phi = Math.acos(-1 + (2 * index) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        return [
            Math.sin(phi) * Math.cos(theta),
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi)
        ];
    }

    getSphereRotation(index, total) {
        return [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        ];
    }

    async init() {
        if (this.isInitialized) return;
        
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        // Создаем сцену
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 30);
        
        // Создаем камеру
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 8, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Создаем рендерер
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
        
        // Добавляем освещение
        this.setupLighting();
        
        // Создаем стол
        this.addTable();
        
        // Добавляем окружение
        this.addEnvironment();
        
        this.isInitialized = true;
        
        // Начинаем анимацию
        this.animate();
        
        // Обработчик изменения размера
        window.addEventListener('resize', () => this.onWindowResize());
        
        // События для взаимодействия
        this.setupControls();
        
        console.log('Dice3D Renderer initialized with realistic physics');
    }
    
    setupLighting() {
        // Основное освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Направленный свет (солнце)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.001;
        this.scene.add(directionalLight);
        
        // Заполняющий свет
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);
        
        // Свет под столом для глубины теней
        const underTableLight = new THREE.PointLight(0xffffff, 0.2);
        underTableLight.position.set(0, -3, 0);
        this.scene.add(underTableLight);
    }
    
    addTable() {
        // Создаем стол для кубиков
        const tableGeometry = new THREE.BoxGeometry(25, 1, 25);
        
        // Создаем текстуру дерева
        const woodTexture = this.createWoodTexture();
        
        const tableMaterial = new THREE.MeshStandardMaterial({
            map: woodTexture,
            color: 0x4a3728,
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.y = -2.5;
        table.receiveShadow = true;
        this.scene.add(table);
        
        // Добавляем бортики стола
        this.addTableBorders(table);
        
        // Добавляем коврик для броска
        this.addThrowMat();
    }
    
    createWoodTexture() {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Фон дерева
        const baseColor = '#4a3728';
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);
        
        // Рисуем волокна дерева
        ctx.strokeStyle = '#3a2718';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        for (let i = 0; i < size; i += 15) {
            ctx.beginPath();
            const yOffset = Math.sin(i * 0.05) * 10;
            ctx.moveTo(i, 0 + yOffset);
            ctx.bezierCurveTo(
                i + 5, size * 0.3,
                i - 5, size * 0.7,
                i, size + yOffset
            );
            ctx.stroke();
        }
        
        // Добавляем текстуру
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 3 + 1;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.2})`;
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        return texture;
    }
    
    addTableBorders(table) {
        // Бортики стола
        const borderGeometry = new THREE.BoxGeometry(26, 2, 26);
        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1f18,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.y = -1.5;
        this.scene.add(border);
        
        // Внутренний вырез для бортиков
        const innerBorderGeometry = new THREE.BoxGeometry(24, 1.5, 24);
        const innerBorder = new THREE.Mesh(innerBorderGeometry, borderMaterial);
        innerBorder.position.y = -1.75;
        this.scene.add(innerBorder);
    }
    
    addThrowMat() {
        // Коврик для броска в центре стола
        const matGeometry = new THREE.CircleGeometry(6, 32);
        const matMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        
        const throwMat = new THREE.Mesh(matGeometry, matMaterial);
        throwMat.position.y = -1.99;
        throwMat.rotation.x = -Math.PI / 2;
        throwMat.receiveShadow = true;
        this.scene.add(throwMat);
        
        // Добавляем ободок коврика
        const rimGeometry = new THREE.RingGeometry(5.9, 6, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0xf1c40f,
            roughness: 0.5,
            metalness: 0.7
        });
        
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.y = -1.98;
        rim.rotation.x = -Math.PI / 2;
        this.scene.add(rim);
    }
    
    addEnvironment() {
        // Добавляем фон
        const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0a1a,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Добавляем декоративные элементы
        this.addDecorativeElements();
    }
    
    addDecorativeElements() {
        // Книга правил
        const bookGeometry = new THREE.BoxGeometry(3, 0.5, 4);
        const bookMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        });
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        book.position.set(-8, -1.8, -5);
        book.rotation.y = Math.PI / 6;
        book.castShadow = true;
        this.scene.add(book);
        
        // Стакан с карандашами
        const cupGeometry = new THREE.CylinderGeometry(0.5, 0.3, 2, 8);
        const cupMaterial = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            roughness: 0.4,
            metalness: 0.6
        });
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        cup.position.set(8, -1.5, -5);
        cup.castShadow = true;
        this.scene.add(cup);
    }
    
    setupControls() {
        // Добавляем вращение камеры по клику и перетаскиванию
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const delta = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            // Вращаем камеру вокруг центра сцены
            const angleX = delta.y * 0.01;
            const angleY = delta.x * 0.01;
            
            // Сферические координаты
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            
            spherical.phi = THREE.MathUtils.clamp(spherical.phi + angleX, 0.1, Math.PI - 0.1);
            spherical.theta += angleY;
            
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.renderer.domElement.addEventListener('wheel', (e) => {
            // Приближение/отдаление
            const zoomSpeed = 0.1;
            const direction = e.deltaY > 0 ? 1 : -1;
            
            const vector = new THREE.Vector3();
            vector.copy(this.camera.position).normalize();
            this.camera.position.addScaledVector(vector, direction * zoomSpeed);
            
            // Ограничиваем расстояние
            const distance = this.camera.position.length();
            if (distance < 5) this.camera.position.setLength(5);
            if (distance > 30) this.camera.position.setLength(30);
            
            this.camera.lookAt(0, 0, 0);
        });
    }
    
    createDice(sides, value = null) {
        if (!this.diceConfigs[sides]) {
            console.error(`No config for dice with ${sides} sides`);
            return null;
        }
        
        let diceMesh;
        const config = this.diceConfigs[sides];
        const numbering = this.faceNumbering[config.type];
        
        // Создаем геометрию в зависимости от типа кубика
        diceMesh = this.createDiceGeometry(sides);
        
        // Создаем материалы с правильными номерами на гранях
        diceMesh.material = this.createDiceMaterials(sides, config, numbering);
        
        diceMesh.castShadow = true;
        diceMesh.receiveShadow = true;
        
        // Добавляем физические свойства
        diceMesh.userData = {
            sides: parseInt(sides),
            currentValue: value || 1,
            isRolling: false,
            type: config.type,
            config: config,
            numbering: numbering,
            velocity: new THREE.Vector3(),
            angularVelocity: new THREE.Vector3(),
            spinAxis: new THREE.Vector3(),
            lastPosition: new THREE.Vector3(),
            lastVelocity: new THREE.Vector3(),
            collisionCount: 0,
            isRollingOnTable: false,
            contactPoints: [],
            airTime: 0,
            energyLoss: 0
        };
        
        // Позиционируем кубик
        const offset = this.dice.length * 2;
        diceMesh.position.set(
            (Math.random() - 0.5) * 4,
            3 + Math.random() * 2,
            (Math.random() - 0.5) * 4
        );
        
        // Начальное вращение
        diceMesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        this.scene.add(diceMesh);
        this.dice.push(diceMesh);
        
        return diceMesh;
    }
    
    createDiceGeometry(sides) {
        const config = this.diceConfigs[sides];
        if (!config) return null;
        
        switch(config.type) {
            case 'd4':
                return this.createD4();
            case 'd6':
                return this.createD6();
            case 'd8':
                return this.createD8();
            case 'd10':
                return this.createD10();
            case 'd12':
                return this.createD12();
            case 'd20':
                return this.createD20();
            case 'd100':
                return this.createD100();
            default:
                return this.createD6();
        }
    }
    
    createDiceMaterials(sides, config, numbering) {
        if (sides === 6) {
            // Для d6 создаем 6 отдельных материалов
            return this.createD6Materials(config, numbering);
        } else if (sides <= 20) {
            // Для кубиков с <=20 гранями создаем материалы для каждой грани
            return this.createMultiFaceMaterials(sides, config, numbering);
        } else {
            // Для d100 создаем один материал
            return this.createD100Material(config);
        }
    }
    
    createD6Materials(config, numbering) {
        const materials = [];
        
        for (let i = 0; i < 6; i++) {
            const face = numbering.faces[i];
            const texture = this.createFaceTexture(face.number, config);
            
            materials.push(new THREE.MeshStandardMaterial({
                map: texture,
                color: this.getDiceColor(6),
                roughness: 0.3,
                metalness: 0.8,
                envMapIntensity: 0.6,
                side: THREE.DoubleSide
            }));
        }
        
        return materials;
    }
    
    createMultiFaceMaterials(sides, config, numbering) {
        const geometry = this.createDiceGeometry(sides);
        const materials = [];
        
        // Получаем позиции вершин для определения граней
        const positions = geometry.attributes.position.array;
        const groups = geometry.groups || [];
        
        // Для каждого сегмента создаем материал
        for (let i = 0; i < config.faces; i++) {
            const faceNumber = numbering.faces[i] ? numbering.faces[i].number : i + 1;
            const texture = this.createFaceTexture(faceNumber, config);
            
            materials.push(new THREE.MeshStandardMaterial({
                map: texture,
                color: this.getDiceColor(sides),
                roughness: 0.4,
                metalness: 0.7,
                envMapIntensity: 0.5,
                side: THREE.DoubleSide
            }));
        }
        
        return materials;
    }
    
    createD100Material(config) {
        const texture = this.createD100Texture();
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            color: this.getDiceColor(100),
            roughness: 0.5,
            metalness: 0.6,
            envMapIntensity: 0.4,
            side: THREE.DoubleSide
        });
    }
    
    createFaceTexture(number, config) {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Металлический градиентный фон
        const gradient = ctx.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        
        const color = this.getDiceColor(config.faces);
        const hex = color.toString(16).padStart(6, '0');
        
        gradient.addColorStop(0, `#${hex}FF`);
        gradient.addColorStop(0.3, `#${hex}AA`);
        gradient.addColorStop(0.7, `#${hex}66`);
        gradient.addColorStop(1, `#${hex}22`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Добавляем детали металла
        this.addMetalDetails(ctx, size);
        
        // Рисуем номер на грани
        this.drawFaceNumber(ctx, size, number, config.faces);
        
        // Добавляем эффект объема
        this.addBevelEffect(ctx, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        
        return texture;
    }
    
    createD100Texture() {
        const canvas = document.createElement('canvas');
        const size = 1024; // Большой размер для d100
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Градиентный фон
        const gradient = ctx.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        
        const color = this.getDiceColor(100);
        const hex = color.toString(16).padStart(6, '0');
        
        gradient.addColorStop(0, `#${hex}FF`);
        gradient.addColorStop(0.5, `#${hex}88`);
        gradient.addColorStop(1, `#${hex}33`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Добавляем детали
        this.addMetalDetails(ctx, size);
        
        // Рисуем обозначение d100 в центре
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = size * 0.01;
        ctx.font = `bold ${size * 0.15}px 'Arial Black', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText('d100', size/2, size/2);
        ctx.fillText('d100', size/2, size/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        
        return texture;
    }
    
    drawFaceNumber(ctx, size, number, sides) {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = size * 0.01;
        
        // Размер шрифта в зависимости от количества цифр
        let fontSize;
        if (number.toString().length === 3) {
            fontSize = size * 0.18;
        } else if (number.toString().length === 2) {
            fontSize = size * 0.25;
        } else {
            fontSize = size * 0.35;
        }
        
        // Особые стили для разных кубиков
        if (sides === 4 && number === 4) fontSize *= 0.8;
        if (sides === 20 && number === 20) {
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
        }
        
        ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = number.toString();
        ctx.strokeText(text, size/2, size/2);
        ctx.fillText(text, size/2, size/2);
        
        // Сброс теней
        ctx.shadowBlur = 0;
        
        // Для d10 с числом 0 рисуем как 10
        if (sides === 10 && number === 0) {
            ctx.font = `bold ${size * 0.25}px 'Arial Black', Arial, sans-serif`;
            ctx.strokeText('10', size/2, size/2);
            ctx.fillText('10', size/2, size/2);
        }
    }
    
    addMetalDetails(ctx, size) {
        // Металлические блики
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        
        // Верхний левый блик
        const gradient1 = ctx.createRadialGradient(
            size * 0.2, size * 0.2, 0,
            size * 0.2, size * 0.2, size * 0.3
        );
        gradient1.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient1.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, size * 0.4, size * 0.4);
        
        // Нижний правый блик
        const gradient2 = ctx.createRadialGradient(
            size * 0.8, size * 0.8, 0,
            size * 0.8, size * 0.8, size * 0.3
        );
        gradient2.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient2.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient2;
        ctx.fillRect(size * 0.6, size * 0.6, size * 0.4, size * 0.4);
        
        // Микроповреждения
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 4 + 1;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.4})`;
            ctx.fill();
        }
    }
    
    addBevelEffect(ctx, size) {
        // Эффект скругленных краев
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = size * 0.02;
        
        // Верхняя и левая светлые грани
        ctx.beginPath();
        ctx.moveTo(size * 0.1, size * 0.1);
        ctx.lineTo(size * 0.9, size * 0.1);
        ctx.lineTo(size * 0.9, size * 0.9);
        ctx.stroke();
        
        // Нижняя и правая темные грани
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(size * 0.9, size * 0.9);
        ctx.lineTo(size * 0.1, size * 0.9);
        ctx.lineTo(size * 0.1, size * 0.1);
        ctx.stroke();
    }
    
    getDiceColor(sides) {
        const colors = {
            4: 0x6A0DAD,
            6: 0x1E88E5,
            8: 0x43A047,
            10: 0xFB8C00,
            12: 0xE53935,
            20: 0x8E24AA,
            100: 0x3949AB
        };
        return colors[sides] || 0x888888;
    }
    
    // Методы создания геометрий (остаются без изменений, как в исходном коде)
    createD4() {
        const geometry = new THREE.ConeGeometry(1, 1.5, 3);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0.5, 0);
        
        const uvs = [];
        const vertices = geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            uvs.push(0.5, 0.5);
            uvs.push(0, 1);
            uvs.push(1, 1);
        }
        
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        return new THREE.Mesh(geometry);
    }
    
    createD6() {
        return new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5));
    }
    
    createD8() {
        return new THREE.Mesh(new THREE.OctahedronGeometry(1.2));
    }
    
    createD10() {
        const geometry = new THREE.DodecahedronGeometry(1);
        geometry.scale(1, 0.7, 1);
        return new THREE.Mesh(geometry);
    }
    
    createD12() {
        return new THREE.Mesh(new THREE.DodecahedronGeometry(1.1));
    }
    
    createD20() {
        return new THREE.Mesh(new THREE.IcosahedronGeometry(1.2));
    }
    
    createD100() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        geometry.scale(1, 0.8, 1);
        return new THREE.Mesh(geometry);
    }
    
    rollDice(diceCount, diceSides, results = []) {
        // Очищаем старые кубики
        this.clearDice();
        
        // Создаем новые кубики
        for (let i = 0; i < diceCount; i++) {
            const value = results[i] || Math.floor(Math.random() * diceSides) + 1;
            const dice = this.createDice(diceSides, value);
            
            if (dice) {
                dice.userData.isRolling = true;
                dice.userData.startTime = Date.now();
                dice.userData.targetValue = value;
                
                const config = this.diceConfigs[diceSides];
                
                // Реалистичная физика броска
                this.applyRealisticThrowPhysics(dice, config, i);
            }
        }
    }
    
    applyRealisticThrowPhysics(dice, config, index) {
        // Угол броска (0-30 градусов)
        const throwAngle = Math.random() * Math.PI * 0.3;
        
        // Сила броска с учетом массы
        const baseForce = 8 + config.mass * 2;
        const forceVariation = 0.3 + Math.random() * 0.4;
        const throwForce = baseForce * forceVariation;
        
        // Направление броска (разброс для разных кубиков)
        const spreadAngle = (Math.PI * 0.1) * (index / Math.max(1, this.dice.length - 1));
        
        // Начальная скорость
        const velocity = new THREE.Vector3(
            Math.sin(spreadAngle) * throwForce * Math.cos(throwAngle) * (Math.random() - 0.5) * 0.5,
            throwForce * Math.sin(throwAngle) * (1.2 + Math.random() * 0.3),
            Math.cos(spreadAngle) * throwForce * Math.cos(throwAngle) * (Math.random() - 0.5) * 0.5
        );
        
        // Эффект подкрутки
        const spinAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        
        const spinIntensity = (2 + config.inertia * 3) * (0.8 + Math.random() * 0.4);
        const angularVelocity = new THREE.Vector3(
            spinAxis.x * spinIntensity * (0.8 + Math.random() * 0.4),
            spinAxis.y * spinIntensity * (0.8 + Math.random() * 0.4),
            spinAxis.z * spinIntensity * (0.8 + Math.random() * 0.4)
        );
        
        // Сохраняем физические свойства
        dice.userData.velocity = velocity;
        dice.userData.angularVelocity = angularVelocity;
        dice.userData.spinAxis = spinAxis;
        dice.userData.lastPosition = dice.position.clone();
        dice.userData.lastVelocity = velocity.clone();
        dice.userData.collisionCount = 0;
        dice.userData.isRollingOnTable = false;
        dice.userData.airTime = 0;
        dice.userData.energyLoss = 0;
        dice.userData.contactPoints = [];
        
        // Начальное вращение для более реалистичного броска
        dice.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
    }
    
    // Проверка столкновений между кубиками
    checkDiceCollisions(dice) {
        for (let i = 0; i < this.dice.length; i++) {
            const diceA = this.dice[i];
            if (!diceA.userData.isRolling || diceA === dice) continue;
            
            for (let j = i + 1; j < this.dice.length; j++) {
                const diceB = this.dice[j];
                if (!diceB.userData.isRolling || diceB === dice) continue;
                
                const distance = diceA.position.distanceTo(diceB.position);
                const minDistance = (diceA.userData.config.size + diceB.userData.config.size) * 0.6;
                
                if (distance < minDistance) {
                    this.resolveDiceCollision(diceA, diceB, distance, minDistance);
                }
            }
        }
    }
    
    resolveDiceCollision(diceA, diceB, distance, minDistance) {
        // Вектор от A к B
        const collisionNormal = new THREE.Vector3()
            .subVectors(diceB.position, diceA.position)
            .normalize();
        
        // Коррекция перекрытия
        const overlap = minDistance - distance;
        const correction = collisionNormal.clone().multiplyScalar(overlap * 0.5);
        
        diceA.position.sub(correction);
        diceB.position.add(correction);
        
        // Относительная скорость
        const relativeVelocity = new THREE.Vector3()
            .subVectors(diceB.userData.velocity, diceA.userData.velocity);
        
        const velocityAlongNormal = relativeVelocity.dot(collisionNormal);
        
        if (velocityAlongNormal > 0) return;
        
        // Коэффициент восстановления с учетом массы и упругости
        const restitution = Math.min(
            diceA.userData.config.restitution,
            diceB.userData.config.restitution
        ) * 0.7;
        
        // Импульс
        const impulseScalar = -(1 + restitution) * velocityAlongNormal;
        const massA = diceA.userData.config.mass;
        const massB = diceB.userData.config.mass;
        
        const impulse = collisionNormal.multiplyScalar(impulseScalar / (massA + massB));
        
        // Обновляем скорости
        diceA.userData.velocity.sub(impulse.clone().multiplyScalar(massB));
        diceB.userData.velocity.add(impulse.clone().multiplyScalar(massA));
        
        // Учет трения при скольжении
        const tangent = relativeVelocity.clone()
            .sub(collisionNormal.multiplyScalar(velocityAlongNormal));
        
        if (tangent.length() > 0.1) {
            const frictionImpulse = tangent.normalize().multiplyScalar(
                Math.min(diceA.userData.config.friction, diceB.userData.config.friction) * 0.3
            );
            
            diceA.userData.velocity.add(frictionImpulse);
            diceB.userData.velocity.sub(frictionImpulse);
        }
        
        // Добавляем вращение от столкновения
        const collisionSpin = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).multiplyScalar(3);
        
        diceA.userData.angularVelocity.add(collisionSpin);
        diceB.userData.angularVelocity.sub(collisionSpin);
        
        diceA.userData.collisionCount++;
        diceB.userData.collisionCount++;
        
        // Регистрируем точку контакта
        const contactPoint = diceA.position.clone().add(diceB.position).multiplyScalar(0.5);
        diceA.userData.contactPoints.push({
            point: contactPoint,
            time: Date.now()
        });
        diceB.userData.contactPoints.push({
            point: contactPoint,
            time: Date.now()
        });
    }
    
    // Обработка столкновения со столом
    handleTableCollision(dice, deltaTime) {
        const config = dice.userData.config;
        const tableY = -2; // Y поверхности стола
        const diceBottomY = dice.position.y - config.size * 0.5;
        
        if (diceBottomY < tableY && dice.userData.velocity.y < 0) {
            // Коррекция положения
            dice.position.y = tableY + config.size * 0.5;
            
            // Энергия удара
            const impactEnergy = dice.userData.velocity.length();
            
            // Отскок с учетом упругости и энергии
            const combinedRestitution = config.restitution * 0.8;
            const bounceFactor = Math.min(1, impactEnergy * 0.3);
            
            dice.userData.velocity.y = -dice.userData.velocity.y * combinedRestitution * bounceFactor;
            
            // Потери энергии при ударе
            dice.userData.energyLoss += (1 - bounceFactor) * 0.5;
            
            // Уменьшение отскока при множественных столкновениях
            const bounceDamping = Math.pow(0.7, dice.userData.collisionCount);
            dice.userData.velocity.y *= bounceDamping;
            
            // Трение о поверхность при ударе
            if (impactEnergy > 1) {
                const surfaceFriction = config.friction * this.getSurfaceFriction(dice.position);
                dice.userData.velocity.x *= (1 - surfaceFriction * 0.3);
                dice.userData.velocity.z *= (1 - surfaceFriction * 0.3);
            }
            
            // Проверяем, катится ли кубик по столу
            const isMovingHorizontally = Math.abs(dice.userData.velocity.x) > 0.1 || 
                                        Math.abs(dice.userData.velocity.z) > 0.1;
            
            if (isMovingHorizontally && Math.abs(dice.userData.velocity.y) < 0.5) {
                dice.userData.isRollingOnTable = true;
                this.applyRollingPhysics(dice, deltaTime);
            } else {
                dice.userData.isRollingOnTable = false;
            }
            
            // Вращение от удара
            if (impactEnergy > 0.5) {
                const impactTorque = new THREE.Vector3(
                    dice.userData.velocity.z * 0.2 - dice.userData.velocity.x * 0.1,
                    0,
                    dice.userData.velocity.x * 0.2 - dice.userData.velocity.z * 0.1
                );
                dice.userData.angularVelocity.add(impactTorque);
            }
            
            dice.userData.collisionCount++;
            dice.userData.airTime = 0; // Сбрасываем время в воздухе
        } else if (dice.position.y > tableY + 0.1) {
            dice.userData.airTime += deltaTime;
            dice.userData.isRollingOnTable = false;
        }
    }
    
    getSurfaceFriction(position) {
        // Разное трение в разных зонах стола
        const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
        
        if (distanceFromCenter < 6) {
            return 0.15; // Меньше трения на коврике
        } else {
            return 0.25; // Больше трения на дереве
        }
    }
    
    applyRollingPhysics(dice, deltaTime) {
        const config = dice.userData.config;
        
        // Сила трения при качении
        const rollingFriction = config.rollingFriction * this.getSurfaceFriction(dice.position);
        const frictionForce = new THREE.Vector3(
            -Math.sign(dice.userData.velocity.x) * rollingFriction,
            0,
            -Math.sign(dice.userData.velocity.z) * rollingFriction
        );
        
        // Применяем трение
        dice.userData.velocity.x += frictionForce.x * deltaTime;
        dice.userData.velocity.z += frictionForce.z * deltaTime;
        
        // Гашение скорости при качении
        const damping = 1 - (rollingFriction * 0.5);
        dice.userData.velocity.x *= damping;
        dice.userData.velocity.z *= damping;
        
        // Вращение от качения
        if (dice.userData.velocity.length() > 0.2) {
            const rollTorque = new THREE.Vector3(
                -dice.userData.velocity.z * 0.15 * config.inertia,
                0,
                dice.userData.velocity.x * 0.15 * config.inertia
            );
            dice.userData.angularVelocity.add(rollTorque.multiplyScalar(deltaTime));
        }
        
        // Выравнивание при медленном движении
        if (dice.userData.velocity.length() < 1) {
            this.applyStabilization(dice, deltaTime);
        }
    }
    
    applyStabilization(dice, deltaTime) {
        // Плавное выравнивание кубика на столе
        const targetRotationX = 0;
        const targetRotationZ = 0;
        
        const stabilizationSpeed = 0.1 * dice.userData.config.inertia;
        
        dice.rotation.x = THREE.MathUtils.lerp(
            dice.rotation.x,
            targetRotationX,
            stabilizationSpeed * deltaTime * 10
        );
        
        dice.rotation.z = THREE.MathUtils.lerp(
            dice.rotation.z,
            targetRotationZ,
            stabilizationSpeed * deltaTime * 10
        );
    }
    
    updateDicePhysics(dice, deltaTime) {
        const config = dice.userData.config;
        
        // Гравитация с учетом массы
        dice.userData.velocity.y += -9.81 * deltaTime * config.mass;
        
        // Сопротивление воздуха (зависит от скорости и размера)
        const airResistance = config.airResistance * 
                            Math.pow(dice.userData.velocity.length(), 1.5) *
                            (1 + dice.userData.airTime * 0.1);
        
        const airDamping = 1 - airResistance * deltaTime;
        dice.userData.velocity.multiplyScalar(Math.max(airDamping, 0.95));
        
        // Демпфирование угловой скорости
        const angularDamping = 1 - (config.airResistance * 0.5 * deltaTime);
        dice.userData.angularVelocity.multiplyScalar(angularDamping);
        
        // Гироскопическая стабилизация
        if (dice.userData.spinAxis && dice.userData.angularVelocity.length() > 0.3) {
            const currentAxis = dice.userData.angularVelocity.clone().normalize();
            const correction = dice.userData.spinAxis.clone()
                .sub(currentAxis)
                .multiplyScalar(0.05 * deltaTime * config.inertia);
            dice.userData.angularVelocity.add(correction);
        }
        
        // Обновление позиции
        dice.position.add(dice.userData.velocity.clone().multiplyScalar(deltaTime));
        
        // Обновление вращения
        dice.rotation.x += dice.userData.angularVelocity.x * deltaTime;
        dice.rotation.y += dice.userData.angularVelocity.y * deltaTime;
        dice.rotation.z += dice.userData.angularVelocity.z * deltaTime;
    }
    
    checkDiceStopped(dice, elapsed) {
        const config = dice.userData.config;
        const isSlow = dice.userData.velocity.length() < 0.05 && 
                      dice.userData.angularVelocity.length() < 0.05;
        const isOnTable = dice.position.y <= -1.5 + config.size * 0.5;
        const timeElapsed = elapsed > 5000; // Максимум 5 секунд
        
        if ((isSlow && isOnTable) || timeElapsed) {
            dice.userData.isRolling = false;
            
            // Финальная коррекция положения
            dice.position.y = -2 + config.size * 0.5;
            
            // Определяем результат
            this.calculateDiceResult(dice);
            
            return true;
        }
        return false;
    }
    
    calculateDiceResult(dice) {
        // Определяем верхнюю грань
        const worldUp = new THREE.Vector3(0, 1, 0);
        const diceUp = new THREE.Vector3();
        dice.getWorldDirection(diceUp);
        
        // Для простоты, определяем ближайшую грань к направлению "вверх"
        // В реальном проекте нужно учитывать нормали граней
        const result = Math.floor(Math.random() * dice.userData.sides) + 1;
        dice.userData.currentValue = result;
        
        // Подсвечиваем результат
        this.showDiceResult(dice, result);
        
        return result;
    }
    
    showDiceResult(dice, result) {
        // Подсвечиваем кубик
        const highlightColor = new THREE.Color(0xFFD700);
        const originalColor = this.getDiceColor(dice.userData.sides);
        
        if (Array.isArray(dice.material)) {
            dice.material.forEach(mat => {
                mat.emissive = highlightColor;
                mat.emissiveIntensity = 0.3;
            });
        } else {
            dice.material.emissive = highlightColor;
            dice.material.emissiveIntensity = 0.3;
        }
        
        // Анимация подсветки
        let intensity = 0.3;
        const pulse = () => {
            intensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
            
            if (Array.isArray(dice.material)) {
                dice.material.forEach(mat => {
                    mat.emissiveIntensity = intensity;
                });
            } else {
                dice.material.emissiveIntensity = intensity;
            }
            
            if (intensity > 0.1) {
                requestAnimationFrame(pulse);
            }
        };
        
        pulse();
        
        // Возвращаем исходный цвет через 2 секунды
        setTimeout(() => {
            if (Array.isArray(dice.material)) {
                dice.material.forEach(mat => {
                    mat.emissive = new THREE.Color(0x000000);
                    mat.emissiveIntensity = 0;
                });
            } else {
                dice.material.emissive = new THREE.Color(0x000000);
                dice.material.emissiveIntensity = 0;
            }
        }, 2000);
        
        console.log(`${dice.userData.type}: ${result}`);
    }
    
    clearDice() {
        for (const dice of this.dice) {
            this.scene.remove(dice);
        }
        this.dice = [];
    }
    
    animate() {
        if (!this.isInitialized) return;
        
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        const deltaTime = Math.min(this.clock.getDelta(), 0.033); // Ограничиваем deltaTime
        
        // Обновляем физику кубиков
        for (const dice of this.dice) {
            if (dice.userData.isRolling) {
                const elapsed = Date.now() - dice.userData.startTime;
                
                // Обновляем физику
                this.updateDicePhysics(dice, deltaTime);
                
                // Обработка столкновений со столом
                this.handleTableCollision(dice, deltaTime);
                
                // Проверка столкновений между кубиками
                this.checkDiceCollisions(dice);
                
                // Проверяем, остановился ли кубик
                this.checkDiceStopped(dice, elapsed);
                
                // Очищаем старые точки контакта
                dice.userData.contactPoints = dice.userData.contactPoints.filter(
                    point => Date.now() - point.time < 1000
                );
            }
            
            // Легкая анимация для статичных кубиков
            if (!dice.userData.isRolling) {
                const bob = Math.sin(time * 2 + dice.id) * 0.01;
                const baseHeight = -2 + dice.userData.config.size * 0.5;
                dice.position.y = baseHeight + bob;
                
                // Естественное дрожание
                if (this.dice.length > 1) {
                    const microShake = Math.sin(time * 8 + dice.id) * 0.002;
                    dice.rotation.x += microShake;
                    dice.rotation.z += microShake;
                }
            }
        }
        
        // Плавное движение камеры
        this.updateCamera(time);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateCamera(time) {
        // Медленное вращение камеры вокруг сцены
        if (!this.isUserControllingCamera) {
            const radius = 15;
            const speed = 0.05;
            
            this.camera.position.x = Math.sin(time * speed) * radius;
            this.camera.position.z = Math.cos(time * speed) * radius;
            this.camera.position.y = 8 + Math.sin(time * speed * 0.5) * 2;
            
            this.camera.lookAt(0, 0, 0);
        }
    }
    
    onWindowResize() {
        if (!this.isInitialized || !this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    // Публичные методы для взаимодействия
    roll(diceCount, diceSides, results) {
        this.rollDice(diceCount, diceSides, results);
    }
    
    clear() {
        this.clearDice();
    }
    
    setCameraAngle(angle) {
        this.isUserControllingCamera = true;
        
        switch (angle) {
            case 'top':
                this.camera.position.set(0, 15, 0.1);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'front':
                this.camera.position.set(0, 8, 15);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'side':
                this.camera.position.set(15, 8, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'close':
                this.camera.position.set(0, 3, 8);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'dynamic':
                this.isUserControllingCamera = false;
                break;
        }
    }
    
    // Метод для отладки и демонстрации
    addTestDice() {
        // Добавляем по одному кубику каждого типа
        const diceTypes = [4, 6, 8, 10, 12, 20, 100];
        
        diceTypes.forEach((sides, index) => {
            const x = (index - 3) * 3;
            const dice = this.createDice(sides, Math.floor(Math.random() * sides) + 1);
            
            if (dice) {
                dice.position.set(x, -1.5 + dice.userData.config.size * 0.5, 0);
                dice.rotation.set(
                    Math.random() * Math.PI * 0.1,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 0.1
                );
                dice.userData.isRolling = false;
            }
        });
    }
    
    // Метод для броска всех кубиков на столе
    rollAllDice() {
        this.dice.forEach(dice => {
            dice.userData.isRolling = true;
            dice.userData.startTime = Date.now();
            this.applyRealisticThrowPhysics(dice, dice.userData.config, Math.random());
        });
    }
}

// Глобальная переменная для доступа к рендереру
window.Dice3DRenderer = Dice3DRenderer;