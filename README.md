# Matheus & Isadora · Chá de casa nova

Convite em React + Vite + Tailwind CSS, com álbum de 17 fotos com mural de quatro, mosaico e polaroides, página `/presentes` e formulário de presença. Evento: **14/11/2026 às 14h (Brasília)**.

## Executar

Requer Node.js 20.19+.

```sh
npm install
npm run dev
npm run build
npm test
```

`npm run dev` mostra o front-end. Para executar também a função `/api/rsvp` localmente, use `npx vercel dev` com as variáveis do `.env.example` preenchidas em `.env.local`. Sem a API configurada, o formulário exibe indisponibilidade e **não confirma nem salva respostas fictícias**.

## Personalizar

- `src/content.js`: preencha `event.venue` e `event.address`. O botão Google Maps aparece automaticamente quando há endereço.
- No mesmo arquivo, cada presente tem `name`, `description`, `category`, `image` e `url`. Cole o link HTTPS do produto da loja em `url`. Coloque a foto em `public/presentes/` e indique `/presentes/arquivo.webp` em `image`.
- Os 24 presentes enviados pelo casal têm links para Shopee, Mercado Livre, First Class e Zelo, filtros por categoria e preços informados como referência. Os ícones são ilustrativos; preços e disponibilidade não foram verificados nas lojas.
- `public/photos/`: fotos de vocês otimizadas em WebP. Os arquivos já estão incluídos; o script de preparação só é necessário para reimportar os originais locais.
- Textos do convite: `src/main.jsx`. Cores e layout: `src/style.css`.

## Firebase e confirmações

A lista tem 24 cards compactos, filtros e reserva por nome/WhatsApp via `/api/gifts`. A coleção privada `giftReservations` usa o ID do presente como documento e criação atômica para impedir duas reservas do mesmo item. A consulta pública retorna somente IDs reservados, nunca nomes ou telefones. As credenciais do Firebase abaixo também habilitam as reservas. Sem conexão, a interface bloqueia novas reservas e informa indisponibilidade. O status é atualizado a cada 20 segundos e ao voltar à janela. Para cancelar uma reserva a pedido do convidado, o casal pode excluir o documento correspondente no console do Firestore. A compra é realizada separadamente na loja. Validar duas reservas concorrentes no banco conectado antes de publicar.

A integração usa **Firestore Standard, banco `(default)`**, via Firebase Admin em uma função de servidor da Vercel. Nenhum banco foi criado ou conectado nesta entrega. Caso já exista um banco Enterprise, confirme sua configuração antes de conectar.

1. Crie/selecione seu projeto Firebase e um banco Firestore Standard em modo produção. Escolha a região próxima do público e da função.
2. Mantenha o acesso direto de clientes ao Firestore bloqueado (modo produção). Só a função com a conta de serviço deve acessar os dados. A aplicação não precisa de login público nem de regras de escrita abertas.
3. Nas configurações do projeto, obtenha uma conta de serviço com acesso necessário ao Firestore. Adicione na Vercel, em Settings → Environment Variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` e `RSVP_HASH_SECRET` (segredo aleatório de ao menos 32 caracteres). A chave privada aceita quebras de linha reais ou `\n`.
4. Nunca coloque a chave no front-end, em variável `VITE_` ou no GitHub. O `.gitignore` exclui os arquivos `.env`.
5. Faça um novo deploy e teste uma confirmação. Veja as respostas em Firestore → coleção `rsvps`: nome, WhatsApp, presença (`yes`/`no`), total de pessoas, recado e data do envio.

A API valida tipos/tamanhos, impede sobrescrita por WhatsApp, não expõe listagem e limita 10 novos envios por IP por hora com transação. A coleção `rsvpRateLimits` guarda hashes de IP; configure uma política TTL no campo `expiresAt` para limpeza. Alterações de respostas são feitas por vocês no console. Para divulgação ampla, configure proteção antibot/rate limiting adicional na Vercel; o formulário público não prova a identidade do convidado. Exclua os dados pessoais após o evento quando não forem mais necessários.

## GitHub e Vercel

1. Crie um repositório no GitHub e envie este projeto (o diretório ainda não foi inicializado/publicado). Considere um repositório privado para as fotos pessoais.
2. Importe o repositório na Vercel. Framework: **Vite**, build: `npm run build`, pasta: `dist`.
3. Adicione as quatro variáveis de servidor e publique. A Vercel reconhece `api/rsvp.js` como função Node; `vercel.json` permite abrir `/presentes` diretamente.
4. Preencha endereço, fotos e links de presentes antes de compartilhar o convite.

Documentação: [Firebase Admin](https://firebase.google.com/docs/admin/setup), [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Verificações

Os testes cobrem validação, ausência, dados indevidos, métodos HTTP e falta de credenciais. A gravação real e o limite transacional precisam de teste com o Firebase conectado. Nenhuma credencial foi incluída nem houve deploy nesta entrega.

Auditoria de dependências: o alerta alto do processador de fotos foi corrigido atualizando sharp. Restam 8 alertas moderados transitivos na árvore do Firebase Admin; revisar atualizações antes da publicação.
