import { UIController } from './ui/UIController';

class StarfieldApp {
    private uiController: UIController | null = null;

    public initialize(): void {
        // Wait for DOM to be loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupApplication();
            });
        } else {
            this.setupApplication();
        }
    }

    private setupApplication(): void {
        try {
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.id = 'galaxyCanvas';
            canvas.style.display = 'block';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            document.body.appendChild(canvas);

            // Initialize UI controller
            this.uiController = new UIController(canvas);
            
            // Start render loop
            this.uiController.startRenderLoop();
            
            console.log('Starfield Galaxy Generator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Starfield Galaxy Generator:', error);
            this.showError('Failed to initialize the galaxy generator. Please check your browser compatibility.');
        }
    }

    private showError(message: string): void {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
        `;
        
        errorDiv.innerHTML = `
            <h3>Error</h3>
            <p>${message}</p>
            <p>Please ensure you're using a modern browser with WebGL2 support.</p>
        `;
        
        document.body.appendChild(errorDiv);
    }

    public dispose(): void {
        if (this.uiController) {
            this.uiController.dispose();
            this.uiController = null;
        }
    }
}

// Initialize the application
const app = new StarfieldApp();
app.initialize();

// Handle page unload
window.addEventListener('beforeunload', () => {
    app.dispose();
});