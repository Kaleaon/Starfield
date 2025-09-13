import { VertexStar } from '../core/Types';
import { VertexBufferBase } from './VertexBufferBase';

export class VertexBufferStars extends VertexBufferBase<VertexStar> {
    private vao: WebGLVertexArrayObject | null = null;

    constructor(gl: WebGL2RenderingContext) {
        super(gl);
        this.vao = gl.createVertexArray();
    }

    public setupVertexAttributes(): void {
        if (!this.vao || !this.buffer) return;

        this.gl.bindVertexArray(this.vao);
        this.bind();

        const stride = 12 * 4; // 12 floats * 4 bytes per float

        // Star data attributes
        // theta0 (location 0)
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 1, this.gl.FLOAT, false, stride, 0);

        // velTheta (location 1) 
        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribPointer(1, 1, this.gl.FLOAT, false, stride, 4);

        // tiltAngle (location 2)
        this.gl.enableVertexAttribArray(2);
        this.gl.vertexAttribPointer(2, 1, this.gl.FLOAT, false, stride, 8);

        // semi-major axis a (location 3)
        this.gl.enableVertexAttribArray(3);
        this.gl.vertexAttribPointer(3, 1, this.gl.FLOAT, false, stride, 12);

        // semi-minor axis b (location 4)
        this.gl.enableVertexAttribArray(4);
        this.gl.vertexAttribPointer(4, 1, this.gl.FLOAT, false, stride, 16);

        // temperature (location 5)
        this.gl.enableVertexAttribArray(5);
        this.gl.vertexAttribPointer(5, 1, this.gl.FLOAT, false, stride, 20);

        // magnitude (location 6)
        this.gl.enableVertexAttribArray(6);
        this.gl.vertexAttribPointer(6, 1, this.gl.FLOAT, false, stride, 24);

        // type (location 7)
        this.gl.enableVertexAttribArray(7);
        this.gl.vertexAttribPointer(7, 1, this.gl.FLOAT, false, stride, 28);

        // Color attributes
        // color rgba (location 8)
        this.gl.enableVertexAttribArray(8);
        this.gl.vertexAttribPointer(8, 4, this.gl.FLOAT, false, stride, 32);

        this.gl.bindVertexArray(null);
    }

    public draw(): void {
        if (!this.vao || this.vertices.length === 0) return;

        this.updateBuffer();
        this.gl.bindVertexArray(this.vao);
        this.gl.drawArrays(this.gl.POINTS, 0, this.vertices.length);
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