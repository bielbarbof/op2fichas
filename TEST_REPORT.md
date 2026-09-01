# Relatório de testes — OP2 Playtest Fichas v0.5.1 Recovery

## Resultado geral

**Candidata aprovada no QA local da Recovery.**

A build foi auditada contra a especificação enviada neste chat e contra o PDF do Playtest Alpha. A regra base confirmada no Playtest é: dois dados por teste, DT padrão 7, máximo de quatro dados rolados, no máximo três somados, sucesso crítico quando dois ou mais dados repetem um valor >= 6 e falha crítica quando todos os dados mostram 1.

## Testes automatizados

- Sintaxe de todos os módulos JavaScript: **OK**.
- Manifest v0.5.1 válido e descrição abaixo de 128 caracteres: **OK**.
- Schema preserva `com.op2.playtest/state-v1`: **OK**.
- Migração/normalização preserva atribuições, PV, PD e Ímpeto: **OK**.
- Autorização: jogador não altera ficha alheia; Mestre altera qualquer ficha: **OK**.
- Limites de PV/PD: **OK**.
- Foco Mental: cobra 2 PD, bloqueia duplicata e fica restrito a Mente: **OK**.
- Foco Emocional: cobra 2 PD e fica restrito a Emoção: **OK**.
- Prioridade de Foco no próximo teste compatível quando há excesso de bônus preparados: **OK por implementação auditada**.
- Avaliação: cobra 2 PD, cria 2 d4, permite preparar os dados separadamente e bloqueia nova ativação enquanto houver dados ativos: **OK**.
- Ímpeto: gasto de 1 espaço para d4 e gasto de 3 para +1 passo: **OK**.
- Prontidão: cobra 3 PD, ativa sem duplicar e pode ser encerrada: **OK**.
- Estado de estresse com efeitos continua abaixo do limite de segurança de metadata: **OK**.
- Rolagem usa no máximo 4 dados e soma no máximo 3: **OK**.
- Casos determinísticos: sucesso, falha, sucesso crítico, falha crítica e soma dos três maiores em quatro dados: **5/5 OK**.
- Nenhum uso de `localStorage`/`sessionStorage`: **OK**.
- Nenhum fallback SVG de dados ou símbolo: **OK**.
- Rodapé PERSONAGENS lê a versão do `manifest.json`: **OK**.
- Fluxo FECHAR/VOLTAR AO CHAT presente: **OK**.

## Integridade dos assets

Comparação SHA-256 confirmou cópia byte a byte dos seis PNGs originais fornecidos neste chat para D4, D6, D8, D10, D12 e D20, tanto em Fichas quanto em Chat. O símbolo de carregamento, os cinco tokens e as cinco artes de corpo inteiro também foram comparados com os arquivos enviados e passaram.

## Fontes — QA privado

Os arquivos de QA carregaram Girassol e Arpona como webfonts reais. Os WOFF2 usados no QA foram validados com FontTools e possuem tabelas/glyphs legíveis. `fonts.css` não usa `local()`. A declaração de pesos foi separada em 300/400/500/600/700/800/900 para evitar seleção inconsistente de peso em navegadores diferentes.

## QA visual

Foram revisadas renderizações da Recovery para:

- Alan: 1920, 1366, mobile e landscape.
- Edgar: 1920, 1366 e mobile.
- Eloísa: 1920, 1366 e mobile.
- Kênia: 1920, 1366 e mobile.
- Victor: 1920, 1366 e mobile.
- PERSONAGENS/roster.
- Chat desktop e mobile.

Checklist visual verificado: cabeçalho, grade de Perícias, arte central desktop, ausência da arte no mobile, Atributos, PV/PD, habilidades, botões, efeitos temporários, preloader, roster, resumo do jogador e rodapé.

## Observações de habilidades situacionais

- **Esforço e Suor** e **Conhecimento Técnico** são passivos; os aumentos já estão contabilizados nos dados das fichas.
- **Mentoria** depende da perícia escolhida para ajudar e da interação com o teste de outro personagem; permanece apresentada como regra situacional, sem criar um estado temporário artificial.

## Smoke test do pacote distribuível

Foi feita uma cópia limpa do pacote de release, as fontes foram instaladas a partir dos ZIPs enviados neste chat usando `prepare_fonts.py`, todos os módulos JavaScript passaram em `node --check`, o `manifest.json` foi parseado novamente e todas as referências locais de imagens/fontes foram verificadas. Resultado: **0 referências ausentes**.
