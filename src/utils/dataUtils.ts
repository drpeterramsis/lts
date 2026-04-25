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
