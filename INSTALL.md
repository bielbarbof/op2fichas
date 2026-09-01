# Instalação / atualização — v0.5.1 Recovery

1. Substitua os arquivos do repositório da extensão Fichas pelos deste pacote.
2. Confira `FONT_SETUP.md` antes do deploy.
3. Faça commit/push e aguarde o redeploy do serviço.
4. Manifest de produção previsto: `https://op2fichas.onrender.com/manifest.json`.
5. No Owlbear Rodeo, mantenha o mesmo manifest para atualizar a extensão existente.

## Compatibilidade de estado

A v0.5.1 mantém `com.op2.playtest/state-v1`, IDs de personagens e atribuições da linha anterior. `normalizeRuntimeState` faz a migração/normalização para o schema atual sem resetar PV, PD, Ímpeto ou atribuições válidas.
