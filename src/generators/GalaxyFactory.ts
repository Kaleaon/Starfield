import { GalaxyConfig, GalaxyType } from '../core/Types';
import { GalaxyGenerator } from './GalaxyGenerator';
import { SpiralGalaxyGenerator } from './SpiralGalaxyGenerator';
import { RingGalaxyGenerator } from './RingGalaxyGenerator';
import { ClusterGalaxyGenerator } from './ClusterGalaxyGenerator';
import { HybridGalaxyGenerator } from './HybridGalaxyGenerator';

export class GalaxyFactory {
    /**
     * Create a galaxy generator based on the configuration
     */
    public static createGenerator(config: GalaxyConfig): GalaxyGenerator {
        switch (config.type) {
            case GalaxyType.SPIRAL:
                return new SpiralGalaxyGenerator(config);
                
            case GalaxyType.RING:
                return new RingGalaxyGenerator(config);
                
            case GalaxyType.CLUSTER:
                return new ClusterGalaxyGenerator(config);
                
            case GalaxyType.HYBRID:
                if (!config.hybridComponents || config.hybridComponents.length === 0) {
                    throw new Error('Hybrid galaxy requires hybridComponents to be specified');
                }
                return new HybridGalaxyGenerator(config);
                
            case GalaxyType.ELLIPTICAL:
                // For now, use cluster generator as approximation for elliptical
                const ellipticalConfig = { ...config };
                ellipticalConfig.clusterCount = 1;
                ellipticalConfig.clusterSpread = config.radius * 0.8;
                return new ClusterGalaxyGenerator(ellipticalConfig);
                
            default:
                throw new Error(`Unsupported galaxy type: ${config.type}`);
        }
    }

    /**
     * Create a default configuration for a galaxy type
     */
    public static createDefaultConfig(type: GalaxyType): GalaxyConfig {
        const baseConfig = new GalaxyConfig();
        baseConfig.type = type;

        switch (type) {
            case GalaxyType.SPIRAL:
                baseConfig.spiralArms = 2;
                baseConfig.deltaAngle = 0.019;
                baseConfig.eccentricity1 = 0.8;
                baseConfig.eccentricity2 = 1.0;
                baseConfig.perturbationN = 0;
                baseConfig.perturbationAmp = 0;
                break;

            case GalaxyType.RING:
                baseConfig.ringRadius = 8000;
                baseConfig.ringThickness = 2000;
                baseConfig.coreRadius = 3000;
                break;

            case GalaxyType.CLUSTER:
                baseConfig.clusterCount = 5;
                baseConfig.clusterSpread = 5000;
                break;

            case GalaxyType.ELLIPTICAL:
                baseConfig.clusterCount = 1;
                baseConfig.clusterSpread = baseConfig.radius * 0.8;
                baseConfig.eccentricity1 = 0.3;
                break;

            case GalaxyType.HYBRID:
                baseConfig.hybridComponents = [GalaxyType.SPIRAL, GalaxyType.RING];
                baseConfig.hybridWeights = [0.7, 0.3];
                baseConfig.spiralArms = 2;
                baseConfig.ringRadius = 8000;
                baseConfig.ringThickness = 1500;
                break;
        }

        return baseConfig;
    }

    /**
     * Create a random galaxy configuration
     */
    public static createRandomConfig(): GalaxyConfig {
        const types = [GalaxyType.SPIRAL, GalaxyType.RING, GalaxyType.CLUSTER, GalaxyType.ELLIPTICAL];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const config = this.createDefaultConfig(randomType);
        
        // Add some randomization
        config.radius = 10000 + Math.random() * 20000;
        config.coreRadius = config.radius * (0.2 + Math.random() * 0.3);
        config.numStars = 30000 + Math.floor(Math.random() * 70000);
        config.numSystems = 500 + Math.floor(Math.random() * 1500);
        
        // Type-specific randomization
        switch (randomType) {
            case GalaxyType.SPIRAL:
                config.spiralArms = 2 + Math.floor(Math.random() * 4); // 2-5 arms
                config.deltaAngle = 0.01 + Math.random() * 0.02;
                config.eccentricity1 = 0.5 + Math.random() * 0.5;
                break;
                
            case GalaxyType.RING:
                config.ringRadius = config.radius * (0.4 + Math.random() * 0.3);
                config.ringThickness = config.ringRadius * (0.1 + Math.random() * 0.2);
                break;
                
            case GalaxyType.CLUSTER:
                config.clusterCount = 3 + Math.floor(Math.random() * 5);
                config.clusterSpread = config.radius * (0.2 + Math.random() * 0.3);
                break;
        }
        
        return config;
    }

    /**
     * Create a collision scenario between two galaxies
     */
    public static createCollisionScenario(primaryType: GalaxyType, secondaryType: GalaxyType): GalaxyConfig {
        const config = new GalaxyConfig();
        config.type = GalaxyType.HYBRID;
        config.hybridComponents = [primaryType, secondaryType];
        
        // Primary galaxy is larger
        config.hybridWeights = [0.7, 0.3];
        
        // Set parameters based on primary type
        Object.assign(config, this.createDefaultConfig(primaryType));
        config.type = GalaxyType.HYBRID; // Restore hybrid type
        
        // Add collision effects
        config.perturbationN = 2 + Math.floor(Math.random() * 3);
        config.perturbationAmp = 200 + Math.random() * 500;
        
        // If secondary is ring, it might be collision-induced
        if (secondaryType === GalaxyType.RING) {
            config.ringRadius = config.radius * 0.6;
            config.ringThickness = config.radius * 0.15;
        }
        
        return config;
    }

    /**
     * Create configuration for a merging galaxy system
     */
    public static createMergingSystem(types: GalaxyType[], weights?: number[]): GalaxyConfig {
        if (types.length < 2) {
            throw new Error('Merging system requires at least 2 galaxy types');
        }
        
        const config = new GalaxyConfig();
        config.type = GalaxyType.HYBRID;
        config.hybridComponents = types;
        config.hybridWeights = weights || types.map(() => 1.0 / types.length);
        
        // Use the first type as base configuration
        Object.assign(config, this.createDefaultConfig(types[0]));
        config.type = GalaxyType.HYBRID; // Restore hybrid type
        
        // Add merger effects
        config.perturbationN = 1 + Math.floor(Math.random() * 4);
        config.perturbationAmp = 100 + Math.random() * 400;
        
        // Increase star formation rate
        config.baseTemp *= 1.2;
        
        return config;
    }
}