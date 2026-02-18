/**
 * Adrese livrabile – doar Sulina (inclusiv Plajă + Peste Dunăre).
 * Fără Tulcea sau alte localități. Folosit pentru autocomplete și validare.
 */
const SULINA_SUGGESTIONS = [
  'Plaja Sulina',
  'Peste Dunăre',
  'Str. 1 Decembrie, Sulina',
  'Str. 1 Decembrie nr. 1, Sulina',
  'Str. 1 Decembrie nr. 2, Sulina',
  'Str. 1 Decembrie nr. 3, Sulina',
  'Str. 1 Decembrie nr. 4, Sulina',
  'Str. 1 Decembrie nr. 5, Sulina',
  'Str. 1 Decembrie nr. 6, Sulina',
  'Str. 1 Decembrie nr. 7, Sulina',
  'Str. 1 Decembrie nr. 8, Sulina',
  'Str. 1 Decembrie nr. 9, Sulina',
  'Str. 1 Decembrie nr. 10, Sulina',
  'Str. 1 Decembrie nr. 11, Sulina',
  'Str. 1 Decembrie nr. 12, Sulina',
  'Str. 1 Decembrie nr. 13, Sulina',
  'Str. 1 Decembrie nr. 14, Sulina',
  'Str. 1 Decembrie nr. 15, Sulina',
  'Str. 1 Decembrie nr. 16, Sulina',
  'Str. 1 Decembrie nr. 17, Sulina',
  'Str. 1 Decembrie nr. 18, Sulina',
  'Str. 1 Decembrie nr. 19, Sulina',
  'Str. 1 Decembrie nr. 20, Sulina',
  'Str. Dunării, Sulina',
  'Str. Dunării nr. 1, Sulina',
  'Str. Dunării nr. 2, Sulina',
  'Str. Dunării nr. 3, Sulina',
  'Str. Dunării nr. 4, Sulina',
  'Str. Dunării nr. 5, Sulina',
  'Str. Dunării nr. 6, Sulina',
  'Str. Dunării nr. 7, Sulina',
  'Str. Dunării nr. 8, Sulina',
  'Str. Dunării nr. 9, Sulina',
  'Str. Dunării nr. 10, Sulina',
  'Str. Farului, Sulina',
  'Str. Farului nr. 1, Sulina',
  'Str. Farului nr. 2, Sulina',
  'Str. Farului nr. 3, Sulina',
  'Str. Principală, Sulina',
  'Str. Principală nr. 1, Sulina',
  'Str. Principală nr. 2, Sulina',
  'Str. Principală nr. 3, Sulina',
  'Str. Principală nr. 4, Sulina',
  'Str. Principală nr. 5, Sulina',
  'Str. Principală nr. 6, Sulina',
  'Str. Principală nr. 7, Sulina',
  'Str. Principală nr. 8, Sulina',
  'Str. Principală nr. 9, Sulina',
  'Str. Principală nr. 10, Sulina',
  'Str. Marinărilor, Sulina',
  'Str. Marinărilor nr. 1, Sulina',
  'Str. Marinărilor nr. 2, Sulina',
  'Str. Marinărilor nr. 3, Sulina',
  'Str. Pescarilor, Sulina',
  'Str. Pescarilor nr. 1, Sulina',
  'Str. Pescarilor nr. 2, Sulina',
  'Str. Pescarilor nr. 3, Sulina',
  'Str. Delta, Sulina',
  'Str. Delta nr. 1, Sulina',
  'Str. Delta nr. 2, Sulina',
  'Str. Delta nr. 3, Sulina',
  'Str. Portului, Sulina',
  'Str. Portului nr. 1, Sulina',
  'Str. Portului nr. 2, Sulina',
  'Str. Canalului, Sulina',
  'Str. Canalului nr. 1, Sulina',
  'Str. Canalului nr. 2, Sulina',
  'Str. Canalului nr. 3, Sulina',
  // Variante scurte / alternative (pentru matching)
  'Str. 3, Sulina',
  'Str. 3 nr. 1, Sulina',
  'Str. 3 nr. 2, Sulina',
  'Str. 3 nr. 3, Sulina',
  'Str. 3 nr. 230, Sulina',
];

function normalize(s) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

const NORMALIZED_SET = new Set(SULINA_SUGGESTIONS.map(normalize));

function search(query) {
  const q = normalize(query).toLowerCase();
  if (!q) return SULINA_SUGGESTIONS.slice(0, 20);
  return SULINA_SUGGESTIONS.filter((addr) => normalize(addr).toLowerCase().includes(q)).slice(0, 20);
}

function isValidSulinaAddress(address) {
  return NORMALIZED_SET.has(normalize(address));
}

module.exports = {
  SULINA_SUGGESTIONS,
  search,
  isValidSulinaAddress,
};
