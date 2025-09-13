import { Vec2, Vec3, Color } from './Types';

export class Helper {
    /**
     * Generate a random number between min and max
     */
    public static random(min: number = 0, max: number = 1): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * Generate a random integer between min and max (inclusive)
     */
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate a random point on a circle
     */
    public static randomPointOnCircle(radius: number): Vec2 {
        const angle = Math.random() * 2 * Math.PI;
        return new Vec2(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        );
    }

    /**
     * Generate a random point in a ring
     */
    public static randomPointInRing(innerRadius: number, outerRadius: number): Vec2 {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Helper.random(innerRadius, outerRadius);
        return new Vec2(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        );
    }

    /**
     * Calculate distance between two 2D points
     */
    public static distance2D(p1: Vec2, p2: Vec2): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate distance between two 3D points
     */
    public static distance3D(p1: Vec3, p2: Vec3): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Interpolate between two values
     */
    public static lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }

    /**
     * Clamp a value between min and max
     */
    public static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Convert temperature to color (simplified blackbody radiation)
     */
    public static temperatureToColor(temp: number): Color {
        // Simplified temperature to RGB conversion
        // Based on blackbody radiation approximation
        temp = Math.max(1000, Math.min(40000, temp));
        
        let red: number, green: number, blue: number;

        if (temp < 3300) {
            red = 1.0;
            green = Math.pow(temp / 3300, 0.5);
            blue = 0.0;
        } else if (temp < 5000) {
            red = 1.0;
            green = 0.8 + 0.2 * ((temp - 3300) / 1700);
            blue = Math.pow((temp - 3300) / 1700, 2);
        } else if (temp < 6500) {
            red = 1.0;
            green = 1.0;
            blue = 0.8 + 0.2 * ((temp - 5000) / 1500);
        } else {
            const factor = (temp - 6500) / 10000;
            red = Math.max(0.7, 1.0 - factor * 0.3);
            green = Math.max(0.8, 1.0 - factor * 0.2);
            blue = 1.0;
        }

        return new Color(red, green, blue, 1.0);
    }

    /**
     * Generate a unique ID
     */
    public static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Convert cartesian to polar coordinates
     */
    public static cartesianToPolar(x: number, y: number): { r: number, theta: number } {
        const r = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(y, x);
        return { r, theta };
    }

    /**
     * Convert polar to cartesian coordinates
     */
    public static polarToCartesian(r: number, theta: number): Vec2 {
        return new Vec2(r * Math.cos(theta), r * Math.sin(theta));
    }

    /**
     * Calculate spiral arm position using logarithmic spiral
     */
    public static calculateSpiralArmPosition(
        angle: number, 
        armIndex: number, 
        numArms: number,
        galaxyRadius: number,
        tightness: number = 0.2
    ): Vec2 {
        const armAngle = (2 * Math.PI * armIndex) / numArms;
        const spiralAngle = angle + armAngle;
        const radius = galaxyRadius * Math.exp(-tightness * spiralAngle);
        
        return new Vec2(
            radius * Math.cos(spiralAngle),
            radius * Math.sin(spiralAngle)
        );
    }

    /**
     * Generate Gaussian random number using Box-Muller transform
     */
    public static gaussianRandom(mean: number = 0, stdDev: number = 1): number {
        let u1 = 0, u2 = 0;
        while (u1 === 0) u1 = Math.random(); // Converting [0,1) to (0,1)
        while (u2 === 0) u2 = Math.random();
        
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * stdDev + mean;
    }

    /**
     * Create a smooth transition function (smoothstep)
     */
    public static smoothstep(edge0: number, edge1: number, x: number): number {
        const t = Helper.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
    }

    /**
     * Generate name for star system (simple name generator)
     */
    public static generateSystemName(): string {
        const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
        const suffixes = ['Centauri', 'Draconis', 'Orionis', 'Cygni', 'Lyrae', 'Vega', 'Sirius', 'Rigel', 'Aldebaran', 'Arcturus'];
        const sectors = ['Prime', 'Minor', 'Major', 'Nova', 'Proxima', 'Ultima', 'Tertius', 'Secundus'];
        
        const useThree = Math.random() > 0.7;
        
        if (useThree) {
            return `${prefixes[Helper.randomInt(0, prefixes.length - 1)]} ${suffixes[Helper.randomInt(0, suffixes.length - 1)]} ${sectors[Helper.randomInt(0, sectors.length - 1)]}`;
        } else {
            return `${prefixes[Helper.randomInt(0, prefixes.length - 1)]} ${suffixes[Helper.randomInt(0, suffixes.length - 1)]}`;
        }
    }
}