import ApolloClient, { createNetworkInterface } from 'apollo-client';

export default (GRAPHQL_URI = 'http://localhost:3011/query') => {
  const networkInterface = createNetworkInterface({
    uri: GRAPHQL_URI,
    credentials: 'cross-origin',
  });

  networkInterface.use([{
    applyMiddleware(req, next) {
      if (!req.options.headers) {
        req.options.headers = {};  // Create the header object if needed.
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id_token) {
        req.options.headers.Authorization = 'Bearer ' + user.id_token;
      }
      next();
    },
  }]);

  networkInterface.useAfter([{
    applyAfterware({ response }, next) {
      for (var [key, value] of response.headers.entries()) {
        if (key === "www-authenticate" && value === 'Bearer token_type="JWT"') {
          const { location } = window;
          location.assign("/login")
        }
      }
      next();
    }
  }]);

  return new ApolloClient({
    networkInterface,
    dataIdFromObject: (result) => {
      if (result.id && result.__typename) { // eslint-disable-line no-underscore-dangle
        return result.__typename + result.id; // eslint-disable-line no-underscore-dangle
      }
      return null;
    },
    shouldBatch: true,
  });
};
