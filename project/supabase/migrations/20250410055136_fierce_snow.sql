/*
  # Create orders table for water delivery service

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `costco_number` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `day_phone` (text)
      - `night_phone` (text)
      - `delivery_address` (text)
      - `delivery_city` (text)
      - `delivery_state` (text)
      - `delivery_zip` (text)
      - `is_commercial` (boolean)
      - `business_name` (text)
      - `water_type` (text)
      - `water_quantity` (integer)
      - `dispenser_type` (text)
      - `dispenser_quantity` (integer)
      - `delivery_frequency` (text)
      - `delivery_notes` (text)
      - `total_amount` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `orders` table
    - Add policies for authenticated users
*/

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  costco_number text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  day_phone text NOT NULL,
  night_phone text,
  delivery_address text NOT NULL,
  delivery_city text NOT NULL,
  delivery_state text NOT NULL,
  delivery_zip text NOT NULL,
  is_commercial boolean DEFAULT false,
  business_name text,
  water_type text NOT NULL,
  water_quantity integer NOT NULL,
  dispenser_type text,
  dispenser_quantity integer DEFAULT 0,
  delivery_frequency text NOT NULL,
  delivery_notes text,
  total_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting orders (anyone can create an order)
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for viewing orders (only authenticated users can view their own orders)
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (email = auth.email());