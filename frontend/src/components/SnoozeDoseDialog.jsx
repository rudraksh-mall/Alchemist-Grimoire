// src/components/SnoozeDoseDialog.jsx (or similar path)
import { useState } from "react";
import { Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog"; // Assuming you have shadcn-ui components
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string | null} props.doseId - The ID of the dose to snooze
 * @param {function} props.onClose - Function to close the dialog
 * @param {function(string, number): void} props.onSnoozeConfirmed - Function to call on confirm (doseId, duration)
 */
export function SnoozeDoseDialog({
  isOpen,
  doseId,
  onClose,
  onSnoozeConfirmed,
}) {
  // Default to 30 minutes
  const [duration, setDuration] = useState("30");

  const snoozeOptions = [5, 10, 15, 20, 30, 45, 60];

  const handleConfirm = () => {
    // 🎯 FIX: Explicitly check that doseId is a non-empty string/valid value
    if (!doseId) {
      console.error("Cannot snooze: Dose ID is missing.");
      onClose(); // Close the dialog if we can't proceed
      return;
    }

    if (duration) {
      // Pass the doseId and duration (converted to number) back to the parent
      onSnoozeConfirmed(doseId, Number(duration));
      // Reset state for next use
      setDuration("30");
    }
  };

  const handleClose = () => {
    // Reset state when closing the dialog
    setDuration("30");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-cinzel flex items-center">
            <Timer className="w-5 h-5 mr-2 text-primary" />
            Snooze Potion Reminder
          </DialogTitle>
          <DialogDescription>
            Select how long you'd like to delay the reminder for this dose.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="snooze-duration" className="text-right col-span-1">
              Duration
            </Label>
            <div className="col-span-3">
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="snooze-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {snoozeOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt} Minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleConfirm}
            disabled={!duration}
            className="w-full magical-glow"
          >
            Snooze for {duration} Minutes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
