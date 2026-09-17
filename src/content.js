export const event = {
  date: '2026-11-14T14:00:00-03:00',
  venue: '',
  address: '', // Preencha com rua, número, bairro, cidade e estado.
};
// Valores informados pelo casal; disponibilidade e preço final são os da loja.
const chosen = [
  ['varal', 'Varal retrátil Bitenfer 120 cm', 'Lavanderia', '7 varetas para cuidar das roupas do nosso lar.', '1AMnwGUkt', 139.56],
  ['puffs', 'Kit 2 puffs mesinha bouclé areia', 'Nosso cantinho', 'Um par aconchegante com tampo liso.', '60RZvM3FYq', 247.29],
  ['protetor', 'Protetor de colchão casal Ultrassonic', 'Nosso cantinho', 'Linha Saúde, sortido — First Class.', 'https://www.firstclass.com.br/pillow-protetor-de-colchao-casal-ultrassonic---saude---sortido/p'],
  ['escorredor-aco', 'Escorredor duplo Utihub', 'Na cozinha', 'Em aço, para pratos e talheres.', '6AkzkKfQQs', 105.17],
  ['marinex', 'Assadeiras Marinex com tampa', 'Na cozinha', 'Conjunto 1576, com 6 peças e tampas cinza.', '9peHrWKxwj', 128.16],
  ['diamond', '6 copos Diamond com borda dourada', 'À mesa', 'Copos de 370 ml para brindar juntos.', '6L4PgkGNJn', 59.99],
  ['porta-frios', 'Porta-frios duplo com base de bambu', 'À mesa', 'Para os nossos cafés da manhã.', '20vQWUMTVR', 77.90],
  ['potes', '12 potes herméticos Electrolux', 'Na cozinha', 'Potes retangulares de plástico cinza.', '6AkzTjPz2k', 94.91],
  ['lixeira', 'Lixeira slim com pedal 5 L', 'Nosso cantinho', 'Fechamento silencioso, preta ou branca.', '8fSKRiRD8Z', 80.66],
  ['gabinete', 'Gabinete multiuso para banheiro', 'Nosso cantinho', 'Duas portas e rodízios para organizar.', '3qN4ddtTHR', 170.90],
  ['faqueiro', 'Faqueiro Tramontina Laguna 36 peças', 'À mesa', 'Talheres de churrasco em aço inox.', 'https://meli.la/2wc9KDb', 179.57],
  ['pressao', 'Panela de pressão Brinox Pressure', 'Na cozinha', '4,2 L, cor Vanilla, compatível com indução.', '4LJ8cmep1M', 179.54],
  ['cesto', 'Cesto de roupa em bambu 72 L', 'Lavanderia', 'Dobrável, forrado e retangular, com 60 cm.', '9KhgF98NLo', 59.97],
  ['assadeiras', 'Conjunto de assadeiras 4 peças', 'Na cozinha', 'Modelos retangulares e redondo com tubo de 21 cm.', '4VcQRCbSeh', 166.16],
  ['cama-bege', 'Jogo de cama casal Elegance bege', 'Nosso cantinho', '400 fios — First Class.', 'https://www.firstclass.com.br/jogo-de-cama--casal-400-fios--elegance---bege/p'],
  ['escorredor-branco', 'Escorredor branco de dois andares', 'Na cozinha', 'Com drenagem e porta-talheres e copos.', '1A0ZTjntk', 139.56],
  ['cafeteira-italiana', 'Cafeteira italiana bege', 'Na cozinha', 'Alumínio; opções de 3, 6 ou 9 xícaras.', '70Jku3MAGX', 64.89, 108],
  ['ferro', 'Ferro Electrolux Efficient ESI10', 'Lavanderia', 'A vapor e a seco, com vapor vertical.', 'AKaCoA8vse', 94.91],
  ['liquidificador', 'Liquidificador Electrolux TriForce', 'Na cozinha', 'EBL1500 cinza, 1500 W, 3,2 L e 15 velocidades.', '4VcPrGqyYY', 170.91],
  ['galheteiro', 'Galheteiro de porcelana', 'À mesa', 'Com tampa de rolha, para azeite ou vinagre.', '2BEV4l5igT', 79.90],
  ['lavanderia', 'Kit lavanderia Flow 7 peças', 'Lavanderia', 'Potes, cesto e borrifadores.', 'AKaCnajP7p', 243],
  ['sanduicheira', 'Sanduicheira Cadence SAN400', 'Na cozinha', 'Elétrica, 750 W, na cor preta.', '3B72EZUsdy', 97.47],
  ['cama-verde', 'Jogo de cama casal Elegance verde', 'Nosso cantinho', '400 fios — First Class.', 'https://www.firstclass.com.br/jogo-de-cama--casal-400-fios--elegance---verde-13-5305/p'],
  ['banho', 'Jogo de banho Karsten Provence', 'Nosso cantinho', 'Conjunto com 5 peças — Zelo.', 'https://www.zelo.com.br/jogo-de-banho-karsten-provence-5-pecas-p1012216?pp=/44.5640/'],
];
export const gifts = chosen.map(([id, name, category, description, link, price, maxPrice]) => ({
  id, name, category, description, price, maxPrice, image: '',
  url: link.startsWith('https://') ? link : `https://s.shopee.com.br/${link}?share_channel_code=1`,
  store: link.includes('firstclass') ? 'First Class' : link.includes('zelo.com') ? 'Zelo' : link.includes('meli.la') ? 'Mercado Livre' : 'Shopee',
  icon: category === 'À mesa' ? 'glass' : category === 'Na cozinha' ? 'pot' : category === 'Lavanderia' ? 'towels' : 'bed',
}));
export const photos = [
  ['12', 'O melhor abraço é o seu.'], ['13', 'Celebrando a vida ao seu lado.'],
  ['14', 'Sorrisos que dizem tudo.'], ['15', 'Felicidade nas coisas simples.'],
  ['16', 'Você ilumina os meus dias.'], ['17', 'Juntos, em qualquer paisagem.'],
  ['07', 'Nós dois e um mundo de possibilidades.'], ['04', 'O melhor lugar é ao seu lado.'],
  ['01', 'Construindo a nossa história.'], ['11', 'Mais uma lembrança para guardar.'],
  ['08', 'A felicidade mora nos detalhes.'], ['09', 'Leveza para os nossos dias.'],
  ['02', 'Amor em cada cantinho.'], ['03', 'Juntos, a vista fica ainda melhor.'],
  ['05', 'Nossa coleção de bons momentos.'], ['06', 'Passo a passo, lado a lado.'], ['10', 'Que venham os próximos capítulos.'],
];
