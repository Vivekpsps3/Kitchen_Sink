#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json
import time
import random
import argparse
import csv
import os
import re
from urllib.parse import quote_plus


class TargetScraper:
    """
    A scraper for Target.com that can search for products and extract their details.
    """
    
    def __init__(self, delay_range=(1, 3), debug=False):
        """
        Initialize the Target scraper.
        
        Args:
            delay_range (tuple): Range of seconds to randomly delay between requests
            debug (bool): Whether to save debug output files
        """
        self.base_url = "https://www.target.com"
        self.search_url = f"{self.base_url}/s"
        self.delay_range = delay_range
        self.debug = debug
        
        # Headers to mimic a browser
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'Referer': 'https://www.target.com/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def _random_delay(self):
        """Add a random delay between requests to avoid being blocked"""
        time.sleep(random.uniform(*self.delay_range))
    
    def search(self, query, max_pages=1):
        """
        Search for products on Target.com
        
        Args:
            query (str): Search query
            max_pages (int): Maximum number of pages to scrape
            
        Returns:
            list: List of product dictionaries
        """
        all_products = []
        encoded_query = quote_plus(query)
        
        for page in range(1, max_pages + 1):
            self._random_delay()
            
            # Construct the search URL with pagination
            # Target uses 'q' as the search parameter
            page_url = f"{self.search_url}?searchTerm={encoded_query}"
            if page > 1:
                page_url += f"&pageNumber={page}"
                
            print(f"Scraping page {page}: {page_url}")
            
            try:
                response = self.session.get(page_url)
                response.raise_for_status()
                
                # Save debug output if enabled
                if self.debug:
                    debug_filename = f"target_page_{page}.html"
                    print(f"Saving debug HTML to {debug_filename}")
                    with open(debug_filename, "w", encoding="utf-8") as f:
                        f.write(response.text)
                
                # Extract product data from the search results page
                products = self._extract_products_from_search(response.text)
                
                if not products:
                    print(f"No products found on page {page}. Stopping.")
                    break
                
                all_products.extend(products)
                
                # Get detailed info for each product
                for i, product in enumerate(products):
                    if 'url' in product:
                        print(f"Getting details for product {i+1}/{len(products)}")
                        self._random_delay()
                        detailed_info = self._get_product_details(product['url'])
                        product.update(detailed_info)
                
            except Exception as e:
                print(f"Error scraping page {page}: {e}")
                break
        
        return all_products
    
    def _extract_products_from_search(self, html_content):
        """
        Extract basic product information from search results page
        
        Args:
            html_content (str): HTML content of the search results page
            
        Returns:
            list: List of product dictionaries with basic info
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        products = []
        
        # Try to extract JSON data from script tags
        script_tags = soup.find_all('script', type='application/json')
        
        # Create a function to recursively search for products in JSON
        def search_for_products(data, path=""):
            if isinstance(data, dict):
                # Look for specific product indicators
                if 'products' in data and isinstance(data['products'], list):
                    return data['products']
                elif 'items' in data and isinstance(data['items'], list):
                    return data['items']
                
                # Continue searching in dict values
                for key, value in data.items():
                    result = search_for_products(value, f"{path}.{key}")
                    if result:
                        return result
            
            elif isinstance(data, list):
                # Look for list of items that might be products
                if len(data) > 0 and isinstance(data[0], dict):
                    if all(isinstance(item, dict) and ('title' in item or 'name' in item) for item in data):
                        return data
                
                # Continue searching in list items
                for i, item in enumerate(data):
                    result = search_for_products(item, f"{path}[{i}]")
                    if result:
                        return result
            
            return None
        
        # Extract product data from JSON in script tags
        for script in script_tags:
            try:
                json_data = json.loads(script.string)
                
                # Special handling for PRELOADED_QUERIES which is common in Target's site
                if '__PRELOADED_QUERIES__' in json_data:
                    preloaded = json_data['__PRELOADED_QUERIES__']
                    
                    for key, value in preloaded.items():
                        if isinstance(value, dict) and 'data' in value:
                            # Search for search results or product data
                            data = value['data']
                            
                            # Look for search results
                            if 'search' in data and 'products' in data['search']:
                                items = data['search']['products']
                                
                                for item in items:
                                    product = {
                                        'title': item.get('title', ''),
                                        'tcin': item.get('tcin', ''),  # Target's product ID
                                        'url': f"{self.base_url}{item.get('url', '')}",
                                        'price': self._extract_price(item),
                                        'rating': item.get('rating', {}).get('value', None),
                                        'rating_count': item.get('rating', {}).get('count', 0),
                                        'image_url': self._extract_image_url(item),
                                        'primary_brand': item.get('primaryBrand', ''),
                                    }
                                    products.append(product)
                
                # If no products found in PRELOADED_QUERIES, try a general search
                if not products:
                    product_items = search_for_products(json_data)
                    if product_items:
                        for item in product_items:
                            # Check if it looks like a valid product
                            if 'title' in item or 'name' in item:
                                product = {
                                    'title': item.get('title', item.get('name', '')),
                                    'tcin': item.get('tcin', item.get('id', '')), 
                                    'url': f"{self.base_url}{item.get('url', item.get('link', ''))}",
                                    'price': self._extract_price(item),
                                    'image_url': self._extract_image_url(item),
                                }
                                products.append(product)
            
            except Exception as e:
                print(f"Error parsing JSON from script tag: {e}")
        
        # If JSON parsing didn't work, try direct HTML parsing as fallback
        if not products:
            print("Falling back to HTML parsing...")
            
            # Find product containers in the HTML
            # Try multiple selector patterns that Target might use
            selectors = [
                'li[data-test="product-list-item"]', 
                'div[data-test="product-card"]',
                'div[data-test="product-grid-container"] > div',
                'div[data-component="product-card"]'
            ]
            
            for selector in selectors:
                product_containers = soup.select(selector)
                if product_containers:
                    print(f"Found {len(product_containers)} products with selector: {selector}")
                    
                    for container in product_containers:
                        try:
                            # Try multiple attribute patterns for title
                            title_elem = (
                                container.select_one('[data-test="product-title"]') or 
                                container.select_one('a[data-test="product-title"]') or
                                container.select_one('a[data-component="product-title"]') or
                                container.select_one('span[data-component="product-title"]') or
                                container.select_one('.styles__StyledTitleLink-sc-*') or
                                container.select_one('h3')
                            )
                            
                            # Try multiple attribute patterns for price
                            price_elem = (
                                container.select_one('[data-test="product-price"]') or
                                container.select_one('[data-component="product-price"]') or
                                container.select_one('.styles__StyledPricePromoWrapper-sc-*') or
                                container.select_one('span[data-test="current-price"]')
                            )
                            
                            # Try multiple attribute patterns for link
                            link_elem = (
                                container.select_one('a[href^="/p/"]') or
                                container.select_one('a[data-test="product-link"]') or
                                container.select_one('a[data-component="product-link"]')
                            )
                            
                            if title_elem and link_elem:
                                # Get URL from link element
                                url = link_elem.get('href', '')
                                if url and not url.startswith('http'):
                                    url = f"{self.base_url}{url}"
                                
                                # Get price
                                price = price_elem.text.strip() if price_elem else 'N/A'
                                
                                # Try to find image
                                img_elem = (
                                    container.select_one('img[data-test="product-image"]') or
                                    container.select_one('img[alt]') or
                                    container.select_one('img')
                                )
                                image_url = img_elem.get('src', '') if img_elem else ''
                                
                                product = {
                                    'title': title_elem.text.strip(),
                                    'url': url,
                                    'price': price,
                                    'image_url': image_url
                                }
                                products.append(product)
                        except Exception as e:
                            print(f"Error extracting product from HTML: {e}")
                    
                    # If we found products, no need to try other selectors
                    if products:
                        break
        
        # Extract any additional products from product carousel sections
        carousel_sections = soup.select('[data-test="carousel"], [data-component="carousel"]')
        for section in carousel_sections:
            try:
                # Get carousel title
                carousel_title = section.select_one('h2, h3, h4').text.strip() if section.select_one('h2, h3, h4') else "Related Products"
                
                # Find product items in carousel
                items = section.select('li, div[data-test="product-card"], div[role="listitem"]')
                
                for item in items:
                    try:
                        title_elem = (
                            item.select_one('[data-test="product-title"]') or 
                            item.select_one('a[data-test="product-title"]') or
                            item.select_one('span[data-component="product-title"]') or
                            item.select_one('h3, h4')
                        )
                        
                        link_elem = (
                            item.select_one('a[href^="/p/"]') or
                            item.select_one('a[data-test="product-link"]')
                        )
                        
                        if title_elem and link_elem:
                            # Create product entry
                            product = {
                                'title': title_elem.text.strip(),
                                'url': f"{self.base_url}{link_elem['href']}",
                                'carousel_section': carousel_title
                            }
                            
                            # Check if this product is already in our list
                            if not any(p.get('title') == product['title'] for p in products):
                                products.append(product)
                    except Exception as e:
                        print(f"Error extracting carousel product: {e}")
            except Exception as e:
                print(f"Error processing carousel section: {e}")
                
        print(f"Found {len(products)} products")
        return products
    
    def _extract_price(self, item):
        """Extract formatted price from product JSON"""
        try:
            # Check multiple possible locations for price in the JSON structure
            if 'price' in item:
                price_data = item['price']
                if isinstance(price_data, dict):
                    # Try different possible fields for price
                    for field in ['current_retail', 'formattedCurrentPrice', 'formatted_current_price', 'value']:
                        if field in price_data:
                            return price_data[field]
                    
                    # Try nested formatted object
                    if 'formatted' in price_data:
                        formatted = price_data['formatted']
                        for field in ['current_retail', 'current_price', 'value']:
                            if field in formatted:
                                return formatted[field]
                
                # If price is a string, just return it
                elif isinstance(price_data, str):
                    return price_data
            
            # Try alternate price locations
            for field in ['currentPrice', 'formattedPrice', 'priceValue']:
                if field in item:
                    return item[field]
                    
            return "N/A"
        except Exception:
            return "N/A"
    
    def _extract_image_url(self, item):
        """Extract primary image URL from product JSON"""
        try:
            # Check for various image fields
            if 'images' in item and item['images']:
                images = item['images']
                if isinstance(images, list) and len(images) > 0:
                    image = images[0]
                    if isinstance(image, dict):
                        # Try different possible fields for image URL
                        for field in ['url', 'base_url', 'src']:
                            if field in image:
                                return image[field]
            
            # Try alternate image locations
            for field in ['primaryImage', 'image', 'imageUrl', 'src']:
                if field in item:
                    image_data = item[field]
                    if isinstance(image_data, dict):
                        for url_field in ['url', 'src']:
                            if url_field in image_data:
                                return image_data[url_field]
                    elif isinstance(image_data, str):
                        return image_data
            
            return ""
        except Exception:
            return ""
    
    def _get_product_details(self, product_url):
        """
        Get detailed information about a specific product
        
        Args:
            product_url (str): URL of the product page
            
        Returns:
            dict: Detailed product information
        """
        print(f"Getting details for: {product_url}")
        
        try:
            response = self.session.get(product_url)
            response.raise_for_status()
            
            # Save debug output if enabled
            if self.debug:
                debug_filename = f"target_product_{product_url.split('/')[-1]}.html"
                with open(debug_filename, "w", encoding="utf-8") as f:
                    f.write(response.text)
                    
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract additional product details
            details = {}
            
            # Description - try multiple possible selectors
            description_selectors = [
                '[data-test="item-details-description"]',
                '[data-component="item-details-description"]',
                '[data-test="product-description"]',
                'div[data-test="product-details-container"] p'
            ]
            
            for selector in description_selectors:
                description_elem = soup.select_one(selector)
                if description_elem:
                    details['description'] = description_elem.text.strip()
                    break
            
            # Specifications/Features - try multiple possible selectors
            specs_selectors = [
                '[data-test="item-details-specifications"]',
                '[data-component="specifications"]',
                'div[data-test="product-specs"]'
            ]
            
            specs = []
            for selector in specs_selectors:
                specs_container = soup.select_one(selector)
                if specs_container:
                    # Look for specification items
                    spec_items = specs_container.select('[data-test="specificationItem"], [data-test="spec-item"], .styles__StyledCol-sc-*')
                    
                    for item in spec_items:
                        try:
                            # Try multiple patterns to extract name/value pairs
                            name_elem = item.select_one('div:first-child, span:first-child, .styles__SpecName-sc-*')
                            value_elem = item.select_one('div:last-child, span:last-child, .styles__SpecValue-sc-*')
                            
                            if name_elem and value_elem:
                                specs.append({
                                    'name': name_elem.text.strip(),
                                    'value': value_elem.text.strip()
                                })
                        except Exception as e:
                            print(f"Error extracting specification: {e}")
                    
                    # If we found specs, no need to try other selectors
                    if specs:
                        break
            
            details['specifications'] = specs
            
            # Availability - try multiple possible selectors
            availability_selectors = [
                '[data-test="availability-message"]',
                '[data-component="availability"]',
                '[data-test="fulfillment-section"]'
            ]
            
            for selector in availability_selectors:
                availability_elem = soup.select_one(selector)
                if availability_elem:
                    details['availability'] = availability_elem.text.strip()
                    break
            
            # Try to extract product details from structured data (JSON-LD)
            structured_data = []
            for script in soup.find_all('script', type='application/ld+json'):
                try:
                    data = json.loads(script.string)
                    structured_data.append(data)
                except Exception:
                    pass
            
            # Process structured data if found
            for data in structured_data:
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    # Extract basic product info
                    if 'name' in data and 'name' not in details:
                        details['name'] = data['name']
                    
                    if 'description' in data and 'description' not in details:
                        details['description'] = data['description']
                    
                    if 'brand' in data and isinstance(data['brand'], dict):
                        details['brand'] = data['brand'].get('name', '')
                    
                    if 'offers' in data and isinstance(data['offers'], dict):
                        offer = data['offers']
                        if 'price' in offer:
                            details['price'] = offer['price']
                        if 'availability' in offer and 'availability' not in details:
                            details['availability'] = offer['availability']
            
            # JavaScript data - look for product JSON in script tags
            script_tags = soup.find_all('script', type='application/json')
            for script in script_tags:
                try:
                    json_data = json.loads(script.string)
                    
                    # Look for product data in PRELOADED_QUERIES
                    if '__PRELOADED_QUERIES__' in json_data:
                        preloaded = json_data['__PRELOADED_QUERIES__']
                        
                        for key, value in preloaded.items():
                            if isinstance(value, dict) and 'data' in value:
                                data = value['data']
                                
                                # Look for product data
                                if 'product' in data:
                                    product_data = data['product']
                                    
                                    # Extract additional details from product_data
                                    if 'item' in product_data:
                                        item_data = product_data['item']
                                        details.update({
                                            'upc': item_data.get('primary_barcode', ''),
                                            'brand': item_data.get('brand', {}).get('name', ''),
                                            'department': item_data.get('department', {}).get('name', ''),
                                            'dpci': item_data.get('dpci', ''),  # Target's internal classification
                                        })
                                        
                                        # Return policy
                                        if 'return_policies' in item_data and item_data['return_policies']:
                                            details['return_policy'] = item_data['return_policies'][0].get('policy', '')
                                    
                                    # Enriched product data
                                    if 'enrichment' in product_data:
                                        enrichment = product_data['enrichment']
                                        
                                        # Images
                                        if 'images' in enrichment and enrichment['images']:
                                            details['images'] = [img.get('base_url', '') for img in enrichment.get('images', [])]
                                        
                                        # Features
                                        if 'features' in enrichment and enrichment['features']:
                                            details['features'] = enrichment['features']
                                            
                                        # Nutrition facts
                                        if 'nutrition_facts' in enrichment and enrichment['nutrition_facts']:
                                            details['nutrition_facts'] = enrichment['nutrition_facts']
                                    
                                    # Product classification
                                    if 'classification' in product_data:
                                        classification = product_data['classification']
                                        details['product_classification'] = {
                                            'product_type': classification.get('product_type', {}).get('name', ''),
                                            'category': classification.get('category', {}).get('name', ''),
                                            'subcategory': classification.get('subcategory', {}).get('name', '')
                                        }
                                        
                                # Stop once we've found product data
                                if details:
                                    break
                except Exception as e:
                    print(f"Error parsing product JSON: {e}")
            
            return details
            
        except Exception as e:
            print(f"Error getting product details: {e}")
            return {}
    
    def save_products_to_csv(self, products, filename):
        """
        Save product data to a CSV file
        
        Args:
            products (list): List of product dictionaries
            filename (str): Output filename
        """
        if not products:
            print("No products to save")
            return
        
        # Determine all possible fields from all products
        all_fields = set()
        for product in products:
            all_fields.update(product.keys())
        
        # Sort fields to ensure consistent column order
        # Put common important fields first
        priority_fields = ['title', 'name', 'price', 'url', 'description', 'brand', 'rating', 'availability']
        fields = sorted(list(all_fields), key=lambda x: (x not in priority_fields, x))
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fields)
                writer.writeheader()
                
                for product in products:
                    # Handle nested dictionaries and lists for CSV output
                    row = {}
                    for key, value in product.items():
                        if isinstance(value, (dict, list)):
                            row[key] = json.dumps(value)
                        else:
                            row[key] = value
                    
                    writer.writerow(row)
                
            print(f"Saved {len(products)} products to {filename}")
            
        except Exception as e:
            print(f"Error saving to CSV: {e}")


def main():
    parser = argparse.ArgumentParser(description='Scrape Target.com for products')
    parser.add_argument('query', help='Search query for Target.com')
    parser.add_argument('--pages', type=int, default=1, help='Number of pages to scrape (default: 1)')
    parser.add_argument('--output', help='Output CSV filename (default: target_results.csv)')
    parser.add_argument('--debug', action='store_true', help='Save debug HTML files')
    
    args = parser.parse_args()
    
    # Use the provided output filename or generate one based on the query
    output_file = args.output or f"target_{args.query.replace(' ', '_')}.csv"
    
    scraper = TargetScraper(debug=args.debug)
    products = scraper.search(args.query, max_pages=args.pages)
    
    if products:
        print(f"Found {len(products)} products")
        scraper.save_products_to_csv(products, output_file)
    else:
        print("No products found")


if __name__ == "__main__":
    main()
