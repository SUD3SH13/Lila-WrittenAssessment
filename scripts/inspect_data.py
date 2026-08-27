from pathlib import Path
import pyarrow.parquet as pq
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path(
    "D:/Projects/Lila-WrittenAssessment/player_data"
)

MINIMAP_SIZE = 1024


# World coordinate configuration for each map
MAP_CONFIG = {
    "AmbroseValley": {
        "scale": 900,
        "origin_x": -370,
        "origin_z": -473,
    },
    "GrandRift": {
        "scale": 581,
        "origin_x": -290,
        "origin_z": -290,
    },
    "Lockdown": {
        "scale": 1000,
        "origin_x": -500,
        "origin_z": -500,
    },
}


# ============================================================
# FUNCTIONS
# ============================================================

def decode_event(value):
    """
    Convert the event column from bytes to a normal string.
    """
    if isinstance(value, bytes):
        return value.decode("utf-8")

    return value


def is_bot(user_id):
    """
    Bots have numeric user IDs.
    Humans have UUID-style user IDs.
    """
    return str(user_id).isdigit()


def world_to_minimap(x, z, map_id):
    """
    Convert game world X/Z coordinates into
    1024x1024 minimap pixel coordinates.
    """

    if map_id not in MAP_CONFIG:
        raise ValueError(f"Unknown map: {map_id}")

    config = MAP_CONFIG[map_id]

    # Convert world coordinates to 0-1 UV coordinates
    u = (x - config["origin_x"]) / config["scale"]
    v = (z - config["origin_z"]) / config["scale"]

    # Convert UV coordinates to image pixels
    pixel_x = u * MINIMAP_SIZE
    pixel_y = (1 - v) * MINIMAP_SIZE

    return pixel_x, pixel_y


# ============================================================
# FIND DATA FILES
# ============================================================

files = list(DATA_DIR.rglob("*.nakama-0"))

print("=" * 60)
print("LILA PLAYER DATA INSPECTION")
print("=" * 60)

print(f"\nData directory:")
print(DATA_DIR)

print(f"\nFound {len(files)} .nakama-0 files")


if len(files) == 0:
    print("\nERROR: No .nakama-0 files were found.")
    print("Check that DATA_DIR points to the player_data folder.")
    exit()


# ============================================================
# SELECT ONE FILE
# ============================================================

FILE_PATH = files[0]

print("\nReading first file:")
print(FILE_PATH)


# ============================================================
# READ PARQUET
# ============================================================

try:
    table = pq.read_table(FILE_PATH)
    df = table.to_pandas()

except Exception as e:
    print("\nERROR reading Parquet file:")
    print(e)
    exit()


# ============================================================
# DECODE EVENTS
# ============================================================

df["event"] = df["event"].apply(decode_event)


# ============================================================
# BASIC INFORMATION
# ============================================================

print("\n" + "=" * 60)
print("DATA INFORMATION")
print("=" * 60)

print("\nColumns:")
print(df.columns.tolist())

print("\nNumber of rows:")
print(len(df))

print("\nFirst 10 rows:")
print(df.head(10).to_string(index=False))


# ============================================================
# EVENT TYPES
# ============================================================

print("\n" + "=" * 60)
print("EVENT TYPES")
print("=" * 60)

print(df["event"].value_counts())


# ============================================================
# MATCH / MAP / PLAYER
# ============================================================

print("\n" + "=" * 60)
print("MATCH INFORMATION")
print("=" * 60)

print("\nMap:")
print(df["map_id"].unique())

print("\nMatch:")
print(df["match_id"].unique())

print("\nUser:")
print(df["user_id"].unique())


# ============================================================
# HUMAN / BOT DETECTION
# ============================================================

user_id = str(df["user_id"].iloc[0])

if is_bot(user_id):
    player_type = "BOT"
else:
    player_type = "HUMAN"

print("\nPlayer type:")
print(player_type)


# ============================================================
# COORDINATE RANGES
# ============================================================

print("\n" + "=" * 60)
print("COORDINATE RANGES")
print("=" * 60)

print(
    f"X: {df['x'].min():.3f} "
    f"to {df['x'].max():.3f}"
)

print(
    f"Y: {df['y'].min():.3f} "
    f"to {df['y'].max():.3f}"
)

print(
    f"Z: {df['z'].min():.3f} "
    f"to {df['z'].max():.3f}"
)


# ============================================================
# TIMESTAMP RANGE
# ============================================================

print("\n" + "=" * 60)
print("TIMESTAMP")
print("=" * 60)

print("Start:")
print(df["ts"].min())

print("\nEnd:")
print(df["ts"].max())


# ============================================================
# CONVERT TIMESTAMPS TO MATCH TIME
# ============================================================

# The README explains that timestamps represent time
# within the match, rather than actual wall-clock time.

first_timestamp = df["ts"].min()

df["match_time_seconds"] = (
    df["ts"] - first_timestamp
).dt.total_seconds()

print("\nFirst 10 match times:")

print(
    df[
        ["ts", "match_time_seconds", "event"]
    ].head(10).to_string(index=False)
)


# ============================================================
# COORDINATE MAPPING
# ============================================================

print("\n" + "=" * 60)
print("COORDINATE MAPPING")
print("=" * 60)


# Get the first Position event
position_events = df[
    df["event"].isin(["Position", "BotPosition"])
]


if len(position_events) == 0:

    print("\nNo position events found.")

else:

    first_position = position_events.iloc[0]

    world_x = first_position["x"]
    world_z = first_position["z"]
    map_id = first_position["map_id"]

    pixel_x, pixel_y = world_to_minimap(
        world_x,
        world_z,
        map_id
    )

    print("\nFirst position:")

    print(f"Map: {map_id}")

    print(f"World X: {world_x}")
    print(f"World Z: {world_z}")

    print("\nMinimap position:")

    print(f"Pixel X: {pixel_x:.2f}")
    print(f"Pixel Y: {pixel_y:.2f}")


# ============================================================
# CONVERT ALL POSITION EVENTS
# ============================================================

print("\n" + "=" * 60)
print("CONVERTING POSITION EVENTS")
print("=" * 60)


def convert_row(row):

    pixel_x, pixel_y = world_to_minimap(
        row["x"],
        row["z"],
        row["map_id"]
    )

    return pd.Series({
        "pixel_x": pixel_x,
        "pixel_y": pixel_y,
    })


if len(position_events) > 0:

    position_events = position_events.copy()

    position_events[
        ["pixel_x", "pixel_y"]
    ] = position_events.apply(
        convert_row,
        axis=1
    )

    print(
        position_events[
            [
                "x",
                "z",
                "pixel_x",
                "pixel_y",
                "event"
            ]
        ]
        .head(10)
        .to_string(index=False)
    )


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

print(f"\nTotal dataset files: {len(files)}")

print(f"Current file: {FILE_PATH.name}")

print(f"Rows in current file: {len(df)}")

print(f"Player type: {player_type}")

print(f"Map: {df['map_id'].iloc[0]}")

print(f"Match: {df['match_id'].iloc[0]}")

print("\nEvents:")

for event, count in df["event"].value_counts().items():
    print(f"  {event}: {count}")

print("\nInspection complete.")