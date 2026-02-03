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
    if (!myMockTests || myMockTests.length === 0) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="container mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">My Enrolled Tests</h1>
      {content}
    </div>
  );
};

export default MyTests;