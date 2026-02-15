/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Configuração do Google Drive API
const SCOPES = "https://www.googleapis.com/auth/drive.file";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

class GoogleDriveService {
  private gapiInited = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;

  async initialize() {
    if (this.gapiInited) return;

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("client", async () => {
          try {
            await window.gapi.client.init({
              apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
              discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
              ],
            });
            this.gapiInited = true;
            this.initTokenClient();
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  private initTokenClient() {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
          }
        },
      });
    };
    document.body.appendChild(script);
  }

  async requestAccess(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.accessToken) {
        resolve(true);
        return;
      }

      this.tokenClient.callback = (response: any) => {
        if (response.access_token) {
          this.accessToken = response.access_token;
          resolve(true);
        } else {
          resolve(false);
        }
      };

      this.tokenClient.requestAccessToken();
    });
  }

  hasToken(): boolean {
    return !!this.accessToken;
  }

  async uploadFile(file: File, folderId?: string): Promise<GoogleDriveFile> {
    if (!this.accessToken) {
      const hasAccess = await this.requestAccess();
      if (!hasAccess) throw new Error("Acesso negado ao Google Drive");
    }

    // Criar metadata do arquivo
    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: folderId ? [folderId] : undefined,
    };

    // Upload usando multipart
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    form.append("file", file);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      },
    );

    if (!response.ok) {
      throw new Error(`Erro ao fazer upload: ${response.statusText}`);
    }

    const fileData = await response.json();

    // Tornar o arquivo público para compartilhamento
    await this.makeFilePublic(fileData.id);

    return fileData;
  }

  async makeFilePublic(fileId: string): Promise<void> {
    if (!this.accessToken) return;

    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      },
    );
  }

  async getFileInfo(fileId: string): Promise<GoogleDriveFile> {
    if (!this.accessToken) {
      const hasAccess = await this.requestAccess();
      if (!hasAccess) throw new Error("Acesso negado ao Google Drive");
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,webContentLink`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar arquivo: ${response.statusText}`);
    }

    return response.json();
  }

  extractFileIdFromUrl(url: string): string | null {
    // Extrair ID de URLs do Google Drive
    // Formato: https://drive.google.com/file/d/FILE_ID/view
    const patterns = [
      /\/file\/d\/([^/]+)/,
      /id=([^&]+)/,
      /\/d\/([^/]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  getDirectDownloadLink(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  getViewLink(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  signOut() {
    this.accessToken = null;
    if (window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken);
    }
  }
}

export const googleDriveService = new GoogleDriveService();
