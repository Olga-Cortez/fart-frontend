"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Users, Tags, FileText, ArrowRight } from "lucide-react";
import {
  getLivros,
  getAutores,
  getCategorias,
  getAutoresByLivro,
  getCategoriasByLivro,
} from "@/lib/services";
import type { Livro, Autor, Categoria } from "@/lib/types";
import LivroCard from "@/components/LivroCard";
import Loading from "@/components/Loading";

export default function HomePage() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [autoresCount, setAutoresCount] = useState(0);
  const [categoriasCount, setCategoriasCount] = useState(0);
  const [livroAutores, setLivroAutores] = useState<Record<number, Autor[]>>(
    {},
  );
  const [livroCategorias, setLivroCategorias] = useState<
    Record<number, Categoria[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [livrosData, autoresData, categoriasData] = await Promise.all([
          getLivros(),
          getAutores(),
          getCategorias(),
        ]);
        setLivros(livrosData);
        setAutoresCount(autoresData.length);
        setCategoriasCount(categoriasData.length);

        const recentLivros = livrosData.slice(0, 6);
        const autoresMap: Record<number, Autor[]> = {};
        const categoriasMap: Record<number, Categoria[]> = {};

        await Promise.all(
          recentLivros.map(async (livro) => {
            const [autores, categorias] = await Promise.all([
              getAutoresByLivro(livro.id),
              getCategoriasByLivro(livro.id),
            ]);
            autoresMap[livro.id] = autores;
            categoriasMap[livro.id] = categorias;
          }),
        );

        setLivroAutores(autoresMap);
        setLivroCategorias(categoriasMap);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h2>Painel da Biblioteca</h2>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-card-info">
            <h4>Livros</h4>
            <span className="stat-number">{livros.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green">
            <Users size={24} />
          </div>
          <div className="stat-card-info">
            <h4>Autores</h4>
            <span className="stat-number">{autoresCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple">
            <Tags size={24} />
          </div>
          <div className="stat-card-info">
            <h4>Categorias</h4>
            <span className="stat-number">{categoriasCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange">
            <FileText size={24} />
          </div>
          <div className="stat-card-info">
            <h4>Páginas Total</h4>
            <span className="stat-number">
              {livros
                .reduce((acc, l) => acc + l.paginas, 0)
                .toLocaleString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Livros Recentes</h3>
          <Link href="/livros">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        {livros.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            Nenhum livro cadastrado ainda.{" "}
            <Link href="/livros/novo" style={{ color: "var(--accent)" }}>
              Adicionar primeiro livro
            </Link>
          </p>
        ) : (
          <div className="livros-grid">
            {livros.slice(0, 6).map((livro) => (
              <LivroCard
                key={livro.id}
                livro={livro}
                autores={livroAutores[livro.id]}
                categorias={livroCategorias[livro.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
