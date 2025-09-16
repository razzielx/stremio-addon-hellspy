const { addonBuilder, serveHTTP } = require("./");
const fetch = require("node-fetch");
require("dotenv").config();

// OMDB API key - set in environment variable OMDB_API_KEY
const OMDB_API_KEY = process.env.OMDB_API_KEY;

async function getOmdbData(imdbId) {
  const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.Response === "False") {
    throw new Error("OMDB API error: " + data.Error);
  }
  return data;
}

function buildSearchQuery(title, season, episode) {
  // Clean title: remove special chars, lowercase
  let query = title
    .replace(/[^\w\s]/g, "")
    .toLowerCase()
    .trim();

  if (season && episode) {
    query += ` s${season}e${episode}`;
  }

  query += " cz";
  return encodeURIComponent(query);
}

async function searchHellspy(query) {
  await delay(1000); // Rate limit: 1 second between calls
  const url = `https://api.hellspy.to/gw/search?query=${query}&offset=0&limit=2`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
}

async function getVideoDetails(id, fileHash) {
  await delay(1000); // Rate limit: 1 second between calls
  const url = `https://api.hellspy.to/gw/video/${id}/${fileHash}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Rate limiting helper
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const builder = new addonBuilder({
  id: "org.hellspyaddon",
  version: "1.0.0",
  name: "Hellspy Addon",
  description: "Streams from hellspy.to",
  catalogs: [],
  resources: ["stream"],
  types: ["movie", "series"],
  idPrefixes: ["tt"],
});

builder.defineStreamHandler(async function (args) {
  console.log("Stream request:", args);

  // Parse IMDB ID
  let imdbId = args.id;
  let season = null;
  let episode = null;

  if (args.type === "series") {
    const parts = args.id.split(":");
    if (parts.length >= 3) {
      imdbId = parts[0];
      season = parseInt(parts[1]);
      episode = parseInt(parts[2]);
    }
  }

  try {
    const omdbData = await getOmdbData(imdbId);
    const title = omdbData.Title;
    const query = buildSearchQuery(title, season, episode);
    const items = await searchHellspy(query);

    const streams = [];
    for (const item of items.slice(0, 2)) {
      try {
        const details = await getVideoDetails(item.id, item.fileHash);
        if (details.conversions) {
          // Iterate through all available conversions
          for (const [quality, streamUrl] of Object.entries(details.conversions)) {
            const stream = {
              url: streamUrl,
              name: `Hellspy (${quality}p)`,
              description: `${item.title} \n🕒 ${Math.floor(item.duration / 60)}min, 💾 ${Math.floor(item.size / 1024 / 1024)}MB, 📷 ${quality}p`,
              behaviorHints: {
                videoSize: item.size,
                filename: details.filename,
              },
            };
            if (details.subtitles && details.subtitles.length > 0) {
              stream.subtitles = details.subtitles.map((sub) => ({
                url: sub.url,
                lang: sub.language,
              }));
            }
            streams.push(stream);
          }
        }
      } catch (detailError) {
        console.error("Error fetching details for item:", item.id, detailError);
      }
    }

    return { streams };
  } catch (error) {
    console.error("Error:", error);
    return { streams: [] };
  }
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
console.log(`Hellspy Addon running on port ${process.env.PORT || 7000}, OMDB_API_KEY=${OMDB_API_KEY ? "set" : "not set"}`);
