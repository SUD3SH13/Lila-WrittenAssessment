import {
  Paper,
  Stack,
  Text,
  UnstyledButton,
  Group,
  ScrollArea,
} from "@mantine/core";


function MatchSelector({
  matches,
  selectedMatch,
  onMatchChange,
}) {

  if (matches.length === 0) {

    return (
      <Text
        size="sm"
        c="dimmed"
      >
        No matches found.
      </Text>
    );

  }


  return (

    <ScrollArea
      h={500}
      type="auto"
      offsetScrollbars
    >

      <Stack gap="xs" pr="sm">

        {matches.map((match, index) => {

          const isSelected =
            match.id === selectedMatch;


          return (

            <UnstyledButton
              key={match.id}
              onClick={() =>
                onMatchChange(match.id)
              }
            >

              <Paper
                p="sm"
                radius="md"
                withBorder

                style={(theme) => ({

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

                <Group
                  justify="space-between"
                  wrap="nowrap"
                  gap="xs"
                >
                  <Stack
                    gap={2}
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Text
                      size="sm"
                      fw={600}
                    >
                      Match {index + 1}
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                      truncate
                    >
                      {match.raw_match_id}
                    </Text>
                  </Stack>

                  <Text
                    size="xs"
                    c="dimmed"
                    style={{
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {match.duration.toFixed(2)}s
                  </Text>
                </Group>

              </Paper>

            </UnstyledButton>

          );

        })}

      </Stack>

    </ScrollArea>

  );
}


export default MatchSelector;