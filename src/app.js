// ============================================================
// PONTO DE ENTRADA da aplicação.
// Configura o Express, a engine de views (EJS), os arquivos
// estáticos e registra as rotas. É aqui que o MVC é "montado".
// ============================================================

const path = require('path');
const express = require('express');
const tarefaRoutes = require('./routes/tarefaRoutes');
const Tarefa = require('./models/tarefaModel');

const app = express();
const PORTA = process.env.PORT || 3000;

// VIEW: templates EJS em src/views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Função auxiliar disponível em todas as views
app.locals.formatarData = (data) =>
  data ? new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
app.locals.LIMITES = Tarefa.LIMITES;

// Lê os dados enviados pelos formulários HTML (req.body)
app.use(express.urlencoded({ extended: false }));

// CSS e outros arquivos públicos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas
app.get('/', (req, res) => res.redirect('/tarefas'));
app.use('/tarefas', tarefaRoutes);

// Qualquer outra URL: 404
app.use((req, res) => {
  res.status(404).render('erro', {
    tituloPagina: 'Página não encontrada',
    mensagem: 'O endereço acessado não existe.',
  });
});

// Só sobe o servidor quando o arquivo é executado direto (npm start).
// Nos testes o app é importado sem ocupar a porta 3000.
if (require.main === module) {
  if (process.argv.includes('--exemplos')) {
    Tarefa.criar({ titulo: 'Relatório técnico SOLID', descricao: 'Analisar o código da TechStore e apontar violações.', disciplina: 'Arquitetura de Software' });
    Tarefa.criar({ titulo: 'Atividade GRASP e GoF', descricao: '', disciplina: 'Arquitetura de Software' });
    Tarefa.criar({ titulo: 'Termo de abertura do projeto', descricao: 'Preencher partes interessadas e escopo.', disciplina: 'Gestão de Projetos' });
    Tarefa.concluir(2);
  }
  app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
  });
}

module.exports = app;
