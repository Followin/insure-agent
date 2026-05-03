export const personStatusValues = ['Active', 'Inactive', 'Archived'] as const;
export type PersonStatus = (typeof personStatusValues)[number];

export type Sex = 'M' | 'F' | 'Unknown';
