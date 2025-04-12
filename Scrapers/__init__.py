import argparse
import json
import os
import sys

# Add the parent directory to sys.path to allow imports from the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Now import from Target
from Scrapers.Target import getTargetProducts
from Scrapers.Kroger import getKrogerProductToken, getKrogerLocationToken, getKrogerProductDetails
from Scrapers.gemini import queryGemini, json_format

def refineProducts(products):
    import time
    refined_products = []
    for product in products:
        prompt = f"Extract the product name, price, and image URL from the following JSON: {product}. Return your response in the strict json format: {json_format}"
        # Wait for 0.5 seconds before querying Gemini
        time.sleep(0.5)    
        response = queryGemini(prompt, returnAsJson=True)
        refined_products.append(response)
    return refined_products

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Search for products with zip code')
    parser.add_argument('product_name', type=str, help='Name of the product to search for')
    parser.add_argument('zip_code', type=str, help='Zip code for location-based search')

    # Parse arguments
    args = parser.parse_args()
    
    # Get products from Target
    rawTargetProducts = getTargetProducts(args.product_name, args.zip_code)
    refinedTargetProducts = refineProducts(rawTargetProducts)
    targetData = {
        "store": "target",
        "products": refinedTargetProducts
    }

    # Get products from Kroger
    krogerToken = getKrogerProductToken()
    krogerLocation = getKrogerLocationToken(args.zip_code, krogerToken)
    rawKrogerProducts = getKrogerProductDetails(args.product_name, krogerLocation, krogerToken)
    refinedKrogerProducts = refineProducts(rawKrogerProducts)
    krogerData = {
        "store": "kroger",
        "products": refinedKrogerProducts
    }
    
    # Create filename based on product name
    filename = f"{args.product_name.replace(' ', '_')}.json"

    # Create output dictionary with store information
    outputData = {
        "target": targetData.get("products"),
        "kroger": krogerData.get("products")
    }

    # Save to JSON file
    with open(filename, 'w') as f:
        json.dump(outputData, f, indent=4)
    
    print(f"Saved {len(refinedTargetProducts) + len(refinedKrogerProducts)} products to {filename}")
    
    # Display results
    for product in refinedTargetProducts:
        print(f"Name: {product.get('itemName', 'N/A')}")
        print(f"Price: {product.get('price', 'N/A')}")
        print("-" * 50)
    
    for product in refinedKrogerProducts:
        print(f"Name: {product.get('itemName', 'N/A')}")
        print(f"Price: {product.get('price', 'N/A')}")
        print("-" * 50)

if __name__ == "__main__":
    main()
