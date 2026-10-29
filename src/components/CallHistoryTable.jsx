import React from 'react';
import { 
  ChevronRight, 
  Clock, 
  MapPin, 
  CloudRain, 
  CheckCircle2, 
  AlertCircle, 
  PhoneOutgoing,
  Database,
  ExternalLink
} from 'lucide-react';
import { GOOGLE_SHEETS_CONFIG } from '../utils/constants';

export const CallHistoryTable = ({ callLogs, onSelectCall, selectedCallId, onResetFilters, isFiltered }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-trust-green border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'Requires Escalation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            Requires Escalation
          </span>
        );
      case 'Completed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <CheckCircle2 className="w-3 h-3" />
            {status || 'Recorded'}
          </span>
        );
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const num = parseInt(seconds, 10);
    if (isNaN(num)) return String(seconds);
    const mins = Math.floor(num / 60);
    const secs = num % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  if (!callLogs || callLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
          {isFiltered ? <PhoneOutgoing className="w-7 h-7" /> : <Database className="w-7 h-7 text-trust-navy" />}
        </div>
        
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isFiltered ? 'No Matching Call Records' : 'No Call Records in Google Sheet Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            {isFiltered 
              ? 'No voice call logs match the selected search or filter criteria. Try adjusting your filters.'
              : 'The dashboard is connected live to your Google Sheet. As the voice agent makes calls and rows are added to the sheet, they will automatically appear here.'}
          </p>
        </div>

        {isFiltered ? (
          onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-trust-navy text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )
        ) : (
          <div className="pt-2">
            <a
              href={`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.callLogsSheetId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <span>View Connected Sheet 2</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Live Call History
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Voice Agent Weather Advisories & Farmer Telemetry
          </h3>
        </div>
        <div className="text-xs text-slate-500">
          Showing real-time records from Google Sheet 2
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-500 uppercase border-b border-slate-200/80">
            <tr>
              <th className="px-4 py-3.5">Call ID & Time</th>
              <th className="px-4 py-3.5">Farmer & Contact</th>
              <th className="px-4 py-3.5">District / Village</th>
              <th className="px-4 py-3.5">Language</th>
              <th className="px-4 py-3.5 min-w-[240px]">Weather Advisory Summary</th>
              <th className="px-4 py-3.5">Duration</th>
              <th className="px-4 py-3.5">AI Trust</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {callLogs.map((call) => {
              const isSelected = selectedCallId === call.call_id;
              return (
                <tr
                  key={call.call_id}
                  onClick={() => onSelectCall(call)}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 hover:bg-blue-50'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Call ID & Timestamp */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{call.call_id}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {call.displayDateTime || call.call_timestamp || 'Just now'}
                    </div>
                  </td>

                  {/* Farmer Details */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{call.farmer_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {call.phone_number}
                    </div>
                  </td>

                  {/* District & Village */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{call.district}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {call.village}
                    </div>
                  </td>

                  {/* Primary Language */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {call.primary_language}
                    </span>
                  </td>

                  {/* Weather Advisory Summary */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-trust-navy mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-800 text-[11px] line-clamp-1">
                          {call.weather_forecast || 'Weather Report'}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {call.advisory_summary || 'No advisory summary provided'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                    {formatDuration(call.duration_sec)}
                  </td>

                  {/* AI Trust Confidence */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-trust-green text-xs">
                        {call.ai_confidence_score ? String(call.ai_confidence_score).includes('%') ? call.ai_confidence_score : `${call.ai_confidence_score}%` : 'N/A'}
                      </span>
                    </div>
                    {call.ai_confidence_score && (
                      <div className="w-12 bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                        <div 
                          className="bg-trust-green h-1 rounded-full"
                          style={{ width: String(call.ai_confidence_score).includes('%') ? call.ai_confidence_score : `${call.ai_confidence_score}%` }}
                        />
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getStatusBadge(call.call_status)}
                  </td>

                  {/* Action / Inspect */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCall(call);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-trust-navy bg-slate-100 hover:bg-trust-navy hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
