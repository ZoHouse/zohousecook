import { GeneralObject } from "@zo/definitions/general";
import moment from "moment";

const getGender = (id: number) => {
  switch (id) {
    case 0:
      return "Male";
    case 1:
      return "Female";
    case 2:
      return "Other";
    case 3:
      return "Prefer not to say";
    default:
      return "N/A";
  }
};

const getStatus = (status?: string) => {
  // remove _ and capitalize
  return status
    ? status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "";
};

const getAssetUrlByType = (
  profileAssets: GeneralObject[],
  type: number
): string | null => {
  const asset = profileAssets.find(
    (asset: GeneralObject) => asset.type === type
  );
  return asset ? asset.file : null;
};

const formatCSVData = (
  item: GeneralObject,
  index: number = 0
): GeneralObject => {
  const profile = item?.profile || {};
  const booking = item?.booking || {};
  const assets = item?.data?.assets || [];

  const findAsset = (type1: number, type2?: number) =>
    assets.find((asset: GeneralObject) => asset.type === type1)?.file ||
    (type2
      ? assets.find((asset: GeneralObject) => asset.type === type2)?.file
      : "");

  return {
    "S. No.": index + 1,
    Name: profile.full_name,
    Mobile: profile.mobile,
    Email: profile.email,
    Gender:
      profile.gender === 0 ? "Male" : profile.gender === 1 ? "Female" : "Other",
    Country: profile.country,
    "Arrival On": item.arrival_on,
    "Departure On": item.departure_on,
    "Booking ID": booking.code,
    "Booking Source": booking.source?.name,
    Address: profile.address,
    "Coming from": item.coming_from,
    "Next Destination": item.next_destination,
    "ID Front": findAsset(110, 112),
    "ID Back": findAsset(111, 113),
    Visa: findAsset(114),
    "Created at": moment(profile.time_create).format("MMM Do YYYY hh:mm A"),
  };
};

const getBookingWebCheckedInInfo = (booking: GeneralObject) => {
  const totalOccupancy =
    booking.expected_checkin_count ||
    booking?.rooms?.reduce(
      (total: number, room: GeneralObject) =>
        total + room.occupancy * room.units,
      0
    );
  const checkinsCount = booking.checkins?.length || 0;
  const approvedCheckinsCount = booking.checkins?.filter(
    (checkin: GeneralObject) => checkin.approved === true
  ).length;

  return {
    totalOccupancy,
    checkinsCount,
    approvedCheckinsCount,
  };
};

const getBookingPropertyCheckedInInfo = (booking: GeneralObject) => {
  const totalOccupancy =
    booking.expected_checkin_count ||
    booking?.rooms?.reduce(
      (total: number, room: GeneralObject) =>
        total + room.occupancy * room.units,
      0
    );

  const checkinsCount = booking.checkins?.length || 0;
  const approvedPropertyCheckinsCount = booking.checkins?.filter(
    (checkin: GeneralObject) => checkin.status === 1
  ).length;

  const hasPropertyCheckedin =
    totalOccupancy === checkinsCount &&
    approvedPropertyCheckinsCount === checkinsCount;

  console.log(
    booking.code,
    totalOccupancy,
    checkinsCount,
    approvedPropertyCheckinsCount
  );

  return {
    totalOccupancy,
    checkinsCount,
    approvedPropertyCheckinsCount,
    hasPropertyCheckedin,
  };
};

const csvDataMapper = (item: GeneralObject, index: number): GeneralObject => {
  return formatCSVData(item, index);
};

export {
  csvDataMapper,
  getAssetUrlByType,
  getBookingPropertyCheckedInInfo,
  getBookingWebCheckedInInfo,
  getGender,
  getStatus,
};
