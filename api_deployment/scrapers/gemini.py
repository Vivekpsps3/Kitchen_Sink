import os
import requests
import json
import time
from dotenv import load_dotenv

# Import ../../.env
load_dotenv()

# Import scrapingInterface.json as a string 
with open('scrapers/scrapingInterface.json', 'r') as f:
    json_format = f.read()

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
    
    # If there is an error in the response, wait 1 second and try again
    if "error" in response_json:
        print(f"Error in response: {response_json['error']['message']}")
        time.sleep(1)
        return queryGemini(prompt, model, returnAsJson)

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


