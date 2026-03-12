# aliahmed.co

This repository contains the source code for my minimalist personal portfolio and digital playground.

## Architecture

*   **Framework:** React + Vite
*   **Styling:** Custom Vanilla CSS featuring a minimalist, high-contrast monochrome aesthetic inspired by Sana Labs. No hefty UI libraries.
*   **Hosting:** Vercel (Automatic deployments from the `main` branch).
*   **Data Integration:**
    *   **GitHub**: Dynamically fetches and renders pinned repositories via the GitHub REST API (`useGithubRepos` hook).
    *   **Work History**: Minimalist timeline representing key roles across WMATA, Columbia University, NASA, Autodesk, etc.

## Philosophy

The goal for this site isn't simply to host a resume, but to reflect a specific engineering philosophy:
1.  **Fewer Abstractions:** The styling and routing are as vanilla as possible, preferring standard platform features over bloated dependencies.
2.  **High Signal-to-Noise:** Professional experience is boiled down to the absolute minimum necessary information (role and company).

## Local Development

To run this project locally:

1. Clone this repository: `git clone https://github.com/aliahm08/aliahmedco.git`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Build for production: `npm run build`

## Updates

This repository is continuously deployed to [https://aliahmedco.vercel.app](https://aliahmedco.vercel.app) (aliased to [aliahmed.co](https://aliahmed.co) assuming DNS is configured). 
Changes to `main` go live immediately.