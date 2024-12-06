// Get all locations with id and lat_lang
const getAllLocations = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        return data.map(({ id, lat_lang }) => ({
            id,
            lat_lang
        }));
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return [];
    }
};

// Get all clues with id and clue_description
const getAllClues = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        return data.map(({ id, clue_description }) => ({
            id,
            clue_description
        }));
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return [];
    }
};

module.exports = {
    getAllLocations,
    getAllClues,
};