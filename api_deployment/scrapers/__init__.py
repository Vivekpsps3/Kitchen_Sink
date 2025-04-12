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

def getProducts(product_name, zip_code):
    # Get products from Target
    rawTargetProducts = getTargetProducts(product_name, zip_code)
    refinedTargetProducts = refineProducts(rawTargetProducts)

    # Get products from Kroger
    krogerToken = getKrogerProductToken()
    krogerLocation = getKrogerLocationToken(zip_code, krogerToken)
    rawKrogerProducts = getKrogerProductDetails(product_name, krogerLocation, krogerToken)
    refinedKrogerProducts = refineProducts(rawKrogerProducts)

    totalProducts = refinedTargetProducts + refinedKrogerProducts

    return totalProducts