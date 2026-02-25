import { supabase } from "@/lib/supabase";
import type {
  Livro,
  LivroInsert,
  LivroUpdate,
  LivroComDetalhes,
  Autor,
  Categoria,
  Arquivo,
  Colecao,
  Tag,
} from "@/lib/types";

function intersectIdLists(idLists: number[][]): number[] {
  if (idLists.length === 0) return [];
  return idLists.reduce((acc, current) =>
    acc.filter((id) => current.includes(id)),
  );
}

// ===================== LIVROS =====================

export async function getLivros(): Promise<Livro[]> {
  const { data, error } = await supabase
    .from("livro")
    .select("*")
    .order("titulo", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getLivroById(id: number): Promise<LivroComDetalhes> {
  const { data: livroData, error } = await supabase
    .from("livro")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  const livro = livroData as Livro;

  const [autores, categorias, arquivos, tags] = await Promise.all([
    getAutoresByLivro(id),
    getCategoriasByLivro(id),
    getArquivosByLivro(id),
    getTagsByLivro(id),
  ]);

  // obter coleção relacionada, se houver
  let colecao: Colecao | null = null;
  if ((livro as any).id_colecao) {
    try {
      const { data: colecaoData, error: colecaoError } = await supabase
        .from("colecao")
        .select("*")
        .eq("id", (livro as any).id_colecao)
        .single();
      if (!colecaoError) colecao = colecaoData as Colecao;
    } catch {
      colecao = null;
    }
  }

  return { ...livro, autores, categorias, arquivos, tags, colecao };
}

export async function createLivro(livro: LivroInsert): Promise<Livro> {
  const { data, error } = await supabase
    .from("livro")
    .insert(livro)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLivro(
  id: number,
  livro: LivroUpdate,
): Promise<Livro> {
  const { data, error } = await supabase
    .from("livro")
    .update({ ...livro, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLivro(id: number): Promise<void> {
  // Remover relações primeiro
  await supabase.from("autorlivro").delete().eq("idLivro", id);
  await supabase.from("categorialivro").delete().eq("idLivro", id);
  await supabase.from("taglivro").delete().eq("id_livro", id);
  
  // Remover apenas registros de arquivos (não há mais arquivos no storage)
  await supabase.from("arquivo").delete().eq("id_livro", id);

  const { error } = await supabase.from("livro").delete().eq("id", id);
  if (error) throw error;
}

export async function searchLivros(query: string): Promise<Livro[]> {
  return getLivrosFiltrados({ query, limit: 120 });
}

export async function getLivrosRecentes(limit: number = 6): Promise<Livro[]> {
  const { data, error } = await supabase
    .from("livro")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getDashboardStats(): Promise<{
  livrosCount: number;
  autoresCount: number;
  categoriasCount: number;
  paginasTotal: number;
}> {
  const [livrosCountRes, autoresCountRes, categoriasCountRes, paginasRes] =
    await Promise.all([
      supabase.from("livro").select("id", { count: "exact", head: true }),
      supabase.from("autor").select("id", { count: "exact", head: true }),
      supabase
        .from("categoria")
        .select("id", { count: "exact", head: true }),
      supabase.from("livro").select("paginas"),
    ]);

  if (livrosCountRes.error) throw livrosCountRes.error;
  if (autoresCountRes.error) throw autoresCountRes.error;
  if (categoriasCountRes.error) throw categoriasCountRes.error;
  if (paginasRes.error) throw paginasRes.error;

  return {
    livrosCount: livrosCountRes.count ?? 0,
    autoresCount: autoresCountRes.count ?? 0,
    categoriasCount: categoriasCountRes.count ?? 0,
    paginasTotal: (paginasRes.data ?? []).reduce(
      (sum, row) => sum + (row.paginas ?? 0),
      0,
    ),
  };
}

export async function getLivrosFiltrados(filters: {
  query?: string;
  autorId?: number | null;
  categoriaId?: number | null;
  editoraId?: number | null;
  tagId?: number | null;
  limit?: number;
}): Promise<Livro[]> {
  const limit = filters.limit ?? 60;
  const queryTerm = filters.query?.trim();

  const relatedIdLists: number[][] = [];

  if (filters.autorId) {
    const { data, error } = await supabase
      .from("autorlivro")
      .select("idLivro")
      .eq("idAutor", filters.autorId);

    if (error) throw error;
    relatedIdLists.push((data ?? []).map((row) => row.idLivro));
  }

  if (filters.categoriaId) {
    const { data, error } = await supabase
      .from("categorialivro")
      .select("idLivro")
      .eq("idCategoria", filters.categoriaId);

    if (error) throw error;
    relatedIdLists.push((data ?? []).map((row) => row.idLivro));
  }

  if (filters.tagId) {
    const { data, error } = await supabase
      .from("taglivro")
      .select("id_livro")
      .eq("id_tag", filters.tagId);

    if (error) throw error;
    relatedIdLists.push((data ?? []).map((row: any) => row.id_livro));
  }

  const intersectedIds =
    relatedIdLists.length > 0 ? intersectIdLists(relatedIdLists) : null;

  if (intersectedIds && intersectedIds.length === 0) {
    return [];
  }

  let livrosQuery = supabase
    .from("livro")
    .select("*")
    .order("titulo", { ascending: true })
    .limit(limit);

  if (filters.editoraId) {
    livrosQuery = livrosQuery.eq("id_editora", filters.editoraId);
  }

  if (queryTerm) {
    livrosQuery = livrosQuery.or(
      `titulo.ilike.%${queryTerm}%,descricao.ilike.%${queryTerm}%,isbn13.ilike.%${queryTerm}%,isbn10.ilike.%${queryTerm}%`,
    );
  }

  if (intersectedIds) {
    livrosQuery = livrosQuery.in("id", intersectedIds);
  }

  const { data: livrosData, error: livrosError } = await livrosQuery;
  if (livrosError) throw livrosError;

  const livros = (livrosData ?? []) as Livro[];

  if (!queryTerm || livros.length >= limit) {
    return livros;
  }

  const [editoras, matchingTags] = await Promise.all([
    supabase.from("editora").select("id").ilike("nome", `%${queryTerm}%`),
    supabase.from("tag").select("id").ilike("nome", `%${queryTerm}%`),
  ]);

  if (editoras.error) throw editoras.error;
  if (matchingTags.error) throw matchingTags.error;

  const editoraIds = (editoras.data ?? []).map((item: any) => item.id) as number[];
  const tagIds = (matchingTags.data ?? []).map((item: any) => item.id) as number[];

  const extraResults: Livro[] = [];

  if (editoraIds.length > 0) {
    let byEditoraQuery = supabase
      .from("livro")
      .select("*")
      .in("id_editora", editoraIds)
      .order("titulo", { ascending: true })
      .limit(limit);

    if (filters.editoraId) {
      byEditoraQuery = byEditoraQuery.eq("id_editora", filters.editoraId);
    }

    if (intersectedIds) {
      byEditoraQuery = byEditoraQuery.in("id", intersectedIds);
    }

    const { data, error } = await byEditoraQuery;
    if (error) throw error;
    extraResults.push(...((data ?? []) as Livro[]));
  }

  if (tagIds.length > 0) {
    const { data: tagLinks, error: tagLinksError } = await supabase
      .from("taglivro")
      .select("id_livro")
      .in("id_tag", tagIds);

    if (tagLinksError) throw tagLinksError;
    const tagLivroIds = (tagLinks ?? []).map((row: any) => row.id_livro) as number[];

    if (tagLivroIds.length > 0) {
      let byTagQuery = supabase
        .from("livro")
        .select("*")
        .in("id", tagLivroIds)
        .order("titulo", { ascending: true })
        .limit(limit);

      if (filters.editoraId) {
        byTagQuery = byTagQuery.eq("id_editora", filters.editoraId);
      }

      if (intersectedIds) {
        byTagQuery = byTagQuery.in("id", intersectedIds);
      }

      const { data, error } = await byTagQuery;
      if (error) throw error;
      extraResults.push(...((data ?? []) as Livro[]));
    }
  }

  const merged = [...livros, ...extraResults];
  const uniqueMap = new Map<number, Livro>();
  merged.forEach((livro) => uniqueMap.set(livro.id, livro));

  return Array.from(uniqueMap.values())
    .sort((a, b) => a.titulo.localeCompare(b.titulo))
    .slice(0, limit);
}

export async function getLivrosRelacionamentos(livros: Livro[]): Promise<{
  autoresPorLivro: Record<number, Autor[]>;
  categoriasPorLivro: Record<number, Categoria[]>;
  editorasPorLivro: Record<number, { nome: string } | null>;
}> {
  const livrosIds = livros.map((livro) => livro.id);
  if (livrosIds.length === 0) {
    return {
      autoresPorLivro: {},
      categoriasPorLivro: {},
      editorasPorLivro: {},
    };
  }

  const [autorLinksRes, categoriaLinksRes] = await Promise.all([
    supabase
      .from("autorlivro")
      .select("idLivro,idAutor")
      .in("idLivro", livrosIds),
    supabase
      .from("categorialivro")
      .select("idLivro,idCategoria")
      .in("idLivro", livrosIds),
  ]);

  if (autorLinksRes.error) throw autorLinksRes.error;
  if (categoriaLinksRes.error) throw categoriaLinksRes.error;

  const autorLinks = autorLinksRes.data ?? [];
  const categoriaLinks = categoriaLinksRes.data ?? [];

  const autorIds = Array.from(new Set(autorLinks.map((row) => row.idAutor)));
  const categoriaIds = Array.from(
    new Set(categoriaLinks.map((row) => row.idCategoria)),
  );
  const editoraIds = Array.from(
    new Set(livros.map((livro) => livro.id_editora).filter(Boolean) as number[]),
  );

  const autoresRes =
    autorIds.length > 0
      ? await supabase.from("autor").select("*").in("id", autorIds)
      : { data: [], error: null };
  const categoriasRes =
    categoriaIds.length > 0
      ? await supabase.from("categoria").select("*").in("id", categoriaIds)
      : { data: [], error: null };
  const editorasRes =
    editoraIds.length > 0
      ? await supabase.from("editora").select("id,nome").in("id", editoraIds)
      : { data: [], error: null };

  if (autoresRes.error) throw autoresRes.error;
  if (categoriasRes.error) throw categoriasRes.error;
  if (editorasRes.error) throw editorasRes.error;

  const autores = (autoresRes.data ?? []) as Autor[];
  const categorias = (categoriasRes.data ?? []) as Categoria[];
  const editoras = (editorasRes.data ?? []) as { id: number; nome: string }[];

  const autorById = new Map<number, Autor>(autores.map((item) => [item.id, item]));
  const categoriaById = new Map<number, Categoria>(
    categorias.map((item) => [item.id, item]),
  );
  const editoraById = new Map<number, { nome: string }>(
    editoras.map((item) => [item.id, { nome: item.nome }]),
  );

  const autoresPorLivro: Record<number, Autor[]> = {};
  const categoriasPorLivro: Record<number, Categoria[]> = {};
  const editorasPorLivro: Record<number, { nome: string } | null> = {};

  livros.forEach((livro) => {
    autoresPorLivro[livro.id] = [];
    categoriasPorLivro[livro.id] = [];
    editorasPorLivro[livro.id] = livro.id_editora
      ? editoraById.get(livro.id_editora) ?? null
      : null;
  });

  autorLinks.forEach((row) => {
    const autor = autorById.get(row.idAutor);
    if (autor) autoresPorLivro[row.idLivro].push(autor);
  });

  categoriaLinks.forEach((row) => {
    const categoria = categoriaById.get(row.idCategoria);
    if (categoria) categoriasPorLivro[row.idLivro].push(categoria);
  });

  Object.values(autoresPorLivro).forEach((lista) =>
    lista.sort((a, b) => a.nome.localeCompare(b.nome)),
  );
  Object.values(categoriasPorLivro).forEach((lista) =>
    lista.sort((a, b) => a.nome.localeCompare(b.nome)),
  );

  return {
    autoresPorLivro,
    categoriasPorLivro,
    editorasPorLivro,
  };
}

export async function searchAutores(
  query: string,
  limit: number = 8,
): Promise<Autor[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("autor")
    .select("*")
    .ilike("nome", `%${q}%`)
    .order("nome", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function searchCategorias(
  query: string,
  limit: number = 8,
): Promise<Categoria[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("categoria")
    .select("*")
    .ilike("nome", `%${q}%`)
    .order("nome", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function searchEditoras(
  query: string,
  limit: number = 8,
): Promise<{ id: number; nome: string }[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("editora")
    .select("id,nome")
    .ilike("nome", `%${q}%`)
    .order("nome", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function searchTags(query: string, limit: number = 8): Promise<Tag[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("tag")
    .select("*")
    .ilike("nome", `%${q}%`)
    .order("nome", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getLivrosComDetalhes(): Promise<LivroComDetalhes[]> {
  const livros = await getLivros();
  const livrosComDetalhes = await Promise.all(
    livros.map(async (livro) => {
      const [autores, categorias, arquivos, tags] = await Promise.all([
        getAutoresByLivro(livro.id),
        getCategoriasByLivro(livro.id),
        getArquivosByLivro(livro.id),
        getTagsByLivro(livro.id),
      ]);
      let colecao: Colecao | null = null;
      if ((livro as any).id_colecao) {
        try {
          const { data: colecaoData, error: colecaoError } = await supabase
            .from("colecao")
            .select("*")
            .eq("id", (livro as any).id_colecao)
            .single();
          if (!colecaoError) colecao = colecaoData as Colecao;
        } catch {
          colecao = null;
        }
      }
      return { ...livro, autores, categorias, arquivos, tags, colecao };
    }),
  );
  return livrosComDetalhes;
}

// ===================== AUTORES =====================

export async function getAutores(): Promise<Autor[]> {
  const { data, error } = await supabase
    .from("autor")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createAutor(nome: string): Promise<Autor> {
  const { data, error } = await supabase
    .from("autor")
    .insert({ nome })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAutor(id: number, nome: string): Promise<Autor> {
  const { data, error } = await supabase
    .from("autor")
    .update({ nome, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAutor(id: number): Promise<void> {
  await supabase.from("autorlivro").delete().eq("idAutor", id);
  const { error } = await supabase.from("autor").delete().eq("id", id);
  if (error) throw error;
}

export async function getAutoresByLivro(livroId: number): Promise<Autor[]> {
  const { data: joins, error: joinError } = await supabase
    .from("autorlivro")
    .select("idAutor")
    .eq("idLivro", livroId);

  if (joinError) throw joinError;
  if (!joins || joins.length === 0) return [];

  const autorIds = joins.map((j) => j.idAutor);
  const { data, error } = await supabase
    .from("autor")
    .select("*")
    .in("id", autorIds)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ===================== CATEGORIAS =====================

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categoria")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createCategoria(nome: string): Promise<Categoria> {
  const { data, error } = await supabase
    .from("categoria")
    .insert({ nome })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategoria(
  id: number,
  nome: string,
): Promise<Categoria> {
  const { data, error } = await supabase
    .from("categoria")
    .update({ nome, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategoria(id: number): Promise<void> {
  await supabase.from("categorialivro").delete().eq("idCategoria", id);
  const { error } = await supabase.from("categoria").delete().eq("id", id);
  if (error) throw error;
}

export async function getCategoriasByLivro(
  livroId: number,
): Promise<Categoria[]> {
  const { data: joins, error: joinError } = await supabase
    .from("categorialivro")
    .select("idCategoria")
    .eq("idLivro", livroId);

  if (joinError) throw joinError;
  if (!joins || joins.length === 0) return [];

  const categoriaIds = joins.map((j) => j.idCategoria);
  const { data, error } = await supabase
    .from("categoria")
    .select("*")
    .in("id", categoriaIds)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ===================== TAGS =====================

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tag")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createTag(nome: string): Promise<Tag> {
  const { data, error } = await supabase
    .from("tag")
    .insert({ nome })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTag(id: number, nome: string): Promise<Tag> {
  const { data, error } = await supabase
    .from("tag")
    .update({ nome, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(id: number): Promise<void> {
  await supabase.from("taglivro").delete().eq("id_tag", id);
  const { error } = await supabase.from("tag").delete().eq("id", id);
  if (error) throw error;
}

export async function getTagsByLivro(livroId: number): Promise<Tag[]> {
  const { data: joins, error: joinError } = await supabase
    .from("taglivro")
    .select("id_tag")
    .eq("id_livro", livroId);

  if (joinError) throw joinError;
  if (!joins || joins.length === 0) return [];

  const tagIds = joins.map((j: any) => j.id_tag);
  const { data, error } = await supabase
    .from("tag")
    .select("*")
    .in("id", tagIds)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ===================== EDITORAS  =====================

export async function getEditoras(): Promise<{ id: number; nome: string }[]> {
  const { data, error } = await supabase
    .from("editora")
    .select("id,nome")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getEditoraById(id: number): Promise<{ nome: string } | null> {
  const { data, error } = await supabase
    .from("editora")
    .select("nome")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }
  return data ?? null;
}

export async function createEditora(nome: string): Promise<{ id: number; nome: string }> {
  const { data, error } = await supabase
    .from("editora")
    .insert({ nome })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEditora(id: number, nome: string): Promise<{ id: number; nome: string }> {
  const { data, error } = await supabase
    .from("editora")
    .update({ nome, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEditora(id: number): Promise<void> {
  await supabase.from("livro").update({ id_editora: null }).eq("id_editora", id);
  const { error } = await supabase.from("editora").delete().eq("id", id);
  if (error) throw error;
}

// ===================== COLEÇÕES  =====================
export async function createColecao(nome: string): Promise<{ id: number; nome: string }> {
  const { data, error } = await supabase
    .from("colecao")
    .insert({ nome })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getColecoes(): Promise<{ id: number; nome: string }[]> {
  const { data, error } = await supabase
    .from("colecao")
    .select("id,nome")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateColecao(id: number, nome: string): Promise<{ id: number; nome: string }> {
  const { data, error } = await supabase
    .from("colecao")
    .update({ nome, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteColecao(id: number): Promise<void> {
  await supabase.from("livro").update({ id_colecao: null }).eq("id_colecao", id);
  const { error } = await supabase.from("colecao").delete().eq("id", id);
  if (error) throw error;
}




// ===================== RELAÇÕES =====================

export async function associarAutorLivro(
  idLivro: number,
  idAutor: number,
): Promise<void> {
  const { error } = await supabase
    .from("autorlivro")
    .insert({ idLivro, idAutor });
  if (error) throw error;
}

export async function desassociarAutoresLivro(
  idLivro: number,
): Promise<void> {
  const { error } = await supabase
    .from("autorlivro")
    .delete()
    .eq("idLivro", idLivro);
  if (error) throw error;
}

export async function associarCategoriaLivro(
  idLivro: number,
  idCategoria: number,
): Promise<void> {
  const { error } = await supabase
    .from("categorialivro")
    .insert({ idLivro, idCategoria });
  if (error) throw error;
}

export async function associarTagLivro(
  idLivro: number,
  idTag: number,
): Promise<void> {
  const { error } = await supabase
    .from("taglivro")
    .insert({ id_livro: idLivro, id_tag: idTag });
  if (error) throw error;
}

export async function desassociarTagsLivro(
  idLivro: number,
): Promise<void> {
  const { error } = await supabase
    .from("taglivro")
    .delete()
    .eq("id_livro", idLivro);
  if (error) throw error;
}

export async function desassociarCategoriasLivro(
  idLivro: number,
): Promise<void> {
  const { error } = await supabase
    .from("categorialivro")
    .delete()
    .eq("idLivro", idLivro);
  if (error) throw error;
}

// ===================== CAPA =====================

export async function uploadCapa(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("capas")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("capas").getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteCapa(capaUrl: string): Promise<void> {
  try {
    const url = new URL(capaUrl);
    const pathParts = url.pathname.split("/storage/v1/object/public/capas/");
    if (pathParts[1]) {
      await supabase.storage.from("capas").remove([pathParts[1]]);
    }
  } catch {
    // ignora se não conseguir parsear
  }
}

// ===================== ARQUIVOS =====================

export async function getArquivosByLivro(livroId: number): Promise<Arquivo[]> {
  const { data, error } = await supabase
    .from("arquivo")
    .select("*")
    .eq("id_livro", livroId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addArquivo(
  livroId: number,
  link: string,
  tipo: string = "pdf",
): Promise<Arquivo> {
  const { data, error } = await supabase
    .from("arquivo")
    .insert({
      id_livro: livroId,
      tipo,
      link,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteArquivo(arquivo: Arquivo): Promise<void> {
  const { error } = await supabase
    .from("arquivo")
    .delete()
    .eq("id", arquivo.id);
  if (error) throw error;
}

// ===================== OPERAÇÃO COMPLETA DE LIVRO =====================

export async function createLivroCompleto(
  livroData: {
    titulo: string;
    descricao?: string;
    ano: number;
    id_editora?: number | null;
    id_colecao?: number | null;
    paginas: number;
    idioma: string;
    edicao: number;
    isbn13?: string;
    isbn10?: string;
  },
  autoresIds: number[],
  categoriasIds: number[],
  tagsIds: number[] = [],
  driveLinks?: { link: string; nome: string }[],
  capaFile?: File | null,
): Promise<Livro> {
  let capaUrl: string | null = null;
  if (capaFile) {
    capaUrl = await uploadCapa(capaFile);
  }

  const livro = await createLivro({
    ...livroData,
    descricao: livroData.descricao || null,
    isbn13: livroData.isbn13 || null,
    isbn10: livroData.isbn10 || null,
    capa: capaUrl,
    id_editora: livroData.id_editora ?? null,
    id_colecao: livroData.id_colecao ?? null,
  });

  if (autoresIds.length > 0 || categoriasIds.length > 0 || tagsIds.length > 0) {
    await Promise.all([
      ...autoresIds.map((idAutor) => associarAutorLivro(livro.id, idAutor)),
      ...categoriasIds.map((idCategoria) =>
        associarCategoriaLivro(livro.id, idCategoria),
      ),
      ...tagsIds.map((idTag) => associarTagLivro(livro.id, idTag)),
    ]);
  }

  if (driveLinks && driveLinks.length > 0) {
    await Promise.all(
      driveLinks.map((file) => addArquivo(livro.id, file.link, "pdf")),
    );
  }

  return livro;
}

export async function updateLivroCompleto(
  id: number,
  livroData: {
    titulo: string;
    descricao?: string;
    ano: number;
    id_editora?: number | null;
    paginas: number;
    idioma: string;
    edicao: number;
    isbn13?: string;
    isbn10?: string;
    id_colecao?: number | null;
  },
  autoresIds: number[],
  categoriasIds: number[],
  tagsIds: number[] = [],
  driveLinks?: { link: string; nome: string }[],
  capaFile?: File | null,
  capaAtualUrl?: string | null,
): Promise<Livro> {
  let capaUrl: string | null | undefined = undefined;
  if (capaFile) {
    // Deleta capa antiga se existir
    if (capaAtualUrl) {
      await deleteCapa(capaAtualUrl);
    }
    capaUrl = await uploadCapa(capaFile);
  }

  const updateData: LivroUpdate = {
    ...livroData,
    descricao: livroData.descricao || null,
    isbn13: livroData.isbn13 || null,
    isbn10: livroData.isbn10 || null,
    id_colecao: livroData.id_colecao ?? null,
  };
  // garantir id_editora está explícito se presente
  if ((livroData as any).id_editora !== undefined) {
    (updateData as any).id_editora = (livroData as any).id_editora;
  }
  if (capaUrl !== undefined) {
    updateData.capa = capaUrl;
  }

  const livro = await updateLivro(id, updateData);

  // Recriar relações
  await Promise.all([
    desassociarAutoresLivro(id),
    desassociarCategoriasLivro(id),
    desassociarTagsLivro(id),
  ]);

  if (autoresIds.length > 0 || categoriasIds.length > 0 || tagsIds.length > 0) {
    await Promise.all([
      ...autoresIds.map((idAutor) => associarAutorLivro(id, idAutor)),
      ...categoriasIds.map((idCategoria) =>
        associarCategoriaLivro(id, idCategoria),
      ),
      ...tagsIds.map((idTag) => associarTagLivro(id, idTag)),
    ]);
  }

  // adicionar novos arquivos (ex.: links do Drive) se fornecidos
  if (driveLinks && driveLinks.length > 0) {
    await Promise.all(
      driveLinks.map((file) => addArquivo(id, file.link, "pdf")),
    );
  }

  return livro;
}

// ===================== FILTROS =====================

export async function getLivrosByAutor(autorId: number): Promise<Livro[]> {
  const { data: joins, error: joinError } = await supabase
    .from("autorlivro")
    .select("idLivro")
    .eq("idAutor", autorId);

  if (joinError) throw joinError;
  if (!joins || joins.length === 0) return [];

  const livroIds = joins.map((j) => j.idLivro);
  const { data, error } = await supabase
    .from("livro")
    .select("*")
    .in("id", livroIds)
    .order("titulo", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getLivrosByCategoria(
  categoriaId: number,
): Promise<Livro[]> {
  const { data: joins, error: joinError } = await supabase
    .from("categorialivro")
    .select("idLivro")
    .eq("idCategoria", categoriaId);

  if (joinError) throw joinError;
  if (!joins || joins.length === 0) return [];

  const livroIds = joins.map((j) => j.idLivro);
  const { data, error } = await supabase
    .from("livro")
    .select("*")
    .in("id", livroIds)
    .order("titulo", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export interface SearchResult {
  title: string;
  subtitle: string;
  description: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  pageCount: number;
  language: string;
  thumbnail: string;
  collectionName: string;
}

function getLanguageDisplayName(languageCode?: string): string {
  const fallbackLanguage = "Português";
  const rawCode = languageCode?.trim();

  if (!rawCode) return fallbackLanguage;

  const normalizedCode = rawCode.replace(/_/g, "-");

  try {
    const canonicalCode = Intl.getCanonicalLocales([normalizedCode])[0];
    const locale = new Intl.Locale(canonicalCode);
    const languageSubtag = locale.language;

    if (!languageSubtag) return fallbackLanguage;

    const displayName = new Intl.DisplayNames(["pt-BR"], {
      type: "language",
      languageDisplay: "standard",
    }).of(languageSubtag);

    return displayName || fallbackLanguage;
  } catch {
    return fallbackLanguage;
  }
}

export async function getLivroFromGoogleBooks(isbn: string): Promise<SearchResult | null> {
  try {
    const params = new URLSearchParams({
      q: `isbn:${isbn.trim()}`,
      fields:
        "totalItems," +
        "items(volumeInfo/title," +
        "volumeInfo/subtitle," +
        "volumeInfo/description," +
        "volumeInfo/authors," +
        "volumeInfo/publishedDate," +
        "volumeInfo/pageCount," +
        "volumeInfo/language," +
        "volumeInfo/publisher," +
        "volumeInfo/imageLinks/thumbnail," +
        "volumeInfo/seriesInfo),"
    });

    if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      params.set("key", process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    }

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Erro na Google Books API:", response.status, errorData);
      return null;
    }

    const data = await response.json();
    if (data.totalItems > 0) {
      const book = data.items[0].volumeInfo;
      const rawSeriesCandidates = [
        book.seriesInfo?.volumeSeries?.[0]?.seriesName,
        book.seriesInfo?.volumeSeries?.[0]?.title,
        book.seriesInfo?.volumeSeries?.[0]?.name,
        book.seriesInfo?.series,
      ];
      const collectionName =
        rawSeriesCandidates.find((value) => typeof value === "string" && value.trim()) || "";

      return {
        title: book.title,
        subtitle: book.subtitle || "",
        description: book.description || "",
        authors: book.authors || [],
        publishedDate: book.publishedDate || "",
        pageCount: book.pageCount || 0,
        language: getLanguageDisplayName(book.language),
        publisher: book.publisher || "",
        thumbnail: book.imageLinks?.thumbnail || "",
        collectionName,
      };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar dados do livro:", error);
    return null;
  }
}