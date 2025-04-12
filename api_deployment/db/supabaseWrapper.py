import os
from supabase import create_client, Client
from dotenv import load_dotenv
from .pydanticTypes import Product, Recipe

load_dotenv()

url: str = os.environ.get("SUPABASE_PROJECT_URL")
key: str = os.environ.get("SUPABASE_PROJECT_API")
supabase: Client = create_client(url, key)

def get_products():
    response = supabase.table("products").select("*").execute()
    return response.data

def get_recipes(sort_type: str, limit: int, offset: int):
    if sort_type == "popular":
        response = supabase.table("recipes").select("*").order("likes", desc=True).limit(limit).offset(offset).execute()
        return response.data
    elif sort_type == "newest":
        response = supabase.table("recipes").select("*").order("created_at", desc=True).limit(limit).offset(offset).execute()
        return response.data
    elif sort_type == "oldest":
        response = supabase.table("recipes").select("*").order("created_at", desc=False).limit(limit).offset(offset).execute()
        return response.data
    else:
        return {"error": "Invalid sort type"}

def get_recipe(recipe_id: str):
    response = supabase.table("recipes").select("*").eq("id", recipe_id).execute()
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
        return {"error": "Recipe with this title already exists"}
    
    try:
        recipe_data = recipe.model_dump()
    except:
        return {"error": "Wrong recipe format!"}
    
    if isinstance(recipe_data.get('tags'), str):
        try:
            import json
            recipe_data['tags'] = json.loads(recipe_data['tags'])
        except:
            return {"error": "Error dumping tags"}
            
    if isinstance(recipe_data.get('steps'), str):
        try:
            import json
            recipe_data['steps'] = json.loads(recipe_data['steps'])
        except:
            return {"error": "Error dumping steps"}
        
    try:
        response = supabase.table("recipes").insert(recipe_data).execute()
        return response.data
    except:
        return {"error": "Error inserting recipe"}

def get_featured_recipes():
    response = supabase.table("recipes").select("*").eq("featured", True).execute()
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