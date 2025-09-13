export class ShaderManager {
    private gl: WebGL2RenderingContext;
    private programs: Map<string, WebGLProgram> = new Map();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.initializeShaders();
    }

    private initializeShaders(): void {
        // Star shader
        const starProgram = this.createShaderProgram(
            this.getStarVertexShader(),
            this.getStarFragmentShader()
        );
        if (starProgram) {
            this.programs.set('star', starProgram);
        }

        // Line shader for hyperspace lanes
        const lineProgram = this.createShaderProgram(
            this.getLineVertexShader(),
            this.getLineFragmentShader()
        );
        if (lineProgram) {
            this.programs.set('line', lineProgram);
        }
    }

    private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = this.gl.createProgram();
        if (!program) {
            return null;
        }

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Shader program failed to link:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    private createShader(type: number, source: string): WebGLShader | null {
        const shader = this.gl.createShader(type);
        if (!shader) {
            return null;
        }

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    private getStarVertexShader(): string {
        return `#version 300 es
        layout(location = 0) in float theta0;
        layout(location = 1) in float velTheta;
        layout(location = 2) in float tiltAngle;
        layout(location = 3) in float a;
        layout(location = 4) in float b;
        layout(location = 5) in float temperature;
        layout(location = 6) in float magnitude;
        layout(location = 7) in float starType;
        layout(location = 8) in vec4 color;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform float uTime;
        uniform float uPointSize;

        out vec4 vColor;
        out float vMagnitude;
        out float vStarType;

        void main() {
            // Calculate position based on orbital mechanics
            float currentTheta = theta0 + velTheta * uTime;
            
            // Apply tilt
            float cosTheta = cos(currentTheta);
            float sinTheta = sin(currentTheta);
            
            float x = a * cosTheta * cos(tiltAngle) - b * sinTheta * sin(tiltAngle);
            float y = a * cosTheta * sin(tiltAngle) + b * sinTheta * cos(tiltAngle);
            float z = 0.0;

            gl_Position = uProjectionMatrix * uViewMatrix * vec4(x, y, z, 1.0);
            
            // Point size based on magnitude and type
            float baseSize = uPointSize;
            if (starType > 1.5) {
                baseSize *= 2.0; // H2 regions are larger
            } else if (starType > 0.5) {
                baseSize *= 0.5; // Dust is smaller
            }
            
            gl_PointSize = baseSize * magnitude;
            
            vColor = color;
            vMagnitude = magnitude;
            vStarType = starType;
        }`;
    }

    private getStarFragmentShader(): string {
        return `#version 300 es
        precision highp float;

        in vec4 vColor;
        in float vMagnitude;
        in float vStarType;

        out vec4 fragColor;

        void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float distance = length(coord);
            
            if (vStarType > 1.5) {
                // H2 regions - nebula-like appearance
                float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
                alpha *= 0.8;
                fragColor = vec4(vColor.rgb, alpha);
            } else if (vStarType > 0.5) {
                // Dust - diffuse appearance
                float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
                alpha *= 0.4;
                fragColor = vec4(vColor.rgb * 0.6, alpha);
            } else {
                // Stars - point-like with soft edges
                float alpha = 1.0 - smoothstep(0.2, 0.5, distance);
                if (distance > 0.5) discard;
                
                // Add slight glow for brighter stars
                if (vMagnitude > 1.5) {
                    alpha += 0.3 * (1.0 - smoothstep(0.0, 0.8, distance));
                }
                
                fragColor = vec4(vColor.rgb, alpha);
            }
        }`;
    }

    private getLineVertexShader(): string {
        return `#version 300 es
        layout(location = 0) in vec3 position;
        layout(location = 1) in vec4 color;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;

        out vec4 vColor;

        void main() {
            gl_Position = uProjectionMatrix * uViewMatrix * vec4(position, 1.0);
            vColor = color;
        }`;
    }

    private getLineFragmentShader(): string {
        return `#version 300 es
        precision highp float;

        in vec4 vColor;
        out vec4 fragColor;

        void main() {
            fragColor = vColor;
        }`;
    }

    public getProgram(name: string): WebGLProgram | undefined {
        return this.programs.get(name);
    }

    public useProgram(name: string): boolean {
        const program = this.programs.get(name);
        if (program) {
            this.gl.useProgram(program);
            return true;
        }
        return false;
    }

    public dispose(): void {
        for (const program of this.programs.values()) {
            this.gl.deleteProgram(program);
        }
        this.programs.clear();
    }
}