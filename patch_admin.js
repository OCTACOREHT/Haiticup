const fs = require('fs');

let content = fs.readFileSync('app/admin/page.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  'import { getSupabaseClient } from "@/lib/supabase/client";',
  'import { getSupabaseClient } from "@/lib/supabase/client";\nimport { compressImageFile, readImageAsDataUrl, uploadToStorage, validateImageUpload } from "@/lib/image-upload";\nimport { buildBadgeId, buildTeamCode } from "@/lib/badges/utils";'
);

// 2. Add Modals above EditPlayerModal
const addPlayerModalStr = `
// ? Add Player Modal ?
function AddPlayerModal({ teams, accessToken, onClose, onSaved }: { teams: Array<{ id: string; teamName: string }>; accessToken: string; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [age, setAge] = useState("");
  const [registereId, setRegistereId] = useState(teams[0]?.id ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const validationError = validateImageUpload(selectedFile, "Photo");
    if (validationError) { setError(validationError); e.target.value = ""; return; }

    readImageAsDataUrl(selectedFile, (dataUrl) => {
      setPhotoPreview(dataUrl);
      setPhotoFile(selectedFile);
      setPhotoFileName(selectedFile.name);
      setError(null);
    }, () => setError("Impossible de lire l'image."));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    if (!fullName.trim() || !position.trim() || !jerseyNumber.trim() || isNaN(ageNum) || ageNum < 10 || ageNum > 80) { setError("Vérifiez les champs (âge entre 10 et 80)."); return; }
    if (!photoFile || !photoPreview) { setError("La photo est obligatoire."); return; }
    setIsSaving(true); setError(null);
    try {
      const selectedTeam = teams.find((t) => t.id === registereId);
      if (!selectedTeam) throw new Error("Équipe introuvable");
      
      const compressed = await compressImageFile(photoFile);
      const uuid = crypto.randomUUID();
      const logoUrl = await uploadToStorage(compressed, \`reg-\${uuid}/player-admin.jpg\`);
      
      const teamCode = buildTeamCode(selectedTeam.teamName, uuid);
      const serial = Math.floor(Math.random() * 99) + 1;
      const badgeId = buildBadgeId("PLAYER", teamCode, serial);

      const qrPayload = {
        badge_id: badgeId,
        member_type: "PLAYER",
        registration_id: uuid,
        team_name: selectedTeam.teamName,
        team_code: teamCode,
        full_name: fullName.trim(),
        position: position.trim(),
        jersey_number: jerseyNumber.trim(),
        age: ageNum,
        scan_url: buildBadgeScanUrl({ badgeId, originFallback: window.location.origin }),
      };

      const qrCodeDataUrl = await QRCode.toDataURL(qrPayload.scan_url, { errorCorrectionLevel: "M", margin: 2, width: BADGE_QR_SIZE, color: { dark: "#000000FF", light: "#FFFFFFFF" } });

      const payload = {
        registereId,
        teamName: selectedTeam.teamName,
        fullName: fullName.trim(),
        position: position.trim(),
        jerseyNumber: jerseyNumber.trim(),
        age: ageNum,
        photoUrl: logoUrl,
        photoSizeBytes: photoFile.size,
        badgeId,
        qrPayload,
        qrCodeDataUrl,
      };

      const res = await fetch("/api/admin/players", { method: "POST", headers: { Authorization: \`Bearer \${accessToken}\`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Erreur de sauvegarde."); }
      onSaved(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erreur inconnue."); } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-900">Ajouter un joueur</span></div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer"><XIcon className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className={labelCls}>Photo</label>
            <div className="mt-1 flex flex-col items-center gap-3">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                {photoPreview ? (
                  <img src={photoPreview} alt={fullName} width={96} height={96} className="size-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-400">?</span>
                )}
              </div>
              <div className="w-full">
                <input type="file" accept="image/*" className={inputCls} onChange={handlePhotoChange} required />
                <p className="mt-1 text-[11px] text-gray-500">JPG/PNG, max {MAX_PLAYER_PHOTO_SIZE_LABEL}.</p>
                {photoFileName ? <p className="mt-1 truncate text-[11px] text-gray-600">{photoFileName}</p> : null}
              </div>
            </div>
          </div>
          <div><label className={labelCls}>Équipe</label><select className={selectCls} value={registereId} onChange={(e) => setRegistereId(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></div>
          <div><label className={labelCls}>Nom complet</label><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Position</label><select className={selectCls} value={position} onChange={(e) => setPosition(e.target.value)} required><option value="">-</option><option value="Goalkeeper">Goalkeeper</option><option value="Defender">Defender</option><option value="Midfielder">Midfielder</option><option value="Forward">Forward</option></select></div>
            <div><label className={labelCls}>Maillot</label><input className={inputCls} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} required /></div>
            <div><label className={labelCls}>Age</label><input className={inputCls} type="number" min={10} max={80} value={age} onChange={(e) => setAge(e.target.value)} required /></div>
          </div>
          {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
            <button type="submit" disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer">{isSaving && <Spinner />} Ajouter</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ? Edit Team Logo Modal ?
function EditTeamLogoModal({ team, accessToken, onClose, onSaved }: { team: Team; accessToken: string; onClose: () => void; onSaved: () => void }) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(team.logoUrl);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const validationError = validateImageUpload(selectedFile, "Logo");
    if (validationError) { setError(validationError); e.target.value = ""; return; }

    readImageAsDataUrl(selectedFile, (dataUrl) => {
      setPhotoPreview(dataUrl);
      setPhotoFile(selectedFile);
      setPhotoFileName(selectedFile.name);
      setError(null);
    }, () => setError("Impossible de lire l'image."));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile || !photoPreview) { setError("Veuillez sélectionner un nouveau logo."); return; }
    setIsSaving(true); setError(null);
    try {
      const compressed = await compressImageFile(photoFile);
      const uuid = crypto.randomUUID();
      const logoUrl = await uploadToStorage(compressed, \`reg-\${uuid}/logo-admin.jpg\`);
      
      const payload = { id: team.id, clubLogoUrl: logoUrl };
      const res = await fetch("/api/admin/teams", { method: "PATCH", headers: { Authorization: \`Bearer \${accessToken}\`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Erreur de sauvegarde."); }
      onSaved(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erreur inconnue."); } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <p className="font-semibold text-gray-900">Modifier le logo de {team.teamName}</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {photoPreview ? <img src={photoPreview} alt="Logo" className="size-full object-cover" /> : <span className="text-xs text-gray-400">N/A</span>}
            </div>
            <input type="file" accept="image/*" className={inputCls} onChange={handlePhotoChange} required />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700">Annuler</button>
            <button type="submit" disabled={isSaving} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">{isSaving && <Spinner />} Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

content = content.replace('// ? Edit Player Modal ?', addPlayerModalStr + '\n// ? Edit Player Modal ?');

// 3. Add states
content = content.replace(
  'const [editingPlayer, setEditingPlayer] = useState<PlayerFull | null>(null);',
  'const [editingPlayer, setEditingPlayer] = useState<PlayerFull | null>(null);\n  const [addingPlayer, setAddingPlayer] = useState(false);\n  const [editingTeamLogo, setEditingTeamLogo] = useState<Team | null>(null);'
);

// 4. Add render
content = content.replace(
  '{editingPlayer && accessToken && <EditPlayerModal',
  '{addingPlayer && accessToken && <AddPlayerModal teams={playerTeams.length > 0 ? playerTeams : (tournament?.teams || []).map(t => ({ id: t.id, teamName: t.teamName }))} accessToken={accessToken} onClose={() => setAddingPlayer(false)} onSaved={() => { setAddingPlayer(false); setPlayersData(null); if (accessToken) void loadPlayersData(accessToken); }} />}\n      {editingTeamLogo && accessToken && <EditTeamLogoModal team={editingTeamLogo} accessToken={accessToken} onClose={() => setEditingTeamLogo(null)} onSaved={() => { setEditingTeamLogo(null); if (accessToken) void loadData(accessToken, { quiet: true }); }} />}\n      {editingPlayer && accessToken && <EditPlayerModal'
);

// 5. Add buttons
content = content.replace(
  '<input className={`${inputCls} pl-8`} placeholder="Rechercher joueur, équipe…" value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} />\n                </div>',
  '<input className={`${inputCls} pl-8`} placeholder="Rechercher joueur, équipe…" value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} />\n                </div>\n                <Btn variant="primary" onClick={() => setAddingPlayer(true)}>+ Ajouter un Joueur</Btn>'
);

content = content.replace(
  '<button\n                          type="button"\n                          onClick={() => setDeletingTeam(team)}\n                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"',
  '<button\n                          type="button"\n                          onClick={() => setEditingTeamLogo(team)}\n                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"\n                          title="Modifier le logo"\n                        >\n                          <PencilIcon className="size-3.5" />\n                        </button>\n                        <button\n                          type="button"\n                          onClick={() => setDeletingTeam(team)}\n                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"'
);

fs.writeFileSync('app/admin/page.tsx', content, 'utf8');
console.log("Successfully patched admin page");
