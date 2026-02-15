# Configuração do Google Drive API

Este guia explica como configurar a integração com o Google Drive para fazer upload de PDFs dos livros.

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o nome do projeto

## Passo 2: Ativar a API do Google Drive

1. No menu lateral, vá em **APIs e Serviços** > **Biblioteca**
2. Busque por "Google Drive API"
3. Clique em "Google Drive API"
4. Clique em **Ativar**

## Passo 3: Criar Credenciais

### 3.1 Criar API Key

1. No menu lateral, vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ Criar Credenciais** > **Chave de API**
3. Copie a chave gerada
4. (Opcional) Clique em **Restringir chave** para adicionar restrições de segurança:
   - Restrições de aplicativo: Sites HTTP
   - Adicione: `http://localhost:3000` e seu domínio de produção
   - Restrições de API: Selecione "Google Drive API"
5. Salve a chave no arquivo `.env.local` como `NEXT_PUBLIC_GOOGLE_API_KEY`

### 3.2 Criar OAuth 2.0 Client ID

1. Ainda em **Credenciais**, clique em **+ Criar Credenciais** > **ID do cliente OAuth**
2. Se for a primeira vez, você precisará configurar a tela de consentimento OAuth:
   - Clique em **Configurar tela de consentimento**
   - Escolha **Externo** (ou Interno se for Google Workspace)
   - Preencha as informações obrigatórias:
     - Nome do app
     - E-mail de suporte do usuário
     - E-mail do desenvolvedor
   - Clique em **Salvar e continuar**
   - Em **Escopos**, adicione o escopo: `https://www.googleapis.com/auth/drive.file`
   - Clique em **Salvar e continuar**
   - Em **Usuários de teste** (se externo), adicione os e-mails que poderão testar
   - Clique em **Voltar ao painel**

3. Agora crie o OAuth Client ID:
   - Tipo de aplicativo: **Aplicação da Web**
   - Nome: "FART Frontend" (ou o nome que preferir)
   - **Origens JavaScript autorizadas**:
     - Adicione: `http://localhost:3000`
     - Adicione seu domínio de produção (ex: `https://seuapp.vercel.app`)
   - **URIs de redirecionamento autorizados**:
     - Adicione: `http://localhost:3000`
     - Adicione seu domínio de produção
   - Clique em **Criar**
4. Copie o **ID do cliente** gerado
5. Salve no arquivo `.env.local` como `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Passo 4: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env.local` (se ainda não existir)
2. Adicione as seguintes variáveis:

```env
# Supabase (suas credenciais existentes)
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_do_supabase

# Google Drive API
NEXT_PUBLIC_GOOGLE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
```

## Passo 5: Testar a Integração

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página de criação de livro: `http://localhost:3000/livros/novo`

3. Na seção **Arquivos (PDF do Google Drive)**, você verá duas opções:
   - **Fazer Upload para Drive**: Faz upload direto de um arquivo PDF do seu computador para o Google Drive
   - **Colar Link do Drive**: Cole um link de arquivo já existente no Google Drive

4. Ao clicar em "Fazer Upload para Drive":
   - Na primeira vez, será solicitado o login com sua conta Google
   - Autorize o app a acessar o Google Drive
   - Selecione o arquivo PDF
   - O arquivo será enviado ao seu Google Drive e o link será salvo automaticamente

## Permissões do Google Drive

Os arquivos enviados pela aplicação recebem permissão de leitura pública (`reader` para `anyone`), permitindo que qualquer pessoa com o link possa visualizar o arquivo.

Se preferir manter os arquivos privados, você pode:
1. Remover a chamada `makeFilePublic()` em [lib/googleDrive.ts](lib/googleDrive.ts#L127)
2. Gerenciar as permissões manualmente no Google Drive

## Segurança

- **Nunca** commite o arquivo `.env.local` no git
- As credenciais `NEXT_PUBLIC_*` são expostas no navegador, mas são seguras para uso client-side
- Configure as restrições de API Key e OAuth no Google Cloud Console
- Em produção, adicione apenas os domínios autorizados

## Limitações da API Gratuita

O Google Drive API possui quotas gratuitas:
- 1 bilhão de requisições de leitura/dia
- 10.000 requisições de escrita/dia por projeto

Para a maioria dos casos de uso, isso é mais que suficiente. Se precisar de mais, consulte os [planos pagos do Google Cloud](https://cloud.google.com/storage/pricing).

## Troubleshooting

### "Acesso negado ao Google Drive"
- Verifique se as credenciais estão corretas no `.env.local`
- Confirme que a API do Google Drive está ativada
- Verifique se os domínios estão corretos nas credenciais OAuth

### "URL do Google Drive inválida"
- O link deve estar no formato: `https://drive.google.com/file/d/FILE_ID/view`
- Certifique-se de que o arquivo tem permissões adequadas de compartilhamento

### Erros de CORS
- Verifique se adicionou o domínio nas **Origens JavaScript autorizadas** nas credenciais OAuth

## Armazenamento

- **PDFs dos livros**: Google Drive (via upload ou link)
- **Capas dos livros**: Supabase Storage (bucket `capas`)
