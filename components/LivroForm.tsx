"use client";

import { useState, useEffect, useRef } from "react";
import type { Autor, Categoria, LivroComDetalhes } from "@/lib/types";
import { getAutores, getCategorias, createAutor, createCategoria } from "@/lib/services";
import { X, Plus, ImagePlus } from "lucide-react";
import GoogleDriveUploader from "@/components/GoogleDriveUploader";

export interface DriveFileLink {
  link: string;
  nome: string;
}

export interface LivroFormSubmitData {
  titulo: string;
  descricao: string;
  ano: number;
  editora: string;
  paginas: number;
  idioma: string;
  edicao: number;
  isbn13: string;
  isbn10: string;
  autoresIds: number[];
  categoriasIds: number[];
  driveLinks: DriveFileLink[];
  capaFile: File | null;
}

interface LivroFormProps {
  livro?: LivroComDetalhes;
  onSubmit: (data: LivroFormSubmitData) => Promise<void>;
  loading?: boolean;
}

export default function LivroForm({ livro, onSubmit, loading }: LivroFormProps) {
  const [titulo, setTitulo] = useState(livro?.titulo ?? "");
  const [descricao, setDescricao] = useState(livro?.descricao ?? "");
  const [ano, setAno] = useState(livro?.ano ?? new Date().getFullYear());
  const [editora, setEditora] = useState(livro?.editora ?? "");
  const [paginas, setPaginas] = useState(livro?.paginas ?? 0);
  const [idioma, setIdioma] = useState(livro?.idioma ?? "Português");
  const [edicao, setEdicao] = useState(livro?.edicao ?? 1);
  const [isbn13, setIsbn13] = useState(livro?.isbn13 ?? "");
  const [isbn10, setIsbn10] = useState(livro?.isbn10 ?? "");

  const [autores, setAutores] = useState<Autor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedAutores, setSelectedAutores] = useState<number[]>(
    livro?.autores.map((a) => a.id) ?? [],
  );
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>(
    livro?.categorias.map((c) => c.id) ?? [],
  );
  const [driveLinks, setDriveLinks] = useState<DriveFileLink[]>([]);

  // Capa
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(livro?.capa ?? null);
  const capaInputRef = useRef<HTMLInputElement>(null);

  // Criação inline de autores/categorias
  const [novoAutorNome, setNovoAutorNome] = useState("");
  const [criandoAutor, setCriandoAutor] = useState(false);
  const [erroAutor, setErroAutor] = useState("");
  const [novaCatNome, setNovaCatNome] = useState("");
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState("");

  useEffect(() => {
    async function loadData() {
      const [autoresData, categoriasData] = await Promise.all([
        getAutores(),
        getCategorias(),
      ]);
      setAutores(autoresData);
      setCategorias(categoriasData);
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      titulo,
      descricao,
      ano,
      editora,
      paginas,
      idioma,
      edicao,
      isbn13,
      isbn10,
      autoresIds: selectedAutores,
      categoriasIds: selectedCategorias,
      driveLinks,
      capaFile,
    });
  }

  function toggleAutor(id: number) {
    setSelectedAutores((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function toggleCategoria(id: number) {
    setSelectedCategorias((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleDriveFileAdded(link: string, nome: string) {
    setDriveLinks((prev) => [...prev, { link, nome }]);
  }

  function removeDriveLink(index: number) {
    setDriveLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCapaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCapaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCapaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function removeCapa() {
    setCapaFile(null);
    setCapaPreview(null);
    if (capaInputRef.current) capaInputRef.current.value = "";
  }

  async function handleCriarAutor() {
    if (!novoAutorNome.trim()) return;
    setCriandoAutor(true);
    setErroAutor("");
    try {
      const novo = await createAutor(novoAutorNome.trim());
      setAutores((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setSelectedAutores((prev) => [...prev, novo.id]);
      setNovoAutorNome("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : JSON.stringify(err);
      setErroAutor(msg);
      console.error("Erro ao criar autor:", msg);
    } finally {
      setCriandoAutor(false);
    }
  }

  async function handleCriarCategoria() {
    if (!novaCatNome.trim()) return;
    setCriandoCategoria(true);
    setErroCategoria("");
    try {
      const nova = await createCategoria(novaCatNome.trim());
      setCategorias((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      setSelectedCategorias((prev) => [...prev, nova.id]);
      setNovaCatNome("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : JSON.stringify(err);
      setErroCategoria(msg);
      console.error("Erro ao criar categoria:", msg);
    } finally {
      setCriandoCategoria(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="livro-form">
      {/* Capa */}
      <div className="form-section">
        <h3>Capa do Livro</h3>
        <div className="capa-upload-area">
          {capaPreview ? (
            <div className="capa-preview-container">
              <img src={capaPreview} alt="Prévia da capa" className="capa-preview" />
              <button
                type="button"
                className="capa-remove-btn"
                onClick={removeCapa}
                aria-label="Remover capa"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label htmlFor="capa" className="capa-upload-label">
              <ImagePlus size={32} />
              <span>Selecionar capa</span>
              <input
                id="capa"
                ref={capaInputRef}
                type="file"
                accept="image/*"
                onChange={handleCapaChange}
                className="file-input-hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>Informações Básicas</h3>
        <div className="form-grid">
          <div className="form-group form-group-full">
            <label htmlFor="titulo">Título *</label>
            <input
              id="titulo"
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do livro"
            />
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do livro"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editora">Editora *</label>
            <input
              id="editora"
              type="text"
              required
              value={editora}
              onChange={(e) => setEditora(e.target.value)}
              placeholder="Nome da editora"
            />
          </div>

          <div className="form-group">
            <label htmlFor="idioma">Idioma *</label>
            <input
              id="idioma"
              type="text"
              required
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              placeholder="Ex: Português"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ano">Ano *</label>
            <input
              id="ano"
              type="number"
              required
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              min={1400}
              max={2100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edicao">Edição *</label>
            <input
              id="edicao"
              type="number"
              required
              value={edicao}
              onChange={(e) => setEdicao(Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="form-group">
            <label htmlFor="paginas">Páginas *</label>
            <input
              id="paginas"
              type="number"
              required
              value={paginas}
              onChange={(e) => setPaginas(Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="form-group">
            <label htmlFor="isbn13">ISBN-13</label>
            <input
              id="isbn13"
              type="text"
              value={isbn13}
              onChange={(e) => setIsbn13(e.target.value)}
              placeholder="978-..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="isbn10">ISBN-10</label>
            <input
              id="isbn10"
              type="text"
              value={isbn10}
              onChange={(e) => setIsbn10(e.target.value)}
              placeholder="..."
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Autores</h3>
        <div className="inline-create">
          <input
            type="text"
            placeholder="Novo autor..."
            value={novoAutorNome}
            onChange={(e) => setNovoAutorNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCriarAutor();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCriarAutor}
            disabled={criandoAutor || !novoAutorNome.trim()}
          >
            <Plus size={14} /> {criandoAutor ? "..." : "Criar"}
          </button>
        </div>
        {erroAutor && <p className="form-error-text">{erroAutor}</p>}
        {autores.length === 0 ? (
          <p className="form-empty-text">
            Nenhum autor cadastrado. Crie um acima.
          </p>
        ) : (
          <div className="chip-selector">
            {autores.map((autor) => (
              <button
                key={autor.id}
                type="button"
                className={`chip ${selectedAutores.includes(autor.id) ? "chip-selected" : ""}`}
                onClick={() => toggleAutor(autor.id)}
              >
                {autor.nome}
                {selectedAutores.includes(autor.id) && <X size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Categorias</h3>
        <div className="inline-create">
          <input
            type="text"
            placeholder="Nova categoria..."
            value={novaCatNome}
            onChange={(e) => setNovaCatNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCriarCategoria();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCriarCategoria}
            disabled={criandoCategoria || !novaCatNome.trim()}
          >
            <Plus size={14} /> {criandoCategoria ? "..." : "Criar"}
          </button>
        </div>
        {erroCategoria && <p className="form-error-text">{erroCategoria}</p>}
        {categorias.length === 0 ? (
          <p className="form-empty-text">
            Nenhuma categoria cadastrada. Crie uma acima.
          </p>
        ) : (
          <div className="chip-selector">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`chip ${selectedCategorias.includes(cat.id) ? "chip-selected" : ""}`}
                onClick={() => toggleCategoria(cat.id)}
              >
                {cat.nome}
                {selectedCategorias.includes(cat.id) && <X size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {!livro && (
        <div className="form-section">
          <h3>Arquivos (PDF do Google Drive)</h3>
          <GoogleDriveUploader onFileUploaded={handleDriveFileAdded} />
          {driveLinks.length > 0 && (
            <div className="file-list">
              {driveLinks.map((file, index) => (
                <div key={`${file.link}-${index}`} className="file-item">
                  <span>{file.nome}</span>
                  <button
                    type="button"
                    onClick={() => removeDriveLink(index)}
                    className="btn-icon-sm"
                    aria-label="Remover arquivo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Salvando..." : livro ? "Atualizar Livro" : "Cadastrar Livro"}
        </button>
      </div>
    </form>
  );
}
