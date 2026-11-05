# Histórico de versões

O número da versão tem três partes, **MAIOR.MENOR.CORREÇÃO**:

- **MAIOR** muda quando o formato dos dados no banco muda (precisa migrar os dados do teste e da produção);
- **MENOR** muda quando entra uma função nova;
- **CORREÇÃO** muda quando só se corrige um problema.

Toda versão vai primeiro para o painel de **teste** e, depois de aprovada, para o de **produção**. A versão que está
no ar em cada um fica anotada no `CLAUDE.local.md` de cada instalação. O histórico do código fica no git (uma tag
`vX.Y.Z` por versão).

## 15.3.0 — 04/11/2026

- **Pronto para repositório público:** o código não tem mais nomes de pessoas, links de painel nem pastas do
  computador. O nome da família fica no subtítulo do painel (Plano → Régua de cores), o link em Plano → Ambiente e
  versão ("Link deste painel", usado pelo botão Pôr na tela inicial) e a pasta do backup no mesmo cartão (em branco =
  pasta padrão da tarefa).
- **Conversa:** o Claude recebe o título e o subtítulo do painel no contexto, em vez de nomes fixos no código.
- **Leitor simples:** uma receita sem classificação procura uma subcategoria de receita citada pelo nome ("recebi 200
  do freelance" → Freelance).
- **Exemplo e modelos:** `exemplo/cadastro-inicial.json` (categorias e contas para começar um painel novo) e
  `tarefas/` (modelos das tarefas agendadas de relatório e de backup).
- **Testes:** dados de teste com nomes e valores inventados; `v152.js` com 50 verificações; as baterias da 15.1, 15.0
  e 14 continuam passando.

## 15.2.0 — 04/11/2026

- **Notificações do celular removidas:** os cartões Pendentes do celular e Notificações do celular, a seção do Guia e a
  leitura da planilha Google saíram (a pedido). Lançamentos feitos a partir delas continuam.
- **Relatórios do Claude:** em Plano, escolha relatório diário, semanal (e o dia) ou desligado, e se nos outros dias o
  Claude avisa quando há pendência. Por volta das 8h, uma tarefa agendada no app Claude do computador escreve o
  relatório na Conversa ("relatório do Claude") e manda uma notificação pelo app. A página guarda um resumo
  (`config/resumo`) com o saldo projetado e os avisos para a tarefa usar.
- **Conversa com todo o histórico:** o Claude da Conversa busca e soma lançamentos de qualquer período (ferramentas
  `buscar_lancamentos` e `totais`), e acha lançamentos antigos para corrigir ou apagar.
- **Pôr na tela inicial:** nenhum celular deixa uma página criar o atalho sozinha; o botão mostra os passos do aparelho
  (iPhone ou Android) e copia o link do painel.
- **Backup:** a pasta onde salvar é escolhida em Plano → Ambiente e versão (a tarefa só aceita as
  pastas que o texto dela permite; fora disso, vale a padrão).
- **Testes:** `artefato/testes/v152.js` (46 verificações) e as baterias da 15.1, da 15.0 e da 14.

## 15.1.0 — 04/11/2026

- **Fixas na Google Agenda:** em Plano → Fixas e receitas, o botão Agendar abre a Google Agenda com o evento pronto,
  repetindo todo mês no dia da fixa. O painel marca "agendada" e avisa "mudou: agende de novo" quando o valor, o dia ou
  o nome mudam.
- **Receitas incertas e A receber:** honorários, freela e vendas que podem não vir entram em Plano → A receber
  (ou numa receita fixa marcada como incerta). O seletor "Só as certas" mostra o ano sem elas, e aparece um aviso
  quando, sem elas, o saldo fica negativo antes. "Recebi" confirma; "Não vem" tira da previsão.
- **Compromissos dos próximos meses:** quanto de cada mês já está comprometido com fixas, parcelas, metas e compras
  planejadas contra a renda certa, a lista dos parcelamentos em andamento e um limite escolhido por vocês (enquanto
  ninguém escolhe, vale o sugerido: as fixas mais 10 pontos), com aviso e alerta no + antes de uma compra parcelada passar dele.
- **Backup automático semanal:** uma tarefa agendada no app Claude do computador copia o banco da produção toda
  segunda às 8h para `artefato/backup/auto-AAAA-MM-DD` (guarda as últimas 8). Liga e desliga em Plano → Ambiente e
  versão; aviso se ficar mais de 10 dias sem rodar.
- **Testes:** `artefato/testes/v151.js` (51 verificações), mais as baterias da 15.0 e da 14.

## 15.0.0 — 04/11/2026

Primeira versão com número completo e com produção separada do teste.

- **Parcelado:** "tv 1.800 em 6x no Nubank" (ou a linha Parcelas do + quando a conta é um cartão) cria uma parcela por
  mês, cada uma na fatura certa. A primeira conta no dia da compra; as outras entram como saída prevista, sem comer o
  limite diário. "Apagar as N parcelas" no Editar.
- **Metas e caixinhas:** reserva de emergência, viagem, IPVA… Todo mês a reserva sai do saldo livre, que é o saldo que
  pinta o calendário. Gasto pago com o dinheiro da meta usa o guardado e não pesa de novo. Plano → Metas e caixinhas;
  resumo em Hoje.
- **Fechar o mês:** botão no topo da tela Mês (e aviso nos primeiros dias do mês) com os passos em sequência:
  conferir, comentar o que faltou, saldo real, fixas que mudaram de valor, orçamento, limite do mês seguinte, cópia.
- **Pendentes do celular:** notificações de compra e Pix dos apps dos bancos viram lançamentos para confirmar com um
  toque, em Hoje. No Android, o MacroDroid manda as notificações para uma planilha Google, lida pelo conector Google
  Sheets do claude.ai; sem isso, dá para colar o texto das notificações.
- **Ambiente e versão:** etiqueta "Teste" no topo do painel de teste; baixar e importar o cadastro (contas, categorias,
  fixas, metas, limites); baixar a cópia completa; no teste, "Apagar os dados de teste" transforma uma cópia em produção.
- **Guia:** seções novas (Fechar o mês, Metas e caixinhas, Notificações do celular, Teste, produção e versões) e versão
  no rodapé.
- **Produção:** painel novo com o cadastro do teste e nenhum lançamento. O teste continua marcado como teste.
- **Testes:** bateria nova com 118 verificações (`artefato/testes/v15.js`) e três revisões independentes (lógica,
  regressão e visual/textos), com mais de 60 achados corrigidos antes da publicação. Sem metas e sem parcelas, os
  números são idênticos aos da 14 (comparados dia a dia em centenas de bancos simulados).
- **Não verificado:** a leitura da planilha pelo conector Google Sheets (o conector estava desconectado na conta no
  dia da publicação) e o caminho MacroDroid → Formulário Google num celular de verdade.

## 14 — 04/11/2026 e anteriores

As versões 1 a 14 (todas de 03 e 04/11/2026) estão resumidas na tabela "Versões" do `README.md`. A partir da 15, cada
versão tem a sua seção aqui.
