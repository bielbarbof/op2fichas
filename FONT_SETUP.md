# Fontes da v0.6.0 Definitiva

A interface usa **webfonts servidas pelo próprio deploy**. Ela não depende de `local("Arpona")` nem de fontes instaladas no dispositivo.

Os binários das fontes não fazem parte deste pacote distribuível. Use as suas próprias cópias de `arpona.zip` e `Girassol.zip` antes do deploy:

```bash
python prepare_fonts.py --arpona /caminho/arpona.zip --girassol /caminho/Girassol.zip
```

O script instala, dentro de `assets/fonts/`:

- `arpona-light.otf`
- `arpona-regular.otf`
- `arpona-bold.otf`
- `girassol-regular.ttf`

Depois disso, publique normalmente. O navegador carregará as fontes como assets da extensão em desktop e mobile.

## Hierarquia

- **Girassol**: PERSONAGENS e nomes principais.
- **Arpona Bold**: botões, tags, ribbons, perfil, custos e controles.
- **Arpona Light**: descrições e texto contínuo.
- **Cards/rolagens**: preservam a hierarquia tipográfica aprovada da linha Recovery.
