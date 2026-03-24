const countryCodes = [
    {
      country: "Afghanistan",
      phoneCode: "93",
      symbol: "AF",
    },
    {
      country: "Albania",
      phoneCode: "355",
      symbol: "AL",
    },
    {
      country: "Algeria",
      phoneCode: "213",
      symbol: "DZ",
    },
    {
      country: "American Samoa",
      phoneCode: "1-684",
      symbol: "AS",
    },
    {
      country: "Andorra",
      phoneCode: "376",
      symbol: "AD",
    },
    {
      country: "Angola",
      phoneCode: "244",
      symbol: "AO",
    },
    {
      country: "Anguilla",
      phoneCode: "1-264",
      symbol: "AI",
    },
    {
      country: "Antarctica",
      phoneCode: "672",
      symbol: "AQ",
    },
    {
      country: "Antigua and Barbuda",
      phoneCode: "1-268",
      symbol: "AG",
    },
    {
      country: "Argentina",
      phoneCode: "54",
      symbol: "AR",
    },
    {
      country: "Armenia",
      phoneCode: "374",
      symbol: "AM",
    },
    {
      country: "Aruba",
      phoneCode: "297",
      symbol: "AW",
    },
    {
      country: "Australia",
      phoneCode: "61",
      symbol: "AU",
    },
    {
      country: "Austria",
      phoneCode: "43",
      symbol: "AT",
    },
    {
      country: "Azerbaijan",
      phoneCode: "994",
      symbol: "AZ",
    },
    {
      country: "Bahamas",
      phoneCode: "1-242",
      symbol: "BS",
    },
    {
      country: "Bahrain",
      phoneCode: "973",
      symbol: "BH",
    },
    {
      country: "Bangladesh",
      phoneCode: "880",
      symbol: "BD",
    },
    {
      country: "Barbados",
      phoneCode: "1-246",
      symbol: "BB",
    },
    {
      country: "Belarus",
      phoneCode: "375",
      symbol: "BY",
    },
    {
      country: "Belgium",
      phoneCode: "32",
      symbol: "BE",
    },
    {
      country: "Belize",
      phoneCode: "501",
      symbol: "BZ",
    },
    {
      country: "Benin",
      phoneCode: "229",
      symbol: "BJ",
    },
    {
      country: "Bermuda",
      phoneCode: "1-441",
      symbol: "BM",
    },
    {
      country: "Bhutan",
      phoneCode: "975",
      symbol: "BT",
    },
    {
      country: "Bolivia",
      phoneCode: "591",
      symbol: "BO",
    },
    {
      country: "Bosnia and Herzegovina",
      phoneCode: "387",
      symbol: "BA",
    },
    {
      country: "Botswana",
      phoneCode: "267",
      symbol: "BW",
    },
    {
      country: "Brazil",
      phoneCode: "55",
      symbol: "BR",
    },
    {
      country: "British Indian Ocean Territory",
      phoneCode: "246",
      symbol: "IO",
    },
    {
      country: "British Virgin Islands",
      phoneCode: "1-284",
      symbol: "VG",
    },
    {
      country: "Brunei",
      phoneCode: "673",
      symbol: "BN",
    },
    {
      country: "Bulgaria",
      phoneCode: "359",
      symbol: "BG",
    },
    {
      country: "Burkina Faso",
      phoneCode: "226",
      symbol: "BF",
    },
    {
      country: "Burundi",
      phoneCode: "257",
      symbol: "BI",
    },
    {
      country: "Cambodia",
      phoneCode: "855",
      symbol: "KH",
    },
    {
      country: "Cameroon",
      phoneCode: "237",
      symbol: "CM",
    },
    {
      country: "Canada",
      phoneCode: "1",
      symbol: "CA",
    },
    {
      country: "Cape Verde",
      phoneCode: "238",
      symbol: "CV",
    },
    {
      country: "Cayman Islands",
      phoneCode: "1-345",
      symbol: "KY",
    },
    {
      country: "Central African Republic",
      phoneCode: "236",
      symbol: "CF",
    },
    {
      country: "Chad",
      phoneCode: "235",
      symbol: "TD",
    },
    {
      country: "Chile",
      phoneCode: "56",
      symbol: "CL",
    },
    {
      country: "China",
      phoneCode: "86",
      symbol: "CN",
    },
    {
      country: "Christmas Island",
      phoneCode: "61",
      symbol: "CX",
    },
    {
      country: "Cocos Islands",
      phoneCode: "61",
      symbol: "CC",
    },
    {
      country: "Colombia",
      phoneCode: "57",
      symbol: "CO",
    },
    {
      country: "Comoros",
      phoneCode: "269",
      symbol: "KM",
    },
    {
      country: "Cook Islands",
      phoneCode: "682",
      symbol: "CK",
    },
    {
      country: "Costa Rica",
      phoneCode: "506",
      symbol: "CR",
    },
    {
      country: "Croatia",
      phoneCode: "385",
      symbol: "HR",
    },
    {
      country: "Cuba",
      phoneCode: "53",
      symbol: "CU",
    },
    {
      country: "Curacao",
      phoneCode: "599",
      symbol: "CW",
    },
    {
      country: "Cyprus",
      phoneCode: "357",
      symbol: "CY",
    },
    {
      country: "Czech Republic",
      phoneCode: "420",
      symbol: "CZ",
    },
    {
      country: "Democratic Republic of the Congo",
      phoneCode: "243",
      symbol: "CD",
    },
    {
      country: "Denmark",
      phoneCode: "45",
      symbol: "DK",
    },
    {
      country: "Djibouti",
      phoneCode: "253",
      symbol: "DJ",
    },
    {
      country: "Dominica",
      phoneCode: "1-767",
      symbol: "DM",
    },
    {
      country: "Dominican Republic",
      phoneCode: "1-809",
      symbol: "DO",
    },
    {
      country: "East Timor",
      phoneCode: "670",
      symbol: "TL",
    },
    {
      country: "Ecuador",
      phoneCode: "593",
      symbol: "EC",
    },
    {
      country: "Egypt",
      phoneCode: "20",
      symbol: "EG",
    },
    {
      country: "El Salvador",
      phoneCode: "503",
      symbol: "SV",
    },
    {
      country: "Equatorial Guinea",
      phoneCode: "240",
      symbol: "GQ",
    },
    {
      country: "Eritrea",
      phoneCode: "291",
      symbol: "ER",
    },
    {
      country: "Estonia",
      phoneCode: "372",
      symbol: "EE",
    },
    {
      country: "Ethiopia",
      phoneCode: "251",
      symbol: "ET",
    },
    {
      country: "Falkland Islands",
      phoneCode: "500",
      symbol: "FK",
    },
    {
      country: "Faroe Islands",
      phoneCode: "298",
      symbol: "FO",
    },
    {
      country: "Fiji",
      phoneCode: "679",
      symbol: "FJ",
    },
    {
      country: "Finland",
      phoneCode: "358",
      symbol: "FI",
    },
    {
      country: "France",
      phoneCode: "33",
      symbol: "FR",
    },
    {
      country: "French Polynesia",
      phoneCode: "689",
      symbol: "PF",
    },
    {
      country: "Gabon",
      phoneCode: "241",
      symbol: "GA",
    },
    {
      country: "Gambia",
      phoneCode: "220",
      symbol: "GM",
    },
    {
      country: "Georgia",
      phoneCode: "995",
      symbol: "GE",
    },
    {
      country: "Germany",
      phoneCode: "49",
      symbol: "DE",
    },
    {
      country: "Ghana",
      phoneCode: "233",
      symbol: "GH",
    },
    {
      country: "Gibraltar",
      phoneCode: "350",
      symbol: "GI",
    },
    {
      country: "Greece",
      phoneCode: "30",
      symbol: "GR",
    },
    {
      country: "Greenland",
      phoneCode: "299",
      symbol: "GL",
    },
    {
      country: "Grenada",
      phoneCode: "1-473",
      symbol: "GD",
    },
    {
      country: "Guam",
      phoneCode: "1-671",
      symbol: "GU",
    },
    {
      country: "Guatemala",
      phoneCode: "502",
      symbol: "GT",
    },
    {
      country: "Guernsey",
      phoneCode: "44-1481",
      symbol: "GG",
    },
    {
      country: "Guinea",
      phoneCode: "224",
      symbol: "GN",
    },
    {
      country: "Guinea-Bissau",
      phoneCode: "245",
      symbol: "GW",
    },
    {
      country: "Guyana",
      phoneCode: "592",
      symbol: "GY",
    },
    {
      country: "Haiti",
      phoneCode: "509",
      symbol: "HT",
    },
    {
      country: "Honduras",
      phoneCode: "504",
      symbol: "HN",
    },
    {
      country: "Hong Kong",
      phoneCode: "852",
      symbol: "HK",
    },
    {
      country: "Hungary",
      phoneCode: "36",
      symbol: "HU",
    },
    {
      country: "Iceland",
      phoneCode: "354",
      symbol: "IS",
    },
    {
      country: "India",
      phoneCode: "91",
      symbol: "IN",
    },
    {
      country: "Indonesia",
      phoneCode: "62",
      symbol: "ID",
    },
    {
      country: "Iran",
      phoneCode: "98",
      symbol: "IR",
    },
    {
      country: "Iraq",
      phoneCode: "964",
      symbol: "IQ",
    },
    {
      country: "Ireland",
      phoneCode: "353",
      symbol: "IE",
    },
    {
      country: "Isle of Man",
      phoneCode: "44-1624",
      symbol: "IM",
    },
    {
      country: "Israel",
      phoneCode: "972",
      symbol: "IL",
    },
    {
      country: "Italy",
      phoneCode: "39",
      symbol: "IT",
    },
    {
      country: "Ivory Coast",
      phoneCode: "225",
      symbol: "CI",
    },
    {
      country: "Jamaica",
      phoneCode: "1-876",
      symbol: "JM",
    },
    {
      country: "Japan",
      phoneCode: "81",
      symbol: "JP",
    },
    {
      country: "Jersey",
      phoneCode: "44-1534",
      symbol: "JE",
    },
    {
      country: "Jordan",
      phoneCode: "962",
      symbol: "JO",
    },
    {
      country: "Kazakhstan",
      phoneCode: "7",
      symbol: "KZ",
    },
    {
      country: "Kenya",
      phoneCode: "254",
      symbol: "KE",
    },
    {
      country: "Kiribati",
      phoneCode: "686",
      symbol: "KI",
    },
    {
      country: "Kosovo",
      phoneCode: "383",
      symbol: "XK",
    },
    {
      country: "Kuwait",
      phoneCode: "965",
      symbol: "KW",
    },
    {
      country: "Kyrgyzstan",
      phoneCode: "996",
      symbol: "KG",
    },
    {
      country: "Laos",
      phoneCode: "856",
      symbol: "LA",
    },
    {
      country: "Latvia",
      phoneCode: "371",
      symbol: "LV",
    },
    {
      country: "Lebanon",
      phoneCode: "961",
      symbol: "LB",
    },
    {
      country: "Lesotho",
      phoneCode: "266",
      symbol: "LS",
    },
    {
      country: "Liberia",
      phoneCode: "231",
      symbol: "LR",
    },
    {
      country: "Libya",
      phoneCode: "218",
      symbol: "LY",
    },
    {
      country: "Liechtenstein",
      phoneCode: "423",
      symbol: "LI",
    },
    {
      country: "Lithuania",
      phoneCode: "370",
      symbol: "LT",
    },
    {
      country: "Luxembourg",
      phoneCode: "352",
      symbol: "LU",
    },
    {
      country: "Macau",
      phoneCode: "853",
      symbol: "MO",
    },
    {
      country: "Macedonia",
      phoneCode: "389",
      symbol: "MK",
    },
    {
      country: "Madagascar",
      phoneCode: "261",
      symbol: "MG",
    },
    {
      country: "Malawi",
      phoneCode: "265",
      symbol: "MW",
    },
    {
      country: "Malaysia",
      phoneCode: "60",
      symbol: "MY",
    },
    {
      country: "Maldives",
      phoneCode: "960",
      symbol: "MV",
    },
    {
      country: "Mali",
      phoneCode: "223",
      symbol: "ML",
    },
    {
      country: "Malta",
      phoneCode: "356",
      symbol: "MT",
    },
    {
      country: "Marshall Islands",
      phoneCode: "692",
      symbol: "MH",
    },
    {
      country: "Mauritania",
      phoneCode: "222",
      symbol: "MR",
    },
    {
      country: "Mauritius",
      phoneCode: "230",
      symbol: "MU",
    },
    {
      country: "Mexico",
      phoneCode: "52",
      symbol: "MX",
    },
    {
      country: "Micronesia",
      phoneCode: "691",
      symbol: "FM",
    },
    {
      country: "Moldova",
      phoneCode: "373",
      symbol: "MD",
    },
    {
      country: "Monaco",
      phoneCode: "377",
      symbol: "MC",
    },
    {
      country: "Mongolia",
      phoneCode: "976",
      symbol: "MN",
    },
    {
      country: "Montenegro",
      phoneCode: "382",
      symbol: "ME",
    },
    {
      country: "Morocco",
      phoneCode: "212",
      symbol: "MA",
    },
    {
      country: "Mozambique",
      phoneCode: "258",
      symbol: "MZ",
    },
    {
      country: "Myanmar",
      phoneCode: "95",
      symbol: "MM",
    },
    {
      country: "Namibia",
      phoneCode: "264",
      symbol: "NA",
    },
    {
      country: "Nepal",
      phoneCode: "977",
      symbol: "NP",
    },
    {
      country: "Netherlands",
      phoneCode: "31",
      symbol: "NL",
    },
    {
      country: "New Caledonia",
      phoneCode: "687",
      symbol: "NC",
    },
    {
      country: "New Zealand",
      phoneCode: "64",
      symbol: "NZ",
    },
    {
      country: "Nicaragua",
      phoneCode: "505",
      symbol: "NI",
    },
    {
      country: "Niger",
      phoneCode: "227",
      symbol: "NE",
    },
    {
      country: "Nigeria",
      phoneCode: "234",
      symbol: "NG",
    },
    {
      country: "North Korea",
      phoneCode: "850",
      symbol: "KP",
    },
    {
      country: "Norway",
      phoneCode: "47",
      symbol: "NO",
    },
    {
      country: "Oman",
      phoneCode: "968",
      symbol: "OM",
    },
    {
      country: "Pakistan",
      phoneCode: "92",
      symbol: "PK",
    },
    {
      country: "Palau",
      phoneCode: "680",
      symbol: "PW",
    },
    {
      country: "Palestine",
      phoneCode: "970",
      symbol: "PS",
    },
    {
      country: "Panama",
      phoneCode: "507",
      symbol: "PA",
    },
    {
      country: "Papua New Guinea",
      phoneCode: "675",
      symbol: "PG",
    },
    {
      country: "Paraguay",
      phoneCode: "595",
      symbol: "PY",
    },
    {
      country: "Peru",
      phoneCode: "51",
      symbol: "PE",
    },
    {
      country: "Philippines",
      phoneCode: "63",
      symbol: "PH",
    },
    {
      country: "Poland",
      phoneCode: "48",
      symbol: "PL",
    },
    {
      country: "Portugal",
      phoneCode: "351",
      symbol: "PT",
    },
    {
      country: "Puerto Rico",
      phoneCode: "1-787",
      symbol: "PR",
    },
    {
      country: "Qatar",
      phoneCode: "974",
      symbol: "QA",
    },
    {
      country: "Republic of the Congo",
      phoneCode: "242",
      symbol: "CG",
    },
    {
      country: "Romania",
      phoneCode: "40",
      symbol: "RO",
    },
    {
      country: "Russia",
      phoneCode: "7",
      symbol: "RU",
    },
    {
      country: "Rwanda",
      phoneCode: "250",
      symbol: "RW",
    },
    {
      country: "Saint Kitts and Nevis",
      phoneCode: "1-869",
      symbol: "KN",
    },
    {
      country: "Saint Lucia",
      phoneCode: "1-758",
      symbol: "LC",
    },
    {
      country: "Saint Vincent and the Grenadines",
      phoneCode: "1-784",
      symbol: "VC",
    },
    {
      country: "Samoa",
      phoneCode: "685",
      symbol: "WS",
    },
    {
      country: "San Marino",
      phoneCode: "378",
      symbol: "SM",
    },
    {
      country: "Sao Tome and Principe",
      phoneCode: "239",
      symbol: "ST",
    },
    {
      country: "Saudi Arabia",
      phoneCode: "966",
      symbol: "SA",
    },
    {
      country: "Senegal",
      phoneCode: "221",
      symbol: "SN",
    },
    {
      country: "Serbia",
      phoneCode: "381",
      symbol: "RS",
    },
    {
      country: "Seychelles",
      phoneCode: "248",
      symbol: "SC",
    },
    {
      country: "Sierra Leone",
      phoneCode: "232",
      symbol: "SL",
    },
    {
      country: "Singapore",
      phoneCode: "65",
      symbol: "SG",
    },
    {
      country: "Slovakia",
      phoneCode: "421",
      symbol: "SK",
    },
    {
      country: "Slovenia",
      phoneCode: "386",
      symbol: "SI",
    },
    {
      country: "Solomon Islands",
      phoneCode: "677",
      symbol: "SB",
    },
    {
      country: "Somalia",
      phoneCode: "252",
      symbol: "SO",
    },
    {
      country: "South Africa",
      phoneCode: "27",
      symbol: "ZA",
    },
    {
      country: "South Korea",
      phoneCode: "82",
      symbol: "KR",
    },
    {
      country: "South Sudan",
      phoneCode: "211",
      symbol: "SS",
    },
    {
      country: "Spain",
      phoneCode: "34",
      symbol: "ES",
    },
    {
      country: "Sri Lanka",
      phoneCode: "94",
      symbol: "LK",
    },
    {
      country: "Sudan",
      phoneCode: "249",
      symbol: "SD",
    },
    {
      country: "Suriname",
      phoneCode: "597",
      symbol: "SR",
    },
    {
      country: "Swaziland",
      phoneCode: "268",
      symbol: "SZ",
    },
    {
      country: "Sweden",
      phoneCode: "46",
      symbol: "SE",
    },
    {
      country: "Switzerland",
      phoneCode: "41",
      symbol: "CH",
    },
    {
      country: "Syria",
      phoneCode: "963",
      symbol: "SY",
    },
    {
      country: "Taiwan",
      phoneCode: "886",
      symbol: "TW",
    },
    {
      country: "Tajikistan",
      phoneCode: "992",
      symbol: "TJ",
    },
    {
      country: "Tanzania",
      phoneCode: "255",
      symbol: "TZ",
    },
    {
      country: "Thailand",
      phoneCode: "66",
      symbol: "TH",
    },
    {
      country: "Togo",
      phoneCode: "228",
      symbol: "TG",
    },
    {
      country: "Tonga",
      phoneCode: "676",
      symbol: "TO",
    },
    {
      country: "Trinidad and Tobago",
      phoneCode: "1-868",
      symbol: "TT",
    },
    {
      country: "Tunisia",
      phoneCode: "216",
      symbol: "TN",
    },
    {
      country: "Turkey",
      phoneCode: "90",
      symbol: "TR",
    },
    {
      country: "Turkmenistan",
      phoneCode: "993",
      symbol: "TM",
    },
    {
      country: "Uganda",
      phoneCode: "256",
      symbol: "UG",
    },
    {
      country: "Ukraine",
      phoneCode: "380",
      symbol: "UA",
    },
    {
      country: "United Arab Emirates",
      phoneCode: "971",
      symbol: "AE",
    },
    {
      country: "United Kingdom",
      phoneCode: "44",
      symbol: "GB",
    },
    {
      country: "United States",
      phoneCode: "1",
      symbol: "US",
    },
    {
      country: "Uruguay",
      phoneCode: "598",
      symbol: "UY",
    },
    {
      country: "Uzbekistan",
      phoneCode: "998",
      symbol: "UZ",
    },
    {
      country: "Vanuatu",
      phoneCode: "678",
      symbol: "VU",
    },
    {
      country: "Vatican",
      phoneCode: "379",
      symbol: "VA",
    },
    {
      country: "Venezuela",
      phoneCode: "58",
      symbol: "VE",
    },
    {
      country: "Vietnam",
      phoneCode: "84",
      symbol: "VN",
    },
    {
      country: "Yemen",
      phoneCode: "967",
      symbol: "YE",
    },
    {
      country: "Zambia",
      phoneCode: "260",
      symbol: "ZM",
    },
    {
      country: "Zimbabwe",
      phoneCode: "263",
      symbol: "ZW",
    },
  ];
  
  export default countryCodes;