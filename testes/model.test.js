// Testes do MODEL isolado: regras de negócio sem HTTP.
// Rodar com: npm test

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Tarefa = require('../src/models/tarefaModel');

beforeEach(() => Tarefa.limparTudo());

const valida = { titulo: 'Estudar MVC', descricao: 'Capítulo 3', disciplina: 'Arquitetura' };

test('cadastra com id gerado e status inicial pendente', () => {
  const { tarefa } = Tarefa.criar(valida);
  assert.equal(tarefa.id, 1);
  assert.equal(tarefa.status, 'pendente');
  assert.equal(Tarefa.listar().length, 1);
});

test('remove espaços extras antes de validar e salvar', () => {
  const { tarefa } = Tarefa.criar({ titulo: '   Prova   ', disciplina: '  BD ' });
  assert.equal(tarefa.titulo, 'Prova');
  assert.equal(tarefa.disciplina, 'BD');
  assert.equal(tarefa.descricao, '');
});

test('valida limites de título, descrição e disciplina', () => {
  assert.ok(Tarefa.criar({ ...valida, titulo: 'ab' }).erros.titulo);
  assert.ok(Tarefa.criar({ ...valida, titulo: 'a'.repeat(101) }).erros.titulo);
  assert.ok(Tarefa.criar({ ...valida, titulo: '     ' }).erros.titulo);
  assert.ok(Tarefa.criar({ ...valida, descricao: 'a'.repeat(501) }).erros.descricao);
  assert.ok(Tarefa.criar({ ...valida, disciplina: 'a' }).erros.disciplina);
  assert.ok(Tarefa.criar({ ...valida, disciplina: 'a'.repeat(81) }).erros.disciplina);
  assert.equal(Tarefa.listar().length, 0, 'nenhuma tarefa inválida pode ser salva');
});

test('aceita exatamente os valores de fronteira', () => {
  const r = Tarefa.criar({ titulo: 'abc', descricao: 'a'.repeat(500), disciplina: 'ab' });
  assert.ok(r.tarefa);
  const r2 = Tarefa.criar({ titulo: 'a'.repeat(100), descricao: '', disciplina: 'a'.repeat(80) });
  assert.ok(r2.tarefa);
});

test('edita apenas título, descrição e disciplina', () => {
  const { tarefa } = Tarefa.criar(valida);
  Tarefa.atualizar(tarefa.id, { titulo: 'Novo título', descricao: '', disciplina: 'Outra', status: 'concluida', id: 99 });
  const editada = Tarefa.buscarPorId(1);
  assert.equal(editada.titulo, 'Novo título');
  assert.equal(editada.status, 'pendente', 'editar não pode mudar o status');
  assert.equal(editada.id, 1, 'editar não pode mudar o id');
});

test('edição inválida não altera a tarefa', () => {
  Tarefa.criar(valida);
  const r = Tarefa.atualizar(1, { ...valida, titulo: 'x' });
  assert.ok(r.erros.titulo);
  assert.equal(Tarefa.buscarPorId(1).titulo, 'Estudar MVC');
});

test('conclui pendente e não conclui duas vezes', () => {
  Tarefa.criar(valida);
  assert.equal(Tarefa.concluir(1).jaConcluida, false);
  assert.equal(Tarefa.buscarPorId(1).status, 'concluida');
  assert.equal(Tarefa.concluir(1).jaConcluida, true);
});

test('filtra por todas, pendentes e concluídas', () => {
  Tarefa.criar(valida);
  Tarefa.criar(valida);
  Tarefa.criar(valida);
  Tarefa.concluir(2);
  assert.equal(Tarefa.listar('todas').length, 3);
  assert.equal(Tarefa.listar('pendente').length, 2);
  assert.equal(Tarefa.listar('concluida').length, 1);
  assert.deepEqual(Tarefa.contar(), { todas: 3, pendente: 2, concluida: 1 });
});

test('exclui e não reaproveita o id', () => {
  Tarefa.criar(valida);
  assert.equal(Tarefa.excluir(1), true);
  assert.equal(Tarefa.excluir(1), false);
  assert.equal(Tarefa.criar(valida).tarefa.id, 2);
});

test('id inexistente devolve null / false', () => {
  assert.equal(Tarefa.buscarPorId(42), null);
  assert.equal(Tarefa.atualizar(42, valida), null);
  assert.equal(Tarefa.concluir(42), null);
  assert.equal(Tarefa.excluir('abc'), false);
});
