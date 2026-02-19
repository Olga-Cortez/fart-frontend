"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import {
  getLivros,
  searchLivros,
  getAutoresByLivro,
  getCategoriasByLivro,
  getAutores,
  getCategorias,
  getLivrosByAutor,
  getLivrosByCategoria,
  getEditoraById,
} from "@/lib/services";
import type { Livro, Autor, Categoria } from "@/lib/types";
import LivroCard from "@/components/LivroCard";
import SearchBar from "@/components/SearchBar";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";

export default function LivrosPage() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [livroAutores, setLivroAutores] = useState<Record<number, Autor[]>>(
    {},
  );
  const [livroCategorias, setLivroCategorias] = useState<
    Record<number, Categoria[]>
  >({});
  const [livroEditoras, setLivroEditoras] = useState<Record<number, { nome: string } | null>>({});
  const [autores, setAutores] = useState<Autor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAutor, setFilterAutor] = useState<number | "">("");
  const [filterCategoria, setFilterCategoria] = useState<number | "">("");

  const loadLivroDetails = useCallback(async (livrosData: Livro[]) => {
    const autoresMap: Record<number, Autor[]> = {};
    const categoriasMap: Record<number, Categoria[]> = {};
    const editorasMap: Record<number, { nome: string } | null> = {};

    await Promise.all(
      livrosData.map(async (livro) => {
        const [autores, categorias] = await Promise.all([
          getAutoresByLivro(livro.id),
          getCategoriasByLivro(livro.id),
        ]);
        autoresMap[livro.id] = autores;
        categoriasMap[livro.id] = categorias;

        try {
          // livro now uses `id_editora` as FK
          const idEditora = (livro as any).id_editora;
            if (idEditora) {
              const editora = await getEditoraById(idEditora);
              editorasMap[livro.id] = editora ? { nome: editora.nome } : null;
            } else {
              editorasMap[livro.id] = null;
            }
        } catch (e) {
          console.error("Erro ao carregar editora:", (e as any)?.message ?? e, e);
          editorasMap[livro.id] = null;
        }
      }),
    );

    setLivroAutores(autoresMap);
    setLivroCategorias(categoriasMap);
    setLivroEditoras(editorasMap);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [livrosData, autoresData, categoriasData] = await Promise.all([
          getLivros(),
          getAutores(),
          getCategorias(),
        ]);
        setLivros(livrosData);
        setAutores(autoresData);
        setCategorias(categoriasData);
        await loadLivroDetails(livrosData);
      } catch (err) {
        console.error("Erro ao carregar livros:", (err as any)?.message ?? err, err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadLivroDetails]);

  async function handleSearch(query: string) {
    setLoading(true);
    setFilterAutor("");
    setFilterCategoria("");
    try {
      const data = query ? await searchLivros(query) : await getLivros();
      setLivros(data);
      await loadLivroDetails(data);
    } catch (err) {
      console.error("Erro na busca:", (err as any)?.message ?? err, err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilterAutor(autorId: number | "") {
    setFilterAutor(autorId);
    setFilterCategoria("");
    setLoading(true);
    try {
      const data =
        autorId === "" ? await getLivros() : await getLivrosByAutor(autorId);
      setLivros(data);
      await loadLivroDetails(data);
    } catch (err) {
      console.error("Erro ao filtrar:", (err as any)?.message ?? err, err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilterCategoria(categoriaId: number | "") {
    setFilterCategoria(categoriaId);
    setFilterAutor("");
    setLoading(true);
    try {
      const data =
        categoriaId === ""
          ? await getLivros()
          : await getLivrosByCategoria(categoriaId);
      setLivros(data);
      await loadLivroDetails(data);
    } catch (err) {
      console.error("Erro ao filtrar:", (err as any)?.message ?? err, err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h2>Livros</h2>
        <div className="page-header-actions">
          <SearchBar
            placeholder="Buscar por título, editora, ISBN..."
            onSearch={handleSearch}
          />
          <Link href="/livros/novo" className="btn btn-primary">
            <Plus size={18} />
            Novo Livro
          </Link>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={filterAutor}
          onChange={(e) =>
            handleFilterAutor(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">Todos os autores</option>
          {autores.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        <select
          value={filterCategoria}
          onChange={(e) =>
            handleFilterCategoria(
              e.target.value === "" ? "" : Number(e.target.value),
            )
          }
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {livros.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Nenhum livro encontrado"
          description="Comece adicionando seu primeiro livro à biblioteca."
          action={
            <Link href="/livros/novo" className="btn btn-primary">
              <Plus size={18} />
              Adicionar Livro
            </Link>
          }
        />
      ) : (
        <div className="livros-grid">
          {livros.map((livro) => (
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
  );
}
