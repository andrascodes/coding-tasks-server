export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  city: string;
  zipcode: string;
  country: string;
  location: Location;
}

export interface Field {
  id: number;
  name: string;
  address: Address;
}

export interface Match {
  id: number;
  title: string;
  fieldId: number;
  start: number;
  end: number | null;
}

export interface MatchResponse {
  id: number;
  title: string;
  field: Field;
  start: number;
  end: number | null;
}
