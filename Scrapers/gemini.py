import os
import requests
import json
from dotenv import load_dotenv

# Import ../../.env
load_dotenv()

json_format = '''{
  "provider": "store (this should be the provider of the product, ex: Target, Walmart, etc.)",
  "itemName": "itemName (this should be the name of the product, ex: Good and Gather Carrots, Birds Eye Frozen Broccoli Florets, etc.)",
  "category": "category (this should be the category of the product, ex: Carrots, Frozen Pizzas, etc.)",
  "brand": "brand (this should be the brand of the product, ex: Target, Birds Eye, etc.)",
  "price": "price (this should be the price of the product, do not include the price in the unit. ex: $3.99, $1.99, etc.)",
  "unit": "unit (this should be the unit of measure for the product, do not include the price in the unit. ex: 12oz, 1lb, 100g, etc.)"
}
'''

def queryGemini(prompt, model="gemini-2.0-flash", returnAsJson=False):
    api_key = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {
        'Content-Type': 'application/json'
    }

    if returnAsJson:
        prompt = f"Return your response in the strict json format that is specified: {prompt}"
    
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    response_json = response.json()
    
    # Extract the text from the response
    try:
        if returnAsJson:
            # First check if there are any ```json and ``` in the response
            if "```json" in response_json['candidates'][0]['content']['parts'][0]['text'] and "```" in response_json['candidates'][0]['content']['parts'][0]['text']:
                # Remove ```json and ``` from the response 
                response_json['candidates'][0]['content']['parts'][0]['text'] = response_json['candidates'][0]['content']['parts'][0]['text'].replace("```json", "").replace("```", "")
                try:
                    return json.loads(response_json['candidates'][0]['content']['parts'][0]['text'])
                except:
                    print(f"Error parsing json! for prompt: {prompt}")
                    return response_json['candidates'][0]['content']['parts'][0]['text']
            else:
                # Try to parse the response as json
                try:
                    return json.loads(response_json['candidates'][0]['content']['parts'][0]['text'])
                except:
                    print(f"Error parsing json! for prompt: {prompt}")
                    return response_json['candidates'][0]['content']['parts'][0]['text']
        else:
            return response_json['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError):
        # Handle potential errors in the response structure
        return f"Error processing response: {response_json}"


