import { Star, GalaxyConfig, Vec2 } from '../core/Types';
import { Helper } from '../core/Helper';
import { CumulativeDistributionFunction } from '../core/CumulativeDistributionFunction';
import { GalaxyGenerator } from './GalaxyGenerator';

export class ClusterGalaxyGenerator extends GalaxyGenerator {
    private clusterCenters: Vec2[] = [];

    constructor(config: GalaxyConfig) {
        super(config);
        this.generateClusterCenters();
    }

    public generate(): Star[] {
        const stars: Star[] = [];
        
        // Generate stars for each cluster
        const starsPerCluster = Math.floor(this.config.numStars / this.config.clusterCount);
        
        for (let i = 0; i < this.config.clusterCount; i++) {
            const clusterStars = this.generateCluster(i, starsPerCluster);
            stars.push(...clusterStars);
        }
        
        // Add some field stars between clusters
        const fieldStars = this.generateFieldStars(this.config.numStars - stars.length);
        stars.push(...fieldStars);
        
        return stars;
    }

    private generateClusterCenters(): void {
        this.clusterCenters = [];
        
        for (let i = 0; i < this.config.clusterCount; i++) {
            let center: Vec2;
            let attempts = 0;
            const maxAttempts = 100;
            
            do {
                // Generate random position within galaxy
                const radius = Helper.random(0, this.config.radius * 0.8);
                const angle = Helper.random(0, 2 * Math.PI);
                center = new Vec2(radius * Math.cos(angle), radius * Math.sin(angle));
                attempts++;
            } while (this.isTooCloseToExisting(center) && attempts < maxAttempts);
            
            this.clusterCenters.push(center);
        }
    }

    private isTooCloseToExisting(newCenter: Vec2): boolean {
        const minDistance = this.config.clusterSpread * 0.5;
        
        for (const existingCenter of this.clusterCenters) {
            if (Helper.distance2D(newCenter, existingCenter) < minDistance) {
                return true;
            }
        }
        
        return false;
    }

    private generateCluster(clusterIndex: number, numStars: number): Star[] {
        const stars: Star[] = [];
        const center = this.clusterCenters[clusterIndex];
        
        // Determine cluster properties
        const clusterType = this.determineClusterType(clusterIndex);
        const clusterSize = Helper.random(this.config.clusterSpread * 0.3, this.config.clusterSpread);
        const clusterAge = Helper.random(1, 13); // Billion years
        
        for (let i = 0; i < numStars; i++) {
            const star = this.generateClusterStar(center, clusterSize, clusterType, clusterAge);
            stars.push(star);
        }
        
        return stars;
    }

    private determineClusterType(clusterIndex: number): 'globular' | 'open' | 'association' {
        const rand = Math.random();
        
        if (rand < 0.3) {
            return 'globular';
        } else if (rand < 0.7) {
            return 'open';
        } else {
            return 'association';
        }
    }

    private generateClusterStar(center: Vec2, clusterSize: number, clusterType: string, clusterAge: number): Star {
        let position: Vec2;
        
        switch (clusterType) {
            case 'globular':
                // King profile - concentrated center
                position = this.generateKingProfile(center, clusterSize);
                break;
            case 'open':
                // More relaxed distribution
                position = this.generateOpenClusterPosition(center, clusterSize);
                break;
            case 'association':
                // Very loose, extended distribution
                position = this.generateAssociationPosition(center, clusterSize * 2);
                break;
            default:
                position = center;
        }
        
        const radius = position.length();
        const angle = Math.atan2(position.y, position.x);
        
        const star = this.generateBaseStar(radius, angle);
        
        // Adjust star properties based on cluster type and age
        this.adjustStarForCluster(star, clusterType, clusterAge);
        
        return star;
    }

    private generateKingProfile(center: Vec2, size: number): Vec2 {
        // King profile for globular clusters - highly concentrated
        const coreRadius = size * 0.1;
        const tidalRadius = size;
        
        // Use rejection sampling for King profile
        let r: number, probability: number;
        
        do {
            r = Helper.random(0, tidalRadius);
            const x = r / coreRadius;
            // Simplified King profile
            probability = 1.0 / Math.pow(1 + x * x, 2);
        } while (Math.random() > probability && r < tidalRadius);
        
        const angle = Helper.random(0, 2 * Math.PI);
        
        return new Vec2(
            center.x + r * Math.cos(angle),
            center.y + r * Math.sin(angle)
        );
    }

    private generateOpenClusterPosition(center: Vec2, size: number): Vec2 {
        // Gaussian distribution for open clusters
        const sigma = size / 3; // 3-sigma rule
        
        const r = Math.abs(Helper.gaussianRandom(0, sigma));
        const angle = Helper.random(0, 2 * Math.PI);
        
        return new Vec2(
            center.x + r * Math.cos(angle),
            center.y + r * Math.sin(angle)
        );
    }

    private generateAssociationPosition(center: Vec2, size: number): Vec2 {
        // Very loose distribution for stellar associations
        const r = Helper.random(0, size) * Math.pow(Math.random(), 0.3); // Flatter than linear
        const angle = Helper.random(0, 2 * Math.PI);
        
        return new Vec2(
            center.x + r * Math.cos(angle),
            center.y + r * Math.sin(angle)
        );
    }

    private adjustStarForCluster(star: Star, clusterType: string, clusterAge: number): void {
        switch (clusterType) {
            case 'globular':
                // Old, metal-poor, low mass stars
                star.temp = this.config.baseTemp * (0.4 + 0.3 * Math.random()); // Cooler
                star.mag *= 0.5 + 0.5 * Math.random(); // Generally dimmer
                break;
                
            case 'open':
                // Mixed ages, solar metallicity
                const ageFactor = Math.max(0.1, clusterAge / 10);
                star.temp = this.config.baseTemp * (0.6 + 0.6 * (1 - ageFactor));
                star.mag *= 0.8 + 0.4 * Math.random();
                break;
                
            case 'association':
                // Young, hot, massive stars
                star.temp = this.config.baseTemp * (1.2 + 0.8 * Math.random()); // Hotter
                star.mag *= 1.5 + Math.random(); // Brighter
                if (Math.random() < 0.3) {
                    star.type = 2; // H2 regions common in associations
                }
                break;
        }
        
        // Adjust orbital velocity for cluster membership
        const clusterVelocity = Helper.random(-50, 50); // km/s dispersion
        star.velTheta += clusterVelocity / star.a;
    }

    private generateFieldStars(numStars: number): Star[] {
        const stars: Star[] = [];
        
        for (let i = 0; i < numStars; i++) {
            // Random position avoiding cluster cores
            let position: Vec2;
            let attempts = 0;
            
            do {
                const radius = Helper.random(0, this.config.radius);
                const angle = Helper.random(0, 2 * Math.PI);
                position = new Vec2(radius * Math.cos(angle), radius * Math.sin(angle));
                attempts++;
            } while (this.isInClusterCore(position) && attempts < 50);
            
            const radius = position.length();
            const angle = Math.atan2(position.y, position.x);
            
            const star = this.generateBaseStar(radius, angle);
            
            // Field stars are typically older
            star.temp *= 0.7;
            star.mag *= 0.9;
            
            stars.push(star);
        }
        
        return stars;
    }

    private isInClusterCore(position: Vec2): boolean {
        const coreDistance = this.config.clusterSpread * 0.2;
        
        for (const center of this.clusterCenters) {
            if (Helper.distance2D(position, center) < coreDistance) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get cluster information for visualization
     */
    public getClusterInfo(): Array<{center: Vec2, size: number, type: string}> {
        const info = [];
        
        for (let i = 0; i < this.clusterCenters.length; i++) {
            const center = this.clusterCenters[i];
            const type = this.determineClusterType(i);
            const size = Helper.random(this.config.clusterSpread * 0.3, this.config.clusterSpread);
            
            info.push({ center, size, type });
        }
        
        return info;
    }
}