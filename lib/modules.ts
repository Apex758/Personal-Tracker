import type { ModuleConfig, ModuleSlug } from '@/lib/types';

export const modules: ModuleConfig[] = [
  {
    slug: 'finance',
    label: 'Finance',
    description: 'Income, expenses, savings, debts, emergency fund, and monthly goals.',
    table: 'finance_entries',
    workbookSheet: 'Financial Data',
    primaryField: 'category',
    accent: 'var(--accent-finance)',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'financial_nature', label: 'Financial Nature', type: 'select', options: ['Income', 'Expense', 'Savings', 'Frass', 'Debt', 'Emergency Fund'] },
      { key: 'account_type', label: 'Account Type', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'payment_method', label: 'Payment Method', type: 'text' },
      { key: 'project', label: 'Project', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'number' },
      { key: 'month', label: 'Month', type: 'select', options: ['January','February','March','April','May','June','July','August','September','October','November','December'] },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    slug: 'grocery',
    label: 'Grocery Budget',
    description: 'Plan and track grocery spend by category. Push totals to Finance.',
    table: 'grocery_entries',
    workbookSheet: 'Grocery Budget',
    primaryField: 'item',
    accent: '#4ade80',
    columns: [
      { key: 'category', label: 'Category', type: 'select', options: ['Protein', 'Carbs', 'Fats', 'Vegetables & Fruit', 'Flavor', 'Toiletries', 'Extra'] },
      { key: 'item', label: 'Item', type: 'text' },
      { key: 'goal_amount', label: 'Goal Amount', type: 'number' },
      { key: 'actual_amount', label: 'Actual Amount', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  {
    slug: 'lifestyle',
    label: 'Body & Lifestyle',
    description: 'Track habits, care routines, wellness notes, and consistency.',
    table: 'lifestyle_entries',
    workbookSheet: 'Body & Lifestyle Tracker Data',
    primaryField: 'date',
    accent: 'var(--accent-lifestyle)',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'prayers_praises', label: 'Prayers & Praises', type: 'number' },
      { key: 'gym', label: 'Gym', type: 'number' },
      { key: 'smoking', label: 'Smoking', type: 'number' },
      { key: 'drinking', label: 'Drinking', type: 'number' },
      { key: 'skincare', label: 'Skincare', type: 'number' },
      { key: 'haircare', label: 'Haircare', type: 'number' },
      { key: 'hand_feet_care', label: 'Hand & Feet Care', type: 'number' },
      { key: 'journal', label: 'Journal', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'water_glasses', label: 'Water (glasses)', type: 'number' },
    ]
  },
  {
    slug: 'skills',
    label: 'Skills & Progress',
    description: 'Track what you are learning, how far along you are, and what to do next.',
    table: 'skill_entries',
    workbookSheet: 'Skills & Progress Tracker',
    primaryField: 'specific_skill',
    accent: 'var(--accent-skills)',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'skill_area', label: 'Skill Area', type: 'text' },
      { key: 'specific_skill', label: 'Specific Skill', type: 'text' },
      { key: 'goal_outcome', label: 'Goal / Outcome', type: 'textarea' },
      { key: 'current_level', label: 'Current Level', type: 'number' },
      { key: 'target_level', label: 'Target Level', type: 'number' },
      { key: 'hours_invested', label: 'Hours Invested', type: 'number' },
      { key: 'learning_resource', label: 'Learning Resource', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Not Started', 'Planned', 'In Progress', 'Completed', 'On Hold'] },
      { key: 'next_review_date', label: 'Next Review Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    slug: 'work',
    label: 'Work & Business',
    description: 'Consultancy, SaaS ideas, milestones, deadlines, hours, and cash movement.',
    table: 'work_entries',
    workbookSheet: 'Work & Business Tracker',
    primaryField: 'task_deliverable',
    accent: 'var(--accent-work)',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'area', label: 'Area', type: 'text' },
      { key: 'project_client', label: 'Project / Client', type: 'text' },
      { key: 'task_deliverable', label: 'Task / Deliverable', type: 'textarea' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Not Started', 'Planned', 'In Progress', 'Completed', 'On Hold'] },
      { key: 'hours', label: 'Hours', type: 'number' },
      { key: 'expected_income', label: 'Expected Income', type: 'number' },
      { key: 'actual_income', label: 'Actual Income', type: 'number' },
      { key: 'expense', label: 'Expense', type: 'number' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    slug: 'travel',
    label: 'Travel',
    description: 'Trips you want, trips you are planning, budgets, timing, and booking progress.',
    table: 'travel_entries',
    workbookSheet: 'Travel Tracker',
    primaryField: 'trip_name',
    accent: 'var(--accent-travel)',
    columns: [
      { key: 'trip_name', label: 'Trip Name', type: 'text' },
      { key: 'destination', label: 'Destination', type: 'text' },
      { key: 'purpose', label: 'Purpose', type: 'textarea' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'budget', label: 'Budget', type: 'number' },
      { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
      { key: 'actual_cost', label: 'Actual Cost', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Idea', 'Researching', 'Planned', 'Booked', 'Completed', 'Cancelled'] },
      { key: 'booking_reference', label: 'Booking Link / Reference', type: 'text' },
      { key: 'people', label: 'People', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    slug: 'wishlist',
    label: 'Purchases & Wishlist',
    description: 'Things you want, things you need, and what should come first.',
    table: 'wishlist_entries',
    workbookSheet: 'Purchases & Wishlist',
    primaryField: 'item',
    accent: 'var(--accent-wishlist)',
    columns: [
      { key: 'item', label: 'Item', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'need_or_want', label: 'Need or Want', type: 'select', options: ['Need', 'Want'] },
      { key: 'target_budget', label: 'Target Budget', type: 'number' },
      { key: 'expected_price', label: 'Expected Price', type: 'number' },
      { key: 'actual_price', label: 'Actual Price', type: 'number' },
      { key: 'purchase_status', label: 'Purchase Status', type: 'select', options: ['Researching', 'Planned', 'Saving', 'Ready to Buy', 'Bought', 'Dropped'] },
      { key: 'shop_source', label: 'Shop / Source', type: 'text' },
      { key: 'target_date', label: 'Target Date', type: 'date' },
      { key: 'bought_date', label: 'Bought Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    slug: 'recipe',
    label: 'Recipe Book',
    description: 'Your personal cookbook with all your favorite recipes.',
    table: 'recipe_entries',
    workbookSheet: 'Recipe Book',
    primaryField: 'name',
    accent: 'var(--accent-recipe)',
    columns: [
      { key: 'name', label: 'Recipe Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'image_url', label: 'Image URL', type: 'text' },
      { key: 'prep_time', label: 'Prep Time', type: 'text' },
      { key: 'cook_time', label: 'Cook Time', type: 'text' },
      { key: 'servings', label: 'Servings', type: 'number' },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea' },
      { key: 'instructions', label: 'Instructions', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    slug: 'gym',
    label: 'Gym & Calisthenics',
    description: 'Track exercises, sets, reps, and progression over time.',
    table: 'gym_entries',
    workbookSheet: 'Gym Progressions',
    primaryField: 'exercise',
    accent: '#f97316',
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'exercise', label: 'Exercise', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Mobility'] },
      { key: 'sets', label: 'Sets', type: 'number' },
      { key: 'reps', label: 'Reps', type: 'number' },
      { key: 'weight_kg', label: 'Weight (kg)', type: 'number' },
      { key: 'duration_min', label: 'Duration (min)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
];

export function getModule(slug: string) {
  return modules.find((module) => module.slug === slug as ModuleSlug);
}