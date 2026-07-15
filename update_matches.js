const url = 'https://hkwzwmvhcgmtkivohbqb.supabase.co';
const key = 'sb_publishable_Lflxf5R7gK3bLGiJ4NrZHQ_NCKjmuSK';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd3p3bXZoY2dtdGtpdm9oYnFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTYwMDU1OSwiZXhwIjoyMDk1MTc2NTU5fQ.DwKt_k82Xf6mm5S5ok6DnIFnUAWPL2e-u-boJK1cqfc';
const headers = { 'apikey': key, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

const t = {
  A1: '2226a37c-bdf2-4454-8b74-d2375c29a120',
  A2: 'd92827c1-99fe-49e9-93a5-af9a5ce64adf',
  A3: '9f520271-22b9-4afe-b726-d05a47f1b29b',
  A4: 'fb9757f6-7c95-4c35-88e2-d80956fd60fe',
  B1: '04c9bfd3-03f1-4aa1-9e97-73295fd43efe',
  B2: '99e9946a-c87f-4ba0-bb7e-86d3d4f622f0',
  B3: '4148d68e-db54-44f9-a424-e5a85efb9c60',
  B4: 'a2940f55-d81b-47cb-be0c-f85821758bbd',
};

const g = {
  A: '8da0a02d-139a-4214-afaa-0d045810ae8c',
  B: 'bd8215fb-1290-4944-a7f5-7beb2e500848'
};

const matches = [
  { round_label: 'MATCHDAY 1', home: t.A1, away: t.A2, time: '2026-07-26T23:00:00Z', group: g.A },
  { round_label: 'MATCHDAY 2', home: t.A3, away: t.A4, time: '2026-07-26T20:00:00Z', group: g.A },
  { round_label: 'MATCHDAY 2', home: t.B1, away: t.B2, time: '2026-07-26T22:00:00Z', group: g.B },
  { round_label: 'MATCHDAY 2', home: t.B3, away: t.B4, time: '2026-07-27T00:00:00Z', group: g.B },
  { round_label: 'MATCHDAY 3', home: t.A4, away: t.A1, time: '2026-08-02T20:00:00Z', group: g.A },
  { round_label: 'MATCHDAY 3', home: t.A3, away: t.A2, time: '2026-08-02T22:00:00Z', group: g.A },
  { round_label: 'MATCHDAY 3', home: t.B2, away: t.B3, time: '2026-08-03T00:00:00Z', group: g.B },
  { round_label: 'MATCHDAY 4', home: t.B4, away: t.B1, time: '2026-08-16T20:00:00Z', group: g.B },
  { round_label: 'MATCHDAY 4', home: t.A1, away: t.A3, time: '2026-08-16T22:00:00Z', group: g.A },
  { round_label: 'MATCHDAY 4', home: t.A2, away: t.A4, time: '2026-08-17T00:00:00Z', group: g.A },
  { round_label: 'MATCHDAY 5', home: t.B2, away: t.B4, time: '2026-08-23T21:00:00Z', group: g.B },
  { round_label: 'MATCHDAY 5', home: t.B1, away: t.B3, time: '2026-08-23T23:00:00Z', group: g.B },
];

async function main() {
  console.log("Deleting existing matches...");
  await fetch(`${url}/rest/v1/tournament_matches?id=not.is.null`, { method: 'DELETE', headers });
  
  console.log("Inserting new matches...");
  const payload = matches.map(m => ({
    stage: 'GROUP',
    group_id: m.group,
    round_label: m.round_label,
    home_registere_id: m.home,
    away_registere_id: m.away,
    kickoff_at: m.time,
    venue: 'Ezell Hester Community Center',
    status: 'SCHEDULED'
  }));

  const res = await fetch(`${url}/rest/v1/tournament_matches`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(payload)
  });
  console.log(res.status, res.statusText);
  console.log("Done.");
}

main();
