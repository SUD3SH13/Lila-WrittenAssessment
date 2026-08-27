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
import DatePicker from "./components/DatePicker";
import MatchSelector from "./components/MatchSelector";
import MapViewer from "./components/MapViewer";
import Timeline from "./components/Timeline";


function App() {

  // ==========================================================
  // DATA
  // ==========================================================

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);




  // ==========================================================
  // UI STATE
  // ==========================================================

  const [selectedMap, setSelectedMap] = useState("AmbroseValley");

  const [selectedDate, setSelectedDate] = useState(null);

  const [selectedMatch, setSelectedMatch] = useState(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);


  // ==========================================================
  // LOAD JSON
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

        console.log("Match data loaded:", json);

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
  // GET AVAILABLE DATES FOR SELECTED MAP
  // ==========================================================

  const dates = useMemo(() => {

    if (!data) {
      return [];
    }

    const mapData =
      data.maps[selectedMap];

    if (!mapData || !mapData.dates) {
      return [];
    }

    return Object.keys(mapData.dates);

  }, [data, selectedMap]);


  // ==========================================================
  // AUTOMATICALLY SELECT FIRST DATE
  // ==========================================================

  useEffect(() => {

    if (dates.length === 0) {

      setSelectedDate(null);

      return;
    }

    // If current date doesn't exist
    // for this map, select first date.

    if (!dates.includes(selectedDate)) {

      setSelectedDate(dates[0]);

    }

  }, [dates, selectedDate]);


  // ==========================================================
  // GET MATCH IDS FOR SELECTED MAP + DATE
  // ==========================================================

  const matchIds = useMemo(() => {

    if (!data || !selectedDate) {
      return [];
    }

    const mapData =
      data.maps[selectedMap];

    if (!mapData || !mapData.dates) {
      return [];
    }

    const dateData =
      mapData.dates[selectedDate];

    if (!dateData || !dateData.matches) {
      return [];
    }

    return dateData.matches;

  }, [data, selectedMap, selectedDate]);


  // ==========================================================
  // CONVERT MATCH IDS INTO MATCH OBJECTS
  // ==========================================================

  const filteredMatches = useMemo(() => {

    if (!data) {
      return [];
    }

    return matchIds
      .map((matchId) => {

        return data.matches[matchId];

      })
      .filter(Boolean);

  }, [data, matchIds]);


  // ==========================================================
  // AUTOMATICALLY SELECT FIRST MATCH
  // ==========================================================

  useEffect(() => {

    if (filteredMatches.length === 0) {

      setSelectedMatch(null);

      return;
    }

    // Automatically select first match
    // whenever the date changes.

    setSelectedMatch(
      filteredMatches[0].id
    );

  }, [filteredMatches]);


  // ==========================================================
  // GET SELECTED MATCH OBJECT
  // ==========================================================

  const selectedMatchData = useMemo(() => {

    if (!data || !selectedMatch) {
      return null;
    }

    return data.matches[selectedMatch] || null;

  }, [data, selectedMatch]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <AppShell padding="md">

      <Container fluid>

        <Paper
          p="lg"
          radius="lg"
          withBorder
        >

          <Stack gap="lg">


            {/* =================================================
                MAP TABS
            ================================================= */}

            <MapSelector
              selectedMap={selectedMap}
              onMapChange={setSelectedMap}
            />


            <Divider />


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <Grid gutter="lg">


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


                  {/* =================================================
                      DATE PICKER
                  ================================================= */}

                  <Text
                    size="sm"
                    fw={600}
                  >
                    Dates
                  </Text>

                  <DatePicker
                    dates={dates}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                  />


                  {/* =================================================
                      MATCH LIST
                  ================================================= */}

                  <Text
                    size="sm"
                    fw={600}
                    mt="sm"
                  >
                    Matches
                  </Text>

                  <MatchSelector
                    matches={filteredMatches}
                    selectedMatch={selectedMatch}
                    onMatchChange={setSelectedMatch}
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


                  {/* =================================================
                      MAP
                  ================================================= */}

                  <MapViewer
                    match={selectedMatchData}
                    currentTime={currentTime}
                  />


                  {/* =================================================
                      TIMELINE
                  ================================================= */}

                  <Timeline
                    match={selectedMatchData}
                    currentTime={currentTime}
                    onTimeChange={setCurrentTime}
                    isPlaying={isPlaying}
                    onPlayPause={() => setIsPlaying((prev) => !prev)}
                    playbackSpeed={playbackSpeed}
                    onPlaybackSpeedChange={setPlaybackSpeed}
                  />

                </Stack>

              </Grid.Col>

            </Grid>

          </Stack>

        </Paper>

      </Container>

    </AppShell>

  );
}


export default App;