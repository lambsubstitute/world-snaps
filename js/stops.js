// The 14 stops. Each is one 60 m cell on a 5x3 grid, walked in order
// (snake: row 0 west->east, row 1 east->west, row 2 west->east).
// Local coords: x east, z south, origin = cell centre. Sides: n=-z s=+z e=+x w=-x.
//   inset:  how far the walkable area reaches towards a CLOSED side (default 20)
//   front:  where that side's building fronts sit (default = inset)
//   bands:  what lines a closed side: 'buildings' (default) | 'low' | 'rail' | 'none'
//   spot:   where the celebrity waits; look: the landmark point the selfie frames

export const CELL = 60;

export const STOPS = [
  {
    id: 'budapest', street: 'Andrássy Avenue', city: 'Budapest', landmark: 'Hungarian Parliament',
    celeb: 'Harry Houdini', col: 0, row: 0, style: 'classic', ground: 'cobble', road: true,
    inset: { n: 22 }, bands: { n: 'rail' },
    spot: [0, -15], look: [0, 16, -95],
    line: "Szia, Anya! I escaped from a locked trunk to be here. Selfie?",
    celebLook: {
      skin: '#f1c9a5', hair: { style: 'curls', color: '#2a1f1a', volume: 0.8 },
      top: { style: 'jacket', color: '#1d1d26', inner: '#f4f4f4' }, bottom: { type: 'trousers', color: '#1d1d26' },
      shoes: '#111', extra: 'chains', pose: 'fist',
    },
  },
  {
    id: 'mexico', street: 'The Zócalo', city: 'Mexico City', landmark: 'Metropolitan Cathedral',
    celeb: 'Frida Kahlo', col: 1, row: 0, style: 'colonial', ground: 'plaza', road: false,
    inset: { n: 26 }, bands: { n: 'none' },
    spot: [0, -6], look: [0, 24, -44],
    line: "¡Hola, Anya! Paint me smiling — or just take a selfie!",
    celebLook: {
      skin: '#d9a77c', hair: { style: 'bun', color: '#15110f' }, hat: { type: 'flowercrown' },
      face: { unibrow: true, lipstick: '#b8323f', earrings: '#f2c230' },
      top: { style: 'shirt', color: '#d8343f' }, bottom: { type: 'longskirt', color: '#2f8f5b' },
      shoes: '#4a2a1a', pose: 'wave',
    },
  },
  {
    id: 'paris', street: 'Champs-Élysées', city: 'Paris', landmark: 'Eiffel Tower',
    celeb: 'Édith Piaf', col: 2, row: 0, style: 'haussmann', ground: 'cobble', road: true,
    inset: { n: 22 }, bands: { n: 'rail' },
    spot: [0, -15], look: [0, 36, -85],
    line: "Bonjour, Anya! Non, je ne regrette rien… except no selfie!",
    celebLook: {
      skin: '#f6d6c0', hair: { style: 'curls', color: '#3b2318', volume: 0.75 },
      face: { lipstick: '#c22b3a' },
      top: { style: 'dress', color: '#1a1a22', long: false }, bottom: { type: 'none' },
      shoes: '#111', extra: 'mic', pose: 'wave',
    },
  },
  {
    id: 'london', street: 'Whitehall', city: 'London', landmark: 'Big Ben',
    celeb: 'Freddie Mercury', col: 3, row: 0, style: 'georgian', ground: 'asphalt', road: true,
    inset: { n: 22 }, bands: { n: 'rail' },
    spot: [15, -14], look: [10, 50, -48],
    line: "Anya, darling! Is this the real life? Quick — selfie!",
    celebLook: {
      skin: '#d6a57f', hair: { style: 'slick', color: '#111' }, face: { moustache: true },
      top: { style: 'jacket', color: '#f5d02a', inner: '#ffffff', sleeveless: false },
      bottom: { type: 'trousers', color: '#f4f4f4' }, shoes: '#f4f4f4', extra: 'mic', pose: 'fist',
    },
  },
  {
    id: 'newyork', street: 'Times Square', city: 'New York', landmark: 'Statue of Liberty',
    celeb: 'Frank Sinatra', col: 4, row: 0, style: 'skyscraper', ground: 'asphalt', road: true,
    inset: { e: 22 }, bands: { e: 'rail' },
    spot: [15, 2], look: [90, 30, -10],
    line: "Hey Anya, start spreading the news — you got a selfie with me!",
    celebLook: {
      skin: '#f1cfb0', hair: { style: 'short', color: '#5b4636' }, hat: { type: 'fedora', color: '#4b4f5c' },
      eyeColor: '#3f8fe0',
      top: { style: 'jacket', color: '#262b3d', inner: '#f2f2f2', tie: '#e86a1e' },
      bottom: { type: 'trousers', color: '#262b3d' }, shoes: '#111', pose: 'wave',
    },
  },
  {
    id: 'rome', street: 'Via dei Fori Imperiali', city: 'Rome', landmark: 'Colosseum',
    celeb: 'Sophia Loren', col: 4, row: 1, style: 'roman', ground: 'cobble', road: true,
    inset: { e: 22 }, bands: { e: 'rail' },
    spot: [15, 0], look: [62, 12, 0],
    line: "Ciao bella Anya! The Colosseum is old — but we look fabulous.",
    celebLook: {
      skin: '#e8b98e', hair: { style: 'curls', color: '#2c1a12', volume: 1.25 },
      face: { lipstick: '#c22b3a', lashes: true },
      top: { style: 'dress', color: '#f08a3c', long: true }, bottom: { type: 'none' },
      shoes: '#8a3b1a', pose: 'wave',
    },
  },
  {
    id: 'barcelona', street: 'La Rambla', city: 'Barcelona', landmark: 'Sagrada Família',
    celeb: 'Lionel Messi', col: 3, row: 1, style: 'modernista', ground: 'rambla', road: false,
    gaps: { s: [[-11, 11]] },
    spot: [0, 0], look: [0, 34, 24],
    line: "Hola Anya! I score goals… you score selfies.",
    celebLook: {
      skin: '#eec6a2', hair: { style: 'short', color: '#4a3020' }, face: { beard: '#4a3020' },
      top: { style: 'shirt', color: '#7ec4f0', stripes: '#ffffff' }, bottom: { type: 'shorts', color: '#1a1a1a' },
      shoes: '#e9e9e9', extra: 'ball', pose: 'wave',
    },
  },
  {
    id: 'tokyo', street: 'Shibuya Crossing', city: 'Tokyo', landmark: 'Hachikō and Mount Fuji',
    celeb: 'Hayao Miyazaki', col: 2, row: 1, style: 'neon', ground: 'scramble', road: false,
    bands: { s: 'low' }, lowMul: 0.2,
    spot: [-12, 6], look: [-12, 14, 16],
    line: "Konnichiwa, Anya. Good dog, good mountain, good selfie.",
    celebLook: {
      skin: '#f0cfae', hair: { style: 'short', color: '#e8e8e8' }, face: { glasses: '#1a1a1a', moustache: true, beard: '#d8d8d8', mcolor: '#d8d8d8' },
      top: { style: 'shirt', color: '#d9cdb5', apron: '#8b8f96' }, bottom: { type: 'trousers', color: '#5a5a62' },
      shoes: '#3a2a1e', pose: 'wave',
    },
  },
  {
    id: 'amsterdam', street: 'Prinsengracht', city: 'Amsterdam', landmark: 'The canal houses',
    celeb: 'Vincent van Gogh', col: 1, row: 1, style: 'canal', ground: 'brick', road: false,
    inset: { n: 10 }, front: { n: 20 },
    spot: [0, -5], look: [0, 16, -25],
    line: "Hallo Anya! The light here is perfect. Starry selfie?",
    celebLook: {
      skin: '#efc6a4', hair: { style: 'short', color: '#c8692a' }, face: { beard: '#c8692a' },
      hat: { type: 'straw' },
      top: { style: 'jacket', color: '#2f5fa8', inner: '#e8e0c8' }, bottom: { type: 'trousers', color: '#6b5a3e' },
      shoes: '#3a2a1e', extra: 'brush', pose: 'wave',
    },
  },
  {
    id: 'la', street: 'Hollywood Boulevard', city: 'Los Angeles', landmark: 'The Hollywood Sign',
    celeb: 'Marilyn Monroe', col: 0, row: 1, style: 'hollywood', ground: 'stars', road: true,
    inset: { w: 22 }, bands: { w: 'rail' },
    spot: [-12, 0], look: [-170, 46, 0],
    line: "Hi Anya! Diamonds are a girl's best friend — but selfies are close.",
    celebLook: {
      skin: '#f6d8c4', hair: { style: 'curls', color: '#f4e7b8', volume: 0.85 },
      face: { lipstick: '#d0243a', mole: true, lashes: true },
      top: { style: 'dress', color: '#fbfbf6', long: false }, bottom: { type: 'none' },
      shoes: '#fbfbf6', pose: 'wave',
    },
  },
  {
    id: 'rio', street: 'Copacabana', city: 'Rio de Janeiro', landmark: 'Christ the Redeemer',
    celeb: 'Pelé', col: 0, row: 2, style: 'hollywood', ground: 'wave', road: false,
    inset: { w: 22, s: 27 }, bands: { w: 'rail', s: 'none' },
    spot: [-8, 16], look: [-140, 110, 40],
    line: "Olá, Anya! The beautiful game… and the beautiful selfie!",
    celebLook: {
      skin: '#6b4430', hair: { style: 'short', color: '#111' },
      top: { style: 'shirt', color: '#f7d417', collar: '#1f9a49' }, bottom: { type: 'shorts', color: '#2a4fb0' },
      shoes: '#111', extra: 'ball', pose: 'fist',
    },
  },
  {
    id: 'giza', street: 'The Desert Road', city: 'Giza', landmark: 'The Pyramids and the Sphinx',
    celeb: 'Cleopatra', col: 1, row: 2, style: 'desert', ground: 'sand', road: false,
    inset: { s: 27 }, bands: { s: 'none' },
    spot: [0, 17], look: [0, 26, 100],
    line: "Greetings, Anya. Even a queen needs a selfie with the pyramids.",
    celebLook: {
      skin: '#c99468', hair: { style: 'bob', color: '#0e0c0c' }, hat: { type: 'cleo' },
      face: { lipstick: '#9e2c3a', lashes: true, liner: true },
      top: { style: 'dress', color: '#f6f1e2', long: true, collar: '#e0b23a' }, bottom: { type: 'none' },
      shoes: '#e0b23a', pose: 'wave',
    },
  },
  {
    id: 'agra', street: 'The Riverside Walk', city: 'Agra', landmark: 'Taj Mahal',
    celeb: 'Shah Rukh Khan', col: 2, row: 2, style: 'mughal', ground: 'plaza', road: false,
    inset: { s: 25 }, bands: { s: 'rail' },
    spot: [0, 19], look: [0, 30, 100],
    line: "Anya-ji! Arms wide open — it's selfie time!",
    celebLook: {
      skin: '#c79473', hair: { style: 'curls', color: '#1a1210', volume: 0.95 },
      top: { style: 'jacket', color: '#1c1c22', inner: '#ffffff' }, bottom: { type: 'trousers', color: '#1c1c22' },
      shoes: '#111', pose: 'open',
    },
  },
  {
    id: 'sydney', street: 'Circular Quay', city: 'Sydney', landmark: 'Sydney Opera House',
    celeb: 'Kylie Minogue', col: 3, row: 2, style: 'harbour', ground: 'plaza', road: false,
    inset: { e: 22, s: 22 }, bands: { e: 'rail', s: 'rail' },
    spot: [6, 15], look: [18, 12, 62],
    line: "G'day Anya! I should be so lucky — a selfie with you!",
    celebLook: {
      skin: '#f3d3bb', hair: { style: 'long', color: '#efd27a', wavy: true },
      face: { lipstick: '#d8406a', lashes: true },
      top: { style: 'shirt', color: '#e7c04a', sleeveless: true, shiny: true }, bottom: { type: 'shorts', color: '#e7c04a' },
      shoes: '#e7c04a', extra: 'mic', pose: 'fist',
    },
  },
];

// Anya: placeholder look until the family's photos arrive. Edit freely.
export const ANYA_LOOK = {
  skin: '#f2c6a0', hair: { style: 'long', color: '#5a3825' },
  face: { lipstick: '#e0607e', lashes: true },
  top: { style: 'jacket', color: '#ff6fa8', inner: '#ffffff' }, bottom: { type: 'trousers', color: '#3d5a99' },
  shoes: '#ffffff', extra: 'phone',
};

// Shown when the album is full. The family should rewrite this.
export const ENDING_MESSAGE = {
  title: 'Album complete!',
  body: "Merry Christmas, Anya! You've been pretty much everywhere — and now you've got the selfies to prove it.",
  signoff: 'Love from all of us x',
};
