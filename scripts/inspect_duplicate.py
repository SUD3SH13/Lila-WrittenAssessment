from pathlib import Path
from collections import defaultdict
import pyarrow.parquet as pq
import pandas as pd


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path(
    "D:/Projects/Lila-WrittenAssessment/player_data"
)

TARGET_MATCH = (
    "ac049b28-8116-4ff1-9e60-4be0537b8cc9.nakama-0"
)


# ============================================================
# FIND FILES BELONGING TO THE MATCH
# ============================================================

matching_files = []

for file_path in DATA_DIR.rglob("*.nakama-0"):

    # Match ID is the second part of the filename
    # but we read the file to verify it.
    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()

    except Exception:
        continue

    if len(df) == 0:
        continue

    match_ids = df["match_id"].astype(str).unique()

    if TARGET_MATCH in match_ids:

        matching_files.append(
            (file_path, df)
        )


# ============================================================
# BASIC INFORMATION
# ============================================================

print("=" * 70)
print("DUPLICATE MATCH INSPECTION")
print("=" * 70)

print(
    f"\nTarget match:\n{TARGET_MATCH}"
)

print(
    f"\nFiles found: {len(matching_files)}"
)


# ============================================================
# INFORMATION PER FILE
# ============================================================

all_events = []

user_files = defaultdict(list)


for index, (file_path, df) in enumerate(
    matching_files,
    start=1
):

    folder = file_path.parent.name

    user_ids = (
        df["user_id"]
        .astype(str)
        .unique()
        .tolist()
    )

    events = (
        df["event"]
        .astype(str)
        .value_counts()
        .to_dict()
    )

    first_timestamp = df["ts"].min()

    last_timestamp = df["ts"].max()

    duration = (
        last_timestamp - first_timestamp
    ).total_seconds()


    print(
        "\n" + "-" * 70
    )

    print(
        f"File #{index}"
    )

    print(
        f"Folder: {folder}"
    )

    print(
        f"Filename: {file_path.name}"
    )

    print(
        f"Rows: {len(df)}"
    )

    print(
        f"Users: {user_ids}"
    )

    print(
        f"First timestamp: {first_timestamp}"
    )

    print(
        f"Last timestamp:  {last_timestamp}"
    )

    print(
        f"Duration: {duration:.3f} seconds"
    )

    print(
        "Events:"
    )

    for event, count in events.items():

        print(
            f"  {event}: {count}"
        )


    # Track which files contain each user
    for user_id in user_ids:

        user_files[user_id].append(
            folder
        )


    # Store events for duplicate comparison

    for _, row in df.iterrows():

        all_events.append({

            "folder": folder,

            "file": file_path.name,

            "user_id": str(
                row["user_id"]
            ),

            "event": str(
                row["event"]
            ),

            "ts": row["ts"],

            "x": float(
                row["x"]
            ),

            "y": float(
                row["y"]
            ),

            "z": float(
                row["z"]
            ),

        })


# ============================================================
# USER → FOLDER ANALYSIS
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "USER / ENTITY DISTRIBUTION"
)

print(
    "=" * 70
)


for user_id, folders in sorted(
    user_files.items()
):

    print(
        f"\nUser/entity: {user_id}"
    )

    print(
        f"Folders: {sorted(set(folders))}"
    )


# ============================================================
# DUPLICATE EVENT ANALYSIS
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "DUPLICATE EVENT ANALYSIS"
)

print(
    "=" * 70
)


# ------------------------------------------------------------
# Create an event signature.
#
# If two records have the same:
#
# user
# event
# timestamp
# x
# y
# z
#
# they represent the same recorded event.
# ------------------------------------------------------------

event_signatures = defaultdict(list)


for event in all_events:

    signature = (

        event["user_id"],

        event["event"],

        event["ts"],

        event["x"],

        event["y"],

        event["z"],

    )

    event_signatures[
        signature
    ].append(event)


duplicate_groups = {

    signature: entries

    for signature, entries
    in event_signatures.items()

    if len(entries) > 1
}


print(
    f"\nTotal event records: "
    f"{len(all_events)}"
)

print(
    f"Unique event records: "
    f"{len(event_signatures)}"
)

print(
    f"Duplicate event groups: "
    f"{len(duplicate_groups)}"
)


# ============================================================
# SHOW DUPLICATES
# ============================================================

if duplicate_groups:

    print(
        "\nExamples of duplicated events:"
    )

    shown = 0

    for signature, entries in duplicate_groups.items():

        print(
            "\nEvent:"
        )

        print(
            f"  User:      {signature[0]}"
        )

        print(
            f"  Event:     {signature[1]}"
        )

        print(
            f"  Timestamp: {signature[2]}"
        )

        print(
            f"  Position:  "
            f"({signature[3]}, "
            f"{signature[4]}, "
            f"{signature[5]})"
        )

        print(
            "  Found in:"
        )

        for entry in entries:

            print(
                f"    {entry['folder']}/"
                f"{entry['file']}"
            )

        shown += 1

        if shown >= 10:
            break


# ============================================================
# SUMMARY BY FOLDER
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "SUMMARY BY FOLDER"
)

print(
    "=" * 70
)


folder_data = defaultdict(
    lambda: {
        "files": 0,
        "rows": 0,
        "users": set(),
    }
)


for file_path, df in matching_files:

    folder = file_path.parent.name

    folder_data[folder]["files"] += 1

    folder_data[folder]["rows"] += len(df)

    for user_id in (
        df["user_id"]
        .astype(str)
        .unique()
    ):

        folder_data[folder]["users"].add(
            user_id
        )


for folder, data in sorted(
    folder_data.items()
):

    print(
        f"\n{folder}"
    )

    print(
        f"  Files: {data['files']}"
    )

    print(
        f"  Rows:  {data['rows']}"
    )

    print(
        f"  Users: {len(data['users'])}"
    )

    print(
        f"  User IDs: "
        f"{sorted(data['users'])}"
    )


# ============================================================
# FINAL CONCLUSION
# ============================================================

print(
    "\n" + "=" * 70
)

print(
    "INSPECTION COMPLETE"
)

print(
    "=" * 70
)