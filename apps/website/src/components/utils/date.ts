import moment from "moment";

const formatDateRange = (start?: string, end?: string) => {
    // should be shown as 8 -> 9 Aug 2021
    // if same month, then 8 -> 9 Aug 2021
    // if different month, then 8 Aug -> 9 Sep 2021
    // if different year, then 8 Aug 2021 -> 9 Sep 2022
    const startDate = moment(start);
    const endDate = moment(end);
    const startDay = startDate.format("DD");
    const startMonth = startDate.format("MMM");
    const startYear = startDate.format("YYYY");
    const endDay = endDate.format("DD");
    const endMonth = endDate.format("MMM");
    const endYear = endDate.format("YYYY");
    if (startMonth === endMonth) {
        if (startYear === endYear) {
            return `${startDay} → ${endDay} ${startMonth} ${startYear}`;
        }
        return `${startDay} ${startMonth} ${startYear} → ${endDay} ${endMonth} ${endYear}`;
    }
};


const formatTimeRange = (start?: string, end?: string) => {
    const startTime = moment(start);
    const endTime = moment(end);
    const startTimeFormatted = startTime.format("LT"); // Format start time
    const endTimeFormatted = endTime.format("LT"); // Format end time

    return `${startTimeFormatted} → ${endTimeFormatted}`;
};

const formatDateTimeRange = (start?: string, end?: string) => {
    const startTime = moment(start);
    const endTime = moment(end);

    const isSingleDay = startTime.isSame(endTime, 'day');

    const startTimeFormatted = startTime.format("ddd D MMM YYYY, hA");;
    let endTimeFormatted = ''

    if (isSingleDay) {
        endTimeFormatted = endTime.format("hA");
    } else {
        endTimeFormatted = endTime.format("ddd hA");
    }


    return `${startTimeFormatted} → ${endTimeFormatted}`;
};

export { formatDateRange, formatDateTimeRange, formatTimeRange };

