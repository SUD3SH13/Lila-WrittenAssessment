from pathlib import Path
from collections import defaultdict
import json
import pandas as pd
import pyarrow.parquet as pq
import numpy as np


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / "player_data"

OUTPUT_DIR = PROJECT_ROOT / "LILA-frontend" / "public" / "data"

OUTPUT_FILE = OUTPUT_DIR / "heatmaps.json"


# ============================================================
# MAP CONFIGURATION
# ============================================================
#
# World coordinates -> minimap pixels
#
# pixel_x = (world_x - origin_x) / scale * map_size
# pixel_y = map_size - ((world_z - origin_z) / scale * map_size)
#
# These are the same mappings used by your existing
# MapViewer.
# ============================================================

MAP_CONFIG = {
    "AmbroseValley": {
        "scale": 900,
        "origin_x": -370,
        "origin_z": -473,
        "size": 512,
    },

    "GrandRift": {
        "scale": 581,
        "origin_x": -290,
        "origin_z": -290,
        "size": 512,
    },

    "Lockdown": {
        "scale": 1000,
        "origin_x": -500,
        "origin_z": -500,
        "size": 512,
    },
}


# ============================================================
# HEATMAP GRID
# ============================================================

GRID_SIZE = 64


# ============================================================
# CONVERT WORLD -> MINIMAP
# ============================================================

def world_to_pixel(map_name, x, z):
    config = MAP_CONFIG[map_name]

    size = config["size"]

    pixel_x = (
        (x - config["origin_x"])
        / config["scale"]
        * size
    )

    pixel_y = (
        size
        - (
            (z - config["origin_z"])
            / config["scale"]
            * size
        )
    )

    return pixel_x, pixel_y


# ============================================================
# CONVERT PIXEL -> GRID CELL
# ============================================================

def pixel_to_grid(pixel_x, pixel_y):
    cell_x = int(pixel_x / 512 * GRID_SIZE)
    cell_y = int(pixel_y / 512 * GRID_SIZE)

    cell_x = max(0, min(GRID_SIZE - 1, cell_x))
    cell_y = max(0, min(GRID_SIZE - 1, cell_y))

    return cell_x, cell_y


# ============================================================
# INITIALIZE
# ============================================================

heatmaps = {}

for map_name in MAP_CONFIG:

    heatmaps[map_name] = {
        "traffic": defaultdict(float),
        "kills": defaultdict(float),
        "deaths": defaultdict(float),
        "loot": defaultdict(float),
    }


# ============================================================
# FIND ALL DATA FILES
# ============================================================

files = sorted(DATA_DIR.rglob("*.nakama-0"))

print("=" * 70)
print("GENERATING HEATMAP DATA")
print("=" * 70)

print(f"Files found: {len(files)}")


# ============================================================
# PROCESS FILES
# ============================================================

for index, file_path in enumerate(files, start=1):

    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()

    except Exception as e:

        print(f"Failed to read {file_path}")
        print(e)

        continue


    if df.empty:
        continue


    # --------------------------------------------------------
    # Normalize columns
    # --------------------------------------------------------

    df["event"] = df["event"].astype(str)

    map_name = str(df["map_id"].iloc[0])

    if map_name not in MAP_CONFIG:
        continue


    # --------------------------------------------------------
    # PROCESS EVENTS
    # --------------------------------------------------------

    for _, row in df.iterrows():

        event = row["event"]

        x = row["x"]
        z = row["z"]


        if pd.isna(x) or pd.isna(z):
            continue


        # ----------------------------------------------------
        # World -> minimap
        # ----------------------------------------------------

        pixel_x, pixel_y = world_to_pixel(
            map_name,
            float(x),
            float(z),
        )


        # Ignore coordinates outside minimap

        if (
            pixel_x < 0
            or pixel_x >= 512
            or pixel_y < 0
            or pixel_y >= 512
        ):
            continue


        # ----------------------------------------------------
        # Pixel -> heatmap grid
        # ----------------------------------------------------

        gx, gy = pixel_to_grid(
            pixel_x,
            pixel_y,
        )

        key = (gx, gy)


        # ----------------------------------------------------
        # HIGH TRAFFIC
        # ----------------------------------------------------
        #
        # Position events from humans and bots.
        #
        # Each observation contributes one unit.
        #

        if event in ("Position", "BotPosition"):

            heatmaps[map_name]["traffic"][key] += 1


        # ----------------------------------------------------
        # LOOT
        # ----------------------------------------------------

        elif event == "Loot":

            heatmaps[map_name]["loot"][key] += 1


        # ----------------------------------------------------
        # KILLS
        # ----------------------------------------------------
        #
        # BotKill = player killed a bot
        # Kill    = player killed another player
        #

        elif event in ("BotKill", "Kill"):

            heatmaps[map_name]["kills"][key] += 1


        # ----------------------------------------------------
        # DEATHS
        # ----------------------------------------------------
        #
        # BotKilled = bot was killed
        # Killed    = player died
        # KilledByStorm = player died to storm
        #

        elif event in (
            "BotKilled",
            "Killed",
            "KilledByStorm",
        ):

            heatmaps[map_name]["deaths"][key] += 1


    # --------------------------------------------------------
    # Progress
    # --------------------------------------------------------

    if index % 100 == 0 or index == len(files):

        print(
            f"Processed {index:,}/{len(files):,} files"
        )


# ============================================================
# NORMALIZE HEATMAPS
# ============================================================

def convert_grid(grid):

    if not grid:
        return []


    maximum = max(grid.values())


    result = []

    for (x, y), value in grid.items():

        # Normalize to 0 -> 1

        intensity = value / maximum if maximum else 0


        result.append({
            "x": x,
            "y": y,
            "value": round(value, 3),
            "intensity": round(intensity, 4),
        })


    return result


# ============================================================
# CONVERT defaultdict -> JSON
# ============================================================

output = {}


for map_name, layers in heatmaps.items():

    output[map_name] = {

        "grid_size": GRID_SIZE,

        "traffic": convert_grid(
            layers["traffic"]
        ),

        "kills": convert_grid(
            layers["kills"]
        ),

        "deaths": convert_grid(
            layers["deaths"]
        ),

        "loot": convert_grid(
            layers["loot"]
        ),
    }


# ============================================================
# WRITE FILE
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8",
) as f:

    json.dump(
        output,
        f,
        indent=2,
    )


# ============================================================
# SUMMARY
# ============================================================

print()
print("=" * 70)
print("HEATMAP GENERATION COMPLETE")
print("=" * 70)

for map_name, layers in output.items():

    print()
    print(map_name)

    print(
        f"  Traffic cells: {len(layers['traffic'])}"
    )

    print(
        f"  Kill cells:    {len(layers['kills'])}"
    )

    print(
        f"  Death cells:   {len(layers['deaths'])}"
    )

    print(
        f"  Loot cells:    {len(layers['loot'])}"
    )


print()
print(f"Output:")
print(OUTPUT_FILE)