// Auto-generated from zo-nsfp RDS on 2026-04-16.
// Source: bookings_operator JOIN zoworld_destination.
// Regenerate via `docs/superpowers/plans/2026-04-16-passport-avatar-frame-figma.md` or the /zodb skill.
// Overrides applied for: V8RPGVH7 (DXB coords fix), 9XWJCC93 (Koramangala fine-grain), WTFXZO (manual add). Zo Club House deleted.

export type PropertyKind = 'zo-house' | 'zo-club' | 'zostel-plus' | 'zostel-homes' | 'zostel' | 'other';

export interface ZoProperty {
  id: string;
  name: string;
  destination: string;
  lat: number;
  lng: number;
  kind: PropertyKind;
}

export const PROPERTIES: ZoProperty[] = [
  {
    "id": "9XWJCC93",
    "lat": 12.9351,
    "lng": 77.622,
    "kind": "zo-house",
    "name": "BLRxZo",
    "destination": "Bangalore"
  },
  {
    "id": "V8RPGVH7",
    "lat": 25.0807,
    "lng": 55.1391,
    "kind": "zo-house",
    "name": "Zo House DXB",
    "destination": "Dubai"
  },
  {
    "id": "W89JHJ2C",
    "lat": 37.7749,
    "lng": -122.4194,
    "kind": "zo-house",
    "name": "Zo House SF",
    "destination": "San Francisco"
  },
  {
    "id": "WTFXZO",
    "name": "WTFxZo",
    "destination": "Bangalore",
    "lat": 12.9716,
    "lng": 77.7481,
    "kind": "zo-house"
  },
  {
    "id": "BIRH138",
    "lat": 32.04562,
    "lng": 76.72362,
    "kind": "zostel-plus",
    "name": "Zostel Plus Bir",
    "destination": "Bir"
  },
  {
    "id": "KRRP143",
    "lat": 32.31919,
    "lng": 76.30073,
    "kind": "zostel-plus",
    "name": "Zostel Plus Kareri",
    "destination": "Kareri"
  },
  {
    "id": "LNVH196",
    "lat": 18.75615,
    "lng": 73.40795,
    "kind": "zostel-plus",
    "name": "Zostel Plus Lonavala",
    "destination": "Lonavala"
  },
  {
    "id": "MSSH645",
    "lat": 30.4609,
    "lng": 78.06601,
    "kind": "zostel-plus",
    "name": "Zostel Plus Mussoorie",
    "destination": "Mussoorie"
  },
  {
    "id": "NNTP933",
    "lat": 29.39266,
    "lng": 79.45321,
    "kind": "zostel-plus",
    "name": "Zostel Plus Nainital (Naina Range)",
    "destination": "Nainital"
  },
  {
    "id": "PNCH542",
    "lat": 17.9245,
    "lng": 73.79604,
    "kind": "zostel-plus",
    "name": "Zostel Plus Panchgani",
    "destination": "Panchgani"
  },
  {
    "id": "RSHP726",
    "lat": 30.08921,
    "lng": 78.26813,
    "kind": "zostel-plus",
    "name": "Zostel Plus Rishikesh (Mohanchatti)",
    "destination": "Rishikesh"
  },
  {
    "id": "WYNH151",
    "lat": 11.70946,
    "lng": 76.07629,
    "kind": "zostel-plus",
    "name": "Zostel Plus Wayanad",
    "destination": "Wayanad"
  },
  {
    "id": "BHRB465",
    "lat": 18.14516,
    "lng": 73.84489,
    "kind": "zostel-homes",
    "name": "Zostel Homes Bhor",
    "destination": "Bhor"
  },
  {
    "id": "CHGX001",
    "lat": 31.06653,
    "lng": 77.30993,
    "kind": "zostel-homes",
    "name": "Zostel Homes Cheog",
    "destination": "Cheog"
  },
  {
    "id": "HRBB862",
    "lat": 31.9892,
    "lng": 76.82439,
    "kind": "zostel-homes",
    "name": "Zostel Homes Harabhag (Joginder Nagar)",
    "destination": "Harabhag"
  },
  {
    "id": "KSRB463",
    "lat": 29.64219,
    "lng": 79.66241,
    "kind": "zostel-homes",
    "name": "Zostel Homes Kasar Devi",
    "destination": "Kasar Devi"
  },
  {
    "id": "PDRX721",
    "lat": 31.1178,
    "lng": 77.5391,
    "kind": "zostel-homes",
    "name": "Zostel Homes Kotkhai",
    "destination": "Kotkhai"
  },
  {
    "id": "LDJX597",
    "lat": 31.69408,
    "lng": 77.33356,
    "kind": "zostel-homes",
    "name": "Zostel Homes Laida",
    "destination": "Laida"
  },
  {
    "id": "LEHB055",
    "lat": 34.15298,
    "lng": 77.57721,
    "kind": "zostel-homes",
    "name": "Zostel Homes Leh (Stok)",
    "destination": "Leh"
  },
  {
    "id": "MSHX650",
    "lat": 31.12998,
    "lng": 77.22853,
    "kind": "zostel-homes",
    "name": "Zostel Homes Mashobra",
    "destination": "Mashobra"
  },
  {
    "id": "MNLB690",
    "lat": 32.16117,
    "lng": 77.16256,
    "kind": "zostel-homes",
    "name": "Zostel Homes Pangan (Manali)",
    "destination": "Pangan"
  },
  {
    "id": "KLMB102",
    "lat": 27.1593,
    "lng": 88.61577,
    "kind": "zostel-homes",
    "name": "Zostel Homes Pedong",
    "destination": "Pedong"
  },
  {
    "id": "PSHX220",
    "lat": 26.48965,
    "lng": 74.55006,
    "kind": "zostel-homes",
    "name": "Zostel Homes Pushkar",
    "destination": "Pushkar"
  },
  {
    "id": "RKCX162",
    "lat": 31.38018,
    "lng": 78.36074,
    "kind": "zostel-homes",
    "name": "Zostel Homes Rakchham",
    "destination": "Rakchham"
  },
  {
    "id": "RMGB293",
    "lat": 23.64627,
    "lng": 85.5162,
    "kind": "zostel-homes",
    "name": "Zostel Homes Ramgarh (Nainital)",
    "destination": "Ramgarh"
  },
  {
    "id": "LHLB936",
    "lat": 32.59291,
    "lng": 76.89206,
    "kind": "zostel-homes",
    "name": "Zostel Homes Rashil",
    "destination": "Rashil"
  },
  {
    "id": "SHMB500",
    "lat": 31.10387,
    "lng": 77.17172,
    "kind": "zostel-homes",
    "name": "Zostel Homes Shimla",
    "destination": "Shimla"
  },
  {
    "id": "TABX202",
    "lat": 32.09361,
    "lng": 78.38487,
    "kind": "zostel-homes",
    "name": "Zostel Homes Tabo",
    "destination": "Tabo"
  },
  {
    "id": "THGX006",
    "lat": 31.11904,
    "lng": 77.3589,
    "kind": "zostel-homes",
    "name": "Zostel Homes Theog",
    "destination": "Theog"
  },
  {
    "id": "KRPB572",
    "lat": 11.70946,
    "lng": 76.07629,
    "kind": "zostel-homes",
    "name": "Zostel Homes Wayanad (Karapuzha)",
    "destination": "Wayanad"
  },
  {
    "id": "WYNX700",
    "lat": 11.70946,
    "lng": 76.07629,
    "kind": "zostel-homes",
    "name": "Zostel Homes Wayanad (Thirunelly)",
    "destination": "Wayanad"
  },
  {
    "id": "VYTB691",
    "lat": 11.70946,
    "lng": 76.07629,
    "kind": "zostel-homes",
    "name": "Zostel Homes Wayanad (Vythiri)",
    "destination": "Wayanad"
  },
  {
    "id": "ALLH830",
    "lat": 9.50399,
    "lng": 76.3344,
    "kind": "zostel",
    "name": "Zostel Alleppeyyy",
    "destination": "Alleppey"
  },
  {
    "id": "ARNH184",
    "lat": 19.88183,
    "lng": 75.34328,
    "kind": "zostel",
    "name": "Zostel Aurangabaddd",
    "destination": "Aurangabad"
  },
  {
    "id": "BNGH107",
    "lat": 12.99247,
    "lng": 77.59455,
    "kind": "zostel",
    "name": "Zostel Bangalore",
    "destination": "Bangalore"
  },
  {
    "id": "BNGH469",
    "lat": 12.99247,
    "lng": 77.59455,
    "kind": "zostel",
    "name": "Zostel Bangalore (Koramangala)",
    "destination": "Bangalore"
  },
  {
    "id": "BNKH233",
    "lat": 32.55056,
    "lng": 75.9443,
    "kind": "zostel",
    "name": "Zostel Banikhet (Dalhousie)",
    "destination": "Banikhet"
  },
  {
    "id": "BRTH495",
    "lat": 32.0948,
    "lng": 76.76484,
    "kind": "zostel",
    "name": "Zostel Barot (Rajgundha)",
    "destination": "Barot"
  },
  {
    "id": "BNDH020",
    "lat": 25.43304,
    "lng": 75.64578,
    "kind": "zostel",
    "name": "Zostel Bundi",
    "destination": "Bundi"
  },
  {
    "id": "CHTH585",
    "lat": 31.35026,
    "lng": 78.4383,
    "kind": "zostel",
    "name": "Zostel Chitkul",
    "destination": "Chitkul"
  },
  {
    "id": "CRGH495",
    "lat": 12.42559,
    "lng": 75.73738,
    "kind": "zostel",
    "name": "Zostel Coorg (Madikeri)",
    "destination": "Coorg"
  },
  {
    "id": "CRGH532",
    "lat": 12.42559,
    "lng": 75.73738,
    "kind": "zostel",
    "name": "Zostel Coorg (Siddapura)",
    "destination": "Coorg"
  },
  {
    "id": "DLHH252",
    "lat": 32.53852,
    "lng": 75.96742,
    "kind": "zostel",
    "name": "Zostel Dalhousie",
    "destination": "Dalhousie"
  },
  {
    "id": "DLHH524",
    "lat": 28.67814,
    "lng": 77.18658,
    "kind": "zostel",
    "name": "Zostel Delhi",
    "destination": "Delhi"
  },
  {
    "id": "DHRH324",
    "lat": 32.24761,
    "lng": 76.32572,
    "kind": "zostel",
    "name": "Zostel Dharamkot",
    "destination": "Dharamkot"
  },
  {
    "id": "DBHH254",
    "lat": 24.53879,
    "lng": 84.91591,
    "kind": "zostel",
    "name": "Zostel Dobhi",
    "destination": "Dobhi"
  },
  {
    "id": "GNGH967",
    "lat": 27.33381,
    "lng": 88.60983,
    "kind": "zostel",
    "name": "Zostel Gangtok",
    "destination": "Gangtok"
  },
  {
    "id": "GOAH706",
    "lat": 15.57928,
    "lng": 73.84357,
    "kind": "zostel",
    "name": "Zostel Goa (Anjuna)",
    "destination": "Goa"
  },
  {
    "id": "GOAH407",
    "lat": 15.57928,
    "lng": 73.84357,
    "kind": "zostel",
    "name": "Zostel Goa (Morjim)",
    "destination": "Goa"
  },
  {
    "id": "GKRH533",
    "lat": 14.54817,
    "lng": 74.31908,
    "kind": "zostel",
    "name": "Zostel Gokarna",
    "destination": "Gokarna"
  },
  {
    "id": "HYDH476",
    "lat": 17.40757,
    "lng": 78.45744,
    "kind": "zostel",
    "name": "Zostel Hyderabad",
    "destination": "Hyderabad"
  },
  {
    "id": "JPRH038",
    "lat": 26.91491,
    "lng": 75.79536,
    "kind": "zostel",
    "name": "Zostel Jaipur",
    "destination": "Jaipur"
  },
  {
    "id": "JPRH787",
    "lat": 26.91491,
    "lng": 75.79536,
    "kind": "zostel",
    "name": "Zostel Jaipur",
    "destination": "Jaipur"
  },
  {
    "id": "JSLH404",
    "lat": 26.91682,
    "lng": 70.90829,
    "kind": "zostel",
    "name": "Zostel Jaisalmer",
    "destination": "Jaisalmer"
  },
  {
    "id": "NNTH669",
    "lat": 29.53014,
    "lng": 78.77469,
    "kind": "zostel",
    "name": "Zostel Jim Corbett",
    "destination": "Jim Corbett"
  },
  {
    "id": "JDHH559",
    "lat": 26.2472,
    "lng": 73.03259,
    "kind": "zostel",
    "name": "Zostel Jodhpur",
    "destination": "Jodhpur"
  },
  {
    "id": "JDHH376",
    "lat": 26.2472,
    "lng": 73.03259,
    "kind": "zostel",
    "name": "Zostel Jodhpur (Ratanada)",
    "destination": "Jodhpur"
  },
  {
    "id": "KSLH539",
    "lat": 32.01031,
    "lng": 77.31506,
    "kind": "zostel",
    "name": "Zostel Kasol (Katagla)",
    "destination": "Kasol"
  },
  {
    "id": "KTHH403",
    "lat": 27.7246,
    "lng": 85.31583,
    "kind": "zostel",
    "name": "Zostel Kathmandu",
    "destination": "Kathmandu"
  },
  {
    "id": "RNKH238",
    "lat": 9.98457,
    "lng": 76.29731,
    "kind": "zostel",
    "name": "Zostel Kochi (Ernakulam)",
    "destination": "Ernakulam"
  },
  {
    "id": "KCHH015",
    "lat": 9.94146,
    "lng": 76.25768,
    "kind": "zostel",
    "name": "Zostel Kochi (Fort Kochi)",
    "destination": "Kochi"
  },
  {
    "id": "KCHH080",
    "lat": 9.94146,
    "lng": 76.25768,
    "kind": "zostel",
    "name": "Zostel Kochi (Fort Kochi)",
    "destination": "Kochi"
  },
  {
    "id": "KDKH541",
    "lat": 10.2395,
    "lng": 77.48769,
    "kind": "zostel",
    "name": "Zostel Kodaikanal",
    "destination": "Kodaikanal"
  },
  {
    "id": "KLDH813",
    "lat": 18.40842,
    "lng": 73.21012,
    "kind": "zostel",
    "name": "Zostel Kolad",
    "destination": "Kolad"
  },
  {
    "id": "LEHH490",
    "lat": 34.15298,
    "lng": 77.57721,
    "kind": "zostel",
    "name": "Zostel Leh",
    "destination": "Leh"
  },
  {
    "id": "BRWH587",
    "lat": 32.24357,
    "lng": 77.18678,
    "kind": "zostel",
    "name": "Zostel Manali (Burwa)",
    "destination": "Burwa"
  },
  {
    "id": "MNLH056",
    "lat": 32.24401,
    "lng": 77.18978,
    "kind": "zostel",
    "name": "Zostel Manali (Old Manali)",
    "destination": "Manali"
  },
  {
    "id": "VSHH380",
    "lat": 32.26103,
    "lng": 77.18796,
    "kind": "zostel",
    "name": "Zostel Manali (Vashisht)",
    "destination": "Vashisht"
  },
  {
    "id": "MCLH893",
    "lat": 32.24382,
    "lng": 76.31859,
    "kind": "zostel",
    "name": "Zostel McLeodganj",
    "destination": "Mcleodganj"
  },
  {
    "id": "MKTH757",
    "lat": 29.46108,
    "lng": 79.6556,
    "kind": "zostel",
    "name": "Zostel Mukteshwar",
    "destination": "Mukteshwar"
  },
  {
    "id": "MMBH714",
    "lat": 19.09355,
    "lng": 72.87362,
    "kind": "zostel",
    "name": "Zostel Mumbai",
    "destination": "Mumbai"
  },
  {
    "id": "MNNH252",
    "lat": 10.08999,
    "lng": 77.0595,
    "kind": "zostel",
    "name": "Zostel Munnar",
    "destination": "Munnar"
  },
  {
    "id": "MSSH686",
    "lat": 30.4609,
    "lng": 78.06601,
    "kind": "zostel",
    "name": "Zostel Mussoorie (Mall Road)",
    "destination": "Mussoorie"
  },
  {
    "id": "MYSH811",
    "lat": 12.29899,
    "lng": 76.64187,
    "kind": "zostel",
    "name": "Zostel Mysore",
    "destination": "Mysore"
  },
  {
    "id": "OTYH641",
    "lat": 11.41122,
    "lng": 76.69522,
    "kind": "zostel",
    "name": "Zostel Ooty",
    "destination": "Ooty"
  },
  {
    "id": "PHLH309",
    "lat": 34.01641,
    "lng": 75.30992,
    "kind": "zostel",
    "name": "Zostel Pahalgam",
    "destination": "Pahalgam"
  },
  {
    "id": "PKHH743",
    "lat": 28.21535,
    "lng": 83.98717,
    "kind": "zostel",
    "name": "Zostel Pokhara",
    "destination": "Pokhara"
  },
  {
    "id": "KDKH833",
    "lat": 10.25681,
    "lng": 77.40767,
    "kind": "zostel",
    "name": "Zostel Poombarai (Kodaikanal)",
    "destination": "Poombarai"
  },
  {
    "id": "PSHH134",
    "lat": 26.48965,
    "lng": 74.55006,
    "kind": "zostel",
    "name": "Zostel Pushkar",
    "destination": "Pushkar"
  },
  {
    "id": "PSHH426",
    "lat": 26.48965,
    "lng": 74.55006,
    "kind": "zostel",
    "name": "Zostel Pushkar",
    "destination": "Pushkar"
  },
  {
    "id": "RSHH304",
    "lat": 30.08921,
    "lng": 78.26813,
    "kind": "zostel",
    "name": "Zostel Rishikesh (Laxman Jhula)",
    "destination": "Rishikesh"
  },
  {
    "id": "RSHH498",
    "lat": 30.08921,
    "lng": 78.26813,
    "kind": "zostel",
    "name": "Zostel Rishikesh (Tapovan)",
    "destination": "Rishikesh"
  },
  {
    "id": "JSLH187",
    "lat": 26.91682,
    "lng": 70.90829,
    "kind": "zostel",
    "name": "Zostel Sam Desert (Jaisalmer)",
    "destination": "Jaisalmer"
  },
  {
    "id": "SNGH084",
    "lat": 31.42565,
    "lng": 78.26515,
    "kind": "zostel",
    "name": "Zostel Sangla",
    "destination": "Sangla"
  },
  {
    "id": "SHNH319",
    "lat": 31.74584,
    "lng": 77.39201,
    "kind": "zostel",
    "name": "Zostel Shangarh",
    "destination": "Shangarh"
  },
  {
    "id": "SHLH305",
    "lat": 25.57991,
    "lng": 91.89656,
    "kind": "zostel",
    "name": "Zostel Shillong",
    "destination": "Shillong"
  },
  {
    "id": "SSSH756",
    "lat": 32.48032,
    "lng": 77.12415,
    "kind": "zostel",
    "name": "Zostel Sissu",
    "destination": "Sissu"
  },
  {
    "id": "SPTH777",
    "lat": 32.23461,
    "lng": 78.05372,
    "kind": "zostel",
    "name": "Zostel Spiti",
    "destination": "Spiti"
  },
  {
    "id": "SRNH885",
    "lat": 34.08617,
    "lng": 74.80194,
    "kind": "zostel",
    "name": "Zostel Srinagar",
    "destination": "Srinagar"
  },
  {
    "id": "UDPH705",
    "lat": 24.58784,
    "lng": 73.71243,
    "kind": "zostel",
    "name": "Zostel Udaipur",
    "destination": "Udaipur"
  },
  {
    "id": "VGMH236",
    "lat": 9.688,
    "lng": 76.90341,
    "kind": "zostel",
    "name": "Zostel Vagamon",
    "destination": "Vagamon"
  },
  {
    "id": "VRKH781",
    "lat": 8.7393,
    "lng": 76.71596,
    "kind": "zostel",
    "name": "Zostel Varkala",
    "destination": "Varkala"
  },
  {
    "id": "VSKH507",
    "lat": 17.70106,
    "lng": 83.22208,
    "kind": "zostel",
    "name": "Zostel Visakhapatnam (Vizag)",
    "destination": "Visakhapatnam (Vizag)"
  },
  {
    "id": "DPRB429",
    "lat": 24.58784,
    "lng": 73.71243,
    "kind": "other",
    "name": "Abhimanyu Mansion",
    "destination": "Udaipur"
  },
  {
    "id": "MNLT481",
    "lat": 32.24401,
    "lng": 77.18978,
    "kind": "other",
    "name": "GlampEco",
    "destination": "Manali"
  },
  {
    "id": "PWMF84W8",
    "lat": 1.3521,
    "lng": 103.8198,
    "kind": "other",
    "name": "Token 2049",
    "destination": "Singapore"
  }
];
