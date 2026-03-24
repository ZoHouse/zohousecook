import moment from "moment";

const formatDateRange = (start?: string, end?: string): string => {
  // should be shown as 8 -> 9 Aug 2021
  // if same month, then 8 -> 9 Aug 2021
  // if different month, then 8 Aug -> 9 Sep 2021
  // if different year, then 8 Aug 2021 -> 9 Sep 2022

  if (!start || !end) {
    return '';
  }

  const startDate = moment(start);
  const endDate = moment(end);

  const startDay = startDate.format("D");
  const startMonth = startDate.format("MMM");
  const startYear = startDate.format("YYYY");
  const endDay = endDate.format("D");
  const endMonth = endDate.format("MMM");
  const endYear = endDate.format("YYYY");

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startDay} → ${endDay} ${startMonth} ${startYear}`;
    } else {
      return `${startDay} ${startMonth} → ${endDay} ${endMonth} ${startYear}`;
    }
  }

  return `${startDay} ${startMonth} ${startYear} → ${endDay} ${endMonth} ${endYear}`;
};


const durationToHours = (durationStr: string): number => {
  if (durationStr.includes(" ")) {
    const [daysStr, timeStr] = durationStr.split(" ");

    const days = parseInt(daysStr, 10);
    let totalHours = days * 24;

    const [hoursStr, minutesStr, secondsStr] = timeStr.split(":");

    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);

    totalHours += hours;

    return totalHours + minutes / 60 + seconds / 3600;
  } else {
    const [hoursStr, minutesStr, secondsStr] = durationStr.split(":");

    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);

    return hours + minutes / 60 + seconds / 3600;
  }
}

export { durationToHours, formatDateRange };

