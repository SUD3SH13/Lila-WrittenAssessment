import { useEffect, useMemo, useState } from "react";

import {
  AppShell,
  Container,
  Paper,
  Stack,
  Grid,
  Text,
  Divider,
  Loader,
  Center,
} from "@mantine/core";

import MapSelector from "./components/MapSelector";
import ToolSelector from "./components/ToolSelector";

import DatePicker from "./components/DatePicker";
import MatchSelector from "./components/MatchSelector";

import MapViewer from "./components/MapViewer";
import HeatmapViewer from "./components/HeatmapViewer";

import Timeline from "./components/Timeline";


// ==========================================================
// APP
// ==========================================================

function App() {

  // ==========================================================
  // MATCH DATA
  // ==========================================================

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);


  // ==========================================================
  // HEATMAP DATA
  // ==========================================================

  const [heatmapData, setHeatmapData] = useState(null);

  const [heatmapLoading, setHeatmapLoading] = useState(true);


  // ==========================================================
  // MAP STATE
  // ==========================================================

  const [selectedMap, setSelectedMap] =
    useState("AmbroseValley");


  // ==========================================================
  // TOOL STATE
  //
  // "replay"  -> Match Replay
  // "heatmap" -> Heatmaps
  // ==========================================================

  const [selectedTool, setSelectedTool] =
    useState("replay");


  // ==========================================================
  // REPLAY STATE
  // ==========================================================

  const [selectedDate, setSelectedDate] =
    useState(null);

  const [selectedMatch, setSelectedMatch] =
    useState(null);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [playbackSpeed, setPlaybackSpeed] =
    useState(1);


  // ==========================================================
  // HEATMAP STATE
  // ==========================================================

  const [selectedHeatmap, setSelectedHeatmap] =
    useState("traffic");


  // ==========================================================
  // LOAD MATCH JSON
  // ==========================================================

  useEffect(() => {

    fetch("/data/matches.json")

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            "Failed to load matches.json"
          );
        }

        return response.json();

      })

      .then((json) => {

        console.log(
          "Match data loaded:",
          json
        );

        setData(json);

        setLoading(false);

      })

      .catch((error) => {

        console.error(
          "Error loading match data:",
          error
        );

        setLoading(false);

      });

  }, []);


  // ==========================================================
  // LOAD HEATMAP JSON
  // ==========================================================

  useEffect(() => {

    fetch("/data/heatmaps.json")

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            "Failed to load heatmaps.json"
          );
        }

        return response.json();

      })

      .then((json) => {

        console.log(
          "Heatmap data loaded:",
          json
        );

        setHeatmapData(json);

        setHeatmapLoading(false);

      })

      .catch((error) => {

        console.error(
          "Error loading heatmap data:",
          error
        );

        setHeatmapLoading(false);

      });

  }, []);


  // ==========================================================
  // GET AVAILABLE DATES
  //
  // Only needed for Match Replay.
  // ==========================================================

  const dates = useMemo(() => {

    if (!data) {
      return [];
    }


    const mapData =
      data.maps?.[selectedMap];


    if (
      !mapData ||
      !mapData.dates
    ) {
      return [];
    }


    return Object.keys(
      mapData.dates
    );

  }, [
    data,
    selectedMap,
  ]);


  // ==========================================================
  // AUTOMATICALLY SELECT FIRST DATE
  // ==========================================================

  useEffect(() => {

    if (dates.length === 0) {

      setSelectedDate(null);

      return;
    }


    /*
     * If the currently selected date
     * doesn't exist on the new map,
     * use the first available date.
     */

    if (
      !dates.includes(selectedDate)
    ) {

      setSelectedDate(
        dates[0]
      );

    }

  }, [
    dates,
    selectedDate,
  ]);


  // ==========================================================
  // GET MATCH IDS
  //
  // Selected map + selected date
  // ==========================================================

  const matchIds = useMemo(() => {

    if (
      !data ||
      !selectedDate
    ) {
      return [];
    }


    const mapData =
      data.maps?.[selectedMap];


    if (
      !mapData ||
      !mapData.dates
    ) {
      return [];
    }


    const dateData =
      mapData.dates?.[selectedDate];


    if (
      !dateData ||
      !Array.isArray(dateData.matches)
    ) {
      return [];
    }


    return dateData.matches;

  }, [
    data,
    selectedMap,
    selectedDate,
  ]);


  // ==========================================================
  // CONVERT MATCH IDS TO MATCH OBJECTS
  // ==========================================================

  const filteredMatches = useMemo(() => {

    if (
      !data ||
      !data.matches
    ) {
      return [];
    }


    return matchIds

      .map((matchId) => {

        return data.matches[matchId];

      })

      .filter(Boolean);

  }, [
    data,
    matchIds,
  ]);


  // ==========================================================
  // AUTOMATICALLY SELECT FIRST MATCH
  //
  // When:
  // - Map changes
  // - Date changes
  //
  // select the first match automatically.
  // ==========================================================

  useEffect(() => {

    if (
      filteredMatches.length === 0
    ) {

      setSelectedMatch(null);

      return;
    }


    /*
     * Don't unnecessarily reset the
     * match if it is still available.
     */

    const matchStillExists =
      filteredMatches.some(
        (match) =>
          match.id === selectedMatch
      );


    if (!matchStillExists) {

      setSelectedMatch(
        filteredMatches[0].id
      );

    }

  }, [
    filteredMatches,
    selectedMatch,
  ]);


  // ==========================================================
  // GET SELECTED MATCH OBJECT
  // ==========================================================

  const selectedMatchData = useMemo(() => {

    if (
      !data ||
      !selectedMatch
    ) {
      return null;
    }


    return (
      data.matches?.[selectedMatch] ||
      null
    );

  }, [
    data,
    selectedMatch,
  ]);


  // ==========================================================
  // GET HEATMAP DATA FOR SELECTED MAP
  //
  // Example:
  //
  // heatmaps.json
  //
  // {
  //   "AmbroseValley": {
  //      "grid_size": 64,
  //      "traffic": [...]
  //   }
  // }
  // ==========================================================

  const selectedMapHeatmap = useMemo(() => {

    if (
      !heatmapData ||
      !selectedMap
    ) {
      return null;
    }


    return (
      heatmapData[selectedMap] ||
      null
    );

  }, [
    heatmapData,
    selectedMap,
  ]);


  // ==========================================================
  // RESET REPLAY WHEN MAP CHANGES
  // ==========================================================

  useEffect(() => {

    setCurrentTime(0);

    setIsPlaying(false);

  }, [
    selectedMap,
  ]);


  // ==========================================================
  // STOP REPLAY WHEN SWITCHING TO HEATMAP
  // ==========================================================

  useEffect(() => {

    if (
      selectedTool === "heatmap"
    ) {

      setIsPlaying(false);

    }

  }, [
    selectedTool,
  ]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading ||
    heatmapLoading
  ) {

    return (
      <Center h="100vh">

        <Stack
          align="center"
          gap="sm"
        >

          <Loader />

          <Text
            size="sm"
            c="dimmed"
          >
            Loading data...
          </Text>

        </Stack>

      </Center>
    );

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <AppShell padding="md">

      <Container
        fluid
        p="sm"
      >

        <Paper
          p="lg"
          radius="lg"
          withBorder
        >

          <Stack gap="lg">


            {/* ==================================================
                MAP SELECTOR
            ================================================== */}

            <MapSelector
              selectedMap={
                selectedMap
              }

              onMapChange={
                setSelectedMap
              }
            />


            <Divider />


            {/* ==================================================
                TOOL SELECTOR
            ==================================================
            
            Tabs:

            Match Replay
            Heatmaps

            ================================================== */}
            <Container align="center" p={0}>
                          <ToolSelector
              selectedTool={
                selectedTool
              }

              onToolChange={
                setSelectedTool
              }
            />

            </Container>

            {/* ==================================================
                MATCH REPLAY
            ================================================== */}

            {selectedTool === "replay" && (

              <Grid
                gutter="lg"
              >


                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <Grid.Col
                  span={{
                    base: 12,
                    md: 3,
                  }}
                >

                  <Stack gap="md">


                    {/* =============================================
                        DATE PICKER
                    ============================================= */}

                    <Text
                      size="sm"
                      fw={600}
                    >
                      Dates
                    </Text>


                    <DatePicker
                      dates={dates}
                      selectedDate={
                        selectedDate
                      }
                      onDateChange={
                        setSelectedDate
                      }
                    />


                    {/* =============================================
                        MATCH LIST
                    ============================================= */}

                    <Text
                      size="sm"
                      fw={600}
                      mt="sm"
                    >
                      Matches
                    </Text>


                    <MatchSelector
                      matches={
                        filteredMatches
                      }

                      selectedMatch={
                        selectedMatch
                      }

                      onMatchChange={
                        setSelectedMatch
                      }
                    />

                  </Stack>

                </Grid.Col>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <Grid.Col
                  span={{
                    base: 12,
                    md: 9,
                  }}
                >

                  <Stack gap="md">


                    {/* =============================================
                        MATCH MAP
                    ============================================= */}

                    <MapViewer
                      match={
                        selectedMatchData
                      }

                      currentTime={
                        currentTime
                      }
                    />


                    {/* =============================================
                        TIMELINE
                    ============================================= */}

                    <Timeline
                      match={
                        selectedMatchData
                      }

                      currentTime={
                        currentTime
                      }

                      onTimeChange={
                        setCurrentTime
                      }

                      isPlaying={
                        isPlaying
                      }

                      onPlayPause={() =>
                        setIsPlaying(
                          (previous) =>
                            !previous
                        )
                      }

                      playbackSpeed={
                        playbackSpeed
                      }

                      onPlaybackSpeedChange={
                        setPlaybackSpeed
                      }

                    />

                  </Stack>

                </Grid.Col>

              </Grid>

            )}


            {/* ==================================================
                HEATMAPS
            ================================================== */}

            {selectedTool === "heatmap" && (

              <Stack gap="md">


                {/* ===============================================
                    HEATMAP VIEWER
                =============================================== */}

                <HeatmapViewer
                  map={
                    selectedMap
                  }

                  heatmapData={
                    selectedMapHeatmap
                  }

                  selectedHeatmap={
                    selectedHeatmap
                  }

                  onHeatmapChange={
                    setSelectedHeatmap
                  }

                />

              </Stack>

            )}

          </Stack>

        </Paper>

      </Container>

    </AppShell>

  );

}


export default App;