import { Star, GalaxyConfig } from '../core/Types';
import { Helper } from '../core/Helper';
import { CumulativeDistributionFunction } from '../core/CumulativeDistributionFunction';
import { GalaxyGenerator } from './GalaxyGenerator';

export class RingGalaxyGenerator extends GalaxyGenerator {
    private ringDensityCDF: CumulativeDistributionFunction;

    constructor(config: GalaxyConfig) {
        super(config);
        this.ringDensityCDF = CumulativeDistributionFunction.createRingDensityCDF(
            config.ringRadius,
            config.ringThickness,
            config.radius
        );
    }

    public generate(): Star[] {
        const stars: Star[] = [];
        
        // Generate the main ring
        const ringStars = this.generateMainRing();
        stars.push(...ringStars);
        
        // Generate central core (if any)
        const coreStars = this.generateCentralCore();
        stars.push(...coreStars);
        
        // Generate outer halo
        const haloStars = this.generateOuterHalo();
        stars.push(...haloStars);
        
        return stars;
    }

    private generateMainRing(): Star[] {
        const stars: Star[] = [];
        const ringStars = Math.floor(this.config.numStars * 0.7); // 70% in main ring
        
        for (let i = 0; i < ringStars; i++) {
            // Get radius from ring density distribution
            const radius = this.ringDensityCDF.getRandomValue();
            const angle = Helper.random(0, 2 * Math.PI);
            
            const star = this.generateBaseStar(radius, angle);
            
            // Ring galaxies often have active star formation
            if (Math.abs(radius - this.config.ringRadius) < this.config.ringThickness / 2) {
                if (Math.random() < 0.4) {
                    star.type = 2; // H2 region
                    star.temp *= 1.3; // Hotter due to star formation
                    star.mag *= 1.4; // Brighter
                }
            }
            
            // Add some orbital eccentricity variation in the ring
            star.b = star.a * (0.9 + 0.2 * Math.random());
            
            stars.push(star);
        }
        
        return stars;
    }

    private generateCentralCore(): Star[] {
        const stars: Star[] = [];
        const coreStars = Math.floor(this.config.numStars * 0.15); // 15% in core
        
        for (let i = 0; i < coreStars; i++) {
            // Exponential distribution in core
            const radius = Helper.random(0, this.config.coreRadius) * Math.pow(Math.random(), 2);
            const angle = Helper.random(0, 2 * Math.PI);
            
            const star = this.generateBaseStar(radius, angle);
            
            // Core stars in ring galaxies are often older
            star.temp = this.config.baseTemp * 0.6; // Cooler/redder
            star.mag *= 1.2; // Slightly brighter due to higher mass
            
            stars.push(star);
        }
        
        return stars;
    }

    private generateOuterHalo(): Star[] {
        const stars: Star[] = [];
        const haloStars = Math.floor(this.config.numStars * 0.15); // 15% in outer halo
        
        for (let i = 0; i < haloStars; i++) {
            // Sparse distribution outside the ring
            const radius = Helper.random(this.config.ringRadius + this.config.ringThickness, this.config.radius);
            const angle = Helper.random(0, 2 * Math.PI);
            
            const star = this.generateBaseStar(radius, angle);
            
            // Halo stars are typically old and metal-poor
            star.temp = this.config.baseTemp * 0.5; // Much cooler
            star.mag *= 0.8; // Dimmer
            
            stars.push(star);
        }
        
        return stars;
    }

    /**
     * Create a ring galaxy from a collision scenario
     * This adds shock wave patterns and disturbed regions
     */
    public generateCollisionRing(): Star[] {
        const stars = this.generate();
        
        // Add shock wave effects
        this.addShockWaveEffects(stars);
        
        // Add disturbed regions
        this.addDisturbedRegions(stars);
        
        return stars;
    }

    private addShockWaveEffects(stars: Star[]): void {
        const shockRadius = this.config.ringRadius;
        const shockWidth = this.config.ringThickness * 0.3;
        
        for (const star of stars) {
            const radius = star.a;
            const distanceFromShock = Math.abs(radius - shockRadius);
            
            if (distanceFromShock < shockWidth) {
                // Stars near the shock front have enhanced star formation
                if (Math.random() < 0.6) {
                    star.type = 2; // H2 region
                    star.temp *= 1.5; // Much hotter
                    star.mag *= 1.6; // Much brighter
                }
                
                // Add radial velocity component
                const shockVelocity = 50; // km/s
                const radialComponent = shockVelocity * Math.exp(-distanceFromShock / shockWidth);
                star.velTheta += radialComponent / radius; // Convert to angular velocity
            }
        }
    }

    private addDisturbedRegions(stars: Star[]): void {
        // Add some regions with disturbed kinematics
        const numDisturbances = Helper.randomInt(2, 5);
        
        for (let i = 0; i < numDisturbances; i++) {
            const disturbanceAngle = Helper.random(0, 2 * Math.PI);
            const disturbanceRadius = Helper.random(this.config.coreRadius, this.config.radius);
            const disturbanceSize = Helper.random(1000, 3000);
            
            for (const star of stars) {
                const starRadius = star.a;
                const starAngle = star.theta0;
                
                const dx = starRadius * Math.cos(starAngle) - disturbanceRadius * Math.cos(disturbanceAngle);
                const dy = starRadius * Math.sin(starAngle) - disturbanceRadius * Math.sin(disturbanceAngle);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < disturbanceSize) {
                    // Add velocity perturbation
                    const perturbation = Helper.gaussianRandom(0, 20) * Math.exp(-distance / disturbanceSize);
                    star.velTheta += perturbation / starRadius;
                    
                    // Slightly alter orbital parameters
                    star.a += Helper.gaussianRandom(0, 100);
                    star.b += Helper.gaussianRandom(0, 50);
                }
            }
        }
    }
}