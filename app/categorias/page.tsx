"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X, Tags } from "lucide-react";
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "@/lib/services";
import type { Categoria } from "@/lib/types";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  async function loadCategorias() {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    try {
      const categoria = await createCategoria(novoNome.trim());
      setCategorias((prev) =>
        [...prev, categoria].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setNovoNome("");
    } catch (err) {
      console.error("Erro ao criar categoria:", err);
    }
  }

  function startEdit(categoria: Categoria) {
    setEditingId(categoria.id);
    setEditingNome(categoria.nome);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingNome("");
  }

  async function handleUpdate() {
    if (!editingId || !editingNome.trim()) return;
    try {
      const updated = await updateCategoria(editingId, editingNome.trim());
      setCategorias((prev) =>
        prev
          .map((c) => (c.id === editingId ? updated : c))
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      cancelEdit();
    } catch (err) {
      console.error("Erro ao atualizar categoria:", err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCategoria(deleteTarget.id);
      setCategorias((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Erro ao excluir categoria:", err);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h2>Categorias</h2>
      </div>

      <form className="inline-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Nome da nova categoria"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">
          <Plus size={16} /> Adicionar
        </button>
      </form>

      {categorias.length === 0 ? (
        <EmptyState
          icon={<Tags size={48} />}
          title="Nenhuma categoria cadastrada"
          description="Adicione categorias para organizar seus livros."
        />
      ) : (
        <div className="list-container">
          {categorias.map((categoria) => (
            <div key={categoria.id} className="list-item">
              {editingId === categoria.id ? (
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
                  <span className="list-item-name">{categoria.nome}</span>
                  <div className="list-item-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => startEdit(categoria)}
                      aria-label="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setDeleteTarget(categoria)}
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
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? As associações com livros serão removidas.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
