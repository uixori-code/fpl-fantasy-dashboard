// Approximate primary shirt colors by FPL short name. Not official kit data — just enough
// to make the pitch view visually distinguish clubs. Unknown/new clubs fall back to a
// deterministic hue derived from their team id, so nothing ever looks unstyled.
const KNOWN_COLORS: Record<string, string> = {
  ARS: '#EF0107',
  AVL: '#670E36',
  BOU: '#DA291C',
  BRE: '#e30613',
  BHA: '#0057B8',
  BUR: '#6C1D45',
  CHE: '#034694',
  CRY: '#1B458F',
  EVE: '#003399',
  FUL: '#000000',
  IPS: '#0044A9',
  LEE: '#FFCD00',
  LEI: '#003090',
  LIV: '#C8102E',
  MCI: '#6CABDD',
  MUN: '#DA291C',
  NEW: '#241F20',
  NFO: '#DD0000',
  SUN: '#EB172B',
  TOT: '#132257',
  WHU: '#7A263A',
  WOL: '#FDB913',
  HUL: '#F18A00',
  SOU: '#D71920',
  LUT: '#F78F1E',
  SHU: '#EE2737',
};

function fallbackColor(teamId: number): string {
  const hue = (teamId * 47) % 360;
  return `hsl(${hue}, 55%, 40%)`;
}

export function teamColor(shortName: string, teamId: number): string {
  return KNOWN_COLORS[shortName] ?? fallbackColor(teamId);
}
