const express = require('express');
const { search, isValidSulinaAddress } = require('../data/sulinaAddresses');

const router = express.Router();

/**
 * GET /addresses/search?q=term
 * Autocomplete – doar adrese din Sulina (străzi, Plaja Sulina, Peste Dunăre).
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
