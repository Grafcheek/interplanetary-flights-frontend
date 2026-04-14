import type { PlanetJSON } from "../../cosmosApi";
import PlanetCard from "../PlanetCard/PlanetCard";

export default function PlanetsList({ planets }: { planets: PlanetJSON[] }) {
  return (
    <div className="container">
      {planets.map((planet) => (
        <PlanetCard key={planet.planet_id} planet={planet} />
      ))}
    </div>
  );
}
