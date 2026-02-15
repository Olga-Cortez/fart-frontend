# FART Frontend

Sistema de gerenciamento de biblioteca pessoal construído com Next.js, Supabase e Google Drive.

## 📚 Funcionalidades

- **Gerenciamento de Livros**: Cadastro, edição e remoção de livros
- **Autores e Categorias**: Organização por autores e categorias
- **Upload de PDFs**: Integração com Google Drive para armazenamento de arquivos
- **Capas de Livros**: Upload de imagens de capa via Supabase Storage
- **Busca**: Sistema de busca por título, descrição, editora e ISBN

## 🚀 Tecnologias

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: Supabase (PostgreSQL)
- **Armazenamento**: 
  - Google Drive (PDFs dos livros)
  - Supabase Storage (Capas dos livros)
- **Estilização**: CSS Modules
- **Icons**: Lucide React

## ⚙️ Configuração

### Pré-requisitos

- Node.js 18+ 
- Conta no Supabase
- Conta no Google Cloud (para API do Google Drive)

### Instalação

1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd fart-frontend
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_do_supabase

# Google Drive API
NEXT_PUBLIC_GOOGLE_API_KEY=sua_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
```

Para configurar o Google Drive API, consulte o guia detalhado: [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md)

4. Execute o servidor de desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📁 Estrutura do Projeto

```
app/
├── autores/          # Gerenciamento de autores
├── categorias/       # Gerenciamento de categorias
├── livros/           # Gerenciamento de livros
│   ├── [id]/        # Detalhes e edição
│   └── novo/        # Criação de livro
components/
├── ConfirmModal.tsx  # Modal de confirmação
├── EmptyState.tsx    # Estado vazio
├── GoogleDriveUploader.tsx  # Upload para Google Drive
├── LivroCard.tsx     # Card de livro
├── LivroForm.tsx     # Formulário de livro
├── Loading.tsx       # Componente de loading
├── SearchBar.tsx     # Barra de busca
└── Sidebar.tsx       # Navegação lateral
lib/
├── googleDrive.ts    # Utilitários Google Drive API
├── services.ts       # Serviços de API (Supabase)
├── supabase.ts       # Cliente Supabase
└── types.ts          # Tipos TypeScript
```

## 🗄️ Banco de Dados (Supabase)

### Tabelas

- `livro`: Informações dos livros
- `autor`: Autores
- `categoria`: Categorias
- `autorlivro`: Relacionamento N:N entre autores e livros
- `categorialivro`: Relacionamento N:N entre categorias e livros
- `arquivo`: Links para arquivos no Google Drive

### Storage Buckets

- `capas`: Armazena as imagens de capa dos livros (público)

## 🔐 Segurança

- Nunca commite o arquivo `.env.local`
- Configure as restrições apropriadas no Google Cloud Console
- Em produção, adicione apenas domínios autorizados nas credenciais OAuth

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Lembre-se de adicionar as variáveis de ambiente no painel da Vercel e atualizar os domínios autorizados no Google Cloud Console.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📝 Licença

Este projeto está sob a licença especificada no arquivo LICENSE.
