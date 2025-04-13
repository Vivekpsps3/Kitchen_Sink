# Query scrapeIngredients.py to get the ingredients for a recipe

import requests

# List of ingredient names

ingredients = [
    "All-purpose flour",
    "Salt",
    "Unsalted butter",
    "Butter",
    "Ice water",
    "Apples",
    "Granulated sugar",
    "Brown sugar",
    "Cinnamon",
    "Nutmeg",
    "Lemon juice",
    "Orange juice",
    "Chicken thighs",
    "Eggs",
    "Cornstarch",
    "White pepper",
    "Red pepper flakes",
    "Vegetable oil",
    "Rice vinegar",
    "Soy sauce",
    "Ginger",
    "Garlic",
    "Orange zest",
    "Green onions",
    "Sesame oil",
    "Sesame Seeds"
]

final_ingredients = {
    "kroger": {},
    "target": {}
}

for ingredient in ingredients:
    response = requests.get(
        "http://localhost:8001/ingredients", 
        json={
            "ingredient": ingredient,
            "amount": 1.0,
            "unit": "ounces"
        }
    )
    result = response.json()
    
    # Store Target data if available
    if "Target" in result:
        final_ingredients["target"][ingredient] = result["Target"]
        print(f"Item found in Target: {ingredient}")
        pass
    else:
        response = requests.post("http://localhost:8001/scrapeIngredients", json={"product_name": ingredient, "zip_code": "47906"})
        print(response.json())