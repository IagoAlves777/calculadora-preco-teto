# Calculadora de Preço Teto — DCF

Calculadora pessoal para estimar o **preço teto** de ações da bolsa brasileira pelo método de **Fluxo de Caixa Descontado (DCF)**.

O preço teto é o valor máximo que faz sentido pagar por uma ação considerando o crescimento esperado dos lucros da empresa e uma taxa de retorno mínima desejada. Se a ação estiver abaixo desse valor, existe uma margem de segurança no investimento.

---

## Como abrir

Não precisa instalar nada. É só seguir os passos:

1. Clique em **Code → Download ZIP** no topo desta página
2. Extraia o arquivo ZIP em qualquer pasta do seu computador
3. Abra a pasta extraída e dê dois cliques no arquivo **`calculadora-preco-teto.html`**

O arquivo vai abrir direto no seu navegador (Chrome, Firefox, Edge — qualquer um funciona).

> Todas as suas análises ficam salvas automaticamente no navegador. Não é necessário internet depois de abrir o arquivo pela primeira vez.

---

## Como usar

### Criando uma análise

1. Clique em **Nova análise**
2. Digite o ticker da ação no campo do topo (ex: `ITUB4`)
3. Preencha os **lucros líquidos históricos** dos últimos anos — você encontra esse dado no relatório de resultados da empresa ou em sites como Status Invest, Fundamentus ou Yahoo Finance
4. Ajuste as **taxas de crescimento projetadas** para cada ano (o sistema sugere valores com base no histórico)
5. Configure a **taxa de desconto** — é o retorno mínimo que você exige do investimento
6. Informe o número de **ações emitidas** (e ações em tesouraria, se houver) e a **dívida líquida** da empresa
7. Digite o **preço atual** da ação para ver a margem de segurança
8. Clique em **Salvar preço teto** para guardar a análise

### Acompanhando suas análises

Na tela inicial você vê todas as ações salvas com o preço teto calculado, o preço atual informado e se está abaixo ou acima do teto.

Você pode atualizar o preço atual diretamente na tabela a qualquer momento, sem precisar entrar na análise.

---

## Sobre o método

O cálculo usa o modelo de **Fluxo de Caixa Descontado (DCF)** com **Crescimento de Gordon** para o valor terminal (perpetuidade). Em resumo:

- Os lucros futuros são projetados com base nos crescimentos que você define
- Cada lucro projetado é trazido a valor presente pela taxa de desconto
- Ao final, é calculado um valor terminal que representa todos os lucros além do período projetado
- A soma desses valores, dividida pelo número de ações, resulta no valor intrínseco por ação

---

## Observações

- Os dados precisam ser preenchidos manualmente — a calculadora não busca informações automaticamente
- Os resultados são estimativas baseadas nas premissas que você define; pequenas mudanças na taxa de desconto ou crescimento esperado afetam bastante o resultado final
- As análises ficam salvas no armazenamento local do navegador — se você limpar os dados do navegador, as análises serão perdidas
