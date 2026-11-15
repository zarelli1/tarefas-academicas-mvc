// ============================================================
// ROTAS: ligam cada URL + método HTTP a uma função do Controller.
// Ações que ALTERAM dados usam POST; ações que só LEEM usam GET.
// ============================================================

const express = require('express');
const controller = require('../controllers/tarefaController');

const router = express.Router();

router.get('/', controller.listar);                       // listar + filtrar
router.get('/nova', controller.formularioNova);           // formulário de cadastro
router.post('/', controller.criar);                       // cadastrar

router.get('/:id', controller.detalhes);                  // consultar detalhes
router.get('/:id/editar', controller.formularioEditar);   // formulário de edição
router.post('/:id/editar', controller.atualizar);         // editar
router.post('/:id/concluir', controller.concluir);        // concluir
router.get('/:id/excluir', controller.confirmarExclusao); // pedir confirmação
router.post('/:id/excluir', controller.excluir);          // excluir

module.exports = router;
