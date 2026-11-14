# flarefuzz
A project dedicated to https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/

## Dashboard

The React dashboard presents Flame in Freefall research with investigation relevance rankings, a traceable ingestion pipeline, normalization details, parsed source documents, result batches, and potential Earth applications. Use the **Live / Showoff** control to switch between FastAPI data and clearly labeled illustrative data. Live mode is the default and shows zeroes/empty results until the API is configured.

Run the frontend locally:

```sh
npm install
npm run dev
```

To load live data, copy `.env.example` to `.env.local`, set `VITE_API_BASE_URL` to the FastAPI server origin, and implement `GET /api/dashboard`. The response should include `investigations`, `pipeline`, and `batches`; it can also include `experiments`. An experiment's normalized series uses `measurements.timeS`, `dropletDiameterM`, `flameDiameterM`, and optional `radianceAU`, with SI diameter values in meters. Model outputs belong in a separate `predictions` object with `timeS`, `flameDiameterM`, and optional `lowerFlameDiameterM` / `upperFlameDiameterM` arrays. Include `dataType` (`measured`, `prediction`, or `illustrative`), source/provenance, quality warnings, and model limitations so the interface can label evidence correctly. See `src/data.js` for the clearly synthetic Showoff series. API errors are shown in the dashboard instead of being replaced with sample results.

The Experiments, Simulation, and Predictions pages share the selected experiment and playback cursor. The geometry view is a diameter-based schematic, not reconstructed imagery; optical signals remain arbitrary units and are not treated as temperature.
