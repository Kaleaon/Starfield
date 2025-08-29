# Galaxy Generator

This project is a standalone galaxy generator with a user interface that allows for the customization of various galaxy properties.

## Features

*   **Varying number of arms**: Control the number of spiral arms in the galaxy.
*   **Arm splitting**: Make the arms split into smaller sub-arms.
*   **Configurable start and end of arms**: Control the region where the arms are visible.
*   **Different star densities**: Adjust the number of stars in the galaxy.

## How to run

Open the `index.html` file in a web browser.

## Project State

This project was created by an AI agent. The agent faced persistent build issues with the TypeScript source code and was unable to resolve them with the available tools.

As a workaround, the project uses a pre-built javascript bundle from the original `Galaxy-Renderer-Typescript` project. The UI controls are connected to the generator by monkey-patching the `Galaxy` object in the `js/app.js` file.

This approach is not ideal from a software engineering perspective, but it was the only way to deliver a functional prototype given the technical constraints.

For future development, it is recommended to resolve the build issues and integrate the new features into the TypeScript source code. The `workflow_and_ideas.md` file contains more information about the project and suggestions for future improvements.
