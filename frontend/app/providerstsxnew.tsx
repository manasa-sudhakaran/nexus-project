'use client';

import React, { ReactNode, useMemo } from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  split,
  HttpLink,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  const client = useMemo(() => {
    const httpUri = process.env.NEXT_PUBLIC_GRAPHQL_HTTP;
    const wsUri = process.env.NEXT_PUBLIC_GRAPHQL_WS;

    if (!httpUri) {
      throw new Error('Missing NEXT_PUBLIC_GRAPHQL_HTTP');
    }

    const httpLink = new HttpLink({
      uri: httpUri,
      credentials: 'include',
    });

    let link: any = httpLink;

    // Only create WebSocket link in browser
    if (typeof window !== 'undefined' && wsUri) {
      const wsLink = new GraphQLWsLink(
        createClient({
          url: wsUri,
          retryAttempts: 5,
        })
      );

      link = split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        httpLink
      );
    }

    return new ApolloClient({
      link,
      cache: new InMemoryCache(),
    });
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
} 