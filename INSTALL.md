# Instalação / atualização — v0.6.2

1. Extraia este pacote no repositório da extensão Fichas.
2. Antes do deploy, instale suas webfonts conforme `FONT_SETUP.md`.
3. Faça commit/push e aguarde o redeploy do serviço.
4. Manifest de produção previsto: `https://op2fichas.onrender.com/manifest.json`.
5. No Owlbear Rodeo, mantenha o mesmo manifest para atualizar a extensão existente.

## Compatibilidade

A v0.6.2 mantém `com.op2.playtest/state-v1`, os mesmos IDs de personagem e as atribuições existentes. A atualização não reseta PV, PD, Ímpeto, Avaliação, Focos, Prontidão ou atribuições válidas.

## Verificação rápida pós-deploy

- Em notebook/viewport baixa, confirme que a arte desktop mantém presença visual e que os pés são alcançados com scroll.
- Confira que no mobile a arte de corpo inteiro continua ausente.
- Confirme Girassol nos grandes títulos e Arpona nos demais níveis tipográficos.
- Compare D6 com D4/D8/D10/D12/D20 em atributos e perícias.
- Teste `+`/`−` de PV/PD e uma habilidade preparada para confirmar que não houve regressão funcional.
