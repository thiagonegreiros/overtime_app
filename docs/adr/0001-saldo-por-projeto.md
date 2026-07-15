# Saldo de horas é por Projeto, não global

Ao introduzir a divisão por Projetos, decidimos que o **Balance** (horas Worked −
horas Used) é calculado **isoladamente por Projeto**. Horas extras acumuladas em
um Projeto não abatem folgas de outro, e **não existe mais um saldo global**
somando todos os Projetos.

**Por quê:** o objetivo da divisão por Projetos é separar contextos de trabalho
(ex.: clientes distintos). Um saldo global voltaria a misturar exatamente o que
a divisão pretende separar — uma hora extra no NTT DATA não deve virar folga em
outro cliente. Toda a visualização (dashboard, resumo mensal/anual) passa a ser
escopada ao Projeto selecionado.

**Considered:** manter um card de "total geral" além dos saldos por Projeto.
Rejeitado por reintroduzir a soma entre contextos e poluir o dashboard conforme
o número de Projetos cresce.

**Consequência:** a página principal sempre opera sobre exatamente um Projeto
selecionado (o último usado, persistido no cliente). Não há visão panorâmica de
todos os Projetos ao mesmo tempo neste escopo.
