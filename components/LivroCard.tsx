"use client";

import type { Livro, Autor, Categoria } from "@/lib/types";
import Link from "next/link";
import { BookOpen, Calendar, Building2, FileText } from "lucide-react";

interface LivroCardProps {
  livro: Livro;
  autores?: Autor[];
  categorias?: Categoria[];
  editora?: { nome: string } | null;
}

export default function LivroCard({
  livro,
  editora,
  autores = [],
  categorias = [],
}: LivroCardProps) {
  return (
    <Link href={`/livros/${livro.id}`} className="livro-card">
      {livro.capa ? (
        <figure><img src={livro.capa} alt={livro.titulo} className="livro-card-capa" /></figure>
      ) : (
        <div className="livro-card-icon">
          <BookOpen size={32} />
        </div>
      )}
      <div className="livro-card-content">
        <h3 className="livro-card-title">{livro.titulo}</h3>
        {autores.length > 0 && (
          <p className="livro-card-authors">
            {autores.map((a) => a.nome).join(", ")}
          </p>
        )}
        <div className="livro-card-meta">
          <span>
            <Calendar size={14} /> {livro.ano}
          </span>
          <span>
            <Building2 size={14} /> {editora?.nome ?? ""}
          </span>
          <span>
            <FileText size={14} /> {livro.paginas} págs.
          </span>
        </div>
        {categorias.length > 0 && (
          <p className="livro-card-categorias">
            {categorias.map((c) => c.nome).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
