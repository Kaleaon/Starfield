// Core mathematical types
export class Vec2 {
    public x: number = 0;
    public y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public normalize(): Vec2 {
        const len = this.length();
        if (len > 0) {
            return new Vec2(this.x / len, this.y / len);
        }
        return new Vec2(0, 0);
    }
}

export class Vec3 {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
}

export class Color {
    public r: number = 0;
    public g: number = 0;
    public b: number = 0;
    public a: number = 0;

    constructor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

// Galaxy Types
export enum GalaxyType {
    SPIRAL = 'spiral',
    RING = 'ring',
    CLUSTER = 'cluster',
    ELLIPTICAL = 'elliptical',
    HYBRID = 'hybrid'
}

// Star and system types
export class Star {
    public theta0: number = 0;      // initial angular position
    public velTheta: number = 0;    // angular velocity
    public tiltAngle: number = 0;   // tilt angle
    public a: number = 0;           // semi-major axis
    public b: number = 0;           // semi-minor axis
    public temp: number = 0;        // star temperature
    public mag: number = 0;         // brightness
    public type: number = 0;        // 0:star, 1:dust, 2:H2 regions
    public position: Vec3 = new Vec3();
}

export class StarSystem {
    public id: string = '';
    public name: string = '';
    public position: Vec3 = new Vec3();
    public stars: Star[] = [];
    public planetCount: number = 0;
    public population: number = 0;
    public faction: string = '';
    public hyperspaceLanes: string[] = [];
    public isLabeled: boolean = false;
    public metadata: Map<string, any> = new Map();
}

export class HyperspaceLane {
    public id: string = '';
    public name: string = '';
    public startSystem: string = '';
    public endSystem: string = '';
    public distance: number = 0;
    public travelTime: number = 0;
    public safetyRating: number = 1.0;
    public trafficLevel: string = 'low';
    public controllingFaction: string = '';
}

// Galaxy configuration
export class GalaxyConfig {
    public type: GalaxyType = GalaxyType.SPIRAL;
    public radius: number = 15000;
    public coreRadius: number = 6000;
    public numStars: number = 60000;
    public numSystems: number = 1000;
    public spiralArms: number = 2;
    public deltaAngle: number = 0.019;
    public eccentricity1: number = 0.8;
    public eccentricity2: number = 1.0;
    public hasDarkMatter: boolean = true;
    public perturbationN: number = 0;
    public perturbationAmp: number = 0;
    public baseTemp: number = 4000;
    public dustRenderSize: number = 70;
    
    // Ring galaxy specific
    public ringRadius: number = 8000;
    public ringThickness: number = 2000;
    
    // Cluster galaxy specific
    public clusterCount: number = 5;
    public clusterSpread: number = 5000;
    
    // Hybrid configuration
    public hybridComponents: GalaxyType[] = [];
    public hybridWeights: number[] = [];
}

// Rendering vertex types
export abstract class VertexBase {
    public abstract writeTo(array: Float32Array, offset: number): void;
    public abstract numberOfFloats(): number;
}

export class VertexColor extends VertexBase {
    public pos: Vec3 = new Vec3();
    public col: Color = new Color();

    constructor(x: number, y: number, z: number, r: number, g: number, b: number, a: number) {
        super();
        this.pos = new Vec3(x, y, z);
        this.col = new Color(r, g, b, a);
    }

    public numberOfFloats(): number {
        return 7;
    }

    public writeTo(array: Float32Array, offset: number): void {
        array[offset + 0] = this.pos.x;
        array[offset + 1] = this.pos.y;
        array[offset + 2] = this.pos.z;
        array[offset + 3] = this.col.r;
        array[offset + 4] = this.col.g;
        array[offset + 5] = this.col.b;
        array[offset + 6] = this.col.a;
    }
}

export class VertexStar extends VertexBase {
    public star: Star = new Star();
    public col: Color = new Color();

    constructor(star: Star, col: Color) {
        super();
        this.star = star;
        this.col = col;
    }

    public numberOfFloats(): number {
        return 12;
    }

    public writeTo(array: Float32Array, offset: number): void {
        array[offset + 0] = this.star.theta0;
        array[offset + 1] = this.star.velTheta;
        array[offset + 2] = this.star.tiltAngle;
        array[offset + 3] = this.star.a;
        array[offset + 4] = this.star.b;
        array[offset + 5] = this.star.temp;
        array[offset + 6] = this.star.mag;
        array[offset + 7] = this.star.type;
        array[offset + 8] = this.col.r;
        array[offset + 9] = this.col.g;
        array[offset + 10] = this.col.b;
        array[offset + 11] = this.col.a;
    }
}