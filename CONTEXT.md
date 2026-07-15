# Context — Overtime App

Glossário do domínio. Sem detalhes de implementação — apenas a linguagem ubíqua.

## Termos

### Project (Projeto)
Um contexto de trabalho ao qual as horas pertencem (ex.: "NTT DATA"). É uma
entidade própria, com identidade e nome. Todo **Overtime Entry** pertence a
exatamente um Projeto (obrigatório). O **Balance** é calculado por Projeto —
horas extras de um Projeto não abatem folgas de outro.

### Overtime Entry (Registro)
Um lançamento de horas em uma data, de um dos tipos abaixo. Pertence sempre a
um Projeto. Informa as horas diretamente ou por horário de entrada/saída.

### Type (Tipo) — Worked / Used
- **Worked (Trabalhada):** hora extra acumulada.
- **Used (Gozada):** hora extra consumida (folga).

### Balance (Saldo)
`horas Worked − horas Used`, **por Projeto**. Positivo = crédito de horas a gozar.
