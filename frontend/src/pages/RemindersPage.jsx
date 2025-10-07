import { motion } from 'framer-motion';
import { Bell, Calendar, Clock, Filter } from 'lucide-react';
import useDoseStore from '../hooks/useDoseStore';
import { Sidebar } from '../components/Sidebar';
import { DoseCard } from '../components/DoseCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useState } from 'react';

export function RemindersPage() {
  const { doses, upcomingDoses, markAsTaken, markAsSkipped, isLoading, fetchDoses } = useDoseStore();
  const [filter, setFilter] = useState('all');

  const handleTakeDose = async (id) => {
    try {
      await markAsTaken(id);
      toast.success('Potion consumed! The mystical energies flow through you. ✨');
    } catch (error) {
      toast.error('Failed to mark dose as taken');
    }
  };

  const handleSkipDose = async (id) => {
    try {
      await markAsSkipped(id, 'Skipped via Circus Crier');
      toast.warning('Dose skipped. The spirits understand, but consistency brings power. 🌙');
    } catch (error) {
      toast.error('Failed to skip dose');
    }
  };

  const handleSnooze = async (id) => {
    toast.info('Dose snoozed for 15 minutes. The crystal ball will remind you again. ⏰');
  };

  const getFilteredDoses = () => {
    switch (filter) {
      case 'pending':
        return doses.filter(d => d.status === 'pending');
      case 'taken':
        return doses.filter(d => d.status === 'taken');
      case 'missed':
        return doses.filter(d => d.status === 'missed');
      case 'skipped':
        return doses.filter(d => d.status === 'skipped');
      default:
        return doses;
    }
  };

  const filteredDoses = getFilteredDoses();

  const getStatusCount = (status) => doses.filter(d => d.status === status).length;

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
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-cinzel font-semibold text-foreground">Circus Crier</h1>
            </div>
            <p className="text-muted-foreground">
              Your mystical herald announces all wellness reminders
            </p>
          </motion.div>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['pending', 'taken', 'missed', 'skipped', 'total'].map((status, index) => (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
              >
                <Card className="magical-glow">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        status === 'pending'
                          ? 'text-blue-500'
                          : status === 'taken'
                          ? 'text-green-500'
                          : status === 'missed'
                          ? 'text-red-500'
                          : status === 'skipped'
                          ? 'text-yellow-500'
                          : 'text-foreground'
                      }`}>
                        {isLoading ? (
                          <Skeleton className="h-6 w-8 mx-auto" />
                        ) : status === 'total' ? doses.length : getStatusCount(status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Urgent Reminders */}
          {upcomingDoses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Card className="magical-glow border-yellow-500/50 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="font-cinzel text-yellow-600 dark:text-yellow-400 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Urgent Mystical Alerts</span>
                    <Badge variant="secondary" className="ml-auto">
                      {upcomingDoses.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    These potions require immediate attention
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingDoses.map(dose => (
                    <DoseCard
                      key={dose.id}
                      dose={dose}
                      onTake={handleTakeDose}
                      onSkip={handleSkipDose}
                      onSnooze={handleSnooze}
                    />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* All Reminders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <Card className="magical-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-cinzel">All Mystical Records</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete history of your wellness journey
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="taken">Taken</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                        <SelectItem value="skipped">Skipped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredDoses.length > 0 ? (
                    filteredDoses.map(dose => (
                      <DoseCard
                        key={dose.id}
                        dose={dose}
                        onTake={handleTakeDose}
                        onSkip={handleSkipDose}
                        onSnooze={handleSnooze}
                        showActions={dose.status === 'pending'}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No reminders found for the selected filter</p>
                      <p className="text-sm">
                        {filter === 'all'
                          ? 'Your wellness journey awaits!'
                          : `No ${filter} doses to display.`}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
