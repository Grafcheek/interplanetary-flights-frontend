import type { PlanetJSON } from "../../cosmosApi";
import PlanetCard from "../PlanetCard/PlanetCard";

interface PlanetsListProps {
  planets: PlanetJSON[];
  similarityById?: Map<number, number>;
}

export default function PlanetsList({ planets, similarityById }: PlanetsListProps) {
  return (
    <div className="container">
      {planets.map((planet) => (
        <PlanetCard
          key={planet.planet_id}
          planet={planet}
          similarityPercent={similarityById?.get(planet.planet_id)}
        />
      ))}
    </div>
  );
}
