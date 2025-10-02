
import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '../utils';

describe('Utils Functions', () => {
  it('sanitizeFilename should remove invalid characters', () => {
    const input = 'My File Name?*<>.pdf';
    const expected = 'My File Name----.pdf';
    expect(sanitizeFilename(input)).toBe(expected);
  });

  it('sanitizeFilename should handle empty strings', () => {
    const input = '';
    const expected = '';
    expect(sanitizeFilename(input)).toBe(expected);
  });

  it('sanitizeFilename should not change valid filenames', () => {
    const input = 'My-Project_Floor-1.pdf';
    const expected = 'My-Project_Floor-1.pdf';
    expect(sanitizeFilename(input)).toBe(expected);
  });
});