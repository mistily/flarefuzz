# Flare Fuzz

An interactive research dashboard for [Flame in Freefall](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/). The repository currently contains two separate frontends:

- The **React + Vite dashboard** at the repository root.
- A **Next.js app** in the nested `flare-fuzz/` directory.

Run commands from the directory for the app you intend to use. Each app has its own `package.json`, lockfile, dependencies, and server.

## Get the code

For a fresh clone:

```sh
git clone --branch mistily-fire-safety-dashboard https://github.com/mistily/flarefuzz.git
cd flarefuzz
```

For an existing clone:

```sh
git fetch origin
git switch mistily-fire-safety-dashboard
git pull --ff-only origin mistily-fire-safety-dashboard
```

## Requirements

- Git
- Node.js 20.9 or newer (Node.js 22 LTS recommended; Vite alone supports Node.js 18+)
- npm

## React + Vite dashboard

Run these commands from the repository root (the directory with the top-level `vite.config.js`):

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Connect the FastAPI service

The dashboard opens in **Live** mode. Until a FastAPI URL is configured, it shows zero counts and empty experiment results. Use **Showoff** to preview the interface with illustrative data; those values are synthetic and are **not NASA measurements**.

Copy `.env.example` to `.env.local` and set the API origin:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Restart Vite after changing environment variables. The frontend calls `GET {VITE_API_BASE_URL}/api/dashboard`. The API must allow browser requests from the Vite origin using CORS. API errors are shown in Live mode rather than silently replaced with Showoff data.

The response must include `investigations`, `pipeline`, and `batches`; `experiments` is optional. Experiment records can include:

- `id`, `title`, `dataType` (`measured`, `prediction`, or `illustrative`), `sourceName`, `provenance`, `dataQualityWarnings`, and `modelLimitations`
- `measurements.timeS`, `measurements.dropletDiameterM`, `measurements.flameDiameterM`, and optional `measurements.radianceAU`
- A separate `predictions` object with `timeS`, `flameDiameterM`, and optional `lowerFlameDiameterM`, `upperFlameDiameterM`, and `errorMetrics`

Diameter values use meters, time uses seconds, and radiance is in arbitrary units. See `src/data.js` for the complete illustrative response shape.

The dashboard has four pages: Overview, Experiments, Simulation, and Predictions. Its 2D flame view is a schematic based on diameter values, not reconstructed experimental imagery or a temperature field. Optical intensity is not treated as temperature. Rocket engines and propellants are outside the research scope.

Build and preview the production bundle from the repository root:

```sh
npm run build
npm run preview
```

## Nested Next.js app

Change into the nested app before installing or running it:

```sh
cd flare-fuzz
npm ci
npm run dev
```

Open `http://localhost:3000`. The app also provides:

```sh
npm run lint
npm run build
npm start
```

Run `npm start` after a successful production build to serve that build.

### Next.js setup note

The nested app is independent of the Vite dashboard. In some Windows setups, Next.js has reported an invalid `@next/swc-win32-x64-msvc` binary and inferred the workspace root from the repository-level lockfile instead of its own. If this happens, confirm the terminal is in `flare-fuzz/` and that dependencies were installed there for the current Windows/Node architecture. The Vite dashboard does not use Next.js or SWC.
