# Instalação / atualização — v0.6.0 Definitiva

1. Extraia este pacote no repositório da extensão Fichas.
2. Antes do deploy, instale suas webfonts conforme `FONT_SETUP.md`.
3. Faça commit/push e aguarde o redeploy do serviço.
4. Manifest de produção previsto: `https://op2fichas.onrender.com/manifest.json`.
5. No Owlbear Rodeo, mantenha o mesmo manifest para atualizar a extensão existente.

## Atualização a partir da Recovery

A v0.6.0 mantém `com.op2.playtest/state-v1`, os mesmos IDs de personagem e as atribuições existentes. `normalizeRuntimeState` normaliza o schema atual sem resetar PV, PD, Ímpeto ou atribuições válidas.

## Verificação rápida pós-deploy

- Abra PERSONAGENS como Mestre e confira os cinco sobreviventes.
- Abra uma ficha e teste `+` e `−` de PV/PD.
- Faça uma falha com Alan/Edgar e confirme o preenchimento do Ímpeto.
- Ative Avaliação em Eloísa/Kênia, prepare um D4 e confirme o consumo após a rolagem.
- Confira que no mobile a arte de corpo inteiro não é carregada.
