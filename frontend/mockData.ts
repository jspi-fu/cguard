import { ContentItem, RiskType } from './types';

export const MOCK_DATA: ContentItem[] = [
  {
    id: '101',
    type: 'mixed',
    text: "Check out this new product! It's amazing and will change your life forever. Click the link in bio.",
    imageUrl: 'https://picsum.photos/600/400?random=1',
    aiPrediction: {
      riskTypes: [RiskType.SPAM],
      explanation: 'High repetition of promotional language and call to action patterns typical of spam.',
    },
  },
  {
    id: '102',
    type: 'text',
    text: "I absolutely hate people who drive slow in the fast lane. They are the worst kind of humans.",
    aiPrediction: {
      riskTypes: [RiskType.HARASSMENT],
      explanation: 'Contains aggressive language targeted at a specific group of people.',
    },
  },
  {
    id: '103',
    type: 'image',
    imageUrl: 'https://picsum.photos/600/800?random=2',
    aiPrediction: {
      riskTypes: [RiskType.NONE],
      explanation: 'No harmful elements detected in the image analysis.',
    },
  },
  {
    id: '104',
    type: 'mixed',
    text: "Look at this beautiful sunset I captured yesterday.",
    imageUrl: 'https://picsum.photos/800/600?random=3',
    aiPrediction: {
      riskTypes: [RiskType.NONE],
      explanation: 'Content appears to be a safe, personal status update.',
    },
  },
  {
    id: '105',
    type: 'text',
    text: "You should go kill yourself, nobody likes you anyway.",
    aiPrediction: {
      riskTypes: [RiskType.VIOLENCE],
      explanation: 'Direct threat of self-harm promotion and severe harassment.',
    },
  },
  {
    id: '106',
    type: 'image',
    imageUrl: 'https://picsum.photos/500/500?random=4',
    aiPrediction: {
      riskTypes: [RiskType.SEXUAL],
      explanation: 'Potential suggestive imagery detected, requires human review.',
    },
  },
  {
    id: '107',
    type: 'mixed',
    text: "Investment opportunity! 500% returns guaranteed in 2 days!",
    imageUrl: 'https://picsum.photos/600/300?random=5',
    aiPrediction: {
      riskTypes: [RiskType.SCAM],
      explanation: 'Unrealistic financial promises and guaranteed returns indicate a likely scam.',
    },
  },
  {
    id: '108',
    type: 'text',
    text: "The weather in London is quite rainy today.",
    aiPrediction: {
      riskTypes: [RiskType.NONE],
      explanation: 'Neutral statement about weather.',
    },
  },
  {
    id: '109',
    type: 'text',
    text: "I really dislike you, please go away.",
    originalText: "I fucking hate you, go kill yourself.",
    aiPrediction: {
      riskTypes: [RiskType.VIOLENCE],
      explanation: 'Original text contains severe toxic language and self-harm encouragement. Displaying sanitized version by default.',
    },
  }
];