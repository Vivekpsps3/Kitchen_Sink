# Example url
# https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&channel=WEB&count=24&default_purchasability_filter=true&include_dmc_dmr=true&include_sponsored=true&include_review_summarization=false&keyword=carrots&new_search=true&offset=0&page=%2Fs%2Fcarrots&platform=desktop&pricing_store_id=3309&scheduled_delivery_store_id=3309&spellcheck=true&store_ids=3309%2C1762%2C111%2C1366%2C1063&useragent=Mozilla%2F5.0+%28Macintosh%3B+Intel+Mac+OS+X+10_15_7%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F135.0.0.0+Safari%2F537.36&visitor_id=019603CB251B020186DC9640FEF301B9&zip=47906

import requests
import json
from scrapers.gemini import queryGemini, json_format
import time

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
        "count": 10,
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
    products = response.json()["data"]["search"]["products"]
    cleaned_products = []
    for product in products:
        # Extract basic product info
        refined_product = {
            "title": product.get("item", {}).get("product_description", {}).get("title", ""),
            "brand": product.get("item", {}).get("primary_brand", {}).get("name", ""),
            "price": product.get("price", {}).get("current_retail"),
            "price_formatted": product.get("price", {}).get("formatted_current_price", ""),
            "unit_price": product.get("price", {}).get("formatted_unit_price", ""),
            "unit_price_suffix": product.get("price", {}).get("formatted_unit_price_suffix", ""),        }
        
        # Extract bullet points
        bullet_descriptions = product.get("item", {}).get("product_description", {}).get("bullet_descriptions", [])
        soft_bullets = product.get("item", {}).get("product_description", {}).get("soft_bullets", {}).get("bullets", [])
        
        refined_product["bullet_descriptions"] = bullet_descriptions
        refined_product["soft_bullets"] = soft_bullets
        
        cleaned_products.append(refined_product)

    return cleaned_products

# Example usage
if __name__ == "__main__":
    # Default example
    SEARCH = "broccoli"
    ZIP_CODE = 47906
    response = getTargetProducts(SEARCH, ZIP_CODE)
    products = response["data"]["search"]["products"]
    
    # Export products to json file
    with open(f'{SEARCH}_{ZIP_CODE}.json', 'w') as f:
        json.dump(products, f, indent=2)

    # refined_products = refineProducts(products)
    # print(refined_products)
    
    # # Export to JSON file
    # with open(f'{SEARCH}_{ZIP_CODE}.json', 'w') as f:
    #     json.dump(refined_products, f, indent=2)