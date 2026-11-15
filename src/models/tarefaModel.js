// ============================================================
// MODEL: Tarefa
// Responsável pelos DADOS e pelas REGRAS DE NEGÓCIO.
// Não conhece HTTP, não conhece HTML: só guarda, valida e
// altera as tarefas. Os dados ficam em memória (array de
// objetos), então são perdidos quando o servidor reinicia.
// ============================================================

const STATUS = Object.freeze({
  PENDENTE: 'pendente',
  CONCLUIDA: 'concluida',
});

// Regras de tamanho em um único lugar (usadas na validação e nas views)
const LIMITES = Object.freeze({
  titulo: { min: 3, max: 100 },
  descricao: { max: 500 },
  disciplina: { min: 2, max: 80 },
});

// "Banco de dados" em memória
const tarefas = [];

// Gerador de id: só cresce, nunca reaproveita um id excluído
let proximoId = 1;

// Limpa espaços nas pontas e garante que tudo é string
function normalizar(dados = {}) {
  return {
    titulo: String(dados.titulo ?? '').trim(),
    descricao: String(dados.descricao ?? '').trim(),
    disciplina: String(dados.disciplina ?? '').trim(),
  };
}

// Devolve um objeto { campo: 'mensagem' }. Vazio = dados válidos.
function validar(dados) {
  const erros = {};
  const { titulo, descricao, disciplina } = dados;

  if (titulo.length < LIMITES.titulo.min || titulo.length > LIMITES.titulo.max) {
    erros.titulo = `O título é obrigatório e deve ter entre ${LIMITES.titulo.min} e ${LIMITES.titulo.max} caracteres.`;
  }
  if (descricao.length > LIMITES.descricao.max) {
    erros.descricao = `A descrição deve ter no máximo ${LIMITES.descricao.max} caracteres.`;
  }
  if (disciplina.length < LIMITES.disciplina.min || disciplina.length > LIMITES.disciplina.max) {
    erros.disciplina = `A disciplina é obrigatória e deve ter entre ${LIMITES.disciplina.min} e ${LIMITES.disciplina.max} caracteres.`;
  }
  return erros;
}

function temErros(erros) {
  return Object.keys(erros).length > 0;
}

// LISTAR / FILTRAR: 'todas', 'pendente' ou 'concluida'
function listar(filtro = 'todas') {
  if (filtro === STATUS.PENDENTE || filtro === STATUS.CONCLUIDA) {
    return tarefas.filter((tarefa) => tarefa.status === filtro);
  }
  return [...tarefas];
}

// CONSULTAR DETALHES
function buscarPorId(id) {
  return tarefas.find((tarefa) => tarefa.id === Number(id)) || null;
}

// CADASTRAR: status sempre começa como pendente
function criar(dadosRecebidos) {
  const dados = normalizar(dadosRecebidos);
  const erros = validar(dados);
  if (temErros(erros)) return { erros, dados };

  const tarefa = {
    id: proximoId++,
    ...dados,
    status: STATUS.PENDENTE,
    criadaEm: new Date(),
    atualizadaEm: null,
    concluidaEm: null,
  };
  tarefas.push(tarefa);
  return { tarefa };
}

// EDITAR: só título, descrição e disciplina podem mudar
function atualizar(id, dadosRecebidos) {
  const tarefa = buscarPorId(id);
  if (!tarefa) return null;

  const dados = normalizar(dadosRecebidos);
  const erros = validar(dados);
  if (temErros(erros)) return { erros, dados };

  tarefa.titulo = dados.titulo;
  tarefa.descricao = dados.descricao;
  tarefa.disciplina = dados.disciplina;
  tarefa.atualizadaEm = new Date();
  return { tarefa };
}

// CONCLUIR: pendente -> concluida (não existe o caminho de volta)
function concluir(id) {
  const tarefa = buscarPorId(id);
  if (!tarefa) return null;
  if (tarefa.status === STATUS.CONCLUIDA) return { tarefa, jaConcluida: true };

  tarefa.status = STATUS.CONCLUIDA;
  tarefa.concluidaEm = new Date();
  return { tarefa, jaConcluida: false };
}

// EXCLUIR: true se removeu, false se o id não existe
function excluir(id) {
  const indice = tarefas.findIndex((tarefa) => tarefa.id === Number(id));
  if (indice === -1) return false;
  tarefas.splice(indice, 1);
  return true;
}

function contar() {
  const concluidas = tarefas.filter((t) => t.status === STATUS.CONCLUIDA).length;
  return { todas: tarefas.length, pendente: tarefas.length - concluidas, concluida: concluidas };
}

// Usado só pelos testes automáticos, para começar cada teste do zero
function limparTudo() {
  tarefas.length = 0;
  proximoId = 1;
}

module.exports = {
  STATUS,
  LIMITES,
  listar,
  buscarPorId,
  criar,
  atualizar,
  concluir,
  excluir,
  contar,
  limparTudo,
};
