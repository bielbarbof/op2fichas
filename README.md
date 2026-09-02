# OP2 Playtest Fichas — v0.6.4

Este é um conteúdo não oficial, publicado sob a Licença da Comunidade de Ordem Paranormal.


Extensão gratuita para Owlbear Rodeo com as fichas dos cinco sobreviventes do Playtest Alpha. Reúne atributos, perícias, PV/PD, habilidades, efeitos temporários e rolagens integradas ao OP2 Playtest Chat.

## Instalação

Hospede o conteúdo desta pasta em HTTPS e cadastre a URL do `manifest.json` no Owlbear Rodeo. Fichas e Chat podem ser instalados separadamente, mas foram projetados para trabalhar em conjunto.

## Uso

O Mestre atribui um sobrevivente a cada jogador. A ficha completa permite acompanhar PV, PD, habilidades, Ímpeto, Avaliação, Prontidão e efeitos preparados. As rolagens de perícia usam atributo + perícia e podem ser enviadas ao Chat.

Fichas e Chat compartilham o mesmo estado persistido da sala do Owlbear para atribuições e recursos de personagem. As chaves de persistência da v0.6.3 foram preservadas, portanto a atualização não exige migração manual.

## Compatibilidade e privacidade

- Desenvolvido para Owlbear Rodeo com SDK 3.1.0.
- O SDK é carregado pelo endereço público `esm.unpkg.com`; é necessária conexão de rede para esse carregamento.
- O código da extensão não vende nem envia PV, PD, atribuições ou histórico para um serviço próprio; o estado compartilhado permanece no ambiente da sala do Owlbear.

## Créditos e licença

Ferramenta comunitária gratuita baseada no Playtest Alpha. Ordem Paranormal, seus personagens e materiais originais pertencem aos respectivos titulares. Consulte `COMMUNITY_LICENSE.txt` e `THIRD_PARTY_NOTICES.md` antes de redistribuir ou modificar esta extensão.
