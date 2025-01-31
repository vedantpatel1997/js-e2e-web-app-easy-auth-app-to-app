// // <getDependencies>
// // Express.js app server
// import express from 'express';
// import 'isomorphic-fetch';
// import { sortJson, prettyJson } from './sortJson.js';


// // Uncomment for the app->app->graph tutorial
// import { getGraphProfile } from './with-graph/graph.js';

// // </getDependencies>

// // <create>
// export const create = async () => {
//   // Create express app
//   const app = express();

//   // Get root
//   app.get('/debug', async (req, res) => {

//     res.send(
//       prettyJson(
//         sortJson({
//           route: 'debug',
//           headers: sortJson(req.headers),
//           env: sortJson(process.env),
//         })
//       )
//     );
//   });

//   // Get Profile and return to client
//   app.get('/get-profile', async (req, res) => {

//     console.log('/get-profile requested');

//     try {

//       const profile = {
//         "displayName": "John Doe",

//         // return true if we have an access token
//         "withAuthentication": false
//       }
//       let profileFromGraph=false;
//       //let graphProfile={};

//       const bearerToken = req.headers['Authorization'] || req.headers['authorization'];
//       console.log(`backend server.js bearerToken ${!!bearerToken ? 'found' : 'not found'}`);

//       if (bearerToken) {
//         const accessToken = bearerToken.split(' ')[1];
//         console.log(`backend server.js accessToken: ${!!accessToken ? 'found' : 'not found'}`);


//         if (!accessToken || accessToken === 'undefined' || accessToken === 'null' || accessToken.length === 0){
//           console.log(`backend server.js accessToken: 'not found'}`);
//           return res.status(401).json({ error: 'No access token found' });
//         } else {
//           console.log(`backend server.js accessToken: 'found' ${accessToken}}`);
//           profile.withAuthentication = true;
//         }

//         // TODO: get profile from Graph API
//         // Uncomment for the app->app->graph tutorial

//         // where did the profile come from
//         //profileFromGraph=true;

//         // get the profile from Microsoft Graph
//         //graphProfile = await getGraphProfile(accessToken);

//         // log the profile for debugging
//         // console.log(`profile: ${JSON.stringify(graphProfile)}`);
//         return {
//           "displayName": "John Doe",
//           "withAuthentication": !!accessToken ? true : false
//       }
//       }

//       const dataToReturn = {
//         route: '/profile success',
//         profile: (profileFromGraph) ? { authentication: true, ...graphProfile }: {...profile},
//         headers: req.headers,
//         bearerToken,
//         env: process.env,
//         error: null,
//       }
//       console.log(`backend server.js profile: ${JSON.stringify(profile)}`)

//       return res.status(200).json(dataToReturn);

//     } catch (err) {
//       const dataToReturn = {
//         error: {
//           route: '/profile error',
//           profile: 'error',
//           server_response: err,
//           message: err.message,
//         },
//       }
//       console.log(`backend server.js err message: ${err.message}`)

//       // Return 200 so error displays in browser for debugging
//       // Don't do this in production
//       return res.status(200).json(dataToReturn);
//     }
//   });

//   // instead of 404 - just return home page
//   app.get('*', (_, res) => {
//     res.json({ status: 'unknown url request' });
//   });

//   return app;
// };
// // </create>


import express from 'express';
import 'isomorphic-fetch';
import { sortJson, prettyJson } from './sortJson.js';
import { getGraphProfile } from './with-graph/graph.js';

export const create = async () => {
  const app = express();

  app.get('/debug', async (req, res) => {
    res.send(
      prettyJson(
        sortJson({
          route: 'debug',
          headers: sortJson(req.headers),
          env: sortJson(process.env),
        })
      )
    );
  });

  app.get('/get-profile', async (req, res) => {
    console.log('/get-profile requested');

    try {
      let profile = {
        displayName: 'John Doe',
        withAuthentication: false,
      };
      let profileFromGraph = false;

      const bearerToken = req.headers['authorization'] || req.headers['Authorization'];
      console.log(`backend server.js bearerToken ${bearerToken ? 'found' : 'not found'}`);

      if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid access token found' });
      }

      const accessToken = bearerToken.split(' ')[1];
      console.log(`backend server.js accessToken: ${accessToken ? 'found' : 'not found'}`);

      if (!accessToken || accessToken === 'undefined' || accessToken === 'null' || accessToken.length === 0) {
        return res.status(401).json({ error: 'Invalid access token' });
      }

      try {
        const graphProfile = await getGraphProfile(accessToken);
        profile = {
          displayName: graphProfile.displayName || 'Unknown User',
          email: graphProfile.mail || graphProfile.userPrincipalName,
          withAuthentication: true,
        };
        profileFromGraph = true;
      } catch (error) {
        console.error('Error fetching profile from Microsoft Graph:', error.message);
      }

      const dataToReturn = {
        route: '/profile success',
        profile: profileFromGraph ? { authentication: true, ...profile } : { ...profile },
        headers: req.headers,
        bearerToken,
        env: process.env,
        error: null,
      };

      console.log(`backend server.js profile: ${JSON.stringify(profile)}`);
      return res.status(200).json(dataToReturn);
    } catch (err) {
      console.log(`backend server.js err message: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('*', (_, res) => {
    res.json({ status: 'unknown url request' });
  });

  return app;
};
