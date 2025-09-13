import { HyperspaceLane, StarSystem, Vec3 } from '../core/Types';
import { Helper } from '../core/Helper';

export class HyperspaceLaneGenerator {
    private lanes: Map<string, HyperspaceLane> = new Map();
    private nextLaneId: number = 1;
    
    // Hyperspace travel constants (based on Star Wars reference)
    private static readonly BASE_SPEED = 1.0; // Class 1 hyperdrive
    private static readonly GRAVITY_WELL_RADIUS = 100; // Safe jump distance from gravity wells
    private static readonly MIN_LANE_DISTANCE = 200; // Minimum distance for a lane
    private static readonly MAX_LANE_DISTANCE = 15000; // Maximum practical distance

    constructor() {}

    /**
     * Generate hyperspace lanes between star systems
     */
    public generateLanes(systems: StarSystem[]): void {
        this.lanes.clear();
        
        // Create major trade routes (hub and spoke)
        this.createMajorTradeRoutes(systems);
        
        // Create regional networks
        this.createRegionalNetworks(systems);
        
        // Create backup routes
        this.createBackupRoutes(systems);
        
        // Update system hyperspace lane references
        this.updateSystemLaneReferences(systems);
    }

    private createMajorTradeRoutes(systems: StarSystem[]): void {
        // Find core systems (high population, central location)
        const coreSystems = this.findCoreSystems(systems);
        
        // Create hub-and-spoke network connecting core systems
        for (let i = 0; i < coreSystems.length; i++) {
            for (let j = i + 1; j < coreSystems.length; j++) {
                const distance = Helper.distance3D(
                    coreSystems[i].position, 
                    coreSystems[j].position
                );
                
                if (distance <= HyperspaceLaneGenerator.MAX_LANE_DISTANCE * 0.8) {
                    const lane = this.createLane(
                        coreSystems[i], 
                        coreSystems[j], 
                        'Core Trade Route',
                        'high'
                    );
                    
                    if (lane) {
                        lane.safetyRating = 0.9; // Very safe
                        this.lanes.set(lane.id, lane);
                    }
                }
            }
        }
    }

    private createRegionalNetworks(systems: StarSystem[]): void {
        // Group systems by region (spatial clustering)
        const regions = this.clusterSystemsByRegion(systems);
        
        for (const region of regions) {
            // Connect systems within each region
            this.createRegionalConnections(region);
            
            // Connect region to nearby core systems or other regions
            this.connectRegionToCore(region, systems);
        }
    }

    private createBackupRoutes(systems: StarSystem[]): void {
        // Find systems with only one connection and add backup routes
        const systemConnections = this.getSystemConnections(systems);
        
        for (const system of systems) {
            const connections = systemConnections.get(system.id) || [];
            
            if (connections.length === 1) {
                // Find alternate route
                const nearbySystem = this.findNearestAlternateSystem(system, systems, connections[0]);
                
                if (nearbySystem) {
                    const lane = this.createLane(
                        system, 
                        nearbySystem, 
                        'Backup Route',
                        'medium'
                    );
                    
                    if (lane) {
                        lane.safetyRating = 0.6; // Less safe backup route
                        this.lanes.set(lane.id, lane);
                    }
                }
            }
        }
    }

    private findCoreSystems(systems: StarSystem[]): StarSystem[] {
        // Core systems have high population and are relatively central
        return systems
            .filter(system => system.population > 1000000)
            .sort((a, b) => {
                const aScore = this.calculateCoreScore(a);
                const bScore = this.calculateCoreScore(b);
                return bScore - aScore;
            })
            .slice(0, Math.min(10, Math.floor(systems.length * 0.1)));
    }

    private calculateCoreScore(system: StarSystem): number {
        const populationScore = Math.log10(system.population + 1) / 10;
        const centralityScore = 1.0 / (1.0 + system.position.length() / 10000);
        return populationScore + centralityScore;
    }

    private clusterSystemsByRegion(systems: StarSystem[]): StarSystem[][] {
        const regions: StarSystem[][] = [];
        const assigned = new Set<string>();
        const regionRadius = 3000; // Systems within this radius are in same region
        
        for (const system of systems) {
            if (assigned.has(system.id)) continue;
            
            const region = [system];
            assigned.add(system.id);
            
            // Find other systems in this region
            for (const other of systems) {
                if (assigned.has(other.id)) continue;
                
                const distance = Helper.distance3D(system.position, other.position);
                if (distance <= regionRadius) {
                    region.push(other);
                    assigned.add(other.id);
                }
            }
            
            if (region.length >= 2) {
                regions.push(region);
            }
        }
        
        return regions;
    }

    private createRegionalConnections(region: StarSystem[]): void {
        // Create minimum spanning tree for regional connectivity
        const connections = this.createMinimumSpanningTree(region);
        
        for (const connection of connections) {
            const lane = this.createLane(
                connection.from,
                connection.to,
                'Regional Route',
                'medium'
            );
            
            if (lane) {
                lane.safetyRating = 0.7;
                this.lanes.set(lane.id, lane);
            }
        }
    }

    private connectRegionToCore(region: StarSystem[], allSystems: StarSystem[]): void {
        // Find the best system in the region to connect to core
        const regionHub = region.reduce((best, system) => 
            system.population > best.population ? system : best
        );
        
        // Find nearest core system or major hub
        let nearestCore: StarSystem | null = null;
        let minDistance = Infinity;
        
        for (const system of allSystems) {
            if (region.includes(system)) continue;
            if (system.population < 100000) continue; // Only connect to significant systems
            
            const distance = Helper.distance3D(regionHub.position, system.position);
            if (distance < minDistance && distance <= HyperspaceLaneGenerator.MAX_LANE_DISTANCE) {
                minDistance = distance;
                nearestCore = system;
            }
        }
        
        if (nearestCore) {
            const lane = this.createLane(
                regionHub,
                nearestCore,
                'Inter-Regional Route',
                'medium'
            );
            
            if (lane) {
                lane.safetyRating = 0.6;
                this.lanes.set(lane.id, lane);
            }
        }
    }

    private createMinimumSpanningTree(systems: StarSystem[]): Array<{from: StarSystem, to: StarSystem}> {
        if (systems.length < 2) return [];
        
        const connections: Array<{from: StarSystem, to: StarSystem}> = [];
        const connected = new Set<string>();
        
        // Start with first system
        connected.add(systems[0].id);
        
        while (connected.size < systems.length) {
            let bestConnection: {from: StarSystem, to: StarSystem} | null = null;
            let minDistance = Infinity;
            
            // Find shortest edge from connected to unconnected
            for (const connectedId of connected) {
                const connectedSystem = systems.find(s => s.id === connectedId)!;
                
                for (const system of systems) {
                    if (connected.has(system.id)) continue;
                    
                    const distance = Helper.distance3D(connectedSystem.position, system.position);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestConnection = { from: connectedSystem, to: system };
                    }
                }
            }
            
            if (bestConnection) {
                connections.push(bestConnection);
                connected.add(bestConnection.to.id);
            } else {
                break; // No more connections possible
            }
        }
        
        return connections;
    }

    private createLane(
        from: StarSystem, 
        to: StarSystem, 
        routeType: string, 
        trafficLevel: string
    ): HyperspaceLane | null {
        const distance = Helper.distance3D(from.position, to.position);
        
        if (distance < HyperspaceLaneGenerator.MIN_LANE_DISTANCE || 
            distance > HyperspaceLaneGenerator.MAX_LANE_DISTANCE) {
            return null;
        }
        
        const lane = new HyperspaceLane();
        
        lane.id = `HL-${this.nextLaneId.toString().padStart(4, '0')}`;
        this.nextLaneId++;
        
        lane.name = `${routeType}: ${from.name} - ${to.name}`;
        lane.startSystem = from.id;
        lane.endSystem = to.id;
        lane.distance = distance;
        lane.trafficLevel = trafficLevel;
        
        // Calculate travel time based on hyperspace physics
        lane.travelTime = this.calculateTravelTime(distance, from, to);
        
        // Assign controlling faction (usually the more powerful system)
        lane.controllingFaction = from.population >= to.population ? from.faction : to.faction;
        
        return lane;
    }

    private calculateTravelTime(distance: number, from: StarSystem, to: StarSystem): number {
        // Base travel time calculation (hours)
        // Factors: distance, gravity wells, stellar hazards
        
        const baseTime = distance / (HyperspaceLaneGenerator.BASE_SPEED * 1000); // Base speed in units/hour
        
        // Gravity well penalties
        const fromGravityPenalty = this.calculateGravityPenalty(from);
        const toGravityPenalty = this.calculateGravityPenalty(to);
        
        // Route complexity (straight line vs. navigation around hazards)
        const complexityFactor = 1.0 + Math.random() * 0.3; // 0-30% complexity increase
        
        return baseTime * (1 + fromGravityPenalty + toGravityPenalty) * complexityFactor;
    }

    private calculateGravityPenalty(system: StarSystem): number {
        // Systems with more stars/planets have stronger gravity wells
        const starCount = system.stars.length;
        const planetCount = system.planetCount;
        
        return (starCount * 0.1) + (planetCount * 0.02);
    }

    private getSystemConnections(systems: StarSystem[]): Map<string, string[]> {
        const connections = new Map<string, string[]>();
        
        // Initialize
        for (const system of systems) {
            connections.set(system.id, []);
        }
        
        // Add connections from existing lanes
        for (const lane of this.lanes.values()) {
            const startConnections = connections.get(lane.startSystem) || [];
            const endConnections = connections.get(lane.endSystem) || [];
            
            startConnections.push(lane.endSystem);
            endConnections.push(lane.startSystem);
            
            connections.set(lane.startSystem, startConnections);
            connections.set(lane.endSystem, endConnections);
        }
        
        return connections;
    }

    private findNearestAlternateSystem(
        system: StarSystem, 
        allSystems: StarSystem[], 
        excludeSystem: string
    ): StarSystem | null {
        let nearest: StarSystem | null = null;
        let minDistance = Infinity;
        
        for (const other of allSystems) {
            if (other.id === system.id || other.id === excludeSystem) continue;
            
            const distance = Helper.distance3D(system.position, other.position);
            if (distance < minDistance && distance <= HyperspaceLaneGenerator.MAX_LANE_DISTANCE * 0.6) {
                minDistance = distance;
                nearest = other;
            }
        }
        
        return nearest;
    }

    private updateSystemLaneReferences(systems: StarSystem[]): void {
        // Update each system's hyperspace lane list
        for (const system of systems) {
            system.hyperspaceLanes = [];
        }
        
        for (const lane of this.lanes.values()) {
            const startSystem = systems.find(s => s.id === lane.startSystem);
            const endSystem = systems.find(s => s.id === lane.endSystem);
            
            if (startSystem) {
                startSystem.hyperspaceLanes.push(lane.id);
            }
            if (endSystem) {
                endSystem.hyperspaceLanes.push(lane.id);
            }
        }
    }

    /**
     * Get all hyperspace lanes
     */
    public getLanes(): HyperspaceLane[] {
        return Array.from(this.lanes.values());
    }

    /**
     * Get lane by ID
     */
    public getLane(id: string): HyperspaceLane | undefined {
        return this.lanes.get(id);
    }

    /**
     * Find shortest path between two systems
     */
    public findShortestPath(fromSystemId: string, toSystemId: string): HyperspaceLane[] | null {
        // Implement Dijkstra's algorithm
        const distances = new Map<string, number>();
        const previous = new Map<string, string>();
        const unvisited = new Set<string>();
        
        // Initialize
        const systemIds = new Set([fromSystemId, toSystemId]);
        for (const lane of this.lanes.values()) {
            systemIds.add(lane.startSystem);
            systemIds.add(lane.endSystem);
        }
        
        for (const systemId of systemIds) {
            distances.set(systemId, Infinity);
            unvisited.add(systemId);
        }
        distances.set(fromSystemId, 0);
        
        while (unvisited.size > 0) {
            // Find unvisited system with smallest distance
            let current: string | null = null;
            let minDistance = Infinity;
            
            for (const systemId of unvisited) {
                const distance = distances.get(systemId) || Infinity;
                if (distance < minDistance) {
                    minDistance = distance;
                    current = systemId;
                }
            }
            
            if (!current || current === toSystemId) break;
            
            unvisited.delete(current);
            
            // Check all connected systems
            for (const lane of this.lanes.values()) {
                let neighbor: string | null = null;
                
                if (lane.startSystem === current) {
                    neighbor = lane.endSystem;
                } else if (lane.endSystem === current) {
                    neighbor = lane.startSystem;
                }
                
                if (neighbor && unvisited.has(neighbor)) {
                    const alt = (distances.get(current) || 0) + lane.travelTime;
                    if (alt < (distances.get(neighbor) || Infinity)) {
                        distances.set(neighbor, alt);
                        previous.set(neighbor, lane.id);
                    }
                }
            }
        }
        
        // Reconstruct path
        if (!previous.has(toSystemId)) return null;
        
        const path: HyperspaceLane[] = [];
        let current = toSystemId;
        
        while (previous.has(current)) {
            const laneId = previous.get(current)!;
            const lane = this.lanes.get(laneId);
            if (lane) {
                path.unshift(lane);
            }
            
            // Find the other system in this lane
            if (lane!.endSystem === current) {
                current = lane!.startSystem;
            } else {
                current = lane!.endSystem;
            }
        }
        
        return path;
    }

    /**
     * Get lane statistics
     */
    public getLaneStats(): {
        totalLanes: number;
        totalDistance: number;
        averageDistance: number;
        trafficLevelCounts: Map<string, number>;
        safetyStats: { min: number, max: number, average: number };
    } {
        const lanes = this.getLanes();
        
        const stats = {
            totalLanes: lanes.length,
            totalDistance: lanes.reduce((sum, lane) => sum + lane.distance, 0),
            averageDistance: 0,
            trafficLevelCounts: new Map<string, number>(),
            safetyStats: { min: 1.0, max: 0.0, average: 0.0 }
        };
        
        if (lanes.length > 0) {
            stats.averageDistance = stats.totalDistance / lanes.length;
            
            // Traffic level counts
            for (const lane of lanes) {
                const count = stats.trafficLevelCounts.get(lane.trafficLevel) || 0;
                stats.trafficLevelCounts.set(lane.trafficLevel, count + 1);
            }
            
            // Safety statistics
            const safetyRatings = lanes.map(lane => lane.safetyRating);
            stats.safetyStats.min = Math.min(...safetyRatings);
            stats.safetyStats.max = Math.max(...safetyRatings);
            stats.safetyStats.average = safetyRatings.reduce((sum, rating) => sum + rating, 0) / safetyRatings.length;
        }
        
        return stats;
    }
}