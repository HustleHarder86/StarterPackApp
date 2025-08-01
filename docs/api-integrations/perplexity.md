# Perplexity AI Integration Guide

## Overview

Perplexity AI provides real-time web research and AI-powered analysis capabilities for property market research and insights in the StarterPackApp.

## Configuration

### Environment Variables
```bash
PERPLEXITY_API_KEY=pplx-your-api-key-here
```

### API Endpoint
```
Base URL: https://api.perplexity.ai
```

## Integration Architecture

**Location**: `railway-api/src/services/perplexityService.js`
**Usage**: Market research, property analysis, real-time data gathering

## Service Implementation

```javascript
const axios = require('axios');

class PerplexityService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    if (!this.apiKey || !this.apiKey.startsWith('pplx-')) {
      throw new Error('Perplexity API key not configured');
    }
  }

  async search(query, options = {}) {
    const {
      model = 'sonar',
      maxTokens = 2000,
      temperature = 0.1,
      systemPrompt = 'You are a helpful AI assistant that provides accurate, real-time information.'
    } = options;

    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: `${systemPrompt} Current date: ${new Date().toISOString()}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: maxTokens,
      temperature,
      top_p: 0.9,
      stream: false
    };

    const response = await axios.post(this.apiUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage || {},
      citations: response.data.citations || [],
      raw: response.data
    };
  }
}
```

## API Methods

### Chat Completions

#### Synchronous Requests
```javascript
POST /chat/completions

// Request Body
{
  "model": "sonar",
  "messages": [
    {
      "role": "system",
      "content": "You are a real estate market analyst."
    },
    {
      "role": "user", 
      "content": "What are current property values in Toronto downtown?"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 2000
}

// Response
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Based on current market data..."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  },
  "citations": [...]
}
```

#### Asynchronous Requests (for longer operations)
```javascript
// Initiate async request
POST /async/chat/completions
// Returns: { "request_id": "req_123" }

// Check status
GET /async/chat/completions/{request_id}
// Returns: status and results when complete
```

## Supported Models

### Sonar Models (Recommended)
- `sonar` - General purpose model with web access
- `sonar-pro` - Enhanced version with better reasoning

### Chat Models
- `llama-3-sonar-small` - Fast responses
- `llama-3-sonar-large` - More detailed analysis

## Common Use Cases

### Property Market Research
```javascript
const marketAnalysis = await perplexityService.search(
  `What are the current real estate trends and average property prices in ${city}, ${province}? Include recent sales data and market predictions for ${propertyType} properties.`,
  {
    model: 'sonar',
    temperature: 0.1,
    maxTokens: 1500
  }
);
```

### Rental Market Analysis
```javascript
const rentalAnalysis = await perplexityService.search(
  `What are current rental rates for ${bedrooms}-bedroom ${propertyType} in ${neighborhood}? Include average rent prices and vacancy rates.`,
  {
    model: 'sonar',
    temperature: 0.1,
    maxTokens: 1200
  }
);
```

### Neighborhood Analysis
```javascript
const neighborhoodData = await perplexityService.search(
  `Analyze ${neighborhood} in ${city}: demographics, amenities, schools, transportation, and future development plans that could affect property values.`,
  {
    model: 'sonar-pro',
    temperature: 0.2,
    maxTokens: 2000
  }
);
```

## OpenAI API Compatibility

Perplexity's Sonar API is fully compatible with OpenAI's Chat Completions API format:

```javascript
// Standard OpenAI-compatible parameters
{
  model: "sonar",              // Model selection
  messages: [...],             // Message array
  temperature: 0.1,            // Randomness control (0-2)
  max_tokens: 2000,            // Response length limit
  top_p: 0.9,                  // Nucleus sampling
  frequency_penalty: 0,        // Repetition penalty (-2.0 to 2.0)
  presence_penalty: 0,         // Topic diversity (-2.0 to 2.0)
  stream: false               // Streaming responses
}
```

## Enhanced Parameters

### Web Search Options
```javascript
{
  search_mode: "web",                    // Enable web search
  search_domain_filter: ["domain.com"], // Limit to specific domains
  search_recency_filter: "month",       // Filter by recency
  return_images: false,                 // Include images in response
  return_related_questions: true        // Get related questions
}
```

## Error Handling

```javascript
async search(query, options = {}) {
  try {
    const response = await axios.post(this.apiUrl, requestBody, config);
    return this.processResponse(response.data);
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Perplexity API request timed out');
    }
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          throw new Error('Invalid Perplexity API key');
        case 429:
          throw new Error('Perplexity API rate limit exceeded');
        case 500:
          throw new Error('Perplexity API server error');
        default:
          throw new Error(`Perplexity API error: ${error.response.data.error || 'Unknown error'}`);
      }
    }
    
    throw error;
  }
}
```

## Rate Limits & Usage Tiers

### Free Tier
- 20 requests per hour
- Basic models only

### Pro Tier
- 600 requests per hour
- Access to all models including Sonar Pro
- Higher rate limits for async operations

### Enterprise
- Custom rate limits
- Priority support
- Advanced features

## Cost Calculation

```javascript
calculateCost(usage) {
  const costs = {
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    costPer1kInput: 0.0025,   // $0.0025 per 1K input tokens
    costPer1kOutput: 0.01     // $0.01 per 1K output tokens
  };
  
  const inputCost = (costs.inputTokens / 1000) * costs.costPer1kInput;
  const outputCost = (costs.outputTokens / 1000) * costs.costPer1kOutput;
  
  return {
    inputCost: inputCost.toFixed(4),
    outputCost: outputCost.toFixed(4),
    totalCost: (inputCost + outputCost).toFixed(4)
  };
}
```

## Best Practices

### Query Optimization
1. **Be Specific**: Include location, property type, and timeframe
2. **Context Setting**: Use system prompts to set the AI's role
3. **Temperature Control**: Use low temperature (0.1-0.2) for factual queries
4. **Token Management**: Monitor token usage for cost control

### Caching Strategy
```javascript
// Cache responses for repeated queries
const cacheKey = `perplexity:${query}:${JSON.stringify(options)}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await perplexityService.search(query, options);
await cache.set(cacheKey, result, 3600); // Cache for 1 hour
return result;
```

### Error Recovery
```javascript
async searchWithRetry(query, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.search(query, options);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Integration Examples

### Property Analysis Pipeline
```javascript
async analyzeProperty(propertyData) {
  const { address, price, propertyType } = propertyData;
  
  // Market comparison
  const marketData = await perplexityService.search(
    `Compare property at ${address} priced at $${price} with similar ${propertyType} properties in the area. Include recent sales and current listings.`
  );
  
  // Neighborhood analysis
  const neighborhoodData = await perplexityService.search(
    `Analyze the neighborhood around ${address}: schools, amenities, transportation, crime rates, and future development plans.`
  );
  
  // Investment potential
  const investmentData = await perplexityService.search(
    `Evaluate investment potential for ${propertyType} at ${address}. Include rental potential, appreciation trends, and market outlook.`
  );
  
  return {
    marketAnalysis: marketData.content,
    neighborhoodAnalysis: neighborhoodData.content,
    investmentAnalysis: investmentData.content,
    totalCost: this.calculateTotalCost([marketData, neighborhoodData, investmentData])
  };
}
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Ensure key starts with `pplx-`
2. **Rate Limit Exceeded**: Implement exponential backoff
3. **Timeout Errors**: Increase timeout or use async endpoints
4. **Empty Responses**: Check query formatting and model availability

### Debug Mode
```javascript
// Enable debug logging
const logger = require('./logger.service');

logger.info('Perplexity search started', {
  query: query.substring(0, 100),
  model: options.model,
  maxTokens: options.maxTokens
});
```

## Links

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Model Cards](https://docs.perplexity.ai/guides/model-cards)
- [API Reference](https://docs.perplexity.ai/api-reference)
- [Usage Tiers](https://docs.perplexity.ai/guides/usage-tiers)