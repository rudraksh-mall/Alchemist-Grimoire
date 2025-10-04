// Mock API service for Alchemist's Grand Grimoire
// In production, replace with actual API endpoints

// Mock data
const mockMedicines = [
  {
    id: '1',
    name: 'Elixir of Energy',
    dosage: '10ml',
    frequency: 'twice daily',
    times: ['08:00', '20:00'],
    startDate: '2024-01-01',
    color: '#7c3aed'
  },
  {
    id: '2',
    name: 'Potion of Calm',
    dosage: '5mg',
    frequency: 'as needed',
    times: ['12:00'],
    startDate: '2024-01-01',
    color: '#10b981'
  },
  {
    id: '3',
    name: 'Crystal Clarity Pills',
    dosage: '25mg',
    frequency: 'daily',
    times: ['09:00'],
    startDate: '2024-01-01',
    color: '#f59e0b'
  }
];

const mockDoses = [
  {
    id: '1',
    medicineId: '1',
    medicineName: 'Elixir of Energy',
    dosage: '10ml',
    scheduledTime: '2024-01-15T08:00:00Z',
    actualTime: '2024-01-15T08:05:00Z',
    status: 'taken'
  },
  {
    id: '2',
    medicineId: '1',
    medicineName: 'Elixir of Energy',
    dosage: '10ml',
    scheduledTime: '2024-01-15T20:00:00Z',
    status: 'pending'
  },
  {
    id: '3',
    medicineId: '3',
    medicineName: 'Crystal Clarity Pills',
    dosage: '25mg',
    scheduledTime: '2024-01-15T09:00:00Z',
    status: 'missed'
  }
];

const mockAdherenceStats = {
  totalDoses: 100,
  takenDoses: 85,
  missedDoses: 10,
  skippedDoses: 5,
  adherenceRate: 85,
  weeklyTrend: [
    { week: 'Week 1', rate: 82 },
    { week: 'Week 2', rate: 88 },
    { week: 'Week 3', rate: 85 },
    { week: 'Week 4', rate: 90 }
  ]
};

// API Functions

export const medicineApi = {
  // GET /api/medicines
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return mockMedicines;
  },

  // GET /api/medicines/:id
  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMedicines.find(m => m.id === id) || null;
  },

  // POST /api/medicines
  create: async (medicine) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newMedicine = { ...medicine, id: Date.now().toString() };
    mockMedicines.push(newMedicine);
    return newMedicine;
  },

  // PUT /api/medicines/:id
  update: async (id, medicine) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockMedicines.findIndex(m => m.id === id);
    if (index !== -1) {
      mockMedicines[index] = { ...mockMedicines[index], ...medicine };
      return mockMedicines[index];
    }
    throw new Error('Medicine not found');
  },

  // DELETE /api/medicines/:id
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockMedicines.findIndex(m => m.id === id);
    if (index !== -1) {
      mockMedicines.splice(index, 1);
    }
  }
};

export const doseApi = {
  // GET /api/doses
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockDoses;
  },

  // GET /api/doses/upcoming
  getUpcoming: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDoses.filter(d => d.status === 'pending');
  },

  // POST /api/doses/:id/take
  markAsTaken: async (id, actualTime) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const dose = mockDoses.find(d => d.id === id);
    if (dose) {
      dose.status = 'taken';
      dose.actualTime = actualTime || new Date().toISOString();
      return dose;
    }
    throw new Error('Dose not found');
  },

  // POST /api/doses/:id/skip
  markAsSkipped: async (id, notes) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const dose = mockDoses.find(d => d.id === id);
    if (dose) {
      dose.status = 'skipped';
      dose.notes = notes;
      return dose;
    }
    throw new Error('Dose not found');
  }
};

export const statsApi = {
  // GET /api/stats/adherence
  getAdherence: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockAdherenceStats;
  }
};

export const chatApi = {
  // POST /api/chat/ask
  sendMessage: async (message) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simple mock responses based on keywords
    let response = "I sense great wisdom in your question, seeker. Let me consult the mystical scrolls...";
    
    if (message.toLowerCase().includes('today') || message.toLowerCase().includes('pills')) {
      response = "🔮 Today's potions include: Elixir of Energy at 8:00 AM and 8:00 PM, and Crystal Clarity Pills at 9:00 AM. The spirits whisper that you've already taken your morning elixir!";
    } else if (message.toLowerCase().includes('missed') || message.toLowerCase().includes('yesterday')) {
      response = "⚡ The crystal ball reveals you missed Crystal Clarity Pills yesterday at 9:00 AM. But fear not! Your overall adherence remains strong at 85%.";
    } else if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('when')) {
      response = "📜 Your mystical schedule shows 3 active potions. Next dose: Elixir of Energy tonight at 8:00 PM. The stars align favorably for your wellness journey!";
    }

    return {
      id: Date.now().toString(),
      message: response,
      isUser: false,
      timestamp: new Date().toISOString()
    };
  }
};

export const authApi = {
  // POST /api/auth/login
  login: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === 'demo@alchemist.com' && password === 'demo123') {
      return {
        token: 'mock-jwt-token',
        user: { id: '1', email, name: 'Mystical Alchemist' }
      };
    }
    throw new Error('Invalid credentials');
  },

  // POST /api/auth/register
  register: async (email, password, name) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      token: 'mock-jwt-token',
      user: { id: Date.now().toString(), email, name }
    };
  },

  // POST /api/auth/google
  googleAuth: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      token: 'mock-google-jwt-token',
      user: { id: 'google-1', email: 'google@example.com', name: 'Google User' }
    };
  }
};
