/**
 * �� Date & Time Utility Functions
 * Handles all time formatting and duration calculations.
 */

// Format a Date object to "hh:mm A" string (e.g., "05:30 PM")
export const formatTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strMinutes = minutes < 10 ? '0' + minutes : String(minutes);
  
  return `${hours}:${strMinutes} ${ampm}`;
};

// Calculate duration between two time strings (e.g., "05:50 AM" and "12:28 PM")
// Returns string format "6hr 28m" as per UI requirement
export const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '--';

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (hours === 12 && modifier === 'AM') hours = 0;
    if (hours !== 12 && modifier === 'PM') hours += 12;

    return hours * 60 + minutes; // Convert to total minutes
  };

  const startTotalMins = parseTime(startTime);
  const endTotalMins = parseTime(endTime);

  let diffMins = endTotalMins - startTotalMins;
  if (diffMins < 0) diffMins += 24 * 60; // Handle overnight journeys

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return `${hours}hr ${mins}m`;
};

// Get today's date in "Day, dd Mon" format (e.g., "Mon, 12 Oct")
export const getFormattedDate = (): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  return date.toLocaleDateString('en-US', options);
};
