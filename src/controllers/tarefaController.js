// ============================================================
// CONTROLLER: Tarefa
// Recebe a requisição HTTP (vinda da rota), pede ao Model o
// que precisa e escolhe a resposta: renderizar uma View ou
// redirecionar. Não guarda dados e não monta HTML.
// ============================================================

const Tarefa = require('../models/tarefaModel');

const FILTROS = ['todas', Tarefa.STATUS.PENDENTE, Tarefa.STATUS.CONCLUIDA];

// Mensagens de retorno exibidas depois de um redirecionamento (?msg=...)
const MENSAGENS = {
  criada: 'Tarefa cadastrada com sucesso.',
  editada: 'Tarefa atualizada com sucesso.',
  concluida: 'Tarefa marcada como concluída.',
  ja_concluida: 'Esta tarefa já estava concluída.',
  excluida: 'Tarefa excluída com sucesso.',
};

function tarefaNaoEncontrada(res) {
  return res.status(404).render('erro', {
    tituloPagina: 'Tarefa não encontrada',
    mensagem: 'A tarefa solicitada não existe ou já foi excluída.',
  });
}

// GET /tarefas?status=todas|pendente|concluida  -> LISTAR e FILTRAR
function listar(req, res) {
  const filtro = FILTROS.includes(req.query.status) ? req.query.status : 'todas';
  res.render('tarefas/lista', {
    tituloPagina: 'Minhas tarefas',
    tarefas: Tarefa.listar(filtro),
    filtro,
    contagem: Tarefa.contar(),
    mensagem: MENSAGENS[req.query.msg],
  });
}

// GET /tarefas/nova  -> formulário vazio de CADASTRO
function formularioNova(req, res) {
  res.render('tarefas/formulario', {
    tituloPagina: 'Nova tarefa',
    modo: 'nova',
    tarefa: { titulo: '', descricao: '', disciplina: '' },
    erros: {},
  });
}

// POST /tarefas  -> CADASTRAR
function criar(req, res) {
  const resultado = Tarefa.criar(req.body);
  if (resultado.erros) {
    // 400: devolve o formulário com os erros e o que a pessoa já digitou
    return res.status(400).render('tarefas/formulario', {
      tituloPagina: 'Nova tarefa',
      modo: 'nova',
      tarefa: resultado.dados,
      erros: resultado.erros,
    });
  }
  // Padrão Post/Redirect/Get: evita cadastrar de novo ao recarregar a página
  res.redirect(`/tarefas/${resultado.tarefa.id}?msg=criada`);
}

// GET /tarefas/:id  -> CONSULTAR DETALHES
function detalhes(req, res) {
  const tarefa = Tarefa.buscarPorId(req.params.id);
  if (!tarefa) return tarefaNaoEncontrada(res);
  res.render('tarefas/detalhes', {
    tituloPagina: tarefa.titulo,
    tarefa,
    mensagem: MENSAGENS[req.query.msg],
  });
}

// GET /tarefas/:id/editar  -> formulário preenchido de EDIÇÃO
function formularioEditar(req, res) {
  const tarefa = Tarefa.buscarPorId(req.params.id);
  if (!tarefa) return tarefaNaoEncontrada(res);
  res.render('tarefas/formulario', {
    tituloPagina: 'Editar tarefa',
    modo: 'editar',
    tarefa,
    erros: {},
  });
}

// POST /tarefas/:id/editar  -> EDITAR
function atualizar(req, res) {
  const resultado = Tarefa.atualizar(req.params.id, req.body);
  if (!resultado) return tarefaNaoEncontrada(res);
  if (resultado.erros) {
    return res.status(400).render('tarefas/formulario', {
      tituloPagina: 'Editar tarefa',
      modo: 'editar',
      tarefa: { id: Number(req.params.id), ...resultado.dados },
      erros: resultado.erros,
    });
  }
  res.redirect(`/tarefas/${resultado.tarefa.id}?msg=editada`);
}

// POST /tarefas/:id/concluir  -> CONCLUIR
function concluir(req, res) {
  const resultado = Tarefa.concluir(req.params.id);
  if (!resultado) return tarefaNaoEncontrada(res);
  const msg = resultado.jaConcluida ? 'ja_concluida' : 'concluida';
  res.redirect(`/tarefas/${resultado.tarefa.id}?msg=${msg}`);
}

// GET /tarefas/:id/excluir  -> página de CONFIRMAÇÃO da exclusão
function confirmarExclusao(req, res) {
  const tarefa = Tarefa.buscarPorId(req.params.id);
  if (!tarefa) return tarefaNaoEncontrada(res);
  res.render('tarefas/confirmar-exclusao', { tituloPagina: 'Excluir tarefa', tarefa });
}

// POST /tarefas/:id/excluir  -> EXCLUIR (só chega aqui depois de confirmar)
function excluir(req, res) {
  const removida = Tarefa.excluir(req.params.id);
  if (!removida) return tarefaNaoEncontrada(res);
  res.redirect('/tarefas?msg=excluida');
}

module.exports = {
  listar,
  formularioNova,
  criar,
  detalhes,
  formularioEditar,
  atualizar,
  concluir,
  confirmarExclusao,
  excluir,
};
