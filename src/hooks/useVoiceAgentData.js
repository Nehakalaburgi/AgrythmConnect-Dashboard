import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  loadFarmersData, 
  loadCallLogsData, 
  syncCallUpdateToGoogleSheet,
  getFarmersReachedMetrics,
  isCallOnDate,
  getCallDate,
  getCallTime,
  getDisplayDateTime
} from '../utils';

export const useVoiceAgentData = () => {
  const [farmers, setFarmers] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Drawer
  const [selectedCall, setSelectedCall] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Cloud Writeback settings
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return localStorage.getItem('agrythm_apps_script_url') || '';
  });
  const [autoPollInterval, setAutoPollInterval] = useState(15); // in seconds, 0 = off

  // Save Apps Script URL
  const saveAppsScriptUrl = (url) => {
    setAppsScriptUrl(url);
    localStorage.setItem('agrythm_apps_script_url', url);
  };

  // Primary Fetch Function
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setRefreshing(true);
    }

    try {
      const [farmersRes, callLogsRes] = await Promise.all([
        loadFarmersData(),
        loadCallLogsData(),
      ]);

      setFarmers(farmersRes.data || []);
      setCallLogs(callLogsRes.data || []);
      setLastSynced(new Date());
      setSyncStatus('connected');
      setErrorMessage(null);
    } catch (err) {
      console.error('Error refreshing voice agent data:', err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'Failed to sync with Google Sheets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load via microtask
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        fetchAllData(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [fetchAllData]);

  // Periodic polling
  useEffect(() => {
    if (!autoPollInterval || autoPollInterval <= 0) return;

    const timer = setInterval(() => {
      fetchAllData(true);
    }, autoPollInterval * 1000);

    return () => clearInterval(timer);
  }, [autoPollInterval, fetchAllData]);

  // Combined Farmer Map for fast lookup
  const farmersMap = useMemo(() => {
    const map = new Map();
    farmers.forEach(f => {
      if (f.farmer_id) {
        map.set(String(f.farmer_id).trim(), f);
      }
    });
    return map;
  }, [farmers]);

  // Enriched Calls (Each call joined with farmer details purely from Sheet 1)
  const enrichedCallLogs = useMemo(() => {
    return callLogs.map(call => {
      const farmer = call.farmer_id ? farmersMap.get(String(call.farmer_id).trim()) || {} : {};
      const callDate = getCallDate(call);
      const callTime = getCallTime(call);
      const displayDateTime = getDisplayDateTime(call);
      return {
        ...call,
        date: callDate,
        time: callTime,
        displayDateTime,
        farmer_name: call.farmer_name || farmer.farmer_name || (call.farmer_id ? `Farmer ${call.farmer_id}` : 'Unassigned'),
        phone_number: call.phone_number || farmer.phone_number || 'N/A',
        primary_language: call.primary_language || farmer.primary_language || 'N/A',
        district: call.district || farmer.district || 'N/A',
        village: call.village || farmer.village || 'N/A',
      };
    });
  }, [callLogs, farmersMap]);

  // Dynamic filter options derived from real sheet data
  const availableDistricts = useMemo(() => {
    const set = new Set();
    farmers.forEach(f => { if (f.district) set.add(f.district); });
    callLogs.forEach(c => { if (c.district) set.add(c.district); });
    return Array.from(set).sort();
  }, [farmers, callLogs]);

  const availableLanguages = useMemo(() => {
    const set = new Set();
    farmers.forEach(f => { if (f.primary_language) set.add(f.primary_language); });
    callLogs.forEach(c => { if (c.primary_language) set.add(c.primary_language); });
    return Array.from(set).sort();
  }, [farmers, callLogs]);

  // Filtered Calls
  const filteredCallLogs = useMemo(() => {
    return enrichedCallLogs.filter(call => {
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = String(call.farmer_name || '').toLowerCase().includes(query);
        const matchesPhone = String(call.phone_number || '').toLowerCase().includes(query);
        const matchesCallId = String(call.call_id || '').toLowerCase().includes(query);
        const matchesVillage = String(call.village || '').toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesCallId && !matchesVillage) {
          return false;
        }
      }

      // District Filter
      if (districtFilter !== 'all' && call.district !== districtFilter) {
        return false;
      }

      // Language Filter
      if (languageFilter !== 'all' && call.primary_language !== languageFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && call.call_status !== statusFilter) {
        return false;
      }

      // Date Filter (supports separate 'date'/'call_date' or 'call_timestamp')
      if (dateFilter !== 'all' && customDate) {
        const rawDate = getCallDate(call);
        if (!rawDate || !isCallOnDate(rawDate, customDate)) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedCallLogs, searchQuery, districtFilter, languageFilter, statusFilter, dateFilter, customDate]);

  // Summary Metrics calculations purely from real sheet records
  const summaryMetrics = useMemo(() => {
    const totalCalls = enrichedCallLogs.length;

    // Calculate farmers who picked up the call and talked today
    const reachedMetrics = getFarmersReachedMetrics(enrichedCallLogs, farmers, {
      dateFilter,
      customDate,
    });
    
    const deliveredCount = enrichedCallLogs.filter(c => c.call_status === 'Delivered').length;
    const escalationCount = enrichedCallLogs.filter(c => c.call_status === 'Requires Escalation').length;
    
    const severeWeatherAlerts = enrichedCallLogs.filter(c => {
      const chance = parseInt(c.rainfall_chance, 10) || 0;
      const forecast = String(c.weather_forecast || '').toLowerCase();
      return chance >= 60 || forecast.includes('heavy') || forecast.includes('thunderstorm') || forecast.includes('hail') || forecast.includes('storm');
    }).length;

    // Calculate real average confidence rate if available
    let avgConfidence = 'N/A';
    const confValues = enrichedCallLogs
      .map(c => parseFloat(String(c.ai_confidence_score || '').replace('%', '')))
      .filter(v => !isNaN(v));

    if (confValues.length > 0) {
      const sum = confValues.reduce((a, b) => a + b, 0);
      avgConfidence = `${(sum / confValues.length).toFixed(1)}%`;
    }

    return {
      totalCalls,
      uniqueFarmers: reachedMetrics.farmersReached,
      farmersReached: reachedMetrics.farmersReached,
      farmersReachedToday: reachedMetrics.farmersReachedToday,
      farmersReachedYesterday: reachedMetrics.farmersReachedYesterday,
      farmersReachedSubtitle: reachedMetrics.subtitle,
      farmersReachedBadge: reachedMetrics.badge,
      totalRegisteredFarmers: farmers.length,
      deliveredCount,
      escalationCount,
      severeWeatherAlerts,
      confidenceRate: avgConfidence,
    };
  }, [enrichedCallLogs, farmers, dateFilter, customDate]);

  // Update Call Log (Local + Google Sheet Sync)
  const updateCallLog = async (callId, updatedFields) => {
    setCallLogs(prev => {
      return prev.map(item => {
        if (item.call_id === callId) {
          return { ...item, ...updatedFields };
        }
        return item;
      });
    });

    if (selectedCall && selectedCall.call_id === callId) {
      setSelectedCall(prev => ({ ...prev, ...updatedFields }));
    }

    const payload = {
      action: 'updateCall',
      call_id: callId,
      ...updatedFields,
    };

    const syncRes = await syncCallUpdateToGoogleSheet(appsScriptUrl, payload);
    return syncRes;
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCustomDate('');
    setDistrictFilter('all');
    setLanguageFilter('all');
    setStatusFilter('all');
  };

  return {
    farmers,
    callLogs: enrichedCallLogs,
    filteredCallLogs,
    loading,
    refreshing,
    lastSynced,
    syncStatus,
    errorMessage,
    summaryMetrics,
    availableDistricts,
    availableLanguages,
    activeTab,
    setActiveTab,
    selectedCall,
    setSelectedCall,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customDate,
    setCustomDate,
    districtFilter,
    setDistrictFilter,
    languageFilter,
    setLanguageFilter,
    statusFilter,
    setStatusFilter,
    appsScriptUrl,
    saveAppsScriptUrl,
    autoPollInterval,
    setAutoPollInterval,
    fetchAllData,
    updateCallLog,
    resetFilters,
  };
};
