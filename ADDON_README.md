# Hellspy Addon for Stremio

This addon searches hellspy.to for streams based on IMDB IDs.

## Setup

1. Get an OMDB API key from https://www.omdbapi.com/

2. Set the environment variable:

   ```bash
   export OMDB_API_KEY=your_api_key_here
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the addon:
   ```bash
   node addon.js
   ```

The addon will be available at http://localhost:7000/manifest.json

## How it works

- For movies: Decodes IMDB ID to title, searches hellspy for "title cz"
- For series: Decodes IMDB ID to title, searches for "title s{season}e{episode} cz"
- Returns first 2 matching streams with subtitles if available

## Installation in Stremio

Use the URL from step 4 in Stremio's addon installation.
