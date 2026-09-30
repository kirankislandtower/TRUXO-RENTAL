export const companyProfile = {
  about: "Truxo Heavy Equipment Rental is a trusted regional provider of heavy machinery and material handling solutions. We specialise in delivering safe, reliable, and cost-effective equipment to infrastructure projects of all scales, ensuring operational excellence from ground-breaking to completion.",
  bullets: [
    "Trusted partner for heavy lifting solutions",
    "Commitment to 24/7 technical support",
    "Serving residential & industrial sectors",
    "UAE-wide rapid deployment network"
  ],
  vision: "To be the preferred heavy equipment partner in the Middle East, recognized for setting the industry standard in machinery quality, technical innovation, and customer-first service excellence.",
  mission: "To empower infrastructure growth by providing a modern, high-performance fleet supported by rigorous maintenance standards and a passionate team dedicated to client success and safety."
};

export const fleetInventory = [
  { id: 1, category: "Forklift", brand: "Forklift", type: "Forklift", year: 2018, location: "Dubai", plate: "W/82185", color: "Yellow", qty: 2 },
  { id: 2, category: "JCB", brand: "Bobcat", type: "Bobcat", year: 2022, location: "Dubai", plate: "U/69812", color: "Yellow/Black", qty: 1 },
  { id: 3, category: "DEVELON", brand: "DEVELON DX190WA", type: "Wheel Excavator", year: 2024, location: "Dubai", plate: "DD81685", color: "Orange Gray", qty: 1 },
  { id: 4, category: "Forklift", brand: "Forklift", type: "Forklift", year: 2024, location: "Dubai", plate: "Z /15095", color: "Yellow", qty: 1 },
  { id: 5, category: "Hyundai", brand: "HX220HD", type: "Chain Excavator", year: 2025, location: "Dubai", plate: "DD/93436", color: "Yellow", qty: 1 },
  { id: 6, category: "DEVELON", brand: "DEVELON DX190WA (new)", type: "Wheel Excavator", year: 2026, location: "Dubai", plate: "I/71049", color: "Orange", qty: 1 },
  { id: 7, category: "DEVELON", brand: "DEVELON DX190WA (new)", type: "Wheel Excavator", year: 2026, location: "Dubai", plate: "U/34364", color: "Orange", qty: 1 },
];

export const services = [
  {
    title: "Excavators",
    slug: "excavator-rental-dubai",
    desc: "Our excavators are designed for heavy-duty earthmoving and construction applications. They are ideal for excavation, trenching, foundation work, demolition, site preparation, and material handling.",
    tagline: "Mini to heavy excavators for digging, trenching and demolition work.",
    useCases: [
      "Excavation and trenching for foundations and utilities",
      "Demolition and site clearance",
      "Bulk material handling and loading",
      "Landscaping and grading",
      "Road and infrastructure works",
    ],
  },
  {
    title: "Forklifts",
    slug: "forklift-rental-dubai",
    desc: "Our forklifts are designed for efficient material handling, loading, unloading, stacking, and transportation of goods in warehouses, factories, logistics centers, and construction sites.",
    tagline: "Warehouse and site forklifts for fast, safe material handling.",
    useCases: [
      "Loading and unloading containers and trucks",
      "Warehouse racking and stacking",
      "Construction site material movement",
      "Logistics and distribution centers",
      "Factory and production floor handling",
    ],
  },
  {
    // Renamed from "Wheel Shovels" — "wheel loader" is the term people actually
    // search for; the old name is kept as a synonym in the copy below.
    title: "Wheel Loaders",
    slug: "wheel-loader-rental-dubai",
    desc: "Our wheel loaders (also known as wheel shovels or front-end loaders) are built for efficient loading, transporting, and stockpiling of materials such as sand, gravel, soil, and aggregates.",
    tagline: "Front-end loaders for moving and stockpiling bulk materials.",
    useCases: [
      "Loading sand, gravel and aggregates onto trucks",
      "Stockpiling and site material management",
      "Backfilling trenches and excavations",
      "Quarry, industrial yard and warehouse handling",
      "Site clearing and grading support",
    ],
  },
  {
    title: "Cranes",
    slug: "crane-rental-dubai",
    desc: "We provide a comprehensive fleet of cranes ranging from 5-ton to 100-ton lifting capacity, including mobile cranes for versatile lifting operations.",
    tagline: "Mobile cranes from 5 to 100 tons for lifting and installation.",
    useCases: [
      "Structural steel and precast erection",
      "Equipment installation and positioning",
      "Tower crane component lifts",
      "Pipeline and infrastructure lifts",
      "High-rise and industrial project support",
    ],
  },
  {
    title: "Trucks",
    slug: "truck-rental-dubai",
    desc: "Our trucks provide reliable and efficient transportation solutions for construction, industrial, and logistics operations. Built for durability and high performance.",
    tagline: "Flatbeds, tippers and haulage trucks for site transport.",
    useCases: [
      "Transporting heavy machinery between sites",
      "Hauling construction materials and aggregates",
      "Waste and debris removal",
      "Long-haul logistics across the UAE",
      "Site-to-site equipment mobilization",
    ],
  }
];

export const industries = [
  { title: "Construction & Infrastructure", desc: "Roads, bridges, buildings, towers and large-scale infrastructure development." },
  { title: "Manufacturing & Warehousing", desc: "Factories, production plants and warehouse material handling operations." },
  { title: "Oil & Gas / Industrial", desc: "Refineries, pipelines, industrial plants and energy sector support services." },
  { title: "Logistics & Government", desc: "Ports, marine operations, logistics hubs and government projects." }
];

export const whyChooseUs = [
  { title: "Modern Fleet", desc: "Our fleet is regularly inspected, serviced and maintained to ensure peak performance and reliability on every project." },
  { title: "Competitive Rates", desc: "We offer competitive rental rates without compromising on equipment quality or service standards." },
  { title: "Rapid Deployment", desc: "Quick mobilization and deployment of equipment to your project site anywhere in the UAE." },
  { title: "Flexible Contracts", desc: "Flexible rental agreements tailored to your project timeline and budget requirements." },
];

export const productivityComparison = [
  { task: "soil moved / hour", manual: 2, heavy: 40, unit: "tons" },
  { task: "land cleared / hour", manual: 20, heavy: 400, unit: "m²" },
  { task: "materials transported", manual: 1, heavy: 25, unit: "tons" }
];

export const operationTrends = [
  { phase: "Project Start", value: 40 },
  { phase: "Land Clearing", value: 85 },
  { phase: "Foundation", value: 70 },
  { phase: "Structure", value: 55 },
  { phase: "Final Work", value: 30 }
];

export const workBreakdown = [
  { label: "Earth moving", percentage: 40, color: "#A51A1A" },
  { label: "Material transport", percentage: 25, color: "#FF7C00" },
  { label: "Road leveling", percentage: 20, color: "#2D7F4C" },
  { label: "Site preparation", percentage: 15, color: "#111113" }
];
