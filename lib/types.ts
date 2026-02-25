export interface Database {
  public: {
    Tables: {
      livro: {
        Row: Livro;
        Insert: LivroInsert;
        Update: LivroUpdate;
        Delete: LivroDelete;
      };
      editora: {
        Row: Editora;
        Insert: EditoraInsert;
        Update: EditoraUpdate;
        Delete: EditoraDelete;
      };
      autor: {
        Row: Autor;
        Insert: AutorInsert;
        Update: AutorUpdate;
        Delete: AutorDelete;
      };
      categoria: {
        Row: Categoria;
        Insert: CategoriaInsert;
        Update: CategoriaUpdate;
        Delete: CategoriaDelete;
      };
      autorlivro: {
        Row: AutorLivro;
        Insert: AutorLivroInsert;
        Update: never;
        Delete: never;
      };
      categorialivro: {
        Row: CategoriaLivro;
        Insert: CategoriaLivroInsert;
        Update: never;
        Delete: never;
      };
      arquivo: {
        Row: Arquivo;
        Insert: ArquivoInsert;
        Update: ArquivoUpdate;
        Delete: ArquivoDelete;
      };
      arquivoLivro: {
        Row: ArquivoLivro;
        Insert: ArquivoLivroInsert;
        Update: never;
        Delete: never;
      };
      tag: {
        Row: Tag;
        Insert: TagInsert;
        Update: TagUpdate;
        Delete: TagDelete;
      };
      tagLivro: {
        Row: TagLivro;
        Insert: TagLivroInsert;
        Update: never;
        Delete: never;
      };
      colecao: {
        Row: Colecao;
        Insert: ColecaoInsert;
        Update: ColecaoUpdate;
        Delete: ColecaoDelete;
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
  id_editora: number | null;
  id_colecao: number | null;
  paginas: number;
  idioma: string;
  edicao: number;
  isbn13: string | null;
  isbn10: string | null;
  capa: string | null;
  subtitulo: string | null;
}

export interface LivroInsert {
  titulo: string;
  descricao?: string | null;
  ano: number;
  id_editora?: number | null;
  paginas: number;
  idioma: string;
  edicao: number;
  isbn13?: string | null;
  isbn10?: string | null;
  id_colecao?: number | null;
  capa?: string | null;
}

export interface LivroUpdate {
  titulo?: string;
  descricao?: string | null;
  ano?: number;
  id_editora?: number | null;
  id_colecao?: number | null;
  paginas?: number;
  idioma?: string;
  edicao?: number;
  isbn13?: string | null;
  isbn10?: string | null;
  capa?: string | null;
  updated_at?: string;
}

export interface LivroDelete {
  id: number;
}

// ---- Editora ----
export interface Editora {
  id: number;
  created_at: string;
  updated_at: string;
  nome: string;
}

export interface EditoraInsert {
  nome: string;
}

export interface EditoraUpdate {
  nome?: string;
  updated_at?: string;
}

export interface EditoraDelete {
  id: number;
}

// ---- Colecao ----
export interface Colecao {
  id: number;
  created_at: string;
  updated_at: string;
  nome: string;
}

export interface ColecaoInsert {
  nome: string;
};

export interface ColecaoUpdate {
  nome?: string;
  updated_at?: string;
};

export interface ColecaoDelete {
  id: number;
}


// ---- Autor ----
export interface Autor {
  id: number;
  created_at: string;
  updated_at: string;
  nome: string;
}

export interface AutorInsert {
  nome: string;
};

export interface AutorUpdate {
  nome?: string;
  updated_at?: string;
};

export interface AutorDelete {
  id: number;
}

// ---- Categoria ----
export interface Categoria {
  id: number;
  created_at: string;
  updated_at: string;
  nome: string;
}

export interface CategoriaInsert {
  nome: string;
};

export interface CategoriaUpdate {
  nome?: string;
  updated_at?: string;
};

export interface CategoriaDelete {
  id: number;
};

// ---- AutorLivro (join) ----
export interface AutorLivro {
  id: number;
  created_at: string;
  updated_at: string;
  idLivro: number;
  idAutor: number;
}

export interface AutorLivroInsert {
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

export interface CategoriaLivroInsert {
  idCategoria: number;
  idLivro: number;
};

export interface CategoriaLivroUpdate {
  idCategoria?: number;
  idLivro?: number;
  updated_at?: string;
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

export interface ArquivoInsert {
  id_livro: number;
  tipo: string;
  link: string;
};

export interface ArquivoUpdate {
  tipo?: string;
  link?: string;
  updated_at?: string;
};

export interface ArquivoDelete {
  id: number;
};

export interface Tag {
  id: number;
  created_at: string;
  updated_at: string;
  nome: string;
}

export interface TagInsert {
  nome: string;
};

export interface TagUpdate {
  nome?: string;
  updated_at?: string;
};

export interface TagDelete {
  id: number;
};

export interface TagLivro {
  id: number;
  created_at: string;
  updated_at: string;
  id_tag: number;
  id_livro: number;
};

export interface TagLivroInsert {
  id_tag: number;
  id_livro: number;
};

// ---- ArquivoLivro (join) ----
export interface ArquivoLivro {
  id: number;
  created_at: string;
  updated_at: string;
  id_arquivo: number;
  id_livro: number;
}

export interface ArquivoLivroInsert {
  id_arquivo: number;
  id_livro: number;
};

// ---- Tipos compostos para UI ----
export interface LivroComDetalhes extends Livro {
  autores: Autor[];
  categorias: Categoria[];
  arquivos: Arquivo[];
  tags: Tag[];
  colecao: Colecao | null;
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
  id_colecao: string;
  subtitulo: string;
  autoresIds: number[];
  categoriasIds: number[];
  tagsIds: number[];
  capaFile: File | null;
}

export interface Usuario {
  nome: string;
};
