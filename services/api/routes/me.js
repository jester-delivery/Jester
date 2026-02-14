const express = require('express');
const prisma = require('../utils/prisma');
const authenticateToken = require('../middleware/authenticateToken');
const { validate, updateMeSchema, createAddressSchema, updateAddressSchema } = require('../utils/validation');

const router = express.Router();

/** Toate rutele necesită auth */
router.use(authenticateToken);

/**
 * GET /me
 * Profilul userului autentificat
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit', code: 'USER_NOT_FOUND' });
    res.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Eroare la obținerea profilului', code: 'FETCH_PROFILE_ERROR' });
  }
});

/**
 * PATCH /me
 * Actualizează nume, telefon (email read-only)
 */
router.patch('/', validate(updateMeSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Eroare la actualizarea profilului', code: 'UPDATE_PROFILE_ERROR' });
  }
});

/**
 * GET /me/addresses
 * Lista adreselor userului
 */
router.get('/addresses', async (req, res) => {
  try {
    const userId = req.userId;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    res.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Eroare la obținerea adreselor', code: 'FETCH_ADDRESSES_ERROR' });
  }
});

/**
 * POST /me/addresses
 * Adaugă adresă nouă
 */
router.post('/addresses', validate(createAddressSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { label, street, number, details, city, lat, lng, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label,
        street,
        number: number || null,
        details: details || null,
        city,
        lat: lat != null ? Number(lat) : null,
        lng: lng != null ? Number(lng) : null,
        isDefault: Boolean(isDefault),
      },
    });

    res.status(201).json({ address });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'Eroare la crearea adresei', code: 'CREATE_ADDRESS_ERROR' });
  }
});

/**
 * PATCH /me/addresses/:id
 * Actualizează adresă sau setează default
 */
router.patch('/addresses/:id', validate(updateAddressSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { label, street, number, details, city, lat, lng, isDefault } = req.body;

    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Adresă negăsită', code: 'ADDRESS_NOT_FOUND' });
    }

    const data = {};
    if (label !== undefined) data.label = label;
    if (street !== undefined) data.street = street;
    if (number !== undefined) data.number = number || null;
    if (details !== undefined) data.details = details || null;
    if (city !== undefined) data.city = city;
    if (lat !== undefined) data.lat = lat != null ? Number(lat) : null;
    if (lng !== undefined) data.lng = lng != null ? Number(lng) : null;

    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      data.isDefault = true;
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    res.json({ address });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Eroare la actualizarea adresei', code: 'UPDATE_ADDRESS_ERROR' });
  }
});

/**
 * DELETE /me/addresses/:id
 */
router.delete('/addresses/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Adresă negăsită', code: 'ADDRESS_NOT_FOUND' });
    }

    await prisma.address.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Eroare la ștergerea adresei', code: 'DELETE_ADDRESS_ERROR' });
  }
});

module.exports = router;
