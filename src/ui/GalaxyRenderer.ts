import { mat4, vec3 } from 'gl-matrix';
import { Star, VertexStar, VertexColor, Color, StarSystem, HyperspaceLane, Vec3 } from '../core/Types';
import { Helper } from '../core/Helper';
import { VertexBufferStars } from './VertexBufferStars';
import { VertexBufferLines } from './VertexBufferLines';
import { ShaderManager } from './ShaderManager';

export class GalaxyRenderer {
    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private shaderManager: ShaderManager;
    
    private starBuffer: VertexBufferStars;
    private lineBuffer: VertexBufferLines;
    
    private projectionMatrix: mat4 = mat4.create();
    private viewMatrix: mat4 = mat4.create();
    
    private camera: {
        position: vec3;
        target: vec3;
        zoom: number;
        rotation: number;
    };
    
    private animationTime: number = 0;
    private animationSpeed: number = 0.01;
    private isAnimating: boolean = true;
    
    private renderOptions: {
        showStars: boolean;
        showDust: boolean;
        showH2Regions: boolean;
        showHyperspaceLanes: boolean;
        showSystemLabels: boolean;
        pointSize: number;
    };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        this.gl = gl;
        
        this.shaderManager = new ShaderManager(gl);
        this.starBuffer = new VertexBufferStars(gl);
        this.lineBuffer = new VertexBufferLines(gl);
        
        this.camera = {
            position: vec3.fromValues(0, 0, 30000),
            target: vec3.fromValues(0, 0, 0),
            zoom: 1.0,
            rotation: 0
        };
        
        this.renderOptions = {
            showStars: true,
            showDust: true,
            showH2Regions: true,
            showHyperspaceLanes: true,
            showSystemLabels: true,
            pointSize: 2.0
        };
        
        this.initializeGL();
        this.setupEventHandlers();
        this.updateMatrices();
    }

    private initializeGL(): void {
        this.gl.clearColor(0.01, 0.01, 0.05, 1.0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        
        this.starBuffer.setupVertexAttributes();
        this.lineBuffer.setupVertexAttributes();
    }

    private setupEventHandlers(): void {
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;
                
                // Pan the camera
                this.camera.target[0] -= deltaX * 10 * this.camera.zoom;
                this.camera.target[1] += deltaY * 10 * this.camera.zoom;
                
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                this.updateMatrices();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.zoom = Math.max(0.1, Math.min(10.0, this.camera.zoom * zoomFactor));
            this.updateMatrices();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resize();
        });
    }

    private updateMatrices(): void {
        // Update projection matrix
        const aspect = this.canvas.width / this.canvas.height;
        const viewSize = 20000 * this.camera.zoom;
        
        mat4.ortho(
            this.projectionMatrix,
            -viewSize * aspect,
            viewSize * aspect,
            -viewSize,
            viewSize,
            -50000,
            50000
        );
        
        // Update view matrix
        const eye = vec3.clone(this.camera.position);
        vec3.add(eye, eye, this.camera.target);
        
        mat4.lookAt(
            this.viewMatrix,
            eye,
            this.camera.target,
            vec3.fromValues(0, 1, 0)
        );
    }

    public resize(): void {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
            this.updateMatrices();
        }
    }

    public setStars(stars: Star[]): void {
        this.starBuffer.clear();
        
        for (const star of stars) {
            // Filter based on render options
            if (!this.renderOptions.showStars && star.type === 0) continue;
            if (!this.renderOptions.showDust && star.type === 1) continue;
            if (!this.renderOptions.showH2Regions && star.type === 2) continue;
            
            const color = Helper.temperatureToColor(star.temp);
            
            // Adjust color based on star type
            if (star.type === 1) {
                // Dust - reddish brown
                color.r *= 0.8;
                color.g *= 0.6;
                color.b *= 0.4;
                color.a = 0.6;
            } else if (star.type === 2) {
                // H2 regions - bright emission nebulae
                color.r = Math.max(color.r, 0.8);
                color.g = Math.max(color.g, 0.3);
                color.b = Math.max(color.b, 0.5);
                color.a = 0.8;
            }
            
            const vertex = new VertexStar(star, color);
            this.starBuffer.addVertex(vertex);
        }
    }

    public setHyperspaceLanes(lanes: HyperspaceLane[], systems: StarSystem[]): void {
        if (!this.renderOptions.showHyperspaceLanes) {
            this.lineBuffer.clear();
            return;
        }
        
        this.lineBuffer.clear();
        
        // Create a map for quick system lookup
        const systemMap = new Map<string, StarSystem>();
        for (const system of systems) {
            systemMap.set(system.id, system);
        }
        
        for (const lane of lanes) {
            const startSystem = systemMap.get(lane.startSystem);
            const endSystem = systemMap.get(lane.endSystem);
            
            if (!startSystem || !endSystem) continue;
            
            // Color based on traffic level and safety
            let color: Color;
            if (lane.trafficLevel === 'high') {
                color = new Color(0.2, 0.8, 0.2, 0.8); // Green for major routes
            } else if (lane.trafficLevel === 'medium') {
                color = new Color(0.8, 0.8, 0.2, 0.6); // Yellow for moderate routes
            } else {
                color = new Color(0.6, 0.6, 0.6, 0.4); // Gray for minor routes
            }
            
            // Adjust alpha based on safety rating
            color.a *= lane.safetyRating;
            
            const startVertex = new VertexColor(
                startSystem.position.x,
                startSystem.position.y,
                startSystem.position.z,
                color.r, color.g, color.b, color.a
            );
            
            const endVertex = new VertexColor(
                endSystem.position.x,
                endSystem.position.y,
                endSystem.position.z,
                color.r, color.g, color.b, color.a
            );
            
            this.lineBuffer.addVertex(startVertex);
            this.lineBuffer.addVertex(endVertex);
        }
    }

    public render(): void {
        if (this.isAnimating) {
            this.animationTime += this.animationSpeed;
        }
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Render stars
        if (this.shaderManager.useProgram('star')) {
            const program = this.shaderManager.getProgram('star')!;
            
            // Set uniforms
            const projectionLoc = this.gl.getUniformLocation(program, 'uProjectionMatrix');
            const viewLoc = this.gl.getUniformLocation(program, 'uViewMatrix');
            const timeLoc = this.gl.getUniformLocation(program, 'uTime');
            const pointSizeLoc = this.gl.getUniformLocation(program, 'uPointSize');
            
            if (projectionLoc) {
                this.gl.uniformMatrix4fv(projectionLoc, false, this.projectionMatrix);
            }
            if (viewLoc) {
                this.gl.uniformMatrix4fv(viewLoc, false, this.viewMatrix);
            }
            if (timeLoc) {
                this.gl.uniform1f(timeLoc, this.animationTime);
            }
            if (pointSizeLoc) {
                this.gl.uniform1f(pointSizeLoc, this.renderOptions.pointSize);
            }
            
            this.starBuffer.draw();
        }
        
        // Render hyperspace lanes
        if (this.shaderManager.useProgram('line')) {
            const program = this.shaderManager.getProgram('line')!;
            
            const projectionLoc = this.gl.getUniformLocation(program, 'uProjectionMatrix');
            const viewLoc = this.gl.getUniformLocation(program, 'uViewMatrix');
            
            if (projectionLoc) {
                this.gl.uniformMatrix4fv(projectionLoc, false, this.projectionMatrix);
            }
            if (viewLoc) {
                this.gl.uniformMatrix4fv(viewLoc, false, this.viewMatrix);
            }
            
            this.gl.lineWidth(1.0);
            this.lineBuffer.draw();
        }
    }

    public startAnimation(): void {
        this.isAnimating = true;
    }

    public stopAnimation(): void {
        this.isAnimating = false;
    }

    public setAnimationSpeed(speed: number): void {
        this.animationSpeed = Math.max(0, Math.min(1, speed));
    }

    public setRenderOption(option: keyof typeof this.renderOptions, value: any): void {
        (this.renderOptions as any)[option] = value;
    }

    public getRenderOption(option: keyof typeof this.renderOptions): any {
        return this.renderOptions[option];
    }

    public getRenderOptions(): typeof this.renderOptions {
        return { ...this.renderOptions };
    }

    public resetCamera(): void {
        this.camera.position = vec3.fromValues(0, 0, 30000);
        this.camera.target = vec3.fromValues(0, 0, 0);
        this.camera.zoom = 1.0;
        this.camera.rotation = 0;
        this.updateMatrices();
    }

    public setCameraTarget(position: Vec3): void {
        vec3.set(this.camera.target, position.x, position.y, position.z);
        this.updateMatrices();
    }

    public getSystemAtPosition(x: number, y: number, systems: StarSystem[]): StarSystem | null {
        // Convert screen coordinates to world coordinates
        const rect = this.canvas.getBoundingClientRect();
        const normalizedX = ((x - rect.left) / rect.width) * 2 - 1;
        const normalizedY = -(((y - rect.top) / rect.height) * 2 - 1);
        
        // Simplified picking - in a real implementation you'd want proper ray casting
        const worldRadius = 1000 * this.camera.zoom; // Pick radius in world units
        
        for (const system of systems) {
            const distance = Math.sqrt(
                Math.pow(system.position.x - this.camera.target[0], 2) +
                Math.pow(system.position.y - this.camera.target[1], 2)
            );
            
            if (distance < worldRadius) {
                return system;
            }
        }
        
        return null;
    }

    public dispose(): void {
        this.starBuffer.dispose();
        this.lineBuffer.dispose();
        this.shaderManager.dispose();
    }
}