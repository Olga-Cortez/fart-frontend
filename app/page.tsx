"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Users, Tags, FileText, ArrowRight } from "lucide-react";
import {
  getLivrosRecentes,
  getDashboardStats,
  getLivrosRelacionamentos,
} from "@/lib/services";
import type { Livro, Autor, Categoria } from "@/lib/types";
import LivroCard from "@/components/LivroCard";
import Loading from "@/components/Loading";
import { useAuth } from "@/lib/authContext";

export default function HomePage() {
  const { user } = useAuth();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [livrosCount, setLivrosCount] = useState(0);
  const [autoresCount, setAutoresCount] = useState(0);
  const [categoriasCount, setCategoriasCount] = useState(0);
  const [paginasTotal, setPaginasTotal] = useState(0);
  const [livroAutores, setLivroAutores] = useState<Record<number, Autor[]>>(
    {},
  );
  const [livroCategorias, setLivroCategorias] = useState<
    Record<number, Categoria[]>
  >({});
  const [livroEditoras, setLivroEditoras] = useState<Record<number, { nome: string } | null>>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [recentLivros, dashboardStats] = await Promise.all([
          getLivrosRecentes(6),
          user ? getDashboardStats() : Promise.resolve(null),
        ]);
        setLivros(recentLivros);

        if (dashboardStats) {
          setLivrosCount(dashboardStats.livrosCount);
          setAutoresCount(dashboardStats.autoresCount);
          setCategoriasCount(dashboardStats.categoriasCount);
          setPaginasTotal(dashboardStats.paginasTotal);
        }

        const relacionamentos = await getLivrosRelacionamentos(recentLivros);
        setLivroAutores(relacionamentos.autoresPorLivro);
        setLivroCategorias(relacionamentos.categoriasPorLivro);
        setLivroEditoras(relacionamentos.editorasPorLivro);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h2>{user ? "Painel da Biblioteca" : "Acervo da Biblioteca"}</h2>
      </div>

      {user && <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-card-info">
            <h4>Livros</h4>
            <span className="stat-number">{livrosCount}</span>
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
              {paginasTotal.toLocaleString("pt-BR")}
            </span>
          </div>
        </div>
      </div>}

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Livros Recentes</h3>
          <Link href="/livros">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        {livros.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            Nenhum livro cadastrado ainda.
            {user && (
              <>
                {" "}
                <Link href="/livros/novo" style={{ color: "var(--accent)" }}>
                  Adicionar primeiro livro
                </Link>
              </>
            )}
          </p>
        ) : (
          <div className="livros-grid">
            {livros.slice(0, 6).map((livro) => (
              <LivroCard
                key={livro.id}
                livro={livro}
                autores={livroAutores[livro.id]}
                categorias={livroCategorias[livro.id]}
                editora={livroEditoras[livro.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
