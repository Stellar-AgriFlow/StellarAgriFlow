/**
 * Parametric Weather Risk Simulation Tool
 */
export interface WeatherSimulationScenario {
  name: string;
  regionId: string;
  rainfallMm: number;
  droughtIndex: number;
  expectedDroughtTrigger: boolean;
  expectedFloodTrigger: boolean;
}

export const SIMULATION_SCENARIOS: WeatherSimulationScenario[] = [
  {
    name: 'Normal Rainy Season',
    regionId: 'SUB_SAHARAN_A',
    rainfallMm: 80,
    droughtIndex: 15,
    expectedDroughtTrigger: false,
    expectedFloodTrigger: false,
  },
  {
    name: 'Severe El Niño Drought',
    regionId: 'EAST_AFRICA_B',
    rainfallMm: 5,
    droughtIndex: 65, // > 50 trigger threshold
    expectedDroughtTrigger: true,
    expectedFloodTrigger: false,
  },
  {
    name: 'Tropical Torrential Flood',
    regionId: 'WEST_AFRICA_C',
    rainfallMm: 220, // > 150 mm flood trigger
    droughtIndex: 5,
    expectedDroughtTrigger: false,
    expectedFloodTrigger: true,
  },
];

export function runWeatherSimulation(
  droughtThreshold: number = 50,
  floodThresholdMm: number = 150
): Array<WeatherSimulationScenario & { triggered: boolean; peril: string | null }> {
  return SIMULATION_SCENARIOS.map((scenario) => {
    const isDrought = scenario.droughtIndex >= droughtThreshold;
    const isFlood = scenario.rainfallMm >= floodThresholdMm;

    return {
      ...scenario,
      triggered: isDrought || isFlood,
      peril: isDrought ? 'Drought' : isFlood ? 'Flood' : null,
    };
  });
}

if (require.main === module) {
  console.log('Running Parametric Weather Oracle Simulation Scenarios:');
  const results = runWeatherSimulation();
  console.log(JSON.stringify(results, null, 2));
}
