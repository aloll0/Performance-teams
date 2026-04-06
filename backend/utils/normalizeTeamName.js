const normalizeTeamName = (teamName) => {
  if (teamName === undefined || teamName === null) return teamName;

  const trimmed = String(teamName).trim();
  if (trimmed.toLowerCase() === 'zed') return 'Zid';

  return trimmed;
};

module.exports = { normalizeTeamName };