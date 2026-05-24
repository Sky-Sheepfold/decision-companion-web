import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  readSessionCache,
  removeSessionCache,
  writeSessionCache,
  type CacheStorage,
} from '../src/utils/sessionCache';

class MemoryStorage implements CacheStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

test('reads fresh cached values for the same token', () => {
  const storage = new MemoryStorage();

  writeSessionCache('profile', 'token-a', { id: 3 }, 1000, storage);

  assert.deepEqual(readSessionCache('profile', 'token-a', 3000, 2500, storage), { id: 3 });
});

test('ignores expired values and values from another token', () => {
  const storage = new MemoryStorage();

  writeSessionCache('profile', 'token-a', { id: 3 }, 1000, storage);

  assert.equal(readSessionCache('profile', 'token-a', 3000, 5001, storage), null);
  assert.equal(readSessionCache('profile', 'token-b', 3000, 2500, storage), null);
});

test('removes cached values', () => {
  const storage = new MemoryStorage();

  writeSessionCache('profile', 'token-a', { id: 3 }, 1000, storage);
  removeSessionCache('profile', storage);

  assert.equal(readSessionCache('profile', 'token-a', 3000, 1500, storage), null);
});
