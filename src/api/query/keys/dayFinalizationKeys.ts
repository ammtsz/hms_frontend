export const dayFinalizationKeys = {
  all: ['dayFinalization'] as const,
  byDate: (date: string) => [...dayFinalizationKeys.all, date] as const,
};
