"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X, Users } from "lucide-react";
import {
  getAutores,
  createAutor,
  updateAutor,
  deleteAutor,
} from "@/lib/services";
import type { Autor } from "@/lib/types";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";

export default function AutoresPage() {
  const [autores, setAutores] = useState<Autor[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Autor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadAutores();
  }, []);

  async function loadAutores() {
    try {
      const data = await getAutores();
      setAutores(data);
    } catch (err) {
      console.error("Erro ao carregar autores:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    try {
      const autor = await createAutor(novoNome.trim());
      setAutores((prev) => [...prev, autor].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNome("");
    } catch (err) {
      console.error("Erro ao criar autor:", err);
    }
  }

  function startEdit(autor: Autor) {
    setEditingId(autor.id);
    setEditingNome(autor.nome);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingNome("");
  }

  async function handleUpdate() {
    if (!editingId || !editingNome.trim()) return;
    try {
      const updated = await updateAutor(editingId, editingNome.trim());
      setAutores((prev) =>
        prev
          .map((a) => (a.id === editingId ? updated : a))
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      cancelEdit();
    } catch (err) {
      console.error("Erro ao atualizar autor:", err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAutor(deleteTarget.id);
      setAutores((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Erro ao excluir autor:", err);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h2>Autores</h2>
      </div>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Nome do novo autor"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          <Plus size={16} /> Adicionar
        </button>
      </form>

      {autores.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="Nenhum autor cadastrado"
          description="Adicione autores para associá-los aos livros."
        />
      ) : (
        <div className="list-container">
          {autores.map((autor) => (
            <div key={autor.id} className="list-item">
              {editingId === autor.id ? (
                <div className="edit-inline">
                  <input
                    type="text"
                    value={editingNome}
                    onChange={(e) => setEditingNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={handleUpdate}
                    aria-label="Salvar"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={cancelEdit}
                    aria-label="Cancelar"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="list-item-name">{autor.nome}</span>
                  <div className="list-item-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => startEdit(autor)}
                      aria-label="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setDeleteTarget(autor)}
                      aria-label="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Excluir Autor"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? As associações com livros serão removidas.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
