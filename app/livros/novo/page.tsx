"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LivroForm from "@/components/LivroForm";
import type { LivroFormSubmitData } from "@/components/LivroForm";
import { createLivroCompleto } from "@/lib/services";

export default function NovoLivroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: LivroFormSubmitData) {
    setLoading(true);
    setError("");
    try {
      const livro = await createLivroCompleto(
        {
          titulo: data.titulo,
          descricao: data.descricao || undefined,
          ano: data.ano,
          id_editora: data.id_editora ?? null,
          paginas: data.paginas,
          idioma: data.idioma,
          edicao: data.edicao,
          isbn13: data.isbn13 || undefined,
          isbn10: data.isbn10 || undefined,
          id_colecao: data.id_colecao || undefined,
        },
        data.autoresIds,
        data.categoriasIds,
        data.tagsIds,
        data.driveLinks,
        data.capaFile,
      );
      router.push(`/livros/${livro.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Erro ao criar livro:", msg, err);
      setError(`Erro ao cadastrar o livro: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link href="/livros" className="back-link">
        <ArrowLeft size={18} /> Voltar para Livros
      </Link>
      <div className="page-header">
        <h2>Novo Livro</h2>
      </div>
      {error && (
        <div className="toast toast-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <LivroForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
