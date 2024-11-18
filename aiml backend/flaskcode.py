import logging

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

model = joblib.load('nearest_neighbors_model.pkl')


recipes_df = pd.read_csv('recipes.csv')


unique_categories = recipes_df['RecipeCategory'].unique()
category_mapping = {cat: idx for idx, cat in enumerate(unique_categories)}

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

logging.basicConfig(level=logging.DEBUG)

def prepare_features(preferences):
    max_cook_time = preferences['max_cook_time']
    max_calories = preferences['max_calories']
    recipe_category = preferences.get('recipe_category', '')

    category_value = category_mapping.get(recipe_category, 0)  # Default to 0 if category not found

    features = pd.DataFrame({
        'max_cook_time': [max_cook_time],
        'max_calories': [max_calories],
        'SaturatedFatContent': [0],
        'CholesterolContent': [0],
        'SodiumContent': [0],
        'CarbohydrateContent': [0],
        'FiberContent': [0],
        'ProteinContent': [0],
        'RecipeCategory': [category_value]
    })

    return features

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        app.logger.debug(f"Received data: {data}")

        if not data or 'preferences' not in data:
            return jsonify({'error': 'Invalid request format. Missing preferences.'}), 400

        preferences = data['preferences']
        required_fields = ['max_cook_time', 'max_calories', 'ingredient_restrictions']
        for field in required_fields:
            if field not in preferences:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        input_features = prepare_features(preferences)
        app.logger.debug(f"Prepared features: {input_features}")

        distances, indices = model.kneighbors(input_features, n_neighbors=5)
        app.logger.debug(f"Distances: {distances}, Indices: {indices}")

        recommended_recipes = recipes_df.iloc[indices[0]].copy()
        ingredient_restrictions = preferences['ingredient_restrictions']
        if ingredient_restrictions:
            for restriction in ingredient_restrictions:
                recommended_recipes = recommended_recipes[~recommended_recipes['RecipeIngredientParts'].str.contains(restriction, case=False, na=False)]

        if recommended_recipes.empty:
            return jsonify({'message': 'No recipes found matching your criteria.', 'recommended_recipes': []})

        formatted_recipes = []  # Format the response
        for _, recipe in recommended_recipes.iterrows():
            recipe_dict = recipe.to_dict()
            formatted_recipes.append({
                'name': recipe_dict['Name'],
                'description': recipe_dict['Description'],
                'ingredients': recipe_dict['RecipeIngredientParts'],
                'instructions': recipe_dict['RecipeInstructions'],
                'category': recipe_dict['RecipeCategory'],
                'image': recipe_dict['Images'],
                'total_time': recipe_dict.get('TotalTime', ''),
                'protein': recipe_dict.get('ProteinContent', 0),
                'fat': recipe_dict.get('FatContent', 0),
                'fiber': recipe_dict.get('FiberContent', 0),
                'sodium': recipe_dict.get('SodiumContent', 0),
                'calories': recipe_dict.get('Calories', 0)
            })

        return jsonify({'recommended_recipes': formatted_recipes, 'total_recommendations': len(formatted_recipes)})

    except Exception as e:
        app.logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': 'An error occurred while processing your request.', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
