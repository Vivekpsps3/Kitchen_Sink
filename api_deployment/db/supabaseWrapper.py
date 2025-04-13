import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv
from .pydanticTypes import Product, Recipe

load_dotenv()

url: str = os.environ.get("SUPABASE_PROJECT_URL")
key: str = os.environ.get("SUPABASE_PROJECT_API")
supabase: Client = create_client(url, key)

def get_all_products():
    response = supabase.table("products").select("*").execute()
    return response.data

def get_products(ingredient: str, minimum_amount: float):
    # Use ilike on both category and itemName to find partial matches
    response = supabase.table("products").select("*")\
        .ilike("category", f"%{ingredient}%")\
        .ilike("itemName", f"%{ingredient}%")\
        .gt("unitAmountOz", minimum_amount).execute()
    if response.data:
        # Select the most cost effective product by calculating unitAmountOz / price
        for product in response.data:
            product["unitCost"] = product["price"] / product["unitAmountOz"]

        # Return one product with the lowest unit cost per provider
        product_list = {}
        for product in response.data:
            if product["provider"] not in product_list:
                product_list[product["provider"]] = product
            else:
                if product["unitCost"] < product_list[product["provider"]]["unitCost"]:
                    product_list[product["provider"]] = product
        return product_list
    else:
        return {"error": "No products found", "data": []}

def get_recipes(sort_type: str, limit: int, offset: int, search: str = None):
    """
    Get recipes from the database with optional pagination, sorting, and search.
    
    Args:
        sort_type: How to sort the recipes (popular, newest, oldest)
        limit: Maximum number of recipes to return
        offset: Offset for pagination
        search: Optional search term to filter recipes
        
    Returns:
        List of recipes or error message
    """
    # Start building the query
    query = supabase.table("recipes").select("*")
    
    # Apply search filter if provided
    if search and search.strip():
        # Search in title (case-insensitive)
        query = query.ilike("title", f"%{search}%")
        # Note: For more advanced search across multiple fields or related tables,
        # you would need to use a more complex query or a dedicated search service
    
    # Apply sorting
    if sort_type == "popular":
        query = query.order("likes", desc=True)
    elif sort_type == "newest":
        query = query.order("created_at", desc=True)
    elif sort_type == "oldest":
        query = query.order("created_at", desc=False)
    else:
        return {"error": "Invalid sort type"}
    
    # Apply pagination
    query = query.limit(limit).offset(offset)
    
    # Execute the query
    response = query.execute()
    data = response.data

    # Go through data and get the comments for each recipe
    for recipe in data:
        comments = get_comments(recipe["id"])
        recipe["comments"] = comments

    return data

def get_comments(recipe_id: str):
    recipe_id = int(recipe_id)
    response = supabase.table("comments").select("*").eq("recipe_id", recipe_id).execute()
    return response.data

def get_recipe(recipe_id: str):
    response = supabase.table("recipes").select("*").eq("id", recipe_id).execute()
    return response.data

def create_product(product: Product):
    """
    Create a new product in the Supabase database.
    
    Args:
        product: A Product object containing all product data
        
    Returns:
        The created product data or an error message
    """
    try:
        # Check to make sure the product.itemName is not already in the database for the given brand and provider
        response = supabase.table("products").select("*").eq("itemName", product.itemName).eq("brand", product.brand).eq("provider", product.provider).execute()
        if response.data:
            return {"error": "Product already exists", "status": ""}
        else:
            response = supabase.table("products").insert(product.model_dump()).execute()
            print(f"Product created: {product.itemName}")
            # Return as a dictionary   
            return {"error": None, "status": "Product created successfully"}
    except Exception as e:
        # Return a more helpful error message
        return {"error": f"Failed to create product: {str(e)}", "status": ""}

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

def search_recipe(query: str):
    response = supabase.table("recipes").select("*").ilike("title", f"%{query}%").execute()
    return response.data

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