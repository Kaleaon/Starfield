import { Star, GalaxyConfig } from '../core/Types';
import { Helper } from '../core/Helper';
import { CumulativeDistributionFunction } from '../core/CumulativeDistributionFunction';
import { GalaxyGenerator } from './GalaxyGenerator';

export class SpiralGalaxyGenerator extends GalaxyGenerator {
    private densityCDF: CumulativeDistributionFunction;

    constructor(config: GalaxyConfig) {
        super(config);
        this.densityCDF = CumulativeDistributionFunction.createGalaxyDensityCDF(
            config.radius, 
            config.coreRadius
        );
    }

    public generate(): Star[] {
        const stars: Star[] = [];
        
        // Generate stars for each spiral arm
        const starsPerArm = Math.floor(this.config.numStars / this.config.spiralArms);
        
        for (let arm = 0; arm < this.config.spiralArms; arm++) {
            const armStars = this.generateSpiralArm(arm, starsPerArm);
            stars.push(...armStars);
        }
        
        // Add some random stars between arms
        const interArmStars = this.generateInterArmStars(this.config.numStars - stars.length);
        stars.push(...interArmStars);
        
        // Add central bulge
        const bulgeStars = this.generateCentralBulge();
        stars.push(...bulgeStars);
        
        return stars;
    }

    private generateSpiralArm(armIndex: number, numStars: number): Star[] {
        const stars: Star[] = [];
        const armAngle = (2 * Math.PI * armIndex) / this.config.spiralArms;
        
        for (let i = 0; i < numStars; i++) {
            // Get radius from density distribution
            const radius = this.densityCDF.getRandomValue();
            
            // Calculate spiral arm angle
            const spiralTightness = 0.2; // How tightly wound the spiral is
            const baseAngle = radius * spiralTightness;
            const totalAngle = armAngle + baseAngle + this.config.deltaAngle;
            
            // Add some scatter perpendicular to the arm
            const armWidth = this.config.radius * 0.05; // 5% of galaxy radius
            const perpendicularOffset = Helper.gaussianRandom(0, armWidth);
            const perpendicularAngle = totalAngle + Math.PI / 2;
            
            const x = radius * Math.cos(totalAngle) + perpendicularOffset * Math.cos(perpendicularAngle);
            const y = radius * Math.sin(totalAngle) + perpendicularOffset * Math.sin(perpendicularAngle);
            
            // Recalculate radius and angle for the perturbed position
            const finalRadius = Math.sqrt(x * x + y * y);
            const finalAngle = Math.atan2(y, x);
            
            const star = this.generateBaseStar(finalRadius, finalAngle);
            
            // Enhance star formation in spiral arms
            if (Math.random() < 0.3) {
                star.type = 2; // H2 region (star forming region)
                star.temp *= 1.5; // Hotter due to active star formation
                star.mag *= 1.2; // Brighter
            }
            
            stars.push(star);
        }
        
        return stars;
    }

    private generateInterArmStars(numStars: number): Star[] {
        const stars: Star[] = [];
        
        for (let i = 0; i < numStars; i++) {
            const radius = this.densityCDF.getRandomValue();
            const angle = Helper.random(0, 2 * Math.PI);
            
            const star = this.generateBaseStar(radius, angle);
            
            // Inter-arm stars are typically older and less massive
            star.temp *= 0.8;
            star.mag *= 0.9;
            
            stars.push(star);
        }
        
        return stars;
    }

    private generateCentralBulge(): Star[] {
        const stars: Star[] = [];
        const bulgeStars = Math.floor(this.config.numStars * 0.1); // 10% in central bulge
        
        for (let i = 0; i < bulgeStars; i++) {
            // Exponential distribution concentrated in center
            const radius = Helper.random(0, this.config.coreRadius) * Math.pow(Math.random(), 2);
            const angle = Helper.random(0, 2 * Math.PI);
            
            const star = this.generateBaseStar(radius, angle);
            
            // Bulge stars are typically older, redder, and more massive
            star.temp = this.config.baseTemp * 0.7; // Cooler (redder)
            star.mag *= 1.3; // Brighter due to higher mass
            
            stars.push(star);
        }
        
        return stars;
    }

    private addPerturbations(stars: Star[]): void {
        if (this.config.perturbationN === 0 || this.config.perturbationAmp === 0) {
            return;
        }
        
        for (const star of stars) {
            const radius = star.a;
            const angle = star.theta0;
            
            // Add perturbation based on configuration
            const perturbation = this.config.perturbationAmp * 
                Math.sin(this.config.perturbationN * angle) * 
                (radius / this.config.radius);
            
            star.a += perturbation;
            star.b += perturbation * 0.5; // Less perturbation in minor axis
        }
    }
}