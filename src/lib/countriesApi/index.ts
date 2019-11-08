import Fetch from "../../types/fetch";

function handleError(response: any): any {
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response.json();
}

interface ApiDependencies {
  apiUrl: string | undefined;
  fetch: Fetch;
}

export interface CountrySearchItem {
  name: string;
  alpha3Code: string;
  flag: string;
}

interface CountryDetails extends CountrySearchItem {
  population: number;
  currencies: { code: string; name: string; symbol: string }[];
}

interface CountryApiResponse extends CountryDetails {
  topLevelDomain: string[];
  alpha2Code: string;
  callingCodes: string[];
  capital: string;
  altSpellings: string[];
  region: string;
  subregion: string;
  latlng: [number, number];
  demonym: string;
  area: number;
  gini: number;
  timezones: string[];
  borders: string[];
  nativeName: string;
  numericCode: string;
  languages: { iso639_1: string; iso639_2: string; name: string; nativeName: string }[];
  translations: { de: string; es: string; fr: string; ja: string; it: string; br: string; pt: string }[];
  regionalBlocs: { acronym: string; name: string; otherAcronyms: string[]; otherNames: string[] }[];
  cioc: string;
}

interface CountriesAPI {
  search: (searchTerm: string) => Promise<CountrySearchItem[]>;
  getByCode: (code: string) => Promise<CountryDetails | null>;
}

export default function createCountriesApi({ apiUrl, fetch }: ApiDependencies): CountriesAPI {
  if (!apiUrl) throw new Error("A valid URL for the Countries API must be specified.");

  return {
    search(searchTerm: string): Promise<CountrySearchItem[]> {
      return fetch(`${apiUrl}/name/${searchTerm}`)
        .then(handleError)
        .then(json => json as CountryApiResponse[])
        .then((countryResponses: CountryApiResponse[]) =>
          countryResponses.map(({ name, alpha3Code, flag }): CountrySearchItem => ({ name, alpha3Code, flag })),
        )
        .catch(error => {
          if (error.message !== "Not Found") throw error;
          return [];
        });
    },
    getByCode(code: string): Promise<CountryDetails | null> {
      return fetch(`${apiUrl}/alpha/${code}`)
        .then(handleError)
        .then(json => json as CountryApiResponse)
        .then(
          ({ name, alpha3Code, flag, population, currencies }): CountryDetails => ({
            name,
            alpha3Code,
            flag,
            population,
            currencies,
          }),
        )
        .catch(error => {
          if (error.message !== "Bad Request") throw error;
          return null;
        });
    },
  };
}
