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

if __name__ == "__main__":
    # Get query from command line arguments if provided
    query = sys.argv[1] if len(sys.argv) > 1 else "Poison Berry Stew with Lawn Frog"
    
    # Test health endpoint first
    health_status = test_health_endpoint()
    
    if not health_status:
        print("Warning: Health check failed, but continuing with recipe test...")
    
    # Test the recipe generation endpoint
    test_result = test_recipe_api(query)
    
    # Exit with appropriate status code
    sys.exit(0 if test_result and health_status else 1)