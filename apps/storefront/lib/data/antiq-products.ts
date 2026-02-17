/**
 * ANTIQ – Suveniruri & Acareturi turistice. 50 produse.
 * section = "antiq" pentru coșul global. Același pattern ca Pizza.
 */

const ANTIQ_IMAGE = "https://i.imgur.com/W5X0s4C.jpeg";

export type AntiqProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
};

export const ANTIQ_PRODUCTS: AntiqProduct[] = [
  // Suveniruri clasice
  { id: "a1", name: "Magnet „Sulina – Capătul Lumii”", description: "Magnet ceramică, design Sulina", price: 8, image: ANTIQ_IMAGE },
  { id: "a2", name: "Magnet Farul Vechi", description: "Magnet Farul Istoric Sulina", price: 8, image: ANTIQ_IMAGE },
  { id: "a3", name: "Magnet Dunărea întâlnește Marea", description: "Magnet Delta Dunării", price: 8, image: ANTIQ_IMAGE },
  { id: "a4", name: "Set 3 magneți retro", description: "Sulina, far, barcă – set complet", price: 20, image: ANTIQ_IMAGE },
  { id: "a5", name: "Magnet metalic gravat", description: "Metal gravat, rezistent", price: 12, image: ANTIQ_IMAGE },
  // Textile
  { id: "a6", name: "Tricou „Jester Sulina”", description: "Bumbac, design exclusiv", price: 45, image: ANTIQ_IMAGE },
  { id: "a7", name: "Tricou „Low Profile – High Mission”", description: "Bumbac, slogan Jester", price: 45, image: ANTIQ_IMAGE },
  { id: "a8", name: "Hanorac Sulina Vintage", description: "Hanorac cu glugă, design retro", price: 85, image: ANTIQ_IMAGE },
  { id: "a9", name: "Șapcă brodată Sulina", description: "Brodată Sulina / Delta", price: 35, image: ANTIQ_IMAGE },
  { id: "a10", name: "Șapcă „Jester”", description: "Șapcă unisex, logo Jester", price: 35, image: ANTIQ_IMAGE },
  { id: "a11", name: "Geantă pânză „Sulina”", description: "Pânză ecologică, imprimat Sulina", price: 55, image: ANTIQ_IMAGE },
  { id: "a12", name: "Prosop plajă Sulina", description: "Prosop plajă, design marinăresc", price: 40, image: ANTIQ_IMAGE },
  { id: "a13", name: "Bandană marinărească", description: "Bandană pattern marinăresc", price: 25, image: ANTIQ_IMAGE },
  { id: "a14", name: "Șosete tematice „Dunărea”", description: "Șosete cu motive Delta", price: 22, image: ANTIQ_IMAGE },
  { id: "a15", name: "Fular marinăresc", description: "Fular ușor, motive nautice", price: 38, image: ANTIQ_IMAGE },
  // Plajă & Vară
  { id: "a16", name: "Ochelari de soare turistici", description: "UV, design Sulina", price: 35, image: ANTIQ_IMAGE },
  { id: "a17", name: "Pălărie de paie", description: "Pălărie plajă, naturală", price: 40, image: ANTIQ_IMAGE },
  { id: "a18", name: "Pălărie pescar", description: "Pălărie pescuit, clasică", price: 45, image: ANTIQ_IMAGE },
  { id: "a19", name: "Set scoici decorative", description: "Scoici naturale, set cadou", price: 28, image: ANTIQ_IMAGE },
  { id: "a20", name: "Mini colac gonflabil decorativ", description: "Colac mic, decorativ", price: 22, image: ANTIQ_IMAGE },
  { id: "a21", name: "Sticlă reutilizabilă Sulina", description: "Sticlă 500ml, print Sulina", price: 25, image: ANTIQ_IMAGE },
  { id: "a22", name: "Brățară de plajă", description: "Brățară silicon, rezistentă apă", price: 15, image: ANTIQ_IMAGE },
  { id: "a23", name: "Set tatuaje temporare maritime", description: "Tatuaje temporare, motive marinărești", price: 12, image: ANTIQ_IMAGE },
  { id: "a24", name: "Evantai turistic", description: "Evantai pliabil, print Delta", price: 18, image: ANTIQ_IMAGE },
  { id: "a25", name: "Mini umbrelă portabilă", description: "Umbrelă pliabilă, compactă", price: 35, image: ANTIQ_IMAGE },
  // Marinăresc & Vintage
  { id: "a26", name: "Mini ancoră decorativă", description: "Ancoră metal decorativ", price: 35, image: ANTIQ_IMAGE },
  { id: "a27", name: "Busolă decorativă", description: "Busolă vintage, decor", price: 42, image: ANTIQ_IMAGE },
  { id: "a28", name: "Harta veche a Sulinei print", description: "Print harta istorică Sulina", price: 30, image: ANTIQ_IMAGE },
  { id: "a29", name: "Poster retro Dunărea 1900", description: "Poster A3, design retro", price: 35, image: ANTIQ_IMAGE },
  { id: "a30", name: "Steag decorativ Sulina", description: "Steag mic, decor perete", price: 28, image: ANTIQ_IMAGE },
  { id: "a31", name: "Model barcă din lemn", description: "Model barcă pescărească", price: 55, image: ANTIQ_IMAGE },
  { id: "a32", name: "Nod marinăresc decorativ", description: "Nod marinăresc pe suport", price: 22, image: ANTIQ_IMAGE },
  { id: "a33", name: "Mini butoi decorativ", description: "Butoi lemn mini, decor", price: 38, image: ANTIQ_IMAGE },
  { id: "a34", name: "Lanterne vintage", description: "Lanterne metal, stil marinăresc", price: 45, image: ANTIQ_IMAGE },
  { id: "a35", name: "Mini far iluminat LED", description: "Far decorativ, LED", price: 48, image: ANTIQ_IMAGE },
  // Artizanat & Obiecte mici
  { id: "a36", name: "Brățară handmade scoici", description: "Brățară scoici naturale", price: 28, image: ANTIQ_IMAGE },
  { id: "a37", name: "Colier marinăresc", description: "Colier scoici / cordon", price: 35, image: ANTIQ_IMAGE },
  { id: "a38", name: "Inel scoică", description: "Inel decorativ scoică", price: 22, image: ANTIQ_IMAGE },
  { id: "a39", name: "Set pahare gravate", description: "2 pahare, gravură Sulina", price: 55, image: ANTIQ_IMAGE },
  { id: "a40", name: "Cană „Jester”", description: "Cană ceramică, logo Jester", price: 35, image: ANTIQ_IMAGE },
  { id: "a41", name: "Cană „Sulina Sunrise”", description: "Cană ceramică, răsărit Sulina", price: 35, image: ANTIQ_IMAGE },
  { id: "a42", name: "Cutie lemn gravată", description: "Cutie lemn, gravură Sulina", price: 45, image: ANTIQ_IMAGE },
  { id: "a43", name: "Semn lemn „Welcome to Sulina”", description: "Placă lemn, decor perete", price: 55, image: ANTIQ_IMAGE },
  { id: "a44", name: "Suport chei marinăresc", description: "Suport chei lemn/metal", price: 28, image: ANTIQ_IMAGE },
  { id: "a45", name: "Suport telefon lemn", description: "Suport telefon lemn gravat", price: 38, image: ANTIQ_IMAGE },
  // Funny / Turistic
  { id: "a46", name: "Sticker „Am supraviețuit Sulinei”", description: "Sticker gluma, Sulina", price: 8, image: ANTIQ_IMAGE },
  { id: "a47", name: "Sticker „Delta Vibes”", description: "Sticker Delta Dunării", price: 8, image: ANTIQ_IMAGE },
  { id: "a48", name: "Plachetă „Low Profile – High Mission”", description: "Plachetă lemn, slogan Jester", price: 25, image: ANTIQ_IMAGE },
  { id: "a49", name: "Carte poștală premium", description: "Carte poștală Sulina, premium", price: 5, image: ANTIQ_IMAGE },
  { id: "a50", name: "Set 5 cărți poștale vintage", description: "5 cărți poștale design retro", price: 18, image: ANTIQ_IMAGE },
];
