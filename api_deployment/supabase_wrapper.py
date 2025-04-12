import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, Union, List, Dict, Any

load_dotenv()

url: str = os.environ.get("SUPABASE_PROJECT_URL")
key: str = os.environ.get("SUPABASE_PROJECT_API")
supabase: Client = create_client(url, key)

# Define a Product model based on scrapingInterface.json
class Product(BaseModel):
    provider: str
    itemName: str
    category: str
    brand: str
    price: float
    unitAmountOz: float

# Define a Recipe model based on your Supabase table
class Recipe(BaseModel):
    title: str
    cuisine: Optional[str] = None
    tags: Optional[Union[List[str], str]] = None
    ingredients: Optional[List[Dict[str, Any]]] = None
    steps: Optional[Union[List[str], str]] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = None
    notes: Optional[str] = None

def get_products():
    response = supabase.table("products").select("*").execute()
    return response.data

def get_recipes():
    response = supabase.table("recipes").select("*").execute()
    return response.data

def create_product(product: Product):
    # Check to make sure the product.itemName is not already in the database
    response = supabase.table("products").select("*").eq("itemName", product.itemName).execute()
    if response.data:
        return "Product already exists"
    else:
        response = supabase.table("products").insert(product.model_dump()).execute()
        return response.data

def create_recipe(recipe: Recipe):
    """
    Create a new recipe in the Supabase database.
    
    Args:
        recipe: A Recipe object containing all recipe data
        
    Returns:
        The created recipe data or an error message
    """
    response = supabase.table("recipes").select("*").eq("title", recipe.title).execute()
    
    if response.data:
        return "Recipe with this title already exists"
    
    recipe_data = recipe.model_dump()
    
    if isinstance(recipe_data.get('tags'), str):
        try:
            import json
            recipe_data['tags'] = json.loads(recipe_data['tags'])
        except:
            pass
            
    if isinstance(recipe_data.get('steps'), str):
        try:
            import json
            recipe_data['steps'] = json.loads(recipe_data['steps'])
        except:
            pass
    response = supabase.table("recipes").insert(recipe_data).execute()
    return response.data

if __name__ == "__main__":
    product = Product(
        provider="Target",
        itemName="Good and Gather Carrots",
        category="Carrots",
        brand="Good and Gather",
        price=3.99,
        unitAmountOz=12
    )
    
    print(create_product(product))

    products = get_products()
    for product in products:
        print(product['itemName'])
    
    # Test recipe creation with sample data
    recipe = Recipe(
        title="Indo-Chinese Fusion: Szechuan Chicken Tikka Masala",
        cuisine="Fusion (Indian & Chinese)",
        tags=["Chicken", "Spicy", "Fusion", "Indian", "Chinese"],
        ingredients=[
            {"name": "Boneless, skinless chicken thighs", "amount": "1.5", "unit": "lbs", "notes": "Cut into 1-inch cubes"},
            {"name": "Plain yogurt", "amount": "1/2", "unit": "cup", "notes": "Full fat or Greek"},
            {"name": "Ginger-garlic paste", "amount": "2", "unit": "tablespoons", "notes": None},
            {"name": "Vegetable oil", "amount": "3", "unit": "tablespoons", "notes": None},
            {"name": "Onion", "amount": "1", "unit": None, "notes": "Finely chopped"},
            {"name": "Ginger-garlic paste", "amount": "1", "unit": "tablespoon", "notes": None},
        ],
        steps=[
            "In a bowl, combine all the marinade ingredients with the chicken cubes. Mix well, cover, and refrigerate for at least 3 hours, or preferably overnight.",
            "Preheat oven to 450°F (232°C). Place the marinated chicken on skewers or spread on a baking sheet.",
            "Bake for 15-20 minutes, or until the chicken is cooked through and slightly charred. Alternatively, you can grill the chicken on a skillet or air fry at 400F (200C) for 12-15 minutes, flipping halfway through.",
        ],
        prep_time_minutes=20,
        cook_time_minutes=45,
        servings=4,
        difficulty="Medium",
        notes="Adjust the amount of Szechuan peppercorns and dried chilies according to your spice preference. Marinating the chicken overnight will result in more flavorful and tender chicken. For a richer sauce, use ghee instead of vegetable oil."
    )
    
    print(create_recipe(recipe))