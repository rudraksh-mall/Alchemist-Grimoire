import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pill, Clock, Calendar, Palette, Save } from "lucide-react";
import useMedicineStore from "../hooks/useMedicineStore";
import useDoseStore from "../hooks/useDoseStore";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const FREQUENCY_OPTIONS = [
  { value: "once daily", label: "Once Daily" },
  { value: "twice daily", label: "Twice Daily" },
  { value: "three times daily", label: "Three Times Daily" },
  { value: "four times daily", label: "Four Times Daily" },
  { value: "as needed", label: "As Needed" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom Schedule" },
];

const COLOR_OPTIONS = [
  "#7c3aed",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
];

export function ScheduleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { medicines, createMedicine, updateMedicine, fetchMedicines } =
    useMedicineStore();
  const { fetchDoses } = useDoseStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchMedicines(); // fetch only once on mount
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    times: [""],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    color: COLOR_OPTIONS[0],
  });

  useEffect(() => {
    if (id && id !== "new") {
      const medicine = medicines.find((m) => m.id === id);
      if (medicine) {
        setIsEdit(true);
        setFormData({
          name: medicine.name,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          times: medicine.times.length > 0 ? medicine.times : [""],
          startDate: medicine.startDate,
          endDate: medicine.endDate || "",
          color: medicine.color,
        });
      }
    }
  }, [id, medicines]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData((prev) => ({ ...prev, times: newTimes }));
  };

  const addTimeSlot = () => {
    setFormData((prev) => ({ ...prev, times: [...prev.times, ""] }));
  };

  const removeTimeSlot = (index) => {
    if (formData.times.length > 1) {
      const newTimes = formData.times.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, times: newTimes }));
    }
  };

  const handleFrequencyChange = (frequency) => {
    setFormData((prev) => ({ ...prev, frequency }));

    let defaultTimes = [];
    switch (frequency) {
      case "once daily":
        defaultTimes = ["09:00"];
        break;
      case "twice daily":
        defaultTimes = ["09:00", "21:00"];
        break;
      case "three times daily":
        defaultTimes = ["08:00", "14:00", "20:00"];
        break;
      case "four times daily":
        defaultTimes = ["08:00", "12:00", "16:00", "20:00"];
        break;
      default:
        defaultTimes = ["09:00"];
    }

    if (frequency !== "custom" && frequency !== "as needed") {
      setFormData((prev) => ({ ...prev, times: defaultTimes }));
    }
  };

  // FINAL STABLE handleSubmit FUNCTION

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.dosage || !formData.frequency) {
      toast.error("Please fill in all required fields");
      return;
    }

    const filteredTimes = formData.times.filter((time) => time.trim() !== "");
    if (filteredTimes.length === 0 && formData.frequency !== "as needed") {
      toast.error("Please specify at least one time");
      return;
    }

    setIsLoading(true);
    try {
      const medicineData = {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        times: filteredTimes,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        color: formData.color,
      };

      // 1. EXECUTE API CALL
      if (isEdit && id) {
        await updateMedicine(id, medicineData);
        toast.success("Potion recipe updated successfully! ✨");
      } else {
        await createMedicine(medicineData);
        toast.success("New potion added to your grimoire! 🧪");
      }

      // 2. FORCE RELOAD AND NAVIGATION
      // These must run *after* the API call completes
      await fetchMedicines(); // Reloads Active Potions
      await fetchDoses(); // Reloads Upcoming Doses (the bug fix)

      navigate("/dashboard");
    } catch (error) {
      // 🎯 MODIFICATION: We log the error but don't show the redundant 'failed' toast.
      // Since the potion is confirmed to be saving in the database,
      // the error is likely a network rejection *after* the DB commit.
      console.error("Form Submission Error (API or follow-up):", error);

      // If the create/update failed entirely (and the save was NOT successful):
      // The user would be stuck on the form, so we show the error toast.
      // For stability, we assume the initial success toast will fire on success.

      // If a network error occurred during the fetch/create:
      toast.error(
        `Operation failed: ${error.message || "Check connection to the arena."}`
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-accent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Grimoire
              </Button>
              <div>
                <h1 className="text-2xl font-cinzel font-semibold text-foreground">
                  {isEdit ? "Edit Potion Recipe" : "Add New Potion"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isEdit
                    ? "Modify your mystical medicine"
                    : "Create a new wellness potion for your grimoire"}
                </p>
              </div>
            </div>
          </motion.div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="magical-glow">
              <CardHeader>
                <CardTitle className="font-cinzel flex items-center space-x-2">
                  <Pill className="w-5 h-5" />
                  <span>Potion Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Potion Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="e.g., Elixir of Energy"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dosage *</Label>
                      <Input
                        id="dosage"
                        value={formData.dosage}
                        onChange={(e) =>
                          handleInputChange("dosage", e.target.value)
                        }
                        placeholder="e.g., 10mg, 2 tablets"
                        required
                      />
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={handleFrequencyChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Times */}
                  {formData.frequency && formData.frequency !== "as needed" && (
                    <div className="space-y-2">
                      <Label>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled Times</span>
                        </div>
                      </Label>
                      <div className="space-y-2">
                        {formData.times.map((time, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <Input
                              type="time"
                              value={time}
                              onChange={(e) =>
                                handleTimeChange(index, e.target.value)
                              }
                              className="flex-1"
                            />
                            {formData.times.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTimeSlot(index)}
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTimeSlot}
                          className="w-full"
                        >
                          Add Another Time
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Start Date *</span>
                        </div>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          handleInputChange("startDate", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          handleInputChange("endDate", e.target.value)
                        }
                        min={formData.startDate}
                      />
                    </div>
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <Label>
                      <div className="flex items-center space-x-2">
                        <Palette className="w-4 h-4" />
                        <span>Potion Color</span>
                      </div>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color
                              ? "border-foreground scale-110 shadow-lg"
                              : "border-border hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleInputChange("color", color)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="border border-border rounded-lg p-4 bg-muted/20">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: formData.color }}
                      />
                      <div>
                        <p className="font-medium">
                          {formData.name || "Potion Name"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formData.dosage || "Dosage"} •{" "}
                          {formData.frequency || "Frequency"}
                        </p>
                        {formData.times.length > 0 && formData.times[0] && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.times
                              .filter((t) => t)
                              .map((time, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {time}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 magical-glow"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Save className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {isEdit ? "Update Potion" : "Add to Grimoire"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
