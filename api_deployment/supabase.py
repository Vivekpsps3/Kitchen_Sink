import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

load_dotenv()

url: str = os.environ.get("SUPABASE_PROJECT_URL")
key: str = os.environ.get("SUPABASE_PROJECT_API")
supabase: Client = create_client(url, key)

# Define a Product model based on scrapingInterface.json
class Product(BaseModel):
    provider: str
    itemName: str
    category: str
    brand: str
    price: float
    unitAmountOz: float

def get_products():
    response = supabase.table("products").select("*").execute()
    return response.data

def create_product(product: Product):
    # Check to make sure the product.itemName is not already in the database
    response = supabase.table("products").select("*").eq("itemName", product.itemName).execute()
    if response.data:
        return "Product already exists"
    else:
        response = supabase.table("products").insert(product.model_dump()).execute()
        return response.data

if __name__ == "__main__":
    product = Product(
        provider="Target",
        itemName="Good and Gather Carrots",
        category="Carrots",
        brand="Good and Gather",
        price=3.99,
        unitAmountOz=12
    )
    
    print(create_product(product))

    products = get_products()
    for product in products:
        print(product)