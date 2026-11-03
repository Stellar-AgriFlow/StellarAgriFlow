import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('GitHub Actions CI/CD Configurations', () => {
  const workflowsDir = path.resolve(__dirname, '../.github/workflows');

  it('validates soroban-contracts-ci.yml configures cargo test and wasm32 build', () => {
    const filePath = path.join(workflowsDir, 'soroban-contracts-ci.yml');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('cargo test --manifest-path contracts/Cargo.toml');
    expect(content).toContain('target wasm32-unknown-unknown');
    expect(content).toContain('Swatinem/rust-cache@v2');
  });

  it('validates web-vitest-ci.yml configures pnpm, turbo lint, and vitest run', () => {
    const filePath = path.join(workflowsDir, 'web-vitest-ci.yml');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('pnpm/action-setup@v3');
    expect(content).toContain('pnpm vitest run');
    expect(content).toContain('pnpm turbo run build');
  });

  it('validates security-audit.yml scans both Cargo and npm dependencies', () => {
    const filePath = path.join(workflowsDir, 'security-audit.yml');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('cargo audit');
    expect(content).toContain('pnpm audit');
  });
});
