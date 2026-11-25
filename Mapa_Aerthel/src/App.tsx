import housesJson from './data/houses.json'
import regionsData from './data/regions.json'
import type { House, Region, Route } from './types/map'
import MapModuleView from './components/MapModuleView'

const houses = housesJson as unknown as House[]
const regions = regionsData.regions as unknown as Region[]
const routes = regionsData.routes as unknown as Route[]

export default function App() {
  return (
    <div className="min-h-screen bg-base p-4 text-ink">
      <MapModuleView regions={regions} routes={routes} houses={houses} />
    </div>
  )
}
