/** Static PFP map for founder chemistry — name/nickname → image URL */
const founderPfps: Record<string, string> = {
  // Shubham Kukreti — has photo
  "shubham kukreti":
    "https://proxy.cdn.zo.xyz/gallery/media/images/7c56bd50-c4a4-452c-97b8-d7bbae0313ea_20260405101157.png",
  shubham:
    "https://proxy.cdn.zo.xyz/gallery/media/images/7c56bd50-c4a4-452c-97b8-d7bbae0313ea_20260405101157.png",

  // Tejas Arun — has photo
  "tejas arun":
    "https://proxy.cdn.zo.xyz/gallery/media/images/16efd133-7210-47cc-9215-d06d5e681272_20260405101200.png",
  tejas:
    "https://proxy.cdn.zo.xyz/gallery/media/images/16efd133-7210-47cc-9215-d06d5e681272_20260405101200.png",

  // Dibyo Majumder — has photo
  "dibyo majumder":
    "https://proxy.cdn.zo.xyz/gallery/media/images/c1a7b13e-adfd-4db2-9b21-a1d79cacd1bf_20260405101201.png",
  dibyo:
    "https://proxy.cdn.zo.xyz/gallery/media/images/c1a7b13e-adfd-4db2-9b21-a1d79cacd1bf_20260405101201.png",

  // Kush Ratna Gupta — has photo
  "kush ratna gupta":
    "https://proxy.cdn.zo.xyz/gallery/media/images/c0c15d54-65d6-4d09-a6f5-ae543d825542_20260405101201.png",
  kush:
    "https://proxy.cdn.zo.xyz/gallery/media/images/c0c15d54-65d6-4d09-a6f5-ae543d825542_20260405101201.png",

  // Roshan Vadassery — has photo
  "roshan vadassery":
    "https://proxy.cdn.zo.xyz/gallery/media/images/bde18556-8fc3-4cf9-b793-d3d4192cfeee_20260405101202.png",
  roshan:
    "https://proxy.cdn.zo.xyz/gallery/media/images/bde18556-8fc3-4cf9-b793-d3d4192cfeee_20260405101202.png",

  // Fiona Bao — has photo
  "fiona bao":
    "https://proxy.cdn.zo.xyz/gallery/media/images/949d721b-ad1d-420f-9f43-bfc030b8ccd8_20260405101203.png",
  fiona:
    "https://proxy.cdn.zo.xyz/gallery/media/images/949d721b-ad1d-420f-9f43-bfc030b8ccd8_20260405101203.png",

  // Akash Chaudhary — has photo
  "akash chaudhary":
    "https://proxy.cdn.zo.xyz/gallery/media/images/ea13d805-42fd-4c9c-bf47-1abfb4ae343e_20260405101204.png",
  akash:
    "https://proxy.cdn.zo.xyz/gallery/media/images/ea13d805-42fd-4c9c-bf47-1abfb4ae343e_20260405101204.png",

  // Saumya Saxena — pfp only (avatar)
  "saumya saxena":
    "https://proxy.cdn.zo.xyz/citizenship/images/a0428364-9178-4279-b2ed-8f414932cfa7.svg",
  saumya:
    "https://proxy.cdn.zo.xyz/citizenship/images/a0428364-9178-4279-b2ed-8f414932cfa7.svg",

  // Anoushk Kharangate — pfp only (avatar)
  "anoushk kharangate":
    "https://proxy.cdn.zo.xyz/citizenship/images/138ca966-6ade-44fa-98d7-674d77a45f94.svg",
  anoushk:
    "https://proxy.cdn.zo.xyz/citizenship/images/138ca966-6ade-44fa-98d7-674d77a45f94.svg",

  // Venkat Kunisetty — pfp only (avatar)
  "venkat kunisetty":
    "https://proxy.cdn.zo.xyz/citizenship/images/bc1c9536-8df9-4358-9c36-edb348530508.svg",
  venkat:
    "https://proxy.cdn.zo.xyz/citizenship/images/bc1c9536-8df9-4358-9c36-edb348530508.svg",

  // Mrigank Bhargava — pfp only (avatar)
  "mrigank bhargava":
    "https://proxy.cdn.zo.xyz/citizenship/images/7f9de2ca-824c-469f-a5d6-0443c620ce43.svg",
  mrigank:
    "https://proxy.cdn.zo.xyz/citizenship/images/7f9de2ca-824c-469f-a5d6-0443c620ce43.svg",

  // Rishabh Keshan — pfp only (avatar)
  "rishabh keshan":
    "https://proxy.cdn.zo.xyz/citizenship/images/fc4e303d-9e26-49d8-be9d-870d6fff496f.svg",
  rishabh:
    "https://proxy.cdn.zo.xyz/citizenship/images/fc4e303d-9e26-49d8-be9d-870d6fff496f.svg",

  // Gathin — pfp only (avatar), single name
  gathin:
    "https://proxy.cdn.zo.xyz/citizenship/images/518432cc-cf8e-43f8-880c-72138dc83660.svg",

  // Sukriti Taneja — pfp only (avatar)
  "sukriti taneja":
    "https://proxy.cdn.zo.xyz/citizenship/images/94d0fb6e-4a6c-4646-8882-40633e190463_xEbQ6t1.svg",
  sukriti:
    "https://proxy.cdn.zo.xyz/citizenship/images/94d0fb6e-4a6c-4646-8882-40633e190463_xEbQ6t1.svg",

  // Aadith Narayanan — pfp only (avatar)
  "aadith narayanan":
    "https://proxy.cdn.zo.xyz/citizenship/images/51154477-4d35-4a34-b810-5939a437991d.svg",
  aadith:
    "https://proxy.cdn.zo.xyz/citizenship/images/51154477-4d35-4a34-b810-5939a437991d.svg",

  // Mohit Sorout — pfp only (avatar)
  "mohit sorout":
    "https://proxy.cdn.zo.xyz/citizenship/images/ce280622-9e84-41d4-b028-229fd843a167.svg",
  mohit:
    "https://proxy.cdn.zo.xyz/citizenship/images/ce280622-9e84-41d4-b028-229fd843a167.svg",

  // Ali Azar — no pfp, no photo (skipped)

  // Abhay Tandon — pfp only (avatar)
  "abhay tandon":
    "https://proxy.cdn.zo.xyz/citizenship/images/3c16f360-e842-4b63-b1fe-7e02c9ebaa78.svg",
  abhay:
    "https://proxy.cdn.zo.xyz/citizenship/images/3c16f360-e842-4b63-b1fe-7e02c9ebaa78.svg",

  // Ajeet Khurana — has photo (local path) + pfp (avatar); using pfp since photo is local /mentors/ path
  "ajeet khurana":
    "https://proxy.cdn.zo.xyz/citizenship/images/9e509c21-196b-4b7b-8bae-2097c126d683.svg",
  ajeet:
    "https://proxy.cdn.zo.xyz/citizenship/images/9e509c21-196b-4b7b-8bae-2097c126d683.svg",

  // Dharamveer Singh Chouhan — photo only (local path /mentors/dharamveer.png), no CDN pfp
  "dharamveer singh chouhan": "/mentors/dharamveer.png",
  dharamveer: "/mentors/dharamveer.png",

  // Lisa Ray — photo only (local path /mentors/lisa-ray.png)
  "lisa ray": "/mentors/lisa-ray.png",
  lisaray: "/mentors/lisa-ray.png",

  // Kartikey Sharma — photo only (local path /mentors/kartikey.png)
  "kartikey sharma": "/mentors/kartikey.png",
  kartikey: "/mentors/kartikey.png",

  // Kratex — photo only (local path /mentors/kratex.png), single name
  kratex: "/mentors/kratex.png",

  // Shabbir YK — photo only (local path /mentors/shabbir.jpeg)
  "shabbir yk": "/mentors/shabbir.jpeg",
  shabbiryk: "/mentors/shabbir.jpeg",
};

export default founderPfps;
