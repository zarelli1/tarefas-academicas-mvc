# Tarefas Acadêmicas (Node.js + MVC)

Aplicação web para um grupo de estudantes organizar suas tarefas acadêmicas: cadastrar, listar, consultar detalhes, editar, concluir, excluir (com confirmação) e filtrar por status.

Atividade da disciplina **Arquitetura de Software** (ADS EAD, Unoeste, 2/2026).
Autor: Leonardo Zarelli Ribeiro.

## Tecnologias

- **Node.js** (18 ou superior) e **Express**: servidor HTTP e rotas
- **EJS**: templates HTML renderizados no servidor (camada View)
- **node:test**: testes automáticos nativos do Node, sem dependência extra
- Armazenamento **em memória** (array de objetos), conforme o enunciado

## Como executar

```bash
npm install
npm start            # inicia vazio em http://localhost:3000
npm run exemplos     # inicia com 3 tarefas de exemplo
npm test             # roda os 15 testes automáticos
```

Os dados ficam só na memória do processo: ao reiniciar o servidor, tudo é apagado.

## Estrutura do projeto (MVC)

```
src/
├── app.js                          ponto de entrada: configura Express, EJS e rotas
├── models/
│   └── tarefaModel.js              MODEL: array em memória, validação e regras de negócio
├── controllers/
│   └── tarefaController.js         CONTROLLER: recebe a requisição, chama o Model, escolhe a resposta
├── routes/
│   └── tarefaRoutes.js             liga cada URL + método HTTP a uma função do Controller
└── views/                          VIEW: templates EJS (só apresentação)
    ├── partials/cabecalho.ejs, rodape.ejs
    ├── tarefas/lista.ejs           listagem + filtros
    ├── tarefas/formulario.ejs      mesmo formulário para cadastrar e editar
    ├── tarefas/detalhes.ejs        todas as informações de uma tarefa
    ├── tarefas/confirmar-exclusao.ejs
    └── erro.ejs                    páginas 404
public/css/estilo.css               estilo visual
testes/                             testes do Model e testes de integração HTTP
```

### Responsabilidade de cada camada

| Camada | Arquivo | Faz | Não faz |
|---|---|---|---|
| Model | `tarefaModel.js` | guarda o array, gera o id, valida os campos, aplica as regras (status inicial, só pendente vira concluída) | não conhece `req`, `res` nem HTML |
| Controller | `tarefaController.js` | lê `req.params`, `req.query` e `req.body`, chama o Model, decide o status HTTP e qual View renderizar ou para onde redirecionar | não guarda dados, não monta HTML |
| View | `views/*.ejs` | transforma os dados recebidos em HTML | não altera dados, não decide regra de negócio |

## Modelo de dados

| Campo | Regra |
|---|---|
| `id` | gerado pela aplicação (contador que só cresce; um id excluído nunca é reaproveitado) |
| `titulo` | obrigatório, de 3 a 100 caracteres |
| `descricao` | opcional, até 500 caracteres |
| `disciplina` | obrigatória, de 2 a 80 caracteres |
| `status` | `pendente` ou `concluida`; começa sempre como `pendente` |
| `criadaEm`, `atualizadaEm`, `concluidaEm` | datas de controle exibidas nos detalhes |

Os textos passam por `trim()` antes da validação, então um título feito só de espaços é recusado.

## Rotas

| Método | URL | Funcionalidade |
|---|---|---|
| GET | `/tarefas?status=todas\|pendente\|concluida` | Listar e Filtrar |
| GET | `/tarefas/nova` | formulário de cadastro |
| POST | `/tarefas` | Cadastrar |
| GET | `/tarefas/:id` | Consultar detalhes |
| GET | `/tarefas/:id/editar` | formulário de edição |
| POST | `/tarefas/:id/editar` | Editar |
| POST | `/tarefas/:id/concluir` | Concluir |
| GET | `/tarefas/:id/excluir` | página de confirmação |
| POST | `/tarefas/:id/excluir` | Excluir (após confirmar) |

## Fluxo de uma requisição (exemplo: cadastrar)

1. O usuário preenche o formulário (`formulario.ejs`) e clica em **Cadastrar**. O navegador envia `POST /tarefas`.
2. `express.urlencoded()` transforma o corpo do formulário em `req.body`.
3. `tarefaRoutes.js` encaminha `POST /` para `controller.criar`.
4. O Controller chama `Tarefa.criar(req.body)`.
5. O Model normaliza e valida os dados.
   - **Inválido:** devolve os erros; o Controller responde **400** e renderiza o mesmo formulário com as mensagens e o que já foi digitado.
   - **Válido:** cria o objeto com id e status `pendente` e o insere no array.
6. O Controller responde com **redirecionamento** para `/tarefas/:id?msg=criada`.
7. O navegador faz `GET /tarefas/:id`; o Controller busca a tarefa no Model e renderiza `detalhes.ejs`.

## Decisões técnicas

- **Renderização no servidor com EJS:** deixa a separação MVC explícita, porque a View é um arquivo próprio que só recebe dados e devolve HTML. Não foi preciso um frontend separado.
- **Validação no Model, não na View:** os atributos `minlength` e `maxlength` do HTML ajudam o usuário, mas podem ser burlados. A regra que vale é a do Model, e ela fica num único lugar (`LIMITES`), usado tanto na validação quanto nas dicas da tela.
- **POST para tudo que altera dados:** concluir e excluir mudam o estado, então não usam GET. Um link ou um robô que só "visita" páginas nunca apaga nada.
- **Exclusão em duas etapas:** `GET /:id/excluir` mostra a confirmação; só o `POST` do botão "Sim, excluir" remove. Funciona mesmo sem JavaScript.
- **Post/Redirect/Get:** depois de cadastrar, editar, concluir ou excluir, o servidor redireciona. Assim, recarregar a página não repete a operação.
- **Concluir é idempotente:** concluir uma tarefa já concluída não dá erro, apenas avisa.
- **Proteção contra XSS:** as Views usam `<%= %>`, que escapa o HTML digitado pelo usuário (há um teste automático para isso).
- **`app.js` exporta o app sem obrigar a subir a porta:** permite que os testes de integração iniciem o servidor numa porta livre.

## Testes

`npm test` executa 15 testes:

- **Model** (`testes/model.test.js`): status inicial, limites de cada campo (incluindo os valores de fronteira), edição sem alterar id e status, conclusão, filtros, exclusão e ids inexistentes.
- **Integração** (`testes/rotas.test.js`): fluxo completo via HTTP, cadastro inválido com status 400, exclusão que só acontece após confirmar, escape de HTML e respostas 404.
