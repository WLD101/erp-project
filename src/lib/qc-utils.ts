/**
 * Calculates fabric quality score based on the 4-Point System.
 * Formula: (Total Points * 3600) / (Inspected Yards * Fabric Width)
 */
export function calculate4PointScore(
    totalPoints: number,
    inspectedYards: number,
    fabricWidthInches: number
): number {
    if (inspectedYards === 0 || fabricWidthInches === 0) return 0;

    const score = (totalPoints * 3600) / (inspectedYards * fabricWidthInches);
    return parseFloat(score.toFixed(2));
}

export function determineGrade(score: number): "First Quality" | "Second Quality" {
    return score <= 40 ? "First Quality" : "Second Quality";
}

/**
 * AQL 2.5 (General Inspection Level II) - Sample Size Logic.
 * Simplified lookup table for demonstration.
 */
export function getAQLSampleSize(batchSize: number): { sampleSize: number; maxDefects: number } {
    if (batchSize <= 150) return { sampleSize: 20, maxDefects: 1 };
    if (batchSize <= 500) return { sampleSize: 50, maxDefects: 3 };
    if (batchSize <= 1200) return { sampleSize: 80, maxDefects: 5 };
    if (batchSize <= 3200) return { sampleSize: 125, maxDefects: 7 };
    if (batchSize <= 10000) return { sampleSize: 200, maxDefects: 10 };
    return { sampleSize: 315, maxDefects: 14 }; // > 10000
}
