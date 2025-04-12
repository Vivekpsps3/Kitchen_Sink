from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from src.recipe_provider import RecipeProvider
import uvicorn
import json
import traceback
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from db.pydanticTypes import Recipe
import db.supabaseWrapper as supabaseWrapper

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
    
@app.get("/recipes")
async def recipes():
    """
    Get all recipes from the database.
    """
    recipes = supabaseWrapper.get_recipes()
    return recipes

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("recipe_api_server:app", host="0.0.0.0", port=8000, reload=True)