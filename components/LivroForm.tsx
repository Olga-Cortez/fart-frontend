"use client";

import { useState, useEffect, useRef } from "react";
import type { Autor, Categoria, LivroComDetalhes, Tag } from "@/lib/types";
import {
  getAutores,
  getCategorias,
  createAutor,
  createCategoria,
  getEditoras,
  createEditora,
  createColecao,
  getColecoes,
  getTags,
  createTag,
  getLivroFromGoogleBooks,
} from "@/lib/services";
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
  id_editora?: number | null;
  paginas: number;
  idioma: string;
  edicao: number;
  isbn13: string;
  isbn10: string;
  id_colecao?: number | null;
  subtitulo: string | null;
  autoresIds: number[];
  categoriasIds: number[];
  tagsIds: number[];
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
  const [subtitulo, setSubtitulo] = useState(livro?.subtitulo ?? "");
  const [descricao, setDescricao] = useState(livro?.descricao ?? "");
  const [ano, setAno] = useState(livro?.ano ?? new Date().getFullYear());
  const [idEditora, setIdEditora] = useState<number | undefined>(
    (livro as any)?.id_editora ?? undefined,
  );
  const [idColecao, setIdColecao] = useState<number | undefined>(
    (livro as any)?.id_colecao ?? undefined,
  );
  const [editoras, setEditoras] = useState<{ id: number; nome: string }[]>([]);
  const [novoEditoraNome, setNovoEditoraNome] = useState("");
  const [editoraSuggestions, setEditoraSuggestions] = useState<{ id: number; nome: string }[]>([]);
  const [criandoEditora, setCriandoEditora] = useState(false);
  const [erroEditora, setErroEditora] = useState("");
  const [paginas, setPaginas] = useState(livro?.paginas ?? 0);
  const [idioma, setIdioma] = useState(livro?.idioma ?? "Português");
  const [edicao, setEdicao] = useState(livro?.edicao ?? 1);
  const [isbn13, setIsbn13] = useState(livro?.isbn13 ?? "");
  const [isbn10, setIsbn10] = useState(livro?.isbn10 ?? "");
  const [buscandoGoogleBooks, setBuscandoGoogleBooks] = useState(false);
  const [erroBuscaGoogleBooks, setErroBuscaGoogleBooks] = useState("");

  const [autores, setAutores] = useState<Autor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedAutores, setSelectedAutores] = useState<number[]>(
    livro?.autores.map((a) => a.id) ?? [],
  );
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>(
    livro?.categorias.map((c) => c.id) ?? [],
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    livro?.tags?.map((t) => t.id) ?? [],
  );
  const [driveLinks, setDriveLinks] = useState<DriveFileLink[]>(
    (livro as any)?.arquivos
      ? (livro as any).arquivos.map((a: any) => ({
          link: a.link,
          nome: a.link.split("/").pop() || a.link,
        }))
      : [],
  );

  // Autocomplete state
  const [autorQuery, setAutorQuery] = useState("");
  const [categoriaQuery, setCategoriaQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [autorSuggestions, setAutorSuggestions] = useState<Autor[]>([]);
  const [categoriaSuggestions, setCategoriaSuggestions] = useState<Categoria[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [isAutorSuggestionsOpen, setIsAutorSuggestionsOpen] = useState(false);
  const [isCategoriaSuggestionsOpen, setIsCategoriaSuggestionsOpen] = useState(false);
  const [isTagSuggestionsOpen, setIsTagSuggestionsOpen] = useState(false);
  const [isEditoraSuggestionsOpen, setIsEditoraSuggestionsOpen] = useState(false);
  const autorInputRef = useRef<HTMLInputElement>(null);
  const categoriaInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const editoraInputRef = useRef<HTMLInputElement>(null);
  const autorAutocompleteRef = useRef<HTMLDivElement>(null);
  const categoriaAutocompleteRef = useRef<HTMLDivElement>(null);
  const tagAutocompleteRef = useRef<HTMLDivElement>(null);
  const editoraAutocompleteRef = useRef<HTMLDivElement>(null);

  // Capa
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(livro?.capa ?? null);
  const [isDraggingCapa, setIsDraggingCapa] = useState(false);
  const [erroCapa, setErroCapa] = useState("");
  const capaInputRef = useRef<HTMLInputElement>(null);

  // Criação inline de autores/categorias
  const [criandoAutor, setCriandoAutor] = useState(false);
  const [erroAutor, setErroAutor] = useState("");
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState("");
  const [criandoTag, setCriandoTag] = useState(false);
  const [erroTag, setErroTag] = useState("");
  const [novoColecaoNome, setNovoColecaoNome] = useState("");
  const [criandoColecao, setCriandoColecao] = useState(false);
  const [erroColecao, setErroColecao] = useState("");
  const [colecoes, setColecoes] = useState<{ id: number; nome: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      const [autoresData, categoriasData, editorasData, colecoesData, tagsData] = await Promise.all([
        getAutores(),
        getCategorias(),
        getEditoras(),
        getColecoes(),
        getTags(),
      ]);
      setAutores(autoresData);
      setCategorias(categoriasData);
      setTags(tagsData);
      setAutorSuggestions(autoresData);
      setCategoriaSuggestions(categoriasData);
      setTagSuggestions(tagsData);
      setEditoras(editorasData || []);
      setColecoes(colecoesData || []);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!novoEditoraNome.trim()) {
      setEditoraSuggestions(editoras);
      return;
    }
    const q = novoEditoraNome.toLowerCase();
    setEditoraSuggestions(
      editoras.filter((e) => e.nome.toLowerCase().includes(q)).slice(0, 8),
    );
  }, [novoEditoraNome, editoras]);

  useEffect(() => {
    if (!autorQuery.trim()) {
      setAutorSuggestions(autores);
      return;
    }
    const q = autorQuery.toLowerCase();
    setAutorSuggestions(
      autores.filter((a) => a.nome.toLowerCase().includes(q)).slice(0, 8),
    );
  }, [autorQuery, autores]);

  useEffect(() => {
    if (!categoriaQuery.trim()) {
      setCategoriaSuggestions(categorias);
      return;
    }
    const q = categoriaQuery.toLowerCase();
    setCategoriaSuggestions(
      categorias.filter((c) => c.nome.toLowerCase().includes(q)).slice(0, 8),
    );
  }, [categoriaQuery, categorias]);

  useEffect(() => {
    if (!tagQuery.trim()) {
      setTagSuggestions(tags);
      return;
    }
    const q = tagQuery.toLowerCase();
    setTagSuggestions(tags.filter((t) => t.nome.toLowerCase().includes(q)).slice(0, 8));
  }, [tagQuery, tags]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;

      if (!autorAutocompleteRef.current?.contains(target)) {
        setIsAutorSuggestionsOpen(false);
      }

      if (!categoriaAutocompleteRef.current?.contains(target)) {
        setIsCategoriaSuggestionsOpen(false);
      }

      if (!tagAutocompleteRef.current?.contains(target)) {
        setIsTagSuggestionsOpen(false);
      }

      if (!editoraAutocompleteRef.current?.contains(target)) {
        setIsEditoraSuggestionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      titulo,
      descricao,
      ano,
      id_editora: idEditora,
      paginas,
      idioma,
      edicao,
      isbn13,
      isbn10,
      id_colecao: idColecao,
      subtitulo,
      autoresIds: selectedAutores,
      categoriasIds: selectedCategorias,
      tagsIds: selectedTags,
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

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((tagId) => tagId !== id) : [...prev, id],
    );
  }

  // Expose selected IDs as hidden inputs for form submission if needed

  function handleDriveFileAdded(link: string, nome: string) {
    setDriveLinks((prev) => [...prev, { link, nome }]);
  }

  function removeDriveLink(index: number) {
    setDriveLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function processCapaFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErroCapa("Selecione uma imagem válida para a capa.");
      return;
    }

    setErroCapa("");
    setCapaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCapaPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCapaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processCapaFile(file);
    }
  }

  function handleCapaDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingCapa(true);
  }

  function handleCapaDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingCapa(false);
    }
  }

  function handleCapaDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingCapa(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCapaFile(file);
    }
  }

  function removeCapa() {
    setCapaFile(null);
    setCapaPreview(null);
    setErroCapa("");
    if (capaInputRef.current) capaInputRef.current.value = "";
  }

  async function aplicarThumbnailComoCapa(thumbnailUrl?: string) {
    if (!thumbnailUrl) return;

    const normalizedUrl = thumbnailUrl.replace(/^http:/i, "https:");
    setCapaPreview(normalizedUrl);
    setErroCapa("");

    try {
      const response = await fetch(
        `/api/google-books-thumbnail?url=${encodeURIComponent(normalizedUrl)}`,
      );
      if (!response.ok) {
        throw new Error(`Falha ao baixar thumbnail (${response.status})`);
      }

      const blob = await response.blob();
      const extensionByType: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const ext = extensionByType[blob.type] ?? "jpg";
      const file = new File([blob], `capa-google-books.${ext}`, {
        type: blob.type || "image/jpeg",
      });

      setCapaFile(file);
      setErroCapa("");
    } catch (error) {
      console.error("Erro ao carregar thumbnail como capa:", error);
      setCapaFile(null);
    }
  }

  function normalizePublisherName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ");
  }

  function normalizeCollectionName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/["'“”‘’]/g, "")
      .replace(/\s+/g, " ");
  }

  function normalizeSearchText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/["'“”‘’]/g, "")
      .replace(/\s+/g, " ");
  }

  function findSimilarItem<T extends { nome: string }>(items: T[], rawQuery: string): T | null {
    const query = normalizeSearchText(rawQuery);
    if (!query) return null;

    return (
      items.find((item) => {
        const value = normalizeSearchText(item.nome);
        return value === query || value.includes(query) || query.includes(value);
      }) ?? null
    );
  }

  function extrairEditoraEColecao(rawPublisher: string): {
    publisherName: string;
    collectionFromPublisher: string;
  } {
    const publisher = rawPublisher.trim();
    if (!publisher) {
      return { publisherName: "", collectionFromPublisher: "" };
    }

    const patterns: RegExp[] = [
      /^(.*?)\s*[-–—|]\s*(?:cole[cç][aã]o|s[eé]rie)\s*[:\-]?\s*(.+)$/i,
      /^(.*?)\s*\((?:cole[cç][aã]o|s[eé]rie)\s*[:\-]?\s*([^)]+)\)$/i,
    ];

    for (const pattern of patterns) {
      const match = publisher.match(pattern);
      if (match) {
        return {
          publisherName: match[1].trim(),
          collectionFromPublisher: match[2].trim(),
        };
      }
    }

    return { publisherName: publisher, collectionFromPublisher: "" };
  }

  function extrairColecaoDoSubtitulo(subtitle?: string): string {
    const value = subtitle?.trim();
    if (!value) return "";

    const patterns: RegExp[] = [
      /(?:cole[cç][aã]o|s[eé]rie)\s*[:\-]\s*([^,;|]+)/i,
      /\((?:cole[cç][aã]o|s[eé]rie)\s*[:\-]?\s*([^)]+)\)/i,
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return "";
  }

  async function handleCriarAutor(nomeInput?: string) {
    const nome = (nomeInput ?? autorQuery).trim();
    if (!nome) return;
    setCriandoAutor(true);
    setErroAutor("");
    try {
      const novo = await createAutor(nome);
      setAutores((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setSelectedAutores((prev) => [...prev, novo.id]);
      setAutorQuery("");
      setIsAutorSuggestionsOpen(false);
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

  async function handleCriarCategoria(nomeInput?: string) {
    const nome = (nomeInput ?? categoriaQuery).trim();
    if (!nome) return;
    setCriandoCategoria(true);
    setErroCategoria("");
    try {
      const nova = await createCategoria(nome);
      setCategorias((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      setSelectedCategorias((prev) => [...prev, nova.id]);
      setCategoriaQuery("");
      setIsCategoriaSuggestionsOpen(false);
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

  async function handleCriarTag(nomeInput?: string) {
    const nome = (nomeInput ?? tagQuery).trim();
    if (!nome) return;
    setCriandoTag(true);
    setErroTag("");
    try {
      const nova = await createTag(nome);
      setTags((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      setSelectedTags((prev) => [...prev, nova.id]);
      setTagQuery("");
      setIsTagSuggestionsOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : JSON.stringify(err);
      setErroTag(msg);
      console.error("Erro ao criar tag:", msg);
    } finally {
      setCriandoTag(false);
    }
  }

  async function handleCriarEditora(nomeInput?: string) {
    const nome = (nomeInput ?? novoEditoraNome).trim();
    if (!nome) return;
    setCriandoEditora(true);
    setErroEditora("");
    try {
      const nova = await createEditora(nome);
      setEditoras((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      setIdEditora(nova.id);
      setNovoEditoraNome("");
      setIsEditoraSuggestionsOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setErroEditora(msg);
      console.error("Erro ao criar editora:", msg);
    } finally {
      setCriandoEditora(false);
    }
  }

  async function handleCriarColecao() {
    if (!novoColecaoNome.trim()) return;
    setCriandoColecao(true);
    setErroColecao("");
    try {
      const nova = await createColecao(novoColecaoNome.trim());
      setColecoes((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      setIdColecao(nova.id);
      setNovoColecaoNome("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setErroColecao(msg);
      console.error("Erro ao criar coleção:", msg);
    } finally {
      setCriandoColecao(false);
    }
  }

  async function handleSubmitAutorInput() {
    const query = autorQuery.trim();
    if (!query) return;

    const similar = findSimilarItem(autores, query);
    if (similar) {
      if (!selectedAutores.includes(similar.id)) {
        setSelectedAutores((prev) => [...prev, similar.id]);
      }
      setAutorQuery("");
      setIsAutorSuggestionsOpen(false);
      return;
    }

    await handleCriarAutor(query);
  }

  async function handleSubmitCategoriaInput() {
    const query = categoriaQuery.trim();
    if (!query) return;

    const similar = findSimilarItem(categorias, query);
    if (similar) {
      if (!selectedCategorias.includes(similar.id)) {
        setSelectedCategorias((prev) => [...prev, similar.id]);
      }
      setCategoriaQuery("");
      setIsCategoriaSuggestionsOpen(false);
      return;
    }

    await handleCriarCategoria(query);
  }

  async function handleSubmitTagInput() {
    const query = tagQuery.trim();
    if (!query) return;

    const similar = findSimilarItem(tags, query);
    if (similar) {
      if (!selectedTags.includes(similar.id)) {
        setSelectedTags((prev) => [...prev, similar.id]);
      }
      setTagQuery("");
      setIsTagSuggestionsOpen(false);
      return;
    }

    await handleCriarTag(query);
  }

  async function handleSubmitEditoraInput() {
    const query = novoEditoraNome.trim();
    if (!query) return;

    const similar = findSimilarItem(editoras, query);
    if (similar) {
      setIdEditora(similar.id);
      setNovoEditoraNome("");
      setIsEditoraSuggestionsOpen(false);
      return;
    }

    await handleCriarEditora(query);
  }

  const autorSimilar = findSimilarItem(autores, autorQuery);
  const categoriaSimilar = findSimilarItem(categorias, categoriaQuery);
  const tagSimilar = findSimilarItem(tags, tagQuery);
  const editoraSimilar = findSimilarItem(editoras, novoEditoraNome);
  const categoriasRecentes = [...categorias]
    .sort((a, b) => b.id - a.id)
    .slice(0, 10)
    .map((item) => item.nome);
  const tagsRecentes = [...tags]
    .sort((a, b) => b.id - a.id)
    .slice(0, 10)
    .map((item) => item.nome);

  function normalizeAuthorName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ");
  }

  async function handleBuscarPorIsbn() {
    const isbnToSearch = (isbn13 || isbn10).replace(/[^0-9Xx]/g, "");

    if (!isbnToSearch) {
      setErroBuscaGoogleBooks("Informe ISBN-13 ou ISBN-10 para pesquisar.");
      return;
    }

    setBuscandoGoogleBooks(true);
    setErroBuscaGoogleBooks("");

    try {
      const bookData = await getLivroFromGoogleBooks(isbnToSearch);

      if (!bookData) {
        setErroBuscaGoogleBooks("Nenhum livro encontrado para esse ISBN.");
        return;
      }

      setTitulo(bookData.title || "");
      setSubtitulo(bookData.subtitle || "");
      setDescricao(bookData.description || "");
      setPaginas(bookData.pageCount || 0);
      setIdioma(bookData.language || "Português");

      const { publisherName, collectionFromPublisher } = extrairEditoraEColecao(
        bookData.publisher || "",
      );

      if (publisherName) {
        const normalizedPublisher = normalizePublisherName(publisherName);

        const editoraExistente = editoras.find(
          (item) => normalizePublisherName(item.nome) === normalizedPublisher,
        );

        if (editoraExistente) {
          setIdEditora(editoraExistente.id);
        } else {
          try {
            const novaEditora = await createEditora(publisherName);
            setEditoras((prev) =>
              [...prev, novaEditora].sort((a, b) => a.nome.localeCompare(b.nome)),
            );
            setIdEditora(novaEditora.id);
          } catch {
            const editorasAtualizadas = await getEditoras();
            setEditoras(editorasAtualizadas || []);
            const recuperada = (editorasAtualizadas || []).find(
              (item) => normalizePublisherName(item.nome) === normalizedPublisher,
            );
            if (recuperada) {
              setIdEditora(recuperada.id);
            }
          }
        }
      }

      const colecaoDetectada =
        bookData.collectionName?.trim() ||
        collectionFromPublisher ||
        extrairColecaoDoSubtitulo(bookData.subtitle);

      if (colecaoDetectada) {
        const normalizedColecao = normalizeCollectionName(colecaoDetectada);

        const colecaoExistente = colecoes.find(
          (item) => normalizeCollectionName(item.nome) === normalizedColecao,
        );

        if (colecaoExistente) {
          setIdColecao(colecaoExistente.id);
        } else {
          try {
            const novaColecao = await createColecao(colecaoDetectada);
            setColecoes((prev) =>
              [...prev, novaColecao].sort((a, b) => a.nome.localeCompare(b.nome)),
            );
            setIdColecao(novaColecao.id);
          } catch {
            const colecoesAtualizadas = await getColecoes();
            setColecoes(colecoesAtualizadas || []);
            const recuperada = (colecoesAtualizadas || []).find(
              (item) => normalizeCollectionName(item.nome) === normalizedColecao,
            );
            if (recuperada) {
              setIdColecao(recuperada.id);
            }
          }
        }
      }

      await aplicarThumbnailComoCapa(bookData.thumbnail);

      const anoEncontrado = Number.parseInt(bookData.publishedDate?.slice(0, 4) || "", 10);
      if (!Number.isNaN(anoEncontrado)) {
        setAno(anoEncontrado);
      }

      if (bookData.authors?.length > 0) {
        const autoresAtualizados = [...autores];
        const autoresParaSelecionar: number[] = [];

        for (const authorName of bookData.authors) {
          const nomeAutor = authorName.trim();
          if (!nomeAutor) continue;

          const normalized = normalizeAuthorName(nomeAutor);

          const autorExistente = autoresAtualizados.find(
            (autor) => normalizeAuthorName(autor.nome) === normalized,
          );

          if (autorExistente) {
            autoresParaSelecionar.push(autorExistente.id);
            continue;
          }

          try {
            const novoAutor = await createAutor(nomeAutor);
            autoresAtualizados.push(novoAutor);
            autoresParaSelecionar.push(novoAutor.id);
          } catch {
            const todosAutores = await getAutores();
            const autorRecuperado = todosAutores.find(
              (autor) => normalizeAuthorName(autor.nome) === normalized,
            );

            if (autorRecuperado) {
              autoresAtualizados.push(autorRecuperado);
              autoresParaSelecionar.push(autorRecuperado.id);
            }
          }
        }

        if (autoresParaSelecionar.length > 0) {
          const autoresOrdenados = Array.from(
            new Map(autoresAtualizados.map((autor) => [autor.id, autor])).values(),
          ).sort((a, b) => a.nome.localeCompare(b.nome));

          setAutores(autoresOrdenados);
          setAutorSuggestions(autoresOrdenados);
          setSelectedAutores((prev) =>
            Array.from(new Set([...prev, ...autoresParaSelecionar])),
          );
        }
      }
    } catch (error) {
      console.error("Erro ao buscar por ISBN:", error);
      setErroBuscaGoogleBooks("Não foi possível buscar dados no Google Books agora.");
    } finally {
      setBuscandoGoogleBooks(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="livro-form">
      {/* Capa */}
      <div className="form-section">
        <h3>Capa do Livro</h3>
        <div
          className={`capa-upload-area ${isDraggingCapa ? "is-dragging" : ""}`}
          onDragOver={handleCapaDragOver}
          onDragLeave={handleCapaDragLeave}
          onDrop={handleCapaDrop}
        >
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
              <span>{isDraggingCapa ? "Solte a imagem aqui" : "Selecionar capa"}</span>
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
        {erroCapa && <p className="form-error-text">{erroCapa}</p>}
      </div>

      <div className="form-section">
        <h3>Informações Básicas</h3>
        <div className="form-grid">
          <div className="form-group">
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

          <div className="form-group">
            <label htmlFor="subtitulo">Subtítulo *</label>
            <input
              id="subtitulo"
              type="text"
              required
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Subtítulo do livro"
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

          <div
            className="form-group form-group-editora"
            ref={editoraAutocompleteRef}
            onMouseLeave={() => setIsEditoraSuggestionsOpen(false)}
          >
            <label htmlFor="editora">Editora *</label>
            <div className="editora-row">
              <select
                className="editora-select"
                id="editora"
                required
                value={idEditora ?? ""}
                onChange={(e) =>
                  setIdEditora(e.target.value === "" ? undefined : Number(e.target.value))
                }
              >
                <option value="">Selecione uma editora</option>
                {editoras.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="inline-create editora-create">
              <input
                type="text"
                ref={editoraInputRef}
                placeholder="Buscar ou criar editora..."
                value={novoEditoraNome}
                onChange={(e) => {
                  setNovoEditoraNome(e.target.value);
                  setIsEditoraSuggestionsOpen(true);
                }}
                onFocus={() => {
                  if (novoEditoraNome.trim()) setIsEditoraSuggestionsOpen(true);
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    await handleSubmitEditoraInput();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSubmitEditoraInput}
                disabled={criandoEditora || !novoEditoraNome.trim()}
              >
                <Plus size={14} /> {criandoEditora ? "..." : "Criar"}
              </button>
            </div>
            {novoEditoraNome.trim() && !editoraSimilar && (
              <p className="form-hint-text">
                Nenhuma editora similar. Pressione Enter para criar “{novoEditoraNome.trim()}”.
              </p>
            )}
            {isEditoraSuggestionsOpen && novoEditoraNome.trim() && editoraSuggestions.length > 0 && (
              <ul className="suggestions compact-suggestions">
                {editoraSuggestions.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => {
                      setIdEditora(s.id);
                      setNovoEditoraNome("");
                      setIsEditoraSuggestionsOpen(false);
                      if (editoraInputRef.current) editoraInputRef.current.focus();
                    }}
                  >
                    {s.nome}
                  </li>
                ))}
              </ul>
            )}
            {erroEditora && <p className="form-error-text">{erroEditora}</p>}
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
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleBuscarPorIsbn}
              disabled={buscandoGoogleBooks}
            >
              {buscandoGoogleBooks ? "Pesquisando..." : "Pesquisar"}
            </button>
            {erroBuscaGoogleBooks && <p className="form-error-text">{erroBuscaGoogleBooks}</p>}
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

          <div className="form-group form-group-colecao">
            <label htmlFor="colecao">Coleção</label>
            <div className="colecao-row">
              <select
                className="colecao-select"
                id="colecao"
                value={idColecao ?? ""}
                onChange={(e) => setIdColecao(e.target.value === "" ? undefined : Number(e.target.value))}
              >
                <option value="">Selecione uma coleção</option>
                {colecoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="inline-create colecao-create">
              <input
                type="text"
                placeholder="Criar nova coleção..."
                value={novoColecaoNome}
                onChange={(e) => setNovoColecaoNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCriarColecao();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCriarColecao}
                disabled={criandoColecao || !novoColecaoNome.trim()}
              >
                <Plus size={14} /> {criandoColecao ? "..." : "Criar"}
              </button>
            </div>
            {erroColecao && <p className="form-error-text">{erroColecao}</p>}
          </div>
          

        </div>
      </div>

      <div className="form-section">
        <h3>Autores</h3>
        {erroAutor && <p className="form-error-text">{erroAutor}</p>}
        <div
          className="autocomplete compact-autocomplete"
          ref={autorAutocompleteRef}
          onMouseLeave={() => setIsAutorSuggestionsOpen(false)}
        >
          <div className="selected-list">
            {selectedAutores.map((id) => {
              const a = autores.find((x) => x.id === id);
              if (!a) return null;
              return (
                <span key={id} className="chip chip-selected">
                  {a.nome}
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => toggleAutor(id)}
                    aria-label={`Remover ${a.nome}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>

          <input
            ref={autorInputRef}
            type="text"
            placeholder="Buscar ou criar autor..."
            value={autorQuery}
            onChange={(e) => {
              setAutorQuery(e.target.value);
              setIsAutorSuggestionsOpen(true);
            }}
            onFocus={() => {
              if (autorQuery.trim()) setIsAutorSuggestionsOpen(true);
            }}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                await handleSubmitAutorInput();
              }
            }}
          />

          {isAutorSuggestionsOpen && autorSuggestions.length > 0 && autorQuery.trim() && (
            <ul className="suggestions">
              {autorSuggestions.map((s) => (
                <li key={s.id} onClick={() => {
                  if (!selectedAutores.includes(s.id)) setSelectedAutores((p) => [...p, s.id]);
                  setAutorQuery("");
                  setIsAutorSuggestionsOpen(false);
                  if (autorInputRef.current) autorInputRef.current.focus();
                }}>{s.nome}</li>
              ))}
            </ul>
          )}
          {autorQuery.trim() && !autorSimilar && (
            <button
              type="button"
              className="btn btn-secondary btn-sm create-suggestion-btn"
              onClick={() => handleCriarAutor(autorQuery)}
              disabled={criandoAutor}
            >
              <Plus size={14} /> Criar autor “{autorQuery.trim()}”
            </button>
          )}
          {autores.length === 0 && (
            <p className="form-empty-text">Nenhum autor cadastrado. Crie um acima.</p>
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>Categorias</h3>
        {erroCategoria && <p className="form-error-text">{erroCategoria}</p>}
        <div className="taxonomy-layout">
          <div
            className="autocomplete compact-autocomplete"
            ref={categoriaAutocompleteRef}
            onMouseLeave={() => setIsCategoriaSuggestionsOpen(false)}
          >
            <div className="selected-list">
              {selectedCategorias.map((id) => {
                const c = categorias.find((x) => x.id === id);
                if (!c) return null;
                return (
                  <span key={id} className="chip chip-selected">
                    {c.nome}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => toggleCategoria(id)}
                      aria-label={`Remover ${c.nome}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>

            <input
              ref={categoriaInputRef}
              type="text"
              placeholder="Buscar ou criar categoria..."
              value={categoriaQuery}
              onChange={(e) => {
                setCategoriaQuery(e.target.value);
                setIsCategoriaSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (categoriaQuery.trim()) setIsCategoriaSuggestionsOpen(true);
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  await handleSubmitCategoriaInput();
                }
              }}
            />

            {isCategoriaSuggestionsOpen && categoriaSuggestions.length > 0 && categoriaQuery.trim() && (
              <ul className="suggestions">
                {categoriaSuggestions.map((s) => (
                  <li key={s.id} onClick={() => {
                    if (!selectedCategorias.includes(s.id)) setSelectedCategorias((p) => [...p, s.id]);
                    setCategoriaQuery("");
                    setIsCategoriaSuggestionsOpen(false);
                    if (categoriaInputRef.current) categoriaInputRef.current.focus();
                  }}>{s.nome}</li>
                ))}
              </ul>
            )}
            {categoriaQuery.trim() && !categoriaSimilar && (
              <button
                type="button"
                className="btn btn-secondary btn-sm create-suggestion-btn"
                onClick={() => handleCriarCategoria(categoriaQuery)}
                disabled={criandoCategoria}
              >
                <Plus size={14} /> Criar categoria “{categoriaQuery.trim()}”
              </button>
            )}
            {categorias.length === 0 && (
              <p className="form-empty-text">Nenhuma categoria cadastrada. Crie uma acima.</p>
            )}
          </div>

          <div className="taxonomy-side-list">
            <p className="taxonomy-recentes-text">
              Categorias recentes (cadastradas): {categoriasRecentes.length > 0 ? categoriasRecentes.join(", ") : "nenhuma"}.
            </p>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Tags</h3>
        {erroTag && <p className="form-error-text">{erroTag}</p>}
        <div className="taxonomy-layout">
          <div
            className="autocomplete compact-autocomplete"
            ref={tagAutocompleteRef}
            onMouseLeave={() => setIsTagSuggestionsOpen(false)}
          >
            <div className="selected-list">
              {selectedTags.map((id) => {
                const t = tags.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <span key={id} className="chip chip-selected">
                    {t.nome}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => toggleTag(id)}
                      aria-label={`Remover ${t.nome}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>

            <input
              ref={tagInputRef}
              type="text"
              placeholder="Buscar ou criar tag..."
              value={tagQuery}
              onChange={(e) => {
                setTagQuery(e.target.value);
                setIsTagSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (tagQuery.trim()) setIsTagSuggestionsOpen(true);
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  await handleSubmitTagInput();
                }
              }}
            />

            {isTagSuggestionsOpen && tagSuggestions.length > 0 && tagQuery.trim() && (
              <ul className="suggestions">
                {tagSuggestions.map((s) => (
                  <li key={s.id} onClick={() => {
                    if (!selectedTags.includes(s.id)) setSelectedTags((p) => [...p, s.id]);
                    setTagQuery("");
                    setIsTagSuggestionsOpen(false);
                    if (tagInputRef.current) tagInputRef.current.focus();
                  }}>{s.nome}</li>
                ))}
              </ul>
            )}
            {tagQuery.trim() && !tagSimilar && (
              <button
                type="button"
                className="btn btn-secondary btn-sm create-suggestion-btn"
                onClick={() => handleCriarTag(tagQuery)}
                disabled={criandoTag}
              >
                <Plus size={14} /> Criar tag “{tagQuery.trim()}”
              </button>
            )}
            {tags.length === 0 && (
              <p className="form-empty-text">Nenhuma tag cadastrada. Crie uma acima.</p>
            )}
          </div>

          <div className="taxonomy-side-list">
            <p className="taxonomy-recentes-text">
              Tags recentes (cadastradas): {tagsRecentes.length > 0 ? tagsRecentes.join(", ") : "nenhuma"}.
            </p>
          </div>
        </div>
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
