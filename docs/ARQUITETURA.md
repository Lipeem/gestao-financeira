# Arquitetura

Visão geral do código para quem vai mexer nele. O detalhe de cada campo do banco e de cada regra está no
[`CLAUDE.md`](../CLAUDE.md); aqui fica o mapa.

## Uma página, sem servidor

O painel é **um arquivo HTML** (`artefato/gestao-financeira.html`) publicado como artefato no claude.ai. Não há build,
framework nem dependências: CSS e JavaScript puros, dentro do próprio arquivo.

- **Primeiro `<style>` e primeiro `<script>`:** o painel em si (telas, modelo, banco, Conversa).
- **`<style id="ios-layer">` e o segundo `<script>`, no fim:** a camada visual no estilo iPhone (barra de abas
  embaixo no celular, folha "Mais", painel do dia que sobe de baixo, tema claro e escuro).

O que a página usa da plataforma, sempre por `claude.use(nome)`:

| Capacidade | Para quê |
|---|---|
| `db` | O banco do artefato: coleções de documentos, lidas em tempo real (`onSnapshot`) e gravadas pela página. |
| `sample` | O Claude de quem está usando, para a aba Conversa e a leitura das conferências. |
| `assets` | Os anexos da Conversa (PDF, imagens, planilhas), listados na aba Arquivos. |
| `downloads` | Exportar para Excel, baixar o cadastro e a cópia completa. |
| `user` | Saber se quem está vendo é o dono (por exemplo, para "Apagar os dados de teste"). |

Sem `sample`, a Conversa cai no leitor simples da página (`parseLine`); sem `db`, a página não tem o que mostrar.

## Estado e desenho

- **`S`** guarda o estado: os documentos de cada coleção (a cópia crua do banco fica em `S.raw`, usada pelo
  Desfazer), a tela atual e os formulários abertos.
- **`COLLS`** lista as coleções escutadas: `config`, `recorrentes`, `lancamentos`, `ajustes`, `extrato`,
  `conciliacoes`, `historico`, `conversa`, `contas` e `metas`. Cada atualização passa por **`onColl`**, que saneia
  registros malformados (um registro estragado nunca derruba a tela).
- **`render()`** redesenha a tela atual a partir de **`V[tela]`**. As telas são `hoje`, `ano`, `conversa`, `mes`,
  `lancar`, `conferir`, `plano`, `arquivos`, `guia` e `fechar`; o endereço `#tela` abre cada uma direto.
- Textos vindos do banco passam por **`esc`** antes de entrar no HTML.

## O modelo: o ano dia a dia

**`buildModel`** transforma o banco em um mapa de dias (`M.days`) e de meses (`M.months`):

1. Parte do **saldo real** (`config/main.ancora`): dinheiro em conta menos fatura em aberto, numa data.
2. Põe cada **fixa e receita** (`recorrentes`, com os `ajustes` do mês) na data dela, a menos que um lançamento com o
   mesmo `recId` e `mes` já a tenha cumprido.
3. Soma os **lançamentos** reais e planejados, as **parcelas** (cada uma na fatura certa), as **metas** (reservas que
   saem do saldo livre) e as **transferências** (que não mudam o saldo).
4. Desconta, em cada dia futuro, o **limite diário** de variáveis do mês.

Cada dia sai com o saldo ao fim dele, e a cor vem da régua de 5 faixas. `modeloReal()` é o modelo sem simulação de
compra; `modeloCons()` é o cenário só com as receitas certas. Os avisos (`avisosCalc`), a tela Hoje, o fechamento do
mês, a exportação e o contexto da Conversa leem do modelo; nada é calculado duas vezes de jeitos diferentes.

## Gravar e desfazer

- Todo botão tem `data-act="nome"` e um tratador em **`ACT`**, chamado sempre por **`runAct`**. `runAct` abre um diário
  e **`write(coleção, id, dados, modo)`** guarda o estado anterior de cada documento tocado.
- No fim da ação aparece a mensagem com **Desfazer**. O Desfazer é tudo ou nada: se outro aparelho mudou um dos
  documentos nesse meio-tempo, nada volta.
- Lançamentos novos passam por **`expandeParcelas`** e **`gravaDocs`**, para que uma compra parcelada vire todas as
  parcelas de uma vez.

## A Conversa

- Cada mensagem vira uma chamada `sample.json` com as regras (`REGRAS`), o contexto do painel (**`ctxText`**: saldo,
  limite, fixas em aberto, lançamentos recentes, orçamento) e as últimas mensagens.
- Sem anexo, a chamada leva duas ferramentas só de leitura (**`conversaTools`**): `buscar_lancamentos` e `totais`,
  para perguntas sobre todo o histórico.
- O Claude devolve um JSON (`resposta`, `lancar`, `corrigir`, `apagar`, `saldo`, `extrato`). A página valida tudo,
  grava e mostra o cartão com Desfazer. Mensagem com anexo é só leitura.
- **Extrato:** o Claude só transcreve as linhas. O cruzamento com os lançamentos é da página
  (**`processarExtrato`**): mesmo valor e até 3 dias = bateu; diferença pequena com descrição parecida = divergente; o
  resto = só no banco.

## O leitor simples

**`parseLine`** entende frases como "ontem 45 uber — volta do trabalho" sem o Claude: data, valor, tipo, conta (depois
de preposição: "no Nubank"), parcelas ("em 6x"), transferência entre contas cadastradas e a fixa do mês
(**`matchRec`**, por descrição e apelidos). O comentário depois do travessão nunca entra na classificação.

## Testes

Em `artefato/testes/`:

| Arquivo | O que faz |
|---|---|
| `build_harness.py` | Monta uma cópia local da página com banco e Claude simulados (`mock_sample.js`). |
| `seed_teste.json` | Banco de teste, só com nomes e valores inventados. |
| `rodar_testes.py` | Roda todas as baterias num navegador sem janela; é o que a verificação do GitHub usa. |
| `v14.js`, `v15.js`, `v151.js`, `v152.js` | Baterias de cada versão (Hoje, +, Desfazer, parcelado, metas, agenda, relatórios…). |
| `fuzz.js` | Invariantes do modelo com lançamentos aleatórios, cliques em tudo e largura no celular. |
| `check.js` | Confere que todo `data-act` tem tratador e todo `getElementById` tem elemento. |
| `imagens_readme.py` | Refaz as imagens do README com um painel de demonstração. |
