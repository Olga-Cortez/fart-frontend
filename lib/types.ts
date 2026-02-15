export interface Database {
  public: {
    Tables: {
      livro: {
        Row: Livro;
        Insert: LivroInsert;
        Update: LivroUpdate;
      };
      autor: {
        Row: Autor;
        Insert: AutorInsert;
        Update: AutorUpdate;
      };
      categoria: {
        Row: Categoria;
        Insert: CategoriaInsert;
        Update: CategoriaUpdate;
      };
      autorlivro: {
        Row: AutorLivro;
        Insert: AutorLivroInsert;
        Update: never;
      };
      categorialivro: {
        Row: CategoriaLivro;
        Insert: CategoriaLivroInsert;
        Update: never;
      };
      arquivo: {
        Row: Arquivo;
        Insert: ArquivoInsert;
        Update: ArquivoUpdate;
      };
      arquivoLivro: {
        Row: ArquivoLivro;
        Insert: ArquivoLivroInsert;
        Update: never;
      };
    };
  };
}

// ---- Livro ----
export interface Livro {
  id: number;
  created_at: string;
  updated_at: string;
  titulo: string;
  descricao: string | null;
  ano: number;
  editora: string;
  paginas: number;
  idioma: string;
  edicao: number;
  isbn13: string | null;
  isbn10: string | null;
  capa: string | null;
}

export interface LivroInsert {
  titulo: string;
  descricao?: string | null;
  ano: number;
  editora: string;
  paginas: number;
  idioma: string;
  edicao: number;
  isbn13?: string | null;
  isbn10?: string | null;
  capa?: string | null;
}

export interface LivroUpdate {
  titulo?: string;
  descricao?: string | null;
  ano?: number;
  editora?: string;
  paginas?: number;
  idioma?: string;
  edicao?: number;
  isbn13?: string | null;
  isbn10?: string | null;
  capa?: string | null;
  updated_at?: string;
}

// ---- Autor ----
export interface Autor {
  id: number;
  created_at: string;
  updated_at: string;
  nome: string;
}

export type AutorInsert = {
  nome: string;
};

export type AutorUpdate = {
  nome?: string;
  updated_at?: string;
};

// ---- Categoria ----
export interface Categoria {
  id: number;
  created_at: string;
  updated_at: string;
  nome: string;
}

export type CategoriaInsert = {
  nome: string;
};

export type CategoriaUpdate = {
  nome?: string;
  updated_at?: string;
};

// ---- AutorLivro (join) ----
export interface AutorLivro {
  id: number;
  created_at: string;
  updated_at: string;
  idLivro: number;
  idAutor: number;
}

export type AutorLivroInsert = {
  idLivro: number;
  idAutor: number;
};

// ---- CategoriaLivro (join) ----
export interface CategoriaLivro {
  id: number;
  created_at: string;
  updated_at: string;
  idCategoria: number;
  idLivro: number;
}

export type CategoriaLivroInsert = {
  idCategoria: number;
  idLivro: number;
};

// ---- Arquivo ----
export interface Arquivo {
  id: number;
  id_livro: number;
  created_at: string;
  updated_at: string;
  tipo: string;
  link: string;
}

export type ArquivoInsert = {
  id_livro: number;
  tipo: string;
  link: string;
};

export type ArquivoUpdate = {
  tipo?: string;
  link?: string;
  updated_at?: string;
};

// ---- ArquivoLivro (join) ----
export interface ArquivoLivro {
  id: number;
  created_at: string;
  updated_at: string;
  id_arquivo: number;
  id_livro: number;
}

export type ArquivoLivroInsert = {
  id_arquivo: number;
  id_livro: number;
};

// ---- Tipos compostos para UI ----
export interface LivroComDetalhes extends Livro {
  autores: Autor[];
  categorias: Categoria[];
  arquivos: Arquivo[];
}

export interface LivroFormData {
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
  capaFile: File | null;
}
