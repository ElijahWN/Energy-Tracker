# Energy Tracker (Express + EJS)

Track household energy usage, compare against others on a public leaderboard, and explore aggregated statistics across regions and appliance types. This app demonstrates a full-stack approach with a Node.js/Express backend, EJS server-side rendering for the leaderboard, and a modern vanilla JS client for a smooth experience in other pages.

## Highlights

*   Personal locations and appliances are stored client-side (localStorage) for quick UX.
*   Public leaderboard is server-backed and shared; entries are uploaded from the client.
*   Aggregated statistics show totals by state/territory, energy sources, and appliance types.
*   Simple, dependency-light stack: Express, EJS, and vanilla JS modules.

## Tech Stack

*   Runtime: Node.js
*   Server: Express
*   Views: Mix between EJS and HTML+JS
*   Client: JS Modules and localStorage
*   Styling: CSS in `src/public/styles/`

## Repository layout

Energy Tracker/
*   package.json
*   package-lock.json
*   src/
    *   server.mjs - Express app entry
    *   controllers/
        *   LeaderboardController.mjs - SSR page + JSON endpoints for leaderboard
        *   LocationsController.mjs - Serves static pages + appliances/region data
        *   StatisticsController.mjs - Serves public stats page + aggregated data
    *   routes/
        *   leaderboard.mjs
        *   locations.mjs
        *   statistics.mjs
    *   models/ - Server-side models (in-memory)
        *   ServerDataModel.mjs - Base in-memory store utilities
        *   LeaderboardItemModel.mjs - Public leaderboard entry (server)
        *   ApplianceModel.mjs - Server-side appliance instance
        *   ApplianceTypeModel.mjs - Predefined appliance types + watts
        *   RegionPowerModel.mjs - Per-region energy source mix (percentages)
        *   UtilsController.mjs - Server-side utilities (calc + charts for SSR)
    *   views/
        *   leaderboard.ejs - SSR view for initial leaderboard
    *   public/
        *   styles/ - CSS for all pages
        *   images/
        *   views/ - Static HTML views
            *   LocationListView.html
            *   LocationEditView.html
            *   LocationStatisticsView.html
            *   PublicStatisticsView.html
        *   scripts/ - Client-side controllers and models
            *   NavigationController.mjs - Header/nav + theme toggle
            *   LocationListController.mjs - Locations list (create/search/post/delete)
            *   LocationEditController.mjs - Edit a location + manage appliances
            *   LocationStatisticsController.mjs (referenced)
            *   PublicStatisticsController.mjs - Public stats charts
            *   LeaderboardController.mjs - Client interactions on leaderboard page
            *   ClientDataModel.mjs - localStorage base model
            *   LocationModel.mjs - Client-side location model
            *   SantizedLeaderboardEntryModel.mjs
            *   ApplianceModel.mjs
            *   ApplianceTypeModel.mjs
            *   RegionPowerModel.mjs
            *   UtilsController.mjs - Client utilities: calc + charts

## How It Works

*   The server hosts three areas:
    *   `/locations` family: serves static HTML for local location management (client-side data).
    *   `/leaderboard`: renders a server-side EJS page initially and exposes JSON endpoints for dynamic filtering/pagination and CRUD.
    *   `/statistics`: serves a public stats page and provides aggregated data via JSON.
*   Client stores locations in localStorage until you choose to upload them to the public leaderboard. Uploaded entries become visible to all users while the server runs.
*   Aggregations are computed on the server from uploaded entries only (local-only items are not included until posted).

## Running the App

*   Prerequisites: Node.js 18+ recommended

Install dependencies:

```bash
npm install
```

Start in development mode (with nodemon):

```bash
npm run dev
```

Start normally:

```bash
npm start
```

Server runs on: http://localhost:8080

## Server Entry and Configuration

*   `src/server.mjs`
    *   Sets EJS view engine and views path: `app.set("view engine", "ejs")`
    *   Mounts routers:
        *   `/leaderboard` - `src/routes/leaderboard.mjs`
        *   `/statistics` - `src/routes/statistics.mjs`
        *   `/locations` - `src/routes/locations.mjs`
    *   Redirects `/` - `/locations`
    *   Serves static assets from `src/public/`
    *   Listens on port 8080

## Endpoints Overview

*   Leaderboard (`src/routes/leaderboard.mjs`):
    *   GET `/leaderboard` - SSR page `leaderboard.ejs` (initially sorted by GREEN energy, highest energy usage first).
    *   GET `/leaderboard/entries` - Paginated, filtered JSON entries.
        *   Query params: `page`, `appType` (ANY or an appliance type), `powerSource` (ANY, GREEN, or specific energy source like Solar), `region` (ALL or the region code), `sortOrder` (HIGH or LOW).
    *   POST `/leaderboard/upload` - Add a new leaderboard entry.
    *   PUT `/leaderboard/upload` - Update an existing leaderboard entry by `privateId`.
    *   DELETE `/leaderboard/delete` - Remove entry by `privateId` in body: `{ id: string }`.

*   Statistics (`src/routes/statistics.mjs`):
    *   GET `/statistics` - Static `PublicStatisticsView.html`.
    *   GET `/statistics/data` - Aggregated totals by region, source, and appliance type.

*   Locations (`src/routes/locations.mjs`):
    *   GET `/locations` - `LocationListView.html`.
    *   GET `/locations/edit` - `LocationEditView.html`.
    *   GET `/locations/statistics` - `LocationStatisticsView.html`.
    *   GET `/locations/appliances` - JSON list of server-side `ApplianceTypeModel.types` (name + watts).
    *   GET `/locations/regions` - JSON list of `RegionPowerModel.data` (per-state power source ratio).

## Data Shapes and Models

*   Server in-memory models (`src/models/`):
    *   `ServerDataModel` - Base store with `data` array and helpers (`get`, `getMany`, `insert`, `update`, `delete`). Data resets on server restart.
    *   `LeaderboardItemModel` - `{ address, region, appliances[], publicId, privateId }`. Client uploads use this shape; `publicId`/`privateId` can be client-provided or generated server-side.
    *   `ApplianceModel` - `{ type: ApplianceTypeModel, hours: number, quantity: number }`.
    *   `ApplianceTypeModel` - Predefined list (e.g., Refrigerator 100W, Air Conditioner 350W, Heater 1500W, etc.).
    *   `RegionPowerModel` - Per-state `powerSources` mix in percentages, e.g. NSW `{ wind:12, solar:15, gas:25, coal:48 }`.
    *   `UtilsController` - Utility controller with shared functions.

*   Client models (`src/public/scripts/`):
    *   `ClientDataModel` - Base for localStorage persistence.
    *   `LocationModel` - Extends `ClientDataModel`, adds `isUploaded` flag and id fields. Saved under the local storage key `locations`.
    *   `SantizedLeaderboardEntryModel` - Safe subset for displaying leaderboard entries on the client.
    *   `ApplianceModel`, `ApplianceTypeModel`, `RegionPowerModel` - used by client utilities and views.
    *   `UtilsController` - Utility controller with shared functions.

## Client Features

*   `NavigationController.mjs`
    *   Builds a responsive header with links to Locations, Leaderboard, Statistics.
    *   Provides a theme toggle (light/dark) stored in `sessionStorage`.

*   `LocationListController.mjs`
    *   Create new locations; quick search with debounce; list cards show total energy and appliance count.
    *   Upload to leaderboard (`POST`), update if already uploaded (`PUT`), with graceful fallback from PUT to POST.
    *   Delete locally and (if uploaded) from the server (`DELETE`).

*   `LocationEditController.mjs`
    *   Load a location by `?id=...` and edit its name, address, region.
    *   Add/remove appliances with validation; save changes locally.

*   `LeaderboardController.mjs` (client)
    *   Fetch paginated entries from `/leaderboard/entries` based on filters.
    *   Render cards with total usage and toggleable charts for appliance vs energy-source breakdown.
    *   If an entry corresponds to a locally stored location, show a Delete button that removes it server-side.

*   `PublicStatisticsController.mjs`
    *   Fetch `/statistics/data` and render pie charts for state/territory, energy sources, and appliances.
    *   Graceful handling for empty datasets and network errors.

## Views and Styling

*   Server-rendered view: `src/views/leaderboard.ejs`
    *   Receives: `locations` (initial page), `appTypes`, `RegionPowerModel`, `UtilsController`, and pagination metadata.
    *   Client script enhances the page with interactive filtering and pagination.

*   Static views under `src/public/views/`: `LocationListView.html`, `LocationEditView.html`, `LocationStatisticsView.html`, `PublicStatisticsView.html`.
*   CSS in `src/public/styles/` (global `styles.css` plus page-specific files such as `leaderboard.css`, `locationEdit.css`, `publicStatistics.css`, etc.).

## Data Persistence Notes

*   Server data is in-memory only; restarting the server clears the public leaderboard and aggregated statistics.
*   Client data (locations) persists in the browser via localStorage under the key `locations`.

## Error Handling and Validation

*   Controllers respond with JSON messages on errors (e.g., failed uploads, stat aggregation issues).
*   Client controllers show inline messaging or alerts when network calls fail.
*   Basic validations are performed on inputs (e.g., address/region format, appliance values).
