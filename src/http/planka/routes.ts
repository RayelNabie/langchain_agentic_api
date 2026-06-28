export class PlankaHttp {
  protected get baseUrl() {
    return process.env['PLANKA_BASE_URL'] ?? '';
  }

  protected get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env['PLANKA_TOKEN'] ?? ''}`,
    };
  }

  protected async get<T>(path: string): Promise<T> {
    const response: Response = await fetch(this.baseUrl + path, { headers: this.headers });

    if (!response.ok) throw new Error(`Planka fout: ${response.status}`);

    return response.json();
  }

  protected async post<T>(path: string, body?: unknown): Promise<T> {
    const response: Response = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) throw new Error(`Planka fout: ${response.status} ${await response.text()}`);

    return response.json();
  }
}
