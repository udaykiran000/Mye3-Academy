import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux'; 
import { fetchPerformanceHistory, fetchPublicMockTests } from '../../redux/studentSlice'; 
import {
  BookOpen,
  CheckCircle,
  TrendingUp,
  Clock,
  Calendar,
  AlertCircle,
  Trophy
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { StatCard, ChartCard } from '../../components/student/DashboardUIKIt';
import GrandTestRankers from '../../components/student/GrandTestRankers';

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        <p className="text-indigo-600 font-semibold">
          Score: {payload[0].value}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          {payload[0].payload.date}
        </p>
      </div>
    );
  }
  return null;
};

const DashboardOverview = () => {
  const dispatch = useDispatch();
  
  // ✅ 1. Get Data from Redux
  const { userData } = useSelector((state) => state.user);
  const { 
    attemptsHistory, 
    attemptsHistoryStatus, 
    publicMocktests, 
    publicStatus    
  } = useSelector((state) => state.students);
  
  // ✅ 2. Fetch Data on Mount
  useEffect(() => {
    // Always fetch latest public tests to check for upcoming grand tests
    dispatch(fetchPublicMockTests());

    // Fetch history if not loaded
    if (attemptsHistoryStatus === 'idle') {
        dispatch(fetchPerformanceHistory());
    }
  }, [dispatch, attemptsHistoryStatus]);

  const myTests = userData?.purchasedTests || [];
  const myAttempts = attemptsHistory.length > 0 ? attemptsHistory : (userData?.attempts || []);

  // Stats Calculation
  const avgScore = myAttempts.length > 0
    ? (myAttempts.reduce((acc, attempt) => acc + (attempt.score || 0), 0) / myAttempts.length).toFixed(0)
    : 0;

  // Chart Data Preparation
  const realScoreData = useMemo(() => {
    if (!myAttempts || myAttempts.length === 0) return [];
    return myAttempts
      .filter(a => a.status === 'completed' || a.status === 'finished' || !a.status)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((attempt) => {
        const title = attempt.mocktestId?.title || "Test";
        const shortName = title.length > 15 ? title.substring(0, 12) + '...' : title;
        return {
            name: shortName, 
            fullName: title, 
            score: attempt.score || 0, 
            date: new Date(attempt.createdAt).toLocaleDateString() 
        };
      });
  }, [myAttempts]);

  // =================================================================================
  // ⭐ FINDS LATEST GLOBAL GRAND TEST ID THAT IS COMPLETED/PAST 
  // =================================================================================
  const latestGrandTestIdForRankers = useMemo(() => {
    if (!publicMocktests || publicMocktests.length === 0) return null;

    const now = new Date();

    // 1. Filter for all Grand Tests that are in the past
    const completedGrandTests = publicMocktests.filter(test => {
        const isGrand = test.isGrandTest === true || test.title?.toLowerCase().includes("grand");
        if (!isGrand) return false;

        const scheduledTime = new Date(test.scheduledFor || test.availableFrom);
        
        // Only include tests whose scheduled time has passed
        return scheduledTime < now;
    });

    if (completedGrandTests.length === 0) return null;

    // 2. Sort by scheduled date descending to find the latest completed event
    const latestCompletedTest = completedGrandTests.sort((a, b) => {
        const dateA = new Date(a.scheduledFor || a.availableFrom);
        const dateB = new Date(b.scheduledFor || b.availableFrom);
        
        // Sort descending (latest date first)
        return dateB.getTime() - dateA.getTime();
    })[0];

    // 3. Return the ID and title of the latest completed test
    const scheduledTime = new Date(latestCompletedTest.scheduledFor || latestCompletedTest.availableFrom);

    return {
        id: latestCompletedTest._id,
        title: latestCompletedTest.title,
        date: scheduledTime,
        isCompletedGlobally: true,
    };

  }, [publicMocktests]);
// =================================================================================

  // =================================================================================
  // UPCOMING GRAND TEST LOGIC (FINDS LATEST FUTURE TEST)
  // =================================================================================
  const upcomingGrandTest = useMemo(() => {
    if (!publicMocktests || publicMocktests.length === 0) return null;

    const now = new Date();

    const upcoming = publicMocktests.filter(test => {
        // 1. Check if Grand Test
        const isGrand = test.isGrandTest === true || test.title?.toLowerCase().includes("grand");
        
        // 2. Determine Event Date (Prefer scheduledFor, fallback to availableFrom)
        const scheduledDate = test.scheduledFor ? new Date(test.scheduledFor) : null;
        const availableDate = test.availableFrom ? new Date(test.availableFrom) : null;
        const targetDate = scheduledDate || availableDate;

        // 3. Strict Future Check
        const isFuture = targetDate && targetDate > now;

        return isGrand && isFuture;
    });

    // Sort: Nearest date first
    const sorted = upcoming.sort((a, b) => {
        const dateA = new Date(a.scheduledFor || a.availableFrom);
        const dateB = new Date(b.scheduledFor || b.availableFrom);
        return dateA - dateB;
    });

    return sorted[0] || null;
  }, [publicMocktests]);
// =================================================================================

  // Helper date formatter
  const formatDate = (dateString) => {
    if(!dateString) return "";
    return new Date(dateString).toLocaleString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 animate-fade-in">
      
      {/* 🟢 UPCOMING GRAND TEST BANNER */}
      {upcomingGrandTest && (
         <div className="bg-gradient-to-r from-indigo-900 to-purple-800 rounded-2xl shadow-xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-indigo-700/50">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex items-start gap-5 z-10">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                    <Calendar className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-500 text-yellow-950 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                            Coming Soon
                        </span>
                        <span className="text-indigo-200 text-xs font-medium flex items-center gap-1">
                            <AlertCircle size={12}/> Mark your calendar
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{upcomingGrandTest.title}</h3>
                    <p className="text-indigo-200 mt-1 text-sm">
                        Scheduled for: <span className="font-bold text-white ml-1 text-lg">{formatDate(upcomingGrandTest.scheduledFor || upcomingGrandTest.availableFrom)}</span>
                    </p>
                </div>
            </div>
         </div>
      )}

      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<BookOpen className="text-blue-500" />}
          title="Tests Enrolled"
          value={myTests.length}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="text-green-500" />}
          title="Tests Completed"
          value={myAttempts.length}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="text-indigo-500" />}
          title="Average Score"
          value={`${avgScore}`} 
          color="indigo"
        />
      </div>

      {/* 🏆 LATEST GRAND TEST RESULT */}
      <section className="mb-2">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-gray-800 border-l-4 border-yellow-500 pl-3 flex items-center gap-2">
                🏆 Latest Grand Test Result
             </h2>
             {latestGrandTestIdForRankers && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Most Recent Event
                </span>
             )}
          </div>
          <div className="w-full">
            {latestGrandTestIdForRankers ? (
              <GrandTestRankers 
                key={latestGrandTestIdForRankers.id} 
                mockTestId={latestGrandTestIdForRankers.id} 
                testTitle={latestGrandTestIdForRankers.title} 
              />
            ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-48 text-gray-500">
                    <Trophy className="w-10 h-10 mb-2 opacity-50" />
                    <p>No completed Grand Tests found to display ranks.</p>
                </div>
            )}
          </div>
        </section>
      
      {/* 📈 REAL SCORE CHART */}
      <div className="w-full">
        <ChartCard title="Mock Test Performance">
          {realScoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    tick={{fontSize: 12}}
                    interval="preserveStartEnd"
                />
                <YAxis stroke="#9ca3af" unit="" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Score"
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                <Clock className="w-12 h-12 mb-2 opacity-50" />
                <p>No mock test attempts yet.</p>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardOverview;