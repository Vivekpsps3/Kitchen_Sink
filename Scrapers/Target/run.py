import requests
import json
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

# Target API configuration
base_url = "https://redsky.target.com/redsky_aggregations/v1/web/product_summary_with_fulfillment_v1"
api_key = "9f36aeafbe60771e321a7cc95a78140772ab3e96"
tcins = ["90381165", "90381177", "90471876", "90471877", "90471880"]
store_id = "3230"
location = {
    "zip": "36100",
    "state": "GJ",
    "latitude": "22.460",
    "longitude": "70.100"
}
membership = {
    "paid_membership": "false",
    "base_membership": "false",
    "card_membership": "false"
}
visitor_id = "0194F4E0DFAF0201AF5763C5231A9B09"
channel = "WEB"
page = "/p/A-90381178"

# Build the API URL dynamically
params = {
    "key": api_key,
    "tcins": "%2C".join(tcins),
    "store_id": store_id,
    "zip": location["zip"],
    "state": location["state"],
    "latitude": location["latitude"],
    "longitude": location["longitude"],
    "paid_membership": membership["paid_membership"],
    "base_membership": membership["base_membership"],
    "card_membership": membership["card_membership"],
    "required_store_id": store_id,
    "visitor_id": visitor_id,
    "channel": channel,
    "page": page
}

# Construct the URL with parameters
api_url = f"{base_url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"

try:
    # Fetch product URLs from API
    response = requests.get(api_url, headers=headers)
    data = json.loads(response.text)
    
    urls = [product["item"]["enrichment"]["buy_url"] 
            for product in data.get("data", {}).get("product_summaries", []) 
            if product.get("item", {}).get("enrichment", {}).get("buy_url")]
    
    product_details = []
    pattern = r'__TGT_DATA__\':\s*{\s*configurable:\s*false,\s*enumerable:\s*true,\s*value:\s*deepFreeze\(JSON\.parse\("(.*?)"\)\)'

    for url in urls:
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            match = re.search(pattern, response.text, re.DOTALL)
            if match:
                json_str = match.group(1)
                json_str = json_str.encode('utf-8').decode('unicode_escape')
                product_json = json.loads(json_str)
                
                # Extract product details
                queries = product_json.get("__PRELOADED_QUERIES__", {}).get("queries", [])
                product_data = queries[3][1].get("data", {}).get("product", {}) if len(queries) > 3 else {}

                product_info = product_data.get("item", {}).get("product_description", {})
                price_info = product_data.get("price", {})
                ratings_info = product_data.get("ratings_and_reviews", {}).get("statistics", {})

                # Ratings breakdown (if available)
                rating_breakdown = ratings_info.get("rating_distribution", {})
                total_reviews = sum(rating_breakdown.values()) if rating_breakdown else 0
                
                product_details.append({
                    "name": product_info.get("title", "N/A"),
                    "description": product_info.get("downstream_description", "No description available"),
                    "features": product_info.get("soft_bullets", {}).get("bullets", []),
                    "price": price_info.get("current_retail", "N/A"),
                    "ratings": {
                        "average_rating": ratings_info.get("rating", "No ratings"),
                    },
                    "url": url
                })
                print(f"✅ Processed: {url}")

        except Exception as e:
            print(f"Error processing {url}: {e}")

    # Save all product details
    with open("target_data.json", "w", encoding="utf-8") as f:
        json.dump(product_details, f, indent=4, ensure_ascii=False)
    print("All data saved to target_data.json")

except Exception as e:
    print(f"Error: {str(e)}")