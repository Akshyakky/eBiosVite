import { APIConfig } from "../../apiConfig";
import type { Company } from "../../types/Common/Company.type";
import type { ApiConfig } from "../CommonApiService";
import { CommonApiService } from "../CommonApiService";

// Create API configuration
const apiConfig: ApiConfig = {
  baseURL: APIConfig.moduleURL,
};

// Initialize the CommonApiService with our configuration
const apiService = new CommonApiService(apiConfig);

/**
 * Retrieves the list of companies from the API
 * @returns Promise containing an array of Company objects
 */
const getCompanies = async (): Promise<Company[]> => {
  try {
    // Using the CommonApiService to make the request
    // Note: No token is needed as this is called from the login page
    const response = await apiService.get<Company[]>("GetCompanies");
    return response;
  } catch (error) {
    // The CommonApiService already handles basic error logging
    // We can add additional company-specific error handling here if needed
    console.error("Failed to retrieve companies:", error);
    throw error; // Re-throw to allow the calling component to handle the error
  }
};

export const CompanyService = {
  getCompanies,
};
