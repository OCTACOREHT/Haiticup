async function main() {
  const url = 'https://hkwzwmvhcgmtkivohbqb.supabase.co';
  const key = 'sb_publishable_Lflxf5R7gK3bLGiJ4NrZHQ_NCKjmuSK';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd3p3bXZoY2dtdGtpdm9oYnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYwMDU1OSwiZXhwIjoyMDk1MTc2NTU5fQ.DwKt_k82Xf6mm5S5ok6DnIFnUAWPL2e-u-boJK1cqfc';
  
  const headers = { 'apikey': key, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  const res = await fetch(`${url}/rest/v1/registere?select=id,team_name`, { headers });
  const teams = await res.json();
  
  const targetNames = ['1804', 'Top Notch', 'Galaxy', 'PAC Fc', 'Island United', 'Elite energy', 'VENS', 'Klass Fc'];
  
  const selectedTeams = [];
  for (const name of targetNames) {
      const match = teams.find(t => t.team_name && t.team_name.toLowerCase().includes(name.toLowerCase()));
      if (match) selectedTeams.push(match);
  }
  
  const teamIds = selectedTeams.map(t => t.id);
  
  console.log("Tentative de tirage avec:", selectedTeams.map(t => t.team_name));
  
  const rpcRes = await fetch(`${url}/rest/v1/rpc/run_tournament_draw_8`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_team_ids: teamIds, p_clear_existing: true })
  });
  
  const rpcData = await rpcRes.text();
  console.log("Reponse RPC:", rpcData);
}
main();
