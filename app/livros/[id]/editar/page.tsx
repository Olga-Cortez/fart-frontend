"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LivroForm from "@/components/LivroForm";
import type { LivroFormSubmitData } from "@/components/LivroForm";
import Loading from "@/components/Loading";
import { getLivroById, updateLivroCompleto } from "@/lib/services";
import type { LivroComDetalhes } from "@/lib/types";

export default function EditarLivroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [livro, setLivro] = useState<LivroComDetalhes | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getLivroById(Number(id));
        setLivro(data);
      } catch (err) {
        console.error("Erro ao carregar livro:", err);
      } finally {
        setLoadingPage(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(data: LivroFormSubmitData) {
    setSaving(true);
    setError("");
    try {
      await updateLivroCompleto(
        Number(id),
        {
          titulo: data.titulo,
          descricao: data.descricao || undefined,
          ano: data.ano,
          editora: data.editora,
          paginas: data.paginas,
          idioma: data.idioma,
          edicao: data.edicao,
          isbn13: data.isbn13 || undefined,
          isbn10: data.isbn10 || undefined,
        },
        data.autoresIds,
        data.categoriasIds,
        data.capaFile,
        livro?.capa,
      );
      router.push(`/livros/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Erro ao atualizar livro:", msg, err);
      setError(`Erro ao atualizar o livro: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  if (loadingPage) return <Loading />;

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
    <div>
      <Link href={`/livros/${id}`} className="back-link">
        <ArrowLeft size={18} /> Voltar para o livro
      </Link>
      <div className="page-header">
        <h2>Editar Livro</h2>
      </div>
      {error && (
        <div className="toast toast-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <LivroForm livro={livro} onSubmit={handleSubmit} loading={saving} />
    </div>
  );
}
