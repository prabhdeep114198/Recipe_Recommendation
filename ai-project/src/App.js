import axios from 'axios';
import React, { useState } from 'react';

function cleanText(text) {
  if (!text) return '';
  return text.replace(/[",()[\]{}]/g, '').trim();
}

function parseIngredients(ingredients) {
  if (!ingredients) return [];
  return ingredients.split(/[,;]+/)
    .map(ingredient => cleanText(ingredient))
    .filter(ingredient => ingredient.length > 0);
}

function parseInstructions(instructions) {
  if (!instructions) return [];
  return instructions.split(/[.;]+/)
    .map(step => cleanText(step))
    .filter(step => step.length > 0);
}

function cleanImageUrl(url) {
  if (!url) return '/api/placeholder/600/400';
  // Handle `c()` function-style inputs
  const match = url.match(/c\(["']([^"']+)["']/);
  return match ? match[1] : url.replace(/^"+|"+$/g, '');
}

function App() {
  const [preferences, setPreferences] = useState({
    max_cook_time: '',
    max_calories: '',
    recipe_category: '',
    ingredient_restrictions: '',
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const dataToSend = {
        preferences: {
          ...preferences,
          ingredient_restrictions: preferences.ingredient_restrictions.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0),
        },
      };
      const res = await axios.post('http://localhost:5000/recommend', dataToSend);
      setResponse(res.data);
    } catch (err) {
      console.error('Network error:', err);
      setError('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const RecipeCard = ({ recipe }) => {
    const cleanedIngredients = parseIngredients(recipe.ingredients);
    const cleanedInstructions = parseInstructions(recipe.instructions);

    return (
      <div className="recipe-card">
        <h2 className="recipe-title">{cleanText(recipe.name)}</h2>
        <div className="recipe-image-container">
          <img
            src={cleanImageUrl(recipe.image)}
            alt={cleanText(recipe.name)}
            className="recipe-image"
            style={{ width: '300px', height: '300px', objectFit: 'cover' }}
          />
        </div>

        <div className="recipe-stats">
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className="stat-value">{cleanText(recipe.total_time)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Calories</span>
            <span className="stat-value">{recipe.calories} kcal</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Protein</span>
            <span className="stat-value">{recipe.protein}g</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Category</span>
            <span className="stat-value">{cleanText(recipe.category)}</span>
          </div>
        </div>

        <div className="recipe-sections">
          <section>
            <h3>Description</h3>
            <p>{cleanText(recipe.description)}</p>
          </section>

          <section>
            <h3>Ingredients</h3>
            <ul>
              {cleanedIngredients.map((ingredient, idx) => (
                <li key={idx}>{ingredient}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Instructions</h3>
            <ol>
              {cleanedInstructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="nutrition-facts">
            <h3>Nutrition Facts</h3>
            <div className="nutrition-grid">
              <div className="nutrition-item">
                <span>Fat:</span>
                <span>{recipe.fat}g</span>
              </div>
              <div className="nutrition-item">
                <span>Fiber:</span>
                <span>{recipe.fiber}g</span>
              </div>
              <div className="nutrition-item">
                <span>Sodium:</span>
                <span>{recipe.sodium}mg</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>Recipe Preferences App</h1>
        </div>
      </nav>

      <main className="main-content">
        <div className="form-container">
          <h2>Set Your Recipe Preferences</h2>
          <form onSubmit={handleSubmit} className="preferences-form">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  Maximum Cook Time (minutes)
                  <input
                    type="number"
                    name="max_cook_time"
                    value={preferences.max_cook_time}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Maximum Calories
                  <input
                    type="number"
                    name="max_calories"
                    value={preferences.max_calories}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Recipe Category
                  <input
                    type="text"
                    name="recipe_category"
                    value={preferences.recipe_category}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Ingredient Restrictions (comma-separated)
                  <input
                    type="text"
                    name="ingredient_restrictions"
                    value={preferences.ingredient_restrictions}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                Find Recipes
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {response && response.recommended_recipes && (
          <div className="recipes-container">
            {response.recommended_recipes.map((recipe, index) => (
              <RecipeCard key={index} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
      <style jsx>{`
        .app {
          min-height: 100vh;
          background-color: #f5f5f5
        }

        .navbar {
          background-color: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1rem
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto
        }

        .navbar h1 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem
        }

        .form-container {
          background-color: white;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem
        }

        .form-group {
          display: flex;
          flex-direction: column
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem
        }

        .form-group input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem
        }

        .submit-button {
          background-color: #2563eb;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          cursor: pointer
        }

        .submit-button:hover {
          background-color: #1d4ed8
        }

        .recipe-card {
          background-color: white;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
        }

        .recipe-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem
        }

        .recipe-image-container {
          position: relative;
          width: 100%;
          height: 300px;
          margin-bottom: 1.5rem
        }

        .recipe-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px
        }

        .recipe-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem
        }

        .stat-item {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          text-align: center
        }

        .stat-label {
          display: block;
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem
        }

        .stat-value {
          font-weight: 500
        }

        .recipe-sections section {
          margin-bottom: 2rem
        }

        .recipe-sections h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem
        }

        .recipe-sections ul,
        .recipe-sections ol {
          padding-left: 1.5rem
        }

        .recipe-sections li {
          margin-bottom: 0.5rem
        }

        .nutrition-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem
        }

        .nutrition-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background-color: #f8f9fa;
          border-radius: 4px
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #ef4444;
          color: #dc2626;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem
        }
      `}</style>
    </div>
  )
}

export default App