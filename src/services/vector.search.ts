
import { Chunk } from '../database/models/chunk';
import { KnowledgeCategory } from '../types';
import { generateQueryEmbedding } from './embedding.service';



export const vectorSearch = async (
  query: string,
  category: KnowledgeCategory,
  limit: number = 20,
) => {
  try {
    console.log(`🔍 Performing vector search for category: ${category}`);

    const queryEmbedding = await generateQueryEmbedding(query);

   
    const results = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index', 
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100, 
          limit: limit,
          filter: {
            'metadata.category': category
          }
        }
      },
      {
        $project: {
          text: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]);

    console.log(`✅ Found ${results.length} relevant chunks`);

    // 3. Transform results
    return results.map(result => ({
      text: result.text,
      score: result.score,
      metadata: result.metadata
    }));

  } catch (error: any) {
    console.error('❌ Vector search error:', error);
    

    console.log('⚠️  Falling back to text search...');
    return await fallbackTextSearch(query, category, limit);
  }
};

const fallbackTextSearch = async (
  query: string,
  category: KnowledgeCategory,
  limit: number
)=> {
  try {
    const results = await Chunk.find({
      'metadata.category': category,
      text: { $regex: query, $options: 'i' }
    })
    .limit(limit)
    .lean();

    return results.map(result => ({
      text: result.text,
      score: 0.5, 
      metadata: result.metadata
    }));

  } catch (error: any) {
    console.error('❌ Fallback text search error:', error);
    return [];
  }
};