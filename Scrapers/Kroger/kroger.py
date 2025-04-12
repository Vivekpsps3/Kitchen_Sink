import os
import base64
import requests
from dotenv import load_dotenv
import pdb
# Load environment variables
load_dotenv()
client_id = os.environ.get('KROGER_CLIENT_ID')
client_secret = os.environ.get('KROGER_CLIENT_SECRET')
# Kroger API integration example
coded_auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode('utf-8')

def get_product_token():
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

def get_location_token(zipcode, token):
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
        pdb.set_trace()

        return response.json()['data'][0]['locationId']
    except Exception as error:
        error_message = error.response.json() if hasattr(error, 'response') else str(error)
        print(f'Error fetching location data: {error_message}')
        raise

def get_product_details(search_term, location_id, token, brand=''):
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
        
        return available_products
    except Exception as error:
        error_message = error.response.json() if hasattr(error, 'response') else str(error)
        print(f'Error fetching product details: {error_message}')
        raise 

if __name__ == "__main__":
    token = get_product_token()
    location = get_location_token(47906, token)
    products = get_product_details("carrots", location, token)
    print(products)