import {get} from 'superagent';
import {applicationsApi} from './endpoints';

export const getOrgs = async () => {
    const response = await get(`${applicationsApi}/orgs`);
    return response.body;
};

export const getSpaces = async (orgId: string) => {
    const response = await get(`${applicationsApi}/spaces?filter=${JSON.stringify({where: {orgId}})}`);
    return response.body;
};

export const getApps = async (spaceId: string) => {
    const response = await get(`${applicationsApi}/apps?filter=${JSON.stringify({where: {spaceId}})}`);
    return response.body;
};