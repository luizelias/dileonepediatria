import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs');
const readJSON = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const config = await readJSON('site.config.json');
const site = await readJSON('content/site.json');
const categories = await readJSON('content/categories.json');
const posts = await Promise.all((await readdir(path.join(root, 'content/posts')))
  .filter(file => file.endsWith('.json')).map(file => readJSON(`content/posts/${file}`)));
posts.sort((a, b) => b.date.localeCompare(a.date));
const siteURL = (process.env.SITE_URL || config.url).replace(/\/$/, '');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const strip = text => text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const date = value => value.slice(0, 10).split('-').reverse().join('.');
const absolute = route => `${siteURL}/${route}`;
const prefix = route => '../'.repeat(route.split('/').filter(Boolean).length);
const link = (route, target) => `${prefix(route)}${target || './'}`;
const icon = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.4 11.6a8.4 8.4 0 0 1-12.5 7.3L3.6 20l1.2-4.1a8.4 8.4 0 1 1 15.6-4.3Z"/><path d="M8 7.4c.4-.3.8-.2 1 .2l1 2-1 1.2c.8 1.5 1.9 2.5 3.5 3.2l1.1-1 2.1.9c.5.2.4.8.2 1.2-.6 1.1-1.5 1.5-2.9 1.1-3.6-1-6.6-4.1-6.5-6.7 0-.9.7-1.8 1.5-2.1Z"/></svg>`;

function appointment(item, label = item.label, extra = '') {
  return `<a class="appointment ${extra}" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(label)}</span><span class="appointment-icon">${icon}</span></a>`;
}
const appointments = (horizontal = false) => `<div class="appointments${horizontal ? ' appointments-inline' : ''}">${site.appointments.map(item => appointment(item)).join('')}</div>`;
const checks = list => `<ul class="check-list">${list.map(text => `<li>${text}</li>`).join('')}</ul>`;
const image = (src, alt, route, cls = '', eager = false) => `<img src="${esc(link(route, src))}" alt="${esc(alt)}" class="${cls}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
const categoryLinks = (post, route) => post.categories.map(id => categories.find(c => c.id === id)).filter(Boolean).map(c => `<a href="${link(route, `category/${c.slug}/`)}">${esc(c.name)}</a>`).join(' ');

function header(route, dark = false) {
  return `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <header class="site-header${dark ? ' on-dark' : ''}${route === '' || dark ? ' over-hero' : ''}">
    <div class="container header-inner">
      <a class="brand" href="${link(route, '')}" aria-label="Dra. Ornella Di Leone — início">${image(site.logo, config.name, route, '', true)}</a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="navigation" aria-label="Abrir menu"><span></span><span></span><span></span></button>
      <nav id="navigation" class="navigation" aria-label="Menu principal">
        <a ${route === 'sobre/' ? 'aria-current="page"' : ''} href="${link(route, 'sobre/')}">Sobre mim</a>
        <a ${route.startsWith('blog/') ? 'aria-current="page"' : ''} href="${link(route, 'blog/')}">Dicas e Blog</a>
        <a ${route === 'informacoes/' ? 'aria-current="page"' : ''} href="${link(route, 'informacoes/')}">Informações</a>
        ${appointment(site.appointments[0], 'Agendar Consulta', 'nav-appointment')}
      </nav>
    </div>
  </header>`;
}

function footer(route) {
  return `<footer class="site-footer"><div class="container">
    <h2>Vamos Cuidar Juntos?</h2>
    <p class="footer-message">Sua decisão de estar aqui hoje já é o primeiro passo para um futuro mais saudável.</p>
    ${appointment(site.appointments[0], 'Agende sua Consulta')}
    <div class="footer-details"><p><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></svg>Consultório no coração de Florianópolis</p>
    <p><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>Horários flexíveis, pensados para famílias reais</p></div>
    ${image(site.footerLogo, 'Logomarca — Dra. Ornella Di Leone', route, 'footer-logo')}
    <p class="credits">Created by <a href="https://cumaru.me/" target="_blank" rel="noopener noreferrer">Cumaru Creative Studio</a></p>
  </div></footer><a class="back-to-top" href="#top" aria-label="Voltar ao topo">↑</a>`;
}

function document({ route = '', title = config.name, body, dark = false, description = config.description, photo = site.shareImage, article, noindex = false }) {
  const schema = article ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, datePublished: article.date, dateModified: article.modified, image: absolute(photo), author: { '@type': 'Person', name: 'Ornella Di Leone' }, mainEntityOfPage: absolute(route), inLanguage: 'pt-BR' } : { '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: absolute(route), inLanguage: 'pt-BR' };
  return `<!doctype html>
<html lang="pt-BR" id="top"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title === config.name ? title : `${title} - ${config.name}`)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<link rel="canonical" href="${esc(absolute(route))}">
<meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(config.name)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(absolute(route))}"><meta property="og:image" content="${esc(absolute(photo))}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${link(route, site.favicon)}"><link rel="preload" href="${link(route, 'assets/fonts/plus-jakarta-sans-latin.woff2')}" as="font" type="font/woff2" crossorigin>
${route === '' ? `<link rel="preload" href="${link(route, site.heroImage)}" as="image" fetchpriority="high">` : ''}
<link rel="stylesheet" href="${link(route, 'assets/styles.css')}">
<link rel="stylesheet" href="${link(route, 'assets/refinements.css')}">
<script src="${link(route, 'assets/site.js')}" defer></script>
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
</head><body class="${route === '' ? 'home' : article ? 'post-page' : 'inner-page'}">
${header(route, dark)}<main id="conteudo">${body}</main>${footer(route)}</body></html>`;
}

function aboutSection(route, standalone = false) {
  return `<section class="section tint about-section${standalone ? ' standalone-about' : ''}" id="sobre"><div class="container split">
    <div class="split-text"><${standalone ? 'h1' : 'h2'}>Sobre mim</${standalone ? 'h1' : 'h2'}>${site.about}${standalone ? '' : appointments()}</div>
    ${image(site.aboutImage, 'Dra. Ornella Di Leone', route, 'portrait', standalone)}
  </div></section>`;
}

function educationSection(route) {
  return `<section class="section tint" id="formacao"><div class="container split education"><div><h2>Formação</h2>${site.education}</div><div><h3>Últimos eventos que participei</h3>${checks(site.events)}</div></div></section>`;
}

function postCard(post, route, details = false) {
  const target = link(route, `${post.slug}/`);
  return `<article class="post-card${details ? ' detailed' : ''}"><a class="post-image" href="${target}" aria-label="${esc(post.title)}">${image(post.image, post.imageAlt || post.title, route)}</a><div class="post-card-body">
${details ? `<div class="post-categories">${categoryLinks(post, route)}</div>` : ''}
  <h3><a href="${target}">${esc(post.title)}</a></h3>
${details ? `<p class="excerpt">${esc(post.excerpt.split(/\s+/).slice(0, 20).join(' ').replace(/[….,:;]$/, '') + '…')}</p><div class="post-byline">Ornella Di Leone <time datetime="${post.date.slice(0, 10)}">${date(post.date)}</time></div>` : ''}
  </div></article>`;
}

function home() {
  return document({ body: `<section class="hero" style="background-image:url('${site.heroImage}')"><div class="container"><div class="hero-copy">
    <h1>${esc(site.title)}</h1><p class="hero-intro">${esc(site.intro)}</p>${checks(site.heroChecks)}${appointments()}
  </div><div class="hero-mobile" aria-hidden="true" style="background-image:url('${site.heroImage}')"></div></div></section>
  <section class="section philosophy"><div class="container narrow"><h2>${esc(site.philosophyTitle)}</h2>${site.philosophy}${appointments()}</div></section>
  <section class="section tint benefits"><div class="container split">${image(site.benefitsImage, 'Dra. Ornella Di Leone com seu estetoscópio', '', 'portrait')}<div class="split-text"><h2>${esc(site.benefitsTitle)}</h2>${checks(site.benefits)}${site.benefitsEnd}${appointments()}</div></div></section>
  <section class="section services" id="servicos"><div class="container"><div class="narrow"><h2>${esc(site.servicesTitle)}</h2>${site.servicesIntro}</div><div class="service-grid">${site.services.map(service => `<article class="service-card">${image(service.icon, '', '', 'service-icon')}<h3>${esc(service.title)}</h3>${service.body}</article>`).join('')}</div></div></section>
  ${aboutSection('')}
  <section class="section testimonials" aria-label="Depoimentos"><h2>Depoimentos</h2><div class="testimonial-carousel" aria-roledescription="carrossel"><div class="testimonial-track" tabindex="0" aria-label="Depoimentos das famílias">${site.testimonials.map((item, index) => `<figure class="testimonial" role="group" aria-label="${index + 1} de ${site.testimonials.length}"><blockquote><span class="quote-mark" aria-hidden="true">“</span><p>${item.body}</p></blockquote><figcaption><strong>${esc(item.name)}</strong><span>${esc(item.role)}</span></figcaption></figure>`).join('')}</div>
    <div class="carousel-controls"><button type="button" data-slide="previous" aria-label="Depoimento anterior">←</button><span class="carousel-position" aria-live="polite">1 / ${site.testimonials.length}</span><button type="button" data-slide="next" aria-label="Próximo depoimento">→</button></div></div>${appointments(true)}</section>
  ${educationSection('')}
  <section class="section home-blog" id="blog"><div class="container"><div class="section-heading"><h2>Dicas e Blog</h2><a class="view-all" href="blog/">Ver todos <span aria-hidden="true">→</span></a></div><div class="post-grid">${posts.map(p => postCard(p, '')).join('')}</div></div></section>` });
}

function blog(route, list = posts, page = 1, category = null) {
  const total = Math.ceil(list.length / 10);
  const items = list.slice((page - 1) * 10, page * 10);
  const base = category ? `category/${category.slug}/` : 'blog/';
  return document({ route, title: category ? category.name : 'Dicas e Blog', body: `<section class="section blog-list"><div class="container">${category ? `<h1 class="archive-title">${esc(category.name)}</h1><a class="back-link" href="${link(route, 'blog/')}">← Todos os artigos</a>` : '<h1 class="archive-title">Dicas e Blog</h1>'}<div class="post-grid">${items.map(p => postCard(p, route, true)).join('')}</div>
  ${total > 1 ? `<nav class="pagination" aria-label="Páginas do blog">${Array.from({ length: total }, (_, i) => `<a ${page === i + 1 ? 'aria-current="page"' : ''} href="${link(route, i === 0 ? base : `${base}page/${i + 1}/`)}">${i + 1}</a>`).join('')}${page < total ? `<a href="${link(route, `${base}page/${page + 1}/`)}">Próxima →</a>` : ''}</nav>` : ''}</div></section>` });
}

function localizeHTML(html, route) {
  return html.replace(/(href|src)="([^\"]*)"/g, (match, attribute, value) => {
    if (/^(?:https?:|mailto:|tel:|#|data:)/.test(value)) return match;
    return `${attribute}="${link(route, value.replace(/^\//, ''))}"`;
  }).replace(/<img\b/g, '<img loading="lazy" decoding="async"');
}

function article(post) {
  const route = `${post.slug}/`;
  const minutes = Math.max(1, Math.ceil(strip(post.html).split(' ').length / 200));
  const related = posts.filter(p => p.slug !== post.slug).sort((a, b) => Number(b.categories.some(c => post.categories.includes(c))) - Number(a.categories.some(c => post.categories.includes(c)))).slice(0, 3);
  return document({ route, title: post.title, dark: true, description: post.excerpt.slice(0, 200), photo: post.image, article: post,
    body: `<header class="article-hero" style="background-image:url('${link(route, post.image)}')"><div class="container"><div class="article-categories">${categoryLinks(post, route)}</div><h1>${esc(post.title)}</h1><p class="article-meta"><time datetime="${post.date.slice(0, 10)}">${date(post.date)}</time><span>${minutes} min de leitura</span></p></div></header>
    <article class="article-body">${localizeHTML(post.html, route)}<div class="article-end"><a href="${link(route, 'blog/')}">← Voltar para Dicas e Blog</a><button class="share-article" type="button">Compartilhar artigo</button><span class="share-status" role="status"></span></div></article>
    <section class="section related"><div class="container"><h2>Leia também</h2><div class="post-grid">${related.map(p => postCard(p, route)).join('')}</div></div></section>` });
}

export async function build() {
  // Only the known generated directory is replaced; source content is never removed.
  if (path.dirname(out) !== root || path.basename(out) !== 'docs') throw new Error('Invalid output directory');
  // Pages may create this file when a custom domain is configured in the repository settings.
  const cname = await readFile(path.join(out, 'CNAME'), 'utf8').catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  if (cname !== null) await writeFile(path.join(out, 'CNAME'), cname);
  await cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
  const routes = [];
  async function page(route, html, index = true) {
    const target = path.join(out, route, 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
    if (index) routes.push(route);
  }
  await page('', home());
  await page('sobre/', document({ route: 'sobre/', title: 'Sobre mim', body: `${aboutSection('sobre/', true)}<section class="section philosophy"><div class="container narrow"><h2>Minha formação</h2>${site.aboutEducation}${appointment(site.appointments[0], 'Agende sua Consulta')}</div></section><section class="section tint"><div class="container split"><div><h2>Eventos que participei</h2>${checks(site.events)}</div>${image(site.eventsImage, 'Dra. Ornella Di Leone', 'sobre/', 'portrait')}</div></section>` }));
  await page('informacoes/', document({ route: 'informacoes/', title: 'Informações', body: `<section class="section"><div class="container information"><h1 class="sr-only">Informações sobre o atendimento</h1>${site.information}</div></section>` }));
  for (let n = 1; n <= Math.ceil(posts.length / 10); n++) {
    const route = n === 1 ? 'blog/' : `blog/page/${n}/`;
    await page(route, blog(route, posts, n));
  }
  for (const category of categories) {
    const items = posts.filter(p => p.categories.includes(category.id));
    for (let n = 1; n <= Math.max(1, Math.ceil(items.length / 10)); n++) {
      const route = `category/${category.slug}/${n === 1 ? '' : `page/${n}/`}`;
      await page(route, blog(route, items, n, category));
    }
  }
  for (const post of posts) await page(`${post.slug}/`, article(post));
  // The old homepage alias remains a real static document, preserving incoming links.
  await page('dra-ornella-di-leone-medica-pediatra/', document({ route: 'dra-ornella-di-leone-medica-pediatra/', title: config.name, noindex: true, body: `<section class="section"><div class="container narrow"><h1>Calma, mãe!</h1><p>${esc(site.intro)}</p><a class="appointment" href="../">Visitar a página inicial →</a></div></section>` }), false);
  // GitHub serves 404.html at arbitrary depths, so its assets/navigation use the deployment base.
  const basePath = new URL(siteURL).pathname.replace(/\/$/, '');
  const notFound = document({ title: 'Página não encontrada', noindex: true, body: '<section class="section not-found"><div class="container narrow"><h1>Página não encontrada</h1><p>Vamos encontrar o caminho de volta?</p><a class="appointment" href="./">Ir para o início →</a></div></section>' })
    .replace(/(href|src)="(?!https?:|mailto:|tel:|#|data:)([^\"]*)"/g, (_, attr, value) => `${attr}="${basePath}/${value === './' ? '' : value}"`);
  await writeFile(path.join(out, '404.html'), notFound);
  await writeFile(path.join(out, '.nojekyll'), '');
  await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${absolute('sitemap.xml')}\n`);
  await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${esc(absolute(route))}</loc></url>`).join('')}</urlset>\n`);
  console.log(`Geradas ${routes.length} páginas e 404.html em ${out}`);
  return routes;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
