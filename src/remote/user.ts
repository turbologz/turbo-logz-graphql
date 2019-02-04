import { post } from 'superagent';
import { userApi } from './endpoints';

export const signup = async (username: string, email: string, password: string) => {
    const response = await post(`${userApi}/users`).send({username, email, password});

    return response.body;
};

export const login = async (username: string, password: string) => {
    const response = await post(`${userApi}/login`).auth(username, password, {type: 'basic'}).send();

    return response.body;
};