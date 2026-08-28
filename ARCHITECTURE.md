# Architecture

## Overview

LILA Player Journey is a React-based visualization tool for exploring player telemetry from LILA BLACK matches. The application allows the user to select a map, filter matches by date, select an individual match, and replay player movement and events on the corresponding minimap.

The project uses a small Python preprocessing pipeline to transform the raw Parquet telemetry into a frontend-friendly JSON structure. This keeps the React application focused on visualization rather than parsing and aggregating thousands of raw files at runtime.

## Technology Choices

- **React + Vite** — lightweight frontend and fast development workflow.
- **Mantine** — provides the UI components and layout primitives while keeping the interface consistent.
- **Python + PyArrow/Pandas** — used for processing the raw Parquet files and aggregating them into match-level data.
- **Static JSON** — processed data is stored in `public/data/matches.json`, allowing the application to run without a backend or database.
- **Minimap images** — the provided 1024×1024 minimaps are used as the spatial reference for player movement.

## Data Flow

Raw Parquet files
        │
        ▼
Python preprocessing
        │
        ├── Identify map
        ├── Identify date from parent folder
        ├── Group files by match
        ├── Identify human/bot entities
        ├── Sort events by timestamp
        ├── Calculate match-relative time
        └── Convert world coordinates to minimap pixels
        │
        ▼
public/data/matches.json
        │
        ▼
React application
        │
        ├── MapSelector
        ├── DatePicker
        ├── MatchSelector
        ├── MapViewer
        └── Timeline
        │
        ▼
Interactive player journey visualization 

### matches.json is organised as

maps
 └── map
      └── dates
           └── date
                └── matches[]

matches
 └── match_id
      ├── metadata
      └── players[]
           └── events[]

### Coordinate Mapping

The data contains 3D world coordinates (x, y, z). Since the minimaps are top-down 2D images, only x and z are used for spatial visualization.

World coordinates are first normalized:
u = (x - origin_x) / scale
v = (z - origin_z) / scale

They are then converted to the 1024×1024 minimap:
pixel_x = u × 1024
pixel_y = (1 - v) × 1024

The processed JSON stores the resulting px and py values with each event so the frontend does not need to repeatedly perform the coordinate conversion.

### Assumptions and Data Handling

The dataset contains one known case where the same raw match ID occurs in more than one date folder and contains duplicated records. To preserve the date-based organization required by the visualization, the processed match ID includes the date folder February_10_<raw_match_id> and February_11_<raw_match_id> (ac049b28-8116-4ff1-9e60-4be0537b8cc9.nakama-0) are treated as separate frontend entries. 
This results in 797 date-scoped match entries from 796 unique raw match IDs.

The frontend is componentized so that map selection, date selection, match selection, map rendering, and timeline playback remain independent pieces of the UI.

The application is static-first: no backend or database is required after preprocessing. The React application loads the generated JSON directly from the public directory.