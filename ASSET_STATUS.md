# Assets — v0.6.1 Definitiva

- `assets/ui/loading-symbol.png`: símbolo ritualístico fornecido neste chat.
- `assets/tokens/*.png`: tokens fornecidos para PERSONAGENS e resumo do jogador.
- `assets/characters/*.png`: artes de corpo inteiro usadas somente no layout desktop.
- `assets/dice/d4.png`, `d6.png`, `d8.png`, `d10.png`, `d12.png`, `d20.png`: cópias byte a byte dos PNGs originais fornecidos.
- `assets/dice/profile/{executor,analista,vigilante}/`: variantes editoriais derivadas dos PNGs originais, preservando geometria e numeral e aplicando somente a cor do perfil.
- `assets/portraits/*.jpg`: referências auxiliares das fichas originais.

## Padronização do D6

O PNG-base do D6 permanece byte a byte igual ao arquivo original. A v0.6.1 aplica apenas `transform: scale(.9)` em CSS para corrigir a percepção de tamanho e equilibrá-lo visualmente com D4, D8, D10, D12 e D20. A mesma regra é usada nas superfícies do ecossistema.

Não há fallback SVG para dados nem para o símbolo ritualístico.
