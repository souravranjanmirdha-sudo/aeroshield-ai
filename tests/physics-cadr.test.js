import { describe, it, expect } from 'vitest';

describe('Clean Air Physics & Environmental Health Calculations', () => {

  // Test 1: Clean Air Delivery Rate (CADR) Formula
  it('Calculates required CADR correctly for 4.5 Air Changes Per Hour (ACH)', () => {
    const roomAreaSqFt = 200;
    const ceilingHeightFt = 9;
    const targetAch = 4.5;

    const roomVolumeCuFt = roomAreaSqFt * ceilingHeightFt; // 1800 cu ft
    const requiredCadrCfm = Math.round((roomVolumeCuFt * targetAch) / 60);

    // (1800 * 4.5) / 60 = 135 CFM
    expect(requiredCadrCfm).toBe(135);
  });

  // Test 2: Large Room CADR Scaling
  it('Scales CADR accurately for large halls (500 sq ft, 10 ft ceiling)', () => {
    const roomAreaSqFt = 500;
    const ceilingHeightFt = 10;
    const roomVolumeCuFt = roomAreaSqFt * ceilingHeightFt; // 5000 cu ft
    const requiredCadrCfm = Math.round((roomVolumeCuFt * 4.5) / 60);

    // (5000 * 4.5) / 60 = 375 CFM (Matches Corsi-Rosenthal unit capacity)
    expect(requiredCadrCfm).toBe(375);
  });

  // Test 3: Berkeley Earth Cigarette Equivalency Benchmark
  it('Calculates cigarette equivalents based on Berkeley Earth continuous 22 ug/m3 rule', () => {
    function calcCigarettes(pm25) {
      if (!pm25 || pm25 <= 0) return 0;
      return Number((pm25 / 22.0).toFixed(1));
    }

    expect(calcCigarettes(22)).toBe(1.0);
    expect(calcCigarettes(44)).toBe(2.0);
    expect(calcCigarettes(110)).toBe(5.0);
    expect(calcCigarettes(0)).toBe(0);
    expect(calcCigarettes(-10)).toBe(0);
  });

  // Test 4: Estimated Inhaled PM2.5 Microgram Reduction
  it('Calculates avoided inhaled fine particulate dosage accurately', () => {
    const currentAqi = 200;
    const members = 4;
    const hasChildren = true;
    const hasAsthma = true;

    const calculatedAvoidedDosage = Math.round(
      currentAqi * 1.6 * (hasChildren ? 1.25 : 1.0) * (hasAsthma ? 1.2 : 1.0)
    );

    // 200 * 1.6 * 1.25 * 1.2 = 480 micrograms avoided
    expect(calculatedAvoidedDosage).toBe(480);
    expect(calculatedAvoidedDosage).toBeGreaterThan(0);
  });

});
