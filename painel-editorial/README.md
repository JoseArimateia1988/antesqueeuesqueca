# Antes que eu esqueça — painel editorial

Este diretório é a fonte oficial do painel editorial com IA. Ele não depende do ChatGPT Sites.

O site público continua nos arquivos da raiz do repositório e é publicado pelo GitHub Pages. O painel é uma aplicação separada porque precisa de backend para proteger login, banco e chave da Anthropic.

## Onde editar

- `app/page.tsx`: telas e fluxo editorial.
- `app/globals.css`: identidade visual e responsividade.
- `worker/index.ts`: login, armazenamento seguro da chave e prompt do Radar com IA.
- `db/schema.ts`: estrutura do banco.
- `drizzle/`: migrações do banco D1.
- `wrangler.jsonc`: configuração da aplicação na Cloudflare.

Os arquivos podem ser editados pelo GitHub no navegador, em qualquer editor local ou por uma IA com acesso ao repositório. A `main` deve ser a fonte usada pela hospedagem externa.

## Rodar no computador

Requisitos: Node.js 22 ou superior.

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

O arquivo `.dev.vars` guarda apenas segredos locais e nunca deve ir para o GitHub.

## Validar

```bash
npm test
```

Esse comando executa lint, TypeScript e o build completo.

## Primeira publicação fora do ChatGPT

1. Criar um banco Cloudflare D1 chamado `antes-que-eu-esqueca-painel`.
2. Trocar o `database_id` provisório de `wrangler.jsonc` pelo ID real retornado pela Cloudflare.
3. Cadastrar os segredos `APP_ENCRYPTION_KEY` e `APP_SETUP_TOKEN` no Worker.
4. Aplicar as migrações com `npm run db:migrate:remote`.
5. Rodar `npm run deploy` ou conectar este diretório ao Cloudflare Workers Builds.
6. Depois do primeiro deploy, vincular o endereço externo escolhido ao Worker.

O `APP_ENCRYPTION_KEY` deve ser uma chave aleatória de 32 bytes em base64. O `APP_SETUP_TOKEN` é usado apenas para ativar o primeiro acesso ao painel.

## Atualizações futuras

Depois da Cloudflare conectada ao GitHub, o fluxo fica:

1. editar os arquivos pelo GitHub ou por qualquer editor;
2. validar a mudança;
3. juntar na `main`;
4. a hospedagem reconstrói e publica automaticamente.

Nunca coloque chave da Anthropic, senha, token de ativação ou chave de criptografia no código.
