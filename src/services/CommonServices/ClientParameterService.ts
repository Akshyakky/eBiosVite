import { APIConfig } from "../../apiConfig";

import { CommonApiService, type ApiConfig } from "../CommonApiService";

// Create API configuration
const apiConfig: ApiConfig = {
  baseURL: APIConfig.moduleURL,
};

// Initialize the CommonApiService with our configuration
const apiService = new CommonApiService(apiConfig);

/**
 * Fetch client parameters from the server.
 * @param {string} clientCode - The code of the client to fetch parameters for.
 * @returns {Promise<any>} - The fetched client parameters.
 * @throws {Error} - Throws an error if the request fails.
 */
const getClientParameter = async (clientCode: string): Promise<any> => {
  try {
    // Using the CommonApiService to make the request with params
    const response = await apiService.get<any>(
      "GetClientParameter",
      undefined, // No token required for this endpoint
      { ClientCode: clientCode }
    );
    return response;
  } catch (error) {
    // CommonApiService already handles basic error logging
    // We can add additional client parameter specific error handling if needed
    console.error(`Failed to retrieve client parameter for code ${clientCode}:`, error);
    throw error; // Re-throw to allow the calling component to handle the error
  }
};

export const ClientParameterService = {
  getClientParameter,
};
