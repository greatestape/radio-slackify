import {ApolloClient, InMemoryCache} from '@apollo/client';

const GRAPHQL_URI =
  process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:3000/api/graphql';

const client = new ApolloClient({
  uri: GRAPHQL_URI,
  cache: new InMemoryCache(),
});

export default client;
