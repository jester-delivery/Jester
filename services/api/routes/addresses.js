const express = require('express');
const { search, getNumberSuggestions, getAllAddresses, isValidSulinaAddress } = require('../data/sulinaAddresses');

const router = express.Router();

/**
 * GET /addresses/list
 * Toate adresele din motor (Plaja + str. 1–6 + străzi adiacente + învățate). Aceeași listă la scroll.
 * Public, fără auth.
 */
router.get('/list', (req, res) => {
  try {
    const suggestions = getAllAddresses();
    res.json({ suggestions });
  } catch (error) {
    console.error('Error in addresses list:', error);
    res.status(500).json({ error: 'Eroare la listă', code: 'LIST_ERROR' });
  }
});

/**
 * GET /addresses/search?q=term
 * Autocomplete – aceleași adrese din Sulina, filtrate după termen.
 * Public, fără auth.
 */
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const suggestions = search(q);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error in addresses search:', error);
    res.status(500).json({ error: 'Eroare la căutare', code: 'SEARCH_ERROR' });
  }
});

/**
 * GET /addresses/street-numbers?street=Str. 1 Decembrie, Sulina
 * Sugestii de numere pentru o stradă aleasă. Clientul poate alege sau completa manual orice număr.
 */
router.get('/street-numbers', (req, res) => {
  try {
    const street = (req.query.street || '').trim();
    const suggestions = getNumberSuggestions(street);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error in addresses street-numbers:', error);
    res.status(500).json({ error: 'Eroare la sugestii numere', code: 'STREET_NUMBERS_ERROR' });
  }
});

/**
 * GET /addresses/validate?address=...
 * Verifică dacă adresa este în zona livrabilă (Sulina).
 * Public. Folosit la checkout (frontend) înainte de submit.
 */
router.get('/validate', (req, res) => {
  try {
    const address = (req.query.address || '').trim();
    const valid = isValidSulinaAddress(address);
    res.json({ valid });
  } catch (error) {
    console.error('Error in addresses validate:', error);
    res.status(500).json({ error: 'Eroare la validare', code: 'VALIDATE_ERROR' });
  }
});

module.exports = router;
