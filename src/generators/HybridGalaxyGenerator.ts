import { Star, GalaxyConfig, GalaxyType } from '../core/Types';
import { Helper } from '../core/Helper';
import { GalaxyGenerator } from './GalaxyGenerator';
import { SpiralGalaxyGenerator } from './SpiralGalaxyGenerator';
import { RingGalaxyGenerator } from './RingGalaxyGenerator';
import { ClusterGalaxyGenerator } from './ClusterGalaxyGenerator';

export class HybridGalaxyGenerator extends GalaxyGenerator {
    private generators: GalaxyGenerator[] = [];
    private weights: number[] = [];

    constructor(config: GalaxyConfig) {
        super(config);
        this.initializeGenerators();
    }

    private initializeGenerators(): void {
        this.generators = [];
        this.weights = [];

        for (let i = 0; i < this.config.hybridComponents.length; i++) {
            const componentType = this.config.hybridComponents[i];
            const weight = this.config.hybridWeights[i] || 1.0;
            
            // Create a modified config for this component
            const componentConfig = { ...this.config };
            componentConfig.numStars = Math.floor(this.config.numStars * weight);
            
            let generator: GalaxyGenerator;
            
            switch (componentType) {
                case GalaxyType.SPIRAL:
                    generator = new SpiralGalaxyGenerator(componentConfig);
                    break;
                case GalaxyType.RING:
                    generator = new RingGalaxyGenerator(componentConfig);
                    break;
                case GalaxyType.CLUSTER:
                    generator = new ClusterGalaxyGenerator(componentConfig);
                    break;
                default:
                    continue;
            }
            
            this.generators.push(generator);
            this.weights.push(weight);
        }
    }

    public generate(): Star[] {
        const allStars: Star[] = [];
        
        // Generate stars from each component
        for (let i = 0; i < this.generators.length; i++) {
            const generator = this.generators[i];
            const componentStars = generator.generate();
            
            // Apply transformations for hybrid mixing
            this.transformComponentStars(componentStars, i);
            
            allStars.push(...componentStars);
        }
        
        // Add interaction effects between components
        this.addInteractionEffects(allStars);
        
        // Limit to requested number of stars
        if (allStars.length > this.config.numStars) {
            return allStars.slice(0, this.config.numStars);
        }
        
        return allStars;
    }

    private transformComponentStars(stars: Star[], componentIndex: number): void {
        const componentType = this.config.hybridComponents[componentIndex];
        
        switch (componentType) {
            case GalaxyType.SPIRAL:
                // Spiral component might be slightly offset or rotated
                this.applyRotation(stars, Helper.random(-Math.PI/6, Math.PI/6));
                break;
                
            case GalaxyType.RING:
                // Ring component might be tilted or have different orientation
                this.applyTilt(stars, Helper.random(-0.2, 0.2));
                break;
                
            case GalaxyType.CLUSTER:
                // Cluster component might be more dispersed in hybrid
                this.applyDispersion(stars, 1.2);
                break;
        }
    }

    private applyRotation(stars: Star[], rotationAngle: number): void {
        const cos = Math.cos(rotationAngle);
        const sin = Math.sin(rotationAngle);
        
        for (const star of stars) {
            const r = star.a;
            const oldTheta = star.theta0;
            
            const x = r * Math.cos(oldTheta);
            const y = r * Math.sin(oldTheta);
            
            const newX = x * cos - y * sin;
            const newY = x * sin + y * cos;
            
            star.a = Math.sqrt(newX * newX + newY * newY);
            star.theta0 = Math.atan2(newY, newX);
        }
    }

    private applyTilt(stars: Star[], tiltAngle: number): void {
        for (const star of stars) {
            star.tiltAngle += tiltAngle;
            
            // Modify the ellipse parameters due to tilt
            const tiltEffect = Math.cos(tiltAngle);
            star.b *= Math.abs(tiltEffect);
        }
    }

    private applyDispersion(stars: Star[], dispersionFactor: number): void {
        for (const star of stars) {
            // Add random velocity dispersion
            const velocityDispersion = Helper.gaussianRandom(0, 30 * dispersionFactor);
            star.velTheta += velocityDispersion / star.a;
            
            // Slightly randomize orbital parameters
            star.a += Helper.gaussianRandom(0, 200 * dispersionFactor);
            star.b += Helper.gaussianRandom(0, 100 * dispersionFactor);
        }
    }

    private addInteractionEffects(stars: Star[]): void {
        // Add tidal effects and gravitational interactions between components
        this.addTidalStreams(stars);
        this.addShockFronts(stars);
        this.addTriggeredStarFormation(stars);
    }

    private addTidalStreams(stars: Star[]): void {
        // Create tidal streams between different components
        const numStreams = Helper.randomInt(1, 3);
        
        for (let i = 0; i < numStreams; i++) {
            const streamLength = Helper.random(2000, 5000);
            const streamWidth = Helper.random(100, 300);
            const streamAngle = Helper.random(0, 2 * Math.PI);
            
            // Find stars that could be part of this stream
            const streamStars = stars.filter(star => {
                const r = star.a;
                const theta = star.theta0;
                
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);
                
                // Check if star is along the stream direction
                const streamX = Math.cos(streamAngle);
                const streamY = Math.sin(streamAngle);
                
                const dotProduct = (x * streamX + y * streamY) / r;
                const crossProduct = Math.abs(x * streamY - y * streamX) / r;
                
                return dotProduct > 0.5 && crossProduct < streamWidth;
            });
            
            // Modify stream stars
            for (const star of streamStars.slice(0, Math.floor(stars.length * 0.05))) {
                star.velTheta *= 1.2; // Higher velocity in stream
                star.type = Math.random() < 0.3 ? 1 : star.type; // Some become dust
            }
        }
    }

    private addShockFronts(stars: Star[]): void {
        // Create shock fronts where different components interact
        const numShocks = Helper.randomInt(1, 2);
        
        for (let i = 0; i < numShocks; i++) {
            const shockRadius = Helper.random(3000, 8000);
            const shockWidth = Helper.random(200, 500);
            
            for (const star of stars) {
                const r = star.a;
                const distanceFromShock = Math.abs(r - shockRadius);
                
                if (distanceFromShock < shockWidth) {
                    // Enhanced star formation in shock region
                    if (Math.random() < 0.4) {
                        star.type = 2; // H2 region
                        star.temp *= 1.4;
                        star.mag *= 1.3;
                    }
                    
                    // Velocity perturbation
                    const perturbation = Helper.gaussianRandom(0, 40);
                    star.velTheta += perturbation / r;
                }
            }
        }
    }

    private addTriggeredStarFormation(stars: Star[]): void {
        // Add regions of triggered star formation due to component interactions
        const numRegions = Helper.randomInt(2, 5);
        
        for (let i = 0; i < numRegions; i++) {
            const regionRadius = Helper.random(2000, 6000);
            const regionAngle = Helper.random(0, 2 * Math.PI);
            const regionSize = Helper.random(500, 1000);
            
            const regionX = regionRadius * Math.cos(regionAngle);
            const regionY = regionRadius * Math.sin(regionAngle);
            
            for (const star of stars) {
                const r = star.a;
                const theta = star.theta0;
                
                const starX = r * Math.cos(theta);
                const starY = r * Math.sin(theta);
                
                const distance = Math.sqrt(
                    Math.pow(starX - regionX, 2) + Math.pow(starY - regionY, 2)
                );
                
                if (distance < regionSize) {
                    // Higher probability of young, hot stars
                    if (Math.random() < 0.5) {
                        star.temp = this.config.baseTemp * (1.3 + 0.7 * Math.random());
                        star.mag *= 1.2 + 0.8 * Math.random();
                        star.type = Math.random() < 0.4 ? 2 : star.type;
                    }
                }
            }
        }
    }

    /**
     * Get information about the hybrid components
     */
    public getComponentInfo(): Array<{type: GalaxyType, weight: number}> {
        const info = [];
        
        for (let i = 0; i < this.config.hybridComponents.length; i++) {
            info.push({
                type: this.config.hybridComponents[i],
                weight: this.config.hybridWeights[i] || 1.0
            });
        }
        
        return info;
    }
}