async function main() {
  const url = 'https://hkwzwmvhcgmtkivohbqb.supabase.co';
  const key = 'sb_publishable_Lflxf5R7gK3bLGiJ4NrZHQ_NCKjmuSK';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd3p3bXZoY2dtdGtpdm9oYnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYwMDU1OSwiZXhwIjoyMDk1MTc2NTU5fQ.DwKt_k82Xf6mm5S5ok6DnIFnUAWPL2e-u-boJK1cqfc';
  
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };
  
  const res = await fetch(`${url}/rest/v1/tournament_matches?stage=eq.GROUP`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ venue: 'EZELL HESTER COMMUNITY CENTER' })
  });
  
  console.log("Status update:", res.status);
  const text = await res.text();
  if (text) console.log("Response:", text);
}
main();
