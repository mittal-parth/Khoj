const axios = require('axios');

// Configuration
const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

async function storeFile(text, epochs = 5) {
  try {
    const response = await axios.put(`${PUBLISHER}/v1/store`, text, {
      params: { epochs },
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    console.log('Store Response:', JSON.stringify(response.data, null, 2));
    return response.data.newlyCreated.blobObject.blobId;
  } catch (error) {
    console.error('Error storing file:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function readFile(blobId) {
  try {
    const response = await axios.get(`${AGGREGATOR}/v1/${blobId}`);
    console.log('File Content:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error reading file:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function main() {
  try {
    const text = "This is a new file test: ETHIndia'24 Team LossPerEpoch";
    const blobId = await storeFile(text);
    await readFile(blobId);
  } catch (error) {
    console.error('Operation failed:', error);
  }
}

// Run the main function
main();