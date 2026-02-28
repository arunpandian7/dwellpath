import axios from "axios";
import * as cheerio from "cheerio";
import { type CreatePropertyRequest } from "@shared/schema";

// Safe JSON extractor using brace matching
function extractJson(html: string, marker: string): any {
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;
  const startBrace = html.indexOf('{', markerIdx);
  if (startBrace === -1) return null;

  let depth = 0, endBrace = -1;
  for (let i = startBrace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { endBrace = i; break; } }
  }

  if (endBrace === -1) return null;
  try { return JSON.parse(html.substring(startBrace, endBrace + 1)); }
  catch { return null; }
}

function parsePriceToNumber(text: string): number | null {
  const match = text.match(/([0-9.]+)\s*(Lac|Lakh|Cr|Crore)/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('l')) return Math.round(val * 100000);
  if (unit.startsWith('c')) return Math.round(val * 10000000);
  return null;
}

async function fetchHtml(url: string): Promise<string> {
  const token = process.env.SCRAPI_API || "96657c10b80d4ab8a0233c26b7debef137b7d6fd183";
  
  // Try up to 3 times — scrape.do can return CAPTCHA on first attempt
  for (let attempt = 1; attempt <= 3; attempt++) {
    const scrapeDoUrl = `http://api.scrape.do/?url=${encodeURIComponent(url)}&token=${token}&super=true&geoCode=in`;
    
    const res = await axios.get<string>(scrapeDoUrl, { timeout: 60000 });
    const html = res.data;

    const isCaptcha = html.includes('"pageName":"VerifyCaptcha"') || 
                      html.includes('data-label="CAPTCHA"') ||
                      html.length < 20000; // Property pages are always large

    console.log(`Attempt ${attempt}: HTML ${html.length} bytes | CAPTCHA: ${isCaptcha}`);
    
    if (!isCaptcha) return html;
    
    if (attempt < 3) {
      console.log(`CAPTCHA detected, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  throw new Error("Failed to bypass CAPTCHA after 3 attempts. Try again in a few seconds.");
}

function parse99acres(html: string, url: string): CreatePropertyRequest {
  const $ = cheerio.load(html);
  const initialData = extractJson(html, 'window.__initialData__={');

  if (initialData?.pd?.pageData) {
    const pageData = initialData.pd.pageData;
    const propDetails = pageData.propertyDetails;
    const d = propDetails?.prop_data;
    const seo = pageData.seoSchema;

    // ── Address ────────────────────────────────────────────────────────────
    const address = d?.localityToBeDisplayed
      ? `${propDetails?.title || ''}, ${d.localityToBeDisplayed}`.trim().replace(/^,\s*/, '')
      : propDetails?.title || seo?.localityName || "Unknown Address";

    // ── Price ──────────────────────────────────────────────────────────────
    const price = d?.Price > 0 ? Math.round(d.Price) :
      d?.Min_Price > 0 ? Math.round(d.Min_Price) :
      d?.Price_Text ? parsePriceToNumber(d.Price_Text) : null;

    const pricePerSqft = d?.Price_Per_Unit_Area > 0 ? Math.round(d.Price_Per_Unit_Area) : null;

    // ── Dimensions ─────────────────────────────────────────────────────────
    const bedrooms = d?.Bedroom_Num || (seo?.numberOfRooms ? parseInt(seo.numberOfRooms) : null);
    const bathrooms = d?.Bathroom_Num || (seo?.numberOfBathroomsTotal ? parseInt(seo.numberOfBathroomsTotal) : null);
    const balconies = d?.Balcony_Num || null;
    const areaSqft = d?.Builtup_Area ? Math.round(d.Builtup_Area) : null;
    const plotAreaSqft = d?.Super_Area ? Math.round(d.Super_Area) : null;

    // ── Property Attributes ────────────────────────────────────────────────
    const type = d?.Property_Text || d?.headerDescriptionTypeInfo || "House";
    const facing = d?.Facing_Label || null;
    const totalFloors = d?.Total_Floor ?? null;
    const furnishing = d?.Furnish_Label || d?.Furnishing || null;
    const overlooking = d?.Overlooking_Label || null;
    const possession = d?.Availability_Text || null;
    const transactionType = d?.Transact_Type_Label || null;
    const gatedCommunity = d?.Gated_community === "Yes" || d?.Within_Gated_Community === "Y" || false;

    // ── Amenities ──────────────────────────────────────────────────────────
    const amenityLabels: string[] = [
      ...(d?.InternalFeatures || []).map((f: any) => f.label),
      ...(d?.ExternalFeatures || []).map((f: any) => f.label),
      ...(d?.AdditionalFeatures || []).map((f: any) => f.label),
      ...(d?.topUsp || []).map((f: any) => f.label),
    ].filter(Boolean);
    const amenities = amenityLabels.length > 0 ? JSON.stringify(Array.from(new Set(amenityLabels))) : null;

    // ── Location ───────────────────────────────────────────────────────────
    const latitude = d?.Latitude?.toString() || seo?.latitude || null;
    const longitude = d?.Longitude?.toString() || seo?.longitude || null;
    const imageUrl = seo?.image || null;

    console.log(`✅ Parsed: "${address}" | ₹${price?.toLocaleString()} | ${bedrooms}BHK/${bathrooms}B | ${areaSqft}sqft | ${facing} | ${possession}`);

    return {
      address, price, rent: null, pricePerSqft,
      bedrooms, bathrooms, balconies, areaSqft, plotAreaSqft,
      type, facing, totalFloors, furnishing, overlooking, possession,
      transactionType, gatedCommunity, amenities,
      link: url, source: "99acres", imageUrl, status: "shortlisted",
      notes: d?.Description || propDetails?.description || null,
      latitude, longitude,
    };
  }

  // ── Fallback: Cheerio DOM parsing ──────────────────────────────────────────
  console.warn("⚠️ No structured data found, using DOM fallback.");
  const title = $("h1").first().text().trim() || "Unknown Address";
  const bodyText = $("body").text();
  const bhkMatch = title.match(/(\d+)\s*BHK/i) || bodyText.match(/(\d+)\s*BHK/i);
  const areaMatch = bodyText.match(/(\d+)\s*sq\.ft/i);
  const priceMatch = bodyText.match(/([0-9.]+)\s*(Lac|Lakh|Cr|Crore)/i);

  return {
    address: title,
    price: priceMatch ? parsePriceToNumber(priceMatch[0]) : null,
    rent: null, pricePerSqft: null,
    bedrooms: bhkMatch ? parseInt(bhkMatch[1]) : null,
    bathrooms: null, balconies: null,
    areaSqft: areaMatch ? parseInt(areaMatch[1]) : null,
    plotAreaSqft: null, type: "House", facing: null, totalFloors: null,
    furnishing: null, overlooking: null, possession: null,
    transactionType: null, gatedCommunity: null, amenities: null,
    link: url, source: "99acres", imageUrl: null,
    status: "shortlisted", notes: null, latitude: null, longitude: null,
  };
}

export async function scrapeProperty(url: string): Promise<CreatePropertyRequest> {
  try {
    const html = await fetchHtml(url);
    return parse99acres(html, url);
  } catch (error: any) {
    console.error("Scraping error:", error.message);
    throw new Error(error.message || "Failed to scrape property");
  }
}
