'use client';

import  { HttpLink, ApolloLink,  } from '@apollo/client';
// import { ApolloNextAppProvider, NextSSRApolloClient, NextSSRInMemoryCache, SSRMultipartLink  } from '@apollo/experimental-nextjs-app-support/ssr';
import { ApolloClient, ApolloNextAppProvider,InMemoryCache, SSRMultipartLink} from '@apollo/client-integration-nextjs'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

function makeClient() {
    const httpLink = new HttpLink({
        // uri: 'http://localhost:3000/graphql',
        uri: process.env.NEXT_PUBLIC_GRAPHQL_HTTP,
    });
    const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createClient({
        // url: 'ws://localhost:3000/graphql',
        url: process.env.NEXT_PUBLIC_GRAPHQL_WS!,
    })) : null;

    const link = typeof window !== 'undefined' && wsLink ? ApolloLink.split(
        ({ query }) => {
            const definition =getMainDefinition(query);
            return (
                definition.kind === 'OperationDefinition' && 
                definition.operation === 'subscription'
            );
        },
        wsLink,
        httpLink
    ) : httpLink;

    return new ApolloClient({
        cache: new InMemoryCache(),
        link: typeof window === 'undefined' ? ApolloLink.from([
            new SSRMultipartLink({
                stripDefer : true,
            }),
            link,
        ]) : link,
    })
}

export function Providers({ children }: { children: React.ReactNode}) {
    return (
        <ApolloNextAppProvider makeClient={makeClient}>
            {children}
        </ApolloNextAppProvider>
    )
}

/*  Other one used before */

// 'use client';

// import { HttpLink } from '@apollo/client';
// // import { ApolloNextAppProvider, NextSSRApolloClient, NextSSRInMemoryCache, SSRMultipartLink  } from '@apollo/experimental-nextjs-app-support/ssr';
// import {ApolloClient, ApolloNextAppProvider, InMemoryCache, SSRMultipartLink} from '@apollo/client-integration-nextjs'
// //Helper function to create the client per-request
// function makeClient() {
//   const httpLink = new HttpLink({
//     // Use your env var here as discussed!
//     uri: 'http://localhost:3000/graphql'
//   });

//   return new ApolloClient({
//     cache: new InMemoryCache(),
//     link: typeof window === 'undefined' ? ApolloLink.from([
//       new SSRMultipartLink({
//         stripDefer: true,
//       }),
//       httpLink,
//     ])
//     : httpLink,
//   })
// }

// //Ensure you import ApolloLink if you use the sophisticated link chain above
// import { ApolloLink } from '@apollo/client';

// export function Providers({ children } : {children: React.ReactNode }) {
//   return (
//     <ApolloNextAppProvider makeClient={makeClient}>
//       {children}
//     </ApolloNextAppProvider>
//   );
// }