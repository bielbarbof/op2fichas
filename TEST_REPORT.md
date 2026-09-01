# Relatório de testes — OP2 Playtest Fichas v0.6.0 Definitiva

## Resultado

**Build aprovada no QA local para fechamento da v0.6.0.**

## Suites executadas

- Validação estática e integridade: **48/48 OK**.
- Núcleo das fichas: **25/25 OK**.
- Interações essenciais de UI: **19/19 OK**.
- Suite completa das cinco fichas: **76/76 OK**.
- Núcleo do Chat compartilhado: **11/11 OK**.
- Sintaxe de todos os módulos JavaScript (`node --check`): **OK**.
- Manifests JSON: **OK**.

## Cobertura funcional

### Cinco personagens

Alan, Edgar, Eloísa, Kênia e Victor foram testados individualmente para:

- PV `+` e `−`;
- PD `+` e `−`;
- limites de recursos;
- ausência de erros JavaScript;
- dados de atributos e perícias apontando para a variante correta do perfil.

### Habilidades

- Alan: Foco Mental e Ímpeto por falha real/forçada.
- Edgar: Ímpeto por falha.
- Eloísa: ciclo completo de Avaliação com 2 D4 e Foco Emocional.
- Kênia: dois D4 de Avaliação preparados simultaneamente e consumidos na rolagem.
- Victor: ativação, cobrança e encerramento de Prontidão.

### Estado e autorização

- Mestre pode alterar fichas.
- Jogador autorizado pode alterar sua ficha.
- Jogador não autorizado é bloqueado.
- Mutações são serializadas para evitar perda de atualização.
- Estado de estresse permanece abaixo do limite de segurança de metadata.

## Integridade visual e assets

- Os seis dados-base permanecem byte a byte iguais aos PNGs originais.
- Variantes de perfil existem para Executor, Analista e Vigilante em D4/D6/D8/D10/D12/D20.
- Atributos, perícias e mecânicas da ficha usam a variante do perfil correta.
- D6 recebe escala visual 0,9 por CSS em Fichas, roster e Chat.
- Retrato desktop não intercepta cliques.
- Mobile não carrega a arte de corpo inteiro.
- Traçados decorativos rejeitados foram removidos.

## QA visual

Renderizações finais verificadas em desktop para Executor e Analista confirmaram:

- cor do perfil aplicada nos dados da ficha;
- D6 visualmente reduzido;
- arte central abaixo do cabeçalho;
- ausência dos traçados laterais sem função;
- habilidades e recursos sem colisão.

A suite responsiva confirmou ausência da arte de corpo inteiro no mobile e operação funcional dos controles.

## Fontes

O QA privado foi executado com Arpona e Girassol carregadas como webfonts reais. O pacote distribuível não inclui os binários; `prepare_fonts.py` reinstala as cópias fornecidas pelo usuário antes do deploy.
