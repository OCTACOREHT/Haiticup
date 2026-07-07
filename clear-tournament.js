async function main() {
  const url = 'https://hkwzwmvhcgmtkivohbqb.supabase.co';
  const key = 'sb_publishable_Lflxf5R7gK3bLGiJ4NrZHQ_NCKjmuSK';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd3p3bXZoY2dtdGtpdm9oYnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYwMDU1OSwiZXhwIjoyMDk1MTc2NTU5fQ.DwKt_k82Xf6mm5S5ok6DnIFnUAWPL2e-u-boJK1cqfc';
  
  const headers = { 'apikey': key, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  
  // 1. Delete all matches
  console.log("Deleting matches...");
  await fetch(`${url}/rest/v1/tournament_matches?id=not.is.null`, { method: 'DELETE', headers });
  
  // 2. Delete all group entries
  console.log("Deleting group entries...");
  await fetch(`${url}/rest/v1/tournament_group_entries?id=not.is.null`, { method: 'DELETE', headers });
  
  // 3. Delete all groups
  console.log("Deleting groups...");
  await fetch(`${url}/rest/v1/tournament_groups?id=not.is.null`, { method: 'DELETE', headers });
  
  // 4. Delete all draws
  console.log("Deleting draws...");
  await fetch(`${url}/rest/v1/tournament_draw_teams?id=not.is.null`, { method: 'DELETE', headers });
  await fetch(`${url}/rest/v1/tournament_draws?id=not.is.null`, { method: 'DELETE', headers });
  
  console.log("Cleanup finished.");
}
main();
