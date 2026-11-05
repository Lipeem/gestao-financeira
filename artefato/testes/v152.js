// Testes da versão 15.2: sem notificações do celular, pasta do backup, relatórios do Claude, resumo para a tarefa,
// Conversa com todo o histórico e o atalho na tela inicial. Uso no harness (seed_teste.json, recém-carregado): `await __v152()`.
window.__v152 = async function () {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const falhas = [], passos = []; const ok = (c, msg) => { (c ? passos : falhas).push(msg); };
  const errs = []; const onErr = e => errs.push(String(e.message || e.reason || e)); window.addEventListener("error", onErr); window.addEventListener("unhandledrejection", onErr);
  const clk = sel => { const e = typeof sel === "string" ? document.querySelector(sel) : sel; if (!e) throw new Error("não achei " + sel); e.click(); return e; };
  const toastTxt = () => document.getElementById("toast").textContent;
  const setIn = (id, v) => { const e = document.getElementById(id); if (!e) throw new Error("sem campo " + id); if (e.type === "checkbox") e.checked = !!v; else e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); };
  const view = async v => { S.view = v; S.sel = null; S.editing = null; render(); await w(80); };
  try {
    const vv = VERSAO.split(".").map(Number); ok(vv[0] > 15 || (vv[0] === 15 && vv[1] >= 2), "versão 15.2.0 ou mais nova");
    // ---------- 1. notificações do celular removidas ----------
    ok(!COLLS.includes("notificacoes") && typeof parseNotif === "undefined" && typeof notifBuscar === "undefined", "notificações do celular saíram do código");
    for (const v of ["hoje", "plano", "guia"]) { await view(v); ok(!/Pendentes do celular|Notificações do celular|MacroDroid/.test(document.getElementById("view").textContent), "tela " + v + " sem notificações do celular"); }

    // ---------- 2. pasta do backup ----------
    await write("config", "main", { ambiente: "producao" }, "update"); await w(300); await view("plano");
    const bp = document.getElementById("bk-pasta"); ok(bp && bp.value === "" && typeof BK_PASTA === "undefined", "campo da pasta do backup em branco (pasta padrão da tarefa), sem caminho pessoal no código");
    setIn("bk-pasta", "pasta qualquer"); clk("[data-act=backupPasta]"); await w(300); ok(!(S.cfg.backup && S.cfg.backup.pasta) && /caminho completo/.test(toastTxt()), "pasta sem caminho completo é recusada");
    setIn("bk-pasta", "C:\\Users\\voce\\Backups\\Financas\\"); clk("[data-act=backupPasta]"); await w(500); ok(S.cfg.backup && S.cfg.backup.pasta === "C:\\Users\\voce\\Backups\\Financas", "pasta guardada (sem a barra do fim)");
    setIn("bk-pasta", "D:\\outra"); clk("[data-act=backupPasta]"); await w(500); ok(S.cfg.backup.pasta === "D:\\outra" && /se a tarefa aceitar/.test(toastTxt()), "pasta guardada avisa que a tarefa decide se aceita");
    setIn("bk-pasta", "C:\\a\\..\\Windows"); clk("[data-act=backupPasta]"); await w(300); ok(S.cfg.backup.pasta === "D:\\outra", "caminho com .. é recusado");
    setIn("bk-pasta", ""); clk("[data-act=backupPasta]"); await w(500); ok(S.cfg.backup.pasta === null && /pasta padrão/.test(toastTxt()), "pasta em branco volta à padrão da tarefa");

    // ---------- 3. relatórios do Claude ----------
    ok(!!document.getElementById("relatorios") && /Nenhum relatório enviado/.test(document.getElementById("relatorios").textContent), "cartão Relatórios do Claude");
    setIn("rl-freq", "semanal"); setIn("rl-dia", "5"); setIn("rl-pend", true); clk("[data-act=relSalvar]"); await w(500);
    const rc = S.cfg.relatorio; ok(rc && rc.ativo === true && rc.frequencia === "semanal" && rc.dia === 5 && rc.pendencias === true && rc.ligadoEm, "salvar grava frequência, dia e pendências");
    ok(/toda sexta/.test(toastTxt()), "mensagem diz o dia");
    dirty(); S.avisosMem = {}; ok(!avisosLista().some(a => String(a.k).startsWith("rel:")), "recém-ligado: sem aviso");
    await write("config", "main", { relatorio: { ligadoEm: addDays(S.today, -20) + "T08:00:00-03:00", ultimo: { em: addDays(S.today, -12) + "T08:15:00-03:00", tipo: "semanal" } } }, "update"); await w(400); dirty(); S.avisosMem = {};
    ok(avisosLista().some(a => String(a.k).startsWith("rel:")), "relatório parado há dias gera aviso"); render(); await w(50); ok(/Último relatório:/.test(document.getElementById("relatorios").textContent), "mostra o último relatório");
    setIn("rl-freq", "desligado"); clk("[data-act=relSalvar]"); await w(500); ok(S.cfg.relatorio.ativo === false, "desligar o relatório");
    await write("config", "main", { ambiente: "teste" }, "update"); await w(300);

    // ---------- 4. resumo para a tarefa ----------
    await w(4800); const rs = window.__store.config && window.__store.config.resumo;
    ok(rs && rs.dia === S.today && typeof rs.saldoHoje === "number" && typeof rs.fimDoMes === "number" && Array.isArray(rs.avisos) && rs.versao === VERSAO, "a página grava config/resumo com saldo, fim do mês e avisos");
    const em0 = rs && rs.em; render(); await w(4800); ok(window.__store.config.resumo.em === em0, "sem mudança, o resumo não é regravado");
    ok(UNDO.pilha.length === 0, "gravar o resumo não abre Desfazer");

    // ---------- 5. Conversa com todo o histórico ----------
    const old = lancFromParsed({ data: "2026-02-10", valor: 33, tipo: "saida", descricao: "Uber antigo", comentario: "reunião", subcategoria: "Uber", forma: "Débito", contaId: null }); await write("lancamentos", old.id, old); await w(300);
    const tools = conversaTools(); ok(tools.length === 2 && tools.every(t => t.name && t.description.length < 1024 && JSON.stringify(t.inputSchema).length < 4096), "duas ferramentas dentro dos limites");
    const b1 = tools[0].execute({ texto: "uber antigo" }); ok(b1.encontrados >= 1 && b1.lancamentos.some(l => l.id === old.id), "buscar_lancamentos acha lançamento de fora dos 40 dias");
    const t1 = tools[1].execute({ agrupar: "subcategoria", tipo: "saida", de: "2026-01-01", ate: "2026-12-31", subcategoria: "Uber" }); ok(t1.grupos.length === 1 && t1.grupos[0].saidas >= 33, "totais soma por subcategoria no ano");
    const t2 = tools[1].execute({ agrupar: "mes", de: "2026-01-01" }); ok(t2.grupos.length >= 2 && t2.grupos[0].grupo > t2.grupos[t2.grupos.length - 1].grupo, "totais por mês, do mais recente");
    ok(JSON.stringify(tools[0].execute({})).length < 32000, "resultado da busca cabe no limite de 32 KB");
    await view("conversa"); S.chatDraft = "quanto gastei de Uber em 2026?"; const ci = document.getElementById("chatIn"); if (ci) ci.value = S.chatDraft; window.__toolCalls = []; await runAct("chatSend"); await w(1500);
    ok(window.__toolCalls.length === 1 && window.__sampleCalls.some(c => c.opts && c.opts.tools === undefined) !== null, "pergunta de histórico usa a ferramenta totais");
    ok(/Pelo histórico/.test(document.getElementById("view").textContent), "a resposta aparece na Conversa");
    const comAnexo = window.__sampleCalls.filter(c => c.kind === "json").pop(); ok(comAnexo, "chamada registrada");
    await write("lancamentos", old.id, null, "delete"); await w(200);
    // relatório escrito pela tarefa aparece com selo
    const rm = { id: "R20261104", em: S.today + "T08:15:00.000-03:00", papel: "claude", texto: "Relatório de teste", por: "relatorio" }; await write("conversa", rm.id, rm); await w(400); render(); await w(50);
    ok(/relatório do Claude/.test(document.getElementById("view").textContent), "mensagem do relatório aparece com o selo");

    // ---------- 6. atalho na tela inicial ----------
    await view("guia"); const ba = document.querySelector("[data-act=atalho]"); ok(!!ba, "Guia tem o botão Pôr na tela inicial"); clk(ba); await w(100);
    let at = document.getElementById("atalho"); ok(at && /Nenhum aparelho deixa/.test(at.textContent) && !document.getElementById("atalho-link") && /Ambiente e versão/.test(at.textContent), "sem link guardado: instruções e onde guardar o link");
    ok(typeof LINKS === "undefined" && linkPainel() === "", "nenhum link fixo no código");
    clk("[data-act=atalhoFechar]"); await view("plano");
    setIn("amb-link", "https://exemplo.com/x"); clk("[data-act=linkSalvar]"); await w(300); ok(!S.cfg.link && /claude\.ai\/artifact/.test(toastTxt()), "link de outro site é recusado");
    setIn("amb-link", "https://claude.ai/artifact/AbC123xyz"); clk("[data-act=linkSalvar]"); await w(500); ok(S.cfg.link === "https://claude.ai/artifact/AbC123xyz" && linkPainel() === S.cfg.link, "link deste painel guardado em Plano");
    await view("guia"); clk("[data-act=atalho]"); await w(100); at = document.getElementById("atalho"); ok(at && document.getElementById("atalho-link").value === linkPainel(), "com o link guardado, o atalho mostra e copia o link");
    ok(atalhoPassos("ios").some(t => /Adicionar à Tela de Início/.test(t)) && atalhoPassos("android").some(t => /Adicionar à tela inicial/.test(t)), "passos de iPhone e de Android");
    clk("[data-act=atalhoFeito]"); await w(80); let ls = null; try { ls = localStorage.getItem("gf-atalho"); } catch (e) {} ok(ls === "ok" && !document.getElementById("atalho"), "Já pus o atalho esconde o lembrete");
    try { localStorage.removeItem("gf-atalho"); } catch (e) {}

    // ---------- 7. Guia e telas ----------
    await view("guia"); ok(!!document.getElementById("g-relatorios") && !document.getElementById("g-celular") && /Todo o histórico/.test(document.getElementById("view").textContent), "Guia: relatórios e histórico, sem notificações do celular");
    ok(!/\b(Clara|Davi|Rita|Bruno|Ana|Paulo)\b/.test(document.getElementById("view").textContent), "Guia sem nomes");
    await write("config", "main", { link: null }, "update"); await w(200);
    for (const v of VIEWS) { await view(v); ok(!/Não consegui desenhar/.test(document.getElementById("view").textContent), "tela " + v + " desenha"); }
  } catch (e) { falhas.push("EXCEÇÃO: " + (e && e.stack || e)); }
  window.removeEventListener("error", onErr); window.removeEventListener("unhandledrejection", onErr);
  if (errs.length) falhas.push("erros na página: " + errs.slice(0, 5).join(" | "));
  return { ok: passos.length, falhas, passos };
};
