import cities1 from './chunks/cities-1';
import cities2 from './chunks/cities-2';
import cities3 from './chunks/cities-3';

export interface LatitudeLadderCity {
  id: string;
  city: string;
  country: string;
  iso2: string;
  lat: number;
  population: number;
}

type PackedLatitudeLadderCity = [string, string, string, number, number];

const PACKED_CITIES: PackedLatitudeLadderCity[] = [...cities1, ...cities2, ...cities3];

function unpackCity([city, country, iso2, lat, population]: PackedLatitudeLadderCity): LatitudeLadderCity {
  return {
    id: `${city}__${country}`,
    city,
    country,
    iso2,
    lat,
    population,
  };
}

export async function loadLatitudeLadderCities(): Promise<LatitudeLadderCity[]> {
  return PACKED_CITIES.map(unpackCity).filter((c) => c.population >= 1_000_000);
}
