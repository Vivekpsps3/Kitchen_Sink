from pydantic import BaseModel
from typing import Optional, Union, List, Dict, Any

# Define a Product model based on scrapingInterface.json
class Product(BaseModel):
    provider: str
    itemName: str
    category: str
    brand: str
    price: float
    unitAmountOz: float

# Define a Recipe model based on your Supabase table
class Recipe(BaseModel):
    title: str
    cuisine: Optional[str] = None
    tags: Optional[Union[List[str], str]] = None
    ingredients: Optional[List[Dict[str, Any]]] = None
    steps: Optional[Union[List[str], str]] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = None
    notes: Optional[str] = None