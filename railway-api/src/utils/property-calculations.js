// Property calculation utilities for accurate expense estimation

// Parse bedroom/bathroom strings that may contain "X + Y" format
function parseBedroomBathroomValue(value) {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'string') return 0;
  
  // Check for "X + Y" format (e.g., "4 + 2" or "3.5 + 1")
  const plusPattern = /(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)/;
  const match = value.match(plusPattern);
  
  if (match) {
    const main = parseFloat(match[1]);
    const additional = parseFloat(match[2]);
    return main + additional;
  }
  
  // Try to extract a single number
  const singleMatch = value.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }
  
  return 0;
}

// Property tax rates by Canadian cities (2024 rates)
// Sources: Municipal websites, tax calculators, and official property tax documents
const PROPERTY_TAX_RATES = {
  // ONTARIO - Greater Toronto Area
  'toronto': 0.0061, // 0.61%
  'mississauga': 0.0085, // 0.85%
  'brampton': 0.0112, // 1.12%
  'markham': 0.0074, // 0.74%
  'vaughan': 0.0078, // 0.78%
  'richmond hill': 0.0067, // 0.67%
  'aurora': 0.0070, // 0.70%
  'newmarket': 0.0072, // 0.72%
  'king': 0.0060, // 0.60%
  'whitchurch-stouffville': 0.0065, // 0.65%
  'east gwillimbury': 0.0068, // 0.68%
  'georgina': 0.0090, // 0.90%
  'bradford west gwillimbury': 0.0090, // 0.90%
  
  // ONTARIO - Durham Region
  'pickering': 0.0114, // 1.14%
  'ajax': 0.0114, // 1.14%
  'whitby': 0.0114, // 1.14%
  'oshawa': 0.0133, // 1.33%
  'clarington': 0.0115, // 1.15%
  'scugog': 0.0112, // 1.12%
  'uxbridge': 0.0098, // 0.98%
  'brock': 0.0110, // 1.10%
  
  // ONTARIO - Halton Region
  'oakville': 0.0076, // 0.76%
  'burlington': 0.0085, // 0.85%
  'milton': 0.0098, // 0.98%
  'halton hills': 0.0088, // 0.88%
  
  // ONTARIO - Peel Region
  'caledon': 0.0085, // 0.85%
  
  // ONTARIO - Hamilton & Niagara
  'hamilton': 0.0130, // 1.30%
  'st catharines': 0.0146, // 1.46%
  'niagara falls': 0.0146, // 1.46%
  'welland': 0.0158, // 1.58%
  'fort erie': 0.0139, // 1.39%
  'port colborne': 0.0157, // 1.57%
  'thorold': 0.0152, // 1.52%
  'niagara-on-the-lake': 0.0094, // 0.94%
  'pelham': 0.0123, // 1.23%
  'lincoln': 0.0126, // 1.26%
  'grimsby': 0.0126, // 1.26%
  'west lincoln': 0.0127, // 1.27%
  
  // ONTARIO - Waterloo Region
  'waterloo': 0.0104, // 1.04%
  'kitchener': 0.0116, // 1.16%
  'cambridge': 0.0113, // 1.13%
  'woolwich': 0.0092, // 0.92%
  'wilmot': 0.0098, // 0.98%
  'wellesley': 0.0095, // 0.95%
  'north dumfries': 0.0098, // 0.98%
  
  // ONTARIO - Other Major Cities
  'ottawa': 0.0111, // 1.11%
  'london': 0.0138, // 1.38%
  'windsor': 0.0179, // 1.79%
  'guelph': 0.0123, // 1.23%
  'barrie': 0.0110, // 1.10%
  'kingston': 0.0152, // 1.52%
  'thunder bay': 0.0152, // 1.52%
  'sudbury': 0.0146, // 1.46%
  'peterborough': 0.0147, // 1.47%
  'brantford': 0.0146, // 1.46%
  'belleville': 0.0167, // 1.67%
  'sarnia': 0.0144, // 1.44%
  'north bay': 0.0147, // 1.47%
  'sault ste marie': 0.0169, // 1.69%
  'timmins': 0.0184, // 1.84%
  'cornwall': 0.0168, // 1.68%
  'woodstock': 0.0124, // 1.24%
  'stratford': 0.0145, // 1.45%
  'orillia': 0.0140, // 1.40%
  'orangeville': 0.0110, // 1.10%
  'collingwood': 0.0111, // 1.11%
  'owen sound': 0.0168, // 1.68%
  'midland': 0.0133, // 1.33%
  'cobourg': 0.0140, // 1.40%
  'brockville': 0.0167, // 1.67%
  'pembroke': 0.0170, // 1.70%
  'petawawa': 0.0129, // 1.29%
  'hawkesbury': 0.0143, // 1.43%
  'north perth': 0.0159, // 1.59%
  'carleton place': 0.0147, // 1.47%
  'smiths falls': 0.0175, // 1.75%
  'kawartha lakes': 0.0135, // 1.35%
  'innisfil': 0.0089, // 0.89%
  'new tecumseth': 0.0094, // 0.94%
  
  // BRITISH COLUMBIA - Lower Mainland
  'vancouver': 0.0025, // 0.25%
  'burnaby': 0.0033, // 0.33%
  'richmond': 0.0034, // 0.34%
  'surrey': 0.0045, // 0.45%
  'new westminster': 0.0039, // 0.39%
  'coquitlam': 0.0038, // 0.38%
  'port coquitlam': 0.0046, // 0.46%
  'port moody': 0.0035, // 0.35%
  'north vancouver': 0.0029, // 0.29%
  'west vancouver': 0.0022, // 0.22%
  'delta': 0.0038, // 0.38%
  'langley': 0.0046, // 0.46%
  'langley township': 0.0042, // 0.42%
  'maple ridge': 0.0045, // 0.45%
  'pitt meadows': 0.0050, // 0.50%
  'white rock': 0.0038, // 0.38%
  'lions bay': 0.0024, // 0.24%
  'bowen island': 0.0028, // 0.28%
  
  // BRITISH COLUMBIA - Fraser Valley
  'abbotsford': 0.0048, // 0.48%
  'chilliwack': 0.0055, // 0.55%
  'mission': 0.0044, // 0.44%
  'hope': 0.0068, // 0.68%
  'agassiz': 0.0063, // 0.63%
  'harrison hot springs': 0.0060, // 0.60%
  
  // BRITISH COLUMBIA - Vancouver Island
  'victoria': 0.0050, // 0.50%
  'saanich': 0.0041, // 0.41%
  'oak bay': 0.0042, // 0.42%
  'esquimalt': 0.0076, // 0.76%
  'central saanich': 0.0040, // 0.40%
  'north saanich': 0.0034, // 0.34%
  'sidney': 0.0044, // 0.44%
  'view royal': 0.0048, // 0.48%
  'colwood': 0.0052, // 0.52%
  'langford': 0.0053, // 0.53%
  'metchosin': 0.0046, // 0.46%
  'sooke': 0.0056, // 0.56%
  'nanaimo': 0.0070, // 0.70%
  'duncan': 0.0074, // 0.74%
  'courtenay': 0.0066, // 0.66%
  'campbell river': 0.0091, // 0.91%
  'parksville': 0.0062, // 0.62%
  'qualicum beach': 0.0059, // 0.59%
  'port alberni': 0.0103, // 1.03%
  'comox': 0.0066, // 0.66%
  'ladysmith': 0.0068, // 0.68%
  
  // BRITISH COLUMBIA - Interior
  'kelowna': 0.0052, // 0.52%
  'kamloops': 0.0067, // 0.67%
  'vernon': 0.0066, // 0.66%
  'penticton': 0.0064, // 0.64%
  'prince george': 0.0095, // 0.95%
  'williams lake': 0.0084, // 0.84%
  'quesnel': 0.0100, // 1.00%
  'cranbrook': 0.0076, // 0.76%
  'nelson': 0.0060, // 0.60%
  'castlegar': 0.0074, // 0.74%
  'trail': 0.0091, // 0.91%
  'rossland': 0.0063, // 0.63%
  'revelstoke': 0.0054, // 0.54%
  'salmon arm': 0.0061, // 0.61%
  'enderby': 0.0072, // 0.72%
  'armstrong': 0.0067, // 0.67%
  'oliver': 0.0063, // 0.63%
  'osoyoos': 0.0063, // 0.63%
  'merritt': 0.0079, // 0.79%
  'princeton': 0.0096, // 0.96%
  'golden': 0.0058, // 0.58%
  'invermere': 0.0059, // 0.59%
  'fernie': 0.0055, // 0.55%
  'kimberley': 0.0062, // 0.62%
  'fort st john': 0.0118, // 1.18%
  'dawson creek': 0.0120, // 1.20%
  'prince rupert': 0.0120, // 1.20%
  'terrace': 0.0110, // 1.10%
  'kitimat': 0.0103, // 1.03%
  
  // ALBERTA
  'calgary': 0.0064, // 0.64%
  'edmonton': 0.0087, // 0.87%
  'red deer': 0.0098, // 0.98%
  'lethbridge': 0.0086, // 0.86%
  'medicine hat': 0.0068, // 0.68%
  'airdrie': 0.0056, // 0.56%
  'st albert': 0.0058, // 0.58%
  'sherwood park': 0.0072, // 0.72%
  'fort mcmurray': 0.0065, // 0.65%
  'chestermere': 0.0048, // 0.48%
  'cochrane': 0.0055, // 0.55%
  'okotoks': 0.0058, // 0.58%
  'spruce grove': 0.0077, // 0.77%
  'fort saskatchewan': 0.0074, // 0.74%
  'leduc': 0.0084, // 0.84%
  'beaumont': 0.0066, // 0.66%
  'grande prairie': 0.0085, // 0.85%
  'camrose': 0.0092, // 0.92%
  'lloydminster': 0.0110, // 1.10%
  'brooks': 0.0093, // 0.93%
  'cold lake': 0.0084, // 0.84%
  'lacombe': 0.0102, // 1.02%
  'wetaskiwin': 0.0108, // 1.08%
  'canmore': 0.0038, // 0.38%
  'sylvan lake': 0.0076, // 0.76%
  'stony plain': 0.0084, // 0.84%
  'strathmore': 0.0067, // 0.67%
  'high river': 0.0071, // 0.71%
  'blackfalds': 0.0078, // 0.78%
  'taber': 0.0100, // 1.00%
  'edson': 0.0098, // 0.98%
  'hinton': 0.0073, // 0.73%
  'banff': 0.0055, // 0.55%
  'jasper': 0.0062, // 0.62%
  'drumheller': 0.0118, // 1.18%
  
  // QUEBEC
  'montreal': 0.0076, // 0.76%
  'quebec': 0.0095, // 0.95%
  'laval': 0.0078, // 0.78%
  'gatineau': 0.0095, // 0.95%
  'longueuil': 0.0085, // 0.85%
  'sherbrooke': 0.0099, // 0.99%
  'levis': 0.0090, // 0.90%
  'trois rivieres': 0.0125, // 1.25%
  'terrebonne': 0.0083, // 0.83%
  'jean sur richelieu': 0.0099, // 0.99%
  'repentigny': 0.0084, // 0.84%
  'brossard': 0.0085, // 0.85%
  'drummondville': 0.0106, // 1.06%
  'saint jerome': 0.0092, // 0.92%
  'granby': 0.0109, // 1.09%
  'blainville': 0.0077, // 0.77%
  'dollard des ormeaux': 0.0074, // 0.74%
  'mirabel': 0.0070, // 0.70%
  'mascouche': 0.0080, // 0.80%
  'saint hyacinthe': 0.0111, // 1.11%
  'shawinigan': 0.0134, // 1.34%
  'chateauguay': 0.0086, // 0.86%
  'rimouski': 0.0123, // 1.23%
  'saguenay': 0.0104, // 1.04%
  'rouyn noranda': 0.0105, // 1.05%
  'saint georges': 0.0099, // 0.99%
  'saint laurent': 0.0076, // 0.76%
  'alma': 0.0115, // 1.15%
  'sept iles': 0.0121, // 1.21%
  'val d\'or': 0.0103, // 1.03%
  'saint eustache': 0.0079, // 0.79%
  'vaudreuil dorion': 0.0074, // 0.74%
  'beaconsfield': 0.0068, // 0.68%
  'baie comeau': 0.0130, // 1.30%
  'sainte julie': 0.0077, // 0.77%
  'varennes': 0.0079, // 0.79%
  'kirkland': 0.0070, // 0.70%
  'pointe claire': 0.0072, // 0.72%
  'mont royal': 0.0063, // 0.63%
  'westmount': 0.0058, // 0.58%
  'candiac': 0.0076, // 0.76%
  'cote saint luc': 0.0082, // 0.82%
  'saint constant': 0.0083, // 0.83%
  'sainte therese': 0.0084, // 0.84%
  'l\'assomption': 0.0091, // 0.91%
  'mount royal': 0.0063, // 0.63%
  
  // MANITOBA
  'winnipeg': 0.0124, // 1.24%
  'brandon': 0.0177, // 1.77%
  'steinbach': 0.0132, // 1.32%
  'portage la prairie': 0.0250, // 2.50%
  'thompson': 0.0134, // 1.34%
  'winkler': 0.0126, // 1.26%
  'selkirk': 0.0186, // 1.86%
  'morden': 0.0140, // 1.40%
  'dauphin': 0.0200, // 2.00%
  'the pas': 0.0219, // 2.19%
  'flin flon': 0.0180, // 1.80%
  
  // SASKATCHEWAN
  'saskatoon': 0.0086, // 0.86%
  'regina': 0.0103, // 1.03%
  'prince albert': 0.0134, // 1.34%
  'moose jaw': 0.0117, // 1.17%
  'swift current': 0.0107, // 1.07%
  'yorkton': 0.0134, // 1.34%
  'north battleford': 0.0152, // 1.52%
  'estevan': 0.0116, // 1.16%
  'warman': 0.0076, // 0.76%
  'weyburn': 0.0127, // 1.27%
  'lloydminster': 0.0139, // 1.39%
  'martensville': 0.0075, // 0.75%
  'meadow lake': 0.0134, // 1.34%
  'melfort': 0.0140, // 1.40%
  'humboldt': 0.0130, // 1.30%
  'melville': 0.0165, // 1.65%
  
  // ATLANTIC PROVINCES
  'halifax': 0.0097, // 0.97%
  'dartmouth': 0.0097, // 0.97%
  'bedford': 0.0097, // 0.97%
  'sydney': 0.0179, // 1.79%
  'glace bay': 0.0179, // 1.79%
  'truro': 0.0145, // 1.45%
  'new glasgow': 0.0154, // 1.54%
  'amherst': 0.0174, // 1.74%
  'bridgewater': 0.0143, // 1.43%
  'yarmouth': 0.0160, // 1.60%
  'kentville': 0.0152, // 1.52%
  'antigonish': 0.0139, // 1.39%
  'moncton': 0.0165, // 1.65%
  'saint john': 0.0178, // 1.78%
  'fredericton': 0.0145, // 1.45%
  'dieppe': 0.0140, // 1.40%
  'riverview': 0.0147, // 1.47%
  'quispamsis': 0.0153, // 1.53%
  'bathurst': 0.0207, // 2.07%
  'miramichi': 0.0182, // 1.82%
  'edmundston': 0.0176, // 1.76%
  'campbellton': 0.0200, // 2.00%
  'oromocto': 0.0141, // 1.41%
  'charlottetown': 0.0167, // 1.67%
  'summerside': 0.0169, // 1.69%
  'stratford': 0.0139, // 1.39%
  'cornwall': 0.0138, // 1.38%
  'montague': 0.0170, // 1.70%
  'kensington': 0.0150, // 1.50%
  'souris': 0.0165, // 1.65%
  'alberton': 0.0166, // 1.66%
  'stjohns': 0.0080, // 0.80%
  'mount pearl': 0.0070, // 0.70%
  'corner brook': 0.0110, // 1.10%
  'conception bay south': 0.0068, // 0.68%
  'grand falls windsor': 0.0128, // 1.28%
  'gander': 0.0111, // 1.11%
  'happy valley goose bay': 0.0125, // 1.25%
  'labrador city': 0.0095, // 0.95%
  'stephenville': 0.0125, // 1.25%
  'portugal cove st philips': 0.0076, // 0.76%
  'torbay': 0.0080, // 0.80%
  'paradise': 0.0071, // 0.71%
  
  // TERRITORIES
  'whitehorse': 0.0074, // 0.74%
  'yellowknife': 0.0117, // 1.17%
  'iqaluit': 0.0050, // 0.50%
  'hay river': 0.0132, // 1.32%
  'inuvik': 0.0150, // 1.50%
  'fort smith': 0.0143, // 1.43%
  
  // Default rates by province
  'ontario_default': 0.0100, // 1.00%
  'bc_default': 0.0045, // 0.45%
  'alberta_default': 0.0075, // 0.75%
  'quebec_default': 0.0085, // 0.85%
  'manitoba_default': 0.0125, // 1.25%
  'saskatchewan_default': 0.0100, // 1.00%
  'atlantic_default': 0.0150, // 1.50%
  'territories_default': 0.0100, // 1.00%
  'default': 0.0090 // 0.90% Canadian average
};

// Insurance rates based on property value and location
function calculateInsurance(propertyValue, city, propertyType) {
  // Base rate: 0.35% of property value
  let baseRate = 0.0035;
  
  // Adjust for property type
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    baseRate = 0.0025; // Lower for condos (building insurance covers structure)
  } else if (propertyType === 'Townhouse') {
    baseRate = 0.0030;
  }
  
  // Adjust for high-risk areas
  const highRiskCities = ['vancouver', 'toronto', 'montreal'];
  if (highRiskCities.includes(city.toLowerCase())) {
    baseRate *= 1.2; // 20% higher in major cities
  }
  
  // Calculate annual insurance
  let annualInsurance = propertyValue * baseRate;
  
  // Apply min/max bounds
  if (propertyType === 'Condo') {
    annualInsurance = Math.max(600, Math.min(2000, annualInsurance));
  } else {
    annualInsurance = Math.max(1000, Math.min(5000, annualInsurance));
  }
  
  return Math.round(annualInsurance);
}

// Calculate maintenance based on property age, type, and size
function calculateMaintenance(propertyValue, propertyType, squareFeet, yearBuilt) {
  const currentYear = new Date().getFullYear();
  const propertyAge = yearBuilt ? currentYear - yearBuilt : 20; // Assume 20 years if unknown
  
  // Base maintenance rate
  let maintenanceRate = 0.01; // 1% of property value
  
  // Adjust for property type
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    maintenanceRate = 0.005; // 0.5% for condos (exterior maintenance covered by HOA)
  } else if (propertyType === 'Townhouse') {
    maintenanceRate = 0.008; // 0.8% for townhouses
  }
  
  // Adjust for age
  if (propertyAge > 30) {
    maintenanceRate *= 1.5; // 50% more for older properties
  } else if (propertyAge > 20) {
    maintenanceRate *= 1.25; // 25% more
  } else if (propertyAge < 5) {
    maintenanceRate *= 0.5; // 50% less for new properties
  }
  
  // Alternative calculation based on square footage
  const perSqFtMaintenance = squareFeet ? squareFeet * 1.5 : null; // $1.50 per sq ft annually
  
  // Use the lower of the two calculations
  const percentBasedMaintenance = propertyValue * maintenanceRate;
  const annualMaintenance = perSqFtMaintenance 
    ? Math.min(percentBasedMaintenance, perSqFtMaintenance)
    : percentBasedMaintenance;
  
  return Math.round(annualMaintenance);
}

// Get property tax rate for a city
function getPropertyTaxRate(city, province) {
  const cityLower = city.toLowerCase().replace(/[^a-z]/g, '');
  
  // Check for exact city match
  if (PROPERTY_TAX_RATES[cityLower]) {
    return PROPERTY_TAX_RATES[cityLower];
  }
  
  // Check for province default
  const provinceLower = province.toLowerCase();
  if (provinceLower.includes('ontario')) {
    return PROPERTY_TAX_RATES.ontario_default;
  } else if (provinceLower.includes('british columbia') || provinceLower.includes('bc')) {
    return PROPERTY_TAX_RATES.bc_default;
  } else if (provinceLower.includes('alberta')) {
    return PROPERTY_TAX_RATES.alberta_default;
  } else if (provinceLower.includes('quebec')) {
    return PROPERTY_TAX_RATES.quebec_default;
  }
  
  return PROPERTY_TAX_RATES.default;
}

// Calculate realistic HOA fees based on property type and amenities
function calculateHOAFees(propertyType, propertyValue, hasAmenities = false) {
  if (propertyType === 'Single Family' || propertyType === 'Detached') {
    return 0; // Most single-family homes don't have HOA
  }
  
  let monthlyHOA = 0;
  
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    // Base HOA fee: $0.40-0.60 per sq ft per month
    // For average 800 sq ft condo = $320-480/month
    // Use property value as proxy
    if (propertyValue < 400000) {
      monthlyHOA = 250; // Small/older condo
    } else if (propertyValue < 600000) {
      monthlyHOA = 400; // Average condo
    } else if (propertyValue < 1000000) {
      monthlyHOA = 600; // Newer/larger condo
    } else {
      monthlyHOA = 800; // Luxury condo
    }
    
    // Adjust for amenities
    if (hasAmenities) {
      monthlyHOA *= 1.3; // 30% more for buildings with gym, pool, concierge
    }
  } else if (propertyType === 'Townhouse') {
    // Townhouses typically have lower fees
    monthlyHOA = propertyValue < 600000 ? 150 : 250;
  }
  
  return Math.round(monthlyHOA);
}

// Rental rate estimation based on location and property type
function estimateRentalRate(propertyValue, city, propertyType) {
  // Base rental yield rates by city (monthly rent as % of property value)
  const rentalYields = {
    // Ontario - generally 0.3-0.4% monthly
    'toronto': 0.0032,
    'mississauga': 0.0035,
    'brampton': 0.0038,
    'ottawa': 0.0036,
    'hamilton': 0.0040,
    'london': 0.0042,
    
    // BC - lower yields due to high property values
    'vancouver': 0.0028,
    'burnaby': 0.0030,
    'richmond': 0.0030,
    'surrey': 0.0035,
    
    // Alberta - higher yields
    'calgary': 0.0040,
    'edmonton': 0.0042,
    
    // Default
    'default': 0.0035
  };
  
  const cityLower = city.toLowerCase().replace(/[^a-z]/g, '');
  let yieldRate = rentalYields[cityLower] || rentalYields.default;
  
  // Adjust for property type
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    yieldRate *= 1.1; // Condos typically have higher rental yields
  } else if (propertyType === 'Townhouse') {
    yieldRate *= 1.05;
  }
  
  return Math.round(propertyValue * yieldRate);
}

// Main calculation function
function calculateAccurateExpenses(propertyData) {
  const {
    propertyValue,
    city,
    province,
    propertyType,
    squareFeet,
    yearBuilt,
    hasAmenities,
    actualPropertyTax,  // Actual property tax from listing
    actualCondoFees     // Actual condo/HOA fees from listing
  } = propertyData;
  
  // Calculate property tax - use actual if available
  let propertyTaxAnnual;
  let taxRate;
  
  if (actualPropertyTax && actualPropertyTax > 0) {
    // Use actual property tax from listing
    propertyTaxAnnual = Math.round(actualPropertyTax);
    taxRate = propertyTaxAnnual / propertyValue; // Calculate effective rate
  } else {
    // Calculate based on city rates
    taxRate = getPropertyTaxRate(city, province || 'Ontario');
    propertyTaxAnnual = Math.round(propertyValue * taxRate);
  }
  
  // Calculate insurance
  const insuranceAnnual = calculateInsurance(propertyValue, city, propertyType);
  
  // Calculate maintenance
  const maintenanceAnnual = calculateMaintenance(propertyValue, propertyType, squareFeet, yearBuilt);
  
  // Calculate HOA fees - use actual if available
  let hoaMonthly;
  
  if (actualCondoFees && actualCondoFees > 0) {
    // Use actual condo/HOA fees from listing
    hoaMonthly = Math.round(actualCondoFees);
  } else {
    // Calculate based on property type and value
    hoaMonthly = calculateHOAFees(propertyType, propertyValue, hasAmenities);
  }
  
  // Utilities (varies by property type)
  let utilitiesMonthly = 250; // Default
  if (propertyType === 'Condo' || propertyType === 'Apartment') {
    utilitiesMonthly = 150; // Lower for condos (often includes heat/water in fees)
  } else if (squareFeet) {
    // $0.10-0.15 per sq ft per month
    utilitiesMonthly = Math.round(squareFeet * 0.12);
    utilitiesMonthly = Math.max(150, Math.min(400, utilitiesMonthly));
  }
  
  return {
    property_tax_annual: propertyTaxAnnual,
    property_tax_rate: taxRate,
    insurance_annual: insuranceAnnual,
    maintenance_annual: maintenanceAnnual,
    hoa_monthly: hoaMonthly,
    utilities_monthly: utilitiesMonthly,
    calculation_method: actualPropertyTax ? 'actual_data' : 'location_based_estimate',
    
    // Calculated totals
    total_monthly_expenses: Math.round(
      propertyTaxAnnual / 12 +
      insuranceAnnual / 12 +
      maintenanceAnnual / 12 +
      hoaMonthly +
      utilitiesMonthly
    ),
    total_annual_expenses: Math.round(
      propertyTaxAnnual +
      insuranceAnnual +
      maintenanceAnnual +
      (hoaMonthly * 12) +
      (utilitiesMonthly * 12)
    )
  };
}

// Export functions using CommonJS
module.exports = {
  parseBedroomBathroomValue,
  calculateAccurateExpenses,
  getPropertyTaxRate,
  calculateInsurance,
  calculateMaintenance,
  calculateHOAFees,
  estimateRentalRate
};