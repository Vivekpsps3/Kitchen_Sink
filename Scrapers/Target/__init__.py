# Example url
# https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&channel=WEB&count=24&default_purchasability_filter=true&include_dmc_dmr=true&include_sponsored=true&include_review_summarization=false&keyword=carrots&new_search=true&offset=0&page=%2Fs%2Fcarrots&platform=desktop&pricing_store_id=3309&scheduled_delivery_store_id=3309&spellcheck=true&store_ids=3309%2C1762%2C111%2C1366%2C1063&useragent=Mozilla%2F5.0+%28Macintosh%3B+Intel+Mac+OS+X+10_15_7%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F135.0.0.0+Safari%2F537.36&visitor_id=019603CB251B020186DC9640FEF301B9&zip=47906

import requests
import json
from Scrapers.gemini import queryGemini
import time

json_format = '''{
  "provider": "store (this should be the provider of the product, ex: Target, Walmart, etc.)",
  "itemName": "itemName (this should be the name of the product, ex: Good and Gather Carrots, Birds Eye Frozen Broccoli Florets, etc.)",
  "category": "category (this should be the category of the product, ex: Carrots, Frozen Pizzas, etc.)",
  "brand": "brand (this should be the brand of the product, ex: Target, Birds Eye, etc.)",
  "price": "price (this should be the price of the product, do not include the price in the unit. ex: $3.99, $1.99, etc.)",
  "unit": "unit (this should be the unit of measure for the product, do not include the price in the unit. ex: 12oz, 1lb, 100g, etc.)"
}
'''

def getTargetProducts(keyword, zip_code):
    """
    Query Target's API for products based on keyword and zip code.
    
    Args:
        keyword (str): Search term for products
        zip_code (int or str): ZIP code for location-based results
        
    Returns:
        dict: JSON response from Target API
    """
    base_url = "https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2"
    params = {
        "key": "9f36aeafbe60771e321a7cc95a78140772ab3e96",
        "channel": "WEB",
        "count": 24,
        "default_purchasability_filter": "true",
        "include_dmc_dmr": "true",
        "include_sponsored": "true",
        "include_review_summarization": "false",
        "keyword": keyword,
        "new_search": "true",
        "offset": 0,
        "page": f"/s/{keyword}",
        "platform": "desktop",
        "pricing_store_id": 3309,
        "scheduled_delivery_store_id": 3309,
        "spellcheck": "true",
        "store_ids": "3309,1762,111,1366,1063",
        "useragent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "visitor_id": "019603CB251B020186DC9640FEF301B9",
        "zip": zip_code
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
    
    response = requests.get(base_url, params=params, headers=headers)
    return response.json()["data"]["search"]["products"]

def refineTargetProducts(products):
    refined_products = []
    for product in products:
        prompt = f"Extract the product name, price, and image URL from the following JSON: {product}. Return your response in the strict json format: {json_format}"
        # Wait for 0.25 seconds before querying Gemini
        time.sleep(0.25)    
        response = queryGemini(prompt, returnAsJson=True)
        refined_products.append(response)
    return refined_products

# Example usage
if __name__ == "__main__":
    # Default example
    SEARCH = "broccoli"
    ZIP_CODE = 47906
    response = getTargetProducts(SEARCH, ZIP_CODE)
    products = response["data"]["search"]["products"]
    refined_products = refineTargetProducts(products)
    print(refined_products)
    
    # Export to JSON file
    with open(f'{SEARCH}_{ZIP_CODE}.json', 'w') as f:
        json.dump(refined_products, f, indent=2)