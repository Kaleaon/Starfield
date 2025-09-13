export class CumulativeDistributionFunction {
    private _x: number[] = [];
    private _y: number[] = [];

    constructor(x: number[] = [], y: number[] = []) {
        if (x.length !== y.length) {
            throw new Error("Arrays x and y must have the same length");
        }
        
        this._x = [...x];
        this._y = [...y];
        
        if (this._x.length > 1) {
            this.normalize();
        }
    }

    /**
     * Normalize the CDF so the maximum value is 1.0
     */
    private normalize(): void {
        if (this._y.length === 0) return;
        
        const maxY = Math.max(...this._y);
        if (maxY > 0) {
            for (let i = 0; i < this._y.length; i++) {
                this._y[i] /= maxY;
            }
        }
    }

    /**
     * Add a point to the CDF
     */
    public addPoint(x: number, y: number): void {
        this._x.push(x);
        this._y.push(y);
    }

    /**
     * Get a random value from the distribution
     */
    public getRandomValue(): number {
        if (this._x.length === 0) {
            return 0;
        }
        
        if (this._x.length === 1) {
            return this._x[0];
        }

        const rand = Math.random();
        
        // Find the interval where rand falls
        for (let i = 1; i < this._y.length; i++) {
            if (rand <= this._y[i]) {
                // Linear interpolation between points
                const t = (rand - this._y[i - 1]) / (this._y[i] - this._y[i - 1]);
                return this._x[i - 1] + t * (this._x[i] - this._x[i - 1]);
            }
        }
        
        // If we get here, return the last value
        return this._x[this._x.length - 1];
    }

    /**
     * Create a CDF for galaxy density distribution
     * Based on the exponential decay typical in spiral galaxies
     */
    public static createGalaxyDensityCDF(maxRadius: number, coreRadius: number, numPoints: number = 100): CumulativeDistributionFunction {
        const x: number[] = [];
        const y: number[] = [];
        
        let cumulativeY = 0;
        
        for (let i = 0; i < numPoints; i++) {
            const radius = (maxRadius * i) / (numPoints - 1);
            x.push(radius);
            
            // Exponential decay with core
            let density: number;
            if (radius < coreRadius) {
                // Constant density in core
                density = 1.0;
            } else {
                // Exponential decay outside core
                const scaleFactor = (radius - coreRadius) / (maxRadius - coreRadius);
                density = Math.exp(-scaleFactor * 3); // Decay factor of 3
            }
            
            cumulativeY += density;
            y.push(cumulativeY);
        }
        
        return new CumulativeDistributionFunction(x, y);
    }

    /**
     * Create a CDF for stellar mass distribution (Initial Mass Function)
     * Based on the Salpeter IMF
     */
    public static createStellarMassCDF(minMass: number = 0.1, maxMass: number = 50, numPoints: number = 100): CumulativeDistributionFunction {
        const x: number[] = [];
        const y: number[] = [];
        
        let cumulativeY = 0;
        
        for (let i = 0; i < numPoints; i++) {
            const mass = minMass + (maxMass - minMass) * i / (numPoints - 1);
            x.push(mass);
            
            // Salpeter IMF: dN/dM ∝ M^(-2.35)
            const density = Math.pow(mass, -2.35);
            
            cumulativeY += density;
            y.push(cumulativeY);
        }
        
        return new CumulativeDistributionFunction(x, y);
    }

    /**
     * Create a CDF for ring galaxy density distribution
     */
    public static createRingDensityCDF(ringRadius: number, ringThickness: number, maxRadius: number, numPoints: number = 100): CumulativeDistributionFunction {
        const x: number[] = [];
        const y: number[] = [];
        
        let cumulativeY = 0;
        
        for (let i = 0; i < numPoints; i++) {
            const radius = (maxRadius * i) / (numPoints - 1);
            x.push(radius);
            
            // Ring density function - Gaussian around ring radius
            const distanceFromRing = Math.abs(radius - ringRadius);
            let density: number;
            
            if (distanceFromRing <= ringThickness) {
                // Gaussian density in ring
                const sigma = ringThickness / 3; // 3-sigma rule
                density = Math.exp(-0.5 * Math.pow(distanceFromRing / sigma, 2));
            } else {
                // Low density outside ring
                density = 0.1 * Math.exp(-(distanceFromRing - ringThickness) / (maxRadius / 4));
            }
            
            cumulativeY += density;
            y.push(cumulativeY);
        }
        
        return new CumulativeDistributionFunction(x, y);
    }

    /**
     * Get the length of the CDF
     */
    public length(): number {
        return this._x.length;
    }

    /**
     * Get the x values
     */
    public getXValues(): number[] {
        return [...this._x];
    }

    /**
     * Get the y values
     */
    public getYValues(): number[] {
        return [...this._y];
    }
}