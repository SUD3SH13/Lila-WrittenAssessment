import { useMemo, useState } from "react";

import {
    Paper,
    Center,
    Text,
    Image,
    Group,
    Stack,
    ActionIcon,
    Tooltip,
} from "@mantine/core";

import ambroseValleyMap from "../assets/minimaps/AmbroseValley_minimap.png";
import grandRiftMap from "../assets/minimaps/GrandRift_minimap.png";
import lockdownMap from "../assets/minimaps/Lockdown_minimap.jpg";


// ==========================================================
// EVENT ICONS
// ==========================================================

import lootIcon from "../assets/events/event-loot.png";
import killIcon from "../assets/events/event-kill-1.png";
import deathIcon from "../assets/events/event-death.png";
import stormIcon from "../assets/events/event-storm.png";


// ==========================================================
// MAP IMAGES
// ==========================================================

const MAP_IMAGES = {
    AmbroseValley: ambroseValleyMap,
    GrandRift: grandRiftMap,
    Lockdown: lockdownMap,
};


// ==========================================================
// PLAYER COLORS
// ==========================================================

const PLAYER_COLORS = {
    human: "white",
    bot: "blue",
};


// ==========================================================
// EVENT COLORS
// ==========================================================

const EVENT_COLORS = {
    Loot: "yellow",
    Kill: "red",
    BotKill: "red",
    Killed: "orange",
    BotKilled: "orange",
    KilledByStorm: "grape",
};


// ==========================================================
// EVENT ICON MAPPING
// ==========================================================

const EVENT_ICONS = {
    Loot: lootIcon,

    Kill: killIcon,
    BotKill: killIcon,

    Killed: deathIcon,
    BotKilled: deathIcon,

    KilledByStorm: stormIcon,
};


const EVENT_TYPES = Object.keys(EVENT_ICONS);


// ==========================================================
// INTERPOLATE BETWEEN TWO POSITIONS
// ==========================================================

function interpolatePosition(
    previous,
    next,
    currentTime
) {

    if (!previous) {
        return next;
    }


    if (!next) {
        return previous;
    }


    if (next.t === previous.t) {
        return previous;
    }


    const progress =
        (currentTime - previous.t) /
        (next.t - previous.t);


    const clampedProgress =
        Math.max(
            0,
            Math.min(1, progress)
        );


    return {
        ...previous,

        px:
            previous.px +
            (next.px - previous.px) *
            clampedProgress,

        py:
            previous.py +
            (next.py - previous.py) *
            clampedProgress,

        x:
            typeof previous.x === "number" &&
            typeof next.x === "number"
                ? previous.x +
                  (next.x - previous.x) *
                  clampedProgress
                : previous.x,

        y:
            typeof previous.y === "number" &&
            typeof next.y === "number"
                ? previous.y +
                  (next.y - previous.y) *
                  clampedProgress
                : previous.y,

        z:
            typeof previous.z === "number" &&
            typeof next.z === "number"
                ? previous.z +
                  (next.z - previous.z) *
                  clampedProgress
                : previous.z,
    };
}


// ==========================================================
// FIND CURRENT PLAYER POSITION
// ==========================================================

function getCurrentPosition(
    positions,
    currentTime
) {

    if (
        !positions ||
        positions.length === 0
    ) {
        return null;
    }


    if (
        currentTime <
        positions[0].t
    ) {
        return null;
    }


    if (
        currentTime >=
        positions[positions.length - 1].t
    ) {

        return positions[
            positions.length - 1
        ];

    }


    for (
        let i = 0;
        i < positions.length - 1;
        i++
    ) {

        const previous =
            positions[i];

        const next =
            positions[i + 1];


        if (
            currentTime >= previous.t &&
            currentTime <= next.t
        ) {

            return interpolatePosition(
                previous,
                next,
                currentTime
            );

        }

    }


    return positions[
        positions.length - 1
    ];
}


// ==========================================================
// COMPONENT
// ==========================================================

function MapViewer({
    match,
    currentTime = 0,
}) {

    // ==========================================================
    // ZOOM STATE
    // ==========================================================

    const [zoom, setZoom] =
        useState(1);


    // ==========================================================
    // PAN STATE
    // ==========================================================

    const [pan, setPan] =
        useState({
            x: 0,
            y: 0,
        });


    const [isDragging, setIsDragging] =
        useState(false);


    const [dragStart, setDragStart] =
        useState({
            x: 0,
            y: 0,
        });


    // ==========================================================
    // MAP DIMENSIONS
    // ==========================================================

    const mapWidth = 1024;
    const mapHeight = 1024;


    // ==========================================================
    // GET MAP IMAGE
    // ==========================================================

    const mapImage = useMemo(() => {

        if (!match) {
            return null;
        }

        return MAP_IMAGES[match.map] || null;

    }, [match]);


    // ==========================================================
    // GET PLAYER POSITION DATA
    // ==========================================================

    const players = useMemo(() => {

        if (
            !match ||
            !match.players
        ) {
            return [];
        }


        return match.players
            .map((player) => {

                /*
                 * Humans use "Position".
                 * Bots use "BotPosition".
                 */

                const positionEvent =
                    player.type === "bot"
                        ? "BotPosition"
                        : "Position";


                const allPositions =
                    (player.events || [])
                        .filter(
                            (event) =>
                                event.event ===
                                positionEvent
                        )
                        .filter(
                            (event) =>
                                typeof event.px === "number" &&
                                typeof event.py === "number"
                        )
                        .filter(
                            (event) =>
                                typeof event.t === "number"
                        )
                        .sort(
                            (a, b) =>
                                a.t - b.t
                        );


                if (
                    allPositions.length === 0
                ) {
                    return null;
                }


                /*
                 * Only draw the path up to
                 * the current playback time.
                 */

                const visiblePositions =
                    allPositions.filter(
                        (position) =>
                            position.t <=
                            currentTime
                    );


                /*
                 * Interpolate the marker
                 * between position samples.
                 */

                const currentPosition =
                    getCurrentPosition(
                        allPositions,
                        currentTime
                    );


                if (!currentPosition) {
                    return null;
                }


                return {
                    ...player,

                    positions:
                        visiblePositions,

                    currentPosition,
                };

            })
            .filter(Boolean);

    }, [
        match,
        currentTime,
    ]);


    // ==========================================================
    // GET EVENT MARKERS
    // ==========================================================

    const eventMarkers = useMemo(() => {

        if (
            !match ||
            !match.players
        ) {
            return [];
        }


        const markers = [];


        match.players.forEach(
            (player) => {

                (player.events || [])
                    .forEach((event) => {

                        if (
                            !EVENT_TYPES.includes(
                                event.event
                            )
                        ) {
                            return;
                        }


                        if (
                            typeof event.px !== "number" ||
                            typeof event.py !== "number"
                        ) {
                            return;
                        }


                        if (
                            typeof event.t !== "number"
                        ) {
                            return;
                        }


                        if (
                            event.t > currentTime
                        ) {
                            return;
                        }


                        markers.push({
                            ...event,

                            playerId:
                                player.id,

                            playerType:
                                player.type,

                            icon:
                                EVENT_ICONS[
                                    event.event
                                ],
                        });

                    });

            }
        );


        return markers;

    }, [
        match,
        currentTime,
    ]);


    // ==========================================================
    // ZOOM IN
    // ==========================================================

    const zoomIn = () => {

        setZoom(
            (previous) =>
                Math.min(
                    previous + 0.25,
                    4
                )
        );

    };


    // ==========================================================
    // ZOOM OUT
    // ==========================================================

    const zoomOut = () => {

        setZoom(
            (previous) =>
                Math.max(
                    previous - 0.25,
                    1
                )
        );


        if (zoom <= 1.25) {

            setPan({
                x: 0,
                y: 0,
            });

        }

    };


    // ==========================================================
    // RESET ZOOM + PAN
    // ==========================================================

    const resetView = () => {

        setZoom(1);

        setPan({
            x: 0,
            y: 0,
        });

    };


    // ==========================================================
    // MOUSE WHEEL ZOOM
    // ==========================================================

    const handleWheel = (event) => {

        event.preventDefault();


        const viewport =
            event.currentTarget;


        const rect =
            viewport.getBoundingClientRect();


        // Mouse position inside viewport

        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        setZoom((previousZoom) => {

            const zoomFactor =
                event.deltaY < 0
                    ? 1.1
                    : 0.9;


            const newZoom =
                Math.max(
                    1,
                    Math.min(
                        previousZoom *
                            zoomFactor,
                        4
                    )
                );


            if (
                newZoom ===
                previousZoom
            ) {
                return previousZoom;
            }


            const viewportCenterX =
                rect.width / 2;

            const viewportCenterY =
                rect.height / 2;


            /*
             * Find the map-space point
             * underneath the mouse.
             */

            const mapPointX =
                (
                    mouseX -
                    viewportCenterX -
                    pan.x
                ) /
                previousZoom;


            const mapPointY =
                (
                    mouseY -
                    viewportCenterY -
                    pan.y
                ) /
                previousZoom;


            /*
             * Adjust pan so the same map
             * point stays underneath mouse.
             */

            const newPanX =
                mouseX -
                viewportCenterX -
                mapPointX *
                    newZoom;


            const newPanY =
                mouseY -
                viewportCenterY -
                mapPointY *
                    newZoom;


            setPan({
                x: newPanX,
                y: newPanY,
            });


            return newZoom;

        });

    };


    // ==========================================================
    // START DRAGGING
    // ==========================================================

    const handleMouseDown = (event) => {

        if (zoom <= 1) {
            return;
        }


        setIsDragging(true);


        setDragStart({
            x:
                event.clientX -
                pan.x,

            y:
                event.clientY -
                pan.y,
        });

    };


    // ==========================================================
    // DRAG MAP
    // ==========================================================

    const handleMouseMove = (event) => {

        if (!isDragging) {
            return;
        }


        setPan({
            x:
                event.clientX -
                dragStart.x,

            y:
                event.clientY -
                dragStart.y,
        });

    };


    // ==========================================================
    // STOP DRAGGING
    // ==========================================================

    const handleMouseUp = () => {

        setIsDragging(false);

    };


    // ==========================================================
    // NO MATCH SELECTED
    // ==========================================================

    if (!match) {

        return (
            <Paper
                radius="md"
                withBorder
                h="100%"
                mih={500}
            >

                <Center h="100%">

                    <Text
                        size="lg"
                        c="dimmed"
                    >
                        Select a match
                    </Text>

                </Center>

            </Paper>
        );

    }


    // ==========================================================
    // MAP NOT FOUND
    // ==========================================================

    if (!mapImage) {

        return (
            <Paper
                radius="md"
                withBorder
                h="100%"
                mih={500}
            >

                <Center h="100%">

                    <Text
                        size="lg"
                        c="dimmed"
                    >
                        Map image not found
                    </Text>

                </Center>

            </Paper>
        );

    }


    // ==========================================================
    // RENDER
    // ==========================================================

    return (

        <Paper
            radius="md"
            withBorder
            p={0}
            style={{
                position: "relative",
                overflow: "hidden",

                width: "100%",
                maxWidth: 650,

                margin: "0 auto",

                aspectRatio:
                    `${mapWidth} / ${mapHeight}`,
            }}
        >

            {/* ==================================================
                MAP VIEWPORT
            ================================================== */}

            <div
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}

                style={{
                    position: "absolute",

                    inset: 0,

                    width: "100%",
                    height: "100%",

                    overflow: "hidden",

                    cursor:
                        zoom > 1
                            ? isDragging
                                ? "grabbing"
                                : "grab"
                            : "default",
                }}
            >

                {/* ==================================================
                    ZOOMED MAP CONTENT
                ================================================== */}

                <div
                    style={{
                        position: "absolute",

                        inset: 0,

                        width: "100%",
                        height: "100%",

                        transform:
                            `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,

                        transformOrigin:
                            "center center",

                        transition:
                            isDragging
                                ? "none"
                                : "transform 100ms ease",

                        userSelect: "none",
                    }}
                >

                    {/* ==============================================
                        MAP IMAGE
                    ============================================== */}

                    <Image
                        src={mapImage}
                        alt={`${match.map} minimap`}
                        fit="fill"
                        w="100%"
                        h="100%"
                        draggable={false}

                        style={{
                            position: "absolute",
                            inset: 0,
                        }}
                    />


                    {/* ==============================================
                        PLAYER PATHS
                    ============================================== */}

                    <svg
                        viewBox={
                            `0 0 ${mapWidth} ${mapHeight}`
                        }

                        preserveAspectRatio="none"

                        style={{
                            position: "absolute",

                            inset: 0,

                            width: "100%",
                            height: "100%",

                            pointerEvents: "none",
                        }}
                    >

                        {players.map(
                            (player) => {

                                const points =
                                    player.positions
                                        .map(
                                            (position) =>
                                                `${position.px},${position.py}`
                                        )
                                        .join(" ");


                                if (!points) {
                                    return null;
                                }


                                const color =
                                    PLAYER_COLORS[
                                        player.type
                                    ] ||
                                    "white";


                                return (
                                    <polyline
                                        key={
                                            player.id
                                        }

                                        points={
                                            points
                                        }

                                        fill="none"

                                        stroke={
                                            color
                                        }

                                        strokeWidth="3"

                                        strokeLinecap="round"

                                        strokeLinejoin="round"

                                        opacity={0.75}
                                    />
                                );

                            }
                        )}

                    </svg>


                    {/* ==============================================
                        EVENT MARKERS
                    ============================================== */}

                    {eventMarkers.map(
                        (event, index) => {

                            const left =
                                `${
                                    (
                                        event.px /
                                        mapWidth
                                    ) * 100
                                }%`;


                            const top =
                                `${
                                    (
                                        event.py /
                                        mapHeight
                                    ) * 100
                                }%`;


                            return (
                                <div
                                    key={
                                        `${event.playerId}-${event.t}-${event.event}-${index}`
                                    }

                                    title={
                                        `${event.event} at ${event.t.toFixed(2)}s`
                                    }

                                    style={{
                                        position:
                                            "absolute",

                                        left,
                                        top,

                                        width: 24,
                                        height: 24,

                                        transform:
                                            "translate(-50%, -50%)",

                                        zIndex: 5,

                                        pointerEvents:
                                            "none",
                                    }}
                                >

                                    <img
                                        src={
                                            event.icon
                                        }

                                        alt={
                                            event.event
                                        }

                                        draggable={
                                            false
                                        }

                                        style={{
                                            width:
                                                "100%",

                                            height:
                                                "100%",

                                            objectFit:
                                                "contain",

                                            display:
                                                "block",
                                        }}
                                    />

                                </div>
                            );

                        }
                    )}


                    {/* ==============================================
                        PLAYER MARKERS
                    ============================================== */}

                    {players.map(
                        (player) => {

                            const currentPosition =
                                player.currentPosition;


                            if (
                                !currentPosition
                            ) {
                                return null;
                            }


                            const left =
                                `${
                                    (
                                        currentPosition.px /
                                        mapWidth
                                    ) * 100
                                }%`;


                            const top =
                                `${
                                    (
                                        currentPosition.py /
                                        mapHeight
                                    ) * 100
                                }%`;


                            const color =
                                PLAYER_COLORS[
                                    player.type
                                ] ||
                                "white";


                            return (
                                <div
                                    key={
                                        player.id
                                    }

                                    title={
                                        `${player.type}: ${player.id}`
                                    }

                                    style={{
                                        position:
                                            "absolute",

                                        left,
                                        top,

                                        width: 12,
                                        height: 12,

                                        borderRadius:
                                            "50%",

                                        backgroundColor:
                                            color,

                                        border:
                                            "2px solid white",

                                        transform:
                                            "translate(-50%, -50%)",

                                        zIndex: 4,
                                    }}
                                />
                            );

                        }
                    )}

                </div>


                {/* ==================================================
                    LEGEND
                ================================================== */}

                <div
                    style={{
                        position:
                            "absolute",

                        top: 12,
                        left: 12,

                        padding:
                            "8px 10px",

                        borderRadius: 6,

                        backgroundColor:
                            "rgba(0, 0, 0, 0.7)",

                        zIndex: 10,
                    }}
                >

                    <Stack gap={6}>

                        {/* PLAYER */}

                        <Group
                            gap={7}
                            wrap="nowrap"
                        >

                            <div
                                style={{
                                    width: 10,
                                    height: 10,

                                    flexShrink: 0,

                                    borderRadius:
                                        "50%",

                                    backgroundColor:
                                        PLAYER_COLORS.human,

                                    border:
                                        "1px solid white",
                                }}
                            />

                            <Text
                                size="xs"
                                c="white"
                            >
                                Player
                            </Text>

                        </Group>


                        {/* BOT */}

                        <Group
                            gap={7}
                            wrap="nowrap"
                        >

                            <div
                                style={{
                                    width: 10,
                                    height: 10,

                                    flexShrink: 0,

                                    borderRadius:
                                        "50%",

                                    backgroundColor:
                                        PLAYER_COLORS.bot,

                                    border:
                                        "1px solid white",
                                }}
                            />

                            <Text
                                size="xs"
                                c="white"
                            >
                                Bot
                            </Text>

                        </Group>


                        {/* LOOT */}

                        <Group
                            gap={7}
                            wrap="nowrap"
                        >

                            <img
                                src={lootIcon}
                                alt="Loot"
                                style={{
                                    width: 18,
                                    height: 18,

                                    objectFit:
                                        "contain",
                                }}
                            />

                            <Text
                                size="xs"
                                c="white"
                            >
                                Loot
                            </Text>

                        </Group>


                        {/* KILL */}

                        <Group
                            gap={7}
                            wrap="nowrap"
                        >

                            <img
                                src={killIcon}
                                alt="Kill"
                                style={{
                                    width: 18,
                                    height: 18,

                                    objectFit:
                                        "contain",
                                }}
                            />

                            <Text
                                size="xs"
                                c="white"
                            >
                                Kill
                            </Text>

                        </Group>


                        {/* DEATH */}

                        <Group
                            gap={7}
                            wrap="nowrap"
                        >

                            <img
                                src={deathIcon}
                                alt="Death"
                                style={{
                                    width: 18,
                                    height: 18,

                                    objectFit:
                                        "contain",
                                }}
                            />

                            <Text
                                size="xs"
                                c="white"
                            >
                                Death
                            </Text>

                        </Group>


                        {/* STORM DEATH */}

                        <Group
                            gap={7}
                            wrap="nowrap"
                        >

                            <img
                                src={stormIcon}
                                alt="Storm death"
                                style={{
                                    width: 18,
                                    height: 18,

                                    objectFit:
                                        "contain",
                                }}
                            />

                            <Text
                                size="xs"
                                c="white"
                            >
                                Storm death
                            </Text>

                        </Group>

                    </Stack>

                </div>


                {/* ==================================================
                    ZOOM CONTROLS + PERCENTAGE
                ================================================== */}

                <div
                    style={{
                        position:
                            "absolute",

                        bottom: 12,
                        right: 12,

                        display: "flex",
                        alignItems:
                            "center",

                        gap: 4,

                        padding:
                            "4px",

                        borderRadius: 6,

                        backgroundColor:
                            "rgba(0, 0, 0, 0.7)",

                        zIndex: 10,
                    }}
                >

                    {/* ZOOM OUT */}

                    <Tooltip label="Zoom out">

                        <ActionIcon
                            size="sm"
                            variant="filled"

                            disabled={
                                zoom <= 1
                            }

                            onClick={zoomOut}
                        >
                            −
                        </ActionIcon>

                    </Tooltip>


                    {/* ZOOM LEVEL */}

                    <Text
                        size="xs"
                        c="white"
                        ta="center"
                        w={42}
                    >
                        {Math.round(
                            zoom * 100
                        )}%
                    </Text>


                    {/* ZOOM IN */}

                    <Tooltip label="Zoom in">

                        <ActionIcon
                            size="sm"
                            variant="filled"

                            onClick={zoomIn}
                        >
                            +
                        </ActionIcon>

                    </Tooltip>


                    {/* RESET */}

                    <Tooltip label="Reset view">

                        <ActionIcon
                            size="sm"
                            variant="filled"

                            onClick={resetView}
                        >
                            ↺
                        </ActionIcon>

                    </Tooltip>

                </div>

            </div>

        </Paper>

    );
}


export default MapViewer;