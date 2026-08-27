import { useEffect, useMemo, useState } from "react";

import {
    Group,
    Button,
    Slider,
    Text,
    Select,
    Image,
} from "@mantine/core";

import playIcon from "../assets/timeline/play-icon.png";
import pauseIcon from "../assets/timeline/pause-icon.png";
import playbackSpeedIcon from "../assets/timeline/timer-icon.png";


function Timeline({
    match,
    currentTime,
    onTimeChange,
    playbackSpeed = 1,
    onPlaybackSpeedChange,
}) {

    const [isPlaying, setIsPlaying] = useState(false);


    // ==========================================================
    // MATCH DURATION
    // ==========================================================

    const duration =
        match?.duration ?? 0;


    // ==========================================================
    // GET EVENTS
    // ==========================================================

    const events = useMemo(() => {

        if (!match || !match.players) {
            return [];
        }


        const supportedEvents = [
            "Loot",
            "Kill",
            "BotKill",
            "Killed",
            "BotKilled",
            "KilledByStorm",
        ];


        const allEvents = [];


        match.players.forEach((player) => {

            (player.events || []).forEach((event) => {

                if (
                    !supportedEvents.includes(event.event)
                ) {
                    return;
                }


                if (
                    typeof event.t !== "number"
                ) {
                    return;
                }


                allEvents.push({
                    ...event,
                    playerId: player.id,
                    playerType: player.type,
                });

            });

        });


        return allEvents.sort(
            (a, b) => a.t - b.t
        );

    }, [match]);


    // ==========================================================
    // EVENT TYPE → COLOR
    // ==========================================================

    const getEventColor = (eventType) => {

        switch (eventType) {

            case "Loot":
                return "yellow";

            case "Kill":
            case "BotKill":
                return "red";

            case "Killed":
            case "BotKilled":
                return "orange";

            case "KilledByStorm":
                return "grape";

            default:
                return "white";

        }

    };


    // ==========================================================
    // EVENT TYPE → LABEL
    // ==========================================================

    const getEventLabel = (eventType) => {

        switch (eventType) {

            case "Loot":
                return "Loot";

            case "Kill":
            case "BotKill":
                return "Kill";

            case "Killed":
            case "BotKilled":
                return "Death";

            case "KilledByStorm":
                return "Storm";

            default:
                return eventType;

        }

    };


    // ==========================================================
    // RESET PLAYBACK WHEN MATCH CHANGES
    // ==========================================================

    useEffect(() => {

        setIsPlaying(false);

        onTimeChange(0);

    }, [match, onTimeChange]);


    // ==========================================================
    // PLAYBACK
    // ==========================================================

    useEffect(() => {

        if (!isPlaying || duration <= 0) {
            return;
        }


        const interval = setInterval(() => {

            /*
             * Original playback step is 0.05 seconds.
             *
             * Multiply it by playbackSpeed:
             *
             * 0.25x → 0.0125s
             * 0.5x  → 0.025s
             * 1x    → 0.05s
             * 2x    → 0.10s
             */

            const nextTime =
                currentTime +
                (0.05 * playbackSpeed);


            if (nextTime >= duration) {

                onTimeChange(duration);

                setIsPlaying(false);

                return;

            }


            onTimeChange(nextTime);

        }, 50);


        return () => {
            clearInterval(interval);
        };

    }, [
        isPlaying,
        currentTime,
        duration,
        playbackSpeed,
        onTimeChange,
    ]);


    // ==========================================================
    // NO MATCH
    // ==========================================================

    if (!match) {

        return (
            <Group
                gap="md"
                align="center"
                wrap="nowrap"
            >

                <Button
                    variant="transparent"
                    size="sm"
                    disabled
                >
                    <Image
                        src={playIcon}
                        alt={"Play"}
                        w={20}
                        h={20}
                    />
                </Button>

                <Text
                    size="sm"
                    c="dimmed"
                >
                    0.00s
                </Text>

            </Group>
        );

    }


    // ==========================================================
    // TOGGLE PLAY / PAUSE
    // ==========================================================

    const togglePlayback = () => {

        if (duration <= 0) {
            return;
        }


        if (currentTime >= duration) {

            onTimeChange(0);

            setIsPlaying(true);

            return;

        }


        setIsPlaying(
            (playing) => !playing
        );

    };


    // ==========================================================
    // RENDER
    // ==========================================================

    return (

        <div>

            <Group
                gap="md"
                align="center"
                wrap="nowrap"
            >

                {/* ==================================================
            PLAY / PAUSE
        ================================================== */}

                <Button
                    variant="transparent"
                    size="sm"
                    onClick={togglePlayback}
                    p={5}
                >
                    <Image
                        src={isPlaying ? pauseIcon : playIcon}
                        alt={isPlaying ? "Pause" : "Play"}
                        w={20}
                        h={20}
                    />
                </Button>


                {/* ==================================================
            CURRENT TIME
        ================================================== */}

                <Text
                    size="sm"
                    c="dimmed"
                    w={70}
                >
                    {currentTime.toFixed(2)}s
                </Text>


                {/* ==================================================
            SLIDER + EVENT MARKERS
        ================================================== */}

                <div
                    style={{
                        position: "relative",
                        flex: 1,
                    }}
                >

                    <Slider
                        min={0}
                        max={duration || 1}
                        step={0.01}
                        value={currentTime}
                        onChange={onTimeChange}
                        disabled={duration <= 0}
                    />


                    {/* ==================================================
              EVENT MARKERS
          ================================================== */}

                    {events.map((event, index) => {

                        if (duration <= 0) {
                            return null;
                        }


                        const left =
                            `${Math.min(
                                (event.t / duration) * 100,
                                100
                            )}%`;


                        return (
                            <div
                                key={
                                    `${event.playerId}-${event.t}-${event.event}-${index}`
                                }
                                title={
                                    `${getEventLabel(event.event)} — ${event.t.toFixed(2)}s`
                                }
                                onClick={() => {

                                    onTimeChange(event.t);

                                }}
                                style={{
                                    position: "absolute",

                                    left,

                                    top: "50%",

                                    width: 9,
                                    height: 9,

                                    borderRadius: "50%",

                                    backgroundColor:
                                        getEventColor(
                                            event.event
                                        ),

                                    border:
                                        "1px solid white",

                                    transform:
                                        "translate(-50%, -50%)",

                                    cursor: "pointer",

                                    zIndex: 5,

                                    pointerEvents: "auto",
                                }}
                            />
                        );

                    })}

                </div>


                {/* ==================================================
            TOTAL TIME
        ================================================== */}

                <Text
                    size="sm"
                    c="dimmed"
                    w={70}
                    ta="right"
                >
                    {duration.toFixed(2)}s
                </Text>


                {/* ==================================================
            PLAYBACK SPEED
        ================================================== */}

                <Select
                    value={String(playbackSpeed)}
                    leftSection={<Image src={playbackSpeedIcon} w={20} h={20} />}
                    onChange={(value) => {

                        if (!value) {
                            return;
                        }


                        onPlaybackSpeedChange(
                            Number(value)
                        );

                    }}
                    data={[
                        {
                            value: "0.25",
                            label: "0.25×",
                        },
                        {
                            value: "0.5",
                            label: "0.5×",
                        },
                        {
                            value: "1",
                            label: "1×",
                        },
                        {
                            value: "2",
                            label: "2×",
                        },
                    ]}
                    allowDeselect={false}
                    size="sm"
                    w= {110}
                />

            </Group>


            {/* ====================================================
          EVENT LEGEND
      ==================================================== */}

            {events.length > 0 && (

                <Group
                    gap="md"
                    justify="center"
                    mt="xs"
                >

                    <Text
                        size="xs"
                        c="dimmed"
                    >
                        {events.length} events
                    </Text>


                    <Text
                        size="xs"
                        c="yellow"
                    >
                        ● Loot
                    </Text>


                    <Text
                        size="xs"
                        c="red"
                    >
                        ● Kill
                    </Text>


                    <Text
                        size="xs"
                        c="orange"
                    >
                        ● Death
                    </Text>


                    <Text
                        size="xs"
                        c="grape"
                    >
                        ● Storm
                    </Text>

                </Group>

            )}

        </div>

    );
}


export default Timeline;