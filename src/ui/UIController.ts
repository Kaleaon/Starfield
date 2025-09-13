import { GalaxyConfig, GalaxyType, StarSystem } from '../core/Types';
import { GalaxyFactory } from '../generators/GalaxyFactory';
import { StarSystemManager } from '../systems/StarSystemManager';
import { HyperspaceLaneGenerator } from '../lanes/HyperspaceLaneGenerator';
import { GalaxyRenderer } from './GalaxyRenderer';

export class UIController {
    private renderer: GalaxyRenderer;
    private systemManager: StarSystemManager;
    private laneGenerator: HyperspaceLaneGenerator;
    
    private currentConfig: GalaxyConfig;
    private selectedSystem: StarSystem | null = null;
    
    // UI Elements
    private controlPanel!: HTMLElement;
    private infoPanel!: HTMLElement;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new GalaxyRenderer(canvas);
        this.systemManager = new StarSystemManager();
        this.laneGenerator = new HyperspaceLaneGenerator();
        
        this.currentConfig = GalaxyFactory.createDefaultConfig(GalaxyType.SPIRAL);
        
        this.initializeUI();
        this.setupEventHandlers();
        
        // Generate initial galaxy
        this.generateGalaxy();
    }

    private initializeUI(): void {
        // Create control panel
        this.controlPanel = this.createControlPanel();
        document.body.appendChild(this.controlPanel);
        
        // Create info panel
        this.infoPanel = this.createInfoPanel();
        document.body.appendChild(this.infoPanel);
        
        // Style the canvas
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100vh';
        this.canvas.style.background = '#000';
    }

    private createControlPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'control-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 1000;
            max-height: 80vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <h3 style="margin-top: 0; color: #4CAF50;">Galaxy Generator</h3>
            
            <div class="section">
                <label>Galaxy Type:</label>
                <select id="galaxyType" style="width: 100%; margin: 5px 0;">
                    <option value="spiral">Spiral Galaxy</option>
                    <option value="ring">Ring Galaxy</option>
                    <option value="cluster">Cluster Galaxy</option>
                    <option value="elliptical">Elliptical Galaxy</option>
                    <option value="hybrid">Hybrid Galaxy</option>
                </select>
            </div>

            <div class="section">
                <label>Number of Stars:</label>
                <input type="range" id="numStars" min="10000" max="100000" step="5000" value="60000">
                <span id="numStarsValue">60000</span>
            </div>

            <div class="section">
                <label>Number of Systems:</label>
                <input type="range" id="numSystems" min="100" max="2000" step="50" value="1000">
                <span id="numSystemsValue">1000</span>
            </div>

            <div class="section">
                <label>Galaxy Radius:</label>
                <input type="range" id="radius" min="5000" max="30000" step="1000" value="15000">
                <span id="radiusValue">15000</span>
            </div>

            <div class="section" id="spiralOptions" style="display: none;">
                <label>Spiral Arms:</label>
                <input type="range" id="spiralArms" min="2" max="6" step="1" value="2">
                <span id="spiralArmsValue">2</span>
            </div>

            <div class="section" id="ringOptions" style="display: none;">
                <label>Ring Radius:</label>
                <input type="range" id="ringRadius" min="3000" max="15000" step="500" value="8000">
                <span id="ringRadiusValue">8000</span>
            </div>

            <div class="section" id="clusterOptions" style="display: none;">
                <label>Cluster Count:</label>
                <input type="range" id="clusterCount" min="3" max="10" step="1" value="5">
                <span id="clusterCountValue">5</span>
            </div>

            <div class="section">
                <button id="generateBtn" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Generate Galaxy
                </button>
            </div>

            <div class="section">
                <button id="randomBtn" style="width: 100%; padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                    Random Galaxy
                </button>
            </div>

            <div class="section">
                <h4>Display Options</h4>
                <label><input type="checkbox" id="showStars" checked> Stars</label><br>
                <label><input type="checkbox" id="showDust" checked> Dust</label><br>
                <label><input type="checkbox" id="showH2" checked> H2 Regions</label><br>
                <label><input type="checkbox" id="showLanes" checked> Hyperspace Lanes</label><br>
                <label><input type="checkbox" id="showLabels" checked> System Labels</label>
            </div>

            <div class="section">
                <label>Animation Speed:</label>
                <input type="range" id="animSpeed" min="0" max="0.1" step="0.001" value="0.01">
            </div>

            <div class="section">
                <label>Point Size:</label>
                <input type="range" id="pointSize" min="0.5" max="5" step="0.1" value="2">
            </div>
        `;

        return panel;
    }

    private createInfoPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'info-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 280px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 1000;
            max-height: 80vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <h3 style="margin-top: 0; color: #2196F3;">Galaxy Information</h3>
            <div id="galaxyStats"></div>
            
            <div id="systemInfo" style="margin-top: 15px; display: none;">
                <h4 style="color: #FF9800;">Selected System</h4>
                <div id="systemDetails"></div>
            </div>
        `;

        return panel;
    }

    private setupEventHandlers(): void {
        // Galaxy type change
        const galaxyTypeSelect = document.getElementById('galaxyType') as HTMLSelectElement;
        galaxyTypeSelect.addEventListener('change', () => {
            this.updateGalaxyTypeOptions(galaxyTypeSelect.value as GalaxyType);
        });

        // Range input updates
        this.setupRangeInputs();

        // Buttons
        document.getElementById('generateBtn')?.addEventListener('click', () => {
            this.generateGalaxy();
        });

        document.getElementById('randomBtn')?.addEventListener('click', () => {
            this.generateRandomGalaxy();
        });

        // Display options
        this.setupDisplayOptions();

        // Canvas click for system selection
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // Update display initially
        this.updateGalaxyTypeOptions(GalaxyType.SPIRAL);
    }

    private setupRangeInputs(): void {
        const inputs = ['numStars', 'numSystems', 'radius', 'spiralArms', 'ringRadius', 'clusterCount', 'animSpeed', 'pointSize'];
        
        for (const inputId of inputs) {
            const input = document.getElementById(inputId) as HTMLInputElement;
            const valueSpan = document.getElementById(inputId + 'Value');
            
            if (input && valueSpan) {
                input.addEventListener('input', () => {
                    valueSpan.textContent = input.value;
                    
                    if (inputId === 'animSpeed') {
                        this.renderer.setAnimationSpeed(parseFloat(input.value));
                    } else if (inputId === 'pointSize') {
                        this.renderer.setRenderOption('pointSize', parseFloat(input.value));
                    }
                });
            }
        }
    }

    private setupDisplayOptions(): void {
        const options = [
            { id: 'showStars', option: 'showStars' },
            { id: 'showDust', option: 'showDust' },
            { id: 'showH2', option: 'showH2Regions' },
            { id: 'showLanes', option: 'showHyperspaceLanes' },
            { id: 'showLabels', option: 'showSystemLabels' }
        ];

        for (const { id, option } of options) {
            const checkbox = document.getElementById(id) as HTMLInputElement;
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.renderer.setRenderOption(option as any, checkbox.checked);
                    this.updateDisplay();
                });
            }
        }
    }

    private updateGalaxyTypeOptions(type: GalaxyType): void {
        // Hide all type-specific options
        document.getElementById('spiralOptions')!.style.display = 'none';
        document.getElementById('ringOptions')!.style.display = 'none';
        document.getElementById('clusterOptions')!.style.display = 'none';

        // Show relevant options
        switch (type) {
            case GalaxyType.SPIRAL:
                document.getElementById('spiralOptions')!.style.display = 'block';
                break;
            case GalaxyType.RING:
                document.getElementById('ringOptions')!.style.display = 'block';
                break;
            case GalaxyType.CLUSTER:
                document.getElementById('clusterOptions')!.style.display = 'block';
                break;
        }
    }

    private generateGalaxy(): void {
        // Update config from UI
        this.updateConfigFromUI();
        
        // Generate galaxy
        const generator = GalaxyFactory.createGenerator(this.currentConfig);
        const stars = generator.generate();
        
        // Generate systems
        this.systemManager.generateSystemsFromStars(stars, this.currentConfig.numSystems);
        const systems = this.systemManager.getSystems();
        
        // Generate hyperspace lanes
        this.laneGenerator.generateLanes(systems);
        const lanes = this.laneGenerator.getLanes();
        
        // Update renderer
        this.renderer.setStars(stars);
        this.renderer.setHyperspaceLanes(lanes, systems);
        
        // Update info panel
        this.updateInfoPanel();
        
        // Reset camera
        this.renderer.resetCamera();
    }

    private generateRandomGalaxy(): void {
        this.currentConfig = GalaxyFactory.createRandomConfig();
        this.updateUIFromConfig();
        this.generateGalaxy();
    }

    private updateConfigFromUI(): void {
        const galaxyType = (document.getElementById('galaxyType') as HTMLSelectElement).value as GalaxyType;
        
        this.currentConfig.type = galaxyType;
        this.currentConfig.numStars = parseInt((document.getElementById('numStars') as HTMLInputElement).value);
        this.currentConfig.numSystems = parseInt((document.getElementById('numSystems') as HTMLInputElement).value);
        this.currentConfig.radius = parseInt((document.getElementById('radius') as HTMLInputElement).value);
        
        if (galaxyType === GalaxyType.SPIRAL) {
            this.currentConfig.spiralArms = parseInt((document.getElementById('spiralArms') as HTMLInputElement).value);
        } else if (galaxyType === GalaxyType.RING) {
            this.currentConfig.ringRadius = parseInt((document.getElementById('ringRadius') as HTMLInputElement).value);
        } else if (galaxyType === GalaxyType.CLUSTER) {
            this.currentConfig.clusterCount = parseInt((document.getElementById('clusterCount') as HTMLInputElement).value);
        }
        
        this.currentConfig.coreRadius = this.currentConfig.radius * 0.4;
    }

    private updateUIFromConfig(): void {
        (document.getElementById('galaxyType') as HTMLSelectElement).value = this.currentConfig.type;
        (document.getElementById('numStars') as HTMLInputElement).value = this.currentConfig.numStars.toString();
        (document.getElementById('numSystems') as HTMLInputElement).value = this.currentConfig.numSystems.toString();
        (document.getElementById('radius') as HTMLInputElement).value = this.currentConfig.radius.toString();
        
        // Update value displays
        document.getElementById('numStarsValue')!.textContent = this.currentConfig.numStars.toString();
        document.getElementById('numSystemsValue')!.textContent = this.currentConfig.numSystems.toString();
        document.getElementById('radiusValue')!.textContent = this.currentConfig.radius.toString();
        
        if (this.currentConfig.type === GalaxyType.SPIRAL) {
            (document.getElementById('spiralArms') as HTMLInputElement).value = this.currentConfig.spiralArms.toString();
            document.getElementById('spiralArmsValue')!.textContent = this.currentConfig.spiralArms.toString();
        } else if (this.currentConfig.type === GalaxyType.RING) {
            (document.getElementById('ringRadius') as HTMLInputElement).value = this.currentConfig.ringRadius.toString();
            document.getElementById('ringRadiusValue')!.textContent = this.currentConfig.ringRadius.toString();
        } else if (this.currentConfig.type === GalaxyType.CLUSTER) {
            (document.getElementById('clusterCount') as HTMLInputElement).value = this.currentConfig.clusterCount.toString();
            document.getElementById('clusterCountValue')!.textContent = this.currentConfig.clusterCount.toString();
        }
        
        this.updateGalaxyTypeOptions(this.currentConfig.type);
    }

    private updateInfoPanel(): void {
        const systemStats = this.systemManager.getSystemStats();
        const laneStats = this.laneGenerator.getLaneStats();
        
        const statsHtml = `
            <div><strong>Galaxy Type:</strong> ${this.currentConfig.type}</div>
            <div><strong>Total Stars:</strong> ${this.currentConfig.numStars.toLocaleString()}</div>
            <div><strong>Star Systems:</strong> ${systemStats.totalSystems.toLocaleString()}</div>
            <div><strong>Inhabited Systems:</strong> ${systemStats.inhabitedSystems.toLocaleString()}</div>
            <div><strong>Total Population:</strong> ${systemStats.totalPopulation.toLocaleString()}</div>
            <div><strong>Hyperspace Lanes:</strong> ${laneStats.totalLanes.toLocaleString()}</div>
            <div><strong>Average Lane Distance:</strong> ${Math.round(laneStats.averageDistance).toLocaleString()} units</div>
            <div><strong>Average System Distance:</strong> ${Math.round(systemStats.averageDistance).toLocaleString()} units</div>
        `;
        
        document.getElementById('galaxyStats')!.innerHTML = statsHtml;
    }

    private handleCanvasClick(e: MouseEvent): void {
        const systems = this.systemManager.getSystems();
        const clickedSystem = this.renderer.getSystemAtPosition(e.clientX, e.clientY, systems);
        
        if (clickedSystem) {
            this.selectSystem(clickedSystem);
        } else {
            this.selectedSystem = null;
            document.getElementById('systemInfo')!.style.display = 'none';
        }
    }

    private selectSystem(system: StarSystem): void {
        this.selectedSystem = system;
        
        const systemInfoDiv = document.getElementById('systemInfo')!;
        const systemDetailsDiv = document.getElementById('systemDetails')!;
        
        systemInfoDiv.style.display = 'block';
        
        const detailsHtml = `
            <div><strong>Name:</strong> ${system.name}</div>
            <div><strong>ID:</strong> ${system.id}</div>
            <div><strong>Position:</strong> (${Math.round(system.position.x)}, ${Math.round(system.position.y)})</div>
            <div><strong>Stars:</strong> ${system.stars.length}</div>
            <div><strong>Planets:</strong> ${system.planetCount}</div>
            <div><strong>Population:</strong> ${system.population.toLocaleString()}</div>
            <div><strong>Faction:</strong> ${system.faction}</div>
            <div><strong>Hyperspace Lanes:</strong> ${system.hyperspaceLanes.length}</div>
        `;
        
        systemDetailsDiv.innerHTML = detailsHtml;
        
        // Center camera on selected system
        this.renderer.setCameraTarget(system.position);
    }

    private updateDisplay(): void {
        const systems = this.systemManager.getSystems();
        const lanes = this.laneGenerator.getLanes();
        
        // Re-generate display data based on current render options
        this.renderer.setHyperspaceLanes(lanes, systems);
    }

    public startRenderLoop(): void {
        const render = () => {
            this.renderer.resize();
            this.renderer.render();
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
    }

    public dispose(): void {
        this.renderer.dispose();
        
        // Remove UI elements
        if (this.controlPanel.parentNode) {
            this.controlPanel.parentNode.removeChild(this.controlPanel);
        }
        if (this.infoPanel.parentNode) {
            this.infoPanel.parentNode.removeChild(this.infoPanel);
        }
    }
}