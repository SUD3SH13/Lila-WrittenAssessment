# Architecture

## Overview

LILA Player Journey is a React-based visualization tool for exploring player telemetry from LILA BLACK matches. The application allows the user to select a map, filter matches by date, select an individual match, and replay player movement and events on the corresponding minimap.

The project uses a small Python preprocessing pipeline to transform the raw Parquet telemetry into a frontend-friendly JSON structure. This keeps the React application focused on visualization rather than parsing and aggregating thousands of raw files at runtime.

## Technology Choices

- **React + Vite** — lightweight frontend and fast development workflow.
- **Mantine** — provides the UI components and layout primitives while keeping the interface consistent.
- **Python + PyArrow/Pandas** — used for processing the raw Parquet files and aggregating them into match-level data.
- **Static JSON** — processed data is stored in `public/data/matches.json` and `public/data/heatmaps.json`, allowing the application to run without a backend or database.
- **Minimap images** — the provided 1024×1024 minimaps are used as the spatial reference for player movement.

## Data Flow

Raw Parquet files
        |
        ▼
Python preprocessing
        │
        |-- Identify map
        |-- Identify date from parent folder
        |-- Group files by match
        |-- Identify human/bot entities
        |-- Sort events by timestamp
        |-- Calculate match-relative time
        |-- Convert world coordinates to minimap pixels
        │
        ▼
public/data/matches.json
        │
        ▼
React application
        |
        |-- MapSelector
        |
        |-- ToolSelector
        |       |
        |       |-- MatchReplay
        |       |       |
        |       |       |-- DatePicker
        |       |       |-- MatchSelector
        |       |       |-- MapViewer
        |       |       |-- Timeline
        |       |
        |       |-- HeatmapViewer
        |               |
        |               |-- HeatmapType
        |               |-- ColorMode
        |               |-- GridVisualization
        |
        ▼
Interactive Map Visualization

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

### heatmaps.json is organised as

maps
└── map
    ├── grid_size
    ├── traffic[]
    ├── kills[]
    ├── deaths[]
    └── loot[]

### Coordinate Mapping

The data contains 3D world coordinates (x, y, z). Since the minimaps are top-down 2D images, only x and z are used for spatial visualization.

The preprocessing pipeline uses the following map-specific coordinate configurations:

Map	            Scale	Origin X	Origin Z
Ambrose Valley	900	    -370	    -473
Grand Rift	    581	    -290	    -290
Lockdown	    1000	-500	    -500

World coordinates are first normalized:
u = (x - origin_x) / scale
v = (z - origin_z) / scale

They are then converted to the 1024×1024 minimap:
pixel_x = u × 1024
pixel_y = (1 - v) × 1024

1 - v flips the normalized vertical coordinate because world-space Z increases in the opposite direction to image-space Y. Image coordinates start at the top-left and increase downward, so the normalized Z value is inverted before converting it to minimap pixels.

The processed JSON stores the resulting px and py values with each event so the frontend does not need to repeatedly perform the coordinate conversion.

### Assumptions and Data Handling

The dataset contains one known case where the same raw match ID appears in multiple date folders with duplicated records. To preserve the date-based organization required by the visualization, these are treated as separate frontend entries using date-scoped IDs:

February_10_<raw_match_id>
February_11_<raw_match_id>

For example, ac049b28-8116-4ff1-9e60-4be0537b8cc9.nakama-0 appears in both folders and is therefore represented as two separate matches in the frontend. This results in 797 date-scoped match entries from 796 unique raw match IDs.

The frontend is componentized into independent pieces for map selection, date selection, match selection, map rendering, and timeline playback, making each part easier to maintain and modify.
The application follows a static-first architecture. No backend or database is required at runtime. All raw data is preprocessed into JSON, which the React application loads directly from the public directory.