// Wait for the GalaxyRenderer to be initialized
window.addEventListener('load', () => {
    const galaxyRenderer = GalaxyRenderer.galaxy;
    const uiController = GalaxyRenderer.uiController;

    const numArmsSlider = document.getElementById('num-arms');
    const armSplittingSlider = document.getElementById('arm-splitting');
    const starDensitySlider = document.getElementById('star-density');
    const startArmsSlider = document.getElementById('start-arms');
    const endArmsSlider = document.getElementById('end-arms');

    // --- Number of Arms ---
    numArmsSlider.addEventListener('input', (event) => {
        const value = parseInt(event.target.value, 10);
        galaxyRenderer.galaxy.pertN = value;
        galaxyRenderer.renderUpdateHint |= 2; // DENSITY_WAVES
    });

    // --- Arm Splitting ---
    const galaxy = galaxyRenderer.galaxy;
    galaxy._armSplitting = 0;
    const originalGetAngularOffset = galaxy.getAngularOffset;
    galaxy.getAngularOffset = function(rad) {
        // The arm splitting is achieved by adding a sine wave to the angular offset.
        // The frequency and amplitude of the sine wave can be adjusted to create different splitting patterns.
        return originalGetAngularOffset.call(this, rad) + this._armSplitting * 100 * Math.sin(rad / 2000);
    };

    Object.defineProperty(galaxy, 'armSplitting', {
        set: function(value) {
            this._armSplitting = value;
        }
    });

    armSplittingSlider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        galaxy.armSplitting = value;
        galaxyRenderer.renderUpdateHint |= 2; // DENSITY_WAVES
    });

    // --- Star Density ---
    starDensitySlider.addEventListener('input', (event) => {
        const value = parseInt(event.target.value, 10);
        galaxyRenderer.galaxy.numStars = value;
        galaxyRenderer.renderUpdateHint |= 8; // STARS
    });

    // --- Start and End Arms ---
    galaxy._startArms = 0;
    galaxy._endArms = 1;

    const originalGetExcentricity = galaxy.getExcentricity;
    galaxy.getExcentricity = function(rad) {
        const armStart = this._radCore + this._startArms * (this._radGalaxy - this._radCore);
        const armEnd = this._radCore + this._endArms * (this._radGalaxy - this._radCore);

        // If the radius is outside the arm region, the orbit is circular.
        if (rad < armStart || rad > armEnd) {
            return 1;
        }

        // Otherwise, use the original eccentricity calculation.
        return originalGetExcentricity.call(this, rad);
    }

    Object.defineProperty(galaxy, 'startArms', {
        set: function(value) {
            this._startArms = value;
        }
    });

    Object.defineProperty(galaxy, 'endArms', {
        set: function(value) {
            this._endArms = value;
        }
    });

    startArmsSlider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        galaxy.startArms = value;
        galaxyRenderer.renderUpdateHint |= 2; // DENSITY_WAVES
    });

    endArmsSlider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        galaxy.endArms = value;
        galaxyRenderer.renderUpdateHint |= 2; // DENSITY_WAVES
    });
});
