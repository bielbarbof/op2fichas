# Assets — v0.6.2

- `assets/ui/loading-symbol.png`: símbolo ritualístico fornecido neste chat.
- `assets/tokens/*.png`: tokens fornecidos para PERSONAGENS e previews.
- `assets/characters/*.png`: artes de corpo inteiro usadas somente no layout Web/Desktop.
- `assets/dice/d4.png`, `d6.png`, `d8.png`, `d10.png`, `d12.png`, `d20.png`: PNGs-base originais fornecidos.
- `assets/dice/profile/{executor,analista,vigilante}/`: variantes editoriais derivadas dos PNGs originais, preservando geometria e numeral e aplicando somente a cor do perfil.
- `assets/portraits/*.jpg`: referências auxiliares das fichas originais.

## Padronização do D6

O PNG-base do D6 e as variantes coloridas permanecem inalterados. A v0.6.2 aplica somente `transform: scale(.82)` em CSS para corrigir o peso óptico do quadrado em relação a D4, D8, D10, D12 e D20. A regra é global e também alcança as variantes por perfil.

Não há fallback SVG para dados nem para o símbolo ritualístico.
