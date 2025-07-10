import { shuffleArray, formatDate, cn } from '../../lib/utils';

describe('Utils', () => {
  describe('shuffleArray', () => {
    it('should return an array with the same length', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);

      expect(shuffled).toHaveLength(original.length);
    });

    it('should contain all original elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);

      original.forEach((item) => {
        expect(shuffled).toContain(item);
      });
    });

    it('should not mutate the original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffleArray(original);

      expect(original).toEqual(originalCopy);
    });

    it('should handle empty arrays', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should handle single element arrays', () => {
      const result = shuffleArray([1]);
      expect(result).toEqual([1]);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/December 25, 2023/);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle different dates', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/(January 1, 2024|December 31, 2023)/);
    });
  });

  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should filter out falsy values', () => {
      const result = cn('class1', null, undefined, false, '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle all falsy values', () => {
      const result = cn(null, undefined, false, '');
      expect(result).toBe('');
    });
  });
});
