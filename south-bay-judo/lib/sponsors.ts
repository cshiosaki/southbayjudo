export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Bronze";

export type Sponsor = {
  name: string;
  tier: SponsorTier;
  logo: string;
  website?: string;
};

// Add current sponsors here as logo files are uploaded to /public/images/sponsors.
// Example:
// { name: "Example Company", tier: "Gold", logo: "/images/sponsors/example-company.png", website: "https://example.com" }
export const sponsors: Sponsor[] = [];
