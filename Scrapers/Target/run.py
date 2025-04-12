import pandas as pd
import requests
import json
import time
from urllib.parse import quote

# Create a session to maintain cookies
s = requests.session()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
})

# Initialize session by visiting Target homepage
s.get('https://www.target.com')

# Extract necessary cookies
key = s.cookies.get('visitorId')
location = s.cookies.get('GuestLocation', '').split('|')[0]

if not key or not location:
    print("Failed to get necessary cookies. Trying alternate method...")
    # Alternative method - use the hardcoded key from the gist
    key = 'ff457966e64d5e877fdbad070f276d18ecec4a01'
    # Default to a common location if not available
    location = location or '55403'  # Minneapolis, MN

# Get nearest store information
try:
    store_response = requests.get(
        f'https://redsky.target.com/v3/stores/nearby/{location}?key={key}&limit=1&within=100&unit=mile'
    )
    store_data = store_response.json()
    store_id = store_data[0]['locations'][0]['location_id']
except Exception as e:
    print(f"Error getting store information: {e}")
    # Fallback to a default store ID if needed
    store_id = '1859'  # Example store ID

# Product to search for
product_id = '52190951'  # Replace with your desired product TCIN

# Build the Redsky API URL for product information
# Using the fulfillment endpoint from the gist for more detailed information
base_url = 'https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1'
params = {
    'key': key,
    'tcin': product_id,
    'store_id': store_id,
    'store_positions_store_id': store_id,
    'has_store_positions_store_id': 'true',
    'zip': location,
    'pricing_store_id': store_id,
    'has_pricing_store_id': 'true',
    'is_bot': 'false'
}

# Add delay to avoid rate limiting
time.sleep(1)

try:
    # Make the API request
    response = requests.get(base_url, params=params)
    response.raise_for_status()  # Raise exception for 4XX/5XX responses
    
    # Parse the JSON response
    jsonData = response.json()
    
    # Extract product information
    product_data = jsonData.get('data', {}).get('product', {})
    
    # Get fulfillment information
    fulfillment = product_data.get('fulfillment', {})
    
    # Create DataFrame with product availability information
    availability_data = {
        'product_id': product_id,
        'out_of_stock_all_locations': fulfillment.get('is_out_of_stock_in_all_store_locations', True),
    }
    
    # Add store availability if available
    store_options = fulfillment.get('store_options', [])
    if store_options:
        store = store_options[0]
        availability_data.update({
            'store_name': store.get('location_name'),
            'store_id': store.get('location_id'),
            'available_quantity': store.get('location_available_to_promise_quantity', 0),
            'pickup_status': store.get('order_pickup', {}).get('availability_status'),
            'in_store_status': store.get('in_store_only', {}).get('availability_status')
        })
    
    # Add shipping availability
    shipping = fulfillment.get('shipping_options', {})
    availability_data.update({
        'shipping_status': shipping.get('availability_status'),
        'shipping_quantity': shipping.get('available_to_promise_quantity', 0)
    })
    
    # Create DataFrame
    df = pd.DataFrame([availability_data])
    
    # Print results
    print(f"Product {product_id} availability:")
    print(df)
    
    # Optionally save to CSV
    # df.to_csv(f'target_product_{product_id}.csv', index=False)
    
except requests.exceptions.RequestException as e:
    print(f"Error making API request: {e}")
except json.JSONDecodeError as e:
    print(f"Error parsing JSON response: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
