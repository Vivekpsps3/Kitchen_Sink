import os
import requests
import json
from dotenv import load_dotenv

# Import ../../.env
load_dotenv()

def queryGemini(prompt, model="gemini-2.0-flash", returnAsJson=False):
    api_key = os.getenv("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {
        'Content-Type': 'application/json'
    }
    
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
            # Remove ```json and ``` from the response and parse as json
            return json.loads(response_json['candidates'][0]['content']['parts'][0]['text'].replace("```json", "").replace("```", ""))
        else:
            return response_json['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError):
        # Handle potential errors in the response structure
        return f"Error processing response: {response_json}"


