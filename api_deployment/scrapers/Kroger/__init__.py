import os
import base64
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
client_id = os.environ.get('KROGER_CLIENT_ID')
client_secret = os.environ.get('KROGER_CLIENT_SECRET')
# Kroger API integration example
coded_auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode('utf-8')

def getKrogerProductToken():
    try:
        request_body = "grant_type=client_credentials&scope=product.compact"
        response = requests.post(
            'https://api.kroger.com/v1/connect/oauth2/token', 
            data=request_body,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': f'Basic {coded_auth}'
            }
        )
        response.raise_for_status()
        return response.json()['access_token']
    except Exception as error:
        error_message = error.response.json() if hasattr(error, 'response') else str(error)
        print(f'Error fetching access token: {error_message}')
        raise

def getKrogerLocationToken(zipcode, token):
    try:
        response = requests.get(
            f'https://api.kroger.com/v1/locations?filter.zipcode.near={zipcode}&filter.radiusinMiles=50',
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': f'Bearer {token}'
            }
        )
        response.raise_for_status()

        return response.json()['data'][0]['locationId']
    except Exception as error:
        error_message = error.response.json() if hasattr(error, 'response') else str(error)
        print(f'Error fetching location data: {error_message}')
        raise

def getKrogerProductDetails(search_term, location_id, token, brand=''):
    try:
        params = {
            "filter.term": search_term,
            "filter.locationId": location_id
        }
        
        # Only include brand if it's provided
        if brand:
            params["filter.brand"] = brand
            
        response = requests.get(
            'https://api.kroger.com/v1/products',
            params=params,
            headers={
                'Accept': 'application/json',
                'Authorization': f'Bearer {token}'
            }
        )
        response.raise_for_status()
        data = response.json()
        
        # Filter for available products
        available_products = [
            item for item in data['data'] 
            if item.get('items') and any(
                stock.get('inventory', {}).get('stockLevel') != "TEMPORARILY_OUT_OF_STOCK" 
                and stock.get('fulfillment', {}).get('inStore') == True
                for stock in item['items']
            )
        ]
        
        # Sort by price
        available_products.sort(
            key=lambda x: x.get('items', [{}])[0].get('price', {}).get('regular', float('inf'))
        )
        
        available_products = refineKrogerProducts(available_products)
        return available_products
    
    except Exception as error:
        error_message = error.response.json() if hasattr(error, 'response') else str(error)
        print(f'Error fetching product details: {error_message}')
        raise 

def refineKrogerProducts(products):
    """
    Refine Kroger product data into a more usable format.
    
    Args:
        products (list): List of product dictionaries from Kroger API
        
    Returns:
        list: List of simplified product dictionaries
    """
    refined_products = []
    
    for product in products:
        # Get the first item in the items list (usually the main product variant)
        item = product.get('items', [{}])[0] if product.get('items') else {}
        
        # Extract price information
        price_info = item.get('price', {})
        price = price_info.get('regular', 0.0)
        price_formatted = f"${price:.2f}" if price else ""
        
        # Extract size information to calculate unit price
        size_info = item.get('size', "")
        unit_quantity = None
        unit_of_measure = None
        
        # Try to parse size information (e.g., "14 oz", "1 lb", etc.)
        if size_info:
            size_parts = size_info.split()
            if len(size_parts) >= 2:
                try:
                    unit_quantity = float(size_parts[0])
                    unit_of_measure = " ".join(size_parts[1:])
                except ValueError:
                    pass
        
        # Calculate unit price if possible
        unit_price = ""
        unit_price_suffix = ""
        if unit_quantity and price:
            # Convert to ounces if needed
            if "lb" in unit_of_measure.lower():
                unit_quantity *= 16  # 1 lb = 16 oz
                unit_of_measure = "oz"
            
            if unit_quantity > 0:
                unit_price_value = price / unit_quantity
                unit_price = f"${unit_price_value:.2f}"
                unit_price_suffix = f"/oz"
        
        # Create refined product dictionary
        refined_product = {
            "title": product.get('description', ""),
            "brand": product.get('brand', ""),
            "price": price,
            "price_formatted": price_formatted,
            "unit_price": unit_price,
            "unit_price_suffix": unit_price_suffix,
            "size": size_info,
            "categories": product.get('categories', []),
        }
        refined_product["provider"] = "Kroger"
        
        refined_products.append(refined_product)
    
    return refined_products

if __name__ == "__main__":
    import json
    token = getKrogerProductToken()
    location = getKrogerLocationToken(47906, token)
    raw_products = getKrogerProductDetails("tofu", location, token)
    
    # Refine the products
    refined_products = refineKrogerProducts(raw_products)
    
    # save the products to a json file
    with open('kroger_refined_products.json', 'w') as f:
        json.dump(refined_products, f, indent=4)

    # Print how many products were found
    print(f"Found {len(refined_products)} products")