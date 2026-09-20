# Matheus & Isadora · Chá de casa nova

React + Vite, Firebase Hosting, Firestore Standard `(default)` e autenticação anônima. Não usa Vercel, Admin SDK, Cloud Functions ou chave privada. Fotos são arquivos do Hosting, sem Cloud Storage.

## Configurar

1. No Firebase, registre um app Web. Copie `.env.example` para `.env.local` e preencha os quatro valores públicos do `firebaseConfig`.
2. Em Authentication → Método de login, habilite **Anônimo**. Não é necessário cadastrar senha nem exibir login aos convidados.
3. Confirme o projeto em `.firebaserc` (atual: `isadora-e-matheus`) e o banco Standard `(default)`.
4. Instale dependências com `npm install`. Rode `npm run dev` ou `npm run build`.
5. Faça login usando `firebase login` e publique com `firebase deploy --only firestore:rules,hosting --project isadora-e-matheus`. O predeploy do Hosting gera o build. Não rode `firebase init` sobre a configuração existente.

O plano Spark pode atender dentro das cotas de Hosting, Firestore e Authentication. Ao esgotar cotas, operações podem ficar indisponíveis. Não é garantia de disponibilidade ilimitada. Não ative Blaze ou App Hosting para esta arquitetura.

## Dados e regras

- `giftStatus/{giftId}`: apenas `reserved: true` e data. A lista acompanha mudanças em tempo real com uma consulta limitada a 24 documentos. Nenhum nome, telefone ou UID aparece nessa coleção.
- `giftReservations/{giftId}`: nome, WhatsApp, UID e data, acessíveis ao casal pelo Console. Visitantes não podem ler esses documentos.
- A reserva cria status e dados privados em um único lote. As regras exigem os dois, ID válido, campos e tipos esperados. Atualizações e exclusões por clientes são negadas; duas reservas concorrentes não podem sobrescrever o mesmo item.
- `rsvps/{uid}`: uma confirmação por identidade anônima, com nome/telefone/participantes/recado. O visitante pode consultar seu documento; não pode listar os de outras pessoas, alterar ou excluir.
- Para cancelar uma reserva, o casal deve apagar **os dois documentos com o mesmo ID**, em `giftStatus` e `giftReservations`, pelo Console. Apagar somente um mantém o item bloqueado. Para corrigir presença, editar pelo Console.
- Ao adicionar/remover produtos em `src/content.js`, atualize a lista de IDs em `firestore.rules` e o limite da consulta/regras caso ultrapasse 24 itens.

Autenticação anônima identifica uma sessão, não comprova identidade humana nem propriedade do telefone. Trocar navegador/limpar dados permite nova identidade. Não há mais bloqueio por IP nem deduplicação privada pelo telefone do backend anterior; visitantes mal-intencionados podem criar sessões e consumir cotas. Avalie App Check e validações adicionais antes de divulgar amplamente.

As regras são um protótipo a revisar antes de ampla divulgação. Os testes locais cobrem concorrência, isolamento de dados pessoais, acesso sem autenticação, adulteração de schemas, documentos órfãos, escrita repetida e limites dos formulários.

## Testes

- `npm test`: validação dos formulários e catálogo.
- `npm run test:rules`: inicia Firestore Emulator no projeto fictício `demo-matheus-isadora`, compila e testa as regras sem tocar o banco real. Requer Java 17 para a CLI local 14.
- `npm run build`: compilação de produção.

Depois da publicação, testar presença e reserva em dois navegadores e `/presentes` por acesso direto. Não considerar Auth validado apenas por um build bem-sucedido.

## Personalizar

`src/content.js`: encontro, presentes, lojas, valores de referência e fotos. `src/style.css`: layout. `public/photos`: 17 fotos em WebP. Endereço do encontro ainda precisa ser preenchido.
