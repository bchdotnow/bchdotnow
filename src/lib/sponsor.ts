// The single, exclusive annual sponsorship. Flip `active` and fill the fields when sold.
// Until then the slot advertises itself, clearly labelled.
export type Sponsor = {
  active: boolean;
  name: string;
  blurb: string;
  url: string;
  logoUrl?: string;
};

export const sponsor: Sponsor = {
  active: false,
  name: "",
  blurb: "",
  url: "",
};

export const SPONSOR_CONTACT = "mailto:sponsor@bch.now?subject=BCH%20Now%20annual%20sponsorship";
