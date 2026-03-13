type ApiResponse<T> = {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: T;
};

export type Zone = {
  id: string;
  name: string;
  account: { id: string; name?: string };
};

export type Tunnel = {
  id: string;
  name: string;
};

export class CloudflareClient {
  constructor(private readonly apiToken: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
        ...(init?.headers ?? {}),
      },
    });

    const data = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !data.success) {
      const errorMessage = data?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
      throw new Error(`Cloudflare API 请求失败 (${path}): ${errorMessage}`);
    }
    return data.result;
  }

  async listZones(): Promise<Zone[]> {
    const result = await this.request<Array<Zone>>("/zones?status=active&per_page=50");
    return result;
  }

  async listTunnels(accountId: string): Promise<Tunnel[]> {
    const result = await this.request<{ tunnels: Tunnel[] }>(`/accounts/${accountId}/cfd_tunnel?is_deleted=false`);
    return result.tunnels ?? [];
  }

  async createTunnel(accountId: string, name: string): Promise<Tunnel> {
    return this.request<Tunnel>(`/accounts/${accountId}/cfd_tunnel`, {
      method: "POST",
      body: JSON.stringify({
        name,
        config_src: "cloudflare",
      }),
    });
  }

  async getDnsRecordByName(zoneId: string, hostname: string): Promise<{ id: string; type: string; name: string; content: string } | null> {
    const result = await this.request<Array<{ id: string; type: string; name: string; content: string }>>(
      `/zones/${zoneId}/dns_records?name=${encodeURIComponent(hostname)}&per_page=1`
    );

    return result[0] ?? null;
  }

  async createCnameRecord(zoneId: string, hostname: string, target: string): Promise<void> {
    await this.request(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: hostname,
        content: target,
        proxied: true,
      }),
    });
  }

  async checkToken(): Promise<void> {
    await this.request("/user/tokens/verify");
  }
}
