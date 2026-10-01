export interface CantinaSong {
  code: string; // e.g. "001", "002"
  title: string;
  artist: string;
  videoId: string;
  duration?: string;
  genre?: string;
}

export interface CantinaArtistCard {
  id: string;
  name: string;
  genre: string;
  image: string;
  songs: CantinaSong[];
}

export const CANTINA_ARTIST_CARDS: CantinaArtistCard[] = [
  // 1: VICENTE FERNANDEZ (RANCHERAS)
  {
    id: 'vicente_fernandez',
    name: 'VICENTE FERNANDEZ',
    genre: 'Rancheras',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '001', title: 'Mujeres divinas', artist: 'Vicente Fernández', videoId: '544X2PIxCIc', genre: 'Rancheras' },
      { code: '002', title: 'El Arracadas', artist: 'Vicente Fernández', videoId: '_p-W0icDaSY', genre: 'Rancheras' },
      { code: '003', title: 'Aca entre nos', artist: 'Vicente Fernández', videoId: 'yv7qK42oZ8Q', genre: 'Rancheras' },
      { code: '004', title: 'Perdon', artist: 'Vicente Fernández', videoId: 'ZKGINqq8Pb0', genre: 'Rancheras' },
      { code: '005', title: 'El Ayudante', artist: 'Vicente Fernández', videoId: '544X2PIxCIc', genre: 'Rancheras' },
      { code: '006', title: 'La penca', artist: 'Vicente Fernández', videoId: 'yv7qK42oZ8Q', genre: 'Rancheras' },
      { code: '007', title: 'Volver volver', artist: 'Vicente Fernández', videoId: 'yv7qK42oZ8Q', genre: 'Rancheras' },
    ],
  },

  // 2: JUANES (POP / ROCK)
  {
    id: 'juanes',
    name: 'JUANES',
    genre: 'Pop / Rock',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '015', title: 'La camisa negra', artist: 'Juanes', videoId: 'kRt2SJL266I', genre: 'Pop / Rock' },
      { code: '016', title: 'Rosario tijeras', artist: 'Juanes', videoId: 'kRt2SJL266I', genre: 'Pop / Rock' },
      { code: '017', title: 'Volverte a ver', artist: 'Juanes', videoId: 'kRt2SJL266I', genre: 'Pop / Rock' },
      { code: '018', title: 'La paga', artist: 'Juanes', videoId: 'kRt2SJL266I', genre: 'Pop / Rock' },
      { code: '019', title: 'Luna', artist: 'Juanes', videoId: 'kRt2SJL266I', genre: 'Pop / Rock' },
      { code: '020', title: 'Tu fotografia', artist: 'Juanes', videoId: 'kRt2SJL266I', genre: 'Pop / Rock' },
      { code: '021', title: 'Es por ti', artist: 'Juanes', videoId: 'kRt2SJL266I', genre: 'Pop / Rock' },
    ],
  },

  // 3: DON OMAR (URBANO)
  {
    id: 'don_omar',
    name: 'DON OMAR',
    genre: 'Urbano',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '008', title: 'Cuentale', artist: 'Don Omar', videoId: '7zp1TbLFPp8', genre: 'Urbano' },
      { code: '009', title: 'Pobre diabla', artist: 'Don Omar', videoId: '7zp1TbLFPp8', genre: 'Urbano' },
      { code: '010', title: 'Ven sueltame', artist: 'Don Omar', videoId: '7zp1TbLFPp8', genre: 'Urbano' },
      { code: '011', title: 'Carta a un amigo', artist: 'Don Omar', videoId: '7zp1TbLFPp8', genre: 'Urbano' },
      { code: '012', title: 'Salvaje', artist: 'Don Omar', videoId: '7zp1TbLFPp8', genre: 'Urbano' },
      { code: '013', title: 'La lenta', artist: 'Don Omar', videoId: '7zp1TbLFPp8', genre: 'Urbano' },
      { code: '014', title: 'Provocandome', artist: 'Don Omar', videoId: '7zp1TbLFPp8', genre: 'Urbano' },
    ],
  },

  // 4: TIGRES DEL NORTE (NORTEÑO)
  {
    id: 'tigres_del_norte',
    name: 'TIGRES DEL NORTE',
    genre: 'Norteño',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '022', title: 'Compañera', artist: 'Tigres del Norte', videoId: 'O2_k8rD3q4A', genre: 'Norteño' },
      { code: '023', title: 'Mi buena suerte', artist: 'Tigres del Norte', videoId: 'O2_k8rD3q4A', genre: 'Norteño' },
      { code: '024', title: 'El celular', artist: 'Tigres del Norte', videoId: 'O2_k8rD3q4A', genre: 'Norteño' },
      { code: '025', title: 'La dieta', artist: 'Tigres del Norte', videoId: 'O2_k8rD3q4A', genre: 'Norteño' },
      { code: '026', title: 'Orgullo maldito', artist: 'Tigres del Norte', videoId: 'O2_k8rD3q4A', genre: 'Norteño' },
      { code: '027', title: 'El ejemplo', artist: 'Tigres del Norte', videoId: 'O2_k8rD3q4A', genre: 'Norteño' },
      { code: '028', title: 'La sorpresa', artist: 'Tigres del Norte', videoId: 'O2_k8rD3q4A', genre: 'Norteño' },
    ],
  },

  // 5: QUEEN (OLDIES & CLÁSICOS EN INGLÉS)
  {
    id: 'queen',
    name: 'QUEEN',
    genre: 'Oldies & Inglés',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '141', title: 'Bohemian Rhapsody', artist: 'Queen', videoId: 'fJ9rUzIMcZQ', genre: 'Oldies & Inglés' },
      { code: '142', title: 'Don\'t Stop Me Now', artist: 'Queen', videoId: 'HgzGwKwLmgM', genre: 'Oldies & Inglés' },
      { code: '143', title: 'We Will Rock You', artist: 'Queen', videoId: '-tJYN-eG1zk', genre: 'Oldies & Inglés' },
      { code: '144', title: 'I Want to Break Free', artist: 'Queen', videoId: 'f4Mc-NY53H8', genre: 'Oldies & Inglés' },
      { code: '145', title: 'Another One Bites the Dust', artist: 'Queen', videoId: 'rY0WxgSXdEE', genre: 'Oldies & Inglés' },
      { code: '146', title: 'Somebody to Love', artist: 'Queen', videoId: 'kijpcUv-b8M', genre: 'Oldies & Inglés' },
      { code: '147', title: 'Radio Ga Ga', artist: 'Queen', videoId: 'azdwsXLmrHE', genre: 'Oldies & Inglés' },
    ],
  },

  // 6: THE BEATLES (OLDIES & CLÁSICOS EN INGLÉS)
  {
    id: 'the_beatles',
    name: 'THE BEATLES',
    genre: 'Oldies & Inglés',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '148', title: 'Hey Jude', artist: 'The Beatles', videoId: 'A_MjCqQoLLA', genre: 'Oldies & Inglés' },
      { code: '149', title: 'Let It Be', artist: 'The Beatles', videoId: 'QDYfEBY9NM4', genre: 'Oldies & Inglés' },
      { code: '150', title: 'Twist and Shout', artist: 'The Beatles', videoId: '2RicaUqd9Hg', genre: 'Oldies & Inglés' },
      { code: '151', title: 'Yesterday', artist: 'The Beatles', videoId: 'NrgmdOz227I', genre: 'Oldies & Inglés' },
      { code: '152', title: 'Come Together', artist: 'The Beatles', videoId: '45cYwDMibGo', genre: 'Oldies & Inglés' },
      { code: '153', title: 'Here Comes the Sun', artist: 'The Beatles', videoId: 'KQetemT1sWc', genre: 'Oldies & Inglés' },
      { code: '154', title: 'Help!', artist: 'The Beatles', videoId: '2Q_ZzBGPdqE', genre: 'Oldies & Inglés' },
    ],
  },

  // 7: PAQUITA LA DEL BARRIO (CANCIONES TRISTES & DESPECHO)
  {
    id: 'paquita_barrio',
    name: 'PAQUITA LA DEL BARRIO',
    genre: 'Canciones Tristes',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '155', title: 'Rata de dos patas', artist: 'Paquita la del Barrio', videoId: '544X2PIxCIc', genre: 'Canciones Tristes' },
      { code: '156', title: 'Tres veces te engañé', artist: 'Paquita la del Barrio', videoId: '544X2PIxCIc', genre: 'Canciones Tristes' },
      { code: '157', title: 'Cheque en blanco', artist: 'Paquita la del Barrio', videoId: '544X2PIxCIc', genre: 'Canciones Tristes' },
      { code: '158', title: 'Taco placero', artist: 'Paquita la del Barrio', videoId: '544X2PIxCIc', genre: 'Canciones Tristes' },
      { code: '159', title: 'Me saludas a la tuya', artist: 'Paquita la del Barrio', videoId: '544X2PIxCIc', genre: 'Canciones Tristes' },
      { code: '160', title: 'Pobre pistolita', artist: 'Paquita la del Barrio', videoId: '544X2PIxCIc', genre: 'Canciones Tristes' },
      { code: '161', title: 'Hombres malvados', artist: 'Paquita la del Barrio', videoId: '544X2PIxCIc', genre: 'Canciones Tristes' },
    ],
  },

  // 8: MI BANDA EL MEXICANO & FIESTA (HIMNOS DE LA ALEGRÍA)
  {
    id: 'banda_mexicano',
    name: 'MI BANDA EL MEXICANO',
    genre: 'Himnos de la Alegría',
    image: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '162', title: 'Ramito de violetas', artist: 'Mi Banda El Mexicano', videoId: 'V3291Q9E1lM', genre: 'Himnos de la Alegría' },
      { code: '163', title: 'No bailes de caballito', artist: 'Mi Banda El Mexicano', videoId: 'V3291Q9E1lM', genre: 'Himnos de la Alegría' },
      { code: '164', title: 'Feliz, feliz', artist: 'Mi Banda El Mexicano', videoId: 'V3291Q9E1lM', genre: 'Himnos de la Alegría' },
      { code: '165', title: 'La bota', artist: 'Mi Banda El Mexicano', videoId: 'V3291Q9E1lM', genre: 'Himnos de la Alegría' },
      { code: '166', title: 'Mambo Lupita', artist: 'Mi Banda El Mexicano', videoId: 'V3291Q9E1lM', genre: 'Himnos de la Alegría' },
      { code: '167', title: 'Pelotero a la bola', artist: 'Mi Banda El Mexicano', videoId: 'V3291Q9E1lM', genre: 'Himnos de la Alegría' },
      { code: '168', title: 'Mary la orgullosa', artist: 'Mi Banda El Mexicano', videoId: 'V3291Q9E1lM', genre: 'Himnos de la Alegría' },
    ],
  },

  // 9: MICHAEL JACKSON (OLDIES & INGLÉS)
  {
    id: 'michael_jackson',
    name: 'MICHAEL JACKSON',
    genre: 'Oldies & Inglés',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '169', title: 'Billie Jean', artist: 'Michael Jackson', videoId: 'Zi_XLOBDo_Y', genre: 'Oldies & Inglés' },
      { code: '170', title: 'Beat It', artist: 'Michael Jackson', videoId: 'oRdxUFDoQe0', genre: 'Oldies & Inglés' },
      { code: '171', title: 'Thriller', artist: 'Michael Jackson', videoId: 'sOnqjkJTMaA', genre: 'Oldies & Inglés' },
      { code: '172', title: 'Smooth Criminal', artist: 'Michael Jackson', videoId: 'h_D3VFkatnY', genre: 'Oldies & Inglés' },
      { code: '173', title: 'Bad', artist: 'Michael Jackson', videoId: 'dsUXAEzaC3Q', genre: 'Oldies & Inglés' },
      { code: '174', title: 'Black or White', artist: 'Michael Jackson', videoId: 'F2AitTPI5U0', genre: 'Oldies & Inglés' },
      { code: '175', title: 'Don\'t Stop \'Til You Get Enough', artist: 'Michael Jackson', videoId: 'yURRmWtbTbo', genre: 'Oldies & Inglés' },
    ],
  },

  // 10: PEDRO INFANTE (RANCHERAS)
  {
    id: 'pedro_infante',
    name: 'PEDRO INFANTE',
    genre: 'Rancheras',
    image: 'https://img.youtube.com/vi/uMY71QLyQgI/hqdefault.jpg',
    songs: [
      { code: '029', title: 'Cien años', artist: 'Pedro Infante', videoId: 'uMY71QLyQgI', genre: 'Rancheras' },
      { code: '030', title: 'Amorcito corazón', artist: 'Pedro Infante', videoId: 'f50kHGy0Vgk', genre: 'Rancheras' },
      { code: '031', title: 'Fallaste corazón', artist: 'Pedro Infante', videoId: 'rMGvwWJE8zk', genre: 'Rancheras' },
      { code: '032', title: 'Deja que salga la luna', artist: 'Pedro Infante', videoId: 'f50kHGy0Vgk', genre: 'Rancheras' },
      { code: '033', title: 'Ella', artist: 'Pedro Infante', videoId: 'uMY71QLyQgI', genre: 'Rancheras' },
      { code: '034', title: 'Carta a Eufemia', artist: 'Pedro Infante', videoId: 'rMGvwWJE8zk', genre: 'Rancheras' },
      { code: '035', title: 'Me cansé de rogarle', artist: 'Pedro Infante', videoId: 'uMY71QLyQgI', genre: 'Rancheras' },
    ],
  },

  // 11: LOS ÁNGELES AZULES (CUMBIAS)
  {
    id: 'angeles_azules',
    name: 'ÁNGELES AZULES',
    genre: 'Cumbias',
    image: 'https://img.youtube.com/vi/r8Z4Q7QYqj4/hqdefault.jpg',
    songs: [
      { code: '043', title: '17 Años', artist: 'Los Ángeles Azules', videoId: 'zndvqTc4P9k', genre: 'Cumbias' },
      { code: '044', title: 'El listón de tu pelo', artist: 'Los Ángeles Azules', videoId: 'r8Z4Q7QYqj4', genre: 'Cumbias' },
      { code: '045', title: 'Cómo te voy a olvidar', artist: 'Los Ángeles Azules', videoId: 'r8Z4Q7QYqj4', genre: 'Cumbias' },
      { code: '046', title: 'Mis sentimientos', artist: 'Los Ángeles Azules', videoId: 'zndvqTc4P9k', genre: 'Cumbias' },
      { code: '047', title: 'Entrega de amor', artist: 'Los Ángeles Azules', videoId: 'r8Z4Q7QYqj4', genre: 'Cumbias' },
      { code: '048', title: '20 Rosas', artist: 'Los Ángeles Azules', videoId: 'r8Z4Q7QYqj4', genre: 'Cumbias' },
      { code: '049', title: 'Amigos nada más', artist: 'Los Ángeles Azules', videoId: 'zndvqTc4P9k', genre: 'Cumbias' },
    ],
  },

  // 12: JOSÉ JOSÉ (BALADAS)
  {
    id: 'jose_jose',
    name: 'JOSÉ JOSÉ',
    genre: 'Baladas',
    image: 'https://img.youtube.com/vi/l6Fq1hS6X7o/hqdefault.jpg',
    songs: [
      { code: '050', title: 'El triste', artist: 'José José', videoId: 'l6Fq1hS6X7o', genre: 'Baladas' },
      { code: '051', title: 'Almohada', artist: 'José José', videoId: 'l6Fq1hS6X7o', genre: 'Baladas' },
      { code: '052', title: 'Gavilán o paloma', artist: 'José José', videoId: 'l6Fq1hS6X7o', genre: 'Baladas' },
      { code: '053', title: 'La nave del olvido', artist: 'José José', videoId: 'l6Fq1hS6X7o', genre: 'Baladas' },
      { code: '054', title: '40 y 20', artist: 'José José', videoId: 'l6Fq1hS6X7o', genre: 'Baladas' },
      { code: '055', title: 'Lo dudo', artist: 'José José', videoId: 'l6Fq1hS6X7o', genre: 'Baladas' },
      { code: '056', title: 'Si me dejas ahora', artist: 'José José', videoId: 'l6Fq1hS6X7o', genre: 'Baladas' },
    ],
  },

  // 13: JUAN GABRIEL (RANCHERAS & FIESTA)
  {
    id: 'juan_gabriel',
    name: 'JUAN GABRIEL',
    genre: 'Rancheras',
    image: 'https://img.youtube.com/vi/F7t9bXU29z8/hqdefault.jpg',
    songs: [
      { code: '057', title: 'Querida', artist: 'Juan Gabriel', videoId: 'F7t9bXU29z8', genre: 'Rancheras' },
      { code: '058', title: 'Amor eterno', artist: 'Juan Gabriel', videoId: 'd0uYq3b7tXU', genre: 'Rancheras' },
      { code: '059', title: 'Hasta que te conocí', artist: 'Juan Gabriel', videoId: 'F7t9bXU29z8', genre: 'Rancheras' },
      { code: '060', title: 'No tengo dinero', artist: 'Juan Gabriel', videoId: 'F7t9bXU29z8', genre: 'Rancheras' },
      { code: '061', title: 'Así fue', artist: 'Juan Gabriel', videoId: 'd0uYq3b7tXU', genre: 'Rancheras' },
      { code: '062', title: 'Se me olvidó otra vez', artist: 'Juan Gabriel', videoId: 'F7t9bXU29z8', genre: 'Rancheras' },
      { code: '063', title: 'El Noa Noa', artist: 'Juan Gabriel', videoId: 'F7t9bXU29z8', genre: 'Himnos de la Alegría' },
    ],
  },

  // 14: SELENA (CUMBIAS & HIMNOS)
  {
    id: 'selena',
    name: 'SELENA',
    genre: 'Cumbias',
    image: 'https://img.youtube.com/vi/FvviLwJj1g4/hqdefault.jpg',
    songs: [
      { code: '071', title: 'Como la flor', artist: 'Selena', videoId: 'FvviLwJj1g4', genre: 'Canciones Tristes' },
      { code: '072', title: 'Amor prohibido', artist: 'Selena', videoId: 'FvviLwJj1g4', genre: 'Cumbias' },
      { code: '073', title: 'Bidi Bidi Bom Bom', artist: 'Selena', videoId: 'FvviLwJj1g4', genre: 'Himnos de la Alegría' },
      { code: '074', title: 'No me queda más', artist: 'Selena', videoId: 'FvviLwJj1g4', genre: 'Canciones Tristes' },
      { code: '075', title: 'Si una vez', artist: 'Selena', videoId: 'FvviLwJj1g4', genre: 'Canciones Tristes' },
      { code: '076', title: 'El chico del apto 512', artist: 'Selena', videoId: 'FvviLwJj1g4', genre: 'Cumbias' },
      { code: '077', title: 'Baila esta cumbia', artist: 'Selena', videoId: 'FvviLwJj1g4', genre: 'Himnos de la Alegría' },
    ],
  },

  // 15: SODA STEREO (POP / ROCK)
  {
    id: 'soda_stereo',
    name: 'SODA STEREO',
    genre: 'Pop / Rock',
    image: 'https://img.youtube.com/vi/T_FkEw27XJ0/hqdefault.jpg',
    songs: [
      { code: '078', title: 'De música ligera', artist: 'Soda Stereo', videoId: 'T_FkEw27XJ0', genre: 'Pop / Rock' },
      { code: '079', title: 'Persiana americana', artist: 'Soda Stereo', videoId: 'T_FkEw27XJ0', genre: 'Pop / Rock' },
      { code: '080', title: 'Cuando pase el temblor', artist: 'Soda Stereo', videoId: 'T_FkEw27XJ0', genre: 'Pop / Rock' },
      { code: '081', title: 'Trátame suavemente', artist: 'Soda Stereo', videoId: 'T_FkEw27XJ0', genre: 'Pop / Rock' },
      { code: '082', title: 'En la ciudad de la furia', artist: 'Soda Stereo', videoId: 'T_FkEw27XJ0', genre: 'Pop / Rock' },
      { code: '083', title: 'Signos', artist: 'Soda Stereo', videoId: 'T_FkEw27XJ0', genre: 'Pop / Rock' },
      { code: '084', title: 'Nada personal', artist: 'Soda Stereo', videoId: 'T_FkEw27XJ0', genre: 'Pop / Rock' },
    ],
  },

  // 16: LUIS MIGUEL (BALADAS & BOLEROS)
  {
    id: 'luis_miguel',
    name: 'LUIS MIGUEL',
    genre: 'Baladas',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    songs: [
      { code: '085', title: 'La incondicional', artist: 'Luis Miguel', videoId: 'kRt2SJL266I', genre: 'Canciones Tristes' },
      { code: '086', title: 'Culpable o no', artist: 'Luis Miguel', videoId: 'kRt2SJL266I', genre: 'Canciones Tristes' },
      { code: '087', title: 'Ahora te puedes marchar', artist: 'Luis Miguel', videoId: 'kRt2SJL266I', genre: 'Himnos de la Alegría' },
      { code: '088', title: 'Hasta que me olvides', artist: 'Luis Miguel', videoId: 'kRt2SJL266I', genre: 'Baladas' },
      { code: '089', title: 'Entrégate', artist: 'Luis Miguel', videoId: 'kRt2SJL266I', genre: 'Baladas' },
      { code: '090', title: 'Tengo todo excepto a ti', artist: 'Luis Miguel', videoId: 'kRt2SJL266I', genre: 'Canciones Tristes' },
      { code: '091', title: 'Sabor a mí', artist: 'Luis Miguel', videoId: 'kRt2SJL266I', genre: 'Boleros' },
    ],
  },
];

// Flat catalog for universal search matching
export const CATALOGO_FAMILIAR_DON_RAFA = CANTINA_ARTIST_CARDS.flatMap((card) =>
  card.songs.map((s) => ({
    videoId: s.videoId,
    title: s.title,
    artist: s.artist,
    category: s.genre || 'rancheras',
    code: s.code,
    duration: '3:20',
  }))
);
