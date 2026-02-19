import { supabase } from "@/lib/supabase";
import type {
  Livro,
  LivroInsert,
  LivroUpdate,
  LivroComDetalhes,
  Autor,
  Categoria,
  Arquivo,
} from "@/lib/types";

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

  const [autores, categorias, arquivos] = await Promise.all([
    getAutoresByLivro(id),
    getCategoriasByLivro(id),
    getArquivosByLivro(id),
  ]);

  return { ...livro, autores, categorias, arquivos };
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
  
  // Remover apenas registros de arquivos (não há mais arquivos no storage)
  await supabase.from("arquivo").delete().eq("id_livro", id);

  const { error } = await supabase.from("livro").delete().eq("id", id);
  if (error) throw error;
}

export async function searchLivros(query: string): Promise<Livro[]> {
  // Busca em campos do livro
  const { data: livrosData, error: livrosError } = await supabase
    .from("livro")
    .select("*")
    .or(`titulo.ilike.%${query}%,descricao.ilike.%${query}%,isbn13.ilike.%${query}%,isbn10.ilike.%${query}%`);

  if (livrosError) throw livrosError;

  const livros = (livrosData ?? []) as Livro[];

  // Busca por editora (agora em tabela separada) e junta resultados
  const { data: editoras, error: editorasError } = await supabase
    .from("editora")
    .select("id")
    .ilike("nome", `%${query}%`);

  if (editorasError) throw editorasError;

  const editoraIds = (editoras ?? []).map((e: any) => e.id) as number[];
  let livrosPorEditora: Livro[] = [];
  if (editoraIds.length > 0) {
    const { data: byEditoraData, error: byEditoraError } = await supabase
      .from("livro")
      .select("*")
      .in("id_editora", editoraIds);

    if (byEditoraError) throw byEditoraError;
    livrosPorEditora = (byEditoraData ?? []) as Livro[];
  }

  // combinar e ordenar por título
  const combined = [...livros, ...livrosPorEditora];
  const uniqueMap = new Map<number, Livro>();
  combined.forEach((l) => uniqueMap.set(l.id, l));
  const result = Array.from(uniqueMap.values()).sort((a, b) =>
    a.titulo.localeCompare(b.titulo),
  );

  return result;
}

export async function getLivrosComDetalhes(): Promise<LivroComDetalhes[]> {
  const livros = await getLivros();
  const livrosComDetalhes = await Promise.all(
    livros.map(async (livro) => {
      const [autores, categorias, arquivos] = await Promise.all([
        getAutoresByLivro(livro.id),
        getCategoriasByLivro(livro.id),
        getArquivosByLivro(livro.id),
      ]);
      return { ...livro, autores, categorias, arquivos };
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

// ===================== EDITORAS (lista / criar) =====================

export async function getEditoras(): Promise<{ id: number; nome: string }[]> {
  const { data, error } = await supabase
    .from("editora")
    .select("id,nome")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
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

// ===================== EDITORAS =====================

export async function getEditoraById(id: number): Promise<{ nome: string } | null> {
  const { data, error } = await supabase
    .from("editora")
    .select("nome")
    .eq("id", id)
    .single();

  if (error) {
    // se a editora não existir, retornamos null ao invés de lançar
    return null;
  }
  return data ?? null;
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
    paginas: number;
    idioma: string;
    edicao: number;
    isbn13?: string;
    isbn10?: string;
  },
  autoresIds: number[],
  categoriasIds: number[],
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
  });

  if (autoresIds.length > 0 || categoriasIds.length > 0) {
    await Promise.all([
      ...autoresIds.map((idAutor) => associarAutorLivro(livro.id, idAutor)),
      ...categoriasIds.map((idCategoria) =>
        associarCategoriaLivro(livro.id, idCategoria),
      ),
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
  },
  autoresIds: number[],
  categoriasIds: number[],
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
  ]);

  if (autoresIds.length > 0 || categoriasIds.length > 0) {
    await Promise.all([
      ...autoresIds.map((idAutor) => associarAutorLivro(id, idAutor)),
      ...categoriasIds.map((idCategoria) =>
        associarCategoriaLivro(id, idCategoria),
      ),
    ]);
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
