export function buildDefaultGenderOptions(eventName: string) {
  return [
    {
      key: "female",
      label: "Female",
      tagline: `I'm attending ${eventName}`,
      sortOrder: 0,
    },
    {
      key: "male",
      label: "Male",
      tagline: `I'm attending ${eventName}`,
      sortOrder: 1,
    },
    {
      key: "group",
      label: "Group",
      tagline: `We're attending ${eventName}`,
      sortOrder: 2,
    },
  ];
}
