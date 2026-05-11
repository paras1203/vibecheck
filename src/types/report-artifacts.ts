export type ExperimentBacklogItem = {
  testName: string;
  hypothesis: string;
  primaryMetric: string;
  variantDescription: string;
};

export type ImplementationChecklistItem = {
  task: string;
  owner: "Copy" | "Design" | "Dev" | "Marketing";
  effort: "15 min" | "Half day" | "1–2 days";
};
