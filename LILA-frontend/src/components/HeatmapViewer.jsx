import { useEffect, useRef, useState } from "react";

import {
  Paper,
  Center,
  Text,
  Stack,
  ActionIcon,
  Tooltip,
  Grid,
  Button,
  Group,
  UnstyledButton
} from "@mantine/core";

import ambroseValleyMap from "../assets/minimaps/AmbroseValley_Minimap.webp";
import grandRiftMap from "../assets/minimaps/GrandRift_Minimap.webp";
import lockdownMap from "../assets/minimaps/Lockdown_Minimap.webp";


// ==========================================================
// MAP IMAGES
// ==========================================================

const MAP_IMAGES = {
  AmbroseValley: ambroseValleyMap,
  GrandRift: grandRiftMap,
  Lockdown: lockdownMap,
};


// ==========================================================
// HEATMAP TYPES
// ==========================================================

const HEATMAP_TYPES = {
  kills: {
    label: "Kill Zones",
  },

  deaths: {
    label: "Death Zones",
  },

  traffic: {
    label: "High Traffic",
  },

  loot: {
    label: "Loot Areas",
  },
};


// ==========================================================
// HEATMAP COLORS
// ==========================================================

const HEATMAP_COLORS = {
  red: {
    label: "Red",
    colors: {
      center: [255, 0, 0],
      middle: [255, 80, 0],
      outer: [255, 200, 0],
    },
  },

  blue: {
    label: "Blue",
    colors: {
      center: [0, 100, 255],
      middle: [0, 180, 255],
      outer: [100, 220, 255],
    },
  },
};


// ==========================================================
// MAP DIMENSIONS
// ==========================================================

const MAP_WIDTH = 1024;
const MAP_HEIGHT = 1024;


// ==========================================================
// DRAW HEATMAP
// ==========================================================

function drawHeatmap(
  canvas,
  points,
  gridSize,
  colorScheme,
) {

  if (!canvas) {
    return;
  }


  const ctx =
    canvas.getContext("2d");


  const width =
    canvas.width;

  const height =
    canvas.height;


  // ======================================================
  // CLEAR PREVIOUS HEATMAP
  // ======================================================

  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  if (
    !points ||
    points.length === 0
  ) {
    return;
  }


  // ======================================================
  // GRID CELL SIZE
  // ======================================================

  const cellWidth =
    width / gridSize;

  const cellHeight =
    height / gridSize;


  // ======================================================
  // GET COLORS
  // ======================================================

  const colors =
    HEATMAP_COLORS[
      colorScheme
    ]?.colors ||
    HEATMAP_COLORS.red.colors;


  const [
    centerR,
    centerG,
    centerB,
  ] = colors.center;


  const [
    middleR,
    middleG,
    middleB,
  ] = colors.middle;


  const [
    outerR,
    outerG,
    outerB,
  ] = colors.outer;


  // ======================================================
  // DRAW HEATMAP CELLS
  // ======================================================

  points.forEach((point) => {

    if (
      typeof point.x !== "number" ||
      typeof point.y !== "number"
    ) {
      return;
    }


    if (
      typeof point.intensity !== "number"
    ) {
      return;
    }


    const intensity =
      Math.max(
        0,
        Math.min(
          1,
          point.intensity
        )
      );


    if (intensity <= 0) {
      return;
    }


    // ==================================================
    // GRID → CANVAS
    // ==================================================

    const cellX =
      point.x * cellWidth;

    const cellY =
      point.y * cellHeight;


    const centerX =
      cellX +
      cellWidth / 2;

    const centerY =
      cellY +
      cellHeight / 2;


    // ==================================================
    // RADIAL GRADIENT
    // ==================================================

    const radius =
      Math.max(
        cellWidth,
        cellHeight
      ) * 1.5;


    const gradient =
      ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );


    gradient.addColorStop(
      0,
      `rgba(
                ${centerR},
                ${centerG},
                ${centerB},
                ${intensity * 0.8}
            )`
    );


    gradient.addColorStop(
      0.35,
      `rgba(
                ${middleR},
                ${middleG},
                ${middleB},
                ${intensity * 0.55}
            )`
    );


    gradient.addColorStop(
      0.7,
      `rgba(
                ${outerR},
                ${outerG},
                ${outerB},
                ${intensity * 0.25}
            )`
    );


    gradient.addColorStop(
      1,
      "rgba(255, 255, 255, 0)"
    );


    ctx.fillStyle =
      gradient;


    ctx.fillRect(
      cellX,
      cellY,
      cellWidth,
      cellHeight
    );

  });

}


// ==========================================================
// COMPONENT
// ==========================================================

function HeatmapViewer({
  map,
  heatmapData,
}) {

  // ======================================================
  // CANVAS
  // ======================================================

  const canvasRef =
    useRef(null);


  // ======================================================
  // HEATMAP TYPE
  // ======================================================

  const [
    selectedType,
    setSelectedType,
  ] = useState("kills");


  // ======================================================
  // HEATMAP COLOR
  // ======================================================

  const [
    heatmapColor,
    setHeatmapColor,
  ] = useState("red");


  // ======================================================
  // ZOOM STATE
  // ======================================================

  const [
    zoom,
    setZoom,
  ] = useState(1);


  // ======================================================
  // PAN STATE
  // ======================================================

  const [
    pan,
    setPan,
  ] = useState({
    x: 0,
    y: 0,
  });


  // ======================================================
  // DRAG STATE
  // ======================================================

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);


  const [
    dragStart,
    setDragStart,
  ] = useState({
    x: 0,
    y: 0,
  });


  // ======================================================
  // GET MAP DATA
  // ======================================================

  const mapData =
    heatmapData || null;


  // ======================================================
  // GET SELECTED HEATMAP
  // ======================================================

  const points =
    mapData?.[
    selectedType
    ] || [];


  // ======================================================
  // GRID SIZE
  // ======================================================

  const gridSize =
    mapData?.grid_size || 64;


  // ======================================================
  // MAP IMAGE
  // ======================================================

  const mapImage =
    MAP_IMAGES[map];


  // ======================================================
  // DRAW HEATMAP
  // ======================================================

  useEffect(() => {

    drawHeatmap(
      canvasRef.current,
      points,
      gridSize,
      heatmapColor
    );

  }, [
    points,
    gridSize,
    heatmapColor,
    map,
  ]);


  // ======================================================
  // RESET WHEN MAP CHANGES
  // ======================================================

  useEffect(() => {

    setZoom(1);

    setPan({
      x: 0,
      y: 0,
    });

  }, [
    map,
  ]);


  // ======================================================
  // ZOOM IN
  // ======================================================

  const zoomIn = () => {

    setZoom(
      (previous) =>
        Math.min(
          previous + 0.25,
          4
        )
    );

  };


  // ======================================================
  // ZOOM OUT
  // ======================================================

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


  // ======================================================
  // RESET VIEW
  // ======================================================

  const resetView = () => {

    setZoom(1);

    setPan({
      x: 0,
      y: 0,
    });

  };


  // ======================================================
  // MOUSE WHEEL ZOOM
  // ======================================================

  const handleWheel = (event) => {

    event.preventDefault();


    const viewport =
      event.currentTarget;


    const rect =
      viewport.getBoundingClientRect();


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


  // ======================================================
  // START DRAGGING
  // ======================================================

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


  // ======================================================
  // DRAG MAP
  // ======================================================

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


  // ======================================================
  // STOP DRAGGING
  // ======================================================

  const handleMouseUp = () => {

    setIsDragging(false);

  };


  // ======================================================
  // NO DATA
  // ======================================================

  if (!mapData) {

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
            No heatmap data available
            for {map}
          </Text>

        </Center>

      </Paper>
    );

  }


  // ======================================================
  // MAP NOT FOUND
  // ======================================================

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


  // ======================================================
  // RENDER
  // ======================================================

  return (

    <Grid
      gutter="lg"
      align="start"
    >

      {/* ==================================================
                LEFT SIDE
                HEATMAP CONTROLS
            ================================================== */}

      <Grid.Col
        span={{
          base: 12,
          md: 3,
        }}
      >

        <Paper
          radius="md"
          p="md"
        >

          <Stack gap="md">


            {/* ==========================================
                            COLOR SELECTOR
                        ========================================== */}

            <Stack gap="xs">

              <Text
                size="sm"
                fw={600}
              >
                Heatmap Color
              </Text>


              <Group
                grow
                gap="xs"
              >

                {Object.entries(
                  HEATMAP_COLORS
                ).map(
                  ([
                    color,
                    config,
                  ]) => (

                    <Button
                      key={color}

                      size="sm"

                      variant={
                        heatmapColor ===
                          color
                          ? "filled"
                          : "light"
                      }

                      color={
                        color ===
                          "red"
                          ? "red"
                          : "blue"
                      }

                      onClick={() =>
                        setHeatmapColor(
                          color
                        )
                      }
                    >

                      {config.label}

                    </Button>

                  )
                )}

              </Group>

            </Stack>


            {/* ==========================================
                            DIVIDER
                        ========================================== */}

            <div
              style={{
                height: 1,
                background:
                  "var(--mantine-color-dark-4)",
              }}
            />


            {/* ==========================================
                            HEATMAP TYPE SELECTOR
                        ========================================== */}

            <Stack gap="xs">

              <Text
                size="sm"
                fw={600}
              >
                Heatmaps
              </Text>


              {Object.entries(
                HEATMAP_TYPES
              ).map(
                ([
                  type,
                  config,
                ]) => {

                  const isSelected =
                    selectedType === type;

                  return (

                    <UnstyledButton
                      key={type}

                      onClick={() =>
                        setSelectedType(type)
                      }

                      style={{
                        width: "100%",
                      }}
                    >

                      <Paper
                        p="sm"
                        radius="md"
                        withBorder

                        style={(theme) => ({

                          width: "100%",

                          backgroundColor:
                            isSelected
                              ? theme.colors.blue[9]
                              : theme.colors.dark[6],

                          borderColor:
                            isSelected
                              ? theme.colors.blue[5]
                              : theme.colors.dark[4],

                          transition:
                            "background-color 150ms ease",

                        })}
                      >

                        <Text
                          size="sm"
                          fw={600}
                        >
                          {
                            config.label
                          }
                        </Text>

                      </Paper>

                    </UnstyledButton>

                  );

                }
              )}

            </Stack>

          </Stack>

        </Paper>

      </Grid.Col>


      {/* ==================================================
                RIGHT SIDE
                MAP
            ================================================== */}

      <Grid.Col
        span={{
          base: 12,
          md: 9,
        }}
      >

        <Paper
          radius="md"
          withBorder
          p={0}

          style={{
            position:
              "relative",

            overflow:
              "hidden",

            width:
              "100%",

            maxWidth:
              650,

            margin:
              "0 auto",

            aspectRatio:
              `${MAP_WIDTH} / ${MAP_HEIGHT}`,
          }}
        >

          {/* ==================================================
                        MAP VIEWPORT
                    ================================================== */}

          <div
            onWheel={
              handleWheel
            }

            onMouseDown={
              handleMouseDown
            }

            onMouseMove={
              handleMouseMove
            }

            onMouseUp={
              handleMouseUp
            }

            onMouseLeave={
              handleMouseUp
            }

            style={{
              position:
                "absolute",

              inset: 0,

              width:
                "100%",

              height:
                "100%",

              overflow:
                "hidden",

              cursor:
                zoom > 1
                  ? isDragging
                    ? "grabbing"
                    : "grab"
                  : "default",
            }}
          >

            {/* ==================================================
                            ZOOMED CONTENT
                        ================================================== */}

            <div
              style={{
                position:
                  "absolute",

                inset: 0,

                width:
                  "100%",

                height:
                  "100%",

                transform:
                  `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,

                transformOrigin:
                  "center center",

                transition:
                  isDragging
                    ? "none"
                    : "transform 100ms ease",

                userSelect:
                  "none",
              }}
            >

              {/* ==============================================
                                MAP IMAGE
                            ============================================== */}

              <img
                src={
                  mapImage
                }

                alt={
                  `${map} heatmap`
                }

                draggable={
                  false
                }

                style={{
                  position:
                    "absolute",

                  inset:
                    0,

                  width:
                    "100%",

                  height:
                    "100%",

                  objectFit:
                    "fill",

                  display:
                    "block",
                }}
              />


              {/* ==============================================
                                HEATMAP CANVAS
                            ============================================== */}

              <canvas
                ref={
                  canvasRef
                }

                width={
                  MAP_WIDTH
                }

                height={
                  MAP_HEIGHT
                }

                style={{
                  position:
                    "absolute",

                  inset:
                    0,

                  width:
                    "100%",

                  height:
                    "100%",

                  pointerEvents:
                    "none",
                }}
              />


              {/* ==============================================
                                HEATMAP LABEL
                            ============================================== */}

              <Paper
                pos="absolute"

                top={12}
                left={12}

                p="xs"

                radius="sm"

                bg="rgba(0, 0, 0, 0.7)"

                style={{
                  zIndex: 10,
                }}
              >

                <Text
                  size="sm"
                  c="white"
                  fw={600}
                >

                  {
                    HEATMAP_TYPES[
                      selectedType
                    ].label
                  }

                </Text>

              </Paper>


              {/* ==============================================
                                ACTIVE AREAS
                            ============================================== */}

              <Paper
                pos="absolute"

                bottom={12}
                left={12}

                p="xs"

                radius="sm"

                bg="rgba(0, 0, 0, 0.7)"

                style={{
                  zIndex: 10,
                }}
              >

                <Text
                  size="xs"
                  c="white"
                >

                  {
                    points.length
                  }{" "}
                  active areas

                </Text>

              </Paper>

            </div>


            {/* ==================================================
                            ZOOM CONTROLS
                        ================================================== */}

            <div
              style={{
                position:
                  "absolute",

                bottom: 12,
                right: 12,

                display:
                  "flex",

                alignItems:
                  "center",

                gap: 4,

                padding:
                  "4px",

                borderRadius: 6,

                backgroundColor:
                  "rgba(0, 0, 0, 0.7)",

                zIndex: 20,
              }}
            >

              {/* ZOOM OUT */}

              <Tooltip
                label="Zoom out"
              >

                <ActionIcon
                  size="sm"

                  variant="filled"

                  disabled={
                    zoom <= 1
                  }

                  onClick={
                    zoomOut
                  }
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

              <Tooltip
                label="Zoom in"
              >

                <ActionIcon
                  size="sm"

                  variant="filled"

                  onClick={
                    zoomIn
                  }
                >
                  +
                </ActionIcon>

              </Tooltip>


              {/* RESET */}

              <Tooltip
                label="Reset view"
              >

                <ActionIcon
                  size="sm"

                  variant="filled"

                  onClick={
                    resetView
                  }
                >
                  ↺
                </ActionIcon>

              </Tooltip>

            </div>

          </div>

        </Paper>

      </Grid.Col>

    </Grid>

  );

}


export default HeatmapViewer;