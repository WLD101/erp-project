export type TextileKPIs = {
    productionYield: number; // %
    equipmentUtilization: number; // %
    wastageRate: number; // %
    orderFulfillment: number; // %
    productionTimeline: { shift: string; output: number }[];
    inventoryAlerts: { item: string; stock: number; threshold: number; unit: string }[];
};

export const getMockTextileData = (): TextileKPIs => {
    // Randomizer helper
    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Simulator for a 5000 unit/day facility
    return {
        productionYield: random(92, 98), // High quality expectation
        equipmentUtilization: random(85, 95), // Efficient loom usage
        wastageRate: random(1, 4), // Low waste target
        orderFulfillment: random(90, 100),
        productionTimeline: [
            { shift: "Morning (6AM-2PM)", output: random(1500, 1800) },
            { shift: "Evening (2PM-10PM)", output: random(1400, 1700) },
            { shift: "Night (10PM-6AM)", output: random(1300, 1600) },
        ],
        inventoryAlerts: [
            { item: "Cotton Yarn 40s", stock: 120, threshold: 200, unit: "kg" },
            { item: "Red Dye #B2", stock: 15, threshold: 50, unit: "liters" },
        ],
    };
};
