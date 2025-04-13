import requests
from bs4 import BeautifulSoup
import os
from google import genai
from dotenv import load_dotenv
from typing import Dict, Any, List
import json
from src.recipe_scraper import RecipeScraper

class RecipeProvider:
    def __init__(self):
        self.api_key = self._load_api_key()
        self.client = self._initialize_client()
        self.scraper = RecipeScraper(num_results=5)  # Get 3 recipes for better context

    def _load_api_key(self) -> str:
        """Load and return the API key from environment variables."""
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        return api_key

    def _initialize_client(self) -> genai.Client:
        """Initialize and return a genai client."""
        return genai.Client(api_key=self.api_key)

    def _generate_search_query(self, query: str) -> str:
        """Given a query, use an LLM to generate a search query that will yield better results."""
        prompt = f"""
        Given the recipe query "{query}, pick one specific dish that is most likely to yield the best results.
        The dish should be a specific recipe name, not a general category.
        For example, instead of "pasta", use "spaghetti carbonara recipe".
        The output should be a single string, no explanations or extra text.
        """
        response = self.client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )
        return response.text.strip()
        # For debugging
        with open('search_query.txt', 'w') as f:
            f.write(response.text.strip())


    def _create_prompt(self, query: str, scraped_recipes_text: str) -> str:
        """Create a prompt for Gemini based on the scraped recipes."""
        prompt = f"""
        I've found several recipes for "{query}". Here's the scraped information:

        {scraped_recipes_text}

        Based on these recipes, create a new unique recipe for "{query}" that:
        1. Combines the best elements from these recipes
        2. Has an accurate yet descriptive title
        3. Includes a complete ingredient list with measurements
        4. Provides clear step-by-step instructions
        5. Suggests a serving size
        6. Includes prep time and cooking time
        7. Uses a tone that is easy to understand and descriptive
        8. Includes appropriate tags (like 'vegetarian', 'quick', etc.)
        9. Suggests a cuisine type if applicable

        Format the response as a valid JSON object with the following fields:
        """
        with open('recipe_template.json', 'r') as f:
            template = f.read()
        prompt += template
        return prompt
    
    def _generate_recipe_json(self, prompt: str) -> Dict[str, Any]:
        """Generate a recipe using Gemini and return it as JSON."""
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        response = response.text.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()

        # For debugging
        with open('response.json', 'w') as f:
            f.write(response)
            
        # Parse the response to JSON
        try:
            recipe_json = json.loads(response)
        except json.JSONDecodeError:
            raise ValueError(f"Error decoding JSON: {response}")
        return recipe_json
    
    def generate_shopping_list(self, recipe: Dict[str, Any]) -> List[str]:
        """Generate a shopping list from the recipe JSON."""
        ingredients = recipe.get("ingredients", [])
        shopping_list = []
        
        for ingredient in ingredients:
            # Extract the ingredient name and quantity
            if isinstance(ingredient, str):
                shopping_list.append(ingredient)
            elif isinstance(ingredient, dict):
                name = ingredient.get("name", "")
                quantity = ingredient.get("quantity", "")
                if name and quantity:
                    shopping_list.append(f"{quantity} of {name}")
        
        return shopping_list

    def generate_shopping_list_from_ingredients(self, ingredients: List[str]) -> Dict[str, Any]:
        """
        Generate an organized shopping list from a list of ingredients using Gemini.
        
        Args:
            ingredients: List of ingredient strings (e.g., "2 cups butter", "1 cup milk")
            
        Returns:
            Dict containing the organized shopping list
        """
        # Create prompt for Gemini
        ingredients_text = "\n".join(ingredients)
        prompt = f"""
        I need to create a shopping list based on these ingredients from a recipe:
        
        {ingredients_text}
        
        Please organize these ingredients into a shopping list that:
        1. Combines similar ingredients (e.g., if multiple items need milk, show the total amount)
        2. Groups ingredients by category (produce, dairy, grains, etc.)
        3. Do not include any extra text or explanations or superlatives - (Eg. Boneless chicken breast should just be Chicken breast)
        4. Ensures quantities are clear and consistent
        5. Includes both the ingredient name and total amount needed
        6. Ingredient quantities must be given in ounces
        7. You must convert to ounces if needed
        
        Format the response as a valid JSON object matching this structure:
        """
        # Read the shopping list template
        with open('shopping_list.json', 'r') as f:
            template = f.read()
        prompt += template
        
        # Generate the shopping list using Gemini
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        response_text = response.text.strip()
        
        # Clean up the response if needed
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse the response to JSON
        try:
            shopping_list_json = json.loads(response_text)
        except json.JSONDecodeError:
            # If we can't parse the JSON, return a formatted error
            raise ValueError(f"Error generating shopping list: Invalid JSON response")
            
        return shopping_list_json

    def generate_recipe_for_query(self, query: str) -> Dict[str, Any]:
        """Generate a recipe for the given query using the scraper for context."""
        try:
            # Generate a more specific search query
            search_query = self._generate_search_query(query)
            print(f"Generated search query: {search_query}")

            # Use the recipe scraper to get detailed recipe information
            scraped_recipes_text = self.scraper.get_recipe(search_query)
            
            # If no recipes found, return a basic message
            if not scraped_recipes_text or "Failed to extract" in scraped_recipes_text:
                print("Warning: Limited recipe information found.")
            
            # Create a prompt with the scraped recipe context
            prompt = self._create_prompt(query, scraped_recipes_text)
            
            # Generate the recipe using the LLM
            return self._generate_recipe_json(prompt)
            
        except Exception as e:
            print(f"Error generating recipe: {str(e)}")
            # Return a basic error response
            return {
                "recipe": {
                    "title": f"Error generating {query} recipe",
                    "ingredients": [],
                    "steps": [f"Error: {str(e)}"],
                }
            }

def main() -> None:
    # Test the recipe provider
    query = "chicken curry"
    provider = RecipeProvider()   
    recipe = provider.generate_recipe_for_query(query)
    print(json.dumps(recipe, indent=2))

if __name__ == "__main__":
    main()
