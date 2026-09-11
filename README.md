# Rifa Camargo — Camargo Confeitaria

Site de rifa online criado para dar um empurrão na marca da **Camargo Confeitaria**: uma vitrine bonita, doce (literalmente) e prática para vender números, controlar pagamentos e deixar todo mundo sabendo exatamente qual número já tem dono.

## Por que existe

A ideia nasceu de um projeto a dois: minha namorada tem a confeitaria, e decidimos criar uma rifa para divulgar e alavancar a marca — juntando o útil (movimentar vendas e engajamento) ao agradável (um prêmio doce pra quem participar). Rifa "no grupo de WhatsApp com print de comprovante" vira bagunça rápido: ninguém sabe quais números já foram vendidos, quem pagou e quem só reservou. Este site existe para resolver exatamente isso.

## O que a aplicação faz

- **Grade de 100 números**: mostra em tempo real quais números estão livres, reservados ou pagos, com contadores no topo da página.
- **Busca e filtro**: encontre um número específico ou filtre por status (livres / reservados / pagos).
- **Reserva pelo site**: a pessoa escolhe um ou mais números livres, informa nome e WhatsApp, e escolhe se quer ser atendida por **Lívia** ou **Guilherme** — a reserva fica registrada na hora, direto no painel de gestão.
- **Pagamento via PIX**: QR Code de pagamento exibido para facilitar a confirmação do valor de cada número.
- **Painel de gestão (`/gestao`)**: área autenticada por senha (login em `/login`) onde é possível ver todas as reservas, marcar/desmarcar números como pagos, liberar um número e conferir os dados de contato de cada comprador.
- **Sorteio no Instagram**: o resultado é divulgado no perfil `@camargoconfeitaria_`.

## Como funciona por trás

- **Front-end** estático (HTML/CSS/JS puro, sem framework) — leve e rápido de carregar no celular.
- **API serverless na Vercel** (`/api/reserve`, `/api/raffle`, `/api/login`, `/api/logout`) cuidando de reservas, listagem de status e autenticação do painel.
- **Autenticação do painel** feita com senha (hash + comparação segura) e cookie de sessão assinado (HMAC), sem exposição da senha em texto puro.
- **Armazenamento em Vercel Blob**: cada reserva/pagamento é salvo como um snapshot em JSON no Blob Storage do projeto — não depende de banco de dados externo.

## Stack técnica

- HTML, CSS e JavaScript vanilla
- Vercel Serverless Functions (Node.js)
- `@vercel/blob` para persistência dos dados
- Deploy contínuo na **Vercel**

## Contexto

Projeto pessoal, criado para apoiar a divulgação da **Camargo Confeitaria** através de uma ação de rifa — não é um produto comercial de terceiros, e sim uma ferramenta feita sob medida para a marca.
