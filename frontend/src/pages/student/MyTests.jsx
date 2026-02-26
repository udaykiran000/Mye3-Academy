import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"; // Fixed import
import { fetchMyMockTests } from "../../redux/userSlice"; // Fixed import
import MyTestCard from "../../components/student/MyTestCard"; // Fixed import
import { Loader } from "lucide-react"; 

const MyTests = () => {
  const dispatch = useDispatch();
  const { myMockTests, myMockTestsStatus, myMockTestsError } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    // Fetch every time component mounts to ensure fresh data
    dispatch(fetchMyMockTests());
  }, [dispatch]);

  let content;

  if (myMockTestsStatus === "loading") {
    content = (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  } else if (myMockTestsStatus === "succeeded") {
    if (!myMockTests || !Array.isArray(myMockTests) || myMockTests.length === 0) {
      content = (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">
            You haven't enrolled in any tests yet.
          </p>
          <a href="/mocktests" className="text-blue-600 font-semibold mt-2 inline-block hover:underline">
            Browse Available Tests
          </a>
        </div>
      );
    } else {
      content = (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {myMockTests.map((test) => {
            // Safety: ensure test is an object (populated) not just an ID string
            if (!test || typeof test !== 'object') return null;
            
            return <MyTestCard key={test._id} test={test} />;
          })}
        </div>
      );
    }
  } else if (myMockTestsStatus === "failed") {
    content = (
      <div className="flex justify-center items-center h-64 text-red-500">
        Error: {myMockTestsError}
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Active Tests</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mt-1">Enrolled Series</p>
        </div>
        <div className="h-px flex-1 bg-slate-100 ml-8 hidden md:block"></div>
      </div>
      {content}
    </div>
  );
};

export default MyTests;