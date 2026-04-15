/**
 * @promptgit/sdk — JavaScript/TypeScript SDK for PromptGit
 * Fetch production prompts at runtime in any Node.js or browser app.
 */

export interface PromptGitConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PromptVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface PromptVersion {
  id: string;
  versionTag: string;
  content: string;
  variables: PromptVariable[];
  environment: 'DEV' | 'STAGING' | 'PRODUCTION';
  model?: string;
  createdAt: string;
}

export interface FetchOptions {
  env?: 'DEV' | 'STAGING' | 'PRODUCTION';
  version?: string;
}

export class PromptGit {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: PromptGitConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.promptgit.dev';
  }

  /**
   * Fetch a prompt by slug, optionally specifying environment or exact version.
   * Results are cached in-process for 60 seconds.
   */
  async getPrompt(slug: string, options: FetchOptions = {}): Promise<PromptVersionWithHelpers> {
    const params = new URLSearchParams();
    if (options.env) params.set('env', options.env);
    if (options.version) params.set('version', options.version);

    const url = `${this.baseUrl}/sdk/prompts/${slug}?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`PromptGit SDK: Failed to fetch "${slug}" — ${res.status} ${res.statusText}`);
    }

    const version: PromptVersion = await res.json();
    return new PromptVersionWithHelpers(version);
  }

  async listVersions(slug: string): Promise<PromptVersion[]> {
    const res = await fetch(`${this.baseUrl}/sdk/prompts/${slug}/versions`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`PromptGit SDK: ${res.statusText}`);
    return res.json();
  }
}

export class PromptVersionWithHelpers implements PromptVersion {
  id: string;
  versionTag: string;
  content: string;
  variables: PromptVariable[];
  environment: 'DEV' | 'STAGING' | 'PRODUCTION';
  model?: string;
  createdAt: string;

  constructor(version: PromptVersion) {
    Object.assign(this, version);
  }

  /**
   * Replace {variable} placeholders with provided values.
   * Falls back to defaultValue if not supplied.
   */
  interpolate(values: Record<string, string> = {}): string {
    return this.content.replace(/{([\w_]+)}/g, (_, key) => {
      if (values[key] !== undefined) return values[key];
      const variable = this.variables.find((v) => v.name === key);
      if (variable?.defaultValue) return variable.defaultValue;
      if (variable?.required) throw new Error(`PromptGit: required variable "${key}" not provided`);
      return `{${key}}`;
    });
  }

  /** Returns variables with missing required ones flagged */
  validate(values: Record<string, string> = {}): { valid: boolean; missing: string[] } {
    const missing = this.variables
      .filter((v) => v.required && !values[v.name] && !v.defaultValue)
      .map((v) => v.name);
    return { valid: missing.length === 0, missing };
  }
}
