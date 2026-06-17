import { getColorCode, getColorCodeWithOpacity } from '../treatmentColors';

describe('treatmentColors', () => {
  describe('getColorCode', () => {
    it('should return hex codes for known colors', () => {
      expect(getColorCode('vermelho')).toBe('#DC2626');
      expect(getColorCode('laranja')).toBe('#EA580C');
      expect(getColorCode('amarelo')).toBe('#CA8A04');
      expect(getColorCode('verde')).toBe('#16A34A');
      expect(getColorCode('azul')).toBe('#2563EB');
      expect(getColorCode('indigo')).toBe('#4F46E5');
      expect(getColorCode('violeta')).toBe('#7C3AED');
      expect(getColorCode('branco')).toBe('#E5E7EB');
      expect(getColorCode('rosa')).toBe('#EC4899');
    });

    it('should be case-insensitive', () => {
      expect(getColorCode('AZUL')).toBe('#2563EB');
      expect(getColorCode('Azul')).toBe('#2563EB');
    });

    it('should return gray for unknown colors', () => {
      const defaultGray = '#6B7280';
      expect(getColorCode('invalid')).toBe(defaultGray);
      expect(getColorCode('')).toBe(defaultGray);
    });
  });

  describe('getColorCodeWithOpacity', () => {
    it('should append alpha channel to hex', () => {
      expect(getColorCodeWithOpacity('azul', 0.25)).toMatch(/^#[0-9A-F]{6}[0-9A-F]{2}$/i);
      expect(getColorCodeWithOpacity('verde', 1)).toBe('#16A34Aff');
    });

    it('should use gray base for unknown colors', () => {
      expect(getColorCodeWithOpacity('invalid', 0.5)).toMatch(/^#6B7280[0-9A-F]{2}$/i);
    });
  });
});
