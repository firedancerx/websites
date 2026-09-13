import { db } from "./db";

export interface CountryItem {
  code: string;
  name: string;
  currency: string;
}

export interface StateItem {
  id: number;
  country_code: string;
  name: string;
}

export async function getCountries(): Promise<CountryItem[]> {
  const [rows] = await db().execute<DatabaseResultRow<CountryItem>[]>(
    "SELECT code, name, currency FROM countries ORDER BY name ASC"
  );
  return rows;
}

export async function getStates(): Promise<StateItem[]> {
  const [rows] = await db().execute<DatabaseResultRow<StateItem>[]>(
    "SELECT id, country_code, name FROM states ORDER BY name ASC"
  );
  return rows;
}
