# Dra. Ornella Di Leone — site estático

Recriação de [dileonepediatria.com.br](https://dileonepediatria.com.br/) em HTML, CSS e JavaScript. Inclui a página inicial, Sobre mim, Informações, blog com paginação, os 12 artigos publicados e páginas de categorias, preservando os endereços dos artigos.

As imagens, os ícones e as fontes estão no repositório. O site publicado não precisa de WordPress, PHP, banco de dados, APIs ou pacotes JavaScript externos. Node.js é usado apenas para gerar os arquivos antes da publicação.

## Visualizar e gerar

Requer Node.js 22 ou superior. Não é necessário executar `npm install`.

```sh
npm run dev
```

Abra http://localhost:4173/. O servidor regenera os arquivos quando o conteúdo ou os estilos mudam; atualize o navegador para visualizar. Use Ctrl+C para encerrá-lo.

```sh
npm test      # Gera docs/ e verifica links, imagens, títulos e metadados
npm run build # Gera somente os arquivos para publicação em docs/
```

## Publicar no GitHub Pages

1. Execute `npm test` para gerar e verificar o site em `docs/`.
2. Inclua a pasta `docs/` no commit e envie os arquivos para a branch `main` do repositório `luizelias/dileonepediatria`.
3. Em **Settings → Pages → Build and deployment → Source**, escolha **Deploy from a branch**.
4. Em **Branch**, selecione **main** e a pasta **/docs**. Clique em **Save**.

O Pages publica os arquivos prontos de `docs/`, incluindo HTML, imagens, fontes, CSS, JavaScript e `.nojekyll`. O repositório não possui workflow próprio de Actions. O GitHub pode mostrar a publicação interna do Pages na aba Actions, mesmo usando **Deploy from a branch**.

O endereço de produção é https://dileonepediatria.com.br/. A propriedade `url` de `site.config.json` define os endereços dos metadados, sitemap e recursos da página 404; os demais links usam caminhos relativos. O site é servido na raiz desse domínio, sem `/dileonepediatria/`.

Após cada alteração em conteúdo, estilos ou modelos, execute `npm test` e inclua também as mudanças geradas em `docs/` no mesmo commit. Cada envio à `main` com mudanças nessa pasta atualiza o site. Edite os arquivos de origem: as páginas e os recursos de `docs/` são substituídos a cada geração.

Fonte da configuração: [documentação oficial de publicação a partir de uma branch](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

O projeto já usa `https://dileonepediatria.com.br` em `site.config.json`, e `docs/CNAME` contém `dileonepediatria.com.br`. Mantenha esse arquivo versionado; o gerador o preserva durante a limpeza de `docs/`. A configuração de **Settings → Pages → Custom domain** deve usar o mesmo domínio.

O apontamento DNS é uma etapa separada, a ser executada pelo responsável pela zona na HostGator. No domínio principal (`@`), substitua o antigo registro A pelos quatro registros A do GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. Configure `www` como CNAME de `luizelias.github.io`, sem protocolo nem nome do repositório. Preserve os servidores DNS e todos os registros de e-mail. Se houver registros AAAA antigos para o site, remova apenas os conflitantes ou atualize-os conforme a [documentação oficial de domínio personalizado](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

Depois da propagação, confira a emissão do certificado e **Enforce HTTPS** no Pages, as páginas publicadas, os recursos, `www` e o e-mail. Esta implementação não altera DNS. Não remova a hospedagem antiga antes dessa validação; o serviço de e-mail pode continuar dependendo dela. O endereço `luizelias.github.io/dileonepediatria/` pode redirecionar para o domínio próprio assim que ele for associado no GitHub, mesmo antes de concluir a troca de DNS.

## Editar conteúdo

| Arquivo | O que editar |
| --- | --- |
| `content/site.json` | Textos, fotos, depoimentos e links de agendamento |
| `content/posts/*.json` | Título, data, categorias, imagem, resumo e HTML de cada artigo |
| `content/categories.json` | Nomes, IDs e endereços das categorias |
| `assets/styles.css` | Estrutura e estilos básicos |
| `assets/refinements.css` | Identidade visual refinada, tipografia, contraste e layout responsivo |
| `assets/site.js` | Menu, carrossel, compartilhamento e botão de voltar ao topo |
| `scripts/build.mjs` | Modelos das páginas e geração estática |
| `site.config.json` | Nome, descrição e URL de publicação usada na geração |

Para acrescentar um artigo, duplique um JSON em `content/posts`, defina um `slug` único, informe os IDs das categorias e adicione a imagem em `assets/images`. Use caminhos como `assets/images/foto.webp` no JSON e `outro-artigo/` nos links internos do HTML. Execute `npm test` antes de publicar e inclua a pasta `docs/` atualizada no commit.

A imagem principal é `assets/images/bg-hero-png.png`, copiada da versão transparente atualizada de Downloads em 09/11/2026. O fundo claro e o logotipo original foram mantidos. Em telas pequenas, a mesma imagem da criança aparece abaixo da apresentação, sem sobrepor os textos.

## Migração e verificação

- Conteúdo e imagens recuperados do site original em 09/11/2026; os textos dos artigos foram preservados.
- Agendamentos continuam abrindo o WhatsApp da Clínica Trompowsky; a teleconsulta mantém o e-mail original.
- Dois links antigos foram corrigidos para os artigos existentes de febre e desidratação.
- Há metadados por página, dados estruturados, sitemap, robots.txt, `.nojekyll` e página 404.
- Os formulários de comentários e recursos administrativos do WordPress não fazem parte da versão estática. As interações implementadas funcionam no navegador.
- As verificações locais cobrem documentos gerados e destinos internos. A publicação real e o domínio precisam ser conferidos depois do primeiro deploy.

O build não acessa a internet. Somente os links externos escolhidos pelo visitante abrem serviços externos. O crédito visual do estúdio original foi preservado no rodapé.
