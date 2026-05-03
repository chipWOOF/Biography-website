export const actionMappings = {
  scan: 'reconnaissance',
  exploit: 'SQL injection / phishing / RCE',
  defend: 'firewall / MFA',
  counter: 'incident response'
} as const;

export type ActionKey = keyof typeof actionMappings;

export const getReadableActionLabel = (action: ActionKey): string => {
  return actionMappings[action];
};
