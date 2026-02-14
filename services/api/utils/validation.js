const { z } = require('zod');

/**
 * Schema de validare pentru înregistrare utilizator
 */
const registerSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola trebuie să aibă minim 6 caractere'),
  name: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere'),
  phone: z.string().optional(),
});

/**
 * Schema de validare pentru login utilizator
 */
const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(1, 'Parola este obligatorie'),
});

/**
 * Schema de validare pentru creare comandă (auth + productId)
 */
const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('ID produs invalid'),
      quantity: z.number().int().positive('Cantitatea trebuie să fie un număr pozitiv'),
    })
  ).min(1, 'Comanda trebuie să conțină cel puțin un produs'),
  deliveryAddress: z.string().min(10, 'Adresa de livrare trebuie să aibă minim 10 caractere'),
});

/**
 * Schema MVP: comandă din coș (items, total, delivery, paymentMethod)
 */
const createMvpOrderSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1, 'Numele produsului este obligatoriu'),
      price: z.number().nonnegative('Prețul trebuie să fie >= 0'),
      quantity: z.number().int().positive('Cantitatea trebuie să fie un număr pozitiv'),
    })
  ).min(1, 'Comanda trebuie să conțină cel puțin un produs'),
  total: z.number().nonnegative('Totalul trebuie să fie >= 0'),
  deliveryAddress: z.string()
    .min(1, 'Adresa de livrare este obligatorie')
    .refine((v) => v.trim().length >= 5, 'Adresa de livrare trebuie să aibă min. 5 caractere'),
  phone: z.string()
    .min(1, 'Telefonul este obligatoriu')
    .refine((v) => v.trim().length >= 8, 'Telefonul trebuie să aibă min. 8 caractere')
    .refine((v) => /^(\+40|0)?7\d{8}$/.test(v.replace(/\s/g, '')), 'Telefon invalid. Folosește format RO: 07xx xxx xxx'),
  name: z.string()
    .min(1, 'Numele clientului este obligatoriu')
    .refine((v) => v.trim().length >= 2, 'Numele trebuie să aibă min. 2 caractere'),
  notes: z.string().optional().default(''),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'CARD', 'cash']).optional().default('CASH_ON_DELIVERY'),
});

/**
 * Schema PATCH /me - nume, telefon
 */
const updateMeSchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă minim 2 caractere').optional(),
  phone: z.string().optional().nullable(),
});

/**
 * Schema POST /me/addresses
 */
const createAddressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other'], { errorMap: () => ({ message: 'Label invalid (Home/Work/Other)' }) }),
  street: z.string().min(2, 'Strada este obligatorie'),
  number: z.string().optional(),
  details: z.string().optional(),
  city: z.string().min(2, 'Orașul este obligatoriu'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * Schema PATCH /me/addresses/:id
 */
const updateAddressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']).optional(),
  street: z.string().min(2).optional(),
  number: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});

/**
 * Schema de validare pentru actualizare status/ETA/notes comandă (admin)
 */
const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'ON_THE_WAY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'CANCELED']).optional(),
  estimatedDeliveryMinutes: z.number().int().min(0).max(180).optional().nullable(),
  internalNotes: z.string().max(500).optional().nullable(),
}).refine((d) => d.status != null || d.estimatedDeliveryMinutes != null || d.internalNotes != null, {
  message: 'Cel puțin un câmp este necesar (status, estimatedDeliveryMinutes, internalNotes)',
});

/**
 * Middleware pentru validare cu Zod
 * @param {z.ZodSchema} schema - Schema Zod pentru validare
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        const firstMessage = details[0]?.message || 'Date invalide';
        return res.status(400).json({
          error: firstMessage,
          code: 'VALIDATION_ERROR',
          details,
        });
      }
      next(error);
    }
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  createOrderSchema,
  createMvpOrderSchema,
  updateMeSchema,
  createAddressSchema,
  updateAddressSchema,
  updateOrderStatusSchema,
  validate,
};
