import argparse
import json
import os
import sys

# Add the parent directory to sys.path to allow imports from the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Now import from Target
from Scrapers.Target import getTargetProducts, refineTargetProducts

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Search for products with zip code')
    parser.add_argument('product_name', type=str, help='Name of the product to search for')
    parser.add_argument('zip_code', type=str, help='Zip code for location-based search')

    # Parse arguments
    args = parser.parse_args()
    
    # Get products from Target
    raw_products = getTargetProducts(args.product_name, args.zip_code)

    # Refine the products
    refined_products = refineTargetProducts(raw_products)
    
    # Create output dictionary with store information
    output_data = {
        "store": "target",
        "products": refined_products
    }
    
    # Create filename based on product name
    filename = f"{args.product_name.replace(' ', '_')}.json"
    
    # Save to JSON file
    with open(filename, 'w') as f:
        json.dump(output_data, f, indent=4)
    
    print(f"Saved {len(refined_products)} products to {filename}")
    
    # Display results
    for product in refined_products:
        print(f"Name: {product.get('itemName', 'N/A')}")
        print(f"Price: {product.get('price', 'N/A')}")
        print(f"URL: {product.get('url', 'N/A')}")
        print("-" * 50)

if __name__ == "__main__":
    main()
