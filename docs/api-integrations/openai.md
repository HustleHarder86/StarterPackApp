# OpenAI Integration Guide

## Overview

OpenAI provides advanced AI capabilities as an alternative or supplement to Perplexity AI for property analysis and content generation in the StarterPackApp.

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### API Endpoint
```
Base URL: https://api.openai.com/v1
```

## Integration Architecture

**Usage**: Alternative AI provider for analysis tasks
**Models**: GPT-4, GPT-3.5-turbo for text generation and analysis
**Purpose**: Backup AI service, specialized analysis tasks

## SDK Integration

### Installation
```bash
npm install openai
```

### Basic Setup
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

## Core API Methods

### Chat Completions
```javascript
async function analyzeProperty(propertyData) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a real estate investment analyst specializing in Canadian property markets.'
      },
      {
        role: 'user',
        content: `Analyze this property investment opportunity: ${JSON.stringify(propertyData)}`
      }
    ],
    temperature: 0.1,
    max_tokens: 2000
  });

  return completion.choices[0].message.content;
}
```

### Streaming Responses
```javascript
async function streamAnalysis(query) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: query }],
    stream: true,
    max_tokens: 1500
  });

  let result = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    result += content;
    // Process streaming content in real-time
    process.stdout.write(content);
  }

  return result;
}
```

## Model Selection

### GPT-4 Models (Recommended)
```javascript
const models = {
  'gpt-4o': {
    description: 'Latest GPT-4 optimized model',
    context: 128000,
    cost: { input: 0.0025, output: 0.01 }, // per 1K tokens
    use_case: 'Complex analysis, high accuracy'
  },
  'gpt-4o-mini': {
    description: 'Smaller, faster GPT-4 model',
    context: 128000,
    cost: { input: 0.00015, output: 0.0006 },
    use_case: 'Quick analysis, cost-effective'
  },
  'gpt-4-turbo': {
    description: 'High-performance GPT-4',
    context: 128000,
    cost: { input: 0.01, output: 0.03 },
    use_case: 'Complex reasoning, detailed analysis'
  }
};
```

### GPT-3.5 Models (Cost-effective)
```javascript
const economicModels = {
  'gpt-3.5-turbo': {
    description: 'Fast, cost-effective model',
    context: 16385,
    cost: { input: 0.0005, output: 0.0015 },
    use_case: 'Basic analysis, high-volume tasks'
  }
};
```

## Use Cases

### Property Market Analysis
```javascript
async function generateMarketAnalysis(propertyData) {
  const prompt = `
    Analyze the investment potential for this Canadian property:
    
    Property Details:
    - Address: ${propertyData.address}
    - Price: $${propertyData.price}
    - Type: ${propertyData.propertyType}
    - Bedrooms: ${propertyData.bedrooms}
    - Bathrooms: ${propertyData.bathrooms}
    - Square Feet: ${propertyData.sqft}
    
    Please provide:
    1. Market comparison and price analysis
    2. Investment potential and ROI estimates
    3. Risk factors and considerations
    4. Neighborhood analysis
    5. Future outlook and recommendations
    
    Format as structured JSON with clear sections.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert Canadian real estate investment analyst. Provide accurate, data-driven analysis.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 2500,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Rental Analysis
```javascript
async function analyzeRentalPotential(propertyData, localMarketData) {
  const messages = [
    {
      role: 'system',
      content: 'You are a rental property investment specialist focusing on Canadian markets.'
    },
    {
      role: 'user',
      content: `
        Analyze rental potential for:
        Property: ${JSON.stringify(propertyData)}
        Local Market: ${JSON.stringify(localMarketData)}
        
        Calculate:
        - Expected monthly rent
        - Annual rental yield
        - Vacancy considerations
        - Property management costs
        - Cash flow projections
      `
    }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.2,
    max_tokens: 1800
  });

  return response.choices[0].message.content;
}
```

### STR (Short-Term Rental) Analysis
```javascript
async function analyzeSTRPotential(propertyData, airbnbComparables) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an Airbnb and short-term rental investment expert specializing in revenue optimization.'
      },
      {
        role: 'user',
        content: `
          Analyze STR potential using this data:
          
          Property: ${JSON.stringify(propertyData)}
          Comparable Airbnb Listings: ${JSON.stringify(airbnbComparables)}
          
          Provide analysis on:
          1. Optimal nightly rates by season
          2. Expected occupancy rates
          3. Annual revenue projections
          4. Operating costs and expenses
          5. Regulatory considerations
          6. Competition analysis
          7. ROI comparison vs long-term rental
        `
      }
    ],
    temperature: 0.1,
    max_tokens: 2200
  });

  return response.choices[0].message.content;
}
```

## Advanced Features

### Function Calling
```javascript
async function propertyAnalysisWithTools(propertyData) {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'calculate_mortgage',
        description: 'Calculate mortgage payments and amortization',
        parameters: {
          type: 'object',
          properties: {
            principal: { type: 'number', description: 'Loan amount' },
            rate: { type: 'number', description: 'Annual interest rate as decimal' },
            years: { type: 'number', description: 'Loan term in years' }
          },
          required: ['principal', 'rate', 'years']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_property_taxes',
        description: 'Estimate property taxes based on assessed value',
        parameters: {
          type: 'object',
          properties: {
            assessedValue: { type: 'number' },
            municipality: { type: 'string' }
          },
          required: ['assessedValue', 'municipality']
        }
      }
    }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `Analyze this property investment: ${JSON.stringify(propertyData)}`
      }
    ],
    tools,
    tool_choice: 'auto'
  });

  // Handle tool calls
  if (response.choices[0].message.tool_calls) {
    for (const toolCall of response.choices[0].message.tool_calls) {
      const { name, arguments: args } = toolCall.function;
      const result = await executeFunction(name, JSON.parse(args));
      console.log(`${name} result:`, result);
    }
  }

  return response.choices[0].message.content;
}
```

### Structured Output
```javascript
async function getStructuredAnalysis(propertyData) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a real estate analyst. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: `Analyze property: ${JSON.stringify(propertyData)}`
      }
    ],
    response_format: { 
      type: 'json_schema',
      json_schema: {
        name: 'property_analysis',
        schema: {
          type: 'object',
          properties: {
            marketValue: { type: 'number' },
            investmentGrade: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
            expectedROI: { type: 'number' },
            risks: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          },
          required: ['marketValue', 'investmentGrade', 'expectedROI']
        }
      }
    }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

## Error Handling

### Rate Limiting
```javascript
async function callOpenAIWithRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429) {
        // Rate limit hit
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Rate limited. Waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      
      if (error.status === 400) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Common Error Scenarios
```javascript
class OpenAIService {
  async generateAnalysis(prompt, options = {}) {
    try {
      const response = await openai.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        ...options
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your billing.');
      }
      
      if (error.code === 'model_not_found') {
        throw new Error(`Model ${options.model} not available. Using fallback.`);
      }
      
      if (error.code === 'context_length_exceeded') {
        throw new Error('Content too long. Please reduce input size.');
      }
      
      throw new Error(`OpenAI service unavailable: ${error.message}`);
    }
  }
}
```

## Cost Management

### Token Usage Tracking
```javascript
class CostTracker {
  calculateCost(usage, model) {
    const pricing = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    };
    
    const rates = pricing[model] || pricing['gpt-4o-mini'];
    const inputCost = (usage.prompt_tokens / 1000) * rates.input;
    const outputCost = (usage.completion_tokens / 1000) * rates.output;
    
    return {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      inputCost: inputCost.toFixed(4),
      outputCost: outputCost.toFixed(4),
      totalCost: (inputCost + outputCost).toFixed(4),
      model
    };
  }

  async trackUsage(userId, operation, usage, model) {
    const cost = this.calculateCost(usage, model);
    
    // Store in Firebase for monitoring
    await addDoc(collection(db, 'ai_usage'), {
      userId,
      operation,
      ...cost,
      timestamp: new Date()
    });
    
    return cost;
  }
}
```

### Budget Controls
```javascript
async function checkBudgetAndCall(userId, estimatedTokens, apiCall) {
  // Check user's monthly usage
  const monthlyUsage = await getUserMonthlyUsage(userId);
  const userTier = await getUserTier(userId);
  
  const limits = {
    free: 10000,    // 10K tokens/month
    starter: 100000, // 100K tokens/month
    pro: 1000000,   // 1M tokens/month
    enterprise: -1  // Unlimited
  };
  
  const limit = limits[userTier] || limits.free;
  
  if (limit > 0 && (monthlyUsage.totalTokens + estimatedTokens) > limit) {
    throw new Error(`Monthly token limit (${limit}) would be exceeded. Current usage: ${monthlyUsage.totalTokens}`);
  }
  
  return await apiCall();
}
```

## Integration Examples

### Fallback Service
```javascript
class AIAnalysisService {
  constructor() {
    this.perplexityService = new PerplexityService();
    this.openaiService = new OpenAIService();
  }

  async analyzeProperty(propertyData, options = {}) {
    // Try Perplexity first (better for real-time data)
    try {
      return await this.perplexityService.search(
        this.buildPropertyQuery(propertyData),
        { model: 'sonar', ...options }
      );
    } catch (error) {
      console.warn('Perplexity failed, falling back to OpenAI:', error.message);
      
      // Fallback to OpenAI
      return await this.openaiService.generateAnalysis(
        this.buildPropertyQuery(propertyData),
        { model: 'gpt-4o-mini', ...options }
      );
    }
  }

  buildPropertyQuery(propertyData) {
    return `Analyze this Canadian real estate investment:
      Address: ${propertyData.address}
      Price: $${propertyData.price}
      Type: ${propertyData.propertyType}
      Size: ${propertyData.bedrooms}br/${propertyData.bathrooms}ba
      
      Provide market analysis, investment potential, and recommendations.`;
  }
}
```

### Specialized Analysis
```javascript
async function generateInvestmentReport(propertyData, marketData) {
  const sections = {
    executive_summary: await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Create a concise executive summary for real estate investors.'
        },
        {
          role: 'user',
          content: `Summarize investment opportunity: ${JSON.stringify(propertyData)}`
        }
      ],
      max_tokens: 300
    }),
    
    financial_analysis: await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst specializing in real estate ROI calculations.'
        },
        {
          role: 'user',
          content: `Analyze financials: Property ${JSON.stringify(propertyData)}, Market ${JSON.stringify(marketData)}`
        }
      ],
      max_tokens: 800
    }),
    
    risk_assessment: await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Identify and assess investment risks for Canadian real estate.'
        },
        {
          role: 'user',
          content: `Risk analysis for: ${JSON.stringify(propertyData)}`
        }
      ],
      max_tokens: 500
    })
  };

  return {
    executiveSummary: sections.executive_summary.choices[0].message.content,
    financialAnalysis: sections.financial_analysis.choices[0].message.content,
    riskAssessment: sections.risk_assessment.choices[0].message.content,
    generatedAt: new Date().toISOString()
  };
}
```

## Best Practices

### Optimization Strategies
1. **Model Selection**: Use GPT-4o-mini for cost-effective analysis
2. **Context Management**: Keep prompts concise to reduce token usage
3. **Caching**: Cache similar analysis results
4. **Batch Processing**: Combine multiple requests when possible
5. **Error Handling**: Implement robust retry logic

### Security
1. **API Key Protection**: Never expose keys in client-side code
2. **Request Validation**: Validate all inputs before API calls
3. **Rate Limiting**: Implement user-level rate limiting
4. **Content Filtering**: Monitor for inappropriate content

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Check key format and permissions
2. **Rate Limits**: Implement exponential backoff
3. **Context Length**: Reduce prompt size or use larger context models
4. **Model Availability**: Handle model deprecation gracefully

### Debug Tools
```javascript
// Enable detailed logging
const debugOpenAI = async (prompt, options) => {
  console.log('OpenAI Request:', {
    model: options.model,
    promptLength: prompt.length,
    maxTokens: options.max_tokens,
    temperature: options.temperature
  });
  
  const start = Date.now();
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    ...options
  });
  
  console.log('OpenAI Response:', {
    duration: Date.now() - start,
    tokensUsed: response.usage,
    cost: calculateCost(response.usage, options.model)
  });
  
  return response;
};
```

## Links

- [OpenAI Platform](https://platform.openai.com/)
- [API Documentation](https://platform.openai.com/docs)
- [Node.js Library](https://github.com/openai/openai-node)
- [Model Pricing](https://openai.com/pricing)
- [Usage Dashboard](https://platform.openai.com/usage)