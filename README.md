# Rifa Camargo — Camargo Confeitaria

Site de rifa online criado para dar um empurrão na marca da **Camargo Confeitaria**: uma vitrine bonita, doce (literalmente) e prática para vender números, acompanhar pagamentos e deixar todo mundo sabendo exatamente qual número já tem dono.

## Por que existe

A ideia nasceu de um projeto a dois: minha namorada tem a confeitaria, e decidimos criar uma rifa para divulgar e alavancar a marca — juntando o útil (movimentar vendas e engajamento) ao agradável (um prêmio doce pra quem participar). Só que rifa "no grupo de WhatsApp com print de comprovante" vira bagunça rápido: ninguém sabe quais números já foram vendidos, quem pagou e quem só reservou. Este site existe para resolver exatamente isso, com registro claro de cada número, do interessado e da confirmação do pagamento.

## O que a aplicação faz

- **Grade de números da rifa**: exibe os números disponíveis para participação, com identificação visual de quais já estão reservados e quais já foram pagos.
- **Busca rápida**: permite localizar um número específico ou pelo nome de quem já reservou, direto na grade.
- **Registro de participante por número**: cada número reservado guarda nome e telefone de contato de quem escolheu, para acompanhamento pela confeitaria.
- **Confirmação de pagamento**: sinalização clara de status "pago" x "reservado, aguardando pagamento", para validar rapidamente quem já concluiu a compra do número.
- **Identidade visual própria**: página com a marca "Rifa doce" da Camargo Confeitaria, prêmio em destaque e visual pensado para ser compartilhado nas redes sociais e no WhatsApp.

## Status atual

O controle de pagamentos já é feito manualmente por nós (eu e minha namorada): quem reserva um número precisa nos enviar o comprovante diretamente, e a confirmação de "pago" é atualizada a partir disso. Foi uma escolha consciente não implementar um checkout de pagamento integrado ao site — para o volume de uma rifa entre conhecidos, isso seria complexidade desnecessária.

O que ainda falta amarrar é o próprio direcionamento do comprovante pelo site: hoje não existe, na página, um caminho claro (ex.: um botão/link de WhatsApp) para a pessoa nos enviar o comprovante depois de escolher o número — esse é o próximo ajuste do projeto.

## Stack técnica

- **Next.js** + **React 19**
- **Tailwind CSS** + componentes baseados em **shadcn/ui**
- Deploy contínuo na **Vercel**

## Contexto

Projeto pessoal, criado para apoiar a divulgação da **Camargo Confeitaria** através de uma ação de rifa — não é um produto comercial de terceiros, e sim uma ferramenta feita sob medida para a marca.
