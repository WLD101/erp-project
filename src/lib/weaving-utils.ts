/**
 * Calculates the required Warp Length for a weaving job.
 * 
 * @param fabricLengthMeters Target length of fabric to produce
 * @param crimpPercentage Crimp % (interlacing take-up), typically 5-10%
 * @param wastagePercentage Process waste (sizing, knotting), typically 2-5%
 * @returns Total Warp Length required in meters
 */
export function calculateWarpLength(
    fabricLengthMeters: number,
    crimpPercentage: number,
    wastagePercentage: number
): number {
    // Logic: 
    // Warp Length = Fabric Length / (1 - Crimp%)
    // Total Required = Warp Length / (1 - Wastage%)

    // Convert percentages to decimals (e.g., 5 -> 0.05)
    const crimpFactor = crimpPercentage / 100;
    const wastageFactor = wastagePercentage / 100;

    const baseWarp = fabricLengthMeters / (1 - crimpFactor);
    const totalWarp = baseWarp / (1 - wastageFactor);

    return parseFloat(totalWarp.toFixed(2));
}
