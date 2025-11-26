import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { huntABI } from "../assets/hunt_abi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TransactionButton } from "./TransactionButton";
import { useNetworkState } from "../lib/utils";
import { Clue, ClueData, AnswerData, IPFSResponse } from "../types";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;
const IPFS_GATEWAY = import.meta.env.VITE_PUBLIC_IPFS_GATEWAY || "harlequin-fantastic-giraffe-234.mypinata.cloud";

// Type guard to ensure address is a valid hex string
function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}


export function Create() {
  const account = useActiveAccount();
  const address = account?.address;

  const [huntName, setHuntName] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState(() => {
    // Set default start datetime to tomorrow at 12:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  });
  const [endDateTime, setEndDateTime] = useState(() => {
    // Set default end datetime to day after tomorrow at 12:00
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(12, 0, 0, 0);
    return dayAfterTomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  });
  const [clues, setClues] = useState<Clue[]>([]);
  const [currentClue, setCurrentClue] = useState<Partial<Clue>>({
    id: 1,
    description: "",
    answer: "",
    lat: 0,
    long: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCIDs, setUploadedCIDs] = useState<IPFSResponse | null>(null);
  const [cluesCID, setCluesCID] = useState("");
  const [answersCID, setAnswersCID] = useState("");
  const [healthCheckStatus, setHealthCheckStatus] = useState<string | null>(null);
  
  // Mode toggle: false = Enter Clues mode, true = Direct CID mode
  const [useDirectCID, setUseDirectCID] = useState(false);
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageCID, setUploadedImageCID] = useState<string>("");
  const [nftMetadataCID, setNftMetadataCID] = useState<string>("");
  
  // New state variables for previously hardcoded fields
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [maxTeamSize, setMaxTeamSize] = useState("1");
  const [theme, setTheme] = useState("");

  // Use the reactive network state hook
  const { currentNetwork, contractAddress, chainId } = useNetworkState();

  // Log network info only when component mounts or network changes
  useEffect(() => {
    console.log("Create: Current Network: ", currentNetwork);
    console.log("Create: Chain ID: ", chainId);
    console.log("Create: Contract Address: ", contractAddress);
  }, [currentNetwork, chainId, contractAddress]);

  if (!isValidHexAddress(contractAddress)) {
    toast.error("Invalid contract address format");
    return null;
  }

  // Check if contract address is the zero address (not deployed)
  if (contractAddress === "0x0000000000000000000000000000000000000000") {
    toast.error("Contract not deployed - check environment variables");
    return null;
  }

  const handleAddClue = () => {
    if (
      currentClue.lat !== undefined &&
      currentClue.long !== undefined &&
      currentClue.description &&
      currentClue.answer &&
      currentClue.id
    ) {
      setClues((prev) => [...prev, currentClue as Clue]);
      setCurrentClue({
        id: (currentClue.id || 0) + 1,
        description: "",
        answer: "",
        lat: 0,
        long: 0,
      });
      toast.success("Clue added successfully!");
    } else {
      toast.error("Please fill in all clue details");
    }
  };

  const getTransactionArgs = () => {
    // Check if all required fields are filled (without showing toast errors)
    if (
      !huntName ||
      !description ||
      !startDateTime ||
      !endDateTime ||
      !cluesCID ||
      !answersCID ||
      !nftMetadataCID
    ) {
      return null;
    }

    // Convert datetime-local inputs to Unix timestamps
    const startTimestamp = Math.floor(new Date(startDateTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000);

    // Validate parameters (without showing toast errors)
    if (huntName.length === 0 || description.length === 0) {
      return null;
    }
    
    if (cluesCID.length === 0 || answersCID.length === 0) {
      return null;
    }
    
    if (endTimestamp <= startTimestamp) {
      return null;
    }

    const args = [
      huntName,
      description,
      startTimestamp,
      endTimestamp,
      cluesCID,
      answersCID,
      teamsEnabled, // teamsEnabled
      BigInt(parseInt(maxTeamSize)), // maxTeamSize
      theme, // theme
      `ipfs://${nftMetadataCID}`, // nftMetadataURI
    ];

    console.log("Transaction args:", args);
    console.log("Start timestamp:", startTimestamp, "End timestamp:", endTimestamp, "Current time:", Math.floor(Date.now() / 1000));
    
    return args;
  };

  const handleTransactionSuccess = () => {
    toast.success("Hunt created successfully!");
    resetForm();
  };

  const validateForm = () => {
    if (huntName.trim().length === 0 || description.trim().length === 0) {
      toast.error("Hunt name and description cannot be empty");
      return false;
    }
    
    if (cluesCID.length === 0 || answersCID.length === 0) {
      toast.error("Both CIDs must be provided");
      return false;
    }

    if (teamsEnabled && parseInt(maxTeamSize) < 2) {
      toast.error("Max team size must be at least 2");
      return false;
    }
    
    // Validate start and end times
    const startTimestamp = Math.floor(new Date(startDateTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000);
    
    if (endTimestamp <= startTimestamp) {
      toast.error("End time must be after start time");
      return false;
    }

    if (!nftMetadataCID) {
      toast.error("Please upload an NFT image first");
      return false;
    }

    return true;
  };

  const handleTransactionError = (error: any) => {
    console.error("Error creating hunt:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    // Try to extract more detailed error information
    if (error?.cause?.data) {
      console.error("Error data:", error.cause.data);
    }
    if (error?.reason) {
      console.error("Error reason:", error.reason);
    }
    
    toast.error(error.message || error.reason || "Failed to create hunt");
  };

  const testBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log("Backend health check response:", BACKEND_URL, data);
        setHealthCheckStatus("✅ Backend is healthy");
        toast.success("Backend is working!");
      } else {
        setHealthCheckStatus(`❌ Backend error: ${response.status}`);
        toast.error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      setHealthCheckStatus("❌ Backend unreachable");
      toast.error("Backend is unreachable");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch(`${BACKEND_URL}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setUploadedImageCID(data.imageCID);
      // toast.success("Image uploaded successfully!");
      
      // Auto-generate NFT metadata
      await createNFTMetadata(data.imageCID);
      
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const createNFTMetadata = async (imageCID: string) => {
    try {
      // Create NFT metadata following OpenSea standard
      const metadata = {
        name: huntName || "Khoj NFT",
        description: description || "Participation NFT for Khoj",
        image: `ipfs://${imageCID}`,
        attributes: [
          {
            trait_type: "Hunt Name",
            value: huntName || "Unknown Hunt"
          },
          {
            trait_type: "Created At",
            value: new Date().toISOString()
          }
        ],
        external_url: "", // Could be set to hunt URL later
      };

      // Upload metadata to IPFS via backend
      const response = await fetch(`${BACKEND_URL}/upload-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload NFT metadata to IPFS');
      }

      const data = await response.json();
      setNftMetadataCID(data.metadataCID);
      toast.success("NFT metadata created and uploaded!");
      
    } catch (error) {
      console.error("Error creating NFT metadata:", error);
      toast.error("Failed to create NFT metadata");
    }
  };

  const uploadToIPFS = async () => {
    if (clues.length === 0) {
      toast.error("Please add at least one clue before uploading");
      return;
    }

    setIsUploading(true);

    try {
      // Prepare clues and answers data
      const cluesData: ClueData[] = clues.map(({ id, description }) => ({
        id,
        description,
      }));

      const answersData: AnswerData[] = clues.map(
        ({ id, answer, lat, long }) => ({
          id,
          answer,
          lat,
          long,
        })
      );

      const response = await fetch(`${BACKEND_URL}/encrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clues: cluesData,
          answers: answersData,
          userAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload to IPFS");
      }

      const data = await response.json();
      setUploadedCIDs(data);
      
      // Automatically populate the IPFS configuration fields with the returned blob IDs
      setCluesCID(data.clues_blobId);
      setAnswersCID(data.answers_blobId);
      
      toast.success(
        "Successfully uploaded to IPFS! CIDs have been automatically added to the configuration."
      );
    } catch (err) {
      console.error("Error uploading to IPFS:", err);
      toast.error("Failed to upload to IPFS");
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setHuntName("");
    setDescription("");
    setStartDateTime(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      return tomorrow.toISOString().slice(0, 16);
    });
    setEndDateTime(() => {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(12, 0, 0, 0);
      return dayAfterTomorrow.toISOString().slice(0, 16);
    });
    setClues([]);
    setCurrentClue({
      id: 1,
      description: "",
      answer: "",
      lat: 0,
      long: 0,
    });
    setCluesCID("");
    setAnswersCID("");
    setUploadedCIDs(null);
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedImageCID("");
    setNftMetadataCID("");
    setTeamsEnabled(false);
    setMaxTeamSize("1");
    setTheme("");
  };

  const transactionArgs = getTransactionArgs();
  const canCreateHunt = transactionArgs !== null && account;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Hunt</h1>

      {/* Simple Backend Health Check */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="flex items-center gap-4">
          <Button onClick={testBackendHealth} variant="outline" size="sm">
            Test Backend
          </Button>
          {healthCheckStatus && (
            <span className="text-sm">{healthCheckStatus}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <Label htmlFor="huntName">Hunt Name</Label>
            <Input
              id="huntName"
              value={huntName}
              onChange={(e) => setHuntName(e.target.value)}
              placeholder="Enter hunt name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter hunt description"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDateTime">Start Date & Time</Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDateTime">End Date & Time</Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <input
                id="teamsEnabled"
                type="checkbox"
                checked={teamsEnabled}
                onChange={(e) => {
                  setTeamsEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setMaxTeamSize("1");
                  }
                }}
                className="rounded-sm"
              />
              <Label htmlFor="teamsEnabled">Enable Teams</Label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Allow participants to form teams for this hunt
            </p>
          </div>

          {teamsEnabled && (
            <div>
              <Label htmlFor="maxTeamSize">Max Team Size</Label>
              <Input
                id="maxTeamSize"
                type="number"
                min="2"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(e.target.value)}
                placeholder="Enter maximum team size"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of participants per team
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="theme">Theme</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Adventure, tech, or a mix of themes. It can be a word or a phrase and will influence the clues"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">NFT Image</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nftImage">Hunt NFT Image</Label>
                <Input
                  id="nftImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select an image for the hunt participation NFT (Max 10MB)
                </p>
              </div>

              {imagePreview && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview:</p>
                  <img
                    src={imagePreview}
                    alt="NFT Preview"
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                  <Button
                    onClick={uploadImage}
                    disabled={isUploadingImage}
                    variant="outline"
                    className="bg-blue-50"
                  >
                    {isUploadingImage ? "Uploading..." : "Upload Image to IPFS"}
                  </Button>
                </div>
              )}

              {uploadedImageCID && (
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm font-medium text-green-800">✅ Image Uploaded Successfully!</p>
                  <p className="text-xs text-green-600">Image CID: {uploadedImageCID}</p>
                  <a 
                    href={`https://${IPFS_GATEWAY}/ipfs/${uploadedImageCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    🔗 View Image on IPFS
                  </a>
                  {nftMetadataCID && (
                    <>
                      <p className="text-xs text-green-600 mt-2">Metadata CID: {nftMetadataCID}</p>
                      <a 
                        href={`https://${IPFS_GATEWAY}/ipfs/${nftMetadataCID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline block"
                      >
                        🔗 View Metadata on IPFS
                      </a>
                      <p className="text-xs text-green-600 mt-1">✅ NFT metadata created! Ready to create hunt.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">

            <div className="space-y-4">
              <div>
              </div>

              <div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Clue Entry Mode</h3>
                <p className="text-xs text-gray-500">
                  {useDirectCID 
                    ? "Enter existing CIDs directly to reuse clues" 
                    : "Create new clues and upload to IPFS"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${!useDirectCID ? 'font-semibold' : 'text-gray-500'}`}>
                  Enter Clues
                </span>
                <button
                  type="button"
                  onClick={() => setUseDirectCID(!useDirectCID)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useDirectCID ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useDirectCID ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${useDirectCID ? 'font-semibold' : 'text-gray-500'}`}>
                  Direct CID
                </span>
              </div>
            </div>
          </div>

          {/* Direct CID Entry Mode */}
          {useDirectCID ? (
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Enter CIDs Directly</h2>
                <p className="text-sm text-gray-500 mt-1">
                  If you have existing clues and answers uploaded to IPFS, enter their CIDs below.
                </p>
              </div>

              <div>
                <Label htmlFor="directCluesCID">Clues CID</Label>
                <Input
                  id="directCluesCID"
                  value={cluesCID}
                  onChange={(e) => setCluesCID(e.target.value)}
                  placeholder="Enter the clues CID (e.g., bafk...)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The IPFS/blob CID containing the clues data
                </p>
              </div>

              <div>
                <Label htmlFor="directAnswersCID">Answers CID</Label>
                <Input
                  id="directAnswersCID"
                  value={answersCID}
                  onChange={(e) => setAnswersCID(e.target.value)}
                  placeholder="Enter the answers CID (e.g., bafk...)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The IPFS/blob CID containing the encrypted answers data
                </p>
              </div>

              {cluesCID && answersCID && (
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm font-medium text-green-800">✅ CIDs Configured</p>
                  <p className="text-xs text-green-600">Clues CID: {cluesCID}</p>
                  <p className="text-xs text-green-600">Answers CID: {answersCID}</p>
                </div>
              )}
            </div>
          ) : (
            /* Enter Clues Mode - Original UI */
            <>
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Add Clue</h2>
                  {clues.length > 0 && (
                    <Button
                      onClick={uploadToIPFS}
                      disabled={isUploading}
                      variant="outline"
                      className="bg-green-50"
                    >
                      {isUploading ? "Uploading..." : "Upload Clues to IPFS"}
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor="clueDescription">Clue Description</Label>
                  <Textarea
                    id="clueDescription"
                    value={currentClue.description}
                    onChange={(e) =>
                      setCurrentClue((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter clue description. Clues will be generated using Generative AI based on the theme and the description of the clue."
                  />
                </div>

                <div>
                  <Label htmlFor="clueAnswer">Clue Answer</Label>
                  <Input
                    id="clueAnswer"
                    value={currentClue.answer}
                    onChange={(e) =>
                      setCurrentClue((prev) => ({
                        ...prev,
                        answer: e.target.value,
                      }))
                    }
                    placeholder="Enter the answer to this clue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={currentClue.lat}
                      onChange={(e) =>
                        setCurrentClue((prev) => ({
                          ...prev,
                          lat: parseFloat(e.target.value),
                        }))
                      }
                      placeholder="Enter latitude"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={currentClue.long}
                      onChange={(e) =>
                        setCurrentClue((prev) => ({
                          ...prev,
                          long: parseFloat(e.target.value),
                        }))
                      }
                      placeholder="Enter longitude"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddClue}
                  className="w-full"
                  variant="outline"
                >
                  Add Clue
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Added Clues:</h3>
                {clues.map((clue) => (
                  <div key={clue.id} className="p-3 bg-gray-100 rounded-md">
                    <p className="font-medium">Clue {clue.id}</p>
                    <p className="text-sm text-gray-600">{clue.description}</p>
                    <p className="text-xs text-gray-500">
                      Location: {clue.lat}, {clue.long}
                    </p>
                    <p className="text-xs text-gray-500">Answer: {clue.answer}</p>
                  </div>
                ))}
                {uploadedCIDs && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="text-sm font-medium text-green-800">
                      IPFS Upload Complete
                    </p>
                    <p className="text-xs text-green-600">
                      Clues CID: {uploadedCIDs.clues_blobId}
                    </p>
                    <p className="text-xs text-green-600">
                      Answers CID: {uploadedCIDs.answers_blobId}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Create Hunt Button - Moved to right side */}
          <div className="mt-8">
            {canCreateHunt ? (
              <TransactionButton
                contractAddress={contractAddress}
                abi={huntABI}
                functionName="createHunt"
                args={transactionArgs}
                text="Create Hunt"
                className="w-full bg-yellow/40 border border-black text-black hover:bg-orange/90 py-2 rounded-md font-medium"
                onSuccess={handleTransactionSuccess}
                onError={handleTransactionError}
                onClick={validateForm}
              />
            ) : (
              <Button
                disabled
                className="w-full bg-gray-300 text-gray-500 py-2 rounded-md font-medium"
              >
                {!account
                  ? "Connect Wallet to Create Hunt"
                  : !nftMetadataCID
                  ? "Upload NFT image to continue"
                  : !cluesCID || !answersCID
                  ? useDirectCID 
                    ? "Enter both Clues CID and Answers CID"
                    : "Upload clues to IPFS to continue"
                  : "Fill in all fields to create hunt"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
