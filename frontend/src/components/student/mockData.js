// --- MOCK DATA ---
// You will replace these with data from your Redux store or API calls.

export const mockUser = {
  name: 'Vani',
  email: 'vani@example.com',
  avatar: `https://api.dicebear.com/8.x/avataaars/svg?seed=vani`
};

// Represents tests the student is enrolled in
export const mockMyTests = [
  {
    _id: '1',
    title: 'SSC CGL Tier 1 Full Mock',
    category: 'SSC',
    questions: 100,
    duration: 60,
    price: 199,
    imageUrl: '/src/assets/ssc.png' // Use assets from your project
  },
  {
    _id: '2',
    title: 'Railway NTPC Stage 2',
    category: 'Railways',
    questions: 120,
    duration: 90,
    price: 0, // Free test
    imageUrl: '/src/assets/rail.png'
  },
  {
    _id: '3',
    title: 'UGC NET Paper 1 Analysis',
    category: 'Teaching',
    questions: 50,
    duration: 60,
    price: 249,
    imageUrl: '/src/assets/ugc.png'
  },
  {
    _id: '4',
    title: 'FCI AG-III Mock Test',
    category: 'FCI',
    questions: 100,
    duration: 60,
    price: 149,
    imageUrl: '/src/assets/fci.png'
  }
];

// Represents past test attempts by the student
export const mockAttempts = [
  {
    _id: 'a1',
    testId: '1',
    testName: 'SSC CGL Tier 1 Full Mock',
    date: '2025-11-10T10:30:00Z',
    score: 130,
    totalMarks: 200,
    percentile: 88,
    category: 'SSC'
  },
  {
    _id: 'a2',
    testId: '3',
    testName: 'UGC NET Paper 1 Analysis',
    date: '2025-11-12T14:00:00Z',
    score: 68,
    totalMarks: 100,
    percentile: 75,
    category: 'Teaching'
  },
    {
    _id: 'a3',
    testId: '1',
    testName: 'SSC CGL Tier 1 Full Mock',
    date: '2025-11-14T09:00:00Z',
    score: 142,
    totalMarks: 200,
    percentile: 92,
    category: 'SSC'
  }
];

// --- END MOCK DATA ---


// --- DERIVED DATA & HELPERS ---

export const scoreHistoryData = mockAttempts.map(att => ({
  name: new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  score: (att.score / att.totalMarks) * 100
}));

export const categoryPerformanceData = [
  { name: 'SSC', value: (136 / 200) * 100 }, // Average of 130 and 142
  { name: 'Teaching', value: (68 / 100) * 100 },
  { name: 'Railways', value: 0 }, // Not attempted
];

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const getAverageScore = () => {
  if (mockAttempts.length === 0) return 'N/A';
  const total = mockAttempts.reduce((acc, att) => acc + (att.score / att.totalMarks) * 100, 0);
  return (total / mockAttempts.length).toFixed(2) + '%';
};