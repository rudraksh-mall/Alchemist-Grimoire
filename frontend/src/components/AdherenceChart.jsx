import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const COLORS = {
  taken: '#10b981',
  missed: '#ef4444',
  skipped: '#f59e0b'
};

export function AdherenceChart({ stats }) {
  const pieData = [
    { name: 'Taken', value: stats.takenDoses, color: COLORS.taken },
    { name: 'Missed', value: stats.missedDoses, color: COLORS.missed },
    { name: 'Skipped', value: stats.skippedDoses, color: COLORS.skipped }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-card-foreground font-medium">{data.name}</p>
          <p className="text-muted-foreground text-sm">
            {data.value} doses ({((data.value / stats.totalDoses) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const LineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-card-foreground font-medium">{label}</p>
          <p className="text-muted-foreground text-sm">
            Adherence: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Adherence Crystal (Pie Chart) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="magical-glow">
          <CardHeader className="text-center">
            <CardTitle className="font-cinzel">Wellness Crystal</CardTitle>
            <div className="text-center">
              <div className="text-3xl font-bold crystal-gradient bg-clip-text text-transparent">
                {stats.adherenceRate}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Adherence</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="magical-glow">
          <CardHeader>
            <CardTitle className="font-cinzel">Mystical Trends</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your wellness journey over time
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="week" 
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
