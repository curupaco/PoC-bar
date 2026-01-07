
import { AppFullData } from "./firebaseService";

export const testGitHubToken = async (token: string) => {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Token inválido.");
    }
    return true;
  } catch (err: any) {
    throw new Error(err.message || "Erro de conexão com o GitHub");
  }
};

export const syncToGitHub = async (token: string, data: Omit<AppFullData, 'updatedAt'>, existingGistId?: string) => {
  const fileName = "botequista_full_backup.json";
  const body = {
    description: "Backup Completo Botequista - Autogerado",
    public: false,
    files: {
      [fileName]: {
        content: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2)
      }
    }
  };

  const url = existingGistId ? `https://api.github.com/gists/${existingGistId}` : `https://api.github.com/gists`;
  const method = existingGistId ? 'PATCH' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao sincronizar com GitHub");
    }
    const result = await response.json();
    return result.id as string;
  } catch (err: any) {
    throw new Error(err.message || "Falha na comunicação com o GitHub Gists");
  }
};
