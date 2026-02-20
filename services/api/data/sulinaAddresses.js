/**
 * Adrese livrabile – doar Sulina (oraș + Plaja Sulina).
 * Sulina are 6 străzi mari (paralele I–VI) = principale; restul = adiacente.
 */
const SPECIAL_ADDRESSES = ['Plaja Sulina'];

/** Cele 6 străzi principale (I–VI), cele mari. */
const STREETS_MAIN = ['I', 'a II-a', 'a III-a', 'a IV-a', 'a V-a', 'a VI-a'];

/** Străzi adiacente – restul străzilor din Sulina. */
const STREETS_ADJACENT = [
  'Principală',
  '1 Decembrie',
  'Dunării',
  'Farului',
  'Portului',
  'Canalului',
  'Pescarilor',
  'Delta',
  'Marinărilor',
  'Independenței',
  'Libertății',
  'Republicii',
  'Nufărul',
  'Pelicanului',
  'Tudor Vladimirescu',
  'Mihai Eminescu',
  'Ion Creangă',
  'Mihail Kogălniceanu',
  '3',
  'Aleea Tineretului',
];

/** Toate străzile (pentru validare și sugestii numere). */
const STREET_NAMES = [...STREETS_MAIN, ...STREETS_ADJACENT];

/** Alei – folosit doar pentru formatare (Aleea X, nu Str. X). */
const STREETS_ALEEA = ['Aleea Tineretului'];

/** Adrese adăugate de clienți (nu sunt în listă) – acceptate la validare și apoi apar în sugestii. */
const learnedAddresses = new Set();

const MAX_SUGGESTIONS = 50;
/** Câte numere generăm ca sugestie per stradă; utilizatorul poate completa orice alt număr – e acceptat la validare. */
const NUMBERS_SUGGESTED_PER_STREET = 50;

function normalize(s) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

/** Cifre pentru străzile paralele I–VI: "1"→I, "2"→a II-a, ... */
const PARALLEL_BY_DIGIT = { '1': 'I', '2': 'a II-a', '3': 'a III-a', '4': 'a IV-a', '5': 'a V-a', '6': 'a VI-a' };

function streetMatchesQuery(streetName, q) {
  if (!q) return true;
  const sn = normalize(streetName).toLowerCase();
  if (sn.includes(q)) return true;
  const fullLabel = normalize(formatStreetLabel(streetName)).toLowerCase();
  if (fullLabel.includes(q)) return true;
  const qClean = q.replace(/^str\.?\s*/, '').trim();
  const digitMatch = PARALLEL_BY_DIGIT[qClean];
  if (digitMatch && normalize(streetName).toLowerCase() === normalize(digitMatch).toLowerCase()) return true;
  return false;
}

const SPECIAL_NORMALIZED = new Set(SPECIAL_ADDRESSES.map((a) => normalize(a).toLowerCase()));
const STREET_NAMES_NORMALIZED = new Set(STREET_NAMES.map((s) => normalize(s).toLowerCase()));

/** Formatează eticheta stradă pentru sugestie: "Str. X, Sulina" sau "Aleea X, Sulina". */
function formatStreetLabel(streetName) {
  if (STREETS_ALEEA.some((a) => normalize(a).toLowerCase() === normalize(streetName).toLowerCase())) {
    return `${streetName}, Sulina`;
  }
  return `Str. ${streetName}, Sulina`;
}

/**
 * Verifică dacă o adresă e validă în Sulina.
 * Acceptă: listă cunoscută + orice adresă care conține Sulina (adresă nouă – o memorăm).
 */
function isValidSulinaAddress(address) {
  const raw = normalize(address);
  const a = raw.toLowerCase();
  if (!raw || raw.length < 5) return false;
  if (SPECIAL_NORMALIZED.has(a)) return true;
  // Str. X sau Str X (cu sau fără punct)
  const strMatch = a.match(/str\.?\s*(.+?)\s*(?:,\s*sulina|$)/);
  if (strMatch) {
    let streetPart = normalize(strMatch[1]).replace(/\s*nr\.\s*\d+.*$/i, '').trim();
    if (PARALLEL_BY_DIGIT[streetPart]) streetPart = PARALLEL_BY_DIGIT[streetPart];
    if (STREET_NAMES_NORMALIZED.has(streetPart.toLowerCase())) return true;
  }
  const aleeaMatch = a.match(/aleea\s*(.+?)\s*(?:,\s*sulina|$)/);
  if (aleeaMatch) {
    const aleeaPart = normalize('Aleea ' + aleeaMatch[1]).replace(/\s*nr\.\s*\d+.*$/i, '').trim();
    if (STREET_NAMES_NORMALIZED.has(aleeaPart.toLowerCase())) return true;
  }
  if (learnedAddresses.has(normalize(raw))) return true;
  // Adresă nouă: conține Sulina și e suficient de lungă – o acceptăm și o memorăm
  if (a.includes('sulina') && raw.length >= 8) {
    learnedAddresses.add(normalize(raw));
    return true;
  }
  return false;
}

/** Query pare căutare stradă: "str", "str. 2", "1", "2", ... "6". */
function isStreetSearch(q) {
  if (!q) return true;
  if (/^[1-6]\s*$/.test(q)) return true;
  if (/^str\.?\s*[1-6]?\s*$/i.test(q)) return true;
  if (q === 'strada' || q === 'str' || q === 'str.') return true;
  if (q.length <= 3 && /str|strada/i.test(q)) return true;
  return false;
}

/**
 * Căutare: doar străzi. Când user caută str. 1–6 (str, str. 2, 1, 2...) apar mereu toate cele 6 principale, apoi adiacente.
 */
function search(query) {
  const q = normalize(query).toLowerCase();
  const results = [];
  const showAllSix = !q || isStreetSearch(q);

  for (const addr of SPECIAL_ADDRESSES) {
    if (!q || normalize(addr).toLowerCase().includes(q)) results.push(addr);
    if (results.length >= MAX_SUGGESTIONS) return results.slice(0, MAX_SUGGESTIONS);
  }

  // 1) Cele 6 străzi principale – mereu toate când se caută "str" / "str. 2" / "1" etc.
  for (const street of STREETS_MAIN) {
    if (!showAllSix && !streetMatchesQuery(street, q)) continue;
    results.push(formatStreetLabel(street));
  }
  if (results.length >= MAX_SUGGESTIONS) return results.slice(0, MAX_SUGGESTIONS);

  // 2) Străzi adiacente
  for (const street of STREETS_ADJACENT) {
    if (q && !streetMatchesQuery(street, q)) continue;
    results.push(formatStreetLabel(street));
    if (results.length >= MAX_SUGGESTIONS) break;
  }
  if (results.length >= MAX_SUGGESTIONS) return results.slice(0, MAX_SUGGESTIONS);

  // 3) Adrese învățate
  for (const addr of learnedAddresses) {
    if (q && !addr.toLowerCase().includes(q)) continue;
    results.push(addr);
    if (results.length >= MAX_SUGGESTIONS) break;
  }

  return results.slice(0, MAX_SUGGESTIONS);
}

/**
 * Sugestii de numere pentru o stradă aleasă (ex: "Str. 1 Decembrie, Sulina" sau "Aleea Tineretului, Sulina").
 * Returnează adrese complete. Clientul poate alege din listă sau completa manual orice număr.
 */
function getNumberSuggestions(streetAddress) {
  const s = normalize(String(streetAddress || '')).toLowerCase();
  if (SPECIAL_NORMALIZED.has(s)) return [];
  const strMatch = s.match(/str\.\s*(.+?)\s*,\s*sulina\s*$/);
  const aleeaMatch = s.match(/aleea\s*(.+?)\s*,\s*sulina\s*$/);
  let streetPart;
  if (strMatch) streetPart = normalize(strMatch[1]).replace(/\s*nr\.\s*\d+.*$/i, '').trim();
  else if (aleeaMatch) streetPart = normalize('Aleea ' + aleeaMatch[1]).replace(/\s*nr\.\s*\d+.*$/i, '').trim();
  else return [];
  if (PARALLEL_BY_DIGIT[streetPart]) streetPart = PARALLEL_BY_DIGIT[streetPart];
  if (!STREET_NAMES_NORMALIZED.has(streetPart.toLowerCase())) return [];
  const streetName = STREET_NAMES.find((x) => normalize(x).toLowerCase() === streetPart.toLowerCase()) || streetPart;
  const isAleea = STREETS_ALEEA.some((a) => normalize(a).toLowerCase() === streetPart.toLowerCase());
  return Array.from(
    { length: NUMBERS_SUGGESTED_PER_STREET },
    (_, i) => (isAleea ? `${streetName} nr. ${i + 1}, Sulina` : `Str. ${streetName} nr. ${i + 1}, Sulina`)
  );
}

/** Sugestii implicite: Plaja Sulina + străzi principale + străzi adiacente (pentru compatibilitate). */
const SULINA_SUGGESTIONS = [
  ...SPECIAL_ADDRESSES,
  ...STREETS_MAIN.map(formatStreetLabel),
  ...STREETS_ADJACENT.map(formatStreetLabel),
];

/**
 * Toate adresele din motor (aceeași listă ca la căutare, ordine fixă).
 * Folosit de GET /addresses/list – un singur punct pentru listă completă la scroll.
 */
function getAllAddresses() {
  return [
    ...SPECIAL_ADDRESSES,
    ...STREETS_MAIN.map(formatStreetLabel),
    ...STREETS_ADJACENT.map(formatStreetLabel),
    ...learnedAddresses,
  ];
}

module.exports = {
  SULINA_SUGGESTIONS,
  search,
  getNumberSuggestions,
  getAllAddresses,
  isValidSulinaAddress,
};
