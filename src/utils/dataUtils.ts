export const getTeamColor = (team: string): string => {
    const map: Record<string, string> = {
      "A": "#0C488A",   // Royal Blue
      "B": "#454E96",   // Indigo
      "C": "#7A3A94",   // Purple
      "D": "#D579A4",   // Rose
    };
    return map[String(team).trim().toUpperCase()] || "#A5A5A5";
};

export const getTeamLabel = (team: string): string => {
    const t = String(team).trim().toUpperCase();
    if (["A","B","C","D"].includes(t)) return `Team ${t}`;
    return team;
};

export const getClusterLabel = (cluster: string): string => {
    const c = String(cluster).trim();
    if (!isNaN(Number(c)) && c !== "") return `Cluster ${c}`;
    return cluster;
};

export function sortMembersAZ(list: any[]) {
  return [...(list || [])].sort((a, b) => {
    const an = String(a?.name || "").trim().toLowerCase();
    const bn = String(b?.name || "").trim().toLowerCase();

    if (!an && bn) return 1;
    if (an && !bn) return -1;

    const byName = an.localeCompare(bn);
    if (byName !== 0) return byName;

    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
}
