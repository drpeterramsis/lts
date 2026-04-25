import { Employee } from "../types";

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
  console.log("📁 Repo:", repo);
  console.log("📄 File:", filePath);
  console.log("🌿 Branch:", branch);
  console.log("🔑 Token exists:", !!token);

  try {
    // STEP A: Get current file SHA
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    console.log("📥 GET status:", getRes.status);

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

    console.log("📤 PUT status:", putRes.status);

    if (putRes.ok) {
      return {
        success: true,
        message: "Saved to GitHub successfully ✅"
      };
    } else {
      const err = await putRes.json();
      console.error("❌ PUT error:", err);
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

export const fetchFromGitHub = async (): Promise<Employee[] | null> => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const repo = import.meta.env.VITE_GITHUB_REPO;
  const filePath = import.meta.env.VITE_GITHUB_FILE_PATH;

  if (!token || !repo || !filePath) return null;

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      // Decode base64 content
      const content = decodeURIComponent(escape(atob(data.content)));
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("❌ GitHub fetch error:", error);
  }
  return null;
};
