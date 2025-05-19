import axios from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import { format, toZonedTime } from "date-fns-tz";
import CryptoJS from "crypto-js";

export interface ApiConfig {
  baseURL: string;
}

type HttpMethod = "get" | "post" | "put" | "delete";

export class CommonApiService {
  private readonly baseURL: string;
  private readonly timeZone: string;
  private readonly apiSecret: string;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.apiSecret = import.meta.env.VITE_API_SECRET;
  }

  private generateSignature(data: unknown): string {
    const payload = JSON.stringify(this.processData(data));
    // Using crypto-js for browser compatibility
    const hmac = CryptoJS.HmacSHA256(payload, this.apiSecret);
    return hmac.toString().toLowerCase();
  }

  private generateUUID(): string {
    // Try native implementation first
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    // Fallback implementation
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getHeaders(token?: string, additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Time-Zone": this.timeZone,
      //"X-Request-ID": crypto.randomUUID ? crypto.randomUUID() : self.crypto.randomUUID(),
      "X-Request-ID": this.generateUUID(),
      "X-Request-Timestamp": new Date().toISOString(),
      // Prevent MIME type sniffing
      "X-Content-Type-Options": "nosniff",
      // Prevent clickjackingx
      "X-Frame-Options": "DENY",
      // Enable strict XSS protection
      "X-XSS-Protection": "1; mode=block",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return { ...headers, ...additionalHeaders };
  }

  private formatDateWithTimeZone(date: Date): string {
    const zonedDate = toZonedTime(date, this.timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: this.timeZone });
  }

  private processData(data: unknown): unknown {
    if (data instanceof Date) {
      return this.formatDateWithTimeZone(data);
    } else if (Array.isArray(data)) {
      return data.map((item) => this.processData(item));
    } else if (typeof data === "object" && data !== null) {
      return Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = this.processData(value);
        return acc;
      }, {} as Record<string, unknown>);
    }
    return data;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    token?: string,
    additionalHeaders?: Record<string, string>,
    params?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    const processedData = this.processData(data);
    const signature = this.generateSignature(processedData);

    const config: AxiosRequestConfig = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        ...this.getHeaders(token, additionalHeaders),
        "X-Request-Signature": signature,
      },
      data: processedData,
      params: this.processData(params),
      withCredentials: true,
      // Add request timeout
      timeout: 30000,
      // Limit response size
      maxContentLength: 10 * 1024 * 1024, // 10MB
      maxBodyLength: 10 * 1024 * 1024, // 10MB
      // Validate status
      validateStatus: (status) => status >= 200 && status < 300,
    };

    return axios(config);
  }

  private async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    token?: string,
    additionalHeaders?: Record<string, string>,
    params?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await this.request<T>(method, endpoint, data, token, additionalHeaders, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async get<T>(endpoint: string, token?: string, params?: Record<string, unknown>, additionalHeaders?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>("get", endpoint, undefined, token, additionalHeaders, params);
  }

  public async post<T>(endpoint: string, data: unknown, token?: string, additionalHeaders?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>("post", endpoint, data, token, additionalHeaders);
  }

  public async put<T>(endpoint: string, data: unknown, token?: string, additionalHeaders?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>("put", endpoint, data, token, additionalHeaders);
  }

  public async delete<T>(endpoint: string, token?: string, data?: unknown, additionalHeaders?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>("delete", endpoint, data, token, additionalHeaders);
  }

  public async getBlob(endpoint: string, token?: string, params?: Record<string, unknown>, additionalHeaders?: Record<string, string>): Promise<Blob> {
    try {
      const config: AxiosRequestConfig = {
        method: "get",
        url: `${this.baseURL}${endpoint}`,
        headers: this.getHeaders(token, additionalHeaders),
        params: this.processData(params),
        responseType: "blob",
        withCredentials: true,
      };
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
