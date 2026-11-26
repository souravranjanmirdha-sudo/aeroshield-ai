import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/app.js';

describe('Family Routine Generation Logic & Vulnerability Overrides', () => {

  it('Enforces critical warnings when asthmatic or pediatric members are present', async () => {
    const res = await request(app)
      .post('/api/ai/routine')
      .send({
        householdMembers: 3,
        hasChildren: true,
        hasAsthma: true,
        currentAqi: 250,
        city: 'Delhi'
      });

    expect(res.status).toBe(200);
    const { routine } = res.body;
    expect(routine.priorityWarning).toContain('CRITICAL HEALTH PROTOCOL');
    expect(routine.priorityWarning).toContain('Asthma');
    expect(routine.priorityWarning).toContain('Children');
  });

  it('Tailors sustainable commute alternatives based on travel mode', async () => {
    // Car commuter
    const carRes = await request(app)
      .post('/api/ai/routine')
      .send({
        householdMembers: 4,
        commuteMode: 'car',
        currentAqi: 180,
        city: 'Delhi'
      });

    const carCommuteAlt = carRes.body.routine.sustainableAlternatives.find(
      (a) => a.category === 'Commute & Travel'
    );
    expect(carCommuteAlt.sustainableSwap).toContain('Carpool');
    expect(carCommuteAlt.communityBenefit).toContain('CO2');

    // Bicycle commuter
    const bikeRes = await request(app)
      .post('/api/ai/routine')
      .send({
        householdMembers: 2,
        commuteMode: 'bicycle',
        currentAqi: 180,
        city: 'Delhi'
      });

    const bikeCommuteAlt = bikeRes.body.routine.sustainableAlternatives.find(
      (a) => a.category === 'Commute & Travel'
    );
    expect(bikeCommuteAlt.sustainableSwap).toContain('secondary streets');
  });

  it('Flags biomass/wood heating with urgent critical swap advice', async () => {
    const res = await request(app)
      .post('/api/ai/routine')
      .send({
        householdMembers: 4,
        heatingType: 'wood',
        currentAqi: 200,
        city: 'Delhi'
      });

    const heatingAlt = res.body.routine.sustainableAlternatives.find(
      (a) => a.category === 'Space Heating'
    );
    expect(heatingAlt.sustainableSwap).toContain('URGENT SWAP');
    expect(heatingAlt.impactScore).toBe('Critical');
  });

  it('Produces all 7 distinct time phases spanning 24-hour cycle', async () => {
    const res = await request(app)
      .post('/api/ai/routine')
      .send({
        householdMembers: 4,
        currentAqi: 190,
        city: 'Delhi'
      });

    const phases = res.body.routine.timeline.map((p) => p.phase);
    expect(phases.length).toBe(7);
    expect(phases.some((p) => p.includes('Dawn'))).toBe(true);
    expect(phases.some((p) => p.includes('Breakfast'))).toBe(true);
    expect(phases.some((p) => p.includes('Gridlock'))).toBe(true);
    expect(phases.some((p) => p.includes('Midday'))).toBe(true);
    expect(phases.some((p) => p.includes('Afternoon'))).toBe(true);
    expect(phases.some((p) => p.includes('Twilight'))).toBe(true);
    expect(phases.some((p) => p.includes('Night'))).toBe(true);
  });

});
