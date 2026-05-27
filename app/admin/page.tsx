"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  SunIcon,
  ShieldCheckIcon,
  SplitSquareHorizontalIcon,
  SwordsIcon,
  TargetIcon,
  Trash2Icon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import { buildBadgeScanUrl } from "@/lib/badges/scan-url";
import { clearAdminServerSession } from "@/lib/supabase/admin-session-client";
import { getSupabaseClient } from "@/lib/supabase/client";

// ? Types ?

type Team = { id: string; teamName: string; logoUrl: string | null };
type Player = { id: string; registereId: string; teamName: string; fullName: string; position: string; jerseyNumber: string; badgeId: string | null };
type Staff = { id: string; registereId: string; teamName: string; fullName: string; role: string; badgeId: string | null };
type Group = { id: string; code: string; name: string; order_index: number };
type Match = { id: string; stage: string; group_id: string | null; round_label: string | null; home_registere_id: string; away_registere_id: string; kickoff_at: string | null; venue: string | null; home_score: number | null; away_score: number | null; status: string; created_at: string };
type Goal = { id: string; match_id: string; team_registere_id: string; scorer_player_id: string | null; minute: number | null; is_own_goal: boolean; created_at: string };
type StandingTeam = { registereId: string; teamName: string; seed: number | null; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number };
type StandingGroup = { groupId: string; groupCode: string; groupName: string; teams: StandingTeam[] };
type TopScorer = { playerId: string; fullName: string; teamName: string; position: string; goals: number };

type TournamentResponse = {
  teams: Team[]; players: Player[]; staff: Staff[]; groups: Group[]; matches: Match[]; goals: Goal[]; standings: StandingGroup[]; topScorers: TopScorer[];
  admin?: { userId: string; email: string; fullName: string }; error?: string;
};

type AdminBadgeMember = {
  key: string; memberType: "STAFF" | "PLAYER"; registereId: string; teamName: string;
  fullName: string; title: string; subtitle: string; badgeId: string;
  photoUrl?: string | null; qrCodeDataUrl?: string | null;
};

type MembersApiResponse = { members: AdminBadgeMember[]; staffCount: number; playerCount: number; error?: string };

type PlayerFull = {
  id: string; registereId: string; teamName: string; clubLogoUrl: string | null;
  fullName: string; position: string; jerseyNumber: string; age: number | null;
  photoUrl: string | null; photoSizeBytes: number | null; badgeId: string | null;
};

type PlayersApiResponse = { teams: Array<{ id: string; teamName: string; clubLogoUrl: string | null }>; players: PlayerFull[] };
type StatusTone = "info" | "success" | "error";
type GoalInputRow = { id: string; teamRegistereId: string; scorerPlayerId: string; minute: string; isOwnGoal: boolean };
type AdminSection = "overview" | "poules" | "matches" | "results" | "teams" | "players" | "badges" | "scorers";

// ? Badge generation helpers ?

const BADGE_QR_SIZE = 1400;

const defaultBadgeLayout = {
  photoX: 0.363, photoYTop: 0.218, photoSize: 0.274,
  qrX: 0.39, qrYTop: 0.596, qrSize: 0.22,
  nameYTop: 0.465, nameSize: 0.046,
  titleSize: 0.033,
  idSize: 0.031,
};

const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = document.createElement("img") as HTMLImageElement;
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Image load failed"));
  img.src = src;
});

const normalizeQr = async (src: string, size = BADGE_QR_SIZE): Promise<string> => {
  const img = await loadImg(src);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, size, size);
  const d = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2] < 180 ? 0 : 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  return canvas.toDataURL("image/png");
};

const buildQrDataUrl = async (member: AdminBadgeMember): Promise<string> => {
  try {
    const url = buildBadgeScanUrl({ badgeId: member.badgeId, originFallback: typeof window !== "undefined" ? window.location.origin : undefined });
    const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: BADGE_QR_SIZE, color: { dark: "#000000FF", light: "#FFFFFFFF" } });
    return normalizeQr(qr);
  } catch {
    return member.qrCodeDataUrl ? normalizeQr(member.qrCodeDataUrl) : "";
  }
};

const circularPhoto = async (src: string, size = 900): Promise<string> => {
  const img = await loadImg(src);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const sw = img.width || 1, sh = img.height || 1;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  let cropSize = Math.min(sw, sh);
  let cropX = (sw - cropSize) / 2;
  let cropY = (sh - cropSize) / 2;
  type FD = { detect: (el: CanvasImageSource) => Promise<Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>> };
  const FaceDetector = (globalThis as { FaceDetector?: new (o?: Record<string, unknown>) => FD }).FaceDetector;
  if (FaceDetector) {
    try {
      const d = new FaceDetector({ maxDetectedFaces: 1, fastMode: true });
      const faces = await d.detect(img);
      const f = faces?.[0]?.boundingBox;
      if (f) {
        const cx = f.x + f.width / 2, cy = f.y + f.height * 0.62;
        cropSize = Math.min(Math.max(f.width * 2.6, f.height * 3), Math.min(sw, sh));
        cropX = clamp(cx - cropSize / 2, 0, sw - cropSize);
        cropY = clamp(cy - cropSize / 2, 0, sh - cropSize);
      }
    } catch { /**/ }
  } else {
    cropY = clamp(cropY + cropSize * 0.08, 0, sh - cropSize);
  }
  ctx.save(); ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, size, size); ctx.restore();
  return canvas.toDataURL("image/png");
};

const fitText = (font: import("pdf-lib").PDFFont, text: string, start: number, min: number, maxW: number) => {
  let s = start;
  while (s > min && font.widthOfTextAtSize(text, s) > maxW) s -= 0.4;
  return Math.max(s, min);
};

// ? Constants ?

const stageOptions = ["GROUP", "ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "THIRD_PLACE", "FINAL"];
const ADMIN_IDLE_TIMEOUT_MS = 7 * 60 * 1000;
const MAX_PLAYER_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PLAYER_PHOTO_SIZE_LABEL = "5 MB";

const sectionItems: Array<{ id: AdminSection; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Dashboard", icon: <LayoutDashboardIcon className="size-4" /> },
  { id: "poules", label: "Poules", icon: <SplitSquareHorizontalIcon className="size-4" /> },
  { id: "matches", label: "Match Schedule", icon: <CalendarDaysIcon className="size-4" /> },
  { id: "results", label: "Résultats", icon: <SwordsIcon className="size-4" /> },
  { id: "teams", label: "Équipes", icon: <ShieldCheckIcon className="size-4" /> },
  { id: "players", label: "Joueurs", icon: <UsersRoundIcon className="size-4" /> },
  { id: "badges", label: "Badges", icon: <BadgeCheckIcon className="size-4" /> },
  { id: "scorers", label: "Meilleurs Buteurs", icon: <TargetIcon className="size-4" /> },
];

// ? CSS helpers ?

const toIsoFromLocal = (v: string) => { if (!v.trim()) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString(); };
const formatDateTime = (v: string | null) => { if (!v) return "—"; const d = new Date(v); return isNaN(d.getTime()) ? "—" : d.toLocaleString(); };
const createGoalRow = (): GoalInputRow => ({ id: crypto.randomUUID(), teamRegistereId: "", scorerPlayerId: "", minute: "", isOwnGoal: false });
const toDatetimeLocal = (iso: string | null): string => { if (!iso) return ""; const d = new Date(iso); if (isNaN(d.getTime())) return ""; const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

const inputCls = "flex h-9 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50";
const selectCls = "flex h-9 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-blue-500 cursor-pointer disabled:opacity-50";
const labelCls = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";
const cardCls = "rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm";
const thCls = "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900";
const tdCls = "px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300";

// ? Spinner ?

function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  return <span className={`animate-spin rounded-full border-2 border-current border-t-transparent ${size === "sm" ? "size-3" : "size-5"}`} />;
}

// ? Badge Modal ?

function BadgeModal({ memberKey, onClose }: { memberKey: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      <div
        className="relative z-10 flex flex-col w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        style={{ height: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <BadgeCheckIcon className="size-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Générateur de Badge PDF</span>
          </div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer" aria-label="Fermer">
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <iframe title="Badge Generator" src={`/badges?embed=1&member=${encodeURIComponent(memberKey)}`} className="h-full w-full border-0" style={{ minHeight: 0 }} />
        </div>
      </div>
    </div>
  );
}

// ? Edit Player Modal ?

function EditPlayerModal({ player, teams, accessToken, onClose, onSaved }: { player: PlayerFull; teams: Array<{ id: string; teamName: string }>; accessToken: string; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(player.fullName);
  const [position, setPosition] = useState(player.position);
  const [jerseyNumber, setJerseyNumber] = useState(player.jerseyNumber);
  const [age, setAge] = useState(String(player.age ?? ""));
  const [registereId, setRegistereId] = useState(player.registereId);
  const [photoPreview, setPhotoPreview] = useState<string | null>(player.photoUrl);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoSizeBytes, setPhotoSizeBytes] = useState<number | null>(null);
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

    if (!selectedFile.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image valide.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_PLAYER_PHOTO_SIZE_BYTES) {
      setError(`La photo doit faire ${MAX_PLAYER_PHOTO_SIZE_LABEL} maximum.`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Impossible de lire la photo sélectionnée.");
        return;
      }
      setPhotoPreview(reader.result);
      setPhotoDataUrl(reader.result);
      setPhotoSizeBytes(selectedFile.size);
      setPhotoFileName(selectedFile.name);
      setError(null);
    };
    reader.onerror = () => setError("Impossible de lire la photo sélectionnée.");
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    if (!fullName.trim() || !position.trim() || !jerseyNumber.trim() || isNaN(ageNum) || ageNum < 10 || ageNum > 80) { setError("Vérifiez les champs (âge entre 10 et 80)."); return; }
    setIsSaving(true); setError(null);
    try {
      const selectedTeam = teams.find((t) => t.id === registereId);
      const payload: {
        id: string;
        registereId: string;
        teamName: string | undefined;
        fullName: string;
        position: string;
        jerseyNumber: string;
        age: number;
        photoUrl?: string;
        photoSizeBytes?: number;
      } = {
        id: player.id,
        registereId,
        teamName: selectedTeam?.teamName,
        fullName: fullName.trim(),
        position: position.trim(),
        jerseyNumber: jerseyNumber.trim(),
        age: ageNum,
      };

      if (photoDataUrl && photoSizeBytes) {
        payload.photoUrl = photoDataUrl;
        payload.photoSizeBytes = photoSizeBytes;
      }

      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Erreur de sauvegarde."); }
      onSaved(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erreur inconnue."); } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-2"><PencilIcon className="size-4 text-blue-600" /><span className="text-sm font-semibold text-gray-900">Modifier le joueur</span></div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer"><XIcon className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className={labelCls}>Photo</label>
            <div className="mt-1 flex flex-col items-center gap-3">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                {photoPreview ? (
                  <Image src={photoPreview} alt={fullName} width={96} height={96} unoptimized className="size-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gray-400">{fullName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="w-full">
                <input type="file" accept="image/*" className={inputCls} onChange={handlePhotoChange} />
                <p className="mt-1 text-[11px] text-gray-500">JPG/PNG, max {MAX_PLAYER_PHOTO_SIZE_LABEL}.</p>
                {photoFileName ? <p className="mt-1 truncate text-[11px] text-gray-600">{photoFileName}</p> : null}
              </div>
            </div>
          </div>
          <div><label className={labelCls}>Équipe</label><select className={selectCls} value={registereId} onChange={(e) => setRegistereId(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></div>
          <div><label className={labelCls}>Nom complet</label><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Position</label><input className={inputCls} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="GK…" required /></div>
            <div><label className={labelCls}>Maillot</label><input className={inputCls} value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} required /></div>
            <div><label className={labelCls}>Age</label><input className={inputCls} type="number" min={10} max={80} value={age} onChange={(e) => setAge(e.target.value)} required /></div>
          </div>
          {error && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
            <button type="submit" disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer">{isSaving && <Spinner />} Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ? Delete Confirm Dialog ?

function DeleteConfirmDialog({ player, accessToken, onClose, onDeleted }: { player: PlayerFull; accessToken: string; onClose: () => void; onDeleted: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleDelete = async () => {
    setIsDeleting(true); setError(null);
    try {
      const res = await fetch("/api/admin/players", { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: player.id }) });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Erreur."); }
      onDeleted(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erreur."); } finally { setIsDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100"><Trash2Icon className="size-5 text-red-600" /></div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Supprimer ce joueur ?</p>
            <p className="mt-1 text-sm text-gray-500"><span className="font-medium text-gray-700">{player.fullName}</span> ({player.teamName}) sera supprimé définitivement.</p>
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Annuler</button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer">{isDeleting && <Spinner />} Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ? Edit Match Modal ?

function EditMatchModal({ match, teams, groups, accessToken, onClose, onSaved }: { match: Match; teams: Team[]; groups: Group[]; accessToken: string; onClose: () => void; onSaved: () => void }) {
  const [stage, setStage] = useState(match.stage);
  const [groupId, setGroupId] = useState(match.group_id ?? "");
  const [roundLabel, setRoundLabel] = useState(match.round_label ?? "");
  const [homeId, setHomeId] = useState(match.home_registere_id);
  const [awayId, setAwayId] = useState(match.away_registere_id);
  const [kickoffLocal, setKickoffLocal] = useState(() => toDatetimeLocal(match.kickoff_at));
  const [venue, setVenue] = useState(match.venue ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeId === awayId) { setError("Les deux équipes doivent être différentes."); return; }
    setIsSaving(true); setError(null);
    try {
      const res = await fetch("/api/admin/tournament", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "UPDATE_MATCH", matchId: match.id, stage, groupId: stage === "GROUP" ? (groupId || null) : null, roundLabel: roundLabel.trim() || null, homeRegistereId: homeId, awayRegistereId: awayId, kickoffAt: toIsoFromLocal(kickoffLocal), venue: venue.trim() || null }) });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error((d as { error?: string } | null)?.error || "Erreur de sauvegarde."); }
      onSaved(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erreur inconnue."); } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-5 py-4">
          <div className="flex items-center gap-2"><CalendarDaysIcon className="size-4 text-blue-600" /><span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modifier le match</span></div>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"><XIcon className="size-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className={`grid gap-3 ${stage === "GROUP" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div><label className={labelCls}>Stage</label><select className={selectCls} value={stage} onChange={(e) => setStage(e.target.value)} required>{stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            {stage === "GROUP" && <div><label className={labelCls}>Groupe</label><select className={selectCls} value={groupId} onChange={(e) => setGroupId(e.target.value)}><option value="">—</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.code} — {g.name}</option>)}</select></div>}
          </div>
          <div><label className={labelCls}>Label du round</label><input className={inputCls} value={roundLabel} onChange={(e) => setRoundLabel(e.target.value)} placeholder="Journée 1…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Domicile</label><select className={selectCls} value={homeId} onChange={(e) => setHomeId(e.target.value)} required>{teams.map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></div>
            <div><label className={labelCls}>Extérieur</label><select className={selectCls} value={awayId} onChange={(e) => setAwayId(e.target.value)} required>{teams.map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></div>
          </div>
          <div><label className={labelCls}>Coup d&apos;envoi</label><input className={inputCls} type="datetime-local" value={kickoffLocal} onChange={(e) => setKickoffLocal(e.target.value)} /></div>
          <div><label className={labelCls}>Stade</label><input className={inputCls} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Stade national…" /></div>
          {error && <p className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors cursor-pointer">Annuler</button>
            <button type="submit" disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer">{isSaving && <Spinner />} Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ? Delete Match Dialog ?

function DeleteMatchDialog({ match, teamNameById, accessToken, onClose, onDeleted }: { match: Match; teamNameById: Map<string, string>; accessToken: string; onClose: () => void; onDeleted: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleDelete = async () => {
    setIsDeleting(true); setError(null);
    try {
      const res = await fetch("/api/admin/tournament", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "DELETE_MATCH", matchId: match.id }) });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error((d as { error?: string } | null)?.error || "Erreur."); }
      onDeleted(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erreur."); } finally { setIsDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"><Trash2Icon className="size-5 text-red-600 dark:text-red-400" /></div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Supprimer ce match ?</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-700 dark:text-gray-300">{teamNameById.get(match.home_registere_id) ?? "Home"} vs {teamNameById.get(match.away_registere_id) ?? "Away"}</span> ({match.stage}) sera supprimé définitivement avec tous ses buts.</p>
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors cursor-pointer">Annuler</button>
          <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer">{isDeleting && <Spinner />} Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ? Btn ?

function Btn({ isLoading, children, className = "", variant = "primary", size = "md", disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean; variant?: "primary" | "outline" | "ghost" | "danger"; size?: "sm" | "md" }) {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
  const variants = { primary: "bg-blue-600 text-white hover:bg-blue-700", outline: "border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700", ghost: "bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-200", danger: "bg-red-600 text-white hover:bg-red-700" };
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  return (
    <button {...props} disabled={Boolean(disabled) || Boolean(isLoading)} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}

// ? Stat Card ?

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{icon}</div>
      </div>
    </div>
  );
}

// ? Main Component ?

export default function AdminPage() {
  const router = useRouter();
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutInProgressRef = useRef(false);
  const badgeResourcesRef = useRef<{ template: ArrayBuffer; bold: ArrayBuffer; semiBold: ArrayBuffer } | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("admin-theme");
    return saved === "dark" || saved === "light" ? saved : "light";
  });
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [adminName, setAdminName] = useState("");
  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [badgeMembers, setBadgeMembers] = useState<AdminBadgeMember[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);

  const [playersData, setPlayersData] = useState<PlayerFull[] | null>(null);
  const [playerTeams, setPlayerTeams] = useState<Array<{ id: string; teamName: string; clubLogoUrl: string | null }>>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<PlayerFull | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<PlayerFull | null>(null);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);

  const [expandedTeamIds, setExpandedTeamIds] = useState<Set<string>>(new Set());
  const [badgeModalKey, setBadgeModalKey] = useState<string | null>(null);
  const [downloadingBadgeKey, setDownloadingBadgeKey] = useState<string | null>(null);
  const [downloadingRosterKey, setDownloadingRosterKey] = useState<string | null>(null);

  const [groupCode, setGroupCode] = useState(""); const [groupName, setGroupName] = useState(""); const [groupOrder, setGroupOrder] = useState("1");
  const [assignGroupId, setAssignGroupId] = useState(""); const [assignTeamId, setAssignTeamId] = useState(""); const [assignSeed, setAssignSeed] = useState("");
  const [drawTeamIds, setDrawTeamIds] = useState<string[]>([]);
  const [matchStage, setMatchStage] = useState("GROUP"); const [matchGroupId, setMatchGroupId] = useState(""); const [matchRoundLabel, setMatchRoundLabel] = useState("");
  const [matchHomeId, setMatchHomeId] = useState(""); const [matchAwayId, setMatchAwayId] = useState(""); const [matchKickoffLocal, setMatchKickoffLocal] = useState(""); const [matchVenue, setMatchVenue] = useState("");
  const [resultMatchId, setResultMatchId] = useState(""); const [resultHomeScore, setResultHomeScore] = useState("0"); const [resultAwayScore, setResultAwayScore] = useState("0");
  const [goalRows, setGoalRows] = useState<GoalInputRow[]>([]);

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme((t) => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem("admin-theme", n); return n; });

  const teamNameById = useMemo(() => { const m = new Map<string, string>(); (tournament?.teams ?? []).forEach((t) => m.set(t.id, t.teamName)); return m; }, [tournament?.teams]);
  const playerCountByTeamId = useMemo(() => { const m = new Map<string, number>(); (tournament?.players ?? []).forEach((p) => m.set(p.registereId, (m.get(p.registereId) ?? 0) + 1)); return m; }, [tournament?.players]);
  const staffCountByTeamId = useMemo(() => { const m = new Map<string, number>(); (tournament?.staff ?? []).forEach((s) => m.set(s.registereId, (m.get(s.registereId) ?? 0) + 1)); return m; }, [tournament?.staff]);

  const effectiveAssignGroupId = assignGroupId || (tournament?.groups[0]?.id ?? "");
  const effectiveAssignTeamId = assignTeamId || (tournament?.teams[0]?.id ?? "");
  const effectiveMatchGroupId = matchGroupId || (tournament?.groups[0]?.id ?? "");
  const effectiveMatchHomeId = matchHomeId || (tournament?.teams[0]?.id ?? "");
  const effectiveMatchAwayId = matchAwayId || (tournament?.teams[1]?.id ?? tournament?.teams[0]?.id ?? "");
  const effectiveResultMatchId = resultMatchId || (tournament?.matches.find((m) => m.status !== "PLAYED")?.id ?? tournament?.matches[0]?.id ?? "");
  const selectedResultMatch = useMemo(() => (tournament?.matches ?? []).find((m) => m.id === effectiveResultMatchId) ?? null, [effectiveResultMatchId, tournament?.matches]);

  const filteredPlayers = useMemo(() => {
    if (!playersData) return [];
    const q = playerSearch.toLowerCase().trim();
    if (!q) return playersData;
    return playersData.filter((p) => p.fullName.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q) || p.position.toLowerCase().includes(q) || (p.jerseyNumber ?? "").toLowerCase().includes(q));
  }, [playersData, playerSearch]);

  // ? Logout ?

  const logoutToLogin = useCallback(async (reason?: "timeout") => {
    if (logoutInProgressRef.current) return;
    logoutInProgressRef.current = true;
    const supabase = getSupabaseClient();
    await Promise.allSettled([supabase.auth.signOut(), clearAdminServerSession()]);
    router.replace(reason === "timeout" ? "/admin/login?next=/admin&reason=timeout" : "/admin/login?next=/admin");
  }, [router]);

  // ? Sync result form ?

  const syncResultForm = useCallback((source: TournamentResponse | null, matchId: string) => {
    if (!source) { setGoalRows([]); setResultHomeScore("0"); setResultAwayScore("0"); return; }
    const match = source.matches.find((m) => m.id === matchId);
    if (!match) { setGoalRows([]); setResultHomeScore("0"); setResultAwayScore("0"); return; }
    setResultHomeScore(String(match.home_score ?? 0));
    setResultAwayScore(String(match.away_score ?? 0));
    setGoalRows(source.goals.filter((g) => g.match_id === matchId).map((g) => ({ id: crypto.randomUUID(), teamRegistereId: g.team_registere_id, scorerPlayerId: g.scorer_player_id ?? "", minute: g.minute === null ? "" : String(g.minute), isOwnGoal: g.is_own_goal })));
  }, []);

  // ? Load main data ?

  const loadData = useCallback(async (token: string, options?: { quiet?: boolean }) => {
    if (!options?.quiet) { setStatusMessage("Chargement..."); setStatusTone("info"); }
    const [tr, mr] = await Promise.all([
      fetch("/api/admin/tournament", { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, cache: "no-store" }),
      fetch("/api/members", { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, cache: "no-store" }),
    ]);
    if (tr.status === 401 || tr.status === 403) { await logoutToLogin(); return; }
    const tp = (await tr.json().catch(() => null)) as TournamentResponse | null;
    const mp = (await mr.json().catch(() => null)) as MembersApiResponse | null;
    if (!tr.ok) throw new Error(tp?.error || "Erreur de chargement.");
    const safe: TournamentResponse = tp ?? { teams: [], players: [], staff: [], groups: [], matches: [], goals: [], standings: [], topScorers: [] };
    setTournament(safe);
    setAdminName(safe.admin?.fullName ?? safe.admin?.email ?? "Admin");
    setBadgeMembers(mp?.members ?? []);
    setStaffCount(mp?.staffCount ?? 0);
    setPlayerCount(mp?.playerCount ?? 0);
    const ng = safe.groups[0]?.id ?? "", nt = safe.teams[0]?.id ?? "", na = safe.teams[1]?.id ?? nt;
    const nm = safe.matches.find((m) => m.status !== "PLAYED")?.id ?? safe.matches[0]?.id ?? "";
    setAssignGroupId((c) => (c && safe.groups.some((g) => g.id === c) ? c : ng));
    setAssignTeamId((c) => (c && safe.teams.some((t) => t.id === c) ? c : nt));
    setMatchGroupId((c) => (c && safe.groups.some((g) => g.id === c) ? c : ng));
    setMatchHomeId((c) => (c && safe.teams.some((t) => t.id === c) ? c : nt));
    setMatchAwayId((c) => (c && safe.teams.some((t) => t.id === c) ? c : na));
    setDrawTeamIds((c) => c.filter((id) => safe.teams.some((t) => t.id === id)).slice(0, 8));
    const cur = resultMatchId && safe.matches.some((m) => m.id === resultMatchId) ? resultMatchId : nm;
    setResultMatchId(cur); syncResultForm(safe, cur);
    if (!options?.quiet) setStatusMessage(null);
  }, [logoutToLogin, resultMatchId, syncResultForm]);

  // ? Load players data ?

  const loadPlayersData = useCallback(async (token: string) => {
    setIsLoadingPlayers(true);
    try {
      const res = await fetch("/api/admin/players", { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as PlayersApiResponse;
      setPlayersData(data.players);
      setPlayerTeams(data.teams);
    } catch { /**/ } finally { setIsLoadingPlayers(false); }
  }, []);

  // ? Badge resource loading ?

  const loadBadgeResources = async () => {
    if (badgeResourcesRef.current) return badgeResourcesRef.current;
    const [template, bold, semiBold] = await Promise.all([
      fetch("/Badge%20.pdf").then((r) => r.arrayBuffer()),
      fetch("/Montserrat-Bold.ttf").then((r) => r.arrayBuffer()),
      fetch("/Montserrat-SemiBold.ttf").then((r) => r.arrayBuffer()),
    ]);
    badgeResourcesRef.current = { template, bold, semiBold };
    return badgeResourcesRef.current;
  };

  // ? Direct badge download ?

  const handleDirectBadgeDownload = async (memberKey: string) => {
    const member = badgeMembers.find((m) => m.key === memberKey);
    if (!member) return;
    if (!member.photoUrl || !member.qrCodeDataUrl) {
      setStatusMessage("Données incomplètes pour ce badge (photo ou QR code manquant).");
      setStatusTone("error");
      return;
    }
    setDownloadingBadgeKey(memberKey);
    try {
      const { template, bold, semiBold } = await loadBadgeResources();
      const pdfDoc = await PDFDocument.load(template);
      pdfDoc.registerFontkit(fontkit);
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      const boldFont = await pdfDoc.embedFont(bold, { subset: false });
      const semiBoldFont = await pdfDoc.embedFont(semiBold, { subset: false });
      const L = defaultBadgeLayout;
      const badgeBlue = rgb(0.03, 0.07, 0.36);

      const photoData = await circularPhoto(member.photoUrl);
      const qrData = await buildQrDataUrl(member);
      const photoImg = await pdfDoc.embedPng(dataUrlToUint8Array(photoData));
      const qrImg = qrData.startsWith("data:image/jpeg") ? await pdfDoc.embedJpg(dataUrlToUint8Array(qrData)) : await pdfDoc.embedPng(dataUrlToUint8Array(qrData));

      const ps = width * L.photoSize, px = width * L.photoX, py = height - height * L.photoYTop - ps;
      const qs = width * L.qrSize, qx = width * L.qrX, qy = height - height * L.qrYTop - qs;
      page.drawImage(photoImg, { x: px, y: py, width: ps, height: ps });
      page.drawImage(qrImg, { x: qx, y: qy, width: qs, height: qs });

      const resolve = (text: string, sp: number, mwp: number, font: import("pdf-lib").PDFFont, ms = 0.55) => {
        const s = fitText(font, text, width * sp, Math.max(7, width * sp * ms), width * mwp);
        return { s, lh: font.heightAtSize(s), tw: font.widthOfTextAtSize(text, s) };
      };
      const drawCentered = (text: string, font: import("pdf-lib").PDFFont, topPx: number, s: number, lh: number, tw: number) => {
        page.drawText(text, { x: width * 0.5 - tw / 2, y: height - topPx - lh, size: s, font, color: badgeBlue });
        return topPx + lh;
      };

      const typeText = member.memberType.toUpperCase();
      const nameText = member.fullName;
      const roleText = member.subtitle || member.title;
      const idText = `ID N : ${member.badgeId}`;
      const inter = width * 0.0045, gap = width * 0.006;
      const nameTop = height * L.nameYTop;
      const typeInfo = resolve(typeText, 0.038, 0.5, boldFont, 0.7);
      drawCentered(typeText, boldFont, nameTop - typeInfo.lh - gap, typeInfo.s, typeInfo.lh, typeInfo.tw);
      const nameInfo = resolve(nameText, L.nameSize, 0.78, boldFont, 0.42);
      const afterName = drawCentered(nameText, boldFont, nameTop, nameInfo.s, nameInfo.lh, nameInfo.tw);
      const roleInfo = resolve(roleText, L.titleSize, 0.78, semiBoldFont, 0.5);
      const afterRole = drawCentered(roleText, semiBoldFont, afterName + inter, roleInfo.s, roleInfo.lh, roleInfo.tw);
      const idInfo = resolve(idText, L.idSize, 0.88, semiBoldFont, 0.42);
      drawCentered(idText, semiBoldFont, afterRole + inter, idInfo.s, idInfo.lh, idInfo.tw);

      const scanText = "SCAN ME";
      const scanS = fitText(boldFont, scanText, width * 0.052, width * 0.04, qs + width * 0.12);
      page.drawText(scanText, { x: qx + qs / 2 - boldFont.widthOfTextAtSize(scanText, scanS) / 2, y: qy - width * 0.055, size: scanS, font: boldFont, color: badgeBlue });
      const validText = "VALID UNTIL: 12/2026";
      const validS = width * 0.03;
      page.drawText(validText, { x: qx + qs / 2 - semiBoldFont.widthOfTextAtSize(validText, validS) / 2, y: qy - width * 0.11, size: validS, font: semiBoldFont, color: badgeBlue });

      const p2 = pdfDoc.getPages()[1];
      if (p2) {
        const { width: w2, height: h2 } = p2.getSize();
        const wt = "www.granpanpannationscup.com";
        const ws = fitText(boldFont, wt, w2 * 0.028, w2 * 0.02, w2 * 0.82);
        p2.drawText(wt, { x: w2 / 2 - boldFont.widthOfTextAtSize(wt, ws) / 2, y: h2 - h2 * 0.66 - boldFont.heightAtSize(ws), size: ws, font: boldFont, color: badgeBlue });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${member.badgeId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Erreur de génération du badge.");
      setStatusTone("error");
    } finally {
      setDownloadingBadgeKey(null);
    }
  };

  // ? Boot ?

  useEffect(() => {
    let active = true;
    const boot = async () => {
      setIsLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { await logoutToLogin(); return; }
        if (!active) return;
        setAccessToken(session.access_token);
        await loadData(session.access_token);
      } catch (error: unknown) {
        if (!active) return;
        setStatusMessage(error instanceof Error ? error.message : "Impossible de charger le panel."); setStatusTone("error");
      } finally { if (active) setIsLoading(false); }
    };
    void boot();
    return () => { active = false; };
  }, [loadData, logoutToLogin]);

  useEffect(() => {
    if (isLoading || !accessToken) return;
    const reset = () => { if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current); idleTimeoutRef.current = setTimeout(() => void logoutToLogin("timeout"), ADMIN_IDLE_TIMEOUT_MS); };
    const events: Array<keyof WindowEventMap> = ["click", "keydown", "mousedown", "mousemove", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => { if (idleTimeoutRef.current) { clearTimeout(idleTimeoutRef.current); idleTimeoutRef.current = null; } events.forEach((ev) => window.removeEventListener(ev, reset)); };
  }, [accessToken, isLoading, logoutToLogin]);

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    if (section === "players" && accessToken && playersData === null) {
      void loadPlayersData(accessToken);
    }
  };

  // ? Tournament actions ?

  const postAction = async (payload: Record<string, unknown>, success: string): Promise<boolean> => {
    if (!accessToken) { await logoutToLogin(); return false; }
    setIsSaving(true); setStatusMessage("Sauvegarde..."); setStatusTone("info");
    try {
      const res = await fetch("/api/admin/tournament", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(result?.error || "Requête échouée.");
      await loadData(accessToken, { quiet: true });
      setStatusMessage(success); setStatusTone("success");
      return true;
    } catch (err: unknown) { setStatusMessage(err instanceof Error ? err.message : "Action échouée."); setStatusTone("error"); return false; } finally { setIsSaving(false); }
  };

  const handleRefresh = async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    try { await loadData(accessToken); if (activeSection === "players") { setPlayersData(null); await loadPlayersData(accessToken); } } catch { /**/ } finally { setIsRefreshing(false); }
  };

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); await postAction({ action: "CREATE_GROUP", code: groupCode, name: groupName, orderIndex: Number(groupOrder) || 1 }, "Groupe cree."); setGroupCode(""); setGroupName(""); setGroupOrder("1"); };
  const handleAssignTeam = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); await postAction({ action: "ASSIGN_TEAM_TO_GROUP", groupId: effectiveAssignGroupId, registereId: effectiveAssignTeamId, seed: assignSeed.trim() ? Number(assignSeed) : null }, "Equipe assignee."); };
  const handleDeleteGroup = async (groupId: string, groupLabel: string) => {
    const confirmed = window.confirm(`Supprimer le groupe ${groupLabel} ? Les matchs et buts de ce groupe seront aussi supprimes.`);
    if (!confirmed) return;
    await postAction({ action: "DELETE_GROUP", groupId }, "Groupe supprime.");
  };
  const handleDeleteBadge = async (member: AdminBadgeMember) => {
    const confirmed = window.confirm(`Supprimer le badge de ${member.fullName} ?`);
    if (!confirmed) return;
    await postAction({ action: "DELETE_BADGE", memberKey: member.key }, "Badge supprime.");
  };
  const handleRunAutoDraw = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (drawTeamIds.length !== 8) { setStatusMessage("Selectionnez exactement 8 equipes."); setStatusTone("error"); return; } await postAction({ action: "AUTO_DRAW_8_TEAMS", teamIds: drawTeamIds, clearExisting: true }, "Tirage termine."); };
  const handleCreateMatch = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); await postAction({ action: "CREATE_MATCH", stage: matchStage, groupId: matchStage === "GROUP" ? effectiveMatchGroupId : null, roundLabel: matchRoundLabel || null, homeRegistereId: effectiveMatchHomeId, awayRegistereId: effectiveMatchAwayId, kickoffAt: toIsoFromLocal(matchKickoffLocal), venue: matchVenue || null }, "Match cree."); setMatchRoundLabel(""); setMatchKickoffLocal(""); setMatchVenue(""); };
  const handleSaveResult = async (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const goals = goalRows.filter((r) => r.teamRegistereId.trim()).map((r) => ({ teamRegistereId: r.teamRegistereId, scorerPlayerId: r.scorerPlayerId || null, minute: r.minute.trim() ? Number(r.minute) : null, isOwnGoal: r.isOwnGoal })); await postAction({ action: "SAVE_MATCH_RESULT", matchId: effectiveResultMatchId, homeScore: Number(resultHomeScore), awayScore: Number(resultAwayScore), goals }, "Resultat sauvegarde."); };
  const handleLogout = async () => { await logoutToLogin(); };

  // ? Team roster download ?

  const handleDownloadRoster = async (teamId?: string) => {
    const teams = (tournament?.teams ?? []).slice().sort((a, b) => a.teamName.localeCompare(b.teamName));
    const players = tournament?.players ?? [];
    const staff = tournament?.staff ?? [];

    if (teams.length === 0) {
      setStatusMessage("Aucune equipe a exporter.");
      setStatusTone("error");
      return;
    }

    const selectedTeams = teamId ? teams.filter((team) => team.id === teamId) : teams;
    if (selectedTeams.length === 0) {
      setStatusMessage("Equipe introuvable.");
      setStatusTone("error");
      return;
    }

    setDownloadingRosterKey(teamId ?? "__all__");
    try {
      type RosterRow = {
        teamName: string;
        memberType: "PLAYER" | "STAFF";
        fullName: string;
        roleLabel: string;
        jerseyLabel: string;
        badgeId: string;
      };

      const safe = (value: string | null | undefined) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : "-";
      };

      const rows: RosterRow[] = [];
      let totalPlayers = 0;
      let totalStaff = 0;

      for (const team of selectedTeams) {
        const teamPlayers = players.filter((p) => p.registereId === team.id).sort((a, b) => a.fullName.localeCompare(b.fullName));
        const teamStaff = staff.filter((s) => s.registereId === team.id).sort((a, b) => a.fullName.localeCompare(b.fullName));

        totalPlayers += teamPlayers.length;
        totalStaff += teamStaff.length;

        teamPlayers.forEach((player) => {
          rows.push({
            teamName: safe(team.teamName),
            memberType: "PLAYER",
            fullName: safe(player.fullName),
            roleLabel: safe(player.position),
            jerseyLabel: safe(player.jerseyNumber),
            badgeId: safe(player.badgeId),
          });
        });

        teamStaff.forEach((member) => {
          rows.push({
            teamName: safe(team.teamName),
            memberType: "STAFF",
            fullName: safe(member.fullName),
            roleLabel: safe(member.role),
            jerseyLabel: "-",
            badgeId: safe(member.badgeId),
          });
        });
      }

      const pdfDoc = await PDFDocument.create();
      const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const logoBytes = await fetch("/Granpanpan%20Nation%20cupfull.png").then(async (res) => {
        if (!res.ok) throw new Error("Logo introuvable pour le PDF.");
        return res.arrayBuffer();
      });
      const logoImage = await pdfDoc.embedPng(logoBytes);

      const pageWidth = 842;
      const pageHeight = 595;
      const marginX = 28;
      const marginTop = 22;
      const marginBottom = 24;
      const headerGap = 16;
      const tableHeaderHeight = 20;
      const rowHeight = 18;
      const textSize = 9;
      const tableTopColor = rgb(0.91, 0.94, 0.99);
      const tableBorderColor = rgb(0.80, 0.84, 0.90);
      const headerTextColor = rgb(0.11, 0.26, 0.58);
      const lineTextColor = rgb(0.10, 0.13, 0.20);
      const altRowColor = rgb(0.98, 0.99, 1);

      const columns: Array<{ label: string; width: number; align?: "left" | "center" | "right" }> = [
        { label: "#", width: 28, align: "right" },
        { label: "TEAM", width: 150 },
        { label: "TYPE", width: 52, align: "center" },
        { label: "NAME", width: 190 },
        { label: "POSITION / ROLE", width: 130 },
        { label: "JERSEY", width: 52, align: "center" },
        { label: "BADGE ID", width: 140 },
      ];

      const shorten = (input: string, maxWidth: number) => {
        if (normalFont.widthOfTextAtSize(input, textSize) <= maxWidth) return input;
        const ellipsis = "...";
        const ellipsisWidth = normalFont.widthOfTextAtSize(ellipsis, textSize);
        let out = input;
        while (out.length > 0 && normalFont.widthOfTextAtSize(out, textSize) + ellipsisWidth > maxWidth) out = out.slice(0, -1);
        return out.length > 0 ? `${out}${ellipsis}` : ellipsis;
      };

      const buildFileSlug = (value: string) => {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        return slug || "team";
      };

      const drawTableHeader = (page: import("pdf-lib").PDFPage, yTop: number) => {
        let x = marginX;
        for (const col of columns) {
          page.drawRectangle({
            x,
            y: yTop - tableHeaderHeight,
            width: col.width,
            height: tableHeaderHeight,
            color: tableTopColor,
            borderColor: tableBorderColor,
            borderWidth: 0.8,
          });
          const textWidth = boldFont.widthOfTextAtSize(col.label, 8);
          const tx =
            col.align === "right"
              ? x + col.width - 4 - textWidth
              : col.align === "center"
                ? x + (col.width - textWidth) / 2
                : x + 4;
          page.drawText(col.label, { x: tx, y: yTop - tableHeaderHeight + 6, size: 8, font: boldFont, color: headerTextColor });
          x += col.width;
        }
      };

      const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const subtitle = teamId
        ? `Official Team Roster - ${selectedTeams[0].teamName}`
        : "Official Teams Roster";
      const metaLine = `Generated: ${reportDate} | Teams: ${selectedTeams.length} | Players: ${totalPlayers} | Staff: ${totalStaff}`;

      const drawHeader = (page: import("pdf-lib").PDFPage) => {
        const logoTargetHeight = 42;
        const logoScale = logoTargetHeight / logoImage.height;
        const logoWidth = logoImage.width * logoScale;
        const topY = pageHeight - marginTop;
        const logoY = topY - logoTargetHeight;
        page.drawImage(logoImage, { x: marginX, y: logoY, width: logoWidth, height: logoTargetHeight });

        const titleX = marginX + logoWidth + 12;
        page.drawText(subtitle, { x: titleX, y: topY - 22, size: 10.5, font: boldFont, color: lineTextColor });
        page.drawText(metaLine, { x: titleX, y: topY - 36, size: 9, font: normalFont, color: rgb(0.35, 0.40, 0.48) });

        return logoY - headerGap;
      };

      const drawFooter = (page: import("pdf-lib").PDFPage, pageNum: number, totalPages: number) => {
        const label = `Page ${pageNum}/${totalPages}`;
        const textWidth = normalFont.widthOfTextAtSize(label, 8);
        page.drawText(label, {
          x: pageWidth - marginX - textWidth,
          y: 10,
          size: 8,
          font: normalFont,
          color: rgb(0.45, 0.50, 0.58),
        });
      };

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let yTop = drawHeader(page);
      drawTableHeader(page, yTop);
      let yCursor = yTop - tableHeaderHeight;

      if (rows.length === 0) {
        page.drawText("No players or staff available for this selection.", {
          x: marginX + 4,
          y: yCursor - 16,
          size: 10,
          font: normalFont,
          color: rgb(0.43, 0.47, 0.55),
        });
      } else {
        for (let i = 0; i < rows.length; i++) {
          if (yCursor - rowHeight < marginBottom) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yTop = drawHeader(page);
            drawTableHeader(page, yTop);
            yCursor = yTop - tableHeaderHeight;
          }

          const row = rows[i];
          const rowBottom = yCursor - rowHeight;
          let x = marginX;
          const values = [
            String(i + 1),
            row.teamName,
            row.memberType,
            row.fullName,
            row.roleLabel,
            row.jerseyLabel,
            row.badgeId,
          ];

          for (let c = 0; c < columns.length; c++) {
            const col = columns[c];
            page.drawRectangle({
              x,
              y: rowBottom,
              width: col.width,
              height: rowHeight,
              color: i % 2 === 0 ? rgb(1, 1, 1) : altRowColor,
              borderColor: tableBorderColor,
              borderWidth: 0.45,
            });

            const raw = values[c] ?? "-";
            const maxTextWidth = col.width - 8;
            const text = shorten(raw, maxTextWidth);
            const textWidth = normalFont.widthOfTextAtSize(text, textSize);
            const tx =
              col.align === "right"
                ? x + col.width - 4 - textWidth
                : col.align === "center"
                  ? x + (col.width - textWidth) / 2
                  : x + 4;

            page.drawText(text, {
              x: tx,
              y: rowBottom + (rowHeight - textSize) / 2 + 1,
              size: textSize,
              font: normalFont,
              color: lineTextColor,
            });
            x += col.width;
          }

          yCursor -= rowHeight;
        }
      }

      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) drawFooter(pages[i], i + 1, pages.length);

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName = teamId ? `roster-${buildFileSlug(selectedTeams[0].teamName)}.pdf` : "roster-all-teams.pdf";
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      setStatusMessage(teamId ? `PDF exporte pour ${selectedTeams[0].teamName}.` : "PDF exporte pour toutes les equipes.");
      setStatusTone("success");
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : "Erreur pendant l'export PDF.");
      setStatusTone("error");
    } finally {
      setDownloadingRosterKey(null);
    }
  };

  // ? Status color ?


  // ? Loading state ?

  if (isLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950 ${isDark ? "dark" : ""}`}>
        <div className="text-center">
          <span className="size-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 block mx-auto" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement du panel admin…</p>
        </div>
      </div>
    );
  }

  // ? Render ?

  return (
    <div className={`flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 ${isDark ? "dark" : ""}`}>
      {badgeModalKey && <BadgeModal memberKey={badgeModalKey} onClose={() => setBadgeModalKey(null)} />}
      {editingPlayer && accessToken && <EditPlayerModal player={editingPlayer} teams={playerTeams} accessToken={accessToken} onClose={() => setEditingPlayer(null)} onSaved={() => { setPlayersData(null); if (accessToken) void loadPlayersData(accessToken); }} />}
      {deletingPlayer && accessToken && <DeleteConfirmDialog player={deletingPlayer} accessToken={accessToken} onClose={() => setDeletingPlayer(null)} onDeleted={() => { setPlayersData(null); if (accessToken) void loadPlayersData(accessToken); }} />}
      {editingMatch && accessToken && <EditMatchModal match={editingMatch} teams={tournament?.teams ?? []} groups={tournament?.groups ?? []} accessToken={accessToken} onClose={() => setEditingMatch(null)} onSaved={() => { if (accessToken) void loadData(accessToken, { quiet: true }); }} />}
      {deletingMatch && accessToken && <DeleteMatchDialog match={deletingMatch} teamNameById={teamNameById} accessToken={accessToken} onClose={() => setDeletingMatch(null)} onDeleted={() => { if (accessToken) void loadData(accessToken, { quiet: true }); }} />}

      {/* ? Sidebar ? */}
      <aside className={`${isSidebarOpen ? "w-60" : "w-0 overflow-hidden"} flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all duration-300`}>
        <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <Image src="/Granpanpan%20Nation%20cupfull.png" alt="Granpanpan Nations Cup" width={398} height={100} unoptimized className="h-9 w-full max-w-[180px] object-contain object-left" priority />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {sectionItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button key={item.id} type="button" onClick={() => handleSectionChange(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-500 pl-[10px]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100 border-l-2 border-transparent"}`}>
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 dark:border-slate-700 p-3">
          <div className="rounded-lg bg-gray-50 dark:bg-slate-800 p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">Connecté en tant que</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{adminName || "Admin"}</p>
          </div>
          <button type="button" onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
            <LogOutIcon className="size-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ? Main ? */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsSidebarOpen((v) => !v)} className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer" aria-label="Toggle sidebar">
              <MenuIcon className="size-4" />
            </button>
            <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sectionItems.find((s) => s.id === activeSection)?.label ?? "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" aria-label="Basculer thème">
              {isDark ? <SunIcon className="size-4 text-yellow-400" /> : <MoonIcon className="size-4" />}
            </button>
            <Btn variant="outline" size="sm" isLoading={isRefreshing} onClick={handleRefresh}>
              <RefreshCwIcon className="size-3" /> Rafraîchir
            </Btn>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ? Overview ? */}
          {activeSection === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <StatCard label="Équipes" value={tournament?.teams.length ?? 0} icon={<ShieldCheckIcon className="size-5" />} />
                <StatCard label="Joueurs" value={tournament?.players.length ?? 0} icon={<UsersRoundIcon className="size-5" />} />
                <StatCard label="Groupes" value={tournament?.groups.length ?? 0} icon={<SplitSquareHorizontalIcon className="size-5" />} />
                <StatCard label="Matches" value={tournament?.matches.length ?? 0} icon={<CalendarDaysIcon className="size-5" />} />
                <StatCard label="Badges Staff" value={staffCount} icon={<BadgeCheckIcon className="size-5" />} />
                <StatCard label="Badges Joueurs" value={playerCount} icon={<BadgeCheckIcon className="size-5" />} />
              </div>
              <div className={cardCls}>
                <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Matches récents</p><p className="mt-0.5 text-xs text-gray-500">8 derniers matches</p></div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead><tr><th className={thCls}>Stage</th><th className={thCls}>Match</th><th className={thCls}>Coup d&apos;envoi</th><th className={thCls}>Score</th><th className={thCls}>Statut</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {(tournament?.matches ?? []).slice(0, 8).map((match) => (
                        <tr key={match.id} className="hover:bg-gray-50">
                          <td className={tdCls}><span className="rounded px-1.5 py-0.5 bg-gray-100 text-[10px] font-mono text-gray-600">{match.stage}</span></td>
                          <td className={`${tdCls} font-medium text-gray-900`}>{teamNameById.get(match.home_registere_id) ?? "Home"} <span className="text-gray-400">vs</span> {teamNameById.get(match.away_registere_id) ?? "Away"}</td>
                          <td className={tdCls}>{formatDateTime(match.kickoff_at)}</td>
                          <td className={tdCls}>{typeof match.home_score === "number" && typeof match.away_score === "number" ? <span className="font-bold">{match.home_score} — {match.away_score}</span> : "—"}</td>
                          <td className={tdCls}><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${match.status === "PLAYED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{match.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ? Poules ? */}
          {activeSection === "poules" && (
            <div className="grid gap-5 xl:grid-cols-2">
              <div className={`${cardCls} xl:col-span-2`}>
                <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Tirage Automatique (8 équipes)</p><p className="mt-0.5 text-xs text-gray-500">Sélectionnez 8 équipes. Le système crée Poule A / Poule B et génère tous les matches.</p></div>
                <div className="p-5">
                  <form onSubmit={handleRunAutoDraw} className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {(tournament?.teams ?? []).map((team) => { const idx = drawTeamIds.indexOf(team.id); const isSel = idx >= 0; return (<button key={team.id} type="button" onClick={() => setDrawTeamIds((c) => c.includes(team.id) ? c.filter((id) => id !== team.id) : c.length >= 8 ? c : [...c, team.id])} disabled={!isSel && drawTeamIds.length >= 8} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer disabled:opacity-40 ${isSel ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"}`}><span className="w-5 text-left font-mono text-xs text-gray-400">{isSel ? `${idx + 1}.` : "—"}</span><span className="truncate">{team.teamName}</span></button>); })}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">{drawTeamIds.length}/8</span>
                      <Btn type="button" variant="outline" size="sm" onClick={() => setDrawTeamIds([])} disabled={drawTeamIds.length === 0}>Réinitialiser</Btn>
                      <Btn type="submit" isLoading={isSaving} disabled={drawTeamIds.length !== 8}>Lancer le tirage</Btn>
                    </div>
                  </form>
                </div>
              </div>
              <div className={cardCls}>
                <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Créer un groupe</p></div>
                <form onSubmit={handleCreateGroup} className="space-y-3 p-5">
                  <div><label className={labelCls}>Code</label><input className={inputCls} value={groupCode} onChange={(e) => setGroupCode(e.target.value)} placeholder="A" required /></div>
                  <div><label className={labelCls}>Nom</label><input className={inputCls} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Poule A" required /></div>
                  <div><label className={labelCls}>Ordre</label><input className={inputCls} type="number" min={1} value={groupOrder} onChange={(e) => setGroupOrder(e.target.value)} required /></div>
                  <Btn type="submit" isLoading={isSaving}>Ajouter</Btn>
                </form>
              </div>
              <div className={cardCls}>
                <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Assigner équipe au groupe</p></div>
                <form onSubmit={handleAssignTeam} className="space-y-3 p-5">
                  <div><label className={labelCls}>Groupe</label><select className={selectCls} value={effectiveAssignGroupId} onChange={(e) => setAssignGroupId(e.target.value)} required>{(tournament?.groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.code} — {g.name}</option>)}</select></div>
                  <div><label className={labelCls}>Équipe</label><select className={selectCls} value={effectiveAssignTeamId} onChange={(e) => setAssignTeamId(e.target.value)} required>{(tournament?.teams ?? []).map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></div>
                  <div><label className={labelCls}>Seed (optionnel)</label><input className={inputCls} value={assignSeed} onChange={(e) => setAssignSeed(e.target.value)} /></div>
                  <Btn type="submit" isLoading={isSaving}>Sauvegarder</Btn>
                </form>
              </div>
              <div className={`${cardCls} xl:col-span-2`}>
                <div className="border-b border-gray-200 px-5 py-4">
                  <p className="font-semibold text-gray-900">Groupes existants</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className={thCls}>Code</th>
                        <th className={thCls}>Nom</th>
                        <th className={thCls}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(tournament?.groups ?? []).map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className={`${tdCls} font-semibold text-gray-900`}>{group.code}</td>
                          <td className={tdCls}>{group.name}</td>
                          <td className={tdCls}>
                            <button
                              type="button"
                              onClick={() => void handleDeleteGroup(group.id, `${group.code} - ${group.name}`)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <Trash2Icon className="size-3.5" />
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(tournament?.groups ?? []).length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-6 text-sm text-gray-400">Aucun groupe cree.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {(tournament?.standings ?? []).map((gs) => (
                <div key={gs.groupId} className={cardCls}>
                  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <p className="font-semibold text-gray-900">{gs.groupCode} - {gs.groupName}</p>
                    <button
                      type="button"
                      onClick={() => void handleDeleteGroup(gs.groupId, `${gs.groupCode} - ${gs.groupName}`)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Trash2Icon className="size-3.5" />
                      Supprimer
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead><tr><th className={thCls}>Équipe</th><th className={`${thCls} text-center`}>Pts</th><th className={`${thCls} text-center`}>J</th><th className={`${thCls} text-center`}>G</th><th className={`${thCls} text-center`}>N</th><th className={`${thCls} text-center`}>P</th><th className={`${thCls} text-center`}>GF</th><th className={`${thCls} text-center`}>GA</th><th className={`${thCls} text-center`}>GD</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {gs.teams.map((t) => (<tr key={t.registereId} className="hover:bg-gray-50"><td className={`${tdCls} font-medium text-gray-900`}>{t.teamName}</td><td className={`${tdCls} text-center font-bold text-green-700`}>{t.points}</td><td className={`${tdCls} text-center`}>{t.played}</td><td className={`${tdCls} text-center`}>{t.wins}</td><td className={`${tdCls} text-center`}>{t.draws}</td><td className={`${tdCls} text-center`}>{t.losses}</td><td className={`${tdCls} text-center`}>{t.goalsFor}</td><td className={`${tdCls} text-center`}>{t.goalsAgainst}</td><td className={`${tdCls} text-center`}>{t.goalDifference}</td></tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ? Matches ? */}
          {activeSection === "matches" && (
            <div className="space-y-5">
              <div className={cardCls}>
                <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Créer un match</p></div>
                <form onSubmit={handleCreateMatch} className="grid gap-4 p-5 lg:grid-cols-2">
                  <div><label className={labelCls}>Stage</label><select className={selectCls} value={matchStage} onChange={(e) => setMatchStage(e.target.value)} required>{stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className={labelCls}>Groupe (GROUP uniquement)</label><select className={selectCls} value={effectiveMatchGroupId} onChange={(e) => setMatchGroupId(e.target.value)} disabled={matchStage !== "GROUP"}>{(tournament?.groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.code} — {g.name}</option>)}</select></div>
                  <div><label className={labelCls}>Label du round</label><input className={inputCls} value={matchRoundLabel} onChange={(e) => setMatchRoundLabel(e.target.value)} /></div>
                  <div><label className={labelCls}>Coup d&apos;envoi</label><input className={inputCls} type="datetime-local" value={matchKickoffLocal} onChange={(e) => setMatchKickoffLocal(e.target.value)} /></div>
                  <div><label className={labelCls}>Domicile</label><select className={selectCls} value={effectiveMatchHomeId} onChange={(e) => setMatchHomeId(e.target.value)} required>{(tournament?.teams ?? []).map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></div>
                  <div><label className={labelCls}>Extérieur</label><select className={selectCls} value={effectiveMatchAwayId} onChange={(e) => setMatchAwayId(e.target.value)} required>{(tournament?.teams ?? []).map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}</select></div>
                  <div className="lg:col-span-2"><label className={labelCls}>Stade</label><input className={inputCls} value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} /></div>
                  <div className="lg:col-span-2"><Btn type="submit" isLoading={isSaving}>Ajouter le match</Btn></div>
                </form>
              </div>
              <div className={cardCls}>
                <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Calendrier des matches</p></div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead><tr><th className={thCls}>Stage</th><th className={thCls}>Match</th><th className={thCls}>Coup d&apos;envoi</th><th className={thCls}>Stade</th><th className={thCls}>Score</th><th className={thCls}>Statut</th><th className={thCls}>Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {(tournament?.matches ?? []).map((m) => (<tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40"><td className={tdCls}><span className="rounded px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-[10px] font-mono text-gray-600 dark:text-gray-400">{m.stage}</span></td><td className={`${tdCls} font-medium text-gray-900 dark:text-gray-100`}>{teamNameById.get(m.home_registere_id) ?? "Home"} <span className="text-gray-400 dark:text-gray-500">vs</span> {teamNameById.get(m.away_registere_id) ?? "Away"}</td><td className={tdCls}>{formatDateTime(m.kickoff_at)}</td><td className={tdCls}>{m.venue || "—"}</td><td className={tdCls}>{typeof m.home_score === "number" && typeof m.away_score === "number" ? <span className="font-bold">{m.home_score} — {m.away_score}</span> : "—"}</td><td className={tdCls}><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.status === "PLAYED" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"}`}>{m.status}</span></td><td className={tdCls}><div className="flex items-center gap-1.5"><button type="button" onClick={() => setEditingMatch(m)} className="flex size-7 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer" title="Modifier"><PencilIcon className="size-3.5" /></button><button type="button" onClick={() => setDeletingMatch(m)} className="flex size-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer" title="Supprimer"><Trash2Icon className="size-3.5" /></button></div></td></tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ? Results ? */}
          {activeSection === "results" && (
            <div className={cardCls}>
              <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Saisir un résultat</p></div>
              <form onSubmit={handleSaveResult} className="space-y-4 p-5">
                <div><label className={labelCls}>Match</label><select className={selectCls} value={effectiveResultMatchId} onChange={(e) => { const id = e.target.value; setResultMatchId(id); syncResultForm(tournament, id); }} required>{(tournament?.matches ?? []).map((m) => <option key={m.id} value={m.id}>{m.stage} — {teamNameById.get(m.home_registere_id) ?? "Home"} vs {teamNameById.get(m.away_registere_id) ?? "Away"}</option>)}</select></div>
                {selectedResultMatch && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><label className={labelCls}>{teamNameById.get(selectedResultMatch.home_registere_id) ?? "Domicile"}</label><input className={inputCls} type="number" min={0} value={resultHomeScore} onChange={(e) => setResultHomeScore(e.target.value)} required /></div>
                    <div><label className={labelCls}>{teamNameById.get(selectedResultMatch.away_registere_id) ?? "Extérieur"}</label><input className={inputCls} type="number" min={0} value={resultAwayScore} onChange={(e) => setResultAwayScore(e.target.value)} required /></div>
                  </div>
                )}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Buteurs</p>
                    <Btn type="button" variant="outline" size="sm" onClick={() => setGoalRows((c) => [...c, createGoalRow()])}>+ Ajouter un but</Btn>
                  </div>
                  <div className="space-y-2">
                    {goalRows.map((row, index) => {
                      const pbt = (tournament?.players ?? []).filter((p) => p.registereId === row.teamRegistereId);
                      return (
                        <div key={row.id} className="grid gap-2 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-12">
                          <div className="space-y-1 md:col-span-4"><label className="text-[10px] uppercase text-gray-500">Équipe</label><select className={selectCls} value={row.teamRegistereId} onChange={(e) => setGoalRows((c) => c.map((item) => item.id === row.id ? { ...item, teamRegistereId: e.target.value, scorerPlayerId: "" } : item))}><option value="">Sélectionner</option>{selectedResultMatch && <><option value={selectedResultMatch.home_registere_id}>{teamNameById.get(selectedResultMatch.home_registere_id) ?? "Domicile"}</option><option value={selectedResultMatch.away_registere_id}>{teamNameById.get(selectedResultMatch.away_registere_id) ?? "Extérieur"}</option></>}</select></div>
                          <div className="space-y-1 md:col-span-4"><label className="text-[10px] uppercase text-gray-500">Buteur</label><select className={selectCls} value={row.scorerPlayerId} onChange={(e) => setGoalRows((c) => c.map((item) => item.id === row.id ? { ...item, scorerPlayerId: e.target.value } : item))}><option value="">Sélectionner</option>{pbt.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select></div>
                          <div className="space-y-1 md:col-span-2"><label className="text-[10px] uppercase text-gray-500">Minute</label><input className={inputCls} type="number" min={0} max={130} value={row.minute} onChange={(e) => setGoalRows((c) => c.map((item) => item.id === row.id ? { ...item, minute: e.target.value } : item))} /></div>
                          <div className="flex items-end gap-3 md:col-span-2"><label className="flex items-center gap-2 pb-2 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={row.isOwnGoal} onChange={(e) => setGoalRows((c) => c.map((item) => item.id === row.id ? { ...item, isOwnGoal: e.target.checked } : item))} className="rounded" />CSC</label><Btn type="button" variant="danger" size="sm" onClick={() => setGoalRows((c) => c.filter((item) => item.id !== row.id))}>×</Btn></div>
                          <p className="text-[10px] text-gray-400 md:col-span-12">But {index + 1}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Btn type="submit" isLoading={isSaving} disabled={!effectiveResultMatchId}>Sauvegarder le résultat</Btn>
              </form>
            </div>
          )}

          {/* ? Teams ? */}
          {activeSection === "teams" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {(tournament?.teams ?? []).map((team) => {
                  const initials = team.teamName.split(" ").map((p) => p[0] ?? "").join("").slice(0, 3).toUpperCase();
                  return (
                    <div key={team.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {team.logoUrl ? <img src={team.logoUrl} alt="" className="size-full object-cover" /> : <span className="text-xs font-bold text-gray-400">{initials || "TEAM"}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{team.teamName}</p>
                          <p className="text-xs text-gray-500">{playerCountByTeamId.get(team.id) ?? 0} joueurs · {staffCountByTeamId.get(team.id) ?? 0} staff</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={cardCls}>
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div><p className="font-semibold text-gray-900">Liste officielle des joueurs</p><p className="mt-0.5 text-xs text-gray-500">Cliquez sur l&apos;icône PDF pour prévisualiser ou télécharger directement le badge</p></div>
                  <Btn variant="outline" size="sm" isLoading={downloadingRosterKey === "__all__"} onClick={() => void handleDownloadRoster()}><DownloadIcon className="size-3" />PDF toutes les equipes</Btn>
                </div>

                <div className="divide-y divide-gray-100">
                  {(tournament?.teams ?? []).map((team) => {
                    const tp = (tournament?.players ?? []).filter((p) => p.registereId === team.id).sort((a, b) => a.fullName.localeCompare(b.fullName));
                    const ts = (tournament?.staff ?? []).filter((s) => s.registereId === team.id).sort((a, b) => a.fullName.localeCompare(b.fullName));
                    const isExp = expandedTeamIds.has(team.id);
                    return (
                      <div key={team.id}>
                        <div className="flex items-center gap-2 px-3 py-2">
                          <button type="button" onClick={() => setExpandedTeamIds((prev) => { const n = new Set(prev); if (isExp) { n.delete(team.id); } else { n.add(team.id); } return n; })} className="flex flex-1 items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
                                {team.logoUrl ? <img src={team.logoUrl} alt="" className="size-full object-cover" /> : <span className="text-[10px] font-bold text-gray-400">{team.teamName.slice(0, 2).toUpperCase()}</span>}
                              </div>
                              <span className="font-semibold text-gray-900">{team.teamName}</span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{tp.length} joueurs · {ts.length} staff</span>
                            </div>
                            {isExp ? <ChevronUpIcon className="size-4 text-gray-400" /> : <ChevronDownIcon className="size-4 text-gray-400" />}
                          </button>
                          <Btn
                            variant="outline"
                            size="sm"
                            isLoading={downloadingRosterKey === team.id}
                            onClick={() => void handleDownloadRoster(team.id)}
                            className="shrink-0"
                          >
                            <DownloadIcon className="size-3" />
                            PDF equipe
                          </Btn>
                        </div>

                        {isExp && (
                          <div className="border-t border-gray-100 bg-gray-50/50">
                            {tp.length > 0 && (
                              <div>
                                <div className="px-5 py-2 border-b border-gray-100"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Joueurs ({tp.length})</p></div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full">
                                    <thead><tr><th className={thCls}>#</th><th className={thCls}>Nom</th><th className={thCls}>Position</th><th className={thCls}>Maillot</th><th className={thCls}>Badge ID</th><th className={thCls}>Visualiser</th><th className={thCls}>Télécharger</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {tp.map((player, idx) => {
                                        const member = badgeMembers.find((m) => m.badgeId === player.badgeId);
                                        const isDl = downloadingBadgeKey === (member?.key ?? null);
                                        return (
                                          <tr key={player.id} className="hover:bg-white">
                                            <td className={`${tdCls} text-gray-400`}>{idx + 1}</td>
                                            <td className={`${tdCls} font-medium text-gray-900`}>{player.fullName}</td>
                                            <td className={tdCls}>{player.position}</td>
                                            <td className={tdCls}>{player.jerseyNumber}</td>
                                            <td className={`${tdCls} font-mono text-xs text-gray-400`}>{player.badgeId ?? "—"}</td>
                                            <td className={tdCls}>
                                              {member ? (
                                                <button type="button" onClick={() => setBadgeModalKey(member.key)} className="flex size-7 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer" title="Visualiser le badge">
                                                  <FileTextIcon className="size-3.5" />
                                                </button>
                                              ) : <span className="text-xs text-gray-300">—</span>}
                                            </td>
                                            <td className={tdCls}>
                                              {member ? (
                                                <button type="button" onClick={() => void handleDirectBadgeDownload(member.key)} disabled={isDl} className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors cursor-pointer" title="Télécharger le badge PDF">
                                                  {isDl ? <Spinner /> : <DownloadIcon className="size-3" />}
                                                  {isDl ? "..." : "PDF"}
                                                </button>
                                              ) : <span className="text-xs text-gray-300">—</span>}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {ts.length > 0 && (
                              <div>
                                <div className="px-5 py-2 border-t border-b border-gray-100"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Staff ({ts.length})</p></div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full">
                                    <thead><tr><th className={thCls}>#</th><th className={thCls}>Nom</th><th className={thCls}>Rôle</th><th className={thCls}>Badge ID</th><th className={thCls}>Visualiser</th><th className={thCls}>Télécharger</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {ts.map((ms, idx) => {
                                        const member = badgeMembers.find((m) => m.badgeId === ms.badgeId);
                                        const isDl = downloadingBadgeKey === (member?.key ?? null);
                                        return (
                                          <tr key={ms.id} className="hover:bg-white">
                                            <td className={`${tdCls} text-gray-400`}>{idx + 1}</td>
                                            <td className={`${tdCls} font-medium text-gray-900`}>{ms.fullName}</td>
                                            <td className={tdCls}>{ms.role}</td>
                                            <td className={`${tdCls} font-mono text-xs text-gray-400`}>{ms.badgeId ?? "—"}</td>
                                            <td className={tdCls}>
                                              {member ? (
                                                <button type="button" onClick={() => setBadgeModalKey(member.key)} className="flex size-7 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer" title="Visualiser le badge">
                                                  <FileTextIcon className="size-3.5" />
                                                </button>
                                              ) : <span className="text-xs text-gray-300">—</span>}
                                            </td>
                                            <td className={tdCls}>
                                              {member ? (
                                                <button type="button" onClick={() => void handleDirectBadgeDownload(member.key)} disabled={isDl} className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors cursor-pointer" title="Télécharger le badge PDF">
                                                  {isDl ? <Spinner /> : <DownloadIcon className="size-3" />}
                                                  {isDl ? "..." : "PDF"}
                                                </button>
                                              ) : <span className="text-xs text-gray-300">—</span>}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {tp.length === 0 && ts.length === 0 && <div className="px-5 py-4 text-sm text-gray-400">Aucun membre pour cette équipe.</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ? Players ? */}
          {activeSection === "players" && (
            <div className={cardCls}>
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Joueurs</p>
                  <p className="mt-0.5 text-xs text-gray-500">{playersData ? `${filteredPlayers.length} joueur${filteredPlayers.length !== 1 ? "s" : ""}${playerSearch ? " trouvés" : " au total"}` : "Chargement…"}</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                  <input className={`${inputCls} pl-8`} placeholder="Rechercher joueur, équipe…" value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} />
                </div>
              </div>
              {isLoadingPlayers ? (
                <div className="flex items-center justify-center py-16"><Spinner size="md" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead><tr><th className={thCls}>#</th><th className={thCls}>Joueur</th><th className={thCls}>Equipe / Club</th><th className={thCls}>Position</th><th className={thCls}>Maillot</th><th className={thCls}>Age</th><th className={thCls}>Badge ID</th><th className={thCls}>Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPlayers.map((player, idx) => (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className={`${tdCls} text-gray-400`}>{idx + 1}</td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                                {player.photoUrl ? <img src={player.photoUrl} alt="" className="size-full object-cover" /> : <span className="text-[10px] font-bold text-gray-400">{player.fullName.slice(0, 2).toUpperCase()}</span>}
                              </div>
                              <span className="font-medium text-gray-900">{player.fullName}</span>
                            </div>
                          </td>
                          <td className={tdCls}>{player.teamName}</td>
                          <td className={tdCls}><span className="rounded px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600">{player.position}</span></td>
                          <td className={`${tdCls} text-center font-mono`}>{player.jerseyNumber}</td>
                          <td className={tdCls}>{player.age ?? "—"}</td>
                          <td className={`${tdCls} font-mono text-xs text-gray-400`}>{player.badgeId ?? "—"}</td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => setEditingPlayer(player)} className="flex size-7 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer" title="Modifier"><PencilIcon className="size-3.5" /></button>
                              <button type="button" onClick={() => setDeletingPlayer(player)} className="flex size-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer" title="Supprimer"><Trash2Icon className="size-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPlayers.length === 0 && !isLoadingPlayers && (
                        <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">{playerSearch ? `Aucun joueur ne correspond à "${playerSearch}".` : "Aucun joueur enregistré."}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ? Badges ? */}
          {activeSection === "badges" && (
            <div className={cardCls}>
              <div className="border-b border-gray-200 px-5 py-4">
                <div>
                  <p className="font-semibold text-gray-900">Badges membres</p>
                  <p className="mt-0.5 text-xs text-gray-500">Visualisez le badge dans une fenêtre ou téléchargez-le directement en PDF.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead><tr><th className={thCls}>Type</th><th className={thCls}>Nom complet</th><th className={thCls}>Equipe</th><th className={thCls}>Badge ID</th><th className={thCls}>Visualiser</th><th className={thCls}>Telecharger PDF</th><th className={thCls}>Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {badgeMembers.map((member) => {
                      const isDl = downloadingBadgeKey === member.key;
                      return (
                        <tr key={member.key} className="hover:bg-gray-50">
                          <td className={tdCls}><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${member.memberType === "PLAYER" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{member.memberType}</span></td>
                          <td className={`${tdCls} font-medium text-gray-900`}>{member.fullName}</td>
                          <td className={tdCls}>{member.teamName}</td>
                          <td className={`${tdCls} font-mono text-xs text-gray-500`}>{member.badgeId}</td>
                          <td className={tdCls}>
                            <button type="button" onClick={() => setBadgeModalKey(member.key)} className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer">
                              <FileTextIcon className="size-3" /> Visualiser
                            </button>
                          </td>
                          <td className={tdCls}>
                            <button type="button" onClick={() => void handleDirectBadgeDownload(member.key)} disabled={isDl} className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors cursor-pointer">
                              {isDl ? <><Spinner />Génération…</> : <><DownloadIcon className="size-3" />Télécharger</>}
                            </button>
                          </td>
                          <td className={tdCls}>
                            <button
                              type="button"
                              onClick={() => void handleDeleteBadge(member)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <Trash2Icon className="size-3" />
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {badgeMembers.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">Aucun membre avec badge.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ? Scorers ? */}
          {activeSection === "scorers" && (
            <div className={cardCls}>
              <div className="border-b border-gray-200 px-5 py-4"><p className="font-semibold text-gray-900">Meilleurs Buteurs</p></div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead><tr><th className={thCls}>Rang</th><th className={thCls}>Joueur</th><th className={thCls}>Équipe</th><th className={thCls}>Position</th><th className={thCls}>Buts</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(tournament?.topScorers ?? []).map((scorer, idx) => (
                      <tr key={scorer.playerId} className="hover:bg-gray-50">
                        <td className={tdCls}>{idx === 0 ? <span className="font-bold text-yellow-500">1</span> : idx === 1 ? <span className="font-bold text-gray-400">2</span> : idx === 2 ? <span className="font-bold text-amber-600">3</span> : <span className="text-gray-400">{idx + 1}</span>}</td>
                        <td className={`${tdCls} font-medium text-gray-900`}>{scorer.fullName}</td>
                        <td className={tdCls}>{scorer.teamName}</td>
                        <td className={tdCls}><span className="rounded px-1.5 py-0.5 bg-gray-100 text-xs text-gray-600">{scorer.position}</span></td>
                        <td className={tdCls}><span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-bold text-green-700">{scorer.goals}</span></td>
                      </tr>
                    ))}
                    {(tournament?.topScorers ?? []).length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Aucun buteur enregistré.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

