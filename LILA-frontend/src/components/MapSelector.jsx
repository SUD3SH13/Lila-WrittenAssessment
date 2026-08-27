import {
  Tabs,
  Image,
  Text,
  Group,
  ScrollArea,
} from "@mantine/core";

import ambroseValleyMap from "../assets/minimaps/AmbroseValley_Minimap.webp";
import grandRiftMap from "../assets/minimaps/GrandRift_Minimap.webp";
import lockdownMap from "../assets/minimaps/Lockdown_Minimap.webp";


const maps = [
  {
    value: "AmbroseValley",
    label: "Ambrose Valley",
    image: ambroseValleyMap,
  },
  {
    value: "GrandRift",
    label: "Grand Rift",
    image: grandRiftMap,
  },
  {
    value: "Lockdown",
    label: "LockDown",
    image: lockdownMap,
  },
];


function MapSelector({ selectedMap, onMapChange }) {

  return (
    <Tabs
      value={selectedMap}
      onChange={onMapChange}
      variant="pills"
    >

      <Group
        wrap="nowrap"
        gap="sm"
        align="center"
        w="100%"
      >

        <Text
          style={{
            flexShrink: 0,
          }}
        >
          Maps
        </Text>

        <Text
          size="30px"
          style={{
            flexShrink: 0,
          }}
        >
          |
        </Text>

        <ScrollArea
          type="auto"
          scrollbars="x"
          scrollbarSize={6}
          style={{
            flex: 1,
          }}
        >

          <Tabs.List
            wrap="nowrap"
            style={{
              width: "max-content",
            }}
          >

            {maps.map((map) => (

              <Tabs.Tab
                key={map.value}
                value={map.value}
                leftSection={
                  <Image
                    src={map.image}
                    alt=""
                    w={24}
                    h={24}
                    fit="cover"
                    radius="sm"
                  />
                }
                style={{
                  flexShrink: 0,
                }}
              >
                {map.label}
              </Tabs.Tab>

            ))}

          </Tabs.List>

        </ScrollArea>

      </Group>

    </Tabs>
  );
}


export default MapSelector;