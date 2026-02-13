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
 * Schema de validare pentru creare comandă
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
 * Schema de validare pentru actualizare status comandă
 */
const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED']),
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
        return res.status(400).json({
          error: 'Date invalide',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
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
  updateOrderStatusSchema,
  validate,
};
