import { get } from 'superagent';
import { applicationsApi } from './endpoints';

export const getSpaces = async () => {
    const response = await get(`${applicationsApi}/spaces`);
    return response.body;
};

export const getApps = async (spaceId: string) => {
    const response = await get(`${applicationsApi}/apps?filter=${JSON.stringify({where: {spaceId}})}`);
    return response.body;
};