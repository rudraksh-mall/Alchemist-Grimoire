import { motion } from 'framer-motion';
import { Clock, Check, X, Pause, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function DoseCard({ dose, onTake, onSkip, onSnooze, showActions = true }) {
  const getStatusIcon = () => {
    switch (dose.status) {
      case 'taken':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'missed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <X className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (dose.status) {
      case 'taken':
        return 'bg-green-500/10 border-green-500/20';
      case 'missed':
        return 'bg-red-500/10 border-red-500/20';
      case 'skipped':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timeString) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card className={`transition-all duration-300 ${getStatusColor()}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-medium text-card-foreground">
                  {dose.medicineName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {dose.dosage}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {dose.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(dose.scheduledTime)}</span>
              </div>
              <span>•</span>
              <span>{formatDate(dose.scheduledTime)}</span>
            </div>
          </div>

          {dose.actualTime && (
            <div className="text-xs text-muted-foreground mb-3">
              Taken at {formatTime(dose.actualTime)}
            </div>
          )}

          {dose.notes && (
            <div className="text-xs text-muted-foreground mb-3 italic">
              Note: {dose.notes}
            </div>
          )}

          {showActions && dose.status === 'pending' && (
            <div className="flex space-x-2 pt-2 border-t border-border/50">
              <Button
                size="sm"
                className="flex-1 h-8 magical-glow"
                onClick={() => onTake?.(dose.id)}
              >
                <Check className="w-3 h-3 mr-1" />
                Take
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => onSnooze?.(dose.id)}
              >
                <Pause className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onSkip?.(dose.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
