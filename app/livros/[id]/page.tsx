"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Trash2,
  Download,
  FileText,
} from "lucide-react";
import {
  getLivroById,
  deleteLivro,
  addArquivo,
  deleteArquivo,
} from "@/lib/services";
import type { LivroComDetalhes, Arquivo } from "@/lib/types";
import Loading from "@/components/Loading";
import ConfirmModal from "@/components/ConfirmModal";
import GoogleDriveUploader from "@/components/GoogleDriveUploader";

export default function LivroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [livro, setLivro] = useState<LivroComDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLivroById(Number(id));
        setLivro(data);
      } catch (err) {
        console.error("Erro ao carregar livro:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!livro) return;
    setDeleteLoading(true);
    try {
      await deleteLivro(livro.id);
      router.push("/livros");
    } catch (err) {
      console.error("Erro ao excluir livro:", err);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleUploadFile(link: string, nome: string) {
    if (!livro) return;
    try {
      const novoArquivo = await addArquivo(livro.id, link, "pdf");
      setLivro({
        ...livro,
        arquivos: [novoArquivo, ...livro.arquivos],
      });
    } catch (err) {
      console.error("Erro ao adicionar arquivo:", err);
    }
  }

  async function handleDeleteArquivo(arquivo: Arquivo) {
    if (!livro) return;
    try {
      await deleteArquivo(arquivo);
      setLivro({
        ...livro,
        arquivos: livro.arquivos.filter((a) => a.id !== arquivo.id),
      });
    } catch (err) {
      console.error("Erro ao excluir arquivo:", err);
    }
  }

  if (loading) return <Loading />;
  if (!livro) {
    return (
      <div>
        <Link href="/livros" className="back-link">
          <ArrowLeft size={18} /> Voltar
        </Link>
        <p>Livro não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="livro-detail">
      <Link href="/livros" className="back-link">
        <ArrowLeft size={18} /> Voltar para Livros
      </Link>

      <div className="livro-detail-header">
        {livro.capa ? (
          <img src={livro.capa} alt={livro.titulo} className="livro-detail-capa" />
        ) : (
          <div className="livro-detail-icon">
            <BookOpen size={40} />
          </div>
        )}
        <div className="livro-detail-info">
          <h2>{livro.titulo}</h2>
          {livro.autores.length > 0 && (
            <p className="authors">
              por {livro.autores.map((a) => a.nome).join(", ")}
            </p>
          )}
          {livro.categorias.length > 0 && (
            <div className="tags-list">
              {livro.categorias.map((c) => (
                <span key={c.id} className="tag">
                  {c.nome}
                </span>
              ))}
            </div>
          )}
          <div className="livro-detail-actions">
            <Link href={`/livros/${livro.id}/editar`} className="btn btn-secondary btn-sm">
              <Edit size={16} /> Editar
            </Link>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} /> Excluir
            </button>
          </div>
        </div>
      </div>

      {livro.descricao && (
        <div className="detail-section">
          <h3>Descrição</h3>
          <p className="description-text">{livro.descricao}</p>
        </div>
      )}

      <div className="detail-section">
        <h3>Detalhes</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="label">Ano</span>
            <span className="value">{livro.ano}</span>
          </div>
          <div className="detail-item">
            <span className="label">Editora</span>
            <span className="value">{livro.editora}</span>
          </div>
          <div className="detail-item">
            <span className="label">Páginas</span>
            <span className="value">{livro.paginas}</span>
          </div>
          <div className="detail-item">
            <span className="label">Idioma</span>
            <span className="value">{livro.idioma}</span>
          </div>
          <div className="detail-item">
            <span className="label">Edição</span>
            <span className="value">{livro.edicao}ª</span>
          </div>
          {livro.isbn13 && (
            <div className="detail-item">
              <span className="label">ISBN-13</span>
              <span className="value">{livro.isbn13}</span>
            </div>
          )}
          {livro.isbn10 && (
            <div className="detail-item">
              <span className="label">ISBN-10</span>
              <span className="value">{livro.isbn10}</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3>Arquivos</h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowUploader(!showUploader)}
          >
            {showUploader ? "Fechar" : "Adicionar Arquivo"}
          </button>
        </div>

        {showUploader && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "8px" }}>
            <GoogleDriveUploader onFileUploaded={handleUploadFile} />
          </div>
        )}

        {livro.arquivos.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Nenhum arquivo anexado.
          </p>
        ) : (
          livro.arquivos.map((arquivo) => (
            <div key={arquivo.id} className="arquivo-item">
              <div className="arquivo-item-info">
                <FileText size={20} />
                <span>
                  {arquivo.tipo.toUpperCase()} — Adicionado em{" "}
                  {new Date(arquivo.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="arquivo-item-actions">
                <a
                  href={arquivo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <Download size={14} /> Visualizar
                </a>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleDeleteArquivo(arquivo)}
                  aria-label="Excluir arquivo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Excluir Livro"
        message={`Tem certeza que deseja excluir "${livro.titulo}"? Esta ação não pode ser desfeita. Todos os arquivos serão removidos.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleteLoading}
      />
    </div>
  );
}
