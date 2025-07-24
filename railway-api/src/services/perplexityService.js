const axios = require('axios');
const config = require('../config');
const logger = require('./logger.service');

class PerplexityService {
  constructor() {
    this.apiKey = config.apis.perplexity.key;
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    if (!this.apiKey || !this.apiKey.startsWith('pplx-')) {
      throw new Error('Perplexity API key not configured');
    }
  }

  /**
   * Search using Perplexity AI
   * @param {string} query - The search query
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} The search response
   */
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

    try {
      const response = await axios.post(
        this.apiUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const content = response.data.choices[0].message.content;
      const usage = response.data.usage || {};
      const citations = response.data.citations || [];

      logger.info('Perplexity search completed', {
        queryLength: query.length,
        responseLength: content.length,
        tokens: usage.total_tokens || 0,
        citations: citations.length
      });

      return {
        content,
        usage,
        citations,
        raw: response.data
      };

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Calculate API usage cost
   */
  calculateCost(usage) {
    const costs = {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01
    };
    
    const inputCost = (costs.inputTokens / 1000) * costs.costPer1kInput;
    const outputCost = (costs.outputTokens / 1000) * costs.costPer1kOutput;
    
    return {
      inputTokens: costs.inputTokens,
      outputTokens: costs.outputTokens,
      totalTokens: costs.inputTokens + costs.outputTokens,
      inputCost: inputCost.toFixed(4),
      outputCost: outputCost.toFixed(4),
      totalCost: (inputCost + outputCost).toFixed(4),
      model: 'perplexity-sonar'
    };
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      logger.warn('Perplexity API timeout');
      throw new Error('Perplexity API request timed out');
    }
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 401) {
        throw new Error('Invalid Perplexity API key');
      } else if (status === 429) {
        throw new Error('Perplexity API rate limit exceeded');
      } else {
        throw new Error(`Perplexity API error: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    }
    
    throw error;
  }
}

module.exports = { PerplexityService };