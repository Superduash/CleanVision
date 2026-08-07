import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  Send,
  QrCode,
  MapPin,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useHospitalConfig } from "@/hooks/useHospitalConfig";
import { api, RoomLookup } from "@/lib/api";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

const ISSUE_CHIPS = [
  "Wet Floor & Water Spill",
  "Trash Bin Overflowing",
  "Soap Dispenser Empty",
  "Paper Towel Empty",
  "Dirty Toilet / Unsanitized",
  "Odour Issue / Ventilation",
];

const COOLDOWN_KEY = "cleanvision.report_cooldown";

export function PublicReportPage() {
  const { roomCode: paramCode } = useParams<{ roomCode?: string }>();
  const { config } = useHospitalConfig();

  const [activeCode, setActiveCode] = useState<string>(paramCode || "");
  const [roomLookup, setRoomLookup] = useState<RoomLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");

  const [selectedIssue, setSelectedIssue] = useState<string>(ISSUE_CHIPS[0]);
  const [comment, setComment] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const showDemoSimulator = import.meta.env.VITE_SHOW_QR_SIMULATOR === "true";

  // Fetch public room lookup for active room code
  useEffect(() => {
    if (!activeCode) {
      setRoomLookup(null);
      setLookupError(null);
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    api
      .getRoomLookup(activeCode)
      .then((res) => {
        if (res?.roomLookup) {
          setRoomLookup(res.roomLookup);
          setLookupError(null);
        } else {
          setRoomLookup(null);
          setLookupError(`Room "${activeCode}" is not registered in the system.`);
        }
      })
      .catch(() => {
        setRoomLookup(null);
        setLookupError(`Room code "${activeCode}" not found. Please scan a valid door QR code or contact facility administration.`);
      })
      .finally(() => {
        setLookupLoading(false);
      });
  }, [activeCode]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check 60s soft cooldown
    const lastSub = localStorage.getItem(COOLDOWN_KEY);
    if (lastSub && Date.now() - Number(lastSub) < 60_000) {
      const remainingSec = Math.ceil((60_000 - (Date.now() - Number(lastSub))) / 1000);
      toast.error(`Please wait ${remainingSec}s before submitting another report.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.submitIssueReport({
        roomCode: activeCode,
        issueType: selectedIssue,
        comment,
        photo: photoFile || undefined,
      });

      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      setSubmitted(true);
      toast.success("Alert dispatched to on-duty staff!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center pb-16 min-h-[calc(100vh-4rem)]">

      {/* QR Simulator trigger — shown in content if enabled */}
      {showDemoSimulator && (
        <div className="w-full max-w-xl px-4 pt-4">
          <button
            onClick={() => setShowSimulator(true)}
            className="flex items-center gap-1.5 rounded-xl border border-warning/40 bg-warning-bg px-3 py-1.5 text-xs font-semibold text-warning hover:bg-warning/20 transition-colors"
            title="Simulate Door QR Scan"
          >
            <QrCode className="h-3.5 w-3.5" />
            Simulate QR Scan
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-xl px-4 py-6 sm:py-8 space-y-6 page-enter">
        {/* Room Lookup / Verification State */}
        {!activeCode ? (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-raised space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <QrCode className="h-5 w-5" /> Enter Facility Room Code
            </div>
            <p className="text-xs text-text-muted">
              Scan the QR code posted on the room entrance door, or enter the unique Room Code below to report a cleanliness issue.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputCode.trim()) setActiveCode(inputCode.trim().toUpperCase());
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="e.g. CGH-A-101-A"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-mono text-text-primary uppercase outline-none focus:border-primary"
              />
              <Button type="submit" size="md">Look Up Room</Button>
            </form>
          </div>
        ) : lookupLoading ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
            <p className="text-xs font-semibold text-text-muted">Verifying room code with facility database...</p>
          </div>
        ) : lookupError ? (
          <div className="rounded-2xl border border-danger/30 bg-danger-bg/30 p-6 text-center shadow-sm space-y-3">
            <AlertTriangle className="h-8 w-8 text-danger mx-auto" />
            <h3 className="text-base font-bold text-text-primary">Unregistered Room Code</h3>
            <p className="text-xs text-text-muted">{lookupError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setActiveCode("");
                setInputCode("");
              }}
            >
              Enter a Different Room Code
            </Button>
          </div>
        ) : roomLookup ? (
          /* Verified Room Location Banner */
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-surface to-accent/5 p-5 shadow-card relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  Verified Facility Location
                </div>
                <h2 className="mt-1 text-xl font-bold text-text-primary">
                  Room {roomLookup.roomNumber || roomLookup.roomCode}
                </h2>
                <p className="mt-0.5 text-sm text-text-muted">
                  {roomLookup.block} · {roomLookup.floor} · {roomLookup.hospitalName}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-3 py-1.5 text-center shadow-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled">Room Code</span>
                <span className="font-mono text-xs font-bold text-primary">{roomLookup.roomCode}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Submitted Confirmation or Report Form — Only for valid registered rooms */}
        {roomLookup && (
          submitted ? (
            <div className="rounded-2xl border border-success/30 bg-surface p-8 text-center shadow-raised space-y-4 animate-scale-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-bg text-success shadow-sm">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary">Alert Sent Successfully</h3>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                On-duty cleaning staff assigned to <strong>{roomLookup.block}</strong> have been notified. Thank you for keeping our facility clean and safe.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSubmitted(false);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setComment("");
                  }}
                >
                  Report Another Issue
                </Button>
              </div>
            </div>
          ) : (
            /* Report Form */
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Type Chips */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-text-primary">
                Select Issue Type <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ISSUE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSelectedIssue(chip)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3.5 text-left text-sm font-medium transition-all shadow-sm",
                      selectedIssue === chip
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-focus"
                        : "border-border bg-surface text-text-primary hover:border-primary/50"
                    )}
                  >
                    <span>{chip}</span>
                    {selectedIssue === chip && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Capture */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">
                Add Photo <span className="text-xs font-normal text-text-muted">(Optional)</span>
              </label>
              {photoPreview ? (
                <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border bg-black">
                  <img src={photoPreview} alt="Captured issue" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface hover:border-primary transition-colors">
                  <Camera className="h-6 w-6 text-primary" />
                  <span className="mt-2 text-xs font-medium text-text-primary">Take Photo or Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />
                </label>
              )}
            </div>

            {/* Optional Comment */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-primary">
                Additional Comments <span className="text-xs font-normal text-text-muted">(Optional)</span>
              </label>
              <textarea
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:shadow-focus h-24 resize-none"
                placeholder="e.g. Near the sink in room 2204..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Submit Action */}
            <Button
              type="submit"
              size="lg"
              className="w-full py-4 text-base font-bold shadow-raised gap-2"
              isLoading={submitting}
            >
              <Send className="h-5 w-5" /> Send Alert to On-Duty Worker
            </Button>
          </form>
        ))}
      </main>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-text-muted px-4 space-y-1">
        <p>Alerts are immediately dispatched to staff assigned to {roomLookup?.block || "this block"}.</p>
        <p className="text-[11px] text-text-disabled">CleanVision Facility QA System · {config.hospitalName}</p>
      </footer>

      {/* Door QR Scanner Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowSimulator(false)} />
          <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border bg-surface p-6 shadow-raised space-y-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <QrCode className="h-5 w-5 text-warning" /> Door QR Code Simulator
            </h3>
            <p className="text-xs text-text-muted">
              Select a hospital door QR code to simulate scanning it on a mobile phone.
            </p>
            <div className="space-y-2">
              {[
                { code: `${config.hospitalCode}-A-101-A`, label: "Block A · Emergency Ward 101" },
                { code: `${config.hospitalCode}-B-2204-B1`, label: "Block B · ICU Ward 2204" },
                { code: `${config.hospitalCode}-C-302-C`, label: "Block C · General Surgery 302" },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setActiveCode(item.code);
                    setShowSimulator(false);
                    toast.info(`Scanned QR Code: ${item.code}`);
                  }}
                  className="w-full rounded-xl border border-border p-3 text-left hover:border-primary hover:bg-highlight transition-all"
                >
                  <p className="font-mono text-xs font-bold text-primary">{item.code}</p>
                  <p className="text-xs text-text-muted">{item.label}</p>
                </button>
              ))}
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setShowSimulator(false)}>
              Close Simulator
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
