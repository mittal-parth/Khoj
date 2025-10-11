export const parseJSON = (clues) => {
    try {
        const locations = clues.map(({ id, lat, long }) => ({
            id,
            lat,
            long
        }));
        const cluesParsed = clues.map(({ id, description }) => ({
            id,
            description
        }));
        return [locations, cluesParsed];
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return [[], []];
    }
};