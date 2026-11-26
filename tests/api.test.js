import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/app.js';

describe('AeroShield AI Backend API Endpoints', () => {

  it('GET /api/aqi should return live or cached AQI data with clean window', async () => {
    const res = await request(app).get('/api/aqi?city=Delhi');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('location');
    expect(res.body.location).toHaveProperty('city');
    expect(res.body).toHaveProperty('current');
    expect(res.body.current).toHaveProperty('aqi');
    expect(res.body.current).toHaveProperty('pm2_5');
    expect(res.body.current).toHaveProperty('cigaretteEquivalent');
    expect(res.body).toHaveProperty('cleanWindow');
    expect(res.body).toHaveProperty('hourlyForecast');
    expect(Array.isArray(res.body.hourlyForecast)).toBe(true);
  });

  it('GET /api/aqi with coordinates should resolve accurately', async () => {
    const res = await request(app).get('/api/aqi?lat=28.6139&lon=77.2090&city=Delhi');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.location.latitude).toBeCloseTo(28.6139, 1);
  });

  it('POST /api/ai/routine should return 7-phase granular timeline and sustainable swaps', async () => {
    const payload = {
      householdMembers: 4,
      hasChildren: true,
      hasElderly: true,
      hasAsthma: true,
      commuteMode: 'car',
      heatingType: 'radiator',
      cookingFuel: 'gas',
      currentAqi: 220,
      city: 'Delhi'
    };

    const res = await request(app)
      .post('/api/ai/routine')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('routine');
    const { routine } = res.body;

    expect(routine).toHaveProperty('timeline');
    expect(routine.timeline.length).toBeGreaterThanOrEqual(6);
    expect(routine).toHaveProperty('priorityWarning');
    expect(routine).toHaveProperty('sustainableAlternatives');
    expect(routine.sustainableAlternatives.length).toBeGreaterThan(0);
    expect(routine).toHaveProperty('directImpact');
    expect(routine.directImpact).toHaveProperty('dailyAvoidedPm25Micrograms');
    expect(routine.directImpact).toHaveProperty('co2AvoidedKg');

    // Verify role directives exist in morning phase
    const morningPhase = routine.timeline[0];
    expect(morningPhase).toHaveProperty('roleDirectives');
    expect(morningPhase.roleDirectives).toHaveProperty('children');
    expect(morningPhase.roleDirectives).toHaveProperty('asthma');
    expect(morningPhase).toHaveProperty('checklist');
  });

  it('POST /api/ai/hacks should calculate room CADR and bill of materials', async () => {
    const res = await request(app)
      .post('/api/ai/hacks')
      .send({ roomAreaSqFt: 300, ceilingHeightFt: 10 })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.roomSpecs.roomVolumeCuFt).toBe(3000);
    // (3000 * 4.5) / 60 = 225 CFM
    expect(res.body.roomSpecs.requiredCadrCfm).toBe(225);
    expect(Array.isArray(res.body.hacks)).toBe(true);
    expect(res.body.hacks.some(h => h.id === 'corsi-rosenthal')).toBe(true);
  });

  it('POST /api/ai/chat should return science-grounded response', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        messages: [{ role: 'user', content: 'What is the DIY Corsi-Rosenthal filter?' }],
        location: 'Delhi',
        currentAqi: 210
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(100);
  });

  it('GET /api/community should return active neighborhood pledges and hotspots', async () => {
    const res = await request(app).get('/api/community');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('stats');
    expect(res.body.data).toHaveProperty('pledges');
    expect(res.body.data).toHaveProperty('hotspots');
  });

  it('Should handle invalid routes with proper 404', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
  });

});
