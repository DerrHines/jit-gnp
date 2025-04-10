import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import serveStatic from 'serve-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(serveStatic(join(__dirname, 'public')));

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation middleware
const orderValidation = [
  body('costco').isLength({ min: 12, max: 12 }).withMessage('Invalid Costco membership number'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('dayPhone').matches(/^\d{3}-\d{3}-\d{4}$/).withMessage('Invalid phone format'),
  body('email').isEmail(),
  body('address').notEmpty(),
  body('city').notEmpty(),
  body('state').notEmpty(),
  body('zip').matches(/^\d{5}$/).withMessage('Invalid ZIP code'),
  body('waterType').notEmpty(),
  body('waterQuantity').isInt({ min: 2 }),
  body('delivery').isIn(['2 weeks', '4 weeks', '8 weeks'])
];

// Routes
app.post('/api/orders', orderValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Calculate order total
    const prices = {
      'Purified Water': 7.49,
      'Spring Water': 8.49,
      'Alkaline Water': 13.99,
      'HotCold Dispenser': 5.99,
      'Coffee Dispenser': 11.99
    };

    const waterTotal = req.body.waterQuantity * prices[req.body.waterType];
    const dispenserTotal = req.body.dispenserQuantity * 
      (req.body.dispenserType.includes('Dispenser') ? prices[req.body.dispenserType] : 0);
    const deliveryFee = 13.99;
    const total = waterTotal + dispenserTotal + deliveryFee;

    // Store order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          costco_number: req.body.costco,
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          email: req.body.email,
          day_phone: req.body.dayPhone,
          night_phone: req.body.nightPhone,
          delivery_address: req.body.address,
          delivery_city: req.body.city,
          delivery_state: req.body.state,
          delivery_zip: req.body.zip,
          is_commercial: req.body.commercial === 'Yes',
          business_name: req.body.businessName,
          water_type: req.body.waterType,
          water_quantity: req.body.waterQuantity,
          dispenser_type: req.body.dispenserType,
          dispenser_quantity: req.body.dispenserQuantity,
          delivery_frequency: req.body.delivery,
          delivery_notes: req.body.deliveryNotes,
          total_amount: total,
          status: 'pending'
        }
      ]);

    if (error) throw error;

    res.status(201).json({
      message: 'Order created successfully',
      orderId: data[0].id,
      total
    });

  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Get order status
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});