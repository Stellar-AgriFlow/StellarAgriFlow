import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker & Local Infrastructure Configuration', () => {
  const composePath = path.resolve(__dirname, '../docker/docker-compose.yml');
  const contractsDockerPath = path.resolve(__dirname, '../docker/Dockerfile.contracts');

  it('validates existence of docker-compose.yml with quickstart service', () => {
    expect(fs.existsSync(composePath)).toBe(true);
    const content = fs.readFileSync(composePath, 'utf8');

    expect(content).toContain('agriflow-stellar-local');
    expect(content).toContain('--standalone --enable-soroban-rpc');
    expect(content).toContain('8000:8000'); // Horizon
    expect(content).toContain('8001:8001'); // Soroban RPC
    expect(content).toContain('agriflow-web-dev');
  });

  it('validates Dockerfile.contracts compiles for wasm32-unknown-unknown target', () => {
    expect(fs.existsSync(contractsDockerPath)).toBe(true);
    const content = fs.readFileSync(contractsDockerPath, 'utf8');

    expect(content).toContain('wasm32-unknown-unknown');
    expect(content).toContain('cargo build --manifest-path contracts/Cargo.toml');
  });
});
