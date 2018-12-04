import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, from } from 'apollo-link';
import { onError } from "apollo-link-error";

export default (GRAPHQL_URI = process.env.REACT_APP_CIRCUIT_URI + '/query') => {
  const httpLink = new HttpLink({
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

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.map(({ message, locations, path }) =>  
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ),
      )
    if (networkError){
      console.log(`[Network error]: ${networkError}`)
    }
  });

  return new ApolloClient({
    link: from([
      afterwareLink,
      errorLink,
      middlewareLink,
      httpLink,
    ]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'ignore',
        fetchPolicy: 'network-only',
      },
      query: {
        errorPolicy: 'apollo-link',
      },
      // https://github.com/apollographql/apollo-client/issues/3336
      mutate: {
        errorPolicy: 'none',  
      },
    }
  });
};
