from pathlib import Path
from collections import defaultdict
import json

import pyarrow.parquet as pq


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path(
    "D:/Projects/Lila-WrittenAssessment/player_data"
)

OUTPUT_DIR = Path(
    "D:/Projects/Lila-WrittenAssessment/LILA-frontend/public/data"
)

OUTPUT_FILE = OUTPUT_DIR / "matches.json"

MINIMAP_SIZE = 1024


# ============================================================
# MAP CONFIGURATION
# ============================================================

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
# HELPER FUNCTIONS
# ============================================================

def decode_value(value):
    """
    Convert bytes to string if necessary.
    """

    if isinstance(value, bytes):
        return value.decode("utf-8")

    return str(value)


def is_bot(user_id):
    """
    Bots have numeric IDs.
    Human players use UUID-style IDs.
    """

    return str(user_id).isdigit()


def world_to_minimap(x, z, map_id):
    """
    Convert world X/Z coordinates to 1024x1024
    minimap pixel coordinates.
    """

    if map_id not in MAP_CONFIG:

        raise ValueError(
            f"Unknown map: {map_id}"
        )

    config = MAP_CONFIG[map_id]

    normalized_x = (
        x - config["origin_x"]
    ) / config["scale"]

    normalized_z = (
        z - config["origin_z"]
    ) / config["scale"]

    pixel_x = (
        normalized_x * MINIMAP_SIZE
    )

    pixel_y = (
        1 - normalized_z
    ) * MINIMAP_SIZE

    return pixel_x, pixel_y


def get_match_time(ts, first_timestamp):
    """
    Convert timestamp into seconds relative
    to the beginning of the match.
    """

    return (
        ts - first_timestamp
    ).total_seconds()


def create_match_key(date, raw_match_id):
    """
    Create a unique identifier for a match entry.

    The raw Nakama match ID may appear in multiple
    date folders. The date is therefore part of the
    processed match identity.

    Example:

        February_10_<match_id>
        February_11_<match_id>
    """

    return f"{date}_{raw_match_id}"


# ============================================================
# FIND DATA FILES
# ============================================================

files = list(
    DATA_DIR.rglob("*.nakama-0")
)


print("=" * 70)
print("LILA DATA PROCESSOR")
print("=" * 70)

print(
    f"\nData directory:\n{DATA_DIR}"
)

print(
    f"\nFound {len(files):,} .nakama-0 files"
)


if len(files) == 0:

    print(
        "\nERROR: No .nakama-0 files found."
    )

    raise SystemExit(1)


# ============================================================
# MATCH STORAGE
# ============================================================
#
# IMPORTANT:
#
# A match is identified by:
#
#     (date, raw_match_id)
#
# NOT just:
#
#     raw_match_id
#
# This means the following are treated as separate matches:
#
#     February_10 + abc123
#     February_11 + abc123
#
# ============================================================

matches = defaultdict(
    lambda: {
        "map_id": None,
        "date": None,
        "raw_match_id": None,
        "events": []
    }
)


# ============================================================
# PROCESS FILES
# ============================================================

print("\nProcessing files...")


files_processed = 0
files_skipped = 0


for index, file_path in enumerate(
    files,
    start=1
):

    # --------------------------------------------------------
    # Read Parquet
    # --------------------------------------------------------

    try:

        table = pq.read_table(
            file_path
        )

        df = table.to_pandas()

    except Exception as error:

        print(
            "\nERROR reading file:"
        )

        print(file_path)

        print(error)

        files_skipped += 1

        continue


    # --------------------------------------------------------
    # Skip empty files
    # --------------------------------------------------------

    if len(df) == 0:

        files_skipped += 1

        continue


    # --------------------------------------------------------
    # DATE FROM PARENT FOLDER
    # --------------------------------------------------------
    #
    # Example:
    #
    # player_data/
    #     February_10/
    #         file.nakama-0
    #
    #     February_11/
    #         file.nakama-0
    #
    # The folder date is intentionally part of the
    # processed match identity.
    # --------------------------------------------------------

    date = file_path.parent.name


    # --------------------------------------------------------
    # Convert event values
    # --------------------------------------------------------

    if "event" in df.columns:

        df["event"] = df["event"].apply(
            decode_value
        )


    # --------------------------------------------------------
    # Validate required columns
    # --------------------------------------------------------

    required_columns = {
        "match_id",
        "map_id",
        "user_id",
        "event",
        "ts",
        "x",
        "y",
        "z",
    }

    missing_columns = (
        required_columns
        - set(df.columns)
    )

    if missing_columns:

        print(
            "\nWARNING: Missing required columns:"
        )

        print(
            missing_columns
        )

        print(
            f"File: {file_path}"
        )

        files_skipped += 1

        continue


    # --------------------------------------------------------
    # Get match ID and map
    # --------------------------------------------------------

    raw_match_id = decode_value(
        df["match_id"].iloc[0]
    )

    map_id = decode_value(
        df["map_id"].iloc[0]
    )


    # --------------------------------------------------------
    # CREATE UNIQUE PROCESSED MATCH KEY
    # --------------------------------------------------------
    #
    # This is the important change.
    #
    # Same raw match ID on different dates becomes
    # two separate entries.
    #
    # Example:
    #
    # February_10_ac049...
    # February_11_ac049...
    #
    # --------------------------------------------------------

    match_key = create_match_key(
        date,
        raw_match_id
    )


    # --------------------------------------------------------
    # Validate map
    # --------------------------------------------------------

    if map_id not in MAP_CONFIG:

        print(
            f"\nWARNING: Unknown map '{map_id}'"
        )

        print(
            f"File: {file_path}"
        )

        files_skipped += 1

        continue


    # --------------------------------------------------------
    # Set match metadata
    # --------------------------------------------------------

    matches[match_key]["map_id"] = map_id

    matches[match_key]["date"] = date

    matches[match_key]["raw_match_id"] = (
        raw_match_id
    )


    # --------------------------------------------------------
    # Process events
    # --------------------------------------------------------

    for _, row in df.iterrows():

        user_id = decode_value(
            row["user_id"]
        )

        event = decode_value(
            row["event"]
        )

        x = float(
            row["x"]
        )

        y = float(
            row["y"]
        )

        z = float(
            row["z"]
        )

        ts = row["ts"]


        # ----------------------------------------------------
        # World → minimap
        # ----------------------------------------------------

        pixel_x, pixel_y = world_to_minimap(
            x,
            z,
            map_id
        )


        # ----------------------------------------------------
        # Store event
        # ----------------------------------------------------

        matches[match_key]["events"].append({

            "user_id": user_id,

            "is_bot": is_bot(
                user_id
            ),

            "event": event,

            "ts": ts,

            "x": x,

            "y": y,

            "z": z,

            "pixel_x": pixel_x,

            "pixel_y": pixel_y,

        })


    files_processed += 1


    # --------------------------------------------------------
    # Progress
    # --------------------------------------------------------

    if (
        index % 100 == 0
        or index == len(files)
    ):

        print(
            f"Processed "
            f"{index:,}/{len(files):,} files"
        )


# ============================================================
# BUILD FINAL MATCH DATA
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "BUILDING FINAL MATCH DATA"
)

print(
    "=" * 70
)


processed_matches = {}


# ============================================================
# PROCESS EACH MATCH
# ============================================================

for match_key, match_data in matches.items():

    events = match_data["events"]


    # --------------------------------------------------------
    # Skip matches with no events
    # --------------------------------------------------------

    if not events:
        continue


    # --------------------------------------------------------
    # Sort events chronologically
    # --------------------------------------------------------

    events.sort(
        key=lambda event: event["ts"]
    )


    # --------------------------------------------------------
    # Match start timestamp
    # --------------------------------------------------------

    first_timestamp = events[0]["ts"]


    # --------------------------------------------------------
    # Players / entities
    # --------------------------------------------------------

    players = {}


    for event in events:

        user_id = event["user_id"]


        # ----------------------------------------------------
        # Create player/entity
        # ----------------------------------------------------

        if user_id not in players:

            players[user_id] = {

                "id": user_id,

                "type": (
                    "bot"
                    if event["is_bot"]
                    else "human"
                ),

                "events": []

            }


        # ----------------------------------------------------
        # Match-relative time
        # ----------------------------------------------------

        match_time = get_match_time(
            event["ts"],
            first_timestamp
        )


        # ----------------------------------------------------
        # Store processed event
        # ----------------------------------------------------

        players[user_id]["events"].append({

            "t": round(
                match_time,
                3
            ),

            "event": event["event"],

            "x": round(
                event["x"],
                3
            ),

            "y": round(
                event["y"],
                3
            ),

            "z": round(
                event["z"],
                3
            ),

            "px": round(
                event["pixel_x"],
                2
            ),

            "py": round(
                event["pixel_y"],
                2
            ),

        })


    # --------------------------------------------------------
    # Match duration
    # --------------------------------------------------------

    duration = get_match_time(
        events[-1]["ts"],
        first_timestamp
    )


    # --------------------------------------------------------
    # Event counts
    # --------------------------------------------------------

    event_counts = defaultdict(int)


    for event in events:

        event_counts[
            event["event"]
        ] += 1


    # --------------------------------------------------------
    # Final match object
    # --------------------------------------------------------

    processed_matches[match_key] = {

        # Unique ID used by the frontend
        "id": match_key,

        # Original Nakama match ID
        "raw_match_id": (
            match_data["raw_match_id"]
        ),

        # Map
        "map": match_data["map_id"],

        # Date folder
        "date": match_data["date"],

        # Match duration
        "duration": round(
            duration,
            3
        ),

        # Number of unique players/entities
        "player_count": len(
            players
        ),

        # Player/entity data
        "players": list(
            players.values()
        ),

        # Event totals
        "event_counts": dict(
            event_counts
        )

    }


# ============================================================
# BUILD MAP INDEX
# ============================================================

print(
    "\nBuilding map index..."
)


map_index = {}


for map_id in MAP_CONFIG.keys():

    map_index[map_id] = {
        "dates": {}
    }


for match_key, match in processed_matches.items():

    map_id = match["map"]

    date = match["date"]


    # --------------------------------------------------------
    # Create map if not already present
    # --------------------------------------------------------

    if map_id not in map_index:

        map_index[map_id] = {
            "dates": {}
        }


    # --------------------------------------------------------
    # Create date
    # --------------------------------------------------------

    if date not in map_index[map_id]["dates"]:

        map_index[map_id]["dates"][date] = {
            "matches": []
        }


    # --------------------------------------------------------
    # Add UNIQUE processed match ID
    # --------------------------------------------------------

    map_index[map_id]["dates"][date][
        "matches"
    ].append(
        match_key
    )


# ============================================================
# SORT MATCHES WITHIN EACH DATE
# ============================================================

for map_data in map_index.values():

    for date_data in map_data["dates"].values():

        date_data["matches"].sort()


# ============================================================
# SORT DATES
# ============================================================

for map_data in map_index.values():

    sorted_dates = dict(
        sorted(
            map_data["dates"].items()
        )
    )

    map_data["dates"] = sorted_dates


# ============================================================
# FINAL JSON
# ============================================================

final_data = {

    "maps": map_index,

    "matches": processed_matches

}


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# WRITE JSON
# ============================================================

print(
    "\nWriting processed data..."
)


with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        final_data,
        file,
        separators=(",", ":")
    )


# ============================================================
# SUMMARY
# ============================================================

total_events = 0

total_humans = 0

total_bots = 0


for match in processed_matches.values():

    for player in match["players"]:

        total_events += len(
            player["events"]
        )

        if player["type"] == "human":

            total_humans += 1

        else:

            total_bots += 1


# ============================================================
# SUMMARY OUTPUT
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "PROCESSING COMPLETE"
)

print(
    "=" * 70
)


print(
    f"\nFiles found:"
    f" {len(files):,}"
)

print(
    f"Files processed:"
    f" {files_processed:,}"
)

print(
    f"Files skipped:"
    f" {files_skipped:,}"
)

print(
    f"Matches created:"
    f" {len(processed_matches):,}"
)

print(
    f"Total events:"
    f" {total_events:,}"
)

print(
    f"Human appearances:"
    f" {total_humans:,}"
)

print(
    f"Bot appearances:"
    f" {total_bots:,}"
)


# ============================================================
# MATCHES BY MAP
# ============================================================

print(
    "\nMatches by map:"
)


for map_id, map_data in map_index.items():

    total_matches = sum(
        len(
            date_data["matches"]
        )

        for date_data
        in map_data["dates"].values()
    )

    print(
        f"  {map_id}: "
        f"{total_matches:,} matches"
    )


# ============================================================
# DATES BY MAP
# ============================================================

print(
    "\nDates by map:"
)


for map_id, map_data in map_index.items():

    print(
        f"\n  {map_id}:"
    )

    for date, date_data in (
        map_data["dates"].items()
    ):

        print(
            f"    {date}: "
            f"{len(date_data['matches']):,} matches"
        )


# ============================================================
# SHOW DUPLICATE RAW MATCH IDS
# ============================================================
#
# This is informational only.
#
# If the same raw match ID exists on multiple dates,
# we now intentionally keep them as separate matches.
#
# ============================================================

raw_match_dates = defaultdict(set)


for match_key, match in processed_matches.items():

    raw_match_id = match["raw_match_id"]

    raw_match_dates[
        raw_match_id
    ].add(
        match["date"]
    )


duplicate_raw_ids = {

    raw_match_id: dates

    for raw_match_id, dates
    in raw_match_dates.items()

    if len(dates) > 1

}


print(
    "\n" + "=" * 70
)

print(
    "RAW MATCH ID CHECK"
)

print(
    "=" * 70
)


print(
    f"\nUnique raw match IDs:"
    f" {len(raw_match_dates):,}"
)

print(
    f"Raw match IDs appearing on "
    f"multiple dates:"
    f" {len(duplicate_raw_ids):,}"
)


if duplicate_raw_ids:

    print(
        "\nThese IDs are intentionally split "
        "by date:"
    )

    for raw_match_id, dates in list(
        duplicate_raw_ids.items()
    )[:20]:

        print(
            f"\n  Raw match ID:"
        )

        print(
            f"    {raw_match_id}"
        )

        print(
            f"  Dates:"
        )

        for date in sorted(dates):

            print(
                f"    - {date}"
            )


# ============================================================
# OUTPUT
# ============================================================

print(
    "\nOutput:"
)

print(
    OUTPUT_FILE
)


print(
    "\nJSON structure:"
)

print(
    "  maps"
)

print(
    "    └── map"
)

print(
    "        └── dates"
)

print(
    "            └── date"
)

print(
    "                └── processed match IDs"
)


print(
    "\n  matches"
)

print(
    "    └── date_match_id"
)

print(
    "        ├── id"
)

print(
    "        ├── raw_match_id"
)

print(
    "        ├── map"
)

print(
    "        ├── date"
)

print(
    "        ├── duration"
)

print(
    "        ├── player_count"
)

print(
    "        ├── players"
)

print(
    "        └── event_counts"
)


print(
    "\nDone."
)