import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface SearchFilters {
  q?: string;
  deckName?: string;
  ownerName?: string;
  lengthMin?: string;
  lengthMax?: string;
  widthMin?: string;
  widthMax?: string;
  stitchType?: string;
  physicalCondition?: string;
  authorName?: string;
  granthaName?: string;
  languageName?: string;
  workedBy?: string;
  searchType?: 'deck' | 'grantha' | 'combined';
}

interface SearchResult {
  type: 'deck' | 'grantha';
  [key: string]: any;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
  filters: SearchFilters;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filters: SearchFilters = {
      q: searchParams.get('q') || undefined,
      deckName: searchParams.get('deckName') || undefined,
      ownerName: searchParams.get('ownerName') || undefined,
      lengthMin: searchParams.get('lengthMin') || undefined,
      lengthMax: searchParams.get('lengthMax') || undefined,
      widthMin: searchParams.get('widthMin') || undefined,
      widthMax: searchParams.get('widthMax') || undefined,
      stitchType: searchParams.get('stitchType') || undefined,
      physicalCondition: searchParams.get('physicalCondition') || undefined,
      authorName: searchParams.get('authorName') || undefined,
      granthaName: searchParams.get('granthaName') || undefined,
      languageName: searchParams.get('languageName') || undefined,
      workedBy: searchParams.get('workedBy') || undefined,
      searchType: (searchParams.get('searchType') as 'deck' | 'grantha' | 'combined') || 'combined',
    };

    const results = await performManualSearch(filters);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function performManualSearch(filters: SearchFilters): Promise<SearchResponse> {
  try {
    let results: SearchResult[] = [];

    // Build search conditions based on filters
    const searchType = filters.searchType || 'combined';

    if (searchType === 'deck' || searchType === 'combined') {
      const deckResults = await searchDecks(filters);
      results = results.concat(deckResults.map((deck: any) => ({
        type: 'deck' as const,
        ...deck
      })));
    }

    if (searchType === 'grantha' || searchType === 'combined') {
      const granthaResults = await searchGranthas(filters);
      results = results.concat(granthaResults.map((grantha: any) => ({
        type: 'grantha' as const,
        ...grantha
      })));
    }

    return {
      query: filters.q || '',
      results,
      count: results.length,
      filters
    };

  } catch (error) {
    console.error('Error in manual search:', error);
    throw error;
  }
}

async function searchDecks(filters: SearchFilters) {
  const whereConditions: any = {};
  const orConditions: any[] = [];

  // Main text search across multiple fields
  if (filters.q) {
    orConditions.push(
      { grantha_deck_name: { contains: filters.q, mode: 'insensitive' } },
      { grantha_owner_name: { contains: filters.q, mode: 'insensitive' } },
      { physical_condition: { contains: filters.q, mode: 'insensitive' } },
      { stitch_or_nonstitch: { contains: filters.q, mode: 'insensitive' } },
      {
        granthas: {
          some: {
            OR: [
              { grantha_name: { contains: filters.q, mode: 'insensitive' } },
              { author: { author_name: { contains: filters.q, mode: 'insensitive' } } },
              { language: { language_name: { contains: filters.q, mode: 'insensitive' } } }
            ]
          }
        }
      }
    );
  }

  // Specific field filters
  if (filters.deckName) {
    whereConditions.grantha_deck_name = { contains: filters.deckName, mode: 'insensitive' };
  }

  if (filters.ownerName) {
    whereConditions.grantha_owner_name = { contains: filters.ownerName, mode: 'insensitive' };
  }

  if (filters.physicalCondition) {
    whereConditions.physical_condition = { contains: filters.physicalCondition, mode: 'insensitive' };
  }

  if (filters.stitchType) {
    whereConditions.stitch_or_nonstitch = { contains: filters.stitchType, mode: 'insensitive' };
  }

  // Length filters
  if (filters.lengthMin || filters.lengthMax) {
    whereConditions.length_in_cms = {};
    if (filters.lengthMin) {
      whereConditions.length_in_cms.gte = parseFloat(filters.lengthMin);
    }
    if (filters.lengthMax) {
      whereConditions.length_in_cms.lte = parseFloat(filters.lengthMax);
    }
  }

  // Width filters
  if (filters.widthMin || filters.widthMax) {
    whereConditions.width_in_cms = {};
    if (filters.widthMin) {
      whereConditions.width_in_cms.gte = parseFloat(filters.widthMin);
    }
    if (filters.widthMax) {
      whereConditions.width_in_cms.lte = parseFloat(filters.widthMax);
    }
  }

  // Filters based on related grantha data
  if (filters.authorName || filters.granthaName || filters.languageName) {
    const granthaFilters: any = {};
    
    if (filters.authorName) {
      granthaFilters.author = { author_name: { contains: filters.authorName, mode: 'insensitive' } };
    }
    
    if (filters.granthaName) {
      granthaFilters.grantha_name = { contains: filters.granthaName, mode: 'insensitive' };
    }
    
    if (filters.languageName) {
      granthaFilters.language = { language_name: { contains: filters.languageName, mode: 'insensitive' } };
    }

    whereConditions.granthas = { some: granthaFilters };
  }

  // Worked by filter (through scanned images)
  if (filters.workedBy) {
    whereConditions.granthas = {
      some: {
        scannedImages: {
          some: {
            scanningProperties: {
              worked_by: { contains: filters.workedBy, mode: 'insensitive' }
            }
          }
        }
      }
    };
  }

  // Combine OR conditions with AND conditions
  if (orConditions.length > 0) {
    if (Object.keys(whereConditions).length > 0) {
      whereConditions.AND = [{ OR: orConditions }];
    } else {
      whereConditions.OR = orConditions;
    }
  }

  const deckQuery = {
    where: whereConditions,
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
      },
      user: {
        select: {
          user_name: true,
          email: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc' as const
    }
  };

  return await db.granthaDeck.findMany(deckQuery);
}

async function searchGranthas(filters: SearchFilters) {
  const whereConditions: any = {};
  const orConditions: any[] = [];

  // Main text search across multiple fields
  if (filters.q) {
    orConditions.push(
      { grantha_name: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
      { remarks: { contains: filters.q, mode: 'insensitive' } },
      { author: { author_name: { contains: filters.q, mode: 'insensitive' } } },
      { author: { scribe_name: { contains: filters.q, mode: 'insensitive' } } },
      { language: { language_name: { contains: filters.q, mode: 'insensitive' } } },
      { granthaDeck: { grantha_deck_name: { contains: filters.q, mode: 'insensitive' } } },
      { granthaDeck: { grantha_owner_name: { contains: filters.q, mode: 'insensitive' } } }
    );
  }

  // Specific field filters
  if (filters.granthaName) {
    whereConditions.grantha_name = { contains: filters.granthaName, mode: 'insensitive' };
  }

  if (filters.authorName) {
    whereConditions.author = { author_name: { contains: filters.authorName, mode: 'insensitive' } };
  }

  if (filters.languageName) {
    whereConditions.language = { language_name: { contains: filters.languageName, mode: 'insensitive' } };
  }

  // Deck-related filters
  if (filters.deckName || filters.ownerName || filters.physicalCondition || 
      filters.stitchType || filters.lengthMin || filters.lengthMax || 
      filters.widthMin || filters.widthMax) {
    
    const deckFilters: any = {};
    
    if (filters.deckName) {
      deckFilters.grantha_deck_name = { contains: filters.deckName, mode: 'insensitive' };
    }
    
    if (filters.ownerName) {
      deckFilters.grantha_owner_name = { contains: filters.ownerName, mode: 'insensitive' };
    }
    
    if (filters.physicalCondition) {
      deckFilters.physical_condition = { contains: filters.physicalCondition, mode: 'insensitive' };
    }
    
    if (filters.stitchType) {
      deckFilters.stitch_or_nonstitch = { contains: filters.stitchType, mode: 'insensitive' };
    }

    // Length filters for deck
    if (filters.lengthMin || filters.lengthMax) {
      deckFilters.length_in_cms = {};
      if (filters.lengthMin) {
        deckFilters.length_in_cms.gte = parseFloat(filters.lengthMin);
      }
      if (filters.lengthMax) {
        deckFilters.length_in_cms.lte = parseFloat(filters.lengthMax);
      }
    }

    // Width filters for deck
    if (filters.widthMin || filters.widthMax) {
      deckFilters.width_in_cms = {};
      if (filters.widthMin) {
        deckFilters.width_in_cms.gte = parseFloat(filters.widthMin);
      }
      if (filters.widthMax) {
        deckFilters.width_in_cms.lte = parseFloat(filters.widthMax);
      }
    }

    whereConditions.granthaDeck = deckFilters;
  }

  // Worked by filter (through scanned images)
  if (filters.workedBy) {
    whereConditions.scannedImages = {
      some: {
        scanningProperties: {
          worked_by: { contains: filters.workedBy, mode: 'insensitive' }
        }
      }
    };
  }

  // Combine OR conditions with AND conditions
  if (orConditions.length > 0) {
    if (Object.keys(whereConditions).length > 0) {
      whereConditions.AND = [{ OR: orConditions }];
    } else {
      whereConditions.OR = orConditions;
    }
  }

  const granthaQuery = {
    where: whereConditions,
    include: {
      author: true,
      language: true,
      granthaDeck: {
        include: {
          user: {
            select: {
              user_name: true,
              email: true
            }
          }
        }
      },
      scannedImages: {
        include: {
          scanningProperties: true
        }
      }
    },
    orderBy: {
      grantha_name: 'asc' as const
    }
  };

  return await db.grantha.findMany(granthaQuery);
}