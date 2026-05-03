export const actionMap = {
  scan: 'Reconnaissance',
  exploit: ['SQL Injection', 'Phishing', 'Credential Stuffing'] as const,
  defend: ['Firewall', 'MFA', 'WAF'] as const,
  counter: 'Incident Response'
} as const;

export type ActionKey = keyof typeof actionMap;

const getRandomArrayElement = <T extends readonly string[]>(values: T): T[number] => {
  const index = Math.floor(Math.random() * values.length);
  return values[index];
};

export const getReadableActionLabel = (action: ActionKey): string => {
  const mapping = actionMap[action];
  return Array.isArray(mapping) ? getRandomArrayElement(mapping) : mapping;
};

export const getDefaultActionLabel = (action: ActionKey): string => {
  const mapping = actionMap[action];
  return Array.isArray(mapping) ? mapping[0] : mapping;
};
