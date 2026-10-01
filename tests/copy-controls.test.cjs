const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Test the TypeScript modules with the project's existing compiler, no test dependency.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  });
  module._compile(outputText, filename);
};
const controls = require('../lib/copy-controls.ts');
const generate = require('../app/api/generate-copy/route.ts');
const regenerate = require('../app/api/regenerate-slide/route.ts');
const { NextRequest } = require('next/server');
const request = (body, endpoint = 'generate-copy') => new NextRequest(`http://localhost/api/${endpoint}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});
const tokens = text => text.match(/\S+/g) || [];

function mockModel(t, result) {
  const originalFetch = global.fetch;
  const originalKey = process.env.GROQ_API_KEY;
  const originalOrder = process.env.AI_TEXT_PROVIDER_ORDER;
  let payload;
  process.env.GROQ_API_KEY = 'test-placeholder';
  process.env.AI_TEXT_PROVIDER_ORDER = 'groq';
  global.fetch = async (url, options) => {
    assert.equal(String(url), 'https://api.groq.com/openai/v1/chat/completions');
    payload = JSON.parse(options.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }), { status: 200 });
  };
  t.after(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = originalKey;
    if (originalOrder === undefined) delete process.env.AI_TEXT_PROVIDER_ORDER; else process.env.AI_TEXT_PROVIDER_ORDER = originalOrder;
  });
  return () => payload;
}

test('legacy callers keep rewrite and automatic highlights', () => {
  assert.deepEqual(controls.normalizeCopyOptions(), { textMode: 'rewrite', highlightMode: 'auto', highlightWords: [] });
  assert.deepEqual(controls.normalizeCopyOptions(null), controls.normalizeCopyOptions());
});

test('manual words are normalized without accepting other types', () => {
  assert.deepEqual(controls.normalizeCopyOptions({ highlightMode: 'manual', highlightWords: [' foco ', 'foco', 7, null, 'liberdade'] }).highlightWords, ['foco', 'liberdade']);
});

test('disabled highlights remove every model suggestion', () => {
  const slide = controls.applyHighlightChoice({ title: 'Tenha foco', supportText: 'Mais liberdade', highlightWords: ['foco', 'liberdade'] }, controls.normalizeCopyOptions({ highlightMode: 'none' }));
  assert.deepEqual(slide.highlightWords, []);
});

test('manual highlights reject unauthorized and absent model words', () => {
  const slide = controls.applyHighlightChoice({ title: 'Tenha FOCO', supportText: 'Mais liberdade', highlightWords: ['liberdade'] }, controls.normalizeCopyOptions({ highlightMode: 'manual', highlightWords: 'foco, palavra ausente' }));
  assert.deepEqual(slide.highlightWords, ['foco']);
});

test('automatic highlights keep only literal expressions in copy', () => {
  const slide = controls.applyHighlightChoice({ title: 'Foco e C++', supportText: '', highlightWords: ['C++', 'C++', 'invenção', 42] }, controls.normalizeCopyOptions());
  assert.deepEqual(slide.highlightWords, ['C++']);
});

test('valid preserved ranges reconstruct original copy and ignore rewriting', () => {
  const source = 'Seu texto original.\n\nSEM trocar: palavras, números 12 e C++!';
  const result = { slides: [{ sourceStart: 0, titleEnd: 3, sourceEnd: 10, title: 'Título inventado', supportText: 'Texto reescrito' }] };
  const script = controls.organizePreservedScript(result, source, 1);
  assert.equal(script.slides[0].title, 'Seu texto original.');
  assert.deepEqual(tokens(script.slides.flatMap(s => [s.title, s.supportText]).join(' ')), tokens(source));
  assert.deepEqual(script.warnings, []);
});

test('invalid, missing, overlapping or incomplete ranges preserve every original word', () => {
  const source = 'A mesma palavra palavra 123 +++ deve ficar intacta.';
  for (const result of [
    {}, { slides: [{ title: 'Tentativa de reescrita' }] },
    { slides: [{ sourceStart: 0, titleEnd: 1, sourceEnd: 2 }] },
    { slides: [{ sourceStart: 0, titleEnd: 1, sourceEnd: 5 }, { sourceStart: 4, titleEnd: 6, sourceEnd: 9 }] },
    { slides: [{ sourceStart: 0, titleEnd: 1, sourceEnd: 1000 }] }
  ]) {
    const script = controls.organizePreservedScript(result, source, 3);
    assert.deepEqual(tokens(script.slides.flatMap(s => [s.title, s.supportText]).join(' ')), tokens(source));
    assert.equal(script.warnings.length, 1);
  }
});

test('empty source cannot be preserved and short source cannot create invented copy', () => {
  assert.throws(() => controls.organizePreservedScript({}, '   ', 7));
  const script = controls.organizePreservedScript({}, 'Um dois', 7);
  assert.equal(script.slides.length, 1);
  assert.equal(script.slides[0].title, 'Um');
  assert.equal(script.slides[0].supportText, 'dois');
});

test('preserve regeneration enforces current title and support, not model copy', () => {
  const current = { title: 'Meu título exato', supportText: 'Meu apoio original.' };
  const slide = controls.finalizeRegeneratedSlide({ title: 'Mudou!', supportText: 'Mudou!', highlightWords: ['original'] }, current, controls.normalizeCopyOptions({ textMode: 'preserve' }));
  assert.equal(slide.title, current.title);
  assert.equal(slide.supportText, current.supportText);
  assert.deepEqual(slide.highlightWords, ['original']);
});

test('rewrite generation supports legacy body without enabling unwanted highlights', () => {
  const script = controls.finalizeGeneratedScript({ slides: [{ title: 'Novo título', body: 'Apoio', highlightWords: ['Novo'] }] }, controls.normalizeCopyOptions({ highlightMode: 'none' }), '', 1);
  assert.equal(script.slides[0].supportText, 'Apoio');
  assert.deepEqual(script.slides[0].highlightWords, []);
});

test('generation API rejects preserve with only a theme before calling provider', async () => {
  const response = await generate.POST(request({ theme: 'Um tema', copyOptions: { textMode: 'preserve' } }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /texto original/);
});

test('generation API honors preservation and manual words with a simulated provider', async t => {
  const getPayload = mockModel(t, { slides: [{ sourceStart: 0, titleEnd: 2, sourceEnd: 6, title: 'Não autorizado', supportText: 'Não autorizado', highlightWords: ['liberdade'] }] });
  const response = await generate.POST(request({ rawText: 'Tenha foco para conseguir mais liberdade.', slideCount: 1, copyOptions: { textMode: 'preserve', highlightMode: 'manual', highlightWords: 'foco' } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.script.slides[0].highlightWords, ['foco']);
  assert.equal(body.script.slides[0].title, 'Tenha foco');
  assert.equal(body.script.slides[0].supportText, 'para conseguir mais liberdade.');
  assert.match(getPayload().messages[0].content, /sem reescrever/);
  assert.match(getPayload().messages[1].content, /\[0\] Tenha/);
});

test('generation API appends only a user-provided CTA when preserving', async t => {
  mockModel(t, {});
  const response = await generate.POST(request({ rawText: 'Conteúdo original.', cta: 'Salve este post.', format: 'post', slideCount: 7, copyOptions: { textMode: 'preserve', highlightMode: 'none' } }));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.script.slides.length, 1);
  assert.deepEqual(tokens(body.script.slides.flatMap(s => [s.title, s.supportText]).join(' ')), tokens('Conteúdo original. Salve este post.'));
});

test('regeneration API enforces preservation and no highlights with simulated provider', async t => {
  const getPayload = mockModel(t, { title: 'Reescrita não autorizada', supportText: 'Outra reescrita', highlightWords: ['Texto'], icon: 'book' });
  const current = { title: 'Texto original', supportText: '' };
  const response = await regenerate.POST(request({ current, slideIndex: 0, totalSlides: 1, copyOptions: { textMode: 'preserve', highlightMode: 'none' } }, 'regenerate-slide'));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.slide.title, current.title);
  assert.equal(body.slide.supportText, '');
  assert.deepEqual(body.slide.highlightWords, []);
  assert.match(getPayload().messages[0].content, /não autorizou reescrita/);
});

test('regeneration API can rewrite when explicitly authorized', async t => {
  mockModel(t, { title: 'Título melhorado', supportText: 'Apoio novo', highlightWords: ['melhorado'] });
  const response = await regenerate.POST(request({ current: { title: 'Antes', supportText: 'Antes' }, slideIndex: 0, totalSlides: 1, copyOptions: { textMode: 'rewrite', highlightMode: 'auto' } }, 'regenerate-slide'));
  const body = await response.json();
  assert.equal(body.slide.title, 'Título melhorado');
  assert.deepEqual(body.slide.highlightWords, ['melhorado']);
});
