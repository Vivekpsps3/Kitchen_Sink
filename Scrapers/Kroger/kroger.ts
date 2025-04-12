const axios = require('axios');
const dotenv = require('dotenv');
const clientId = process.env.KROGER_CLIENT_ID;
const clientSecret = process.env.KROGER_CLIENT_SECRET;
// Kroger API integration example
const codedAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

async function getProductToken() {
  try {
    const requestBody = "grant_type=client_credentials&scope=product.compact";
    const response = await axios.post('https://api.kroger.com/v1/connect/oauth2/token', requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        Authorization: `Basic ${codedAuth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getLocationToken() {
  try {
    const response = await axios.post('https://api.kroger.com/v1/locations?filter.zipcode.near=${zipcode}', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        Authorization: `Basic ${codedAuth}`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching access token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

aysnc function getProductDetails(brand = '', searchTerm, location, codedAuth) { 
  try{
    const locationID = location["locationId"]
    const response = await axios.get(`https://api.kroger.com/v1/products`, {
      params: {
          "filter.term": searchTerm,
          "filter.locationId": locationID
          // ...(brand && { "filter.brand": brand }) // Only include brand if it's provided
      },
      headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${codedAuth}`
      }
  });
  
  const availableProducts = response.data.data.filter(
    item => item.items && item.items.some(stock => stock.inventory?.stockLevel != "TEMPORARILY_OUT_OF_STOCK" && stock.fulfillment?.inStore == true)
  );
  availableProducts.sort((a, b) => {
    const priceA = a.items[0]?.price?.regular || Number.MAX_VALUE;
    const priceB = b.items[0]?.price?.regular || Number.MAX_VALUE;
    return priceA - priceB;
  });
  return availableProducts
  } catch (error) {
    console.error('Error fetching product details:', error.response ? error.response.data : error.message);
    throw error;
  }
}