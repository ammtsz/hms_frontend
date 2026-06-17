export const treatmentTrackingKeys = {
  all: ['treatmentTracking'] as const,
  treatments: () => [...treatmentTrackingKeys.all, 'treatments'] as const,
};
