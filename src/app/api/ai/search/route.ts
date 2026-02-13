import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

// Type definitions
interface SearchStrategy {
  searchType: 'deck' | 'grantha' | 'combined';
  filters: Record<string, any>;
  includes: string[];
  searchFields: string[];
}




interface SearchResult {
  type: 'deck' | 'grantha';
  [key: string]: any;
}

interface SearchResponse {
  query: string;
  searchStrategy?: SearchStrategy;
  results: SearchResult[];
  count: number;
  fallback?: boolean;
  error?: string;
}

interface RequestBody {
  query: string;
}
function looksLikeId(query: string) {
  return /^[A-Z]+[A-Z0-9_:-]*\d+[A-Z0-9_:-]*$/i.test(query);
}


export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await request.json();
    const rawQuery = body.query;
    const query = normalizeQuery(rawQuery);


    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }


    const results = await searchManuscripts(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


function normalizeQuery(q: string) {
  return q
    .toLowerCase()
    .trim()
    .replace(/[.:;,_]/g, '')   // remove punctuation
    .replace(/[–—]/g, '-')     // normalize dashes
    .replace(/\s+/g, ' ')
}


async function searchManuscripts(userQuery: string): Promise<SearchResponse> {
  const deckNameMatch = await db.granthaDeck.findMany({
    where: {
      grantha_deck_name: {
        contains: userQuery.replace(':', '').trim(),
        mode: 'insensitive'
      }
    },
    include: {
      granthas: {
        include: {
          author: true,
          language: true,
          scannedImages: {
            include: { scanningProperties: true }
          }
        }
      }
    }
  });

  if (deckNameMatch.length > 0) {
    return {
      query: userQuery,
      results: deckNameMatch.map(deck => ({
        type: 'deck' as const,
        ...deck
      })),
      count: deckNameMatch.length
    };
  }

  // HARD SHORT-CIRCUIT FOR IDs
  if (looksLikeId(userQuery)) {

    const deck = await db.granthaDeck.findFirst({
      where: { grantha_deck_id: userQuery },
      include: {
        granthas: {
          include: {
            author: true,
            language: true,
            scannedImages: {
              include: { scanningProperties: true }
            }
          }
        }
      }
    });




    if (deck) {
      return {
        query: userQuery,
        results: [{ type: 'deck', ...deck }],
        count: 1
      };
    }

    const grantha = await db.grantha.findFirst({
      where: { grantha_id: userQuery },
      include: {
        author: true,
        language: true,
        granthaDeck: true,
        scannedImages: {
          include: { scanningProperties: true }
        }
      }
    });

    if (grantha) {
      return {
        query: userQuery,
        results: [{ type: 'grantha', ...grantha }],
        count: 1
      };
    }
  }

  // ⬇️ AI logic continues here


  try {
    const prompt = `
      You are a database query assistant for a palm leaf manuscript database using Prisma ORM. 
      The database has these models with relationships:

      GranthaDeck:
      - grantha_deck_id (String, primary key)
      - grantha_deck_name (String, deck name)
      - grantha_owner_name (String, owner name)
      - length_in_cms (Float, length in centimeters)
      - width_in_cms (Float, width in centimeters)
      - stitch_or_nonstitch (String, stitching type)
      - physical_condition (String, physical condition)
      - user (relation to UserAccount)
      - granthas (relation to Grantha[])

      Grantha:
      - grantha_id (String, primary key)
      - grantha_name (String, grantha name)
      - grantha_deck_id (String, foreign key)
      - language_id (String, foreign key)
      - author_id (String, foreign key)
      - description (String)
      - granthaDeck (relation to GranthaDeck)
      - language (relation to Language)
      - author (relation to Author)
      - scannedImages (relation to ScannedImage[])

      Language:
      - language_id (String, primary key)
      - language_name (String, language/script name)

      Author:
      - author_id (String, primary key)
      - author_name (String, author name)
      - scribe_name (String, scribe name)

      ScannedImage:
      - image_id (String, primary key)
      - worked_by (String, person who worked on scanning)
      - grantha_id (String, foreign key)
      - scanningProperties (relation to ScanningProperties)

      ScanningProperties:
      - worked_by (String, person who worked on it)

      User query: "${userQuery}"

      Generate a JSON object that represents the search strategy for this query. The JSON should include:
      1. "searchType": "deck" | "grantha" | "combined" - which model to primarily search
      2. "filters": object with field conditions for filtering
      3. "includes": array of relations to include in the query
      4. "searchFields": array of fields to search with contains/mode insensitive

      Examples:
      - "Find manuscripts by author Raghavan" -> {"searchType": "grantha", "filters": {"author": {"author_name": {"contains": "Raghavan", "mode": "insensitive"}}}, "includes": ["author", "granthaDeck"], "searchFields": ["author.author_name"]}
      - "Show large manuscripts" -> {"searchType": "deck", "filters": {"OR": [{"length_in_cms": {"gt": 50}}, {"width_in_cms": {"gt": 30}}]}, "includes": ["granthas"], "searchFields": []}
      - "Stitched manuscripts" -> {"searchType": "deck", "filters": {"stitch_or_nonstitch": {"contains": "stitch", "mode": "insensitive"}}, "includes": ["granthas"], "searchFields": ["stitch_or_nonstitch"]}
      - "Sanskrit manuscripts" -> {"searchType": "grantha", "filters": {"language": {"language_name": {"contains": "Sanskrit", "mode": "insensitive"}}}, "includes": ["language", "granthaDeck"], "searchFields": ["language.language_name"]}

      Return ONLY the JSON object, no explanations or markdown formatting.

      IMPORTANT RULES:
- If the user query looks like an ID (examples: TP_DEBU-0005, GRANTHA-001, TP:DEBU-0005):
  - Use exact equality (=), NOT contains
  - Map IDs to:
    - grantha_deck_id for decks
    - grantha_id for granthas
  - Do NOT split the ID
  - Do NOT remove special characters like '-', '_', ':'
Example:
"TP_DEBU-0005" ->
{
  "searchType": "deck",
  "filters": { "grantha_deck_id": "TP_DEBU-0005" },
  "includes": ["granthas"],
  "searchFields": []
}
  IMPORTANT:
- If the query contains words or looks like a title (example: Yoga-Wisdom),
  DO NOT treat it as an ID.
- Use "contains" search on names instead.


    `;

    let responseText = '';

    try {
      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            text: prompt
          }
        ]
      });
      responseText = result.text || '';
    } catch (e) {
      console.error('Error generating AI response:', e);
    }
    let aiResponse = responseText.trim();

    console.log('Raw Gemini Response:', aiResponse);

    // Clean up the response - remove markdown formatting if present
    aiResponse = aiResponse.replace(/```json\n?/gi, '').replace(/```\n?/gi, '');
    aiResponse = aiResponse.trim();

    let searchStrategy: SearchStrategy;

    try {
      searchStrategy = JSON.parse(aiResponse) as SearchStrategy;

      // 🔐 Safety: force exact match if AI messes up IDs
      if (typeof searchStrategy.filters?.grantha_deck_id === 'object') {
        searchStrategy.filters.grantha_deck_id = userQuery;
      }

      if (typeof searchStrategy.filters?.grantha_id === 'object') {
        searchStrategy.filters.grantha_id = userQuery;
      }

    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      throw new Error('Invalid AI response format');


    }


    console.log('Parsed Search Strategy:', JSON.stringify(searchStrategy, null, 2));

    // Execute the search based on the AI-generated strategy
    let results: SearchResult[] = [];

    if (searchStrategy.searchType === 'deck' || searchStrategy.searchType === 'combined') {
      const deckQuery: any = {
        where: searchStrategy.filters || {},
        include: {}
      };

      // Add includes
      if (searchStrategy.includes?.includes('granthas')) {
        deckQuery.include.granthas = {
          include: {
            author: true,
            language: true
          }
        };
      }
      if (searchStrategy.includes?.includes('user')) {
        deckQuery.include.user = true;
      }

      const deckResults = await db.granthaDeck.findMany(deckQuery);
      results = results.concat(deckResults.map((deck: any) => ({
        type: 'deck' as const,
        ...deck
      })));
    }

    if (searchStrategy.searchType === 'grantha' || searchStrategy.searchType === 'combined') {

      const normalizedQuery = normalizeQuery(userQuery)

      const granthaQuery: any = {
        where: {
          OR: [
            // 1️⃣ AI-generated filter (unchanged)
            searchStrategy.filters,

            // 2️⃣ Fallback: normalized name match
            {
              grantha_name: {
                contains: normalizedQuery,
                mode: 'insensitive'
              }
            },

            // 3️⃣ Extra fallback: handle "Yoga Wisdom" vs "Yoga-Wisdom:"
            {
              grantha_name: {
                contains: normalizedQuery.replace('-', ' '),
                mode: 'insensitive'
              }
            }
          ]
        },
        include: {}
      }

      // ✅ Preserve your includes exactly as before
      if (searchStrategy.includes?.includes('author')) {
        granthaQuery.include.author = true
      }
      if (searchStrategy.includes?.includes('language')) {
        granthaQuery.include.language = true
      }
      if (searchStrategy.includes?.includes('granthaDeck')) {
        granthaQuery.include.granthaDeck = true
      }
      if (searchStrategy.includes?.includes('scannedImages')) {
        granthaQuery.include.scannedImages = {
          include: { scanningProperties: true }
        }
      }

      const granthaResults = await db.grantha.findMany(granthaQuery)

      results = results.concat(
        granthaResults.map((grantha: any) => ({
          type: 'grantha' as const,
          ...grantha
        }))
      )
    }


    return {
      query: userQuery,
      searchStrategy: searchStrategy,
      results: results,
      count: results.length
    };

  } catch (error) {
    console.error('Error in AI search:', error);

    // Fallback to simple text search
    const fallbackResults = await db.granthaDeck.findMany({
      where: {
        OR: [
          { grantha_deck_name: { contains: userQuery, mode: 'insensitive' } },
          { grantha_owner_name: { contains: userQuery, mode: 'insensitive' } },
          { physical_condition: { contains: userQuery, mode: 'insensitive' } },
          { stitch_or_nonstitch: { contains: userQuery, mode: 'insensitive' } },
          {
            granthas: {
              some: {
                OR: [
                  { grantha_name: { contains: userQuery, mode: 'insensitive' } },
                  { author: { author_name: { contains: userQuery, mode: 'insensitive' } } },
                  { language: { language_name: { contains: userQuery, mode: 'insensitive' } } }
                ]
              }
            }
          }
        ]
      },
      include: {
        granthas: {
          include: {
            author: true,
            language: true,
            scannedImages: {
              include: {
                scanningProperties: true
              }
            }
          }
        }
      }
    });

    return {
      query: userQuery,
      results: fallbackResults.map((deck: any) => ({ type: 'deck' as const, ...deck })),
      count: fallbackResults.length,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}