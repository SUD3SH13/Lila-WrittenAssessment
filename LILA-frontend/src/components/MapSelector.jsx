import { Tabs, Image, Text, Group } from "@mantine/core";

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
      <Group>
        <Text>
          Maps
        </Text>
        <Text size="30px">
          |
        </Text>
        <Tabs.List>

          {maps.map((map) => (

            <Tabs.Tab
              key={map.value}
              value={map.value}
              nowrap
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
            >
              {map.label}
            </Tabs.Tab>

          ))}

        </Tabs.List>

      </Group>



    </Tabs>
  );
}


export default MapSelector;