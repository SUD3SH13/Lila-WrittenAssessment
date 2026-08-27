from pathlib import Path
from collections import Counter, defaultdict
import pyarrow.parquet as pq


# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path(
    "D:/Projects/Lila-WrittenAssessment/player_data"
)


# ============================================================
# HELPERS
# ============================================================

def decode_event(value):
    """Convert event bytes into a normal string."""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


def is_bot(user_id):
    """
    According to the assessment README:
    - UUID-style IDs = humans
    - Numeric IDs = bots
    """
    return str(user_id).isdigit()


# ============================================================
# FIND ALL FILES
# ============================================================

files = list(DATA_DIR.rglob("*.nakama-0"))

print("=" * 70)
print("LILA DATASET PROFILE")
print("=" * 70)

print(f"\nData directory:")
print(DATA_DIR)

print(f"\nTotal .nakama-0 files: {len(files)}")

if not files:
    print("\nERROR: No .nakama-0 files found.")
    exit()


# ============================================================
# DATA COLLECTION
# ============================================================

unique_matches = set()
unique_players = set()
unique_humans = set()
unique_bots = set()
unique_maps = set()

event_counts = Counter()

map_counts = Counter()

match_player_counts = defaultdict(set)
match_event_counts = defaultdict(Counter)
match_maps = defaultdict(set)

files_per_match = Counter()

total_rows = 0


# ============================================================
# PROCESS EVERY FILE
# ============================================================

print("\nScanning dataset...")

for index, file_path in enumerate(files, start=1):

    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()

    except Exception as e:
        print(f"\nERROR reading:")
        print(file_path)
        print(e)
        continue

    # Decode event column
    df["event"] = df["event"].apply(decode_event)

    total_rows += len(df)

    # --------------------------------------------------------
    # Process rows
    # --------------------------------------------------------

    for _, row in df.iterrows():

        user_id = str(row["user_id"])
        match_id = str(row["match_id"])
        map_id = str(row["map_id"])
        event = str(row["event"])

        # Unique values
        unique_players.add(user_id)
        unique_matches.add(match_id)
        unique_maps.add(map_id)

        # Human / bot
        if is_bot(user_id):
            unique_bots.add(user_id)
        else:
            unique_humans.add(user_id)

        # Event count
        event_counts[event] += 1

        # Map count
        map_counts[map_id] += 1

        # Match information
        match_player_counts[match_id].add(user_id)
        match_event_counts[match_id][event] += 1
        match_maps[match_id].add(map_id)

    # --------------------------------------------------------
    # File → match relationship
    # --------------------------------------------------------

    # A file should belong to one match
    if len(df) > 0:
        match_id = str(df["match_id"].iloc[0])
        files_per_match[match_id] += 1

    # Progress
    if index % 100 == 0 or index == len(files):
        print(f"Processed {index}/{len(files)} files")


# ============================================================
# BASIC DATASET STATISTICS
# ============================================================

print("\n" + "=" * 70)
print("DATASET OVERVIEW")
print("=" * 70)

print(f"\nFiles:")
print(f"  {len(files):,}")

print(f"\nRows:")
print(f"  {total_rows:,}")

print(f"\nUnique matches:")
print(f"  {len(unique_matches):,}")

print(f"\nUnique players/bots:")
print(f"  {len(unique_players):,}")

print(f"  Humans: {len(unique_humans):,}")
print(f"  Bots:   {len(unique_bots):,}")

print(f"\nMaps:")
for map_id in sorted(unique_maps):
    print(f"  {map_id}")


# ============================================================
# MAP STATISTICS
# ============================================================

print("\n" + "=" * 70)
print("EVENTS BY MAP")
print("=" * 70)

for map_id, count in map_counts.most_common():
    print(f"{map_id:20} {count:,}")


# ============================================================
# EVENT STATISTICS
# ============================================================

print("\n" + "=" * 70)
print("EVENT COUNTS")
print("=" * 70)

for event, count in event_counts.most_common():
    print(f"{event:20} {count:,}")


# ============================================================
# MATCH STATISTICS
# ============================================================

print("\n" + "=" * 70)
print("MATCH STATISTICS")
print("=" * 70)

match_sizes = [
    len(players)
    for players in match_player_counts.values()
]

if match_sizes:

    print(
        f"\nPlayers/entities per match:"
    )

    print(
        f"  Minimum: {min(match_sizes)}"
    )

    print(
        f"  Maximum: {max(match_sizes)}"
    )

    print(
        f"  Average: {sum(match_sizes) / len(match_sizes):.2f}"
    )


# ============================================================
# FILES PER MATCH
# ============================================================

file_counts = list(files_per_match.values())

if file_counts:

    print(
        f"\nFiles per match:"
    )

    print(
        f"  Minimum: {min(file_counts)}"
    )

    print(
        f"  Maximum: {max(file_counts)}"
    )

    print(
        f"  Average: {sum(file_counts) / len(file_counts):.2f}"
    )


# ============================================================
# MATCHES BY MAP
# ============================================================

matches_by_map = Counter()

for match_id, maps in match_maps.items():

    for map_id in maps:
        matches_by_map[map_id] += 1


print("\n" + "=" * 70)
print("MATCHES BY MAP")
print("=" * 70)

for map_id, count in matches_by_map.most_common():
    print(f"{map_id:20} {count:,}")


# ============================================================
# PLAYER TYPE
# ============================================================

print("\n" + "=" * 70)
print("PLAYER TYPES")
print("=" * 70)

print(f"\nHumans:")
print(f"  {len(unique_humans):,}")

print(f"\nBots:")
print(f"  {len(unique_bots):,}")


# ============================================================
# SAMPLE MATCHES
# ============================================================

print("\n" + "=" * 70)
print("SAMPLE MATCHES")
print("=" * 70)

sample_matches = list(unique_matches)[:10]

for match_id in sample_matches:

    players = match_player_counts[match_id]
    events = match_event_counts[match_id]
    maps = match_maps[match_id]

    print("\nMatch:")
    print(f"  {match_id}")

    print(f"  Map: {', '.join(maps)}")

    print(f"  Players/entities: {len(players)}")

    print("  Events:")

    for event, count in events.most_common():
        print(f"    {event}: {count}")


# ============================================================
# VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("VALIDATION")
print("=" * 70)

# Check whether a file contains multiple matches
multi_match_files = 0

# Check whether a file contains multiple users
multi_user_files = 0

for file_path in files:

    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()

    except Exception:
        continue

    matches = df["match_id"].astype(str).unique()
    users = df["user_id"].astype(str).unique()

    if len(matches) > 1:
        multi_match_files += 1

    if len(users) > 1:
        multi_user_files += 1


print(
    f"\nFiles containing multiple match IDs: "
    f"{multi_match_files}"
)

print(
    f"Files containing multiple user IDs: "
    f"{multi_user_files}"
)


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 70)
print("PROFILE COMPLETE")
print("=" * 70)