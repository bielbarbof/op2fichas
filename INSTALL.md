# Instalação / atualização — v0.6.2

1. Extraia este pacote no repositório da extensão Fichas.
2. As webfonts já estão incorporadas ao pacote; não há etapa de instalação local de fontes.
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


## FONTES EMBUTIDAS — HOTFIX v0.6.2
Girassol e Arpona (Light, Regular e Bold) estão incorporadas diretamente em `fonts.css` como webfonts WOFF2, derivadas dos assets de fonte fornecidos pelo proprietário. O deploy não depende de fontes instaladas no dispositivo e não requer etapa local de instalação de fontes.
