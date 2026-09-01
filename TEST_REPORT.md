# TEST REPORT — OP2 Playtest Fichas v0.6.2

## Regressão funcional

- Sintaxe JavaScript de todos os módulos: aprovada.
- Núcleo de estado/permissões, PV/PD, Foco, Avaliação e Ímpeto: **14/14** verificações executadas nesta build.
- Chaves persistentes e schema `state-v1` preservados.

## Verificações específicas da v0.6.2

- Manifest em 0.6.2: aprovado.
- Arte desktop com altura mínima de 830 px: aprovado por inspeção estrutural.
- Portrait passa a seguir o fluxo vertical em desktop e permite scroll: aprovado por inspeção estrutural.
- Regra mobile que remove a arte abaixo de 1120 px preservada: aprovado.
- Girassol e Arpona Light/Regular/Medium/Bold declaradas como webfonts: aprovado.
- Webfonts incorporadas em `fonts.css` sem dependência local: aprovado.
- PV/PD em Arpona Regular: aprovado.
- Texto de apoio em Arpona Light: aprovado.
- D6 em `.82` nas superfícies de Fichas: aprovado.
- PNGs de dados não foram modificados pela correção de escala.
- Nenhum binário proprietário de fonte incluído no pacote distribuível.

## Integridade compartilhada

A bateria estática conjunta Fichas + Chat fechou em **33/33** verificações aprovadas antes do empacotamento.


## FONTES EMBUTIDAS — HOTFIX v0.6.2
Girassol e Arpona (Light, Regular e Bold) estão incorporadas diretamente em `fonts.css` como webfonts WOFF2, derivadas dos assets de fonte fornecidos pelo proprietário. O deploy não depende de fontes instaladas no dispositivo e não requer etapa local de instalação de fontes.
