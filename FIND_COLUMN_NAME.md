# Find the embeddings table column names

You mentioned the error says `column e.embeddings_cache_id does not exist`. 

Could you please run one of these commands to show me the exact column names:

## Option 1: Using psql
```bash
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'embeddings' ORDER BY ordinal_position;"
```

## Option 2: Using Node.js with your existing DB connection
Add this to a test file and run it:
```javascript
import { query } from './lib/db'

const result = await query(`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'embeddings' 
  ORDER BY ordinal_position
`)
console.log('Embeddings columns:', result)
```

## Common possibilities:
- `embedding_cache_id` (singular, what I tried)
- `embeddings_cache_id` (plural, original)
- `cache_id`
- `text_cache_id`
- `text_id`

Please let me know what the actual column name is and I'll fix it immediately!
