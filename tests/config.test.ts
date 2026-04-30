import { describe, it, expect } from 'vitest';
import { loadConfig, validateConfig } from '../src/config.js';

describe('approvals — config validation (fail-fast)', () => {
  it('throws when NATS_URL is missing', () => {
    const origNats = process.env['NATS_URL'];
    const origTemporal = process.env['TEMPORAL_ADDRESS'];
    delete process.env['NATS_URL'];
    process.env['TEMPORAL_ADDRESS'] = 'temporal.example:7233';
    try {
      const cfg = loadConfig();
      expect(() => validateConfig(cfg)).toThrowError(/NATS_URL/);
    } finally {
      if (origNats !== undefined) process.env['NATS_URL'] = origNats;
      if (origTemporal !== undefined) process.env['TEMPORAL_ADDRESS'] = origTemporal;
      else delete process.env['TEMPORAL_ADDRESS'];
    }
  });

  it('throws when TEMPORAL_ADDRESS is missing', () => {
    const origNats = process.env['NATS_URL'];
    const origTemporal = process.env['TEMPORAL_ADDRESS'];
    process.env['NATS_URL'] = 'nats://example:4222';
    delete process.env['TEMPORAL_ADDRESS'];
    try {
      const cfg = loadConfig();
      expect(() => validateConfig(cfg)).toThrowError(/TEMPORAL_ADDRESS/);
    } finally {
      if (origNats !== undefined) process.env['NATS_URL'] = origNats;
      else delete process.env['NATS_URL'];
      if (origTemporal !== undefined) process.env['TEMPORAL_ADDRESS'] = origTemporal;
    }
  });

  it('does not throw when both required vars are set', () => {
    const origNats = process.env['NATS_URL'];
    const origTemporal = process.env['TEMPORAL_ADDRESS'];
    process.env['NATS_URL'] = 'nats://example:4222';
    process.env['TEMPORAL_ADDRESS'] = 'temporal.example:7233';
    try {
      const cfg = loadConfig();
      expect(() => validateConfig(cfg)).not.toThrow();
    } finally {
      if (origNats !== undefined) process.env['NATS_URL'] = origNats;
      else delete process.env['NATS_URL'];
      if (origTemporal !== undefined) process.env['TEMPORAL_ADDRESS'] = origTemporal;
      else delete process.env['TEMPORAL_ADDRESS'];
    }
  });
});
