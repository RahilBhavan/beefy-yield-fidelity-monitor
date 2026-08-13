import { describe, expect, it } from 'vitest';
import { csvCell } from '@/app/api/export/route';

describe('observation export CSV cells', () => {
    it('escapes quotes and neutralizes formula prefixes', () => {
        expect(csvCell('plain')).toBe('"plain"');
        expect(csvCell(null)).toBe('""');
        expect(csvCell('say "hi"')).toBe('"say ""hi"""');
        expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
        expect(csvCell('+1234')).toBe('"\'+1234"');
        expect(csvCell('-cmd')).toBe('"\'-cmd"');
        expect(csvCell('@import')).toBe('"\'@import"');
    });
});
