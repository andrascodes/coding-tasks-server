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

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface UserWithToken {
  id: string;
  username: string;
  token: string;
}

export interface AuthInput {
  username: string;
  password: string;
}

export interface Item {
  id: string;
  value: string;
}

export interface Token {
  tokenHash: string;
  username: string;
  client: string;
}

export interface Database {
  getEvents: () => any;
  setEvents: (value: any) => any;
  getFields: () => any;
  setFields: (value: any) => any;
  getUsers: () => any;
  setUsers: (value: any) => any;
  getRSVPs: () => any;
  getItems: () => any;
  setItems: (value: any) => any;
  getTokens: () => any;
  setTokens: (value: any) => any;
  createUser: (input: AuthInput) => Promise<User>;
  authenticateUser: (input: AuthInput) => Promise<[boolean | User, boolean]>;
  createToken: (user: User, clientId: string) => Promise<string>;
  authorizeUser: (token: string) => Promise<UserWithToken>;
}
