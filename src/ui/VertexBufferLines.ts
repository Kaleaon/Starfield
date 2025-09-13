import { VertexColor } from '../core/Types';
import { VertexBufferBase } from './VertexBufferBase';

export class VertexBufferLines extends VertexBufferBase<VertexColor> {
    private vao: WebGLVertexArrayObject | null = null;

    constructor(gl: WebGL2RenderingContext) {
        super(gl);
        this.vao = gl.createVertexArray();
    }

    public setupVertexAttributes(): void {
        if (!this.vao || !this.buffer) return;

        this.gl.bindVertexArray(this.vao);
        this.bind();

        const stride = 7 * 4; // 7 floats * 4 bytes per float

        // Position (location 0)
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, stride, 0);

        // Color (location 1)
        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, stride, 12);

        this.gl.bindVertexArray(null);
    }

    public draw(): void {
        if (!this.vao || this.vertices.length === 0) return;

        this.updateBuffer();
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.LINES, 0, this.vertices.length);
        this.gl.bindVertexArray(null);
    }

    public dispose(): void {
        super.dispose();
        if (this.vao) {
            this.gl.deleteVertexArray(this.vao);
            this.vao = null;
        }
    }
}