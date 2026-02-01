from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)
CORS(app)

# Scraper functions
def extract_price(price_text):
    """Extract numeric price from text"""
    try:
        price_text = re.sub(r'[₹,]', '', price_text)
        match = re.search(r'\d+', price_text)
        if match:
            return int(match.group())
    except:
        pass
    return None

def scrape_flipkart(query, max_price, page=1):
    """Scrape Flipkart with multiple selector patterns"""
    products = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    search_query = query.replace(' ', '%20')
    url = f'https://www.flipkart.com/search?q={search_query}&page={page}'
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try multiple selector patterns (Flipkart changes HTML frequently)
        items = soup.find_all('div', {'class': '_1AtVbE'})[:20]
        if not items:
            items = soup.find_all('div', {'class': '_2kHMtA'})[:20]
        if not items:
            items = soup.find_all('div', {'class': '_1YokD2'})[:20]
        
        for item in items:
            try:
                # Try multiple title selectors
                title_elem = item.find('a', {'class': 's1Q9rs'})
                if not title_elem:
                    title_elem = item.find('a', {'class': 'IRpwTa'})
                if not title_elem:
                    title_elem = item.find('a', {'class': '_2UzuFa'})
                if not title_elem:
                    title_elem = item.find('div', {'class': '_4rR01T'})
                
                # Try multiple price selectors
                price_elem = item.find('div', {'class': '_30jeq3'})
                if not price_elem:
                    price_elem = item.find('div', {'class': '_25b18c'})
                if not price_elem:
                    price_elem = item.find('div', {'class': '_1_WHN1'})
                
                # Try multiple image selectors
                image_elem = item.find('img', {'class': '_396cs4'})
                if not image_elem:
                    image_elem = item.find('img', {'class': '_2r_T1I'})
                if not image_elem:
                    image_elem = item.find('img')
                
                if title_elem and price_elem:
                    title = title_elem.text.strip() if hasattr(title_elem, 'text') else title_elem.get_text(strip=True)
                    price_text = price_elem.text.strip() if hasattr(price_elem, 'text') else price_elem.get_text(strip=True)
                    price = extract_price(price_text)
                    
                    if price and price <= max_price:
                        href = title_elem.get('href', '') if title_elem.name == 'a' else ''
                        if not href and title_elem.find('a'):
                            href = title_elem.find('a').get('href', '')
                        link = 'https://www.flipkart.com' + href if href else ''
                        image = image_elem.get('src', '') if image_elem else image_elem.get('data-src', '')
                        
                        if title and link:
                            products.append({
                                'title': title,
                                'price': f'₹{price}',
                                'link': link,
                                'image': image,
                                'source': 'Flipkart'
                            })
            except Exception as e:
                continue
    
    except Exception as e:
        print(f"Error scraping Flipkart: {e}")
    
    return products

def scrape_amazon(query, max_price, page=1):
    """Scrape Amazon India with multiple selector patterns"""
    products = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    search_query = query.replace(' ', '+')
    url = f'https://www.amazon.in/s?k={search_query}&page={page}'
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        items = soup.find_all('div', {'data-component-type': 's-search-result'})[:20]
        if not items:
            items = soup.find_all('div', {'class': 's-result-item'})[:20]
        
        for item in items:
            try:
                # Try multiple title selectors
                title_elem = item.find('h2', {'class': 'a-size-mini'})
                if not title_elem:
                    title_elem = item.find('h2', {'class': 'a-size-base-plus'})
                if not title_elem:
                    title_elem = item.find('h2')
                
                # Try multiple price selectors
                price_elem = item.find('span', {'class': 'a-price-whole'})
                if not price_elem:
                    price_elem = item.find('span', {'class': 'a-price'})
                if not price_elem:
                    price_elem = item.find('span', {'class': 'a-offscreen'})
                
                # Try multiple image selectors
                image_elem = item.find('img', {'class': 's-image'})
                if not image_elem:
                    image_elem = item.find('img', {'data-image-latency': True})
                if not image_elem:
                    image_elem = item.find('img')
                
                # Try multiple link selectors
                link_elem = item.find('a', {'class': 'a-link-normal'})
                if not link_elem:
                    link_elem = item.find('h2').find('a') if item.find('h2') else None
                
                if title_elem:
                    title = title_elem.text.strip() if hasattr(title_elem, 'text') else title_elem.get_text(strip=True)
                    price = None
                    if price_elem:
                        price_text = price_elem.text.strip() if hasattr(price_elem, 'text') else price_elem.get_text(strip=True)
                        price = extract_price(price_text)
                    
                    # Accept products even without price if we have title and link
                    if title:
                        href = link_elem.get('href', '') if link_elem else ''
                        link = 'https://www.amazon.in' + href if href and not href.startswith('http') else href
                        image = image_elem.get('src', '') if image_elem else image_elem.get('data-src', '') if image_elem else ''
                        
                        if link:
                            products.append({
                                'title': title,
                                'price': f'₹{price}' if price else 'Price on site',
                                'link': link,
                                'image': image,
                                'source': 'Amazon'
                            })
            except Exception as e:
                continue
    
    except Exception as e:
        print(f"Error scraping Amazon: {e}")
    
    return products

def scrape_myntra(query, max_price, page=1):
    """Scrape Myntra"""
    products = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    search_query = query.replace(' ', '%20')
    url = f'https://www.myntra.com/{search_query}'
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Myntra product selectors
        items = soup.find_all('li', {'class': 'product-base'})[:20]
        if not items:
            items = soup.find_all('div', {'class': 'product-productMetaInfo'})[:20]
        
        for item in items:
            try:
                title_elem = item.find('h3', {'class': 'product-brand'})
                if not title_elem:
                    title_elem = item.find('h4', {'class': 'product-product'})
                if not title_elem:
                    title_elem = item.find('a', {'class': 'product-productMetaInfo'})
                
                price_elem = item.find('span', {'class': 'product-discountedPrice'})
                if not price_elem:
                    price_elem = item.find('span', {'class': 'product-price'})
                
                image_elem = item.find('img', {'class': 'img-responsive'})
                if not image_elem:
                    image_elem = item.find('img')
                
                link_elem = item.find('a', {'href': True})
                
                if title_elem:
                    title = title_elem.text.strip() if hasattr(title_elem, 'text') else title_elem.get_text(strip=True)
                    price = None
                    if price_elem:
                        price_text = price_elem.text.strip() if hasattr(price_elem, 'text') else price_elem.get_text(strip=True)
                        price = extract_price(price_text)
                    
                    if title:
                        href = link_elem.get('href', '') if link_elem else ''
                        link = 'https://www.myntra.com' + href if href and not href.startswith('http') else href
                        image = image_elem.get('src', '') if image_elem else image_elem.get('data-src', '') if image_elem else ''
                        
                        if link and (not price or price <= max_price):
                            products.append({
                                'title': title,
                                'price': f'₹{price}' if price else 'Price on site',
                                'link': link,
                                'image': image,
                                'source': 'Myntra'
                            })
            except Exception as e:
                continue
    
    except Exception as e:
        print(f"Error scraping Myntra: {e}")
    
    return products

def scrape_products(query, max_price, page=1):
    """Scrape products from multiple e-commerce sites"""
    print(f"[PythonBackend] Starting product scraping for query: '{query}' page {page} with max price: {max_price}")
    products = []
    
    try:
        flipkart_products = scrape_flipkart(query, max_price, page)
        products.extend(flipkart_products)
        print(f"[PythonBackend] Found {len(flipkart_products)} products from Flipkart")
    except Exception as e:
        print(f"[PythonBackend] Flipkart scraping error: {e}")
    
    try:
        amazon_products = scrape_amazon(query, max_price, page)
        products.extend(amazon_products)
        print(f"[PythonBackend] Found {len(amazon_products)} products from Amazon")
    except Exception as e:
        print(f"[PythonBackend] Amazon scraping error: {e}")
    
    try:
        myntra_products = scrape_myntra(query, max_price, page)
        products.extend(myntra_products)
        print(f"[PythonBackend] Found {len(myntra_products)} products from Myntra")
    except Exception as e:
        print(f"[PythonBackend] Myntra scraping error: {e}")
    
    print(f"[PythonBackend] Total products found: {len(products)}")
    return products

# Flask routes
@app.route('/search', methods=['POST'])
def search_products():
    try:
        data = request.json
        query = data.get('query', '')
        budget = data.get('budget', 'budget-friendly')
        page = int(data.get('page', 1))
        if page < 1:
            page = 1
        
        print(f"[PythonBackend] Received search request - Query: '{query}', Budget: '{budget}', Page: {page}")
        
        if not query:
            print("[PythonBackend] Error: Query is required")
            return jsonify({'error': 'Query is required'}), 400
        
        if budget == 'budget-friendly':
            max_price = 1000
        elif budget == 'mid-range':
            max_price = 3000
        else:
            max_price = float('inf')
        
        print(f"[PythonBackend] Scraping products with max price: {max_price}")
        products = scrape_products(query, max_price, page)
        
        print(f"[PythonBackend] Found {len(products)} products")
        
        response_data = {
            'success': True,
            'products': products,
            'count': len(products)
        }
        
        print(f"[PythonBackend] Sending response with {len(products)} products")
        return jsonify(response_data)
    
    except Exception as e:
        print(f"[PythonBackend] Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'E-commerce Scraper API',
        'endpoints': {
            '/search': 'POST - Search for products',
            '/health': 'GET - Health check'
        }
    })

@app.route('/favicon.ico')
def favicon():
    return '', 204

if __name__ == '__main__':
    # Port 5001 so it doesn't conflict with Node backend on 5000
    app.run(debug=True, port=5001, host='0.0.0.0')