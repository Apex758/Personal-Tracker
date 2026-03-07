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







