import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export function ResumeReadingDialog({
  open,
  page,
  totalPages,
  onContinue,
  onStartOver,
}: {
  open: boolean;
  page: number;
  totalPages: number | null;
  onContinue: () => void;
  onStartOver: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onContinue}
      title="Continue reading?"
      description={`You left off on page ${page}${totalPages ? ` of ${totalPages}` : ""}.`}
      hideCloseButton
    >
      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onStartOver}>
          Start from beginning
        </Button>
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </Dialog>
  );
}
