import { useRef } from "react";

import {
  ScrollArea,
  UnstyledButton,
  Stack,
  Text,
  Group,
} from "@mantine/core";

import dayjs from "dayjs";


function DatePicker({
  dates,
  selectedDate,
  onDateChange,
}) {

  const viewportRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);


  // ==========================================================
  // START DRAGGING
  // ==========================================================

  const handleMouseDown = (event) => {

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }


    isDragging.current = true;

    startX.current = event.clientX;

    startScrollLeft.current =
      viewport.scrollLeft;


    viewport.style.cursor = "grabbing";
    viewport.style.userSelect = "none";

  };


  // ==========================================================
  // DRAG
  // ==========================================================

  const handleMouseMove = (event) => {

    if (!isDragging.current) {
      return;
    }


    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }


    const distance =
      event.clientX - startX.current;


    viewport.scrollLeft =
      startScrollLeft.current - distance;

  };


  // ==========================================================
  // STOP DRAGGING
  // ==========================================================

  const stopDragging = () => {

    const viewport = viewportRef.current;

    isDragging.current = false;


    if (viewport) {

      viewport.style.cursor = "grab";
      viewport.style.userSelect = "auto";

    }

  };


  return (

    <ScrollArea
      type="auto"
      scrollbars="x"
      scrollbarSize={6}
      offsetScrollbars
      w="100%"
      viewportRef={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      style={{
        cursor: "grab",
      }}
    >

      <Group
        gap="xs"
        wrap="nowrap"
        w="max-content"
        pb="xs"
      >

        {dates.map((date) => {

          /*
           * Your data uses:
           *
           * February_10
           * February_11
           *
           * Convert that into a real date
           * for displaying the calendar UI.
           */

          const formattedDate =
            date.replace("_", "-");


          const day =
            dayjs(`2026-${formattedDate}`);


          const isSelected =
            date === selectedDate;


          return (

            <UnstyledButton
              key={date}
              onClick={() =>
                onDateChange(date)
              }

              style={(theme) => ({

                flexShrink: 0,

                width: 64,
                height: 76,

                borderRadius:
                  theme.radius.md,

                display: "flex",

                alignItems: "center",

                justifyContent:
                  "center",

                backgroundColor:
                  isSelected
                    ? theme.colors.blue[6]
                    : theme.colors.dark[6],

                color:
                  isSelected
                    ? theme.white
                    : theme.colors.gray[3],

                transition:
                  "background-color 150ms ease",

              })}
            >

              <Stack
                gap={2}
                align="center"
              >

                <Text
                  size="xs"
                  fw={700}
                  tt="uppercase"
                  opacity={
                    isSelected
                      ? 1
                      : 0.6
                  }
                >
                  {day.format("MMM")}
                </Text>


                <Text
                  size="xl"
                  fw={700}
                  lh={1}
                >
                  {day.format("DD")}
                </Text>


                <Text
                  size="xs"
                  fw={700}
                  tt="uppercase"
                  opacity={
                    isSelected
                      ? 1
                      : 0.6
                  }
                >
                  {day.format("ddd")}
                </Text>

              </Stack>

            </UnstyledButton>

          );

        })}

      </Group>

    </ScrollArea>

  );
}


export default DatePicker;