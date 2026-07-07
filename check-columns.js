async function main() {
  const url = 'https://hkwzwmvhcgmtkivohbqb.supabase.co';
  const key = 'sb_publishable_Lflxf5R7gK3bLGiJ4NrZHQ_NCKjmuSK';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd3p3bXZoY2dtdGtpdm9oYnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYwMDU1OSwiZXhwIjoyMDk1MTc2NTU5fQ.DwKt_k82Xf6mm5S5ok6DnIFnUAWPL2e-u-boJK1cqfc';
  
  const headers = { 'apikey': key, 'Authorization': `Bearer ${token}` };
  
  const res = await fetch(`${url}/rest/v1/registere_staff?limit=1`, { headers });
  const data = await res.json();
  
  if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log(data[0]);
  } else {
      console.log("No staff found, trying OPTIONS...");
  }
}
main();
