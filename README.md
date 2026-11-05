# Gestão Financeira

Um painel de finanças da casa que vive dentro do **claude.ai**, como um artefato do Claude: uma página com banco de
dados próprio, sem servidor, sem planilha e sem instalar nada no celular. Ele mostra o ano inteiro dia a dia, diz
quanto ainda cabe gastar hoje e confere o que foi anotado contra o extrato do banco.

- **Seus dados ficam no seu painel**, no claude.ai, e só abrem para quem você convidar. Nada do que você lança passa
  por este repositório.
- **Funciona no celular e no computador**, sem computador ligado: a página e o banco ficam na nuvem da Anthropic.
- **A aba Conversa** usa o Claude de quem está usando o painel para lançar gastos falando do seu jeito, ler extratos e
  responder perguntas. Lançar pelo **+** ou pelos botões não gasta o Claude de ninguém.
- Tudo em português do Brasil.

## Instalar

Você precisa de uma conta no Claude com o **Claude Code** (o app Claude para computador, aba Code, ou o Claude Code no
terminal). É o Claude Code que publica a página na sua conta.

1. Baixe este repositório (botão **Code → Download ZIP** no GitHub, ou `git clone`) e abra a pasta no Claude Code.
2. Peça:

   > Publique `artefato/gestao-financeira.html` como um artefato novo, com as capacidades `assets`, `db` (regra raiz
   > com leitura e escrita para `interact`), `downloads`, `sample` com imagens e `user`.

3. Abra o link que o Claude devolver. O painel nasce vazio: toque em **Importar um cadastro** e escolha
   `exemplo/cadastro-inicial.json` (categorias e contas para começar). Depois ajuste tudo em **Plano**: contas e
   cartões, fixas e receitas, limite diário, régua de cores, título e subtítulo.
4. Em **Plano → Ambiente e versão**, cole o link do painel em "Link deste painel" (o botão Pôr na tela inicial usa
   esse link) e, no celular, siga o botão **Pôr na tela inicial**.
5. Recomendado: publique a mesma página uma segunda vez como painel de **teste** e marque-o como teste em Plano →
   Ambiente e versão. Toda mudança nova vai primeiro para o teste.

Para o Claude Code lembrar dos seus painéis nas próximas conversas, crie na pasta um arquivo `CLAUDE.local.md` com os
links do teste e da produção, a versão no ar em cada um e as suas pastas. Ele não vai para o repositório (está no
`.gitignore`) e o Claude Code lê junto com o `CLAUDE.md`.

## Atualizar para uma versão nova

Baixe a versão nova do repositório e peça ao Claude Code: "publique `artefato/gestao-financeira.html` no meu painel de
teste" (e, depois de conferir, no de produção), passando o link de cada um. Os dados não mudam quando a página muda.
O que mudou em cada versão está no `CHANGELOG.md`.

## Tarefas agendadas (opcional)

Em `tarefas/` há dois modelos para o app Claude do computador (Tarefas agendadas) ou para as tarefas na nuvem do
Claude Code:

- `relatorio.md`: todo dia por volta das 8h, escreve na Conversa o relatório do dia ou da semana e as pendências, e
  manda uma notificação. Liga e desliga em Plano → Relatórios do Claude.
- `backup.md`: toda semana, copia o banco do painel para uma pasta. Liga e desliga em Plano → Ambiente e versão.

Troque os campos entre `<…>` (o link do seu painel, a pasta) antes de criar a tarefa.

## As abas

| Aba | Para quê |
|---|---|
| **Hoje** | A tela de início no celular: quanto ainda cabe hoje, saldo do dia e do mês, as próximas duas semanas na cor do saldo, fixas da semana, últimos lançamentos, contas e os avisos. |
| **Ano** | Os 12 meses lado a lado: entradas, fixas, variáveis e o saldo de cada mês. Simulador de compra. |
| **Conversa** | Um chat com o Claude dentro da página. Mande gastos, extratos, prints e perguntas, inclusive sobre todo o histórico. Ele lança, corrige e confere. Gasta o plano de quem manda a mensagem. |
| **Mês** | O calendário do mês com o saldo de cada dia na cor da régua. Toque num dia para ver e lançar. No topo, **Fechar o mês**. |
| **Lançar** | Escrever vários gastos de uma vez e revisar antes de gravar. Lista e filtros de tudo o que foi lançado. |
| **Conferir** | As conferências feitas com extratos: o que bateu, o que divergiu, o que só o banco mostra. |
| **Plano** | Saldo real, limite diário, fixas, A receber, categorias e orçamento, contas e cartões, metas e caixinhas, compromissos, régua de cores, relatórios do Claude, exportar para Excel, ambiente e versão. |
| **Arquivos** | Os anexos enviados na Conversa: de que mês são, se já foram usados, baixar ou apagar. |
| **Guia** | O tutorial completo, sempre atualizado junto com a página. |

No celular a barra de baixo tem **Hoje · Mês · + · Conversa · Mais**; o resto fica em Mais. No computador as abas
ficam em cima.

## O método (o que a página calcula sozinha)

1. **Nenhum dia futuro fica vazio.** As fixas aparecem nas datas certas, e cada dia ainda desconta o limite diário
   de gastos variáveis.
2. **O limite diário é decidido por mês.** A página sugere três valores: fechar o mês no zero, guardar a reserva
   ou a média real dos últimos 30 dias.
3. **O comentário faz parte do lançamento.** É ele que permite entender depois o que o extrato mostra.
4. **A cor diz como está o caixa.** Régua de 5 faixas, ajustável no Plano.
5. **Compra no cartão conta no dia da compra.** O pagamento da fatura não é gasto de novo.
6. **Transferência entre as suas contas não muda o saldo.** Pix para outra pessoa continua sendo saída.
7. **O saldo real é o ponto de partida.** Informe o saldo da conta e a fatura em aberto; os dias anteriores ficam
   cinza.
8. **Uma fixa paga substitui a previsão.** Marcar a luz como paga não conta a luz duas vezes.

Também tem: parcelado (uma parcela por fatura), metas e caixinhas (saldo livre), receitas incertas com o cenário "Só as
certas", compromissos dos próximos meses, fixas na Google Agenda, Desfazer em toda gravação, avisos antes do problema,
gestos no celular e tema claro ou escuro.

## Banco de dados (resumo)

Cada tipo de registro fica numa coleção do banco do artefato. Os detalhes de cada campo estão no `CLAUDE.md`.

| Coleção | Guarda |
|---|---|
| `config` | Saldo real, limite diário, régua, título, link do painel (`main`), as categorias com orçamento (`categorias`) e o resumo que a página calcula (`resumo`). |
| `recorrentes` | As despesas e receitas fixas (aluguel, escola, salário…). |
| `ajustes` | Mudança de uma fixa só num mês (outro valor, outro dia, pular). |
| `lancamentos` | Tudo o que foi lançado: gastos, receitas e transferências. |
| `contas` | Contas e cartões, com ícone, bandeira e ciclo do cartão. |
| `extrato` | Cada linha de extrato conferida. |
| `conciliacoes` | Cada conferência, com o resumo e a leitura do Claude. |
| `conversa` | As mensagens da aba Conversa. |
| `historico` | O registro das mudanças importantes. |
| `metas` | As metas e caixinhas. |

Os arquivos anexados ficam à parte, nos arquivos do artefato (aba Arquivos).

## Backup e restauração

- **Cópia na mão:** Plano → Ambiente e versão → "Baixar a cópia completa" (.json) ou Plano → "Exportar para Excel".
- **Cópia pelo Claude Code:** "faça backup do banco do meu painel" grava um arquivo por registro em
  `artefato/backup/AAAA-MM-DD/` (essa pasta não vai para o repositório).
- **Restaurar:** "restaure o banco do painel a partir de `artefato/backup/AAAA-MM-DD`".
- **Voltar a página para uma versão anterior:** publique de novo o arquivo de uma tag antiga do repositório, ou use o
  histórico de versões do artefato no claude.ai.

## Desenvolver e testar

O `CLAUDE.md` é o guia técnico (escrito para o Claude Code, mas legível): banco, regras, telas e o fluxo de versões.
Antes de publicar, teste no computador com um banco falso e um Claude simulado:

```bash
python artefato/testes/build_harness.py artefato/gestao-financeira.html artefato/testes/seed_teste.json teste/index.html
```

```bash
python -m http.server 8765 --directory teste
```

Abra `http://localhost:8765`, copie os arquivos `.js` de `artefato/testes/` para a pasta `teste/` e rode no console:

- `__v152()`, `__v151()` e `__v14()` (rode o `__v14()` uma vez sem saldo real e outra com), depois `__v15()`, que
  termina apagando os dados de teste, então por último;
- `__fuzz(400)` (lançamentos aleatórios e conferência das contas), `__monkey()` (clica em todos os botões) e
  `__overflow()` (largura no celular; use uma janela de 375 px).

`node artefato/testes/check.js artefato/gestao-financeira.html` confere se todo botão tem ação e todo campo existe.
`extrato_teste.pdf` é um extrato inventado para testar a conferência. Os dados de teste usam só nomes e valores
inventados.

**Regra do repositório:** nada pessoal no código nem nos arquivos versionados. Nomes, links de painel, e-mails e pastas
vêm do banco do painel ou do `CLAUDE.local.md`.

## Versões

| Versão | Data | O que mudou |
|---|---|---|
| v1–v4 | 03/11/2026 | Primeira versão (Ano, Mês, Lançar, Conferir, Plano, banco próprio), aba Conversa e aba Guia. |
| v5–v10 | 03/11/2026 | Contas e cartões com ciclo próprio, categorias editáveis com orçamento por mês, aba Arquivos, fixa no painel do dia, transferência entre contas, dinheiro por conta e fatura por cartão. |
| v11–v13 | 04/11/2026 | Duas varreduras completas com revisões e testes automáticos (95 correções) e o design no estilo iPhone, com tema claro e escuro. |
| v14 | 04/11/2026 | Tela Hoje, + para lançar em dois toques, gestos, Desfazer em toda gravação, avisos e Limpar a conversa. |
| 15.0.0 | 04/11/2026 | Parcelado, metas e caixinhas, fechar o mês guiado, ambiente e versão (teste e produção separados), versionamento. |
| 15.1.0 | 04/11/2026 | Fixas na Google Agenda, A receber e receitas incertas, compromissos dos próximos meses, backup semanal por tarefa agendada. |
| 15.2.0 | 04/11/2026 | Relatórios do Claude, Conversa com todo o histórico, botão Pôr na tela inicial, pasta do backup no painel. |
| 15.3.0 | 04/11/2026 | Nada pessoal no código (link, nomes e pasta vêm do banco), cadastro inicial de exemplo e modelos das tarefas agendadas. |

Detalhes no `CHANGELOG.md`.

## Licença

MIT. Veja `LICENSE`.
