# Como contribuir

Obrigado por querer melhorar o painel. Este guia explica como relatar um problema, sugerir uma ideia e mandar uma
mudança no código.

## A regra mais importante

**Nada pessoal no repositório.** Nunca cole em issues, pull requests ou arquivos:

- lançamentos, extratos, saldos, salários ou prints do seu painel com números reais;
- nomes de pessoas, links do seu artefato (`claude.ai/artifact/…`), e-mails ou caminhos de pasta do seu computador.

Para mostrar um problema, use o painel de teste com dados inventados (`artefato/testes/seed_teste.json`) ou descreva
o caso com valores fictícios. No código, nomes, links e pastas vêm do banco do painel (`config/main`) ou do
`CLAUDE.local.md` de cada instalação, que não vai para o repositório.

## Relatar um erro ou sugerir uma ideia

Abra uma [issue](https://github.com/Lipeem/gestao-financeira/issues/new/choose) com o modelo certo:

- **Erro:** o que aconteceu, os passos para repetir, o que você esperava, a versão (Plano → Ambiente e versão) e o
  aparelho e navegador.
- **Ideia:** o problema que ela resolve no seu dia a dia e como você imagina a solução.

Falha de segurança não vai em issue pública: veja o [`SECURITY.md`](SECURITY.md).

## Mandar uma mudança

O painel inteiro é um arquivo: `artefato/gestao-financeira.html`. O [`CLAUDE.md`](CLAUDE.md) descreve o banco, as
regras do método e o que cada parte do código faz; a seção "Regras que a revisão fixou (não regredir)" lista
comportamentos que não podem voltar atrás. A visão geral está em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

O fluxo de uma mudança:

1. **Edite** `artefato/gestao-financeira.html`.
2. **Suba a versão** em `const VERSAO` e `VERSAO_DATA`, no começo do script: MAIOR quando o formato do banco muda (precisa
   de migração), MENOR quando entra função nova, CORREÇÃO numa correção.
3. **Atualize o Guia** (a aba dentro da página) na mesma mudança, se a função aparece para quem usa. O Guia não cita
   pessoas pelo nome.
4. **Escreva no [`CHANGELOG.md`](CHANGELOG.md)** o que mudou, em português simples, e atualize a tabela de versões e o
   selo de versão do [`README.md`](README.md).
5. **Teste:**

   ```bash
   python artefato/testes/rodar_testes.py
   ```

   Se a mudança tem lógica nova, acrescente verificações num arquivo `artefato/testes/vXYZ.js` no mesmo formato dos
   outros (uma função `window.__vXYZ` que devolve `{ ok, falhas, passos }`) e inclua-o em `rodar_testes.py`.
6. **Confira à mão** no seu painel de teste: publique a página nele com o Claude Code e use as telas que mudaram, no
   celular e no computador.
7. Se uma tela mudou de aparência, **refaça as imagens** do README: `python artefato/testes/imagens_readme.py`.
8. Abra o **pull request** preenchendo o modelo.

## Como o código é escrito

- **Toda ação de botão passa por `runAct`** (`data-act="nome"` + `ACT.nome`). É assim que a gravação ganha o Desfazer.
  Nunca chame `ACT.x()` direto de um evento novo.
- **Lista nova com Editar e Apagar usa `swRow`** (gesto no celular, botões no computador).
- **Toda forma nova de lançar passa por `expandeParcelas` + `gravaDocs`.**
- **Coleção nova** entra em `COLLS`, no saneamento do `onColl`, no `ZERAR` (se for dado de uso) e na lista do backup.
- **Textos da tela** em português do Brasil, frases curtas, sem jargão. "Mensagem" é o que aparece depois de gravar
  (com Desfazer); "aviso" é um cartão da lista de avisos.
- **Celular primeiro:** nada pode passar da largura da tela (`__overflow()` confere), e os toques precisam de área
  confortável.
- **Valores no banco sempre positivos**, com `tipo` = `entrada`, `saida` ou `transferencia`; datas `AAAA-MM-DD`.

## Usando o Claude Code

O repositório foi feito para ser mantido com o Claude Code. O `CLAUDE.md` é lido automaticamente; o que for só da sua
instalação (links dos seus painéis, versões no ar, pastas, tarefas agendadas) vai num `CLAUDE.local.md` na raiz, que
o `.gitignore` deixa de fora. Peça ao Claude para seguir o fluxo acima e rodar os testes antes de propor a mudança.

## Commits e versões

Um commit por versão publicada, com uma tag `vX.Y.Z`. Mensagens de commit em português, dizendo o que mudou para quem
usa. Ao configurar o git, use o e-mail privado do GitHub (`ID+usuario@users.noreply.github.com`) para não expor o seu.
