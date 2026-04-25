import { Employee } from "../types";
import bundledEmployees from '../data/employees_lts.json';
import { WAVE_1, WAVE_2, normalizeWave } from '../constants/waves';

function normalizeEmployee(raw: any): Employee | null {
    if (!raw || typeof raw !== "object") return null;

    // IMPORTANT: use String() directly — never parseInt/parseFloat
    const cluster = String(raw.cluster ?? raw["Cluster"] ?? "").trim() || "0";
    const team = String(raw.team ?? raw["Team"] ?? "").trim().toUpperCase() || "X";
    const rawWave = String(raw.wave ?? raw["Wave"] ?? "").trim();

    return {
        id:      String(raw.id ?? raw["Employee ID"] ?? "").trim(),
        name:    String(raw.name ?? raw["Name"] ?? "").trim(),
        email:   String(raw.email ?? raw["Email"] ?? "").trim(),
        team,
        cluster,
        wave:    normalizeWave(rawWave),
    };
}

async function fetchEmployeesFromGitHub(): Promise<Employee[]> {
    const token    = import.meta.env.VITE_GITHUB_TOKEN;
    const repo     = import.meta.env.VITE_GITHUB_REPO;
    const filePath = import.meta.env.VITE_GITHUB_FILE_PATH || "src/data/employees_lts.json";
    const branch   = import.meta.env.VITE_GITHUB_BRANCH || "main";

    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
        },
    });

    if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);

    const json    = await res.json();
    const decoded = atob(String(json.content || "").replace(/\n/g, ""));
    return JSON.parse(decoded).map(normalizeEmployee).filter(Boolean) as Employee[];
}

export async function loadEmployees(): Promise<Employee[]> {
    const bundled = (bundledEmployees as any[] || []).map(normalizeEmployee).filter(Boolean) as Employee[];
    const token   = import.meta.env.VITE_GITHUB_TOKEN;
    const repo    = import.meta.env.VITE_GITHUB_REPO;
    const path    = import.meta.env.VITE_GITHUB_FILE_PATH;

    if (!token || !repo || !path) return bundled;

    try {
        const data = await fetchEmployeesFromGitHub();
        return (data && data.length) ? data : bundled;
    } catch {
        return bundled;
    }
}

export const saveToGitHub = async (
  updatedEmployees: Employee[]
): Promise<{ success: boolean; message: string }> => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const repo = import.meta.env.VITE_GITHUB_REPO;
  const filePath = import.meta.env.VITE_GITHUB_FILE_PATH;
  const branch = import.meta.env.VITE_GITHUB_BRANCH || "main";

  const apiUrl =
    `https://api.github.com/repos/${repo}/contents/${filePath}`;

  console.log("🔄 Starting GitHub sync...");

  try {
    // STEP A: Get current file SHA
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!getRes.ok) {
      return {
        success: false,
        message: `Failed to fetch file. Status: ${getRes.status}`
      };
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;

    // STEP B: Encode content to base64
    const newContent = JSON.stringify(updatedEmployees, null, 2);
    const encoded = btoa(
      unescape(encodeURIComponent(newContent))
    );

    // STEP C: Push updated file
    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "EVA SIM: Employee data updated via facilitator",
        content: encoded,
        sha: sha,
        branch: branch,
      }),
    });

    if (putRes.ok) {
      return {
        success: true,
        message: "Saved to GitHub successfully ✅"
      };
    } else {
      const err = await putRes.json();
      return {
        success: false,
        message: err.message || "GitHub save failed"
      };
    }

  } catch (error) {
    console.error("❌ GitHub sync error:", error);
    return {
      success: false,
      message: "Network error. Could not reach GitHub."
    };
  }
};

