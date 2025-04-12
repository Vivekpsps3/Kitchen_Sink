from fastapi import FastAPI, HTTPException, Request, Query
from pydantic import BaseModel
from src.recipe_provider import RecipeProvider
import uvicorn
import json
import traceback
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from db.pydanticTypes import Recipe, Product
import db.supabaseWrapper as supabaseWrapper
from scrapers import getProducts
from enum import Enum
from typing import Optional

app = FastAPI(title="Recipe Generation API", 
              description="API for generating recipes based on user queries")

# Add CORS middleware to allow any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = {
        "error": str(exc),
        "type": type(exc).__name__,
        "traceback": traceback.format_exc()
    }
    return JSONResponse(
        status_code=500,
        content={"detail": error_detail}
    )

recipe_provider = RecipeProvider()

class RecipeQuery(BaseModel):
    query: str

class RecipeResponse(BaseModel):
    title: str
    content: str

@app.post("/generate-recipe", response_model=RecipeResponse)
async def generate_recipe(recipe_query: RecipeQuery):
    """
    Generate a recipe based on the provided query.
    
    Returns a JSON object containing the recipe title and content.
    """
    try:
        # Generate recipe based on the query
        recipe_content = recipe_provider.generate_recipe_for_query(recipe_query.query)
        
        # Process the response - either parse JSON string or use dict directly
        if isinstance(recipe_content, str):
            try:
                recipe_data = json.loads(recipe_content)
            except json.JSONDecodeError as e:
                raise HTTPException(
                    status_code=500, 
                    detail={
                        "error": "Invalid JSON response from recipe provider",
                        "raw_content": recipe_content[:500],  # First 500 chars for debugging
                        "exception": str(e)
                    }
                )
        else:
            recipe_data = recipe_content
        
        # Check if the response is a valid JSON object
        if not isinstance(recipe_data, dict):
            raise HTTPException(
                status_code=500, 
                detail={
                    "error": "Response is not a valid JSON object",
                    "type": type(recipe_data).__name__,
                    "content_preview": str(recipe_data)[:500] if recipe_data else "None"
                }
            )
        
        # Validate required fields
        if "title" not in recipe_data or "content" not in recipe_data:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Missing required fields in recipe data",
                    "received_fields": list(recipe_data.keys()),
                    "required_fields": ["title", "content"]
                }
            )
        
        # Format the content to ensure it's a string
        if isinstance(recipe_data["content"], list):
            recipe_data["content"] = "\n".join(recipe_data["content"])
        elif not isinstance(recipe_data["content"], str):
            recipe_data["content"] = str(recipe_data["content"])
        # Ensure the title is a string
        if not isinstance(recipe_data["title"], str):
            recipe_data["title"] = str(recipe_data["title"])        
        # Return the formatted recipe
        return recipe_data
    
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Error decoding JSON response from recipe generation",
                "exception": str(e)
            }
        )
        
    except Exception as e:
        # Let the global handler catch this
        raise

class IngredientsList(BaseModel):
    ingredients: list[str]

@app.post("/generate-shopping-list")
async def generate_shopping_list(ingredients_list: IngredientsList):
    """
    Generate a shopping list based on the provided ingredients list.
    
    Returns a JSON object containing the organized shopping list.
    """
    try:
        shopping_list = recipe_provider.generate_shopping_list_from_ingredients(ingredients_list.ingredients)
        return shopping_list
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})
    

@app.post("/recipe")
async def recipe(recipe: Recipe):
    """
    Generate a recipe based on the provided recipe.
    """
    # Use the supabaseWrapper to create the recipe
    recipeResult = supabaseWrapper.create_recipe(recipe)
    if "error" in recipeResult:
        raise HTTPException(status_code=500, detail={"error": recipeResult["error"]})
    else:
        return {"status": "Recipe created successfully"}

@app.get("/recipe/{recipe_id}")
async def recipe(recipe_id: str):
    """
    Get a recipe from the database.
    """
    recipe = supabaseWrapper.get_recipe(recipe_id)
    if "error" in recipe:
        raise HTTPException(status_code=500, detail={"error": recipe["error"]})
    else:
        return recipe

class SortType(str, Enum):
    POPULAR = "popular"
    NEWEST = "newest"
    OLDEST = "oldest"

@app.get("/recipes")
async def recipes(
    sort_type: Optional[SortType] = Query("newest", description="How to sort the recipes (popular, newest, oldest)"),
    limit: Optional[int] = Query(10, description="Maximum number of recipes to return", gt=0),
    page: Optional[int] = Query(1, description="Page number for pagination", gt=0)
):
    """
    Get recipes from the database with optional pagination and sorting.
    
    Parameters:
    - sort_type: How to sort the recipes (popular, newest, oldest)
    - limit: Maximum number of recipes to return (default: 10)
    - page: Page number for pagination (default: 1)
    
    Returns a JSON object containing the recipes and pagination metadata.
    """
    # Calculate offset for pagination
    offset = (page - 1) * limit
    
    # Get recipes with pagination and sorting
    recipes_result = supabaseWrapper.get_recipes(
        sort_type=sort_type.value if sort_type else None,
        limit=limit,
        offset=offset
    )
    
    # If the supabaseWrapper doesn't return pagination metadata,
    # we can add it here
    if isinstance(recipes_result, list):
        return {
            "data": recipes_result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(recipes_result)  # This would ideally come from the database
            }
        }
    
    return recipes_result

@app.get("/featuredRecipes")
async def featuredRecipes():
    """
    Get the featured recipes for today.
    """
    recipes = supabaseWrapper.get_featured_recipes()
    if "error" in recipes:
        raise HTTPException(status_code=500, detail={"error": recipes["error"]})
    else:
        return recipes

class ProductQuery(BaseModel):
    product_name: str
    zip_code: str

@app.post("/scrapeIngredients")
async def scrapeIngredients(product_query: ProductQuery):
    """
    Scrape product information based on product name and zip code.
    
    Accepts a JSON body with product_name and zip_code fields.
    """
    products = getProducts(product_query.product_name, product_query.zip_code)
    uploaded_products = []
    for product in products:
        try:
            # unitAmountInOunces must be set to unitAmountOz
            product["unitAmountOz"] = product["unitAmountInOunces"]
            del product["unitAmountInOunces"]
            # make sure the product is formatted correctly
            product["provider"] = product["provider"].strip()
            product["itemName"] = product["itemName"].strip()
            product["category"] = product["category"].strip()
            product["brand"] = product["brand"].strip()
            product["unitAmountOz"] = float(product["unitAmountOz"])
            product["price"] = float(product["price"])

            product = Product(**product)

            # Add the product to the database
            upload_result = supabaseWrapper.create_product(product)
            if upload_result["error"]:
                print(f"Error uploading product! {upload_result['error']}")
            else:
                uploaded_products.append(product)
        except Exception as e:
            print(f"Error uploading product! {e}")
    return uploaded_products

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)