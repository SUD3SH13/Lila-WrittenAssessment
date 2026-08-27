import { Tabs } from "@mantine/core";

const maps = [
  {
    value: "AmbroseValley",
    label: "Ambrose Valley",
  },
  {
    value: "GrandRift",
    label: "Grand Rift",
  },
  {
    value: "Lockdown",
    label: "LockDown",
  },
];

function MapSelector({ selectedMap, onMapChange }) {
  return (
    <Tabs
      value={selectedMap}
      onChange={onMapChange}
      variant="pills"
    >
      <Tabs.List>
        {maps.map((map) => (
          <Tabs.Tab
            key={map.value}
            value={map.value}
            
          >
            {map.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

export default MapSelector;