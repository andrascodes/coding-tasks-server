import Fetch from "../../types/fetch";

interface ApiDependencies {
  apiUrl: string | undefined;
  fetch: Fetch;
}

interface ExchangeRateApiResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: ExchangeRates;
}

interface ExchangeRates {
  [currency: string]: number | null;
}

interface ExchangeRateAPI {
  latest: (codes: string[], base: string) => Promise<ExchangeRates>;
}

export default function createExchangeRateApi({ apiUrl, fetch }: ApiDependencies): ExchangeRateAPI {
  if (!apiUrl) throw new Error("A valid URL must be specified for the Exchange Rate API.");

  return {
    latest(codes: string[], base: string): Promise<ExchangeRates> {
      return fetch(`${apiUrl}/latest?base=${base}&symbols=${codes.join(",")}`)
        .then(async response => {
          const json = await response.json();
          const errorMessage: string = json && json.error;
          if (
            errorMessage &&
            errorMessage.toUpperCase().includes("SYMBOLS") &&
            errorMessage.toUpperCase().includes("ARE INVALID")
          ) {
            return {
              rates: codes.reduce<ExchangeRates>((acc, curr) => {
                if (!acc[curr]) {
                  acc[curr] = null;
                }
                return acc;
              }, {}),
            };
          }
          if (!response.ok) {
            throw new Error(`${response.statusText}: ${json.error}`);
          }
          return json;
        })
        .then((json): ExchangeRateApiResponse => json as ExchangeRateApiResponse)
        .then((rateResponse): ExchangeRates => rateResponse.rates);
    },
  };
}
