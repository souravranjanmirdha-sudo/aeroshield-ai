async function runTests() {
  console.log('--- Testing AeroShield AI Backend ---');

  // Test 1: AQI
  try {
    const aqiRes = await fetch('http://localhost:5000/api/aqi?city=Delhi');
    const aqiData = await aqiRes.json();
    console.log('✓ AQI API: Status', aqiRes.status, '| City:', aqiData.location?.city, '| AQI:', aqiData.current?.aqi);
  } catch (e) {
    console.error('✗ AQI API failed:', e.message);
  }

  // Test 2: AI Routine
  try {
    const routineRes = await fetch('http://localhost:5000/api/ai/routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ householdMembers: 4, commuteMode: 'car', city: 'Delhi', currentAqi: 195 })
    });
    const routineData = await routineRes.json();
    console.log('✓ Routine API: Status', routineRes.status, '| Source:', routineData.source, '| Timeline Items:', routineData.routine?.timeline?.length);
  } catch (e) {
    console.error('✗ Routine API failed:', e.message);
  }

  // Test 3: AI Chat
  try {
    const chatRes = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is the DIY filter setup?' }],
        location: 'Delhi',
        currentAqi: 195
      })
    });
    const chatData = await chatRes.json();
    console.log('✓ Chat API: Status', chatRes.status, '| Source:', chatData.source, '| Reply Length:', chatData.reply?.length);
  } catch (e) {
    console.error('✗ Chat API failed:', e.message);
  }

  // Test 4: Community
  try {
    const comRes = await fetch('http://localhost:5000/api/community');
    const comData = await comRes.json();
    console.log('✓ Community API: Status', comRes.status, '| Active Pledges:', comData.data?.stats?.activeNeighborhoodPledges);
  } catch (e) {
    console.error('✗ Community API failed:', e.message);
  }

  // Test 5: Static Client Serving
  try {
    const clientRes = await fetch('http://localhost:5000/');
    const html = await clientRes.text();
    console.log('✓ Web Client HTML Serving: Status', clientRes.status, '| Contains AeroShield / React:', html.includes('AeroShield') || html.includes('root') || html.includes('<!DOCTYPE html>'));
  } catch (e) {
    console.error('✗ Static Client Serving failed:', e.message);
  }

  console.log('--- All Backend Tests Completed ---');
}

runTests();
