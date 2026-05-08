# Calculadora de Preço Teto — DCF

Calculadora pessoal para estimar o **preço teto** de ações da bolsa brasileira pelo método de **Fluxo de Caixa Descontado (DCF)**.

O preço teto é o valor máximo que faz sentido pagar por uma ação considerando o crescimento esperado dos lucros e uma taxa de retorno mínima desejada. Se a ação estiver abaixo desse valor, existe margem de segurança no investimento.

---

## Stack

- React 19 + TypeScript + Vite
- Chakra UI v3
- TanStack Table v8
- React Router v7

---

## Rodando localmente

```bash
yarn install
yarn dev
```

Acesse `http://localhost:5173`.

---

## Como usar

### Criando uma análise

1. Clique em **Nova análise**
2. Digite o ticker da ação (ex: `ITUB4`)
3. Preencha os **lucros líquidos históricos** dos últimos anos — disponíveis no relatório de resultados da empresa ou em sites como Status Invest, Fundamentus ou Yahoo Finance
4. Ajuste as **taxas de crescimento projetadas** por ano (você pode editar o valor projetado diretamente na tabela)
5. Configure a **taxa de desconto** — retorno mínimo exigido do investimento
6. Informe o número de **ações emitidas**, **ações em tesouraria** e a **dívida líquida**
7. Digite o **preço atual** para ver a margem de segurança em tempo real
8. Clique em **Salvar preço teto** para guardar a análise

### Importando lucros via JSON

No topo da calculadora, o botão **JSON** abre um modal para colar os dados históricos de lucro em formato JSON — útil para importar rapidamente sem digitar um a um.

### Acompanhando suas análises

Na tela inicial você vê todas as ações salvas com o preço teto calculado, o preço atual e a margem de segurança. A tabela suporta:

- **Ordenação** por qualquer coluna (clique no header)
- **Busca** por ticker
- **Paginação** de 10 itens por página

Você pode atualizar o preço atual diretamente na tabela e editar ou excluir qualquer análise pelos botões de ação.

---

## Sobre o método

O cálculo usa o modelo de **Fluxo de Caixa Descontado (DCF)** com **Crescimento de Gordon** para o valor terminal (perpetuidade):

- Os lucros futuros são projetados com base nas taxas que você define
- Cada lucro projetado é trazido a valor presente pela taxa de desconto
- O valor terminal representa todos os lucros além do período projetado (3 ou 5 anos)
- A soma desses valores, descontada a dívida líquida e dividida pelo número de ações, resulta no valor intrínseco por ação

---

## Observações

- Os dados são preenchidos manualmente — a calculadora não busca informações automaticamente
- As análises ficam salvas no `localStorage` do navegador — limpar os dados do navegador apaga as análises
- Esta ferramenta não constitui recomendação de investimentos
