import argparse
import json
import os
import sys

# Add the parent directory to sys.path to allow imports from the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Now import from Target
from scrapers.Target import getTargetProducts
from scrapers.Kroger import getKrogerProductToken, getKrogerLocationToken, getKrogerProductDetails
from scrapers.gemini import queryGemini, json_format

def determineRelevantProducts(products, query):
    prompt = f"Determine which 5 of the following products are most relevant to the query: {query}. The products are: {products}. Return your response in the strict json format: {{'products': ['product1', 'product2', 'product3', 'product4', 'product5']}}"
    response = queryGemini(prompt, returnAsJson=True)
    return response['products']

def refineProduct(product, query):
    import time
    prompt = f"Extract the product name, price, and image URL from the following JSON: {product}. The original query was: {query}. Return your response in the strict json format: {json_format}"
    response = queryGemini(prompt, returnAsJson=True)
    if 'error' in response:
        print(f"Rate limit hit, waiting 1 second before retrying")
        time.sleep(1)
        return refineProduct(product)
    else:
        print(f"Refined product: {response['itemName']}")
        return response

def refineProducts(products, query):
    refined_products = []
    for product in products:
        refined_product = refineProduct(product, query)
        refined_product["provider"] = product["provider"]
        # If there is no brand, set it to the provider
        if not refined_product["brand"]:
            refined_product["brand"] = refined_product["provider"]
        refined_products.append(refined_product)
    return refined_products

def getProducts(product_name, zip_code):
    # Get products from Target
    rawTargetProducts = getTargetProducts(product_name, zip_code)
    # Determine which products are most relevant to the query based on the names key of the products
    relevantProductNames = determineRelevantProducts([product['title'] for product in rawTargetProducts], product_name)

    # Get the products that match the relevant product names
    relevantProducts = [product for product in rawTargetProducts if product['title'] in relevantProductNames]
    refinedTargetProducts = refineProducts(relevantProducts, product_name)


    # Get products from Kroger
    krogerToken = getKrogerProductToken()
    krogerLocation = getKrogerLocationToken(zip_code, krogerToken)
    rawKrogerProducts = getKrogerProductDetails(product_name, krogerLocation, krogerToken)

    relevantKrogerProductNames = determineRelevantProducts([product['title'] for product in rawKrogerProducts], product_name)
    relevantKrogerProducts = [product for product in rawKrogerProducts if product['title'] in relevantKrogerProductNames]
    refinedKrogerProducts = refineProducts(relevantKrogerProducts, product_name)

    totalProducts = refinedTargetProducts + refinedKrogerProducts

    return totalProducts

if __name__ == "__main__":
    product_to_scrape = [
        "carrots",
        "bell peppers",
        "onions",
        "garlic",
        "chicken breasts",
        "brocolli",
        "spinach",
        "tomatoes",
        "cucumbers",
        "zucchini",
        "eggplant",
        "potatoes",
        "sweet potatoes",
        "corn",
        "cauliflower",
        "peas",
        "green beans",
        "apples",
        "bananas",
        "oranges",
        "lemons",
        "limes",
        "strawberries",
        "blueberries",
        "raspberries",
        "pineapple",
        "mangoes",
        "beef steak",
        "pork chops",
        "salmon fillet",
        "shrimp",
        "tuna",
        "tofu",
        "eggs",
        "rice",
        "pasta",
        "quinoa",
        "couscous",
        "lentils",
        "chickpeas",
        "black beans",
        "white beans",
        "oats",
        "flour",
        "milk",
        "butter",
        "cheddar cheese",
        "parmesan",
        "yogurt",
        "cream",
        "olive oil",
        "canola oil",
        "basil",
        "oregano",
        "thyme",
        "rosemary",
        "cumin",
        "paprika",
        "black pepper",
        "salt",
        "sugar",
        "honey",
        "soy sauce",
        "vinegar",
        "mustard",
        "ketchup"
    ]

    enriched_products = {}
    for product in ["tofu"]:
        products = getProducts(product, "47906")
        enriched_products[product] = products

        # Export the enriched products to a json file
        with open("enriched_products.json", "w") as f:
            json.dump(enriched_products, f)