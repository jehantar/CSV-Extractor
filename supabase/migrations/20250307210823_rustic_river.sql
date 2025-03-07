/*
  # Initial Schema Setup for Budget Management App

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `date` (date, when the transaction occurred)
      - `description` (text, transaction description)
      - `amount` (numeric, transaction amount)
      - `category` (text, transaction category)
      - `account` (text, source account)
      - `created_at` (timestamptz, when record was created)
      - `user_id` (uuid, references auth.users)
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, category name)
      - `color` (text, display color for the category)
      - `user_id` (uuid, references auth.users)
    
    - `accounts`
      - `id` (uuid, primary key)
      - `name` (text, account name)
      - `type` (text, account type - bank/credit)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  account text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Create accounts table
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('bank', 'credit')) NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own accounts"
  ON accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);