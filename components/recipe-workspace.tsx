'use client';

import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Clock, Users, ChefHat, X } from 'lucide-react';
import type { RecordShape } from '@/lib/types';

type Recipe = RecordShape & {
  id: string;
  name: string;
  category: string;
  image_url: string;
  prep_time: string;
  cook_time: string;
  servings: number;
  ingredients: string;
  instructions: string;
  notes: string;
};

const DEMO_RECIPES: Recipe[] = [
  {
    id: 'demo-1',
    name: 'Classic Pancakes',
    category: 'Breakfast',
    image_url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
    prep_time: '10 min',
    cook_time: '15 min',
    servings: 4,
    ingredients: '• 1 1/2 cups all-purpose flour\n• 3 1/2 tsp baking powder\n• 1 tbsp sugar\n• 1/4 tsp salt\n• 1 1/4 cups milk\n• 1 egg\n• 3 tbsp melted butter',
    instructions: '1. Mix flour, baking powder, sugar and salt in a large bowl.\n2. Make a well in the center and pour in milk, egg and melted butter.\n3. Mix until smooth.\n4. Heat a lightly oiled griddle over medium-high heat.\n5. Pour batter onto griddle using approximately 1/4 cup for each pancake.\n6. Brown on both sides and serve hot.',
    notes: '',
  },
  {
    id: 'demo-2',
    name: 'Grilled Chicken Salad',
    category: 'Lunch',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    prep_time: '15 min',
    cook_time: '20 min',
    servings: 2,
    ingredients: '• 2 chicken breasts\n• Mixed greens\n• Cherry tomatoes\n• Cucumber\n• Olive oil\n• Lemon juice\n• Salt and pepper',
    instructions: '1. Season chicken breasts with salt, pepper and olive oil.\n2. Grill chicken for 6-7 minutes per side until cooked through.\n3. Let chicken rest for 5 minutes, then slice.\n4. Arrange mixed greens on plates.\n5. Top with sliced chicken, cherry tomatoes and cucumber.\n6. Drizzle with olive oil and lemon juice.',
    notes: '',
  },
  {
    id: 'demo-3',
    name: 'Spaghetti Carbonara',
    category: 'Dinner',
    image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    prep_time: '10 min',
    cook_time: '20 min',
    servings: 4,
    ingredients: '• 400g spaghetti\n• 200g pancetta\n• 4 egg yolks\n• 100g pecorino cheese\n• Black pepper\n• Salt',
    instructions: '1. Cook spaghetti according to package directions.\n2. Cut pancetta into small cubes and fry until crispy.\n3. Mix egg yolks with grated pecorino and black pepper.\n4. Drain pasta, reserving 1 cup pasta water.\n5. Add hot pasta to pancetta pan, remove from heat.\n6. Quickly stir in egg mixture, adding pasta water as needed.\n7. Serve immediately with extra cheese and pepper.',
    notes: '',
  },
  {
    id: 'demo-4',
    name: 'Chocolate Brownies',
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400',
    prep_time: '15 min',
    cook_time: '25 min',
    servings: 12,
    ingredients: '• 200g dark chocolate\n• 175g butter\n• 325g sugar\n• 3 eggs\n• 1 tsp vanilla extract\n• 100g flour\n• 50g cocoa powder',
    instructions: '1. Preheat oven to 180°C/350°F.\n2. Melt chocolate and butter together.\n3. Stir in sugar, then eggs and vanilla.\n4. Fold in flour and cocoa powder.\n5. Pour into lined baking tin.\n6. Bake for 25 minutes.\n7. Cool before cutting into squares.',
    notes: '',
  },
];

export function RecipeWorkspace({ initialRows }: { initialRows: RecordShape[] }) {
  const recipes = initialRows.length > 0 ? initialRows as Recipe[] : DEMO_RECIPES;
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(recipes[0]?.id || null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([recipes[0]?.category || 'Breakfast'])
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Group recipes by category
  const recipesByCategory = useMemo(() => {
    const grouped: Record<string, Recipe[]> = {};
    recipes.forEach((recipe) => {
      const cat = recipe.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(recipe);
    });
    return grouped;
  }, [recipes]);

  const categories = Object.keys(recipesByCategory).sort();

  const toggleCategory = (cat: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(cat)) {
      newExpanded.delete(cat);
    } else {
      newExpanded.add(cat);
    }
    setExpandedCategories(newExpanded);
  };

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  // Pagination for long recipes
  const totalPages = useMemo(() => {
    if (!selectedRecipe) return 1;
    const content = [selectedRecipe.ingredients, selectedRecipe.instructions, selectedRecipe.notes]
      .filter(Boolean)
      .join('\n\n');
    const charsPerPage = 2000;
    return Math.max(1, Math.ceil(content.length / charsPerPage));
  }, [selectedRecipe]);

  const handleRecipeClick = (id: string) => {
    setSelectedRecipeId(id);
    setCurrentPage(1);
  };

  return (
    <div className="recipe-workspace">
      {/* Table of Contents - Left Side */}
      <div className="recipe-toc">
        <div className="toc-header">
          <div className="toc-title">
            <ChefHat size={20} />
            Contents
          </div>
          <button className="add-recipe-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Recipe
          </button>
        </div>

        {categories.map((category) => (
          <div key={category} className="toc-category">
            <button
              className="toc-category-header"
              onClick={() => toggleCategory(category)}
            >
              <span className={`toc-category-icon ${expandedCategories.has(category) ? 'expanded' : ''}`}>
                {expandedCategories.has(category) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </span>
              {category}
            </button>
            
            {expandedCategories.has(category) && (
              <div className="toc-recipe-list">
                {recipesByCategory[category].map((recipe) => (
                  <button
                    key={recipe.id}
                    className={`toc-recipe-item ${selectedRecipeId === recipe.id ? 'active' : ''}`}
                    onClick={() => handleRecipeClick(recipe.id)}
                  >
                    {recipe.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recipe Page - Right Side */}
      <div className="recipe-page-container">
        {selectedRecipe ? (
          <>
            <div className="recipe-page">
              <div className="recipe-header">
                <div>
                  <h1 className="recipe-title">{selectedRecipe.name}</h1>
                  <div className="recipe-meta">
                    {selectedRecipe.prep_time && (
                      <div className="recipe-meta-item">
                        <Clock size={16} className="recipe-meta-icon" />
                        Prep: {selectedRecipe.prep_time}
                      </div>
                    )}
                    {selectedRecipe.cook_time && (
                      <div className="recipe-meta-item">
                        <Clock size={16} className="recipe-meta-icon" />
                        Cook: {selectedRecipe.cook_time}
                      </div>
                    )}
                    {selectedRecipe.servings && (
                      <div className="recipe-meta-item">
                        <Users size={16} className="recipe-meta-icon" />
                        {selectedRecipe.servings} servings
                      </div>
                    )}
                  </div>
                </div>
                {selectedRecipe.image_url && (
                  <img
                    src={selectedRecipe.image_url}
                    alt={selectedRecipe.name}
                    className="recipe-image"
                  />
                )}
              </div>

              <div className="recipe-content">
                <div className="recipe-section">
                  <h3 className="recipe-section-title">Ingredients</h3>
                  <div className="recipe-text">{selectedRecipe.ingredients}</div>
                </div>
                
                <div className="recipe-section">
                  <h3 className="recipe-section-title">Instructions</h3>
                  <div className="recipe-text">{selectedRecipe.instructions}</div>
                </div>
              </div>

              {selectedRecipe.notes && (
                <div className="recipe-section">
                  <h3 className="recipe-section-title">Notes</h3>
                  <div className="recipe-text">{selectedRecipe.notes}</div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="recipe-pagination">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="page-indicator">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="recipe-empty-state">
            <ChefHat size={48} className="recipe-empty-icon" />
            <p>Select a recipe from the table of contents</p>
          </div>
        )}
      </div>

      {/* Add Recipe Modal */}
      {showAddModal && (
        <div className="recipe-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-modal-header">
              <h2 className="recipe-modal-title">Add New Recipe</h2>
              <button className="recipe-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddModal(false);
              }}
            >
              <div className="recipe-form-group">
                <label className="recipe-form-label">Recipe Name</label>
                <input type="text" className="recipe-form-input" placeholder="e.g., Chocolate Cake" required />
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">Category</label>
                <select className="recipe-form-select">
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                </select>
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">Image URL</label>
                <input type="url" className="recipe-form-input" placeholder="https://..." />
              </div>

              <div className="recipe-form-row">
                <div className="recipe-form-group">
                  <label className="recipe-form-label">Prep Time</label>
                  <input type="text" className="recipe-form-input" placeholder="e.g., 15 min" />
                </div>
                <div className="recipe-form-group">
                  <label className="recipe-form-label">Cook Time</label>
                  <input type="text" className="recipe-form-input" placeholder="e.g., 30 min" />
                </div>
                <div className="recipe-form-group">
                  <label className="recipe-form-label">Servings</label>
                  <input type="number" className="recipe-form-input" placeholder="4" />
                </div>
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">Ingredients</label>
                <textarea className="recipe-form-textarea" placeholder="List your ingredients..."></textarea>
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">Instructions</label>
                <textarea className="recipe-form-textarea" placeholder="Step-by-step instructions..."></textarea>
              </div>

              <div className="recipe-form-group">
                <label className="recipe-form-label">Notes (optional)</label>
                <textarea className="recipe-form-textarea" placeholder="Any additional notes..."></textarea>
              </div>

              <div className="recipe-form-actions">
                <button type="button" className="recipe-btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="recipe-btn-save">
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
