import {tool} from 'ai'
import {z} from 'zod'

import { Context } from 'hono'

export function getWeatherTools(ctx: Context) {
  return {
    getCurrentWeather: tool({
      description: 'Get weather update for the given location.',
      parameters: z.object({  location: z.string().describe('city name for location access') }),
      execute: async ({location}) => {
        // For now, we'll just return a mock response
        console.log(`Fetching weather for location: ${location}`);

        return "Its sunny here in the city of " + location + " with a temperature of 25°C.";
      }
    }),
    getWeatherForecast: tool({
      description: 'Get weather forecast for the specified number of days for the given location.',
      parameters: z.object({
        location: z.string().describe('city name for location access'),
        num_days: z.number().describe('number of days for the forecast (e.g., 5 for 5 days)')
      }),
      execute: async ({location, num_days}) => {
        // For now, we'll just return a mock response
        console.log(`Fetching weather forecast for ${num_days} days for location: ${location}`);

        if (num_days <= 0) {
          return "Please provide a positive number of days for the forecast.";
        }
        return `The weather forecast for the next ${num_days} days in ${location} is sunny with temperatures ranging from 20°C to 30°C.`;
      }
    }),
    getWeatherAlerts: tool({
      description: 'Get weather alerts for the given location.',
      parameters: z.object({  location: z.string().describe('city name for location access') }),
      execute: async ({location}) => {
        // For now, we'll just return a mock response
        console.log(`Fetching weather alerts for location: ${location}`);

        return "There are no weather alerts for " + location + " at this time.";
      }
    })
  }
}