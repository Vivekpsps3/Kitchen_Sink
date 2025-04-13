#!/usr/bin/env python3
import requests
import json
import sys

def test_recipe_api(query="pasta with tomato sauce"):
    """
    Test the recipe generation API by sending a request and validating the response.
    
    Args:
        query (str): The recipe query to send to the API
    
    Returns:
        bool: True if the test passed, False otherwise
    """
    # API endpoint
    url = "http://localhost:8000/generate-recipe"
    
    # Prepare the request payload
    payload = {"query": query}
    headers = {"Content-Type": "application/json"}
    
    print(f"Testing API with query: '{query}'")
    
    try:
        # Send POST request to the API
        response = requests.post(url, json=payload, headers=headers)
        
        # Check if request was successful
        response.raise_for_status()
        
        # Get the response data
        response_data = response.json()
        
        # Validate the response structure
        if not isinstance(response_data, dict):
            print("Error: Response is not a valid JSON object")
            return False
            
        # Check for required fields based on RecipeResponse model
        required_fields = ["title", "content"]
        for field in required_fields:
            if field not in response_data:
                print(f"Error: Response missing required field '{field}'")
                return False
                
        # Print success message with response data
        print("Test passed! API returned valid response:")
        print(f"Title: {response_data['title']}")
        print(f"Content preview: {response_data['content'][:100]}...")
        
        # Save it as a JSON file
        with open("generated_recipe.json", "w") as f:
            json.dump(response_data, f, indent=4)
        print("Generated recipe saved to 'generated_recipe.json'")

        return True
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the server is running.")
        return False
    except requests.exceptions.HTTPError as e:
        print(f"Error: HTTP request failed with status code {response.status_code}")
        print(f"Response: {response.text}")
        
        # Additional diagnostics for 500 errors
        if response.status_code == 500:
            print("\nDetailed error diagnostics:")
            try:
                error_data = response.json()
                if 'detail' in error_data:
                    print(f"Server error details: {error_data['detail']}")
            except json.JSONDecodeError:
                print(f"Raw server error (not JSON): {response.text}")
                
            # Try making a simpler request to get more server info
            try:
                print("\nAttempting to get more detailed server error information...")
                # Make a direct request with minimal processing
                import http.client
                conn = http.client.HTTPConnection("localhost", 8000)
                conn.request("POST", "/generate-recipe", json.dumps(payload), headers)
                raw_response = conn.getresponse()
                print(f"Raw status: {raw_response.status} {raw_response.reason}")
                raw_data = raw_response.read().decode()
                print(f"Raw response data: {raw_data}")
                conn.close()

                # Check if server has debug mode enabled
                print("\nChecking if the server has debug logs...")
                sys_info_response = requests.get("http://localhost:8000/docs")
                if sys_info_response.status_code == 200:
                    print("Server has Swagger UI enabled. Check server logs for more details.")
            except Exception as debug_error:
                print(f"Error during additional diagnostics: {str(debug_error)}")
                
        return False
    except json.JSONDecodeError:
        print("Error: Response is not valid JSON")
        print(f"Raw response: {response.text}")
        return False
    except Exception as e:
        print(f"Error: Unexpected exception: {str(e)}")
        return False

def test_health_endpoint():
    """Test the health check endpoint of the API."""
    url = "http://localhost:8000/health"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "healthy":
            print("Health check passed: API is healthy")
            return True
        else:
            print(f"Health check failed: Unexpected response - {data}")
            return False
    except Exception as e:
        print(f"Health check failed: {str(e)}")
        return False

def test_shopping_list():
    """
    Test the shopping list generation API by sending a request with sample ingredients.
    
    Returns:
        bool: True if the test passed, False otherwise
    """
    # API endpoint
    url = "http://localhost:8000/generate-shopping-list"
    
    # Sample ingredient list
    # Load ingredients from the response JSON file
    try:
        with open("../response.json", "r") as f:
            response_data = json.load(f)
        
        # Extract ingredients from all sections
        sample_ingredients = []
        ingredient_sections = response_data.get("content", {}).get("recipe", {}).get("ingredient_sections", [])
        
        for section in ingredient_sections:
            for ingredient in section.get("ingredients", []):
                # Format ingredient string similar to original sample
                amount = ingredient.get("amount", "")
                unit = ingredient.get("unit", "")
                name = ingredient.get("name", "")
                notes = ingredient.get("notes", "")
                
                # Format the ingredient string
                ingredient_str = f"{amount} {unit} {name}"
                if notes:
                    ingredient_str += f", {notes}"
                
                sample_ingredients.append(ingredient_str.strip())
        
        # If no ingredients found, use default list
        if not sample_ingredients:
            sample_ingredients = [
                "2 cups all-purpose flour",
                "1 cup unsalted butter, softened",
                "1 cup granulated sugar",
                "2 large eggs",
                "1 teaspoon vanilla extract",
                "1/2 teaspoon baking powder",
                "1/4 teaspoon salt",
                "1/2 cup milk"
            ]
            print("No ingredients found in response.json, using default ingredients")
        else:
            print(f"Loaded {len(sample_ingredients)} ingredients from response.json")
    
    except (FileNotFoundError, json.JSONDecodeError) as e:
        # Use default ingredients if response.json doesn't exist or can't be parsed
        sample_ingredients = [
            "2 cups all-purpose flour",
            "1 cup unsalted butter, softened",
            "1 cup granulated sugar",
            "2 large eggs",
            "1 teaspoon vanilla extract",
            "1/2 teaspoon baking powder",
            "1/4 teaspoon salt",
            "1/2 cup milk"
        ]
        print(f"Error loading response.json: {e}, using default ingredients")
    
    # Prepare the request payload
    payload = {"ingredients": sample_ingredients}
    headers = {"Content-Type": "application/json"}
    
    print("Testing shopping list API with sample ingredients")
    
    try:
        # Send POST request to the API
        response = requests.post(url, json=payload, headers=headers)
        
        # Check if request was successful
        response.raise_for_status()
        
        # Get the response data
        response_data = response.json()
        
        # Validate the response structure
        if not isinstance(response_data, dict):
            print("Error: Response is not a valid JSON object")
            return False
            
        # Check for the shopping_list field in the response
        if "shopping_list" not in response_data:
            print("Error: Response missing required field 'shopping_list'")
            return False
        
        # Check that shopping_list is a list
        if not isinstance(response_data["shopping_list"], list):
            print("Error: shopping_list is not a list")
            return False
            
        # Print success message with response data
        print("Test passed! API returned valid shopping list:")
        
        # Print a few items from the shopping list
        for i, item in enumerate(response_data["shopping_list"][:3]):
            if isinstance(item, dict):
                print(f"Item {i+1}: {item.get('ingredient', 'Unknown')} - {item.get('quantity', 'Unknown')}")
            else:
                print(f"Item {i+1}: {item}")
                
        print(f"Total items: {len(response_data['shopping_list'])}")
        
        # Save it as a JSON file
        with open("generated_shopping_list.json", "w") as f:
            json.dump(response_data, f, indent=4)
        print("Generated shopping list saved to 'generated_shopping_list.json'")

        return True
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the server is running.")
        return False
    except requests.exceptions.HTTPError as e:
        print(f"Error: HTTP request failed with status code {response.status_code}")
        print(f"Response: {response.text}")
        return False
    except json.JSONDecodeError:
        print("Error: Response is not valid JSON")
        print(f"Raw response: {response.text}")
        return False
    except Exception as e:
        print(f"Error: Unexpected exception: {str(e)}")
        return False

if __name__ == "__main__":
    # Get query from command line arguments if provided
    query = sys.argv[1] if len(sys.argv) > 1 else "Tasty Pesto Homemade Pasta"
    
    # Test health endpoint first
    health_status = test_health_endpoint()
    
    if not health_status:
        print("Warning: Health check failed, but continuing with tests...")
    
    # Test the recipe generation endpoint
    recipe_test_result = test_recipe_api(query)
    
    # Test the shopping list endpoint
    shopping_list_test_result = test_shopping_list()
    
    # Exit with appropriate status code
    sys.exit(0 if recipe_test_result and health_status and shopping_list_test_result else 1)