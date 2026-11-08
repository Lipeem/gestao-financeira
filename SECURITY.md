# Segurança

## Como relatar uma falha

**Não abra uma issue pública.** Use o relato privado do GitHub:
[Report a vulnerability](https://github.com/Lipeem/gestao-financeira/security/advisories/new).

Descreva o problema, como repetir e o que alguém conseguiria fazer com ele, **sempre com dados inventados**. Nunca
mande lançamentos, extratos, links do seu painel ou prints com números reais. A resposta vem pelo próprio relato.

## O que está no escopo

O código deste repositório, principalmente:

- texto vindo do banco ou de anexos (descrições, comentários, extratos) que consiga executar código na página;
- conteúdo de anexo que faça a Conversa agir como se fosse uma instrução (apagar, corrigir, mudar o saldo);
- dados de um painel aparecendo para quem não deveria vê-los por causa de algo que a página faz;
- os modelos de tarefa agendada em `tarefas/` gravando além do que dizem.

## O que está fora

- A plataforma do claude.ai (artefatos, banco, compartilhamento, conectores): relate à Anthropic pelos canais dela.
- O que depende de como cada pessoa compartilha o próprio artefato.

## Versões cobertas

Só a versão mais recente (a do ramo `main`). Atualize o seu painel antes de relatar.

## Como o painel protege os dados

- O banco é o do artefato de cada pessoa, com as regras de acesso do claude.ai; este repositório não guarda dado de
  ninguém.
- A página escapa os textos vindos do banco ao desenhá-los na tela (função `esc`); um caso que escape disso é falha.
- O texto de anexos vai ao Claude entre marcadores, declarado como dado; mensagem com anexo é só leitura.
- A Conversa apaga no máximo 20 lançamentos por mensagem, e toda ação dela tem Desfazer.
