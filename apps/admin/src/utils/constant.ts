type TimingsType = {
  [key: string]: [number, string][];
};
export const timings: TimingsType = {
  days: [
    [1, "Monday"],
    [2, "Tuesday"],
    [3, "Wednesday"],
    [4, "Thursady"],
    [5, "Friday"],
    [6, "Saturday"],
    [7, "Sunday"],
  ],
  months: [
    [1, "January"],
    [2, "February"],
    [3, "March"],
    [4, "April"],
    [5, "May"],
    [6, "June"],
    [7, "July"],
    [8, "August"],
    [9, "September"],
    [10, "October"],
    [11, "November"],
    [12, "December"],
  ],
  season: [
    [1, "Spring"],
    [2, "Summer"],
    [3, "Autumn"],
    [4, "Winter"],
  ],
};

export const dataEntityOptions = [
  { label: "Operator", value: "operator" },
  { label: "Inventory", value: "inventory" },
  { label: "Sku", value: "sku" },
];
export const dataTypeOptions = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
];
