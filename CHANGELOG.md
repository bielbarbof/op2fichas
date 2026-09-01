# Changelog — v0.6.0 Definitiva

## Acabamento visual

- Arte de corpo inteiro reposicionada abaixo da divisão do cabeçalho nas fichas desktop.
- Traçados decorativos sem função removidos ao redor da arte central e no lado direito dos cards de PERSONAGENS.
- Mobile mantém foco em praticidade e não carrega a arte de corpo inteiro.
- D6 reduzido visualmente para equilibrar a família de dados sem modificar o arquivo original.
- Dados exibidos em atributos e perícias agora usam a cor do perfil do personagem.
- Símbolos mecânicos e dados dentro das descrições/controles das habilidades também usam a cor do perfil.
- Variantes coloridas são derivadas dos PNGs originais e preservam forma e numeral.

## Recursos e habilidades

- Controles `+`/`−` de PV e PD corrigidos para Mestre e jogador autorizado.
- Atualização imediata de barras, números e estado persistido.
- Mutações serializadas para evitar sobrescrita em cliques rápidos.
- Falha de Executor passa pelo fluxo central de resolução e preenche Ímpeto imediatamente, até o máximo de 3.
- Foco Mental e Foco Emocional: cobrança, preparação, restrição ao atributo compatível, consumo e feedback sincronizados.
- Avaliação: dois D4 independentes, preparação individual, consumo na rolagem e atualização do contador sem refresh.
- Prontidão: cobrança única, estado ativo e encerramento sincronizados.

## Rolagens e Chat

- Card de rolagem mostra o ícone do dado antes do valor individual.
- Área de resultado foi reorganizada para melhor alinhamento visual.
- Pequeno respiro adicionado entre horário e botão de exclusão no Chat.
- Tipografia dos cards e do rolador permanece alinhada ao componente aprovado na Recovery.

## Compatibilidade

- Mantidas as chaves de estado e atribuição da linha anterior.
- Base estrutural continua descendendo da v0.4.0 estável; a v0.5.0 rejeitada não foi adotada como fundação.
