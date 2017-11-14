import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';

export default (GRAPHQL_URI = process.env.REACT_APP_GRAPHQL_URI) => {
  const httpLink = createHttpLink({
    uri: GRAPHQL_URI,
    credentials: 'same-origin'
  });

  const middlewareLink = setContext((_, { headers }) => {
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

  const afterwareLink = new ApolloLink((operation, forward) => {
    return forward(operation).map(response => {
      const context = operation.getContext();

      for (var [key, value] of context.response.headers.entries()) {
        if (key === "www-authenticate" && value === 'Bearer token_type="JWT"') {
          const { location } = window;
          location.assign("/login")
        }
      }

      return response;
    });
  });

  return new ApolloClient({
    link: afterwareLink.concat(middlewareLink.concat(httpLink)),
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
