import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';

export default (GRAPHQL_URI = 'http://localhost:3011/query') => {
  const httpLink = createHttpLink({
    uri: GRAPHQL_URI,
    credentials: 'same-origin'
  });

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: user.id_token ? `Bearer ${user.id_token}` : null,
      }
    }
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'ignore',
      },
      query: {
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all'
      }
    }
  });
};
