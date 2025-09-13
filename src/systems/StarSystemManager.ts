import { StarSystem, Star, Vec3, HyperspaceLane } from '../core/Types';
import { Helper } from '../core/Helper';

export class StarSystemManager {
    private systems: Map<string, StarSystem> = new Map();
    private selectedSystems: Set<string> = new Set();
    private nextSystemId: number = 1;

    constructor() {}

    /**
     * Generate star systems from galaxy stars
     */
    public generateSystemsFromStars(stars: Star[], numSystems: number): void {
        this.systems.clear();
        
        // Select representative stars for systems
        const systemStars = this.selectSystemStars(stars, numSystems);
        
        for (const star of systemStars) {
            const system = this.createSystemFromStar(star);
            this.systems.set(system.id, system);
        }
    }

    private selectSystemStars(stars: Star[], numSystems: number): Star[] {
        // Filter out dust and H2 regions, focus on actual stars
        const validStars = stars.filter(star => star.type === 0);
        
        if (validStars.length <= numSystems) {
            return validStars;
        }
        
        // Use spatial distribution to ensure good coverage
        const selectedStars: Star[] = [];
        const minDistance = 500; // Minimum distance between systems
        
        // Sort by distance from center to ensure central systems are included
        validStars.sort((a, b) => a.a - b.a);
        
        for (const star of validStars) {
            if (selectedStars.length >= numSystems) break;
            
            // Check if this star is far enough from already selected systems
            if (this.isValidSystemLocation(star, selectedStars, minDistance)) {
                selectedStars.push(star);
            }
        }
        
        // If we don't have enough, relax the distance requirement
        if (selectedStars.length < numSystems) {
            const remaining = numSystems - selectedStars.length;
            const candidates = validStars.filter(star => 
                !selectedStars.includes(star)
            );
            
            candidates.sort(() => Math.random() - 0.5); // Shuffle
            selectedStars.push(...candidates.slice(0, remaining));
        }
        
        return selectedStars;
    }

    private isValidSystemLocation(star: Star, existingStars: Star[], minDistance: number): boolean {
        const starPos = this.getStarPosition(star);
        
        for (const existing of existingStars) {
            const existingPos = this.getStarPosition(existing);
            if (Helper.distance3D(starPos, existingPos) < minDistance) {
                return false;
            }
        }
        
        return true;
    }

    private getStarPosition(star: Star): Vec3 {
        const x = star.a * Math.cos(star.theta0);
        const y = star.a * Math.sin(star.theta0);
        const z = 0; // 2D galaxy for now
        
        return new Vec3(x, y, z);
    }

    private createSystemFromStar(star: Star): StarSystem {
        const system = new StarSystem();
        
        system.id = `SYS-${this.nextSystemId.toString().padStart(4, '0')}`;
        this.nextSystemId++;
        
        system.name = Helper.generateSystemName();
        system.position = this.getStarPosition(star);
        system.stars = [star];
        
        // Generate system properties based on star properties
        system.planetCount = this.generatePlanetCount(star);
        system.population = this.generatePopulation(star);
        system.faction = this.assignFaction(system.position);
        
        return system;
    }

    private generatePlanetCount(star: Star): number {
        // More massive/brighter stars tend to have more planets
        const basePlanets = Math.random() < 0.3 ? 0 : Helper.randomInt(1, 8);
        const massBonus = star.mag > 1.5 ? Helper.randomInt(0, 2) : 0;
        
        return Math.min(basePlanets + massBonus, 12);
    }

    private generatePopulation(star: Star): number {
        // Population based on habitability (simplified)
        if (Math.random() > 0.15) return 0; // 85% uninhabited
        
        const habitabilityScore = this.calculateHabitability(star);
        
        if (habitabilityScore < 0.3) return 0;
        if (habitabilityScore < 0.5) return Helper.randomInt(1000, 100000);
        if (habitabilityScore < 0.7) return Helper.randomInt(100000, 10000000);
        
        return Helper.randomInt(10000000, 1000000000);
    }

    private calculateHabitability(star: Star): number {
        // Simplified habitability based on temperature (proxy for star type)
        const optimalTemp = 5800; // Sun-like
        const tempDiff = Math.abs(star.temp - optimalTemp);
        const tempScore = Math.max(0, 1 - tempDiff / 3000);
        
        // Distance from galactic center matters (radiation, heavy elements)
        const centerDistance = star.a;
        const optimalDistance = 8000; // kpc
        const distanceDiff = Math.abs(centerDistance - optimalDistance);
        const distanceScore = Math.max(0, 1 - distanceDiff / 10000);
        
        return (tempScore + distanceScore) / 2;
    }

    private assignFaction(position: Vec3): string {
        const distance = position.length();
        const factions = [
            'Terran Federation', 'Galactic Empire', 'Free Traders Alliance',
            'Mining Consortium', 'Independent', 'Outer Rim Coalition',
            'Core Worlds Union', 'Merchant Guild'
        ];
        
        // Core systems more likely to be major factions
        if (distance < 3000) {
            return factions[Helper.randomInt(0, 3)];
        } else if (distance < 8000) {
            return factions[Helper.randomInt(2, 5)];
        } else {
            return factions[Helper.randomInt(4, 7)];
        }
    }

    /**
     * Get all systems
     */
    public getSystems(): StarSystem[] {
        return Array.from(this.systems.values());
    }

    /**
     * Get system by ID
     */
    public getSystem(id: string): StarSystem | undefined {
        return this.systems.get(id);
    }

    /**
     * Select a system
     */
    public selectSystem(id: string): boolean {
        if (this.systems.has(id)) {
            this.selectedSystems.add(id);
            return true;
        }
        return false;
    }

    /**
     * Deselect a system
     */
    public deselectSystem(id: string): void {
        this.selectedSystems.delete(id);
    }

    /**
     * Get selected systems
     */
    public getSelectedSystems(): StarSystem[] {
        const selected: StarSystem[] = [];
        
        for (const id of this.selectedSystems) {
            const system = this.systems.get(id);
            if (system) {
                selected.push(system);
            }
        }
        
        return selected;
    }

    /**
     * Label a system
     */
    public labelSystem(id: string, label: string): boolean {
        const system = this.systems.get(id);
        if (system) {
            system.name = label;
            system.isLabeled = true;
            return true;
        }
        return false;
    }

    /**
     * Add metadata to a system
     */
    public addSystemMetadata(id: string, key: string, value: any): boolean {
        const system = this.systems.get(id);
        if (system) {
            system.metadata.set(key, value);
            return true;
        }
        return false;
    }

    /**
     * Find systems within a radius of a position
     */
    public findSystemsInRadius(center: Vec3, radius: number): StarSystem[] {
        const results: StarSystem[] = [];
        
        for (const system of this.systems.values()) {
            const distance = Helper.distance3D(center, system.position);
            if (distance <= radius) {
                results.push(system);
            }
        }
        
        return results.sort((a, b) => 
            Helper.distance3D(center, a.position) - Helper.distance3D(center, b.position)
        );
    }

    /**
     * Find systems by faction
     */
    public findSystemsByFaction(faction: string): StarSystem[] {
        return this.getSystems().filter(system => system.faction === faction);
    }

    /**
     * Find systems by population range
     */
    public findSystemsByPopulation(minPop: number, maxPop: number): StarSystem[] {
        return this.getSystems().filter(system => 
            system.population >= minPop && system.population <= maxPop
        );
    }

    /**
     * Get statistics about the systems
     */
    public getSystemStats(): {
        totalSystems: number;
        inhabitedSystems: number;
        totalPopulation: number;
        factionCounts: Map<string, number>;
        averageDistance: number;
    } {
        const systems = this.getSystems();
        
        const stats = {
            totalSystems: systems.length,
            inhabitedSystems: systems.filter(s => s.population > 0).length,
            totalPopulation: systems.reduce((sum, s) => sum + s.population, 0),
            factionCounts: new Map<string, number>(),
            averageDistance: 0
        };
        
        // Count factions
        for (const system of systems) {
            const count = stats.factionCounts.get(system.faction) || 0;
            stats.factionCounts.set(system.faction, count + 1);
        }
        
        // Calculate average distance from center
        if (systems.length > 0) {
            const totalDistance = systems.reduce((sum, s) => sum + s.position.length(), 0);
            stats.averageDistance = totalDistance / systems.length;
        }
        
        return stats;
    }
}