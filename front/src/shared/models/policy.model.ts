export const policyTypeValues = ['GreenCard', 'Medassistance', 'Osago'] as const;
export type PolicyType = (typeof policyTypeValues)[number];

export const policyStatusValues = ['Expired', 'Active', 'Terminated'] as const;
export type PolicyStatus = (typeof policyStatusValues)[number];
