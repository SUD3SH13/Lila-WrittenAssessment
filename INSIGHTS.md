# Insights


## 1. Player activity and loot are strongly concentrated in a small portion of the map

The movement heatmap shows that player traffic is not distributed evenly
across the maps. A relatively small set of grid cells accounts for a
large share of player movement, and these same high-traffic areas also
attract a substantial amount of looting.

### Supporting evidence

Using the 64×64 heatmap grid and ranking cells by recorded `Position` +
`BotPosition` events:

-   On **Ambrose Valley**, the top 10% of traffic cells contain approximately **73% of all recorded loot events**.
-   Those same cells also contain approximately **54% of recorded combat events**.
-   The strongest individual Ambrose Valley traffic cells contain hundreds of movement samples; for example, one cell contains 
    **484 human position samples**, while another contains **385**.
-   The strongest loot cell contains **346 loot events**.

This suggests that the hottest areas are not simply movement corridors:
they also function as important loot and encounter areas.

### Actionable takeaway

A level designer could use these areas as intentional high-value POIs and then tune how strongly they attract players.

Possible actions:

-   If these areas are intended to be the main points of interest, reinforce them with meaningful loot, cover, and multiple approaches.
-   If player concentration is causing repetitive openings, redistribute some high-value loot into lower-traffic areas.
-   Add alternative routes between major POIs to reduce pathing bottlenecks.

### Metrics affected

-   Player traffic concentration
-   Loot pickup distribution
-   Combat encounter density
-   Time spent in major POIs
-   Route diversity

### Why a level designer should care

Player concentration directly shapes the rhythm of a match. A few
dominant locations can create reliable hotspots and predictable routes.
That can be good for creating memorable combat spaces, but excessive
concentration can make the rest of the map feel irrelevant.

------------------------------------------------------------------------

## 2. High-traffic areas don't necessarily equal high-kill areas

Some areas can have high player traffic but relatively few kills, while other areas can have fewer players but disproportionately more kills.

### Supporting evidence:
Comparing  the traffic heatmap against the kills heatmap for the same map/grid cells:
- In Ambrose Valley, the highest-traffic cell (25, 50) has 505 traffic events but only 9 kills.
- Another high-traffic cell (22, 55) has 397 traffic events but only 3 kills.
- In contrast, cell (26, 30) has 327 traffic events, 13 kills and 16 deaths, making it a much stronger combat hotspot.

### Actionable takeaway:

- High traffic + low kills → potentially safe traversal routes.
- Low traffic + high kills → dangerous ambush/combat zones.
- High traffic + high kills → major combat hotspots.

### Metrics affected:

- Kills per active player
- encounter density 
- route usage
- survival rate

### Why a level designer should care:

It separates where players go from where combat actually happens, which is much more useful than looking at a single heatmap.

------------------------------------------------------------------------

## 3. Storm deaths are a larger factor on Grand Rift and Lockdown

### What caught my eye

Storm deaths are relatively uncommon overall, but their contribution to
recorded human deaths differs noticeably by map.

### Supporting evidence

The proportion of recorded human deaths attributed to `KilledByStorm`
is:

  Map                Storm deaths   Recorded human deaths   Storm share
  ---------------- -------------- ----------------------- -------------
  Ambrose Valley               17                     505      **3.4%**
  Grand Rift                    5                      52      **9.6%**
  Lockdown                     17                     185      **9.2%**

Grand Rift and Lockdown therefore show roughly **three times the storm-death share** seen on Ambrose Valley.

The README also describes the storm as a **one-directional shrinking play zone**, meaning storm deaths can reflect the interaction between
the storm's movement and the map's traversal/extraction layout.

### Actionable takeaway

The higher storm-death share on Grand Rift and Lockdown is worth
investigating rather than automatically treating it as a problem.

Possible actions:

-   Review whether storm progression creates difficult rotations on these maps.
-   Check whether safe routes and exits are clearly readable.
-   Examine whether choke points force players into long rotations.
-   If storm deaths are undesirable, add additional traversal options or adjust the timing/placement of safe routes.
-   If storm pressure is intentional, preserve these areas as high-tension rotation spaces.

### Metrics affected

-   Storm death rate
-   Successful extraction rate
-   Rotation time
-   Distance travelled during late-game movement
-   Player survival rate

### Why a level designer should care

The storm is a pacing tool. A higher storm-death rate can indicate thata map creates stronger rotation pressure, but it can also reveal
inaccessible or poorly connected areas. Comparing this metric betweenmaps gives a designer a way to identify where the storm is shaping
gameplay differently.


