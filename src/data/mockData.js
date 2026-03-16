export const MOCK_USER = {
  appName: "Mundo Play TV",
  username: "Marcelo123",
  accountStatus: "Ativo",
  expirationDate: "03/04/2026",
  isTrial: "Não",
  activeConnections: 0,
  maxConnections: 1,
  createdAt: "03/03/2026",
};

export const LIVE_TV_CATEGORIES = [
  { id: "all", name: "TODOS OS CANAIS", count: 1118 },
  { id: "fav", name: "FAVORITOS", count: 0 },
  { id: "history", name: "CHANNELS HISTORY", count: 10 },
  { id: "sports", name: "JOGOS DO DIA", count: 3 },
  { id: "bbb", name: "BBB 26", count: 12 },
  { id: "4k", name: "CANAIS 4K", count: 32 },
  { id: "open", name: "ABERTOS", count: 43 },
  { id: "record", name: "RECORD", count: 34 },
  { id: "band", name: "BAND", count: 19 },
  { id: "sbt", name: "SBT", count: 31 },
  { id: "globo_se", name: "GLOBO SUDESTE", count: 59 },
  { id: "globo_co", name: "GLOBO CENTRO-OESTE", count: 16 },
  { id: "globo_sul", name: "GLOBO SUL", count: 34 },
];

export const MOVIE_CATEGORIES = [
  { id: "all", name: "TODOS OS FILMES", count: 21842 },
  { id: "fav", name: "FAVORITOS", count: 0 },
  { id: "recent_keep", name: "RECENTEMENTE CONSERVADO", count: 0 },
  { id: "recent_add", name: "ADICIONADO RECENTEMENTE", count: 30 },
  { id: "diversos", name: "DIVERSOS", count: 1 },
  { id: "xmen", name: "COLETÂNEA | X-MEN", count: 8 },
  { id: "velozes", name: "COLETÂNEA | VELOZES E FURIOSOS", count: 10 },
  { id: "indiana", name: "COLETÂNEA | INDIANA JONES", count: 6 },
  { id: "jean", name: "COLETÂNEA | JEAN-CLAUDE VAN...", count: 8 },
  { id: "jurassic", name: "COLETÂNEA | JURASSIC PARK", count: 2 },
];

export const SERIES_CATEGORIES = [
  { id: "all", name: "TODAS AS SÉRIES", count: 6123 },
  { id: "fav", name: "FAVORITOS", count: 1 },
  { id: "recent_keep", name: "RECENTEMENTE CONSERVADO", count: 2 },
  { id: "recent_add", name: "ADICIONADO RECENTEMENTE", count: 30 },
  { id: "novelas_atuais", name: "NOVELAS | ATUAIS", count: 4 },
  { id: "novelas_globo", name: "NOVELAS | GLOBO", count: 70 },
  { id: "novelas_sbt", name: "NOVELAS | SBT", count: 35 },
  { id: "novelas_record", name: "NOVELAS | RECORD", count: 10 },
  { id: "novelas_brasileiras", name: "NOVELAS | BRASILEIRAS", count: 139 },
  { id: "novelas_gerais", name: "NOVELAS | GERAIS", count: 23 },
];

export const LIVE_TV_CHANNELS = {
  all: [
    {
      id: "1",
      name: "A&E FHD",
      currentProgram: "Polícia Em Ação",
      nextProgram: "Polícia Em Ação",
      epg: [
        "11:15 PM - 11:37 PM  Polícia Em Ação",
        "11:37 PM - 11:58 PM  Polícia Em Ação",
        "11:58 PM - 12:20 AM  Polícia Em Ação",
        "12:20 AM - 12:41 AM  Polícia Em Ação",
      ],
    },
    {
      id: "2",
      name: "A&E HD",
      currentProgram: "Polícia Em Ação",
      nextProgram: "Polícia Em Ação",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "3",
      name: "A&E SD",
      currentProgram: "Polícia Em Ação",
      nextProgram: "Polícia Em Ação",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "4",
      name: "AGRO CANAL HD",
      currentProgram: "Jornal Terraviva",
      nextProgram: "Jornal Terraviva",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "5",
      name: "AGRO+ HD",
      currentProgram: "Jornal Terraviva",
      nextProgram: "Jornal Terraviva",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "6",
      name: "AGROBRASIL TV HD",
      currentProgram: "Nenhum programa encontrado",
      nextProgram: "Nenhum programa encontrado",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "7",
      name: "ALL SPORTS HD",
      currentProgram: "Nenhum programa encontrado",
      nextProgram: "Nenhum programa encontrado",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "8",
      name: "AMAZON SAT",
      currentProgram: "Na Festa.com",
      nextProgram: "Na Festa.com",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "9",
      name: "AMC FHD",
      currentProgram: "Nenhum programa encontrado",
      nextProgram: "Nenhum programa encontrado",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "10",
      name: "AMC HD",
      currentProgram: "Nenhum programa encontrado",
      nextProgram: "Nenhum programa encontrado",
      epg: ["Nenhum programa encontrado"],
    },
  ],
  sports: [
    {
      id: "s1",
      name: "JOGOS DO DIA",
      currentProgram: "Nenhum programa encontrado",
      nextProgram: "Nenhum programa encontrado",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "s2",
      name: "JOGOS DO DIA",
      currentProgram: "Nenhum programa encontrado",
      nextProgram: "Nenhum programa encontrado",
      epg: ["Nenhum programa encontrado"],
    },
    {
      id: "s3",
      name: "LUTAS DO DIA UFC",
      currentProgram: "Nenhum programa encontrado",
      nextProgram: "Nenhum programa encontrado",
      epg: ["Nenhum programa encontrado"],
    },
  ],
};

function makePosterItems(prefix, total = 24) {
  return Array.from({ length: total }).map((_, i) => ({
    id: `${prefix}-${i + 1}`,
    title: `${prefix} ${i + 1}`,
    year: 2026,
    rating: (5 + (i % 5) + Math.random()).toFixed(1),
    image: `https://picsum.photos/300/420?random=${i + 20}`,
  }));
}

export const MOVIE_POSTERS = {
  all: makePosterItems("Filme"),
  recent_add: makePosterItems("Lançamento"),
  diversos: makePosterItems("Diversos", 12),
  xmen: makePosterItems("X-Men", 8),
  velozes: makePosterItems("Velozes", 10),
  indiana: makePosterItems("Indiana Jones", 6),
  jean: makePosterItems("Jean-Claude", 8),
  jurassic: makePosterItems("Jurassic Park", 6),
};

export const SERIES_POSTERS = {
  all: makePosterItems("Série"),
  recent_add: makePosterItems("Série Nova", 20),
  novelas_atuais: makePosterItems("Novela Atual", 8),
  novelas_globo: makePosterItems("Novela Globo", 16),
  novelas_sbt: makePosterItems("Novela SBT", 14),
  novelas_record: makePosterItems("Novela Record", 10),
  novelas_brasileiras: makePosterItems("Novela Brasileira", 18),
  novelas_gerais: makePosterItems("Novela Geral", 16),
};
