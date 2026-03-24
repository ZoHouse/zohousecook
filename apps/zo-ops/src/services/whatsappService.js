// Mock data for guests
const mockGuests = [
  {
    name: "John Doe",
    phone: "+911234567890",
    property: "Zostel Delhi",
    checkIn: "2024-03-20",
  },
  {
    name: "Jane Smith",
    phone: "+911234567891",
    property: "Zostel Goa",
    checkIn: "2024-03-21",
  },
  {
    name: "Mike Johnson",
    phone: "+911234567892",
    property: "Zostel Delhi",
    checkIn: "2024-03-22",
  },
  {
    name: "Sarah Williams",
    phone: "+911234567893",
    property: "Zostel Manali",
    checkIn: "2024-03-23",
  },
];

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const whatsappService = {
  // Send test message
  sendTestMessage: async (phoneNumber, message) => {
    await delay(1000); // Simulate API call

    // Simulate validation
    if (!phoneNumber.match(/^\+[0-9]{12}$/)) {
      throw new Error(
        "Invalid phone number format. Please use format: +911234567890"
      );
    }

    console.log("Test message sent:", { phoneNumber, message });
    return { success: true };
  },

  // Send messages to all guests
  sendToGuests: async (properties, startDate, endDate, message) => {
    await delay(1500); // Simulate API call

    // Filter guests based on properties and date range
    const filteredGuests = mockGuests.filter((guest) => {
      const checkIn = new Date(guest.checkIn);
      return (
        properties.includes(guest.property) &&
        checkIn >= new Date(startDate) &&
        checkIn <= new Date(endDate)
      );
    });

    console.log("Messages sent to guests:", {
      guestCount: filteredGuests.length,
      properties,
      startDate,
      endDate,
      message,
    });

    return {
      success: true,
      sentCount: filteredGuests.length,
      guests: filteredGuests,
    };
  },

  // Add this new method
  getGuestCount: async (properties, startDate, endDate) => {
    await delay(500); // Shorter delay for better UX

    const filteredGuests = mockGuests.filter((guest) => {
      const checkIn = new Date(guest.checkIn);
      return (
        properties.includes(guest.property) &&
        checkIn >= new Date(startDate) &&
        checkIn <= new Date(endDate)
      );
    });

    return {
      count: filteredGuests.length,
      guests: filteredGuests,
    };
  },
};
