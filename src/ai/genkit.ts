
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// In a managed Google Cloud environment, Genkit will automatically
// use Application Default Credentials and discover the project ID and location.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
