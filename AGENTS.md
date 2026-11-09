# Instruções para agentes

## Publicação: main + /docs

Por decisão explícita do usuário, este site deve ser publicado pelo GitHub Pages diretamente da branch `main`, usando a pasta `/docs` e a opção **Deploy from a branch**.

- Mantenha esse modelo de publicação. Não recrie `.github/workflows/pages.yml` nem adicione um workflow de build/deploy com GitHub Actions, a menos que o usuário peça para mudar o modelo.
- `docs/` contém o site completo já gerado e **deve ser versionada no Git**. Não adicione essa pasta ao `.gitignore`.
- `dist/` é uma saída antiga, ignorada e fora do fluxo de publicação. Build, verificação e servidor local usam `docs/`.
- O GitHub pode mostrar uma execução interna do Pages na aba Actions mesmo publicando de uma branch; isso não exige um workflow próprio no repositório.

## Fluxo de trabalho obrigatório

1. Edite as fontes em `content/`, `assets/`, `scripts/` e `site.config.json`. Não faça correções apenas no HTML, CSS ou nos recursos gerados de `docs/`: eles serão substituídos na próxima geração.
2. Após mudanças que afetem o site, execute `npm test`. Esse comando regenera `docs/` e verifica páginas, artigos, links, imagens e metadados. Corrija falhas antes de publicar.
3. Confira o diff e inclua as alterações das fontes **e de `docs/` no mesmo commit**, incluindo a remoção de arquivos gerados que deixaram de existir.
4. Ao enviar uma atualização para publicação, use a branch `main`. Alterar somente as fontes no GitHub não regenera o site: o Pages serve os arquivos prontos de `docs/`.

Requer Node.js 22 ou superior; o projeto não precisa de `npm install`.

- `npm run dev`: gera e serve `docs/` em http://localhost:4173/, regenerando ao mudar conteúdo, estilos ou scripts.
- `npm run build`: gera `docs/` sem executar as verificações.
- `npm run check`: verifica os arquivos já presentes em `docs/`.
- `npm test`: gera e verifica; é a validação usada antes de publicar alterações do site.

## Configuração do GitHub e domínio

- Repositório: `luizelias/dileonepediatria`.
- Em **Settings → Pages → Build and deployment**, a configuração desejada é **Source: Deploy from a branch**, **Branch: main**, **Folder: /docs**, seguida de **Save**.
- URL de produção: https://dileonepediatria.com.br/. O domínio foi escolhido pelo usuário para substituir a hospedagem WordPress anterior.
- `site.config.json` deve usar `https://dileonepediatria.com.br` e `docs/CNAME` deve conter apenas `dileonepediatria.com.br`. Preserve essa configuração nos próximos builds e commits.
- `url` em `site.config.json` define os endereços canônicos, metadados, sitemap, robots.txt e a base dos links e recursos da página 404. No domínio próprio, o site é servido na raiz, sem `/dileonepediatria/`. Preserve os links relativos; o gerador também suporta subdiretórios para outros ambientes.
- Mantenha `docs/.nojekyll`, `docs/index.html`, `docs/404.html` e todos os recursos necessários dentro da pasta publicada.
- A associação em **Settings → Pages → Custom domain** e o apontamento DNS são etapas separadas. O arquivo `docs/CNAME` não substitui a configuração do Pages. Ao preparar esta migração, o DNS ainda estava na HostGator, sob responsabilidade do administrador da hospedagem anterior; verifique o estado atual antes de afirmar que o domínio já migrou.
- Para o DNS, use os quatro registros A oficiais do GitHub Pages no domínio principal e `www` como CNAME de `luizelias.github.io`, sem o nome do repositório. Preserve os servidores DNS e os registros de e-mail, incluindo MX, `mail`, SPF, DKIM e DMARC.
- Após o DNS apontar para o GitHub, confira o certificado e **Enforce HTTPS**, além do domínio principal e `www`. Não remova a hospedagem anterior antes da validação e da confirmação sobre o serviço de e-mail.
- Se existir `docs/CNAME`, preserve-o. O GitHub pode criá-lo ao configurar um domínio próprio; sincronize mudanças remotas antes de gerar e publicar novamente. O gerador preserva esse arquivo durante a limpeza de `docs/`.
- Um push concluído não comprova que a publicação está no ar nem que as configurações do Pages foram alteradas. Informe somente o que foi efetivamente verificado.

Veja `README.md` para o mapa dos arquivos de conteúdo e os passos de publicação.
