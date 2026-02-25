"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import {
  getLivrosFiltrados,
  getLivrosRelacionamentos,
  searchAutores,
  searchCategorias,
  searchEditoras,
} from "@/lib/services";
import type { Livro, Autor, Categoria } from "@/lib/types";
import LivroCard from "@/components/LivroCard";
import SearchBar from "@/components/SearchBar";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/authContext";

type Option = { id: number; nome: string };

export default function LivrosPage() {
  const { user } = useAuth();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [livroAutores, setLivroAutores] = useState<Record<number, Autor[]>>({});
  const [livroCategorias, setLivroCategorias] = useState<Record<number, Categoria[]>>({});
  const [livroEditoras, setLivroEditoras] = useState<Record<number, { nome: string } | null>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [filterAutor, setFilterAutor] = useState<Option | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<Option | null>(null);
  const [filterEditora, setFilterEditora] = useState<Option | null>(null);

  const [autorTerm, setAutorTerm] = useState("");
  const [categoriaTerm, setCategoriaTerm] = useState("");
  const [editoraTerm, setEditoraTerm] = useState("");

  const [showAutorInput, setShowAutorInput] = useState(false);
  const [showCategoriaInput, setShowCategoriaInput] = useState(false);
  const [showEditoraInput, setShowEditoraInput] = useState(false);

  const autorDropdownRef = useRef<HTMLDivElement>(null);
  const categoriaDropdownRef = useRef<HTMLDivElement>(null);
  const editoraDropdownRef = useRef<HTMLDivElement>(null);

  const [autorSuggestions, setAutorSuggestions] = useState<Option[]>([]);
  const [categoriaSuggestions, setCategoriaSuggestions] = useState<Option[]>([]);
  const [editoraSuggestions, setEditoraSuggestions] = useState<Option[]>([]);

  const loadLivros = useCallback(
    async (params?: {
      query?: string;
      autorId?: number | null;
      categoriaId?: number | null;
      editoraId?: number | null;
    }) => {
      setLoading(true);
      try {
        const data = await getLivrosFiltrados({
          query: params?.query,
          autorId: params?.autorId,
          categoriaId: params?.categoriaId,
          editoraId: params?.editoraId,
          limit: 60,
        });

        setLivros(data);
        const relacionamentos = await getLivrosRelacionamentos(data);
        setLivroAutores(relacionamentos.autoresPorLivro);
        setLivroCategorias(relacionamentos.categoriasPorLivro);
        setLivroEditoras(relacionamentos.editorasPorLivro);
      } catch (err) {
        console.error("Erro ao carregar livros:", (err as any)?.message ?? err, err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadLivros();
  }, [loadLivros]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (autorDropdownRef.current && !autorDropdownRef.current.contains(target)) {
        setShowAutorInput(false);
      }

      if (
        categoriaDropdownRef.current &&
        !categoriaDropdownRef.current.contains(target)
      ) {
        setShowCategoriaInput(false);
      }

      if (editoraDropdownRef.current && !editoraDropdownRef.current.contains(target)) {
        setShowEditoraInput(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!autorTerm.trim() || filterAutor?.nome === autorTerm) {
        setAutorSuggestions([]);
        return;
      }
      try {
        const data = await searchAutores(autorTerm, 8);
        setAutorSuggestions(data.map((item) => ({ id: item.id, nome: item.nome })));
      } catch (err) {
        console.error("Erro ao buscar autores:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [autorTerm, filterAutor]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!categoriaTerm.trim() || filterCategoria?.nome === categoriaTerm) {
        setCategoriaSuggestions([]);
        return;
      }
      try {
        const data = await searchCategorias(categoriaTerm, 8);
        setCategoriaSuggestions(data.map((item) => ({ id: item.id, nome: item.nome })));
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [categoriaTerm, filterCategoria]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!editoraTerm.trim() || filterEditora?.nome === editoraTerm) {
        setEditoraSuggestions([]);
        return;
      }
      try {
        const data = await searchEditoras(editoraTerm, 8);
        setEditoraSuggestions(data.map((item) => ({ id: item.id, nome: item.nome })));
      } catch (err) {
        console.error("Erro ao buscar editoras:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [editoraTerm, filterEditora]);

  async function handleSearch(query: string) {
    setSearchQuery(query);
    await loadLivros({
      query,
      autorId: filterAutor?.id,
      categoriaId: filterCategoria?.id,
      editoraId: filterEditora?.id,
    });
  }

  async function applyFilters(
    nextAutor: Option | null,
    nextCategoria: Option | null,
    nextEditora: Option | null,
  ) {
    await loadLivros({
      query: searchQuery,
      autorId: nextAutor?.id,
      categoriaId: nextCategoria?.id,
      editoraId: nextEditora?.id,
    });
  }

  async function clearFilters() {
    const hadActiveFilters = Boolean(filterAutor || filterCategoria || filterEditora);

    setFilterAutor(null);
    setFilterCategoria(null);
    setFilterEditora(null);
    setAutorTerm("");
    setCategoriaTerm("");
    setEditoraTerm("");
    setAutorSuggestions([]);
    setCategoriaSuggestions([]);
    setEditoraSuggestions([]);
    setShowAutorInput(false);
    setShowCategoriaInput(false);
    setShowEditoraInput(false);

    if (hadActiveFilters) {
      await loadLivros({ query: searchQuery });
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
          {user && (
            <Link href="/livros/novo" className="btn btn-primary">
              <Plus size={18} />
              Novo Livro
            </Link>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-autocomplete" ref={autorDropdownRef}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAutorInput((prev) => !prev)}
          >
            {filterAutor ? `Autor: ${filterAutor.nome}` : "Filtrar por autor"}
          </button>
          {showAutorInput && (
            <div className="filter-dropdown-panel">
              <input
                type="text"
                placeholder="Filtrar por autor"
                value={autorTerm}
                onChange={(e) => {
                  const v = e.target.value;
                  setAutorTerm(v);
                  if (!v && filterAutor) {
                    setFilterAutor(null);
                    applyFilters(null, filterCategoria, filterEditora);
                  }
                }}
              />
              {autorSuggestions.length > 0 && (
                <ul className="filter-autocomplete-list">
                  {autorSuggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterAutor(item);
                          setAutorTerm(item.nome);
                          setAutorSuggestions([]);
                          setShowAutorInput(false);
                          applyFilters(item, filterCategoria, filterEditora);
                        }}
                      >
                        {item.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="filter-autocomplete" ref={categoriaDropdownRef}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCategoriaInput((prev) => !prev)}
          >
            {filterCategoria ? `Categoria: ${filterCategoria.nome}` : "Filtrar por categoria"}
          </button>
          {showCategoriaInput && (
            <div className="filter-dropdown-panel">
              <input
                type="text"
                placeholder="Filtrar por categoria"
                value={categoriaTerm}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoriaTerm(v);
                  if (!v && filterCategoria) {
                    setFilterCategoria(null);
                    applyFilters(filterAutor, null, filterEditora);
                  }
                }}
              />
              {categoriaSuggestions.length > 0 && (
                <ul className="filter-autocomplete-list">
                  {categoriaSuggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCategoria(item);
                          setCategoriaTerm(item.nome);
                          setCategoriaSuggestions([]);
                          setShowCategoriaInput(false);
                          applyFilters(filterAutor, item, filterEditora);
                        }}
                      >
                        {item.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="filter-autocomplete" ref={editoraDropdownRef}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowEditoraInput((prev) => !prev)}
          >
            {filterEditora ? `Editora: ${filterEditora.nome}` : "Filtrar por editora"}
          </button>
          {showEditoraInput && (
            <div className="filter-dropdown-panel">
              <input
                type="text"
                placeholder="Filtrar por editora"
                value={editoraTerm}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditoraTerm(v);
                  if (!v && filterEditora) {
                    setFilterEditora(null);
                    applyFilters(filterAutor, filterCategoria, null);
                  }
                }}
              />
              {editoraSuggestions.length > 0 && (
                <ul className="filter-autocomplete-list">
                  {editoraSuggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterEditora(item);
                          setEditoraTerm(item.nome);
                          setEditoraSuggestions([]);
                          setShowEditoraInput(false);
                          applyFilters(filterAutor, filterCategoria, item);
                        }}
                      >
                        {item.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
          Limpar filtros
        </button>
      </div>

      {livros.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Nenhum livro encontrado"
          description="Comece adicionando seu primeiro livro à biblioteca."
          action={
            user ? (
              <Link href="/livros/novo" className="btn btn-primary">
                <Plus size={18} />
                Adicionar Livro
              </Link>
            ) : undefined
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
