import requests
from bs4 import BeautifulSoup
from recipe_scrapers import scrape_me
import os
from google import genai
from dotenv import load_dotenv
from typing import Dict, Any
import json


class RecipeProvider:
    def __init__(self):
        self.api_key = self._load_api_key()
        self.client = self._initialize_client()

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

    def _generate_basic_recipe(self, query: str) -> Dict[str, Any]:
        """Generate a basic recipe if no recipes are found."""
        return {
            "title": f"Basic {query} Recipe",
            "ingredients": ["1 cup of basic ingredient", "2 cups of another ingredient"],
            "instructions": "Mix all ingredients together and cook until done.",
            "yields": "2 servings",
            "total_time": "30 minutes",
            "url": "N/A"
        }

    def _search_recipe(self, query: str) -> str:
        """Search for a recipe and return the first recipe URL or None if not found."""
        formatted_query = query.replace(' ', '+')
        search_url = f"https://www.allrecipes.com/search?q={formatted_query}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(search_url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')

        recipe_card = soup.select_one('a.card__titleLink')
        if recipe_card:
            link = recipe_card.get('href')
            if link and '/recipe/' in link:
                return link
        return None

    def _scrape_recipe(self, url: str) -> Dict[str, Any]:
        """Scrape a single recipe and return its data."""
        try:
            scraper = scrape_me(url)
            return {
                "title": scraper.title(),
                "ingredients": scraper.ingredients(),
                "instructions": scraper.instructions(),
                "yields": scraper.yields(),
                "total_time": scraper.total_time(),
                "url": url
            }
        except Exception as e:
            raise ValueError(f"Error scraping {url}: {e}")

    def _create_prompt(self, query: str, recipe: Dict[str, Any]) -> str:
        """Create a prompt for Gemini based on the scraped recipe."""
        prompt = f"""
        I've found a recipe for "{query}":

        Title: {recipe['title']}
        Ingredients: {', '.join(recipe['ingredients'])}
        Instructions: {recipe['instructions']}

        Based on this recipe, create a new unique recipe for "{query}" that:
        1. Combines the best elements from this recipe
        2. Has an accurate yet descriptive title
        3. Includes a complete ingredient list with measurements
        4. Provides clear step-by-step instructions
        5. Suggests a serving size
        6. Includes a total time for preparation and cooking
        7. Uses a tone that is easy to understand and descriptive

        Format the response as a valid JSON object with the following fields:
        """
        with open ('recipe_template.json', 'r') as f:
            template = f.read()
        prompt += template
        return prompt

    def _generate_recipe(self, prompt: str) -> str:
        """Generate a recipe using Gemini."""
        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text
    
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


        with open('response.json', 'w') as f:
            f.write(response)
        #Check if the response is a valid JSON object

        #Parse the response to JSON
        try:
            recipe_json = json.loads(response)
        except json.JSONDecodeError:
            raise ValueError(f"Error decoding JSON: {response}")
        return recipe_json
    

    def generate_recipe_for_query(self, query: str) -> str:
        """Generate a recipe for the given query."""
        recipe_url = self._search_recipe(query)
        if recipe_url:
            scraped_recipe = self._scrape_recipe(recipe_url)
        else:
            print("No recipes found. Generating a basic recipe instead.")
            scraped_recipe = self._generate_basic_recipe(query)
        
        prompt = self._create_prompt(query, scraped_recipe)
        return self._generate_recipe_json(prompt)

def main() -> None:
    """Main function to execute the recipe generation pipeline."""
    provider = RecipeProvider()
    query = input("What kind of recipe would you like to generate? ")
    new_recipe = provider.generate_recipe_for_query(query)
    
    print("\n" + "="*50)
    print("YOUR GENERATED RECIPE:")
    print("="*50)
    print(new_recipe)
    
    save_option = input("\nWould you like to save this recipe? (y/n): ")
    if save_option.lower() == 'y':
        filename = f"{query.replace(' ', '_')}_recipe.txt"
        with open(filename, 'w') as f:
            f.write(new_recipe)
        print(f"Recipe saved to {filename}")

if __name__ == "__main__":
    main()
