# Fluxo editorial — Antes que eu esqueça

## Fonte oficial

- Produção: `https://nagaveta.moodlabs.com.br`
- Repositório: `JoseArimateia1988/antesqueeuesqueca`
- Branch publicada: `main`
- Analytics a preservar: `G-EP2SKWWE0S`

Toda ferramenta deve começar lendo a versão mais recente do repositório. Nunca usar uma cópia antiga de conversa como fonte do código.

## Como criar ou atualizar uma edição

1. Abra `painel/index.html` em um navegador.
2. Preencha o projeto pelas etapas Radar, Pesquisa, Arquitetura, Escrita, Imagens, Prévia e QA.
3. Exporte o arquivo JSON.
4. Entregue o JSON para a IA junto do endereço do repositório.
5. A IA cria uma branch `agent/<nome-da-edicao>`, gera a página e atualiza home/arquivo.
6. A IA testa links, imagens, responsividade e Analytics.
7. A IA devolve uma prévia ou PR. A `main` só é alterada depois da aprovação da Camis.

## Regras para qualquer IA

- Não publicar direto na `main`.
- Não inventar memória, opinião ou reação da Camis.
- Curadoria pode ser frequente; publicação não precisa ser.
- Pesquisa não vira texto sem a aprovação da arquitetura.
- Preservar home, arquivo, páginas existentes, identidade e Analytics.
- Não substituir componentes ou estilos globais sem explicar o impacto.
- Embeds precisam de fallback por link.
- Informar arquivos alterados, testes feitos e pendências humanas.

## Sobre o painel

O painel é um MVP local-first. O rascunho fica no `localStorage` do navegador e pode ser transferido entre computadores pelo JSON exportado. Ele não possui token nem acesso direto ao GitHub. Essa limitação é intencional: um painel público no GitHub Pages não pode guardar credenciais de escrita com segurança.

Os arquivos de imagem escolhidos servem apenas para a prévia da sessão. O JSON registra o nome, legenda, crédito e proporção, mas não inclui os bytes da imagem. Os arquivos finais devem ser adicionados à branch da edição.
