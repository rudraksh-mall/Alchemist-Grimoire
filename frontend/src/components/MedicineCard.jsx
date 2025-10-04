import { motion } from 'framer-motion';
import { Clock, Calendar, Pill, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function MedicineCard({ medicine, onEdit, onDelete, showActions = true }) {
  const handleEdit = () => {
    if (onEdit) onEdit(medicine);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(medicine.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="magical-glow hover:shadow-lg transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: medicine.color }}
              />
              <div>
                <h3 className="font-cinzel font-medium text-card-foreground">
                  {medicine.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {medicine.dosage}
                </p>
              </div>
            </div>
            {showActions && (
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{medicine.frequency}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <div className="flex flex-wrap gap-1">
              {medicine.times.map((time, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs px-2 py-1"
                >
                  {time}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Pill className="w-4 h-4" />
            <span>Started {new Date(medicine.startDate).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
