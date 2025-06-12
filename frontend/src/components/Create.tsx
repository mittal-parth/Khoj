import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { huntABI } from "../assets/hunt_abi";
import { type Abi } from "viem";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CONTRACT_ADDRESSES } from "../lib/utils";

// Add type assertion for the ABI
const typedHuntABI = huntABI as Abi;

const BACKEND_URL = "http://localhost:8000";

interface Clue {
  id: number;
  lat: number;
  long: number;
  description: string;
  answer: string;
}

interface ClueData {
  id: number;
  description: string;
}

interface AnswerData {
  id: number;
  answer: string;
  lat: number;
  long: number;
}

interface IPFSResponse {
  clues_blobId: string;
  answers_blobId: string;
}

export function Create() {
  const { address } = useAccount();
  const [huntName, setHuntName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
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

  // Add this to get current network from localStorage
  const currentNetwork = localStorage.getItem("current_network") || "base";
  console.log("Create: Current Network: ", currentNetwork);
  const contractAddress =
    CONTRACT_ADDRESSES[currentNetwork as keyof typeof CONTRACT_ADDRESSES];

  const { writeContract, isError, error, isPending, data: hash } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

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

  const handleCreateHunt = async () => {
    if (!huntName || !description || !startDate || !duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!cluesCID || !answersCID) {
      toast.error("Please provide both CIDs");
      return;
    }

    try {
      // Convert date to YYYYMMDD format
      const formattedDate = startDate.split("-").join("");
      
      // Convert duration to seconds
      const durationInSeconds = parseInt(duration) * 3600; // Convert hours to seconds
      console.log("Create: Contract Address: ", contractAddress);
      writeContract({
        address: contractAddress,
        abi: typedHuntABI,
        functionName: "createHunt",
        args: [
          huntName,
          description,
          BigInt(formattedDate),
          cluesCID,
          answersCID,
          BigInt(durationInSeconds),
        ],
      });

    } catch (err) {
      console.error("Error creating hunt:", err);
      toast.error("Failed to create hunt");
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

      const answersData: AnswerData[] = clues.map(({ id, answer, lat, long }) => ({
        id,
        answer,
        lat,
        long,
      }));

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
      toast.success("Successfully uploaded to IPFS! Please copy the CIDs below to the CID input fields.");
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
    setStartDate("");
    setDuration("");
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
  };

  // Handle error case
  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  // Handle success case
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Hunt created successfully!");
      resetForm();
    }
  }, [isConfirmed]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Hunt</h1>

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

          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Enter duration in hours"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">IPFS Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="cluesCID">Clues CID</Label>
                <Input
                  id="cluesCID"
                  value={cluesCID}
                  onChange={(e) => setCluesCID(e.target.value)}
                  placeholder="Enter clues CID"
                />
              </div>

              <div>
                <Label htmlFor="answersCID">Answers CID</Label>
                <Input
                  id="answersCID"
                  value={answersCID}
                  onChange={(e) => setAnswersCID(e.target.value)}
                  placeholder="Enter answers CID"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateHunt}
            disabled={isPending || isConfirming || !cluesCID || !answersCID}
            className="w-full bg-yellow/40 border border-black text-black hover:bg-orange/90 py-2 rounded-md font-medium"
          >
            {isPending || isConfirming ? "Creating Hunt..." : "Create Hunt"}
          </Button>
        </div>

        <div className="space-y-6">
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
                placeholder="Enter clue description"
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
              <div
                key={clue.id}
                className="p-3 bg-gray-100 rounded-md"
              >
                <p className="font-medium">Clue {clue.id}</p>
                <p className="text-sm text-gray-600">{clue.description}</p>
                <p className="text-xs text-gray-500">
                  Location: {clue.lat}, {clue.long}
                </p>
                <p className="text-xs text-gray-500">
                  Answer: {clue.answer}
                </p>
              </div>
            ))}
            {uploadedCIDs && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm font-medium text-green-800">IPFS Upload Complete</p>
                <p className="text-xs text-green-600">Clues CID: {uploadedCIDs.clues_blobId}</p>
                <p className="text-xs text-green-600">Answers CID: {uploadedCIDs.answers_blobId}</p>
                <p className="text-xs text-amber-600 mt-2">
                  Please copy these CIDs to the respective fields in the IPFS Configuration section
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
