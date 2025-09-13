import { Star, GalaxyConfig, GalaxyType } from '../core/Types';
import { Helper } from '../core/Helper';
import { CumulativeDistributionFunction } from '../core/CumulativeDistributionFunction';

export abstract class GalaxyGenerator {
    protected config: GalaxyConfig;

    constructor(config: GalaxyConfig) {
        this.config = config;
    }

    public abstract generate(): Star[];
    
    protected generateBaseStar(radius: number, angle: number): Star {
        const star = new Star();
        
        // Calculate ellipse parameters based on radius
        star.a = radius;
        star.b = radius * (1 - this.config.eccentricity1 * (radius / this.config.radius));
        star.theta0 = angle;
        star.tiltAngle = 0;
        
        // Calculate orbital velocity using simplified rotation curve
        star.velTheta = this.calculateOrbitalVelocity(radius);
        
        // Set star temperature based on galactic position
        star.temp = this.calculateTemperature(radius);
        
        // Set star magnitude (brightness)
        star.mag = Helper.random(0.5, 2.0);
        
        // Determine star type (0: normal star, 1: dust, 2: H2 region)
        const typeRand = Math.random();
        if (typeRand < 0.8) {
            star.type = 0; // Normal star
        } else if (typeRand < 0.95) {
            star.type = 1; // Dust
        } else {
            star.type = 2; // H2 region
        }
        
        return star;
    }

    protected calculateOrbitalVelocity(radius: number): number {
        // Simplified galaxy rotation curve
        // Flat rotation curve in outer regions, rising in inner regions
        const vMax = 220; // km/s (typical for Milky Way-like galaxy)
        const r0 = this.config.coreRadius;
        
        if (radius < r0) {
            // Linear rise in core
            return (vMax * radius) / r0;
        } else {
            // Flat rotation curve with slight decline
            return vMax * Math.exp(-0.1 * (radius - r0) / r0);
        }
    }

    protected calculateTemperature(radius: number): number {
        // Temperature gradient: hotter stars in center, cooler in outer regions
        const centerTemp = this.config.baseTemp * 2;
        const outerTemp = this.config.baseTemp * 0.5;
        const tempGradient = (centerTemp - outerTemp) / this.config.radius;
        
        return Math.max(outerTemp, centerTemp - tempGradient * radius);
    }
}