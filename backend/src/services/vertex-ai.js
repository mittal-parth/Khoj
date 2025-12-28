import aiplatform from "@google-cloud/aiplatform";
import dotenv from "dotenv";

dotenv.config();

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const EMBEDDING_DIMENSION = 512;
const SIMILARITY_THRESHOLD = parseFloat(process.env.IMAGE_SIMILARITY_THRESHOLD) || 0.7;

// Imports the Google Cloud Prediction service client
const { PredictionServiceClient } = aiplatform.v1;

// Import the helper module for converting arbitrary protobuf.Value objects.
const { helpers } = aiplatform;

// Specifies the location of the api endpoint
const clientOptions = {
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
};

const publisher = "google";
const model = "multimodalembedding@001";

// Instantiates a client
let predictionServiceClient = null;

function getPredictionServiceClient() {
  if (!PROJECT_ID) {
    throw new Error(
      "GOOGLE_CLOUD_PROJECT_ID not set. Please set it in your .env file."
    );
  }

  if (!predictionServiceClient) {
    predictionServiceClient = new PredictionServiceClient(clientOptions);
  }

  return predictionServiceClient;
}

/**
 * Generate image embedding using Vertex AI Multimodal Embedding Model
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {number} dimension - Embedding dimension (default: 256)
 * @returns {Promise<number[]>} The image embedding vector
 */
export async function generateImageEmbedding(imageBuffer, dimension = EMBEDDING_DIMENSION) {
  try {
    const predictionServiceClient = getPredictionServiceClient();
    
    // Configure the parent resource
    const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/${publisher}/models/${model}`;

    // Convert the image data to a Buffer and base64 encode it.
    const encodedImage = imageBuffer.toString("base64");

    const prompt = {
      image: {
        bytesBase64Encoded: encodedImage,
      },
    };
    
    const instanceValue = helpers.toValue(prompt);
    const instances = [instanceValue];

    const parameter = {
      dimension: dimension,
    };
    const parameters = helpers.toValue(parameter);

    const request = {
      endpoint,
      instances,
      parameters,
    };

    // Predict request
    const [response] = await predictionServiceClient.predict(request);
    
    console.log('Get image embedding response');
    const predictions = response.predictions;
    
    if (!predictions || predictions.length === 0) {
      throw new Error("No predictions returned from Vertex AI");
    }

    const prediction = predictions[0];
    
    // Extract image embedding from the response
    // The response is a protobuf Value, so we need to use helpers.fromValue
    const predictionValue = helpers.fromValue(prediction);
    
    let embedding;
    if (predictionValue.imageEmbedding) {
      embedding = predictionValue.imageEmbedding;
    } else if (predictionValue.embeddings && predictionValue.embeddings.imageEmbedding) {
      embedding = predictionValue.embeddings.imageEmbedding;
    } else {
      // Try direct access if it's already parsed
      if (prediction.imageEmbedding) {
        embedding = prediction.imageEmbedding;
      } else {
        console.error("Full prediction structure:", JSON.stringify(predictionValue, null, 2));
        throw new Error("Unexpected response format from Vertex AI - no imageEmbedding found");
      }
    }

    // Ensure embedding is an array of numbers
    if (!Array.isArray(embedding)) {
      throw new Error("Embedding is not an array");
    }

    console.log(`Generated embedding with dimension: ${embedding.length}`);
    
    return embedding;
  } catch (error) {
    console.error("Error generating image embedding:", error);
    throw new Error(`Failed to generate image embedding: ${error.message}`);
  }
}

export { EMBEDDING_DIMENSION, SIMILARITY_THRESHOLD };

