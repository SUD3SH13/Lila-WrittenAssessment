from pathlib import Path
from collections import defaultdict

import pyarrow.parquet as pq


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path(
    "D:/Projects/Lila-WrittenAssessment/player_data"
)


# ============================================================
# FIND ALL FILES
# ============================================================

files = list(
    DATA_DIR.rglob("*.nakama-0")
)


# ============================================================
# COLLECT MATCH DATA
# ============================================================

matches = defaultdict(list)


for file_path in files:

    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()

    except Exception as error:
        print(f"Could not read: {file_path}")
        print(error)
        continue

    if len(df) == 0:
        continue

    # Match ID from the data
    match_id = str(
        df["match_id"].iloc[0]
    )

    # Date/folder name
    folder_date = file_path.parent.name

    # Timestamps in this file
    first_timestamp = df["ts"].min()
    last_timestamp = df["ts"].max()

    matches[match_id].append({
        "folder": folder_date,
        "file": file_path,
        "first": first_timestamp,
        "last": last_timestamp,
    })


# ============================================================
# FIND MATCHES IN MULTIPLE FOLDERS
# ============================================================

multi_date_matches = {}

for match_id, entries in matches.items():

    dates = set(
        entry["folder"]
        for entry in entries
    )

    if len(dates) > 1:

        multi_date_matches[match_id] = entries


# ============================================================
# OUTPUT
# ============================================================

print("=" * 70)
print("MATCH DATE VALIDATION")
print("=" * 70)

print(
    f"\nMatches found: {len(matches):,}"
)

print(
    f"Matches spanning multiple folders: "
    f"{len(multi_date_matches):,}"
)


# ============================================================
# PRINT DETAILS
# ============================================================

for match_id, entries in multi_date_matches.items():

    print("\n" + "-" * 70)

    print("Match:")
    print(match_id)

    # Group entries by folder
    by_folder = defaultdict(list)

    for entry in entries:

        by_folder[
            entry["folder"]
        ].append(entry)


    for folder, folder_entries in sorted(
        by_folder.items()
    ):

        first_timestamp = min(
            entry["first"]
            for entry in folder_entries
        )

        last_timestamp = max(
            entry["last"]
            for entry in folder_entries
        )

        duration = (
            last_timestamp - first_timestamp
        ).total_seconds()


        print(
            f"\nFolder: {folder}"
        )

        print(
            f"  Files: {len(folder_entries)}"
        )

        print(
            f"  First timestamp: {first_timestamp}"
        )

        print(
            f"  Last timestamp:  {last_timestamp}"
        )

        print(
            f"  Duration:         {duration:.3f} seconds"
        )


    # --------------------------------------------------------
    # Overall match range
    # --------------------------------------------------------

    all_first = min(
        entry["first"]
        for entry in entries
    )

    all_last = max(
        entry["last"]
        for entry in entries
    )

    overall_duration = (
        all_last - all_first
    ).total_seconds()


    print(
        "\nOverall:"
    )

    print(
        f"  First timestamp: {all_first}"
    )

    print(
        f"  Last timestamp:  {all_last}"
    )

    print(
        f"  Duration:        {overall_duration:.3f} seconds"
    )


print(
    "\n" + "=" * 70
)

print(
    "VALIDATION COMPLETE"
)

print(
    "=" * 70
)