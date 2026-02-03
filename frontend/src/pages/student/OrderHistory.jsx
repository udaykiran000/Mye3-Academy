import React from 'react';
import { ChartCard } from "../../components/student/DashboardUIKIt";

// 4. Order History Tab (Placeholder)
const OrderHistory = () => (
    <ChartCard title="My Orders">
        <p className="text-gray-600">You have no order history yet.</p>
        {/* You can map over mockOrders here later */}
    </ChartCard>
);

export default OrderHistory;