from googlesearch import search
import requests
from bs4 import BeautifulSoup
import re

class RecipeScraper:
    def __init__(self, num_results=5):
        self.num_results = num_results
    
    def _find_recipe_links(self, query):
        search_query = f"{query} recipe"
        return list(search(search_query, num_results=self.num_results))
    
    def _extract_recipe_details(self, url):
        headers = {'User-Agent': 'Mozilla/5.0'}
        try:
            response = requests.get(url, headers=headers, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')

            # Try finding ingredients
            ingredients = []
            for ul in soup.find_all(['ul', 'div'], class_=re.compile("ingredient", re.I)):
                for li in ul.find_all(['li', 'span']):
                    text = li.get_text(strip=True)
                    if text and len(text) > 3:
                        ingredients.append(text)
                if ingredients:
                    break  # Stop if found

            # Try finding instructions
            steps = []
            for ol in soup.find_all(['ol', 'div'], class_=re.compile("instruction|step|direction", re.I)):
                for li in ol.find_all(['li', 'p']):
                    text = li.get_text(strip=True)
                    if text and len(text) > 5:
                        steps.append(text)
                if steps:
                    break  # Stop if found

            return {
                "url": url,
                "ingredients": ingredients,
                "steps": steps
            }

        except Exception as e:
            return {"url": url, "error": str(e)}
    
    def get_recipe(self, query):
        """
        Takes a recipe query string and returns a formatted string of
        recipe details including ingredients and steps.
        """
        result_text = f"Results for: {query}\n\n"
        links = self._find_recipe_links(query)
        
        for i, link in enumerate(links, 1):
            result = self._extract_recipe_details(link)
            
            result_text += f"--- Recipe {i} ---\n"
            
            if "error" in result:
                result_text += f"Failed to extract from {result['url']}:\n{result['error']}\n\n"
                continue
            
            result_text += f"URL: {result['url']}\n\n"
            
            result_text += "Ingredients:\n"
            for ing in result['ingredients']:
                result_text += f"  - {ing}\n"
            
            result_text += "\nSteps:\n"
            for idx, step in enumerate(result['steps'], 1):
                result_text += f"  {idx}. {step}\n"
            
            result_text += "\n"
            
        return result_text

# # Example usage:
# scraper = RecipeScraper(num_results=3)
# recipe_info = scraper.get_recipe("chocolate chip cookies")
# print(recipe_info)
