import { Tabs } from "@mantine/core";

function ToolSelector({
    selectedTool,
    onToolChange,
}) {
    return (
        <Tabs
            value={selectedTool}
            onChange={onToolChange}
            variant="pills"
        >
            <Tabs.List>

                <Tabs.Tab value="replay">
                    Match Replay
                </Tabs.Tab>

                <Tabs.Tab value="heatmap">
                    Heatmap Viewer
                </Tabs.Tab>

            </Tabs.List>
        </Tabs>
    );
}

export default ToolSelector;