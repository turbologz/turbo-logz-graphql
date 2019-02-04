import {signup, login} from '../remote/user';

export const resolvers = {

    Mutation: {
        // Users
        signup: (_: any, user: any) => signup(user.username, user.email, user.password),

        login: (_: any, user: any) => login(user.username, user.password),
    }

};
