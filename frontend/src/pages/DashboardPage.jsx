import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, TrendingUp, Pill } from "lucide-react";
import useMedicineStore from "../hooks/useMedicineStore";
import useDoseStore from "../hooks/useDoseStore";
import { statsApi } from "../services/api";
import { Sidebar } from "../components/Sidebar";
import { MedicineCard } from "../components/MedicineCard";
import { DoseCard } from "../components/DoseCard";
import { AdherenceChart } from "../components/AdherenceChart";
import { ChatBot } from "../components/ChatBot";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SnoozeDoseDialog } from "../components/SnoozeDoseDialog"; // Adjust path as needed

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    medicines,
    isLoading: medicinesLoading,
    fetchMedicines,
    // 🎯 NEW: Destructure the delete action
    deleteMedicine,
  } = useMedicineStore();
  const {
    upcomingDoses,
    markAsTaken,
    markAsSkipped,
    // 🎯 NEW: Destructure the snooze action
    snoozeDose,
    isLoading: dosesLoading,
    fetchDoses,
  } = useDoseStore();
  const [adherenceStats, setAdherenceStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [snoozeTargetDoseId, setSnoozeTargetDoseId] = useState(null);
  // 🎯 FIX 1: Define fetchStats outside useEffect so it can be reused
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await statsApi.getAdherence();
      setAdherenceStats(stats);
    } catch (error) {
      toast.error("Failed to load adherence statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    fetchMedicines();
    fetchDoses();
    fetchStats(); // 🎯 Call for initial stats load
  }, []); // Empty dependency array means run once on mount

  // 🎯 FIX 2: Call fetchStats AND fetchDoses after marking a dose as complete
  const handleTakeDose = async (id) => {
    try {
      await markAsTaken(id);
      toast.success("Dose taken! Your wellness journey continues. ✨");
      fetchDoses(); // Refresh the upcoming doses list immediately
      fetchStats(); // Refresh stats immediately
    } catch (error) {
      toast.error("Failed to mark dose as taken");
    }
  };

  const handleSkipDose = async (id) => {
    try {
      await markAsSkipped(id, "Skipped via dashboard");
      toast.warning(
        "Dose skipped. Remember, consistency is key to your wellness. 🌙"
      );
      fetchDoses(); // Refresh the upcoming doses list immediately
      fetchStats(); // Refresh stats immediately
    } catch (error) {
      toast.error("Failed to skip dose");
    }
  };

  const handleOpenSnoozeDialog = (id) => {
    // Verify 'id' is a valid value here before setting state
    if (!id) {
      toast.error("Error: Dose information is incomplete.");
      return;
    }
    setSnoozeTargetDoseId(id); // Should set the ID from DoseCard
    setIsSnoozeDialogOpen(true);
  };

  // 🎯 NEW: Handler for snoozing a dose (e.g., for 30 minutes)
  const handleSnoozeDoseConfirmed = async (id, durationInMinutes) => {
    setIsSnoozeDialogOpen(false); // Close the dialog immediately
    setSnoozeTargetDoseId(null);
    try {
      // 🎯 KEY CHANGE: Use the dynamic duration
      await snoozeDose(id, durationInMinutes);
      toast.info(
        `Dose snoozed! We'll remind you in ${durationInMinutes} minutes.`
      );

      fetchDoses(); // Refresh the upcoming doses list
      // fetchStats(); // Stats won't change, but safe to refresh
    } catch (error) {
      toast.error("Failed to snooze dose.");
      console.error("Snooze failed:", error);
    }
  };
  const handleAddMedicine = () => {
    navigate("/schedule/new");
  };

  // 🎯 NEW: Handler for editing a medicine
  const handleEditMedicine = (medicineId) => {
    navigate(`/schedule/${medicineId}`);
  };

  // 🎯 NEW: Handler for deleting a medicine
  const handleDeleteMedicine = async (medicineId) => {
    // ⚠️ NOTE: window.confirm is bad practice. Replace with a custom modal in production.
    if (
      window.confirm(
        "Are you sure you want to banish this potion from your grimoire? This action cannot be undone."
      )
    ) {
      try {
        await deleteMedicine(medicineId);
        toast.success("Potion successfully banished!🧹");

        // Refresh dependent data
        fetchMedicines(); // Reloads the Active Potions list
        fetchDoses(); // Update upcoming doses
        fetchStats(); // Update adherence stats
      } catch (error) {
        toast.error("Failed to banish potion.");
        console.error("Deletion failed:", error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm p-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-cinzel font-semibold text-foreground">
                Wellness Crystal Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Your mystical wellness journey unfolds here
              </p>
            </motion.div>
          </header>

          <main className="flex-1 overflow-auto p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Active Potions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="magical-glow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Active Potions
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {medicinesLoading ? (
                            <Skeleton className="h-6 w-8" />
                          ) : (
                            medicines.length
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Today's Doses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="magical-glow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Today's Doses
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {dosesLoading ? (
                            <Skeleton className="h-6 w-8" />
                          ) : (
                            upcomingDoses.length
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Adherence Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="magical-glow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Adherence Rate
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {statsLoading ? (
                            <Skeleton className="h-6 w-12" />
                          ) : (
                            `${adherenceStats?.adherenceRate || 0}%`
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Add New Potion */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card className="magical-glow">
                  <CardContent className="p-4">
                    <Button
                      onClick={handleAddMedicine}
                      className="w-full h-full min-h-[4rem] magical-glow"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add New Potion
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Chart */}
            {adherenceStats && !statsLoading && (
              <AdherenceChart stats={adherenceStats} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Doses */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Card className="magical-glow">
                  <CardHeader>
                    <CardTitle className="font-cinzel">
                      Upcoming Mystical Doses
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your scheduled potions for today
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-auto">
                    {dosesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))
                    ) : upcomingDoses.length > 0 ? (
                      upcomingDoses.map((dose) => (
                        <DoseCard
                          key={dose.id}
                          dose={dose}
                          onTake={handleTakeDose}
                          onSkip={handleSkipDose} // 🛑 FIX HERE: Must pass the OPENER, not the CONFIRMER
                          onSnooze={handleOpenSnoozeDialog}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No upcoming doses for today</p>
                        <p className="text-sm">You're all caught up! ✨</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Active Medicines */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Card className="magical-glow">
                  <CardHeader>
                    <CardTitle className="font-cinzel">
                      Active Potions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your current medicine collection
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-auto">
                    {medicinesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))
                    ) : medicines.length > 0 ? (
                      medicines.map((medicine) => (
                        // 🎯 UPDATE: Pass edit and delete handlers
                        <MedicineCard
                          key={medicine.id}
                          medicine={medicine}
                          onEdit={handleEditMedicine}
                          onDelete={handleDeleteMedicine}
                          showActions={true} // Ensure actions are visible
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No active potions yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={handleAddMedicine}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Potion
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </main>
        </div>

        {/* ChatBot Sidebar */}
        <div className="hidden lg:block w-80 border-l border-border bg-card/30 backdrop-blur-sm">
          <div className="h-full p-4">
            <ChatBot />
          </div>
        </div>
      </div>
      <SnoozeDoseDialog
        isOpen={isSnoozeDialogOpen}
        doseId={snoozeTargetDoseId}
        onClose={() => setIsSnoozeDialogOpen(false)}
        onSnoozeConfirmed={handleSnoozeDoseConfirmed}
      />
    </div>
  );
}
