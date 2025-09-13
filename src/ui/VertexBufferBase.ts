import { VertexBase } from '../core/Types';

export abstract class VertexBufferBase<T extends VertexBase> {
    protected gl: WebGL2RenderingContext;
    protected buffer: WebGLBuffer | null = null;
    protected vertices: T[] = [];
    protected isDirty: boolean = true;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.buffer = gl.createBuffer();
    }

    /**
     * Add a vertex to the buffer
     */
    public addVertex(vertex: T): void {
        this.vertices.push(vertex);
        this.isDirty = true;
    }

    /**
     * Add multiple vertices to the buffer
     */
    public addVertices(vertices: T[]): void {
        this.vertices.push(...vertices);
        this.isDirty = true;
    }

    /**
     * Clear all vertices
     */
    public clear(): void {
        this.vertices = [];
        this.isDirty = true;
    }

    /**
     * Update the GPU buffer
     */
    public updateBuffer(): void {
        if (!this.isDirty || !this.buffer) return;

        const floatsPerVertex = this.vertices.length > 0 ? this.vertices[0].numberOfFloats() : 0;
        const totalFloats = this.vertices.length * floatsPerVertex;
        
        if (totalFloats === 0) return;

        const data = new Float32Array(totalFloats);
        
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].writeTo(data, i * floatsPerVertex);
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);

        this.isDirty = false;
    }

    /**
     * Bind the buffer for rendering
     */
    public bind(): void {
        if (this.buffer) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        }
    }

    /**
     * Get the number of vertices
     */
    public getVertexCount(): number {
        return this.vertices.length;
    }

    /**
     * Setup vertex attributes for rendering
     */
    public abstract setupVertexAttributes(): void;

    /**
     * Draw the vertices
     */
    public abstract draw(): void;

    /**
     * Cleanup resources
     */
    public dispose(): void {
        if (this.buffer) {
            this.gl.deleteBuffer(this.buffer);
            this.buffer = null;
        }
    }
}