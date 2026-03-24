import { environment } from "../environments/environment";

// Published Google Sheet URL for default role data (POC = Property Manager, sPOC = Owner)
const DEFAULT_ROLES_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRFgTVZYJOGM1YZcBDPo16EztlxscJYMseamoWyLADnKY0eO6jZMmW0Pa8oc_lJ_THwEjiKrZSTC8XR/pub?gid=283302510&single=true&output=csv";

// Google Sheet template URL for users to view/copy
export const GOOGLE_SHEET_TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/1yfv6NFvE3_HGqZMrw7BbPXamd4TuXKxVx65mCWSK5sc/edit?usp=sharing";

export const fetchPropertiesData = async () => {
  try {
    const response = await fetch(
      `${environment.apiUrl}/api/properties-and-slack`
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch properties data");
    }

    const properties = data.data
      .map((item) => ({
        property_name: item.property_name?.trim(),
        slack_channel_id: item.slack_channel_id?.trim(),
        property_type: item.property_type?.trim(),
        property_code: item.property_code?.trim(),
      }))
      .filter((item) => item.property_name && item.property_code); // Filter out any items with missing required fields

    // Return both properties and dynamic property types
    return {
      properties,
      propertyTypes: data.propertyTypes || [],
    };
  } catch (error) {
    console.error("Error loading properties data:", error);
    return { properties: [], propertyTypes: [] };
  }
};

/**
 * Fetch default role data from published Google Sheet
 * Returns CSV data with property_manager and owner Slack IDs
 */
export const fetchDefaultRoleData = async () => {
  try {
    // Add cache-busting timestamp to avoid stale Google Sheet data
    const cacheBuster = `&_t=${Date.now()}`;
    const url = DEFAULT_ROLES_CSV_URL + cacheBuster;

    console.log('[Default Role Data] Fetching fresh data from Google Sheet...');

    const response = await fetch(url, {
      cache: 'no-store', // Prevent browser caching
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch default role data: ${response.status}`);
    }

    const csvText = await response.text();
    console.log('[Default Role Data] CSV text length:', csvText.length);
    const parsedData = parseRolesCsv(csvText);

    return {
      success: true,
      data: parsedData,
      propertyCount: Object.keys(parsedData).length,
    };
  } catch (error) {
    console.error("Error fetching default role data:", error);
    return {
      success: false,
      data: {},
      propertyCount: 0,
      error: error.message,
    };
  }
};

/**
 * Parse the roles CSV from Google Sheet
 * Columns: property_name, slack_channel_id, POC (Property Manager), sPOC (Owner)
 */
function parseRolesCsv(csvText) {
  const lines = csvText.split('\n');
  if (lines.length < 2) return {};

  // Parse header to get column indices
  const header = parseCSVLine(lines[0]);
  const propertyNameIndex = header.findIndex(h => h.toLowerCase().includes('property_name'));
  // Handle various capitalizations: POC, poc, Poc, etc.
  const pocIndex = header.findIndex(h => h.toLowerCase().trim() === 'poc');
  // Handle various capitalizations: sPOC, SPOC, spoc, Spoc, etc.
  const spocIndex = header.findIndex(h => h.toLowerCase().trim() === 'spoc');

  console.log('[CSV Parse] Header columns:', header);
  console.log('[CSV Parse] POC index:', pocIndex, 'sPOC index:', spocIndex);

  if (propertyNameIndex === -1) {
    console.error("CSV missing property_name column");
    return {};
  }

  const result = {};

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const propertyName = values[propertyNameIndex]?.trim();

    if (!propertyName) continue;

    const pocValue = pocIndex !== -1 ? (values[pocIndex]?.trim() || '') : '';
    const spocValue = spocIndex !== -1 ? (values[spocIndex]?.trim() || '') : '';

    result[propertyName] = {
      property_name: propertyName,
      // Map POC to property_manager and sPOC to owner for user-friendly variable names
      property_manager: pocValue,
      owner: spocValue,
      // Also keep original names for backward compatibility
      POC: pocValue,
      sPOC: spocValue,
    };
  }

  console.log('[CSV Parse] Parsed', Object.keys(result).length, 'properties');
  // Log first property as sample
  const firstProp = Object.keys(result)[0];
  if (firstProp) {
    console.log('[CSV Parse] Sample property:', firstProp, result[firstProp]);
  }

  return result;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
