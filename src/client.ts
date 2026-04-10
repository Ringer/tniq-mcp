import type { Config } from "./config.js";

export class TniqClient {
  private baseUrl: string;
  private apiToken: string | null;
  private timeoutMs: number;

  get isAnonymous(): boolean {
    return this.apiToken === null;
  }

  constructor(config: Config) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiToken = config.apiToken;
    this.timeoutMs = config.requestTimeoutMs;
  }

  async get(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<unknown> {
    const url = this.buildUrl(path, params);
    return this.request(url, { method: "GET" });
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    const url = this.buildUrl(path);
    return this.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put(path: string, body?: unknown): Promise<unknown> {
    const url = this.buildUrl(path);
    return this.request(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown
  ): Promise<unknown> {
    const url = this.buildUrl(path, params);
    const init: RequestInit = { method: "DELETE" };
    if (body !== undefined) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    return this.request(url, init);
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          ...((init.headers as Record<string, string>) || {}),
          ...this.authHeaders(),
          Accept: "application/json",
        },
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          _error: true,
          status: response.status,
          message: this.describeHttpError(response.status),
          body: this.tryParseJson(text),
        };
      }

      return this.tryParseJson(text);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          _error: true,
          status: 0,
          message: `Request timed out after ${this.timeoutMs}ms`,
        };
      }
      return {
        _error: true,
        status: 0,
        message: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private authHeaders(): Record<string, string> {
    if (!this.apiToken) return {};
    return { Authorization: "Bearer " + this.apiToken };
  }

  private tryParseJson(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private describeHttpError(status: number): string {
    switch (status) {
      case 400:
        return "Bad request — check parameter format";
      case 401:
      case 403:
        return "Authentication failed — check TNIQ_API_TOKEN";
      case 404:
        return "Not found";
      case 429:
        return "Rate limit exceeded";
      case 502:
      case 503:
        return "Service temporarily unavailable";
      default:
        return `HTTP ${status}`;
    }
  }
}
