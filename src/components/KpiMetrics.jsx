import React from 'react';
import { 
  PhoneCall, 
  Users, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { OverviewCard } from './OverviewCard';

export const KpiMetrics = ({ metrics }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <OverviewCard
        title="Total Voice Calls"
        value={metrics.totalCalls}
        subtitle={`${metrics.deliveredCount || 0} delivered`}
        icon={PhoneCall}
        badge={metrics.totalCalls > 0 ? "Active Stream" : "Awaiting Calls"}
      />

      <OverviewCard
        title="Farmers Reached"
        value={metrics.farmersReached ?? 0}
        subtitle={metrics.farmersReachedSubtitle || `${metrics.farmersReached ?? 0} picked up & talked across all dates`}
        icon={Users}
        badge={metrics.farmersReachedBadge || "All Dates"}
      />

      <OverviewCard
        title="Trust AI Confidence"
        value={metrics.confidenceRate}
        subtitle={metrics.totalCalls > 0 ? "Average across recorded calls" : "No calls recorded yet"}
        icon={ShieldCheck}
        badge={metrics.confidenceRate !== 'N/A' ? "Trust Verified" : "Awaiting Data"}
      />

      <OverviewCard
        title="Weather Risk Alerts"
        value={metrics.severeWeatherAlerts}
        subtitle="Identified from current call logs"
        icon={AlertTriangle}
        badge={metrics.severeWeatherAlerts > 0 ? "Alert Active" : "Normal"}
      />
    </section>
  );
};
