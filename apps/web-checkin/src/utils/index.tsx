/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeneralObject } from "@zo/definitions/general";

function getMaxOccupancy(rooms: GeneralObject[]) {
  return rooms.reduce((acc, room) => {
    return acc + room.occupancy * room.units;
  }, 0);
}

const getBoldSeparatedText = (text?: string) => {
  const segments = (text || "").split(/(\*[^*]+\*)/).filter(Boolean);
  const texts: any[] = [];
  segments.map((segment, index) => {
    // Check if the segment was enclosed in asterisks
    if (segment.startsWith("*") && segment.endsWith("*")) {
      // Remove the asterisks and render the segment in bold
      texts.push(
        <span key={index} className="font-semibold">
          {segment.replace(/\*/g, "")}
        </span>
      );
    } else {
      // Render the segment normally
      texts.push(segment);
    }
  });
  return texts;
};

const isValidBookingCode = (bookingCode: string) => {
  // correct format JPRH038-BC55475
  return /^[A-Z0-9]+-[A-Z0-9]+$/.test(bookingCode.trim());
};

export { getBoldSeparatedText, getMaxOccupancy, isValidBookingCode };
