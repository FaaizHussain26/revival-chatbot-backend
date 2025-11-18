import crypto from "crypto";


export const generateHash = (content: string): string => {
  return crypto.createHash("sha256").update(content).digest("hex");
};

export const compareHashes = (hash1: string, hash2: string): boolean => {
  return hash1 === hash2;
};
