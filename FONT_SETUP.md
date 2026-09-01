# Fontes — v0.6.2

A interface usa **webfonts servidas pelo próprio deploy**. Ela não depende de `local("Arpona")` nem de fontes instaladas no dispositivo.

Os binários das fontes não fazem parte deste pacote distribuível. Use suas próprias cópias de `arpona.zip` e `Girassol.zip` antes do deploy:

```bash
python prepare_fonts.py --arpona /caminho/arpona.zip --girassol /caminho/Girassol.zip
```

O script procura as fontes pelo nome do arquivo, independentemente da pasta interna do ZIP, e instala em `assets/fonts/`:

- `arpona-light.otf`
- `arpona-regular.otf`
- `arpona-medium.otf`
- `arpona-bold.otf`
- `girassol-regular.ttf`

## Hierarquia tipográfica

- **Girassol**: grandes títulos editoriais e nomes principais.
- **Arpona Bold**: títulos estruturais, ribbons, labels fortes, tags e ações principais.
- **Arpona Medium**: controles intermediários quando aplicável.
- **Arpona Regular**: valores informativos como PV/PD.
- **Arpona Light**: texto de apoio, descrições e leitura contínua.
- **Cards de rolagem**: preservam a composição tipográfica aprovada da v0.6.1.
