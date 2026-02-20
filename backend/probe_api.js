

const MOCK_TEST_ID = "69845249b080ee26246c28f4"; // New ID from screenshot
const URL = `http://localhost:8000/api/public/mocktests/${MOCK_TEST_ID}`;

(async () => {
    try {
        console.log(`Sending GET request to ${URL}...`);
        const response = await fetch(URL, { method: "GET" });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const json = await response.json();
            console.log("Response JSON:", JSON.stringify(json, null, 2));
        } else {
            const text = await response.text();
            console.log("Response Text:", text);
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);
    }
})();
