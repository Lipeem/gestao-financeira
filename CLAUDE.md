# Gestão Financeira — painel de caixa num artefato do Claude

Painel de finanças da casa que vive num **artefato do claude.ai**: uma página HTML com banco de dados próprio, sem
servidor e sem planilha. Este arquivo é o guia técnico para quem (ou qual Claude) for mexer no código.
**O contexto de cada instalação** (links dos painéis, versões no ar, pastas, tarefas agendadas, quem usa) fica em
`CLAUDE.local.md`, que não vai para o repositório; o Claude Code lê os dois.

- **Ambiente:** cada instalação tem dois artefatos. O de **teste** (`config/main.ambiente = "teste"`, etiqueta "Teste"
  no topo) recebe toda mudança primeiro; a **produção** só recebe uma versão depois de testada e aprovada pelo dono. Os
  dois usam o mesmo arquivo-fonte; o banco de cada um é separado. Os links estão em `CLAUDE.local.md` e, desde a 15.3,
  em `config/main.link` de cada banco.
- **Visual (v12):** o design iPhone faz parte da página: um segundo `<style id="ios-layer">` e um segundo `<script>` no
  fim do arquivo (barra de abas embaixo abaixo de 760 px, folha "Mais", painel do dia como folha abaixo de 560 px, fonte
  do sistema, botão de tema claro/escuro guardado em `localStorage["gf-tema"]`). `check.js` só confere o primeiro
  `<script>`; confira o segundo com `node --check` à parte.
- **Versão 14:** tela **Hoje** (primeira aba; no celular a página abre nela), lançamento rápido **+**, gestos de
  deslizar, **Desfazer pelo aviso** em toda gravação feita por botão e **avisos** no topo. Barra de baixo no celular:
  Hoje · Mês · + · Conversa · Mais (Ano, Lançar, Conferir, Plano, Arquivos, Guia). Detalhes na seção própria abaixo.
- **Versão 15.3.0 (04/11/2026):** nada pessoal no código (nomes, links e pastas vêm do banco), para o repositório
  público. Detalhes na seção "v15.3".
- **Versão 15.2.0 (04/11/2026):** notificações do celular removidas; **relatórios do Claude** (tarefa agendada que
  escreve na Conversa e notifica), pasta do backup escolhida no painel, **Conversa com todo o histórico** (ferramentas
  de busca) e botão **Pôr na tela inicial**. Detalhes na seção "v15.2".
- **Versão 15.0.0 (04/11/2026):** parcelado (＋, Lançar, painel do dia, Conversa), **metas e caixinhas** (saldo livre),
  **fechar o mês** guiado, **pendentes do celular** (notificações do banco via planilha Google), **ambiente e versão**
  (selo de teste, baixar/importar cadastro, começar do zero) e versionamento. Detalhes na seção "v15" abaixo.

## Versionamento (desde a v15)

- **Número:** `const VERSAO` e `VERSAO_DATA` no começo do script da página, no formato MAIOR.MENOR.CORREÇÃO. MAIOR muda
  quando o formato do banco muda (precisa de migração), MENOR quando entra função nova, CORREÇÃO numa correção. A
  página mostra a versão em Plano → Ambiente e versão e no fim do Guia.
- **Histórico:** `CHANGELOG.md` na raiz (o que mudou em cada versão, em português simples). Cada versão publicada ganha
  uma cópia local em `artefato/versoes/gestao-financeira-vX.Y.Z.html` (fora do repositório).
- **Git:** repositório público no GitHub (endereço e pasta do `.git` em `CLAUDE.local.md`). Um commit e uma tag `vX.Y.Z`
  por versão publicada. Nunca fazer push sem o dono pedir.
- **Nada pessoal entra no repositório:** dados reais, backups, sementes tiradas de planilha real, cópias publicadas e o
  `CLAUDE.local.md` ficam fora (`.gitignore`). No código, nunca escreva nomes de pessoas, links de artefato, e-mails ou
  caminhos de pasta: tudo isso vem do banco (`config/main`) ou do `CLAUDE.local.md`. Antes de cada commit, procure
  esses itens nos arquivos que mudaram. Exemplos e testes usam só nomes e valores inventados.
- **Fluxo de uma mudança:** editar `artefato/gestao-financeira.html` → subir `VERSAO` → testar no harness → publicar no
  **teste** (Artifact com `url` do teste e `label` "vX.Y.Z teste") → ler de volta → o dono aprova → publicar o **mesmo
  arquivo** na **produção** (`url` da produção, `label` "vX.Y.Z") → anotar a versão de cada ambiente na tabela do
  `CLAUDE.local.md`. Mudança no formato do banco exige migrar os DOIS bancos (teste e produção) com `ArtifactData`,
  nunca só um.
- **Publicar sempre com `url` explícito.** A ferramenta Artifact decide o destino pelo caminho do arquivo quando não há
  `url`: publicar `artefato/gestao-financeira.html` sem `url` cai no artefato publicado antes a partir desse caminho
  (ou cria um novo). As capacidades (iguais nos dois): `assets`, `db` (regra raiz `interact`), `downloads`, `sample`
  com imagens e `user`. Na publicação, omitir `capabilities` mantém as atuais.
- **Banco de produção:** dado de verdade. Antes de qualquer escrita com `ArtifactData` na produção, faça backup e
  confirme com o dono; testes e experimentos só no teste. Exceções autorizadas: a tarefa agendada de backup grava
  `config/main.backup.ultimo` (e só isso) depois de copiar o banco; a tarefa de relatório grava um documento novo em
  `conversa` (`por: "relatorio"`) e `config/main.relatorio.ultimo`; a própria página grava `config/resumo`.

- **Fonte da página:** `artefato/gestao-financeira.html`. Para mudar a página, edite esse arquivo e publique com
  a ferramenta Artifact passando `url` = o link do painel (sem `url` nasce um artefato novo).
- **Banco:** o banco do próprio artefato, lido e escrito com a ferramenta `ArtifactData` (mesmo `url`).
  A página recalcula tudo sozinha a cada mudança; não há fórmula em lugar nenhum.
- **Planilha antiga:** quem migrou de uma planilha guarda os arquivos de origem e a semente em `artefato/seed/` (fora do
  repositório). Para levar os dados ao Excel, a página tem "Exportar para Excel" (aba Plano).
- Acesso: só o dono. Regra do banco: lê e escreve quem tem nível `interact` ou acima. Conta pessoal do Claude: quem for
  convidado é de fora da organização, então só lança se convidado **por e-mail como Editor** e com o link público
  desligado (com link ligado, quem é de fora cai para `view` e não vê nada). Contribuidor só vale dentro de plano de equipe.
  A Conversa gasta o Claude de quem manda a mensagem; lançar e editar pela página não gasta nada.
- **O Guia não cita pessoas pelo nome:** tudo sobre outra pessoa usar o painel é tratado como compartilhamento do
  artefato (seção "Compartilhar o painel"), para a página servir a qualquer instalação.

## O método que a página respeita

1. **Dia futuro nunca fica vazio:** fixas e receitas nas datas certas + o **limite diário** de variáveis.
2. **O limite diário é uma decisão por mês** (`config.diario`), com três sugestões calculadas: fecha o mês no zero,
   guarda a reserva, média real dos últimos 30 dias.
3. **Comentário é parte do lançamento.** Sem ele a conferência vira adivinhação.
4. **A cor é a bússola:** régua de 5 faixas (`config.faixas`, padrão −500 / 0 / 1.000 / 2.000).
5. **Cartão no dia da compra (competência).** A compra no crédito conta no dia; o pagamento da fatura nunca conta.
   Saldo do termômetro = dinheiro em conta − fatura em aberto. Com `cartao.fechamento` e `cartao.vencimento`
   preenchidos, a página também mostra o "dinheiro em conta".
6. **Âncora:** `config.ancora` = saldo real no início do dia `data` (`conta` − `faturaAberta`). Dias antes dela ficam
   cinza ("sem conferência"). Enquanto `definida` for `false`, a projeção parte de R$ 0.

## Coleções do banco

Valores sempre **positivos**, com `tipo` = `entrada` | `saida` | `transferencia`. Datas `AAAA-MM-DD`, mês `AAAA-MM`.

| Coleção / doc | Campos |
|---|---|
| `config/main` | `ancora{data,conta,saldos[{id,valor}] (dinheiro por conta; lista, não objeto),faturaAberta,faturas{contaId: valor},definida,atualizadoEm}`, `reservaMin`, `faixas[4]`, `diarioPadrao`, `diario{AAAA-MM: valor}`, `orcamento[{id,nome,valor,subs}]` (`subs:["*"]` = resto), `cartao{fechamento,vencimento}`, `formaPadrao` |
| `config/categorias` | `lista[{id, subcategoria, categoria, tipo (entrada\|saida), natureza (Fixa\|Variável), ativa, orcamento (padrão/mês, só despesas variáveis), orcamentoMes {AAAA-MM: valor}}]` e `grupos[{nome (categoria), orcamento (null = soma das subcategorias), orcamentoMes}]` (lista, não objeto: `update` faz merge em objetos e não apagaria chaves). Hierarquia na tela: **Bloco** (tipo × natureza) → **Categoria** → **Subcategoria**; cada lançamento guarda as duas últimas pelo nome. Orçamento da categoria = valor próprio (do mês, senão padrão) ou a soma das subcategorias (`orcCat`); o total soma categorias. Renomear subcategoria ou categoria propaga para `lancamentos` e `recorrentes`. `config/main.orcamento` (grupos antigos) só é lido se nenhum item tiver `orcamento`. |
| `recorrentes/REC-NNN` | `descricao,tipo,valor,dia,categoria,subcategoria,conta("Conta Corrente"\|"Cartão Crédito"),forma,ativa,inicio,fim,aliases[],obs` |
| `ajustes/REC-NNN_AAAA-MM` | `recId,mes,valor,dia,pular` (muda uma fixa só naquele mês) |
| `lancamentos/<id>` | `data,valor,tipo,descricao,comentario,categoria,subcategoria,forma,conta,contaId,status,recId?,mes?,parcela?{n,de,grupo},fonte,criadoEm,conc?{lote,extratoId,valorBanco,dataBanco,nota}`. Transferência (v9): `tipo: "transferencia"`, `contaId`/`conta` = origem (sempre uma conta), `contaDestinoId`/`contaDestino` = destino (conta ou cartão; cartão = pagamento da fatura), `categoria: "Transferências"`, `subcategoria` e `forma` = `"Transferência"`, nunca `recId`. |
| `extrato/<id>` | `lote,data,valor,tipo,descricao(do banco),conta,forma?,status,lancId?,nota?,sugestao?{descricao,subcategoria,comentario,recId?,mes?}` |
| `conciliacoes/<lote>` | `criadoEm,de,ate,conta,fonte,titulo,analise(texto),resumo{conciliados,divergentes,soExtrato,soAnotado,totalBanco,totalAnotado},soAnotado[lancIds]` |
| `contas/<id>` | `nome, tipo (conta\|cartao), icone (emoji; null = automático pela cor do banco, `icoConta`), bandeira (só cartão: Visa\|Mastercard\|Elo\|Amex\|Hipercard\|Outra), fechamento, vencimento, pagadora (id da conta), padrao, ativa`. Vazia → a página usa dois registros virtuais (`conta-principal`, `cartao-principal`). Lançamentos e fixas guardam `contaId` + `conta` (nome); registros antigos só têm `conta` e caem no padrão do tipo (`accOf`). |
| `historico/<id>` | `em,acao,ref,antes,depois,porque,autor` |
| campos v15.1 | `recorrentes.incerta` (receita que pode não vir), `recorrentes.agenda{em,valor,dia,fim,descricao}` (marcada como agendada na Google Agenda), `lancamentos.incerta` (receita planejada incerta), `config/main.compromissoMax` (% da renda), `config/main.backup{ativo, ligadoEm, ultimo{em,docs,pasta}}` |
| `metas/<id>` (v15) | `nome, icone, alvo (0 = sem alvo), guardado (já guardado no início), mensal, dia (1–28), inicio (AAAA-MM-DD), prazo (AAAA-MM ou null), contaId (onde o dinheiro fica; só informativo), encerrada (AAAA-MM-DD ou null), criadoEm, atualizadoEm, por` |
| `notificacoes/<id>` (só 15.0 e 15.1) | removida na 15.2 com a função de notificações do celular; registros antigos são ignorados. |
| `config/resumo` (v15.2) | escrito pela página quando muda (fora do Desfazer): `em, dia, versao, saldoHoje, guardadoMetas, limiteHoje, variaveisHoje, fimDoMes, resultadoMes, menorSaldo{d,v}, primeiroVermelho{d,v}, saldoRealDefinido, saldoRealData, avisos[{n,t}]`. A tarefa de relatório lê daqui o que só a página calcula. |
| campos v15.2 | `config/main.relatorio{ativo, frequencia (diario\|semanal), dia (1 = segunda … 7 = domingo), pendencias, ligadoEm, ultimo{em,tipo}}`, `config/main.backup.pasta` (caminho do Windows) |

`config/main` também guarda `titulo` e `subtitulo` do painel (editáveis em Plano → Régua de cores),
`ancora.faturas` (`{contaId: valor}`, uma fatura em aberto por cartão; `faturaAberta` é a soma) e, desde a v15,
`ambiente` (`"teste"` mostra o selo; ausente ou `"producao"` não), `fechamentos{AAAA-MM: {em,por,ent,fixas,variaveis,
metas,resultado,saldoFinal,semComentario,pendentes,exportado,versao} | null}` (null = reaberto) e
`notif{planilha (link), desde (ISO: só entram notificações da planilha a partir daí)}`. Lançamentos ganharam
`parcela{n,de,grupo,total}` (todas as parcelas com `status: "lancado"`; o simulador continua usando `planejado`),
`metaId` (gasto pago com o dinheiro de uma meta) e `fonte: "notificação"`.
Dinheiro em conta: só cartões com `fechamento` e `vencimento` adiam a saída do dinheiro (`cardDue(dia, cartao)`);
cartão sem ciclo é tratado como débito no dia.
| `conversa/<id>` | `em` (com milissegundos), `papel` (`voce`\|`claude`), `texto`, `anexos[{nome,tipo,tamanho,assetId?}]`, `acoes{lancados[],corrigidos[{id,antes,depois}],apagados[doc],saldoAntes,saldoNovo,conferencia,confResumo,confAntes[doc],saldoFinal}`, `desfeito?`, `resposta_a`, `por` |

Arquivos anexados na Conversa ficam nos **assets** do artefato (só para quem pode editar: dono e Editores); o id vai
em `conversa.anexos[].assetId` e em `conciliacoes.anexos[]`, e abre em `/_blob/<id>`. A aba **Arquivos** lista tudo
(`assets.list()` + referências), baixa (`fetch` do blob + `downloads.save`) e apaga (`assets.delete` + limpa as
referências, marcando `anexos[].apagado`). A Conversa pode criar categorias (`novasCategorias` no JSON do Claude).

`status` do lançamento: `lancado` (aguardando extrato) · `conciliado` · `divergente` · `planejado` (futuro, não aconteceu) · `ignorado`.
Um lançamento com `recId` + `mes` **substitui** a previsão daquela fixa naquele mês (não conta duas vezes).
`status` do extrato: `conciliado` · `divergente` · `so_extrato` · `fatura` · `transferencia` · `ignorado` · `lancado`.

## Aba Conversa (dentro do artefato, desde 03/11/2026)

O jeito principal de conferir e de lançar falando do seu jeito (para o gasto do dia a dia há também o +, que não usa
o Claude): funciona no celular, sem abrir conversa no Claude e sem computador ligado.
- Usa a capacidade `sample` (o Claude do **plano de quem está vendo**; pede permissão na primeira mensagem).
  Sem ela, linhas com valor entram pelo leitor simples da página (`parseLine`).
- Uma chamada `sample.json` por mensagem, com `REGRAS` + `ctxText()` (saldo, limite, fixas em aberto, lançamentos dos
  últimos 40 dias, orçamento, saídas por subcategoria) + as 10 últimas mensagens. Resposta:
  `{resposta, lancar[], corrigir[], apagar[], saldo, extrato}`. A página valida e grava; toda ação tem Desfazer.
- Anexos: PDF vira texto com pdf.js (PDF escaneado vira imagem), CSV/OFX/TXT lidos como texto (UTF-8 ou Windows-1252),
  Excel via SheetJS, imagens vão direto ao Claude.
- Extrato: o Claude só extrai as linhas; o **cruzamento é determinístico na página** (`processarExtrato`: mesmo valor
  e até 3 dias = bateu; até 15% ou R$ 15 com descrição parecida = divergente; resto = só no banco). Depois uma segunda
  chamada escreve a leitura comparando com os comentários, gravada em `conciliacoes.analise`.
- As rotinas abaixo continuam valendo quando o dono pedir pelo Claude Code.

## Aba Guia

O tutorial para quem usa vive na própria página (`V.guia`, link direto `#guia`). **Quando mudar uma função do painel,
atualize o Guia na mesma publicação.** O checklist "Comece aqui" se marca sozinho a partir do banco (`guiaPassos()`).
A seção `hoje` ("Hoje, + e gestos") explica a tela Hoje, o +, os gestos, o Desfazer e a lista de avisos.

## Hoje, +, gestos, Desfazer e avisos (v14)

- **Hoje** (`V.hoje`, `#hoje`): quanto ainda cabe em variáveis hoje (`x.limite − x.vari` do modelo), saldo ao fim do
  dia e do mês, os avisos (3 de cada vez, "Mostrar mais" abre o resto ali mesmo), os próximos 14 dias na cor do saldo
  (`.strip14`; o traço embaixo marca dia com fixa ou receita), fixas atrasadas/de hoje/dos próximos 7 dias
  (`fixasProximas`), os 6 últimos lançamentos (`lancRowMini`) e contas e cartões (`accPopHtml`). Abre em Hoje em telas
  até 760 px (a mesma largura da barra de baixo); no computador continua abrindo em Ano.
- **+ lançamento rápido** (`S.qa`, `renderQa`, ações `qa*`, folha `#qa`): teclado numérico próprio no toque (o campo
  do valor fica `readonly` para não abrir o teclado do sistema; no computador se digita e Enter lança; no toque, Enter
  no comentário só fecha o teclado). Valor fixo no alto, categorias/conta/data/comentário no meio (rola), teclado e
  Lançar fixos embaixo. Categorias mais usadas em 90 dias (`qaSubs`, até 8, completando com variáveis) + "Outra…";
  conta (receita só em conta; conta pausada não vale; padrão `formaPadrao`); data (hoje, ontem ou outro dia **até
  hoje**); comentário, descrição e fixa. Liga sozinho à fixa (`qaAuto`) só quando a subcategoria é de natureza
  **Fixa**, há **uma** fixa dessa subcategoria com ocorrência aberta e o valor está a até 50% do previsto. A ocorrência
  segue o `matchRec` (`qaOcc`): mês da data, depois o anterior em aberto; o mês seguinte só se vence em até 10 dias;
  nunca fixa já paga ou pulada. Escolher a fixa à mão traz o tipo, a subcategoria e uma conta compatível. Valor ≥ R$ 10
  milhões não grava. Ao abrir, o resto da página fica `inert`; ao fechar, o foco volta para quem abriu.
- **Gestos** (`swRow`, handlers `SW` de pointer, só toque): fixa para a direita = `payRec`; planejado para a direita
  (aba Lançar) = "Aconteceu"; lançamento para a esquerda revela Editar e Apagar (com o nome e o valor no rótulo).
  Tocar no lançamento abre a edição (Hoje, Lançar e painel do dia). Com uma linha aberta, o primeiro toque em qualquer
  lugar só fecha. Gesto que começa a menos de 24 px da borda esquerda fica com o sistema (voltar do Safari). Em tela
  sem toque as camadas do gesto somem e os botões ficam à mostra; no toque os duplicados (`.li .acts.sw-dup`) somem.
- **Desfazer pela mensagem** (`runAct`, `jRegistra`, `jFecha`, `desfazerJ`): todo `[data-act]` (e os atalhos de
  teclado) passa por `runAct`, que abre um diário; `write()` guarda o estado anterior de cada doc tocado (`S.raw`, cópia
  crua do snapshot). A mensagem da ação só aparece no fim (`J.msg`), uma vez, com **Desfazer** (8 s; Ctrl/Cmd+Z enquanto
  ela está na tela). O Desfazer espera até 8 s o banco devolver o que a ação gravou (`jEstados`: antes, intermediários,
  final); se não chegar, pede para tentar de novo e nunca diz "Desfeito" sem gravar. É **tudo ou nada**: se qualquer doc
  mudou depois (outra tela, outra pessoa), nada volta e a mensagem diz quantos mudaram. Sem Desfazer: ações em
  `UNDO_FORA` (Conversa, limpar a conversa, apagar arquivo, baixar, exportar; enquanto rodam, `UNDO.fora` marca as
  outras como mistas), gravações simultâneas, Conversa trabalhando (`CHAT.busy`), escrita em `conversa`, ou falha.
  `runAct` ignora a mesma ação assíncrona com o mesmo `data-id`/`data-mk` enquanto a primeira não termina (toque
  duplo); `payRec` tem trava por fixa e mês até o banco devolver o lançamento (`S.payPend`). `historico` fica fora do
  diário; o Desfazer grava "Desfeito pelo aviso". Apagar lançamento não pede confirmação quando o Desfazer é possível
  (`podeDesfazer`); quando não é, a mensagem traz o botão "Apagar" para confirmar. Apagar arquivo sempre pergunta.
- **Avisos** (`avisosLista` com cache por versão do modelo, `avisosCalc`, `avisosHtml`): em Hoje, abaixo do resumo; em
  Ano e Mês só os vermelhos (até 2). Ordem por gravidade (`n` 1 vermelho, 2 amarelo, 3 azul): saldo projetado negativo
  em até 45 dias; fatura de cartão com ciclo vencendo em até 5 dias, com o saldo da `pagadora` no dia; fixas que
  passaram da data (mês atual e anterior, a partir do saldo real); orçamento estourado ou ≥ 90% faltando 5+ dias
  (subcategoria só com valor próprio; categoria com valor próprio ou soma, que aparece estourada mesmo com uma
  subcategoria em 90%; no máximo 3); ontem sem lançamento; linhas do extrato pendentes; saldo real com mais de 35 dias.
  Os de saldo só aparecem com saldo real informado. O ✕ guarda `chave → "data|n"` em `localStorage["gf-avisos"]` (por
  aparelho, 120 dias): fixas atrasadas (`late:mês`) e extrato pendente (`conf:mês`) voltam só se o número aumentar. O
  selo da aba Hoje conta os avisos `n ≤ 2` e o rótulo de acessibilidade diz "Hoje, N avisos". Textos usam "A fixa…",
  "A receita…", "A fatura do cartão…", "A conta…" (gênero certo) e "R$" sem quebra de linha.
- Vocabulário da página: **mensagem** é o que aparece depois de gravar (com Desfazer); **aviso** é cartão da lista de avisos.
- **Limpar a conversa** (`chatLimparAsk/Nao/Sim`): botão "Limpar" no topo da Conversa → aviso de atenção (quantas
  mensagens, o que continua, sem volta) → apaga **todos** os docs de `conversa` em lotes (`collection("conversa")
  .limit(500).get()` até esvaziar; o painel só escuta as 120 últimas). Lançamentos, conferências e assets ficam. Fora do
  Desfazer; uma linha "Conversa limpa" no `historico`. Enquanto apaga, Enviar fica travado.
- **Áudio:** a plataforma não dá microfone à página e o `sample` não aceita áudio; o caminho é o ditado do teclado do
  celular (Conversa, caixa da aba Lançar, comentário do +). O Guia explica isso em "Falar em vez de digitar".

## Parcelado, metas, fechamento, notificações e ambiente (v15)

- **Parcelado** (`expandeParcelas(doc, n)`, `parcSeg`, `PARC_MAX = 24`): o valor TOTAL vira N lançamentos, um por mês no
  mesmo dia da compra (dia limitado ao fim do mês), `parcela{n,de,grupo,total}`, a última leva o arredondamento. A 1ª
  conta como gasto do dia (`var`); as outras são `kind: "sai"` (comprometidas, fora do limite diário e de `varMes`), mas
  entram no orçamento do mês delas. No ＋ a linha Parcelas só aparece com conta de cartão e sem fixa (`qaParcEf`); em
  Lançar e no painel do dia vale para qualquer saída sem fixa; a Conversa manda `"parcelas": N` com o total. O leitor
  simples entende "em 6x", "parcelado em 10", "6 parcelas" e "3x de 400" (= 1.200); "Nx" solto só com crédito ou
  "parcelado". Editar mostra "Apagar as N parcelas" (`delGrupo`). Fixa e receita nunca se dividem.
- **Metas e caixinhas** (`metaEventos`, `metaGuardado`, coleção `metas`): o motor ganhou `day.meta` (reserva > 0, uso
  ou devolução < 0) e `day.guard` (guardado ao fim do dia). `day.net` desconta `day.meta`; o saldo do termômetro
  (`fim`) passa a ser o **livre** = real − guardado, e a âncora parte de `A.valor − g0` (g0 = metas antes da data do
  saldo real). Dinheiro por conta (`bal`, `saldos`, `caixa`, `faturasNaData`) NÃO muda com metas. Reserva: "já
  guardado" no dia do início + `mensal` no `dia` de cada mês até o prazo ou o alvo. Gasto com `metaId` (só se a meta
  existe, `usaMeta`) é `kind: "sai"`, fica fora de `varMes` e do orçamento, e devolve ao livre até o guardado.
  Encerrar devolve o resto no dia; apagar a meta apaga o efeito (os gastos voltam a pesar). `sugestoes` desconta as
  reservas. Telas: Plano → Metas e caixinhas, cartão Metas em Hoje, "livre · R$ X nas metas", coluna Metas no Mês.
- **Fechar o mês** (`V.fechar`, `#fechar`, `S.fechMk`): 8 passos (extrato, comentários com campo em linha, saldo real
  depois do fim do mês, fixas atrasadas e com valor novo → `fechRecValor` muda `recorrentes.valor`, orçamento, limite
  do mês seguinte com `sugHtml`, exportar Excel, concluir). Concluir grava `config/main.fechamentos[mk]`; reabrir grava
  `null`. Aviso `fech:<mês>` nos dias 1–10 se o mês anterior tem lançamentos e não foi fechado. Fechar não trava nada.
- **Pendentes do celular:** existiu na 15.0 e na 15.1 (notificações do banco via MacroDroid → Formulário Google →
  planilha, lida pelo conector Google Sheets). Removida na 15.2 a pedido do dono; o código está no git (tag v15.1.0).
- **Ambiente e versão** (Plano): selo `#envTag` + faixa amarela no topo quando `ambiente === "teste"`; "Baixar o
  cadastro" (`cadastroObj`: config sem âncora/ambiente/fechamentos/notif, categorias, contas, recorrentes, metas;
  `tipo: "gestao-financeira-cadastro"`), "Baixar a cópia completa" (`S.raw` inteiro; conversa e histórico só os
  recentes), "Importar um cadastro" (também na tela de banco vazio; grava por cima pelo id e, em banco vazio, cria
  `config/main` com âncora não definida e `ambiente: "producao"`). "Apagar os dados de teste" (`zerarTeste`, só dono e
  só no teste, pede APAGAR, fora do Desfazer): apaga `ZERAR` (lançamentos, extrato, conciliações, conversa, histórico,
  ajustes, notificações) com `collection.get()`, zera a âncora e vira produção.

## Agenda, receitas incertas, compromissos e backup (v15.1)

- **Fixas na Google Agenda** (sem conector): `gcalLink(r)` monta `calendar.google.com/calendar/render?action=TEMPLATE`
  com o próximo vencimento (`recDue`, a partir de hoje e do `inicio`), evento de dia inteiro e
  `RRULE:FREQ=MONTHLY;BYMONTHDAY=<dia>` (31 vira −1, último dia) com `UNTIL` quando há `fim`. Na tabela de Fixas e
  receitas o botão é um `<a target=_blank data-ag>` (a navegação é do navegador); um listener chama
  `runAct("agendaMarca")`, que grava `recorrentes.agenda = {em, valor, dia, fim, descricao}`. "Mudou: agende de novo"
  quando algum desses muda (`agendaMudou`); "Tirar a marca" grava `agenda: null`. O painel não sabe se o evento foi salvo.
- **Receitas incertas:** `recorrentes.incerta` (só entrada; checkbox no formulário da fixa) e `lancamentos.incerta` em
  receita planejada (Plano → **A receber**: `aReceberSalvar`, `aRecebi` vira `lancado` com a data de hoje se ainda
  não chegou, `aNaoVem` apaga). `S.semIncertas` (seletor "Todas as receitas / Só as certas", `cenarioHtml`, em Ano,
  Mês, Hoje e A receber; guardado por aparelho em `localStorage["gf-cenario"]`) faz o `buildModel` pular essas
  receitas. `modeloCons()` = modelo só com as certas (cache `S.modelCons`, limpo no `dirty`); `modeloReal()` = sem
  simulação e com todas as receitas. Aviso `redc:` quando, sem as incertas, o saldo fica negativo antes (até 60 dias).
  A Conversa manda `"incerta": true` em receita planejada que pode não vir. A lista "Compras e contas planejadas" agora
  mostra só saídas.
- **Compromissos** (Plano, `compromissosCard`): por mês, a partir do `modeloReal`, `compromissoMes` soma renda certa
  (entradas menos as incertas), fixas (recorrentes de saída + lançamentos com `recId` ou subcategoria Fixa), parcelas
  (`parcSeg` ou parcela planejada; a 1ª de uma compra real não conta), metas (reservas) e planejadas. Limite
  `config/main.compromissoMax` (sem ele, `compSugerido`: o maior % das fixas nos 12 meses + 10 pontos, arredondado
  para 5, entre 70 e 150); linha vermelha, aviso `comp:` (o primeiro mês acima, nos 6
  seguintes) e alerta no ＋ (`qaFxTxt`) quando a compra parcelada leva um mês acima do limite. `parcelamentos()` lista
  os grupos com parcelas por vir.
- **Backup automático semanal:** tarefa agendada do Claude Desktop `backup-gestao-financeira` (segunda 8h,
  `~/.claude/scheduled-tasks/backup-gestao-financeira/SKILL.md`; modelo em `tarefas/backup.md`). Ela lê `config/main.backup.ativo` da
  PRODUÇÃO; se não for `true`, para sem copiar. Ligada, salva as 11 coleções em
  `auto-AAAA-MM-DD/` dentro da pasta escolhida (ou da padrão da tarefa), guarda só as 8 pastas `auto-` mais recentes e grava
  `config/main.backup.ultimo = {em, docs, pasta}`. A chave fica em Plano → Ambiente e versão (`backupHtml`,
  `backupAtivo` grava `backup.ativo` e `backup.ligadoEm`). Aviso `bk:` com o backup ligado e mais de 10 dias sem
  rodar (e mais de 8 desde que foi ligado). No teste o cartão só explica que o backup é da produção. A tarefa roda
  sem o modo de permissão desta sessão: na primeira vez pode pedir aprovação das ferramentas no app.

## Relatórios do Claude, histórico na Conversa, atalho e pasta do backup (v15.2)

- **Notificações do celular removidas** (pedido de 04/11): coleção `notificacoes`, cartões, avisos `nt:`, Guia e a
  capacidade `mcp` saíram. Lançamentos com `fonte: "notificação"` continuam válidos.
- **Relatórios do Claude** (Plano → Relatórios do Claude, `relatorioCard`, `relSalvar`): `config/main.relatorio`. Tarefa
  agendada `relatorio-gestao-financeira` (todo dia por volta das 8h; o app espalha alguns minutos;
  `~/.claude/scheduled-tasks/relatorio-gestao-financeira/SKILL.md`; modelo em `tarefas/relatorio.md`): lê a PRODUÇÃO; desligado = não faz
  nada; no dia de relatório (todo dia, ou no `dia` da semana) escreve na `conversa` (`papel: "claude"`,
  `por: "relatorio"`, id `R` + AAAAMMDDHHMM) o resumo do período (variáveis contra o limite, maiores categorias,
  entradas, sem comentário, projeção de `config/resumo` se for de hoje ou ontem, pendências), grava
  `relatorio.ultimo` e manda `PushNotification`; nos outros dias, só pendências (se `pendencias`). As regras de
  pendência estão no texto da tarefa (fixas atrasadas com `ajustes` e âncora, a receber atrasadas, extrato pendente,
  ontem sem lançamento, saldo real com mais de 35 dias, mês anterior sem fechar). Na Conversa a mensagem aparece como
  "relatório do Claude" (`ehRelatorio`). Aviso `rel:` quando ligado e parado há mais de 3 dias (diário) ou 9
  (semanal). A notificação é a do app Claude: aparece no computador e só chega ao celular com o Remote Control ligado
  (não verificado).
- **`config/resumo`** (`resumoAtual`, `resumoAgenda`): 4 s depois de cada desenho, se o conteúdo mudou (comparação
  `estavel`, sem `em`), a página grava direto pelo `S.db` (fora do `write`, então não limpa formulários nem entra no
  Desfazer; `jRegistra` também ignora `config/resumo`). Usa `modeloReal()` e `avisosCalc`.
- **Pasta do backup:** `config/main.backup.pasta` (campo em Ambiente e versão, `pastaOk`: caminho completo do Windows,
  sem `..`); a tarefa só aceita as pastas que o texto dela permite (a regra
  de cada instalação está no `CLAUDE.local.md`), senão usa a padrão dela; em branco (15.3) = padrão. Grava a subpasta
  completa em `backup.ultimo.pasta`, que o painel mostra.
- **Conversa com todo o histórico** (`conversaTools`): sem anexo e com `S.sampleLimits.tools`, a chamada leva duas
  ferramentas só de leitura, `buscar_lancamentos` (filtros de, ate, texto, subcategoria, categoria, tipo, conta,
  incluirPlanejados; até 60 itens, soma e total) e `totais` (agrupar por subcategoria, categoria, mês ou conta;
  entradas, saídas e transferências separadas; até 40 grupos). As REGRAS mandam usá-las fora dos 40 dias e aceitam ids
  delas em corrigir/apagar. Pergunta com ferramenta custa 2 a 3 rodadas do plano de quem pergunta.
- **Atalho na tela inicial** (`atalhoHtml`, `aparelho`, `linkPainel` com `LINKS` de teste e produção ou
  `config/main.link`): nenhum navegador deixa uma página criar o atalho; o botão (em Hoje, no celular, até "Já pus o
  atalho", guardado em `localStorage["gf-atalho"]`; e no Guia → Comece aqui) mostra os passos do iPhone (Safari →
  Compartilhar → Adicionar à Tela de Início) ou do Android (Chrome → ⋮ → Adicionar à tela inicial) e copia o link.

## Nada pessoal no código e tarefas na nuvem (v15.3)

- **Link do painel:** `config/main.link` (Plano → Ambiente e versão, campo "Link deste painel", `linkSalvar` com
  `data-in`, `LINK_RE` aceita só `https://claude.ai/artifact/…` ou `…/code/artifact/…`). `linkPainel()` devolve `""`
  sem link; o atalho então manda guardar o link em vez de mostrar o campo. Nenhum link fixo no código.
- **Nomes:** título e subtítulo vêm de `config/main.titulo` e `subtitulo` (padrões "Gestão Financeira" e "termômetro do
  caixa"). A Conversa recebe `PAINEL: título — subtítulo` no `ctxText()`; as REGRAS e o prompt da conferência não têm
  nomes. Quem quer o nome da família no topo escreve no subtítulo (Plano → Régua de cores).
- **Pasta do backup:** campo em branco = pasta padrão da tarefa; `BK_EXEMPLO` é só o exemplo do texto. O painel não
  sabe quais pastas a tarefa aceita: diz isso e mostra onde o último backup gravou.
- **Leitor simples:** receita que nada classificou procura uma subcategoria de receita ativa pela primeira palavra do
  nome (4 letras ou mais) antes de cair em "Outras Receitas" (substitui uma regra que tinha um nome fixo).
- **Testes:** `seed_teste.json` tem só nomes e valores inventados (Ana, Bruno, Clara, Davi, Rita, Paulo); os testes
  conferem que o Guia não cita esses nomes.
- **Tarefas na nuvem (teste de 04/11/2026):** uma rotina do Claude Code na nuvem (claude.ai/code/routines, ambiente
  Anthropic, **sem repositório**) carregou `ArtifactData` pelo ToolSearch e leu `config/main` do painel de teste;
  `PushNotification` respondeu "Mobile push requested"; os conectores Gmail, Google Drive e Google Calendar estavam
  disponíveis. A rotina roda com o computador desligado e gasta o plano igual a uma sessão. Cron em UTC (ou com
  `CRON_TZ=`), no mínimo uma hora entre execuções. Ainda não verificado: se a notificação chegou ao celular.

## Rotina 1 — "gastei 87 no mercado" (lançar pelo Claude)

1. Ler `config/categorias`, `recorrentes` e os lançamentos do mês (para saber quais fixas já estão pagas).
2. Para cada gasto: data (hoje se omitida), valor, tipo, descrição curta, **comentário** com o contexto que a pessoa deu,
   subcategoria da lista (não inventar; nova categoria só no fechamento do mês e com aprovação), forma e conta
   (crédito → `conta: "Cartão Crédito"`).
3. Se for uma fixa do mês ainda aberta: `recId` + `mes`. Se o valor diferir mais de 5% do previsto, avisar.
4. Gravar com `ArtifactData` (`batch`, ids `C` + `AAAAMMDDHHMMSS` + 2 letras), `fonte: "claude"`, `status: "lancado"`.
5. Uma linha em `historico` por lote. Responder com o resumo e o saldo do dia (ler a página não é possível; calcule
   ou diga que a página já mostra).

## Rotina 2 — conferência com o extrato (semana ou mês)

1. Ler o extrato (PDF, CSV, OFX, print ou texto). Período `de`–`ate`, conta, saldo final se houver.
2. Ler `lancamentos` do período (±3 dias nas bordas) e os `extrato` já importados (não duplicar: data + valor + descrição).
3. Casar: mesmo valor (até R$ 0,01) e data até ±3 dias; empate → descrição e comentário. Diferença pequena com mesma
   descrição → `divergente`. Compras no crédito **não** aparecem no extrato da conta: entram em `soAnotado` com a nota
   de que vão para a fatura. Débito do pagamento da fatura → `status: "fatura"` (nunca vira lançamento).
4. Gravar: um doc `extrato` por linha do banco, `update` nos lançamentos casados (`status` + `conc`), e o doc
   `conciliacoes/<lote>` com `resumo` e `analise`: o que bateu, o que divergiu, o que só o banco mostra, e a leitura
   dos **comentários contra o que de fato saiu** (padrões, gasto acima do limite, fixa com valor novo).
5. Linhas `so_extrato` levam `sugestao` (descrição, subcategoria, comentário provável). Quem decide é ele, pela página
   (Lançar / Ignorar), a menos que peça para o Claude lançar.
6. Se o extrato trouxer o saldo final, atualizar `config/main.ancora` (data do dia seguinte ao fim do extrato,
   `conta` = saldo final, `faturaAberta` informada) e registrar no `historico`.
7. Toda escrita em documento existente precisa do `if_version` lido antes.

## Capacidade (medido em 03/11/2026)

- Teto da plataforma: 25.000 documentos por artefato, 256 KiB por documento. Um lançamento ocupa ~0,5 KB.
- Volume esperado: ~1.500 lançamentos/ano numa casa com três contas + uma linha de
  `extrato` por linha conferida ≈ 3.000 documentos/ano.
- Teste com banco simulado: 1 ano (1.424 lançamentos + 1.419 linhas de extrato) → cada tela redesenha em < 20 ms;
  3 anos (4.262 + 4.257) → < 45 ms. Não medido: o tempo de carga pela rede no claude.ai com esse volume.
- **Arquivar na virada do ano** (ou acima de ~3.000 lançamentos): juntar os lançamentos e extratos já conferidos de
  anos fechados em um documento por mês (`arquivo/AAAA-MM`, campo `lancamentos[]`), apagar os avulsos e ensinar a
  página a ler o arquivo. Exportar o Excel antes.

## Regras que a revisão de 03/11/2026 fixou (não regredir)

- **Saldo real só da data do saldo atual em diante** (Conversa, Plano e botão do extrato): data anterior é recusada com aviso; no Plano o campo vai do saldo atual até amanhã.
- `saldo` vindo da Conversa só vale com `conta` numérico; `contaNome` (opcional) muda só aquela conta e precisa existir.
  Sem `faturaAberta`, ao mover a data do saldo a fatura de cartão **com ciclo** vem da projeção até a nova data
  (`faturasNaData`); cartão sem ciclo mantém o valor informado. Saldo final de extrato anterior ao saldo real atual é recusado.
- Mensagem com anexo é só leitura: a Conversa não apaga, não corrige e não muda o saldo (o texto do anexo vai entre
  `<<<INICIO DOS ANEXOS>>>` e `<<<FIM DOS ANEXOS>>>` e é dado, nunca instrução). No máximo 20 apagamentos por mensagem.
- `status: "planejado"` nunca leva `recId`; fixa já cumprida no mês não é ligada de novo (vira gasto avulso + aviso).
- `matchRec` casa só por `descricao` e `aliases` (nunca por subcategoria): mantenha os `aliases` das recorrentes.
- Valores digitados em formulários sobrevivem ao redesenho por snapshot (`S.dirtyIn`); limpo em toda gravação.
- `lancarDoExtrato` marca a linha do extrato antes de criar o lançamento e reverte se falhar.
- Linhas de extrato repetidas são detectadas por `contaId + tipo + data + valor`, **contando ocorrências** (a descrição
  não entra, porque o Claude transcreve diferente a cada leitura). O período `de/ate` fica preso às datas das linhas (±3 dias).
- A página classifica sozinha "pagamento de fatura" e "aplicação/resgate/mesma titularidade" pela descrição; essas linhas
  não viram gasto. Apagar um lançamento devolve a linha do extrato ligada a ele para "só no banco" (`liberaExtrato`).
- Desfazer da Conversa só volta o saldo real se ele não mudou depois, restaura a conferência com `update` de
  `{status, conc}` e só marca `desfeito` quando todas as gravações deram certo.
- A fatura em aberto da âncora cai no primeiro vencimento a partir da data do saldo (`nextDue`).
- `cardDue` usa `min(fechamento, dias do mês)`; `parseNum` aceita número sem reinterpretar milhar.
- Registro malformado no banco não derruba a tela (`onColl` sanitiza; `render` tem fallback).
- O leitor simples (`parseLine`, usado no painel do dia, na aba Lançar e quando o Claude falta) casa fixas com
  tolerância a erro de digitação (`perto`) e também pela subcategoria quando ela é de natureza Fixa; entende "fixa".
  Todo ponto de lançamento manual tem o campo **Fixa** (`fixaOptions`/`aplicaFixa`); o Editar liga e desliga.
- Lançamento de subcategoria de natureza Fixa sem `recId` conta como saída fixa (não entra no limite diário).
- O simulador é um só (`simForm`), mostrado em Ano, Mês (`simCard`, com triângulo) e Plano.
- **Transferência entre contas cadastradas não muda o saldo** (v9): no modelo é `kind: "trf"` e fica fora de
  entradas, fixas, variáveis, limite diário, orçamento e totais. `detectaTrf` (leitor simples) só vira transferência
  quando origem e destino são contas de `contas`; destino desconhecido (Pix para alguém) é saída normal. "paguei a
  fatura" sem nome vai para o cartão padrão, saindo da `pagadora`. Na conferência, `processarExtrato` casa linhas
  com transferências (mesmo valor, ±3 dias, lado de origem ou de destino conforme o extrato), primeiro as linhas
  classificadas `transferencia`/`fatura`; linhas casadas com transferência não somam no total do banco.
- Pela Conversa: `lancar[].tipo = "transferencia"` com `conta` (origem) e `contaDestino`; sem destino cadastrado,
  `docDeItem` recusa e avisa.

- Leitor simples (v11): o comentário (depois do travessão) não entra na classificação; a fixa só se liga sozinha com
  valor até 50% do previsto; "paguei/gastei/comprei…" no começo força saída ("entrada"/"receita" soltas não viram
  receita); valor ignora número grudado em letra ou seguido de "x" e prefere R$ > separador > maior; data impossível
  fica vazia e a linha não grava; conta só é reconhecida depois de preposição ("no Nubank", "pela Caixa"), com o nome
  inteiro quando tem mais de uma palavra ("Mercado Pago").
- Gravação em lote (`pvSave`, "Lançar todos" do extrato, "Lançar" do dia) tem trava contra clique duplo e reconfere a fixa
  (já cumprida no mês ou repetida no lote vira avulso com aviso).
- Dinheiro por conta: transferência para cartão até 10 dias depois do pagamento automático devolve o valor à pagadora
  (não paga duas vezes); para cartão sem ciclo não mexe no saldo. `config/main` é saneado no `onColl` (limite diário,
  reserva e régua numéricos); âncora com data inválida vira hoje; valor negativo vira positivo com o tipo trocado;
  lançamento com `recId` sem `mes` recebe o mês da data.

- v13 (segunda varredura): `ancora.faturasSeg {contaId: valor}` guarda a parte da fatura que vence no vencimento
  **seguinte** (compras entre o último fechamento e a data do saldo); `faturasNaData` separa as duas pela projeção e o
  modelo agenda cada parte no seu vencimento. O Plano soma as duas no campo e, ao salvar, zera `faturasSeg`.
  `faturasNaData`/`saldosNaData` usam `M.anchorMap` (o mesmo mapa do modelo) e um modelo sem simulação (`modeloReal`).
- Extrato: repetidas primeiro por chave + descrição, depois só pela chave; a classificação automática (fatura,
  aplicação, resgate) só vale para linhas que não casaram com um lançamento; transferência com palavra-chave forte casa
  antes do cruzamento normal; período informado é aceito quando cobre todas as linhas e tem até 45 dias; saldo final só
  vale se o extrato não passa de hoje; nome exato de conta com pista de fatura/cartão usa o cartão do mesmo banco.
- Leitor: papel de cada conta pela palavra antes dela (da/do/pelo = origem; pra/pro/para = destino; no/na = depende
  do verbo); "pra" alguém que não é conta = saída normal; "fatura do X", "fatura paga", "pgto fatura" e "paguei o
  cartão" = pagamento de fatura; 13º/adiantamento/férias não ligam fixa; fixa do mês seguinte só se vence em até 10
  dias; desempate de fixas pelo valor; número com mais de 9 dígitos, telefone e linha digitável não viram valor.
- Desfazer correção devolve só os campos que não mudaram depois; desfazer apagamento religa a linha do extrato.

- v14: toda ação por botão passa por `runAct` (nunca chame `ACT.x()` direto de um evento novo, senão perde o Desfazer);
  o Desfazer é tudo ou nada, nunca sobrescreve o que mudou depois e nunca é oferecido com gravações misturadas. O + só
  aceita data até hoje, só liga fixa por subcategoria de natureza Fixa e escolhe a ocorrência como o `matchRec`. Ao criar uma lista nova com Editar/Apagar, use
  `swRow` (gesto + botões). `.toast` é flex: mantenha `.toast[hidden]{display:none}`.
- v15 (revisões de 04/11): a reserva de meta (`kind: "meta"`) fica fora do laço de dinheiro por conta; o gasto com
  meta só tira do limite e do orçamento a parte que o guardado não cobriu (`M.metaCob`, `metaExc`, `item.varParte`);
  "Recomeçar" uma meta encerrada cria outra a partir de hoje (não cobra o tempo parado); cadastro importado e
  "começar do zero" recomeçam as metas hoje com guardado 0 e reiniciam `notif.desde`. Parcela N no cartão vence na
  fatura da 1ª + N−1 meses (`parcela.compra`, `parcDue`); no máximo uma parcela por centavo. Em Lançar e no painel do
  dia as parcelas só valem no cartão (como no ＋); a Conversa aceita parcelas em qualquer saída. `parseNotif`: estorno,
  reembolso e devolução = entrada; "cancelada" = só informação; parcelas só com "em Nx", "Nx de R$", "N parcelas" ou
  "parcelado" ("3x de R$ 100" = 300); estabelecimento é o primeiro "em/no/para X" que não seja forma de pagamento.
  Notificação com código/senha/token sem R$ não é guardada (`notifSensivel`); repetidas (mesmo texto) não viram dois
  lançamentos; data dd/mm × mm/dd fica com a leitura mais perto de hoje; a planilha é lida inteira (`A:F`) do fim para
  o começo. A busca automática não entra no Desfazer de outra ação (`S.ntAuto`). Fechamento: só mês que já acabou
  (o atual adianta os passos), botão do Mês diz o nome do mês a fechar, "Manter" e a cópia ficam em
  `config/main.fechPassos{AAAA-MM: {copia, manter{recId: true}}}`. Texto único: "saldo livre · R$ X guardados nas metas".
- v15.1 (revisão de 04/11): "Recebi" grava a receita com a data de hoje (receita atrasada antes do saldo real ficaria
  fora da projeção) e há aviso `arec:` para receita a receber que passou da data; pela Conversa, "recebi X" de uma
  receita a receber vira `corrigir` com `status: "lancado"` (não lança de novo). O link da agenda usa o dia da fixa,
  sem o ajuste de um mês; fixa que já terminou ou pausada não tem botão (e a marca vira "apague o evento na agenda");
  dias 29 e 30 avisam que a agenda pula fevereiro (BYMONTHDAY simples, BYSETPOS não testado no link). "Já guardado"
  de meta nova não conta em compromissos; mês sem renda certa com compromisso conta como acima do limite. Fechar o
  mês, Exportar para Excel e o contexto da Conversa usam `modeloReal()` (não dependem do seletor "Só as certas").
- v15: sem metas e sem parcelas os números são idênticos aos da v14 (a revisão comparou dia a dia). Metas nunca mexem
  no dinheiro por conta (`bal`/`saldos`/`caixa`), só no saldo livre. Toda nova forma de lançar passa por
  `expandeParcelas` + `gravaDocs` (nunca grave só o primeiro doc). Gasto com meta e parcela 2..N ficam fora de `varMes`.
  `zerarTeste` e `ntBuscar` ficam em `UNDO_FORA`. Nova coleção = entrar em `COLLS`, no `onColl` (sanear), no `ZERAR`
  (se for dado de uso) e na lista do Backup.

## Testar mudanças na página

Ferramentas em `artefato/testes/` (comandos no `README.md`): `build_harness.py <pagina> <seed> <saida>` monta uma
cópia local com banco e Claude simulados (`mock_sample.js`); `seed_teste.json` tem contas extras (Nubank, Nubank Cartão,
Poupança) para testar transferências; `check.js` confere `data-act` sem handler e ids sem elemento;
`extrato_teste.pdf` é um extrato inventado. Sirva a saída com `python -m http.server` e teste no navegador.
No navegador, carregue `fuzz.js` (`__fuzz(400)` invariantes do modelo, `__monkey()` clica em tudo de cada tela,
`__overflow()` largura no celular em todas as telas e na folha do +), `v14.js` (`__v14()`: Hoje, +, gestos,
Desfazer e avisos; rode com e sem saldo real informado) e `v151.js` (`__v151()`, 51 verificações: agenda, receitas incertas, a receber, compromissos, backup) e `v15.js` (`__v15()`, 118 verificações: parcelado, metas, fechamento,
notificações, cadastro, ambiente; termina apagando os dados de teste, então rode por último ou recarregue). O mock do Claude usa a ferramenta `totais`
quando recebe ferramentas e a pergunta é de histórico ("quanto … em 2026"). `v152.js` (`__v152()`, 50 verificações:
sem notificações, pasta do backup, relatórios, resumo, histórico na Conversa, atalho). Use o viewport `mobile` do navegador para `__overflow()` (com o painel estreito a medida engana).
Depois publique e faça uma leitura de volta com `ArtifactData`.

## Backup

`artefato/backup/AAAA-MM-DD/<coleção>/<id>.json`, feito com `ArtifactData list` + `out_dir` em todas as coleções
(`config, recorrentes, ajustes, lancamentos, contas, extrato, conciliacoes, conversa, historico, metas`). Restaurar = `batch`
de `set` a partir dos arquivos (até 50 por lote). Os anexos (assets) não entram no backup.
