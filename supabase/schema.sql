-- ============================================================
-- PERSONAL HQ — CLEAN RESET & IMPORT
-- Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================

-- 1. WIPE ALL TABLES
TRUNCATE TABLE finance_entries   RESTART IDENTITY CASCADE;
TRUNCATE TABLE lifestyle_entries RESTART IDENTITY CASCADE;
TRUNCATE TABLE skill_entries     RESTART IDENTITY CASCADE;
TRUNCATE TABLE work_entries      RESTART IDENTITY CASCADE;
TRUNCATE TABLE travel_entries    RESTART IDENTITY CASCADE;
TRUNCATE TABLE wishlist_entries  RESTART IDENTITY CASCADE;
TRUNCATE TABLE recipe_entries    RESTART IDENTITY CASCADE;


-- 2. FINANCE (8 real rows)
INSERT INTO finance_entries (date, financial_nature, account_type, category, payment_method, project, amount, month) VALUES
('2026-01-23', 'Frass',          'Viridion', 'Groceries',      NULL,         'OECS PEARL', 500,  'January'),
('2026-01-15', 'Expense',        'Viridion', 'Transportation', NULL,         NULL,         600,  'January'),
('2026-01-09', 'Income',         'Viridion', 'Eating Out',     NULL,         NULL,         7000, 'January'),
('2025-12-24', 'Debt',           NULL,       NULL,             NULL,         NULL,         2,    'December'),
('2026-01-18', 'Emergency Fund', NULL,       NULL,             'Debit Card', NULL,         200,  'January'),
('2026-01-21', 'Savings',        NULL,       NULL,             NULL,         NULL,         650,  'January'),
('2026-01-21', 'Expense',        NULL,       'Utilities',      NULL,         NULL,         200,  'January'),
('2026-01-16', 'Emergency Fund', NULL,       NULL,             'Debit Card', NULL,         41,   'January');


-- 3. LIFESTYLE (14 rows with actual data)
INSERT INTO lifestyle_entries (date, prayers_praises, gym, smoking, drinking, skincare, haircare, hand_feet_care, journal, notes) VALUES
('2026-01-01', 1, 1,    1, 1,    1, 1,    1, 1, NULL),
('2026-01-02', 2, 1,    1, NULL, NULL, NULL, NULL, NULL, NULL),
('2026-01-03', 1, 1,    4, 1,    1, NULL, 1, 1, NULL),
('2026-01-04', 2, NULL, NULL, 5, 2, NULL, NULL, 1, NULL),
('2026-01-05', 2, NULL, 1, 1,    NULL, NULL, NULL, 1, NULL),
('2026-01-06', 1, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL),
('2026-01-07', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('2026-01-08', 1, 1,    1, 1,    1, 1,    1, 1, NULL),
('2026-01-09', 2, 1,    1, NULL, NULL, NULL, NULL, NULL, NULL),
('2026-01-10', 1, 1,    4, 1,    1, NULL, 1, 1, NULL),
('2026-01-11', 2, NULL, NULL, 5, 2, NULL, NULL, 1, NULL),
('2026-01-12', 2, NULL, 1, 1,    NULL, NULL, NULL, 1, NULL),
('2026-01-13', 1, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL),
('2026-01-14', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


-- 4. SKILLS (2 rows)
INSERT INTO skill_entries (date, skill_area, specific_skill, goal_outcome, current_level, target_level, hours_invested, learning_resource, status, next_review_date) VALUES
('2026-03-01', 'AI / Coding', 'Next.js App Router',    'Build workbook dashboard',       4, 8, 3, 'Official docs',    'In Progress', '2026-03-14'),
('2026-03-03', 'Business',    'Budgeting & cash flow', 'Track monthly spending clearly', 5, 9, 2, 'Personal tracker', 'Planned',     '2026-03-20');


-- 5. WORK (2 rows)
INSERT INTO work_entries (date, area, project_client, task_deliverable, priority, status, hours, expected_income, actual_income, expense) VALUES
('2026-03-01', 'Consulting', 'OECS Learning Hub', 'Invoice + architecture update', 'High',     'Completed',   6, 1400, 1400, 0),
('2026-03-06', 'Product',    'Viridion',          'Prototype tracker dashboard',   'Critical', 'In Progress', 4, 0,    0,    0);


-- 6. TRAVEL (2 rows)
INSERT INTO travel_entries (trip_name, destination, purpose, start_date, end_date, budget, estimated_cost, actual_cost, status, booking_reference) VALUES
('Birthday Cruise', 'Caribbean', 'Celebration / self-care', '2026-08-20', '2026-08-24', 3000, 2500, 0, 'Researching', NULL),
('Dental Trip',     'Barbados',  'Dental work / shopping',  '2026-05-10', '2026-05-14', 2200, 1800, 0, 'Idea',        NULL);

INSERT INTO wishlist_entries (item, category, priority, need_or_want, target_budget, expected_price, actual_price, purchase_status, shop_source, target_date) VALUES
('Gold chain', 'Style', 'Medium', 'Want', 2500, 2200, 0, 'Researching', 'Local jeweler',   '2026-06-01'),
('Bed frame',  'Home',  'High',   'Need', 1800, 1500, 0, 'Planned',     'Furniture store', '2026-04-15');


-- 7. RECIPE BOOK
CREATE TABLE IF NOT EXISTS recipe_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  prep_time TEXT,
  cook_time TEXT,
  servings INTEGER,
  ingredients TEXT,
  instructions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO recipe_entries (name, category, image_url, prep_time, cook_time, servings, ingredients, instructions) VALUES
('Classic Pancakes', 'Breakfast', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', '10 min', '15 min', 4, '• 1 1/2 cups all-purpose flour\n• 3 1/2 tsp baking powder\n• 1 tbsp sugar\n• 1/4 tsp salt\n• 1 1/4 cups milk\n• 1 egg\n• 3 tbsp melted butter', '1. Mix flour, baking powder, sugar and salt in a large bowl.\n2. Make a well in the center and pour in milk, egg and melted butter.\n3. Mix until smooth.\n4. Heat a lightly oiled griddle over medium-high heat.\n5. Pour batter onto griddle using approximately 1/4 cup for each pancake.\n6. Brown on both sides and serve hot.'),
('Grilled Chicken Salad', 'Lunch', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', '15 min', '20 min', 2, '• 2 chicken breasts\n• Mixed greens\n• Cherry tomatoes\n• Cucumber\n• Olive oil\n• Lemon juice\n• Salt and pepper', '1. Season chicken breasts with salt, pepper and olive oil.\n2. Grill chicken for 6-7 minutes per side until cooked through.\n3. Let chicken rest for 5 minutes, then slice.\n4. Arrange mixed greens on plates.\n5. Top with sliced chicken, cherry tomatoes and cucumber.\n6. Drizzle with olive oil and lemon juice.'),
('Spaghetti Carbonara', 'Dinner', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', '10 min', '20 min', 4, '• 400g spaghetti\n• 200g pancetta\n• 4 egg yolks\n• 100g pecorino cheese\n• Black pepper\n• Salt', '1. Cook spaghetti according to package directions.\n2. Cut pancetta into small cubes and fry until crispy.\n3. Mix egg yolks with grated pecorino and black pepper.\n4. Drain pasta, reserving 1 cup pasta water.\n5. Add hot pasta to pancetta pan, remove from heat.\n6. Quickly stir in egg mixture, adding pasta water as needed.\n7. Serve immediately with extra cheese and pepper.');







