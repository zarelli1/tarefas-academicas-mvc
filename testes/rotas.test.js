// Testes de INTEGRAÇÃO: sobem o servidor numa porta livre e fazem
// requisições HTTP reais, passando por Rota -> Controller -> Model -> View.
// Rodar com: npm test

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const Tarefa = require('../src/models/tarefaModel');

let servidor;
let base;

before(async () => {
  servidor = app.listen(0);
  await new Promise((ok) => servidor.once('listening', ok));
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());
beforeEach(() => Tarefa.limparTudo());

function post(caminho, campos = {}) {
  return fetch(base + caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos),
    redirect: 'manual',
  });
}

test('fluxo completo: cadastrar, consultar, editar, concluir, filtrar, excluir', async () => {
  let r = await post('/tarefas', { titulo: 'Trabalho MVC', descricao: 'Vídeo + GitHub', disciplina: 'Arquitetura' });
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/tarefas/1?msg=criada');

  r = await fetch(`${base}/tarefas/1`);
  let html = await r.text();
  assert.equal(r.status, 200);
  assert.match(html, /Trabalho MVC/);
  assert.match(html, /Pendente/);

  r = await post('/tarefas/1/editar', { titulo: 'Trabalho MVC final', descricao: '', disciplina: 'Arquitetura' });
  assert.equal(r.headers.get('location'), '/tarefas/1?msg=editada');

  r = await post('/tarefas/1/concluir');
  assert.equal(r.headers.get('location'), '/tarefas/1?msg=concluida');

  html = await (await fetch(`${base}/tarefas?status=concluida`)).text();
  assert.match(html, /Trabalho MVC final/);
  html = await (await fetch(`${base}/tarefas?status=pendente`)).text();
  assert.doesNotMatch(html, /Trabalho MVC final/);

  html = await (await fetch(`${base}/tarefas/1/excluir`)).text();
  assert.match(html, /Tem certeza/);

  r = await post('/tarefas/1/excluir');
  assert.equal(r.headers.get('location'), '/tarefas?msg=excluida');
  assert.equal((await fetch(`${base}/tarefas/1`)).status, 404);
});

test('cadastro inválido devolve 400 com mensagens e não salva', async () => {
  const r = await post('/tarefas', { titulo: 'ab', disciplina: '' });
  const html = await r.text();
  assert.equal(r.status, 400);
  assert.match(html, /entre 3 e 100 caracteres/);
  assert.match(html, /entre 2 e 80 caracteres/);
  assert.equal(Tarefa.listar().length, 0);
});

test('abrir a página de exclusão NÃO exclui (precisa confirmar)', async () => {
  await post('/tarefas', { titulo: 'Não apagar', disciplina: 'BD' });
  await fetch(`${base}/tarefas/1/excluir`);
  assert.equal(Tarefa.listar().length, 1);
});

test('HTML digitado pelo usuário é escapado (proteção contra XSS)', async () => {
  await post('/tarefas', { titulo: '<script>alert(1)</script>', disciplina: 'Segurança' });
  const html = await (await fetch(`${base}/tarefas/1`)).text();
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test('id ou rota inexistente responde 404', async () => {
  assert.equal((await fetch(`${base}/tarefas/999`)).status, 404);
  assert.equal((await post('/tarefas/999/concluir')).status, 404);
  assert.equal((await fetch(`${base}/qualquer-coisa`)).status, 404);
});
