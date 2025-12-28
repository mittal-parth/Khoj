import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";

// Import services
import { readObject, storeString, storeFile } from "./services/pinata.js";
import {
  getRoomId,
  getToken,
  startStreaming,
  stopStreaming,
} from "./services/huddle.js";
import { 
  encryptRunServerMode, 
  decryptRunServerMode
} from "./services/lit-protocol.js";
import { attestClueSolved, attestClueAttempt, queryAttestationsForHunt, queryRetryAttemptsForClue } from "./services/sign-protocol.js";
import { calculateLeaderboardForHunt } from "./services/leaderboard.js";
import { generateImageEmbedding } from "./services/vertex-ai.js";

// Import utilities
import { withRetry } from "./utils/retry-utils.js";

// Configuration
const GEMINI_MODEL = "gemini-2.5-flash";

const corsOptions = {
  origin: "*", // Temporarily allow all origins for debugging
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
};

dotenv.config();

const app = express();

// Debug CORS and requests
app.use((req, res, next) => {
  next();
});

// Add explicit preflight handler
app.options('*', cors(corsOptions));

app.use(cors(corsOptions)); // Single CORS configuration
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const port = process.env.PORT || 8000;

// In-memory storage for team room mappings
const teamHuddleRooms = new Map();

// TTL configuration
const ROOM_TTL = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// TTL cleanup function
const cleanupExpiredRooms = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of teamHuddleRooms.entries()) {
    if (now - value.createdAt > ROOM_TTL) {
      teamHuddleRooms.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired room mappings. Current active rooms: ${teamHuddleRooms.size}`);
  }
};

// Start TTL cleanup interval
setInterval(cleanupExpiredRooms, CLEANUP_INTERVAL);
console.log(`Started TTL cleanup for team rooms. Cleanup interval: ${CLEANUP_INTERVAL / (60 * 60 * 1000)} hours`);

// ============================================================================
// ENDPOINTS
// ============================================================================

app.post("/clues/encrypt", async (req, res) => {
  try {
    const bodyData = req.body;

    console.log("=== ENCRYPT ENDPOINT DEBUG ===");
    console.log("Full request body:", JSON.stringify(bodyData, null, 2));

    if (!bodyData.userAddress || !bodyData.clues || !bodyData.answers) {
      return res.status(400).json({
        error: "Missing required fields: userAddress, clues, and answers",
      });
    }

    if (!Array.isArray(bodyData.clues) || !Array.isArray(bodyData.answers)) {
      return res.status(400).json({ error: "Clues and answers must be arrays" });
    }

    const clues = bodyData.clues;
    const answers = bodyData.answers;
    const huntType = bodyData.huntType || "GEO_LOCATION";

    console.log("Hunt type:", huntType);
    console.log("Raw clues received:", JSON.stringify(clues, null, 2));
    console.log("Raw answers received:", JSON.stringify(answers, null, 2));

    // Validate clues
    for (const clue of clues) {
      if (!clue.id || !clue.description) {
        return res.status(400).json({
          error: "Each clue must have id and description fields",
        });
      }
    }

    // Validate answers based on hunt type
    for (const answer of answers) {
      if (huntType === "IMAGE") {
        // Image hunt: require id, answer, and embedding array
        if (
          !answer.id ||
          !answer.answer ||
          !Array.isArray(answer.embedding)
        ) {
          console.log("Invalid image answer:", answer);
          return res.status(400).json({
            error: "Each answer must have id, answer, and embedding (array) fields for image hunts",
          });
        }
      } else {
        // Geolocation hunt: require id, answer, lat, and long
        if (
          !answer.id ||
          !answer.answer ||
          typeof answer.lat !== "number" ||
          typeof answer.long !== "number"
        ) {
          console.log("Invalid geolocation answer:", answer);
          return res.status(400).json({
            error: "Each answer must have id, answer, lat, and long fields for geolocation hunts",
          });
        }
      }
    }

    // const userAddress = bodyData.userAddress;
    const cluesParsed = clues.map(({ id, description }) => ({
      id,
      description,
    }));
    
    // Parse answers based on hunt type
    const answersParsed = huntType === "IMAGE"
      ? answers.map(({ id, answer, embedding }) => ({ id, answer, embedding }))
      : answers.map(({ id, answer, lat, long }) => ({ id, answer, lat, long }));

    console.log("cluesParsed: ", JSON.stringify(cluesParsed, null, 2));
    console.log("answersParsed: ", JSON.stringify(answersParsed, null, 2));

    const {
      ciphertext: clues_ciphertext,
      dataToEncryptHash: clues_dataToEncryptHash,
    } = await encryptRunServerMode(JSON.stringify(cluesParsed));
    const {
      ciphertext: answers_ciphertext,
      dataToEncryptHash: answers_dataToEncryptHash,
    } = await encryptRunServerMode(JSON.stringify(answersParsed));

    const [clues_blobId, answers_blobId] = await Promise.all([
      storeString(
        JSON.stringify({
          ciphertext: clues_ciphertext,
          dataToEncryptHash: clues_dataToEncryptHash,
        })
      ),
      storeString(
        JSON.stringify({
          ciphertext: answers_ciphertext,
          dataToEncryptHash: answers_dataToEncryptHash,
        })
      ),
    ]);

    res.send({ clues_blobId: clues_blobId, answers_blobId: answers_blobId });
  } catch (error) {
    console.error("Error encrypting data:", error);
    res.status(500).json({
      error: "Failed to encrypt data",
      message: error.message,
    });
  }
});

app.post("/clues/verify", async (req, res) => {
  try {
    const bodyData = req.body;
    const huntType = bodyData.huntType || "GEO_LOCATION";
    const clueId = bodyData.clueId;

    console.log("=== DECRYPT-ANS ENDPOINT DEBUG ===");
    console.log("Request body:", JSON.stringify(bodyData, null, 2));
    console.log("Hunt type:", huntType);

    // Get encrypted answers from IPFS
    const answersData = await readObject(bodyData.answers_blobId);
    const parsedAnswersData = typeof answersData === 'string' ? JSON.parse(answersData) : answersData;
    
    const {
      ciphertext: answers_ciphertext,
      dataToEncryptHash: answers_dataToEncryptHash,
    } = parsedAnswersData;

    console.log("\n=== Data read from answers_blobId ===\n");
    console.log("answers_ciphertext:", answers_ciphertext);
    console.log("answers_dataToEncryptHash:", answers_dataToEncryptHash);

    let response;
    if (huntType === "IMAGE") {
      // Image verification: requires embedding array
      const userEmbedding = bodyData.embedding;
      if (!userEmbedding || !Array.isArray(userEmbedding)) {
        return res.status(400).json({ 
          error: "embedding array is required for image hunts" 
        });
      }
      console.log("Image hunt - using embedding verification");
      const result = await decryptRunServerMode(
        answers_dataToEncryptHash,
        answers_ciphertext,
        null,
        null,
        clueId,
        huntType,
        userEmbedding
      );
      response = result.response;
    } else {
      // Geolocation verification: requires lat/long
      const curLat = bodyData.cLat;
      const curLong = bodyData.cLong;
      console.log("Geolocation hunt - using location verification");
      const result = await decryptRunServerMode(
        answers_dataToEncryptHash,
        answers_ciphertext,
        curLat,
        curLong,
        clueId,
        huntType,
        null
      );
      response = result.response;
    }

    console.log("Final response:", response);
    res.send({ isClose: response });
  } catch (error) {
    console.error("Error decrypting answer:", error);
    res.status(500).json({
      error: "Failed to decrypt answer",
      message: error.message,
    });
  }
});

app.post("/clues/decrypt", async (req, res) => {
  try {
    const bodyData = req.body;
    const clues_blobId = bodyData.clues_blobId;
    // const userAddress = bodyData.userAddress;

    const cluesData = await readObject(clues_blobId);
    const parsedCluesData = typeof cluesData === 'string' ? JSON.parse(cluesData) : cluesData;
    
    const {
      ciphertext: clues_ciphertext,
      dataToEncryptHash: clues_dataToEncryptHash,
    } = parsedCluesData;

    console.log("clues_dataToEncryptHash: ", clues_dataToEncryptHash);
    console.log("clues_ciphertext: ", clues_ciphertext);

    const { response } = await decryptRunServerMode(
      clues_dataToEncryptHash,
      clues_ciphertext
    );
    res.send({ decryptedData: JSON.parse(response) });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Failed to decrypt clues",
    });
  }
});

app.post("/images", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { buffer, originalname, mimetype } = req.file;
    
    // Upload image to IPFS via Pinata
    const imageCID = await storeFile(buffer, originalname, mimetype);
    
    res.json({
      success: true,
      imageCID,
      imageUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${imageCID}`
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      error: "Failed to upload image",
      message: error.message
    });
  }
});

app.post("/images/metadata", async (req, res) => {
  try {
    const { metadata } = req.body;
    
    if (!metadata) {
      return res.status(400).json({ error: "No metadata provided" });
    }

    // Upload metadata to IPFS via Pinata
    const metadataCID = await storeString(metadata);
    
    res.json({
      success: true,
      metadataCID,
      metadataUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${metadataCID}`
    });
  } catch (error) {
    console.error("Error uploading metadata:", error);
    res.status(500).json({
      error: "Failed to upload metadata",
      message: error.message
    });
  }
});

app.post("/images/embeddings", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { buffer } = req.file;
    console.log("Calling vertex-ai to generate embedding for image");
    // Generate embedding using Vertex AI
    const embedding = await generateImageEmbedding(buffer);
    
    res.json({
      success: true,
      embedding,
      dimension: embedding.length
    });
  } catch (error) {
    console.error("Error generating embedding:", error);
    res.status(500).json({
      error: "Failed to generate embedding",
      message: error.message
    });
  }
});


app.post("/huddles", async (req, res) => {
  try {
    const { huntId, teamId } = req.body;
    
    // Validate required fields
    if (huntId === undefined || teamId === undefined) {
      return res.status(400).json({
        error: "Missing required fields: huntId and teamId",
      });
    }
    
    const roomKey = `${huntId}_${teamId}`;
    
    // Check if room already exists for this team
    if (teamHuddleRooms.has(roomKey)) {
      const existingRoom = teamHuddleRooms.get(roomKey);
      console.log(`Returning existing room for team ${teamId} in hunt ${huntId}: ${existingRoom.roomId}`);
      
      // Generate fresh token for the user
      const token = await getToken(existingRoom.roomId, teamId);
      
      return res.json({
        roomId: existingRoom.roomId,
        token: token,
      });
    }
    
    // Create new room for this team
    console.log(`Creating new room for team ${teamId} in hunt ${huntId}`);
    const roomId = await getRoomId(teamId);
    const token = await getToken(roomId, teamId);
    
    // Store room mapping with timestamp
    teamHuddleRooms.set(roomKey, {
      roomId: roomId,
      createdAt: Date.now(),
    });
    
    console.log(`Stored new room mapping: ${roomKey} -> ${roomId}. Total active rooms: ${teamHuddleRooms.size}`);
    
    res.json({
      roomId: roomId,
      token: token,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Failed to create room or generate token",
    });
  }
});

app.post("/huddles/livestreams", async (req, res) => {
  const bodyData = req.body;
  console.log("BackendbodyData: ", bodyData);
  await startStreaming(
    bodyData.roomId,
    bodyData.token,
    bodyData.streamUrl,
    bodyData.streamKey
  );
  res.send({ message: "Streaming started" });
});

app.delete("/huddles/livestreams/:roomId", async (req, res) => {
  const roomId = req.params.roomId;
  console.log("Backend roomId: ", roomId);
  await stopStreaming(roomId);
  res.send({ message: "Streaming stopped" });
});

// Generate riddles endpoint
app.post("/clues/riddles", async (req, res) => {
  try {
    const { locations, theme } = req.body;

    // Validate input
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        error: "Missing required field: locations (must be a non-empty array)",
      });
    }

    if (!theme || typeof theme !== "string") {
      return res.status(400).json({
        error: "Missing required field: theme (must be a string)",
      });
    }

    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured on server",
      });
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Generate riddles with retry logic
    const generateRiddlesOperation = async () => {
      const prompt = `You are a riddle generator creating a JSON array of treasure hunt riddles.
          Rules:
          1. You will create exactly ${locations.length} riddles.
          2. Each riddle should lead to one of these locations: ${locations.join(", ")}.
          3. Each riddle must incorporate the following themes: ${theme}.
          4. Do not include the actual location names in the riddle text.
          5. Provide a subtle hint for each riddle that aids the solver but does not directly reveal the answer.
          6. Output only valid JSON in this exact structure (no extra text, no explanations):`;

      const aiResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                riddle: {
                  type: Type.STRING,
                },
                hint: {
                  type: Type.STRING,
                },
              },
              propertyOrdering: ["riddle", "hint"],
            },
          },
        },
      });

      if (!aiResponse.text) {
        throw new Error("Unexpected response format from AI - no text content");
      }

      const content = aiResponse.text;
      
      // Validate JSON before parsing
      let parsedRiddles;
      try {
        parsedRiddles = JSON.parse(content);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response from AI: ${jsonError.message}`);
      }

      // Validate the structure of parsed riddles
      if (!Array.isArray(parsedRiddles)) {
        throw new Error("AI response is not an array");
      }

      // Validate each riddle has required properties
      for (let i = 0; i < parsedRiddles.length; i++) {
        const riddle = parsedRiddles[i];
        if (!riddle.riddle || !riddle.hint || typeof riddle.riddle !== 'string' || typeof riddle.hint !== 'string') {
          throw new Error(`Invalid riddle structure at index ${i}`);
        }
      }

      return parsedRiddles;
    };

    const riddles = await withRetry(generateRiddlesOperation);

    res.json({
      success: true,
      riddles,
    });
  } catch (error) {
    console.error("Error generating riddles:", error);
    res.status(500).json({
      error: "Failed to generate riddles",
      message: error.message,
    });
  }
});

// Attest clue attempt endpoint (for retry tracking and hunt start with clueIndex: 0)
app.post("/attestations/attempts", async (req, res) => {
  try {
    const { teamIdentifier, huntId, clueIndex, solverAddress, attemptCount, chainId, contractAddress } = req.body;

    // Validate required fields
    if (huntId === undefined || clueIndex === undefined || !teamIdentifier || !solverAddress || attemptCount === undefined || !chainId || !contractAddress) {
      return res.status(400).json({
        error: "Missing required fields: huntId, clueIndex, teamIdentifier, solverAddress, attemptCount, chainId, contractAddress",
      });
    }

    console.log("Creating attestation for clue attempt:", {
      teamIdentifier,
      huntId,
      clueIndex,
      solverAddress,
      attemptCount,
      chainId,
      contractAddress,
    });

    const attestationInfo = await attestClueAttempt(
      teamIdentifier,
      huntId,
      clueIndex,
      solverAddress,
      attemptCount,
      chainId,
      contractAddress
    );

    res.json({
      success: true,
      attestationId: attestationInfo.attestationId,
      message: "Retry attestation created successfully",
    });
  } catch (error) {
    console.error("Error creating retry attestation:", error);
    res.status(500).json({
      error: "Failed to create retry attestation",
      message: error.message,
    });
  }
});

// Attest clue solve endpoint
app.post("/attestations/clues", async (req, res) => {
  try {
    const { teamIdentifier, huntId, clueIndex, teamLeaderAddress, solverAddress, timeTaken, attemptCount, chainId, contractAddress } = req.body;

    // Validate required fields
    if (huntId === undefined || clueIndex === undefined || !teamLeaderAddress || !teamIdentifier || !solverAddress || timeTaken === undefined || attemptCount === undefined || !chainId || !contractAddress) {
      return res.status(400).json({
        error: "Missing required fields: huntId, clueIndex, teamLeaderAddress, teamIdentifier, solverAddress, timeTaken, attemptCount, chainId, contractAddress",
      });
    }

    console.log("Creating attestation for clue solve:", {
      teamIdentifier,
      huntId,
      clueIndex,
      teamLeaderAddress,
      solverAddress,
      timeTaken,
      attemptCount,
      chainId,
      contractAddress,
    });

    const attestationInfo = await attestClueSolved(
      teamIdentifier,
      huntId,
      clueIndex,
      teamLeaderAddress,
      solverAddress,
      timeTaken,
      attemptCount,
      chainId,
      contractAddress
    );

    res.json({
      success: true,
      attestationId: attestationInfo.attestationId,
      message: "Attestation created successfully",
    });
  } catch (error) {
    console.error("Error creating attestation:", error);
    res.status(500).json({
      error: "Failed to create attestation",
      message: error.message,
    });
  }
});

// Progress check endpoint
app.get("/hunts/:huntId/teams/:teamIdentifier/progress", async (req, res) => {
  try {
    const huntId = parseInt(req.params.huntId);
    const teamIdentifier = req.params.teamIdentifier;
    const totalClues = parseInt(req.query.totalClues) || null;
    const chainId = req.query.chainId;
    const contractAddress = req.query.contractAddress;
    
    
    if (isNaN(huntId)) {
      return res.status(400).json({
        error: "Invalid hunt ID",
      });
    }

    if (!teamIdentifier) {
      return res.status(400).json({
        error: "Team identifier is required",
      });
    }

    if (!chainId) {
      return res.status(400).json({
        error: "Chain ID is required",
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: "Contract address is required",
      });
    }

    console.log(`Checking progress for hunt ${huntId}, team ${teamIdentifier}, totalClues: ${totalClues}, chainId: ${chainId}, contractAddress: ${contractAddress}...`);

    // Get all attestations for this hunt
    const attestations = await queryAttestationsForHunt(huntId, chainId, contractAddress);
    
    if (!attestations || attestations.length === 0) {
      return res.json({
        huntId,
        teamIdentifier,
        latestClueSolved: 0,
        totalClues: totalClues || 0,
        isHuntCompleted: false,
        nextClue: 1,
        message: "No progress found for this hunt"
      });
    }

    // Filter attestations for this team
    const teamAttestations = attestations.filter(attestation => {
      const data = JSON.parse(attestation.data);
      return data.teamIdentifier === teamIdentifier;
    });

    if (teamAttestations.length === 0) {
      return res.json({
        huntId,
        teamIdentifier,
        latestClueSolved: 0,
        totalClues: totalClues || 0,
        isHuntCompleted: false,
        nextClue: 1,
        message: "No progress found for this team"
      });
    }

    // Find the highest clue index solved by this team and build a map of solve timestamps
    let latestClueSolved = 0;
    const solvedClues = {}; // Map of clueIndex -> { solveTimestamp }
    
    for (const attestation of teamAttestations) {
      const data = JSON.parse(attestation.data);
      const clueIndex = parseInt(data.clueIndex);
      
      // Store solve timestamp (in seconds) for each clue
      solvedClues[clueIndex] = {
        solveTimestamp: Math.floor(parseInt(attestation.attestTimestamp) / 1000)
      };
      
      if (clueIndex > latestClueSolved) {
        latestClueSolved = clueIndex;
      }
    }

    // Use totalClues from frontend
    const finalTotalClues = totalClues || 0; 
    const isHuntCompleted = latestClueSolved >= finalTotalClues;

    res.json({
      huntId,
      teamIdentifier,
      latestClueSolved,
      totalClues: finalTotalClues,
      isHuntCompleted,
      nextClue: isHuntCompleted ? null : latestClueSolved + 1,
      solvedClues // Include solve timestamps for each clue
    });
  } catch (error) {
    console.error("Error checking progress:", error);
    res.status(500).json({
      error: "Failed to check progress",
      message: error.message,
    });
  }
});

// Get retry attempts for a specific clue and team (also used for hunt start with clueIndex: 0)
app.get("/hunts/:huntId/clues/:clueIndex/teams/:teamIdentifier/attempts", async (req, res) => {
  try {
    const huntId = parseInt(req.params.huntId);
    const clueIndex = parseInt(req.params.clueIndex);
    const teamIdentifier = req.params.teamIdentifier;
    const chainId = req.query.chainId;
    const contractAddress = req.query.contractAddress;
    
    if (isNaN(huntId) || isNaN(clueIndex)) {
      return res.status(400).json({
        error: "Invalid hunt ID or clue index",
      });
    }

    if (!teamIdentifier) {
      return res.status(400).json({
        error: "Team identifier is required",
      });
    }

    if (!chainId) {
      return res.status(400).json({
        error: "Chain ID is required",
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: "Contract address is required",
      });
    }

    console.log(`Fetching retry attempts for hunt ${huntId}, clue ${clueIndex}, team ${teamIdentifier}, chainId ${chainId}, contractAddress ${contractAddress}...`);

    // Get all retry attestations for this clue and team
    const retryAttestations = await queryRetryAttemptsForClue(huntId, clueIndex, teamIdentifier, chainId, contractAddress);
    
    if (!retryAttestations || retryAttestations.length === 0) {
      return res.json({
        huntId,
        clueIndex,
        teamIdentifier,
        attemptCount: 0,
        firstAttemptTimestamp: null,
        latestAttemptTimestamp: null,
        message: "No attempts found for this clue"
      });
    }

    // Parse and sort attempts by attestTimestamp
    // attestTimestamp is in milliseconds, convert to seconds for consistency
    const attempts = retryAttestations.map(attestation => {
      const data = JSON.parse(attestation.data);
      return {
        attemptCount: parseInt(data.attemptCount),
        timestamp: Math.floor(parseInt(attestation.attestTimestamp) / 1000), // Convert from ms to seconds
        solverAddress: data.solverAddress,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    const firstAttempt = attempts[0];
    const latestAttempt = attempts[attempts.length - 1];

    res.json({
      huntId,
      clueIndex,
      teamIdentifier,
      attemptCount: attempts.length,
      firstAttemptTimestamp: firstAttempt.timestamp,
      latestAttemptTimestamp: latestAttempt.timestamp
    });
  } catch (error) {
    console.error("Error fetching retry attempts:", error);
    res.status(500).json({
      error: "Failed to fetch retry attempts",
      message: error.message,
    });
  }
});

// Leaderboard endpoint
app.get("/hunts/:huntId/leaderboard", async (req, res) => {
  try {
    const huntId = parseInt(req.params.huntId);
    const chainId = req.query.chainId;
    const contractAddress = req.query.contractAddress;
    
    if (isNaN(huntId)) {
      return res.status(400).json({
        error: "Invalid hunt ID",
      });
    }

    if (!chainId) {
      return res.status(400).json({
        error: "Chain ID is required",
      });
    }

    if (!contractAddress) {
      return res.status(400).json({
        error: "Contract address is required",
      });
    }

    console.log(`Fetching leaderboard for hunt ${huntId}, chainId ${chainId}, contractAddress ${contractAddress}...`);

    // Query all attestations for this hunt
    const attestations = await queryAttestationsForHunt(huntId, chainId, contractAddress);
    
    if (attestations.length === 0) {
      return res.json({
        huntId,
        leaderboard: [],
        message: "No teams have solved any clues yet"
      });
    }

    // Use the extracted leaderboard calculation function
    const rankedLeaderboard = calculateLeaderboardForHunt(attestations, huntId);

    res.json({
      huntId,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch leaderboard",
      message: error.message,
    });
  }
});

// Add health check endpoint for Docker
app.get("/health", (req, res) => {
  console.log("Server is healthy");
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server listening at ${(process.env.HOST || "http://localhost")}:${port}`);
});
