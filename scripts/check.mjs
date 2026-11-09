import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const base = new URL(process.env.SITE_URL || config.url).pathname.replace(/\/$/, '');
const errors = [];
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const allFiles = await files(out);
const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
const contentCache = new Map();
for (const file of htmlFiles) contentCache.set(file, await readFile(file, 'utf8'));
let checkedLinks = 0;
for (const [file, html] of contentCache) {
  const relative = path.relative(out, file);
  const fail = message => errors.push(`${relative}: ${message}`);
  if (!html.includes('<html lang="pt-BR"')) fail('Idioma ausente');
  if ((html.match(/<h1\b/g) || []).length !== 1) fail('A página precisa ter exatamente um h1');
  if (!/<title>.+?<\/title>/.test(html)) fail('Título ausente');
  if (!/<meta name="description" content="[^\"]+"/.test(html)) fail('Descrição ausente');
  if (/wp-json|wp-includes|admin-ajax|jquery|js_composer/.test(html)) fail('Dependência do WordPress encontrada');
  for (const match of html.matchAll(/<(?:script|img|link)\b[^>]*(?:src|href)="(https?:[^\"]+)"/g)) {
    if (!match[0].includes('canonical')) fail(`Recurso remoto: ${match[1]}`);
  }
  for (const match of html.matchAll(/(?:href|src)="([^\"]+)"/g)) {
    const value = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|tel:|data:)/.test(value)) continue;
    const [pathname, fragment] = value.split('#');
    const clean = decodeURIComponent(pathname.split('?')[0]);
    let target = clean.startsWith('/') ? path.join(out, clean.slice(base.length)) : clean ? path.resolve(path.dirname(file), clean) : file;
    try {
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
      await stat(target);
      if (fragment && target.endsWith('.html')) {
        const content = contentCache.get(target) || await readFile(target, 'utf8');
        if (!content.includes(`id="${fragment}"`)) fail(`Âncora inexistente: ${value}`);
      }
      checkedLinks++;
    } catch { fail(`Link/arquivo inexistente: ${value}`); }
  }
  for (const match of html.matchAll(/url\('([^']+)'\)/g)) {
    try { await stat(path.resolve(path.dirname(file), match[1])); } catch { fail(`Fundo inexistente: ${match[1]}`); }
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { fail('JSON-LD inválido'); }
  }
}
const posts = (await readdir(path.join(root, 'content/posts'))).filter(p => p.endsWith('.json'));
for (const file of posts) {
  const post = JSON.parse(await readFile(path.join(root, 'content/posts', file), 'utf8'));
  assert.ok(post.html.length > 500, `Conteúdo incompleto: ${file}`);
  assert.ok(contentCache.has(path.join(out, post.slug, 'index.html')), `Artigo não gerado: ${file}`);
}
const home = contentCache.get(path.join(out, 'index.html'));
assert.ok(home.includes('assets/images/bg-hero-png.png'), 'A imagem atualizada do usuário deve estar no hero');
assert.ok(!home.includes('site-header on-dark'), 'O topo da página inicial deve manter o layout claro');
for (const file of allFiles.filter(f => f.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\("([^\"]+)"\)/g)) {
    try { await stat(path.resolve(path.dirname(file), match[1])); } catch { errors.push(`Recurso CSS inexistente: ${match[1]}`); }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`OK: ${htmlFiles.length} documentos, ${posts.length} artigos, ${checkedLinks} links e recursos locais. Sem dependências do WordPress.`);
