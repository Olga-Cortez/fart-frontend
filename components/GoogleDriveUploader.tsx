"use client";

import { useState, useEffect } from "react";
import { googleDriveService, type GoogleDriveFile } from "@/lib/googleDrive";
import { Upload, Link as LinkIcon, Loader2, CheckCircle, XCircle } from "lucide-react";

interface GoogleDriveUploaderProps {
  onFileUploaded: (fileLink: string, fileName: string) => void;
  accept?: string;
}

export default function GoogleDriveUploader({
  onFileUploaded,
  accept = ".pdf,.epub,.mobi",
}: GoogleDriveUploaderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function init() {
      try {
        await googleDriveService.initialize();
        setIsInitialized(true);
        // Verificar se já tem token
        setIsAuthenticated(googleDriveService.hasToken());
      } catch (err) {
        console.error("Erro ao inicializar Google Drive:", err);
        setError("Erro ao inicializar Google Drive. Verifique as credenciais.");
      }
    }
    init();
  }, []);

  async function handleAuthenticate() {
    setError("");
    try {
      const success = await googleDriveService.requestAccess();
      if (success) {
        setIsAuthenticated(true);
        setSuccess("Conectado ao Google Drive!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Não foi possível conectar ao Google Drive.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao conectar. Tente novamente.",
      );
    }
  }

  async function handleUpload(file: File) {
    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const driveFile: GoogleDriveFile = await googleDriveService.uploadFile(file);
      
      onFileUploaded(driveFile.webViewLink, driveFile.name);
      setSuccess(`Arquivo "${driveFile.name}" enviado com sucesso!`);
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao fazer upload. Tente novamente.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  }

  async function handleLinkSubmit() {
    if (!linkInput.trim()) return;
    
    setError("");
    setSuccess("");

    try {
      const fileId = googleDriveService.extractFileIdFromUrl(linkInput);
      
      if (!fileId) {
        setError("URL do Google Drive inválida. Verifique o link.");
        return;
      }

      // Tentar obter informações do arquivo (requer autenticação)
      try {
        const fileInfo = await googleDriveService.getFileInfo(fileId);
        onFileUploaded(fileInfo.webViewLink, fileInfo.name);
        setSuccess(`Arquivo "${fileInfo.name}" adicionado com sucesso!`);
      } catch {
        // Se não conseguir obter info, usar o link direto
        const viewLink = googleDriveService.getViewLink(fileId);
        onFileUploaded(viewLink, "Arquivo do Google Drive");
        setSuccess("Link do arquivo adicionado!");
      }

      setLinkInput("");
      setShowLinkInput(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao processar link.",
      );
    }
  }

  if (!isInitialized) {
    return (
      <div className="gdrive-uploader-loading">
        <Loader2 className="animate-spin" size={20} />
        <span>Inicializando Google Drive...</span>
      </div>
    );
  }

  return (
    <div className="gdrive-uploader">
      {error && (
        <div className="gdrive-message gdrive-error">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="gdrive-message gdrive-success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {!isAuthenticated ? (
        <div className="gdrive-auth">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAuthenticate}
          >
            <Upload size={16} />
            <span>Conectar ao Google Drive</span>
          </button>
          <p className="gdrive-auth-hint">
            Conecte-se ao Google Drive para fazer upload de arquivos
          </p>
        </div>
      ) : (
        <>
          <div className="gdrive-actions">
            <label
              className={`btn btn-primary ${isUploading ? "btn-loading" : ""}`}
              htmlFor="drive-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Fazer Upload para Drive</span>
                </>
              )}
              <input
                id="drive-upload"
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                disabled={isUploading}
                className="file-input-hidden"
              />
            </label>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowLinkInput(!showLinkInput)}
              disabled={isUploading}
            >
              <LinkIcon size={16} />
              <span>Colar Link do Drive</span>
            </button>
          </div>

          {showLinkInput && (
            <div className="gdrive-link-input">
              <input
                type="url"
                placeholder="Cole o link do Google Drive aqui..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleLinkSubmit}
                disabled={!linkInput.trim()}
              >
                Adicionar
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .gdrive-uploader {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .gdrive-uploader-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          color: #666;
        }

        .gdrive-auth {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          background-color: #f5f5f5;
          border-radius: 0.5rem;
          border: 1px dashed #ddd;
        }

        .gdrive-auth-hint {
          margin: 0;
          font-size: 0.875rem;
          color: #666;
          text-align: center;
        }

        .gdrive-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .gdrive-error {
          background-color: #fee;
          color: #c00;
          border: 1px solid #fcc;
        }

        .gdrive-success {
          background-color: #efe;
          color: #060;
          border: 1px solid #cfc;
        }

        .gdrive-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .gdrive-link-input {
          display: flex;
          gap: 0.5rem;
        }

        .gdrive-link-input input {
          flex: 1;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
